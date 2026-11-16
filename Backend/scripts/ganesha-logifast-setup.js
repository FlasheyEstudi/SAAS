#!/usr/bin/env node
/**
 * CONFIGURACIÓN DE GANESHA PARA LOGIFAST  (idempotente: se puede correr las veces que haga falta)
 *
 *   node scripts/ganesha-logifast-setup.js
 *
 * Deja listo lo que la integración necesita del lado del ERP:
 *
 *   1. La empresa de LogiFast (tenant) en moneda NIO.
 *   2. Un usuario robot `logifast-system@…` con membresía OWNER: la API de Ganesha no tiene
 *      API keys, se autentica con `POST /api/users/login` y un Bearer HMAC de 7 días.
 *   3. El plan de cuentas que usan los asientos (`src/lib/ganesha/asientos.ts` de LogiFast):
 *      los grupos padre y las cuentas hoja, que son las únicas que aceptan partidas.
 *   4. Los períodos contables del mes actual y el siguiente en `OPEN` (si están CLOSED, ninguna
 *      póliza entra).
 *
 * Al final imprime el bloque de variables de entorno que hay que pegar en el `.env` de LogiFast.
 *
 * Requiere `DATABASE_URL` apuntando a la base de Ganesha, igual que el backend. Ejemplo local:
 *   DATABASE_URL=file:/tmp/ganesha-dev.db node scripts/ganesha-logifast-setup.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const db = new PrismaClient();

const NOMBRE_EMPRESA = process.env.GANESHA_COMPANY_NAME || 'LogiFast S.A.';
const RUC_EMPRESA = process.env.GANESHA_COMPANY_TAXID || 'J0310000099999';
const EMAIL_ROBOT = (process.env.GANESHA_ROBOT_EMAIL || 'logifast-system@ganesha.local').toLowerCase();
const NOMBRE_ROBOT = 'LogiFast (sistema)';
/** Usuario humano inicial (para poder entrar al panel sin depender del SSO). Opcional. */
const EMAIL_ADMIN = (process.env.GANESHA_ADMIN_EMAIL || 'admin@logifast.ni').toLowerCase();
const NOMBRE_ADMIN = process.env.GANESHA_ADMIN_NAME || 'Administrador LogiFast';

/** Grupos y cuentas hoja del plan de LogiFast. El código es la clave: no cambiar sin tocar el código. */
const PLAN = [
  // ── grupos ────────────────────────────────────────────────────────────────
  { code: '1', name: 'ACTIVO', type: 'ASSET', grupo: true },
  { code: '1.1', name: 'ACTIVO CORRIENTE', type: 'ASSET', grupo: true },
  { code: '1.1.01', name: 'EFECTIVO Y BANCOS', type: 'ASSET', grupo: true },
  { code: '1.1.02', name: 'CUENTAS POR COBRAR', type: 'ASSET', grupo: true },
  { code: '2', name: 'PASIVO', type: 'LIABILITY', grupo: true },
  { code: '2.1', name: 'PASIVO CORRIENTE', type: 'LIABILITY', grupo: true },
  { code: '2.1.01', name: 'CUENTAS POR PAGAR', type: 'LIABILITY', grupo: true },
  { code: '2.1.02', name: 'IMPUESTOS POR PAGAR', type: 'LIABILITY', grupo: true },
  { code: '3', name: 'PATRIMONIO', type: 'EQUITY', grupo: true },
  { code: '3.1', name: 'CAPITAL', type: 'EQUITY', grupo: true },
  { code: '4', name: 'INGRESOS', type: 'INCOME', grupo: true },
  { code: '4.1', name: 'INGRESOS OPERATIVOS', type: 'INCOME', grupo: true },
  { code: '4.1.01', name: 'INGRESOS POR SERVICIOS', type: 'INCOME', grupo: true },
  { code: '4.1.02', name: 'INGRESOS POR SUSCRIPCIONES', type: 'INCOME', grupo: true },
  { code: '5', name: 'COSTOS Y GASTOS', type: 'EXPENSE', grupo: true },
  { code: '5.1', name: 'COSTOS OPERATIVOS', type: 'EXPENSE', grupo: true },
  { code: '5.1.01', name: 'COSTO DE REPARTO', type: 'EXPENSE', grupo: true },
  { code: '5.2', name: 'GASTOS OPERATIVOS', type: 'EXPENSE', grupo: true },
  { code: '5.2.01', name: 'PROMOCIONES Y DESCUENTOS', type: 'EXPENSE', grupo: true },

  // ── cuentas hoja (las que reciben partidas) ───────────────────────────────
  { code: '1.1.01.01', name: 'BANCOS NACIONALES (BAC / LAFISE)', type: 'ASSET' },
  { code: '1.1.01.03', name: 'EFECTIVO EN TRÁNSITO (REPARTIDORES)', type: 'ASSET' },
  { code: '1.1.02.01', name: 'CUENTAS POR COBRAR CLIENTES', type: 'ASSET' },
  { code: '1.1.02.03', name: 'CUENTAS POR COBRAR TIENDAS', type: 'ASSET' },
  { code: '2.1.01.02', name: 'FONDOS DE TIENDAS POR LIQUIDAR', type: 'LIABILITY' },
  { code: '2.1.02.01', name: 'IVA DÉBITO FISCAL (15%)', type: 'LIABILITY' },
  { code: '4.1.01.01', name: 'INGRESOS POR COMISIONES DE TIENDAS', type: 'INCOME' },
  { code: '4.1.01.02', name: 'INGRESOS POR SERVICIOS DE DELIVERY', type: 'INCOME' },
  { code: '4.1.02.01', name: 'INGRESOS POR PLANES Y SUSCRIPCIONES', type: 'INCOME' },
  { code: '5.1.01.01', name: 'COSTO POR HONORARIOS DE REPARTIDORES', type: 'EXPENSE' },
  { code: '5.2.01.01', name: 'GASTOS DE PROMOCIONES Y DESCUENTOS', type: 'EXPENSE' },
];

const NATURALEZA = {
  ASSET: 'DEBITOR',
  EXPENSE: 'DEBITOR',
  LIABILITY: 'ACREEDOR',
  EQUITY: 'ACREEDOR',
  INCOME: 'ACREEDOR',
};

const padre = (code) => {
  const partes = code.split('.');
  return partes.length === 1 ? null : partes.slice(0, -1).join('.');
};

async function principal() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Falta DATABASE_URL (la base de Ganesha). Ejemplo: DATABASE_URL=file:./prisma/dev.db');
    process.exit(1);
  }

  // 1. Empresa ────────────────────────────────────────────────────────────────
  let empresa = await db.company.findFirst({ where: { name: NOMBRE_EMPRESA } });
  if (!empresa) {
    empresa = await db.company.create({
      data: {
        name: NOMBRE_EMPRESA,
        taxId: RUC_EMPRESA,
        currency: 'NIO',
        email: 'administracion@logifast.ni',
        phone: '+505 2222-0000',
        address: 'Managua, Nicaragua',
      },
    });
    console.log(`✅ Empresa creada: ${empresa.name} (${empresa.id})`);
  } else {
    console.log(`↩️  Empresa ya existía: ${empresa.name} (${empresa.id})`);
  }

  // 2. Usuario robot con membresía OWNER ──────────────────────────────────────
  const password = process.env.GANESHA_ROBOT_PASSWORD || crypto.randomBytes(18).toString('base64url');
  const hash = await bcrypt.hash(password, 10);

  let robot = await db.user.findUnique({ where: { email: EMAIL_ROBOT } });
  if (robot) {
    robot = await db.user.update({
      where: { id: robot.id },
      data: { passwordHash: hash, companyId: empresa.id, role: 'ADMIN', isActive: true },
    });
    console.log(`↩️  Usuario robot actualizado: ${robot.email} (contraseña rotada)`);
  } else {
    robot = await db.user.create({
      data: {
        email: EMAIL_ROBOT,
        name: NOMBRE_ROBOT,
        passwordHash: hash,
        companyId: empresa.id,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`✅ Usuario robot creado: ${robot.email}`);
  }

  await db.userCompany.upsert({
    where: { userId_companyId: { userId: robot.id, companyId: empresa.id } },
    create: { userId: robot.id, companyId: empresa.id, role: 'OWNER' },
    update: { role: 'OWNER' },
  });

  // 2-bis. Usuario humano administrador (contraseña propia; el robot es solo para la API)
  const passwordAdmin = process.env.GANESHA_ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  const hashAdmin = await bcrypt.hash(passwordAdmin, 10);
  const adminExistente = await db.user.findUnique({ where: { email: EMAIL_ADMIN } });
  let admin;
  if (adminExistente) {
    admin = await db.user.update({
      where: { id: adminExistente.id },
      data: { passwordHash: hashAdmin, companyId: empresa.id, role: 'ADMIN', isActive: true },
    });
    console.log(`↩️  Administrador actualizado: ${admin.email} (contraseña rotada)`);
  } else {
    admin = await db.user.create({
      data: {
        email: EMAIL_ADMIN,
        name: NOMBRE_ADMIN,
        passwordHash: hashAdmin,
        companyId: empresa.id,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`✅ Administrador creado: ${admin.email}`);
  }
  await db.userCompany.upsert({
    where: { userId_companyId: { userId: admin.id, companyId: empresa.id } },
    create: { userId: admin.id, companyId: empresa.id, role: 'OWNER' },
    update: { role: 'OWNER' },
  });

  // 3. Plan de cuentas ───────────────────────────────────────────────────────
  // Se crean primero los grupos y luego las hojas: una cuenta hoja necesita el id de su padre.
  const idsPorCodigo = new Map();
  let creadas = 0;
  let existentes = 0;

  const ordenadas = [...PLAN].sort((a, b) => a.code.split('.').length - b.code.split('.').length);
  for (const cuenta of ordenadas) {
    const codigoPadre = padre(cuenta.code);
    const parentId = codigoPadre ? idsPorCodigo.get(codigoPadre) ?? null : null;
    if (codigoPadre && !parentId) {
      throw new Error(`Falta el grupo padre ${codigoPadre} de la cuenta ${cuenta.code}`);
    }
    const level = cuenta.code.split('.').length;
    const datos = {
      name: cuenta.name,
      parentId,
      accountType: cuenta.type,
      nature: NATURALEZA[cuenta.type],
      level,
      isGroup: Boolean(cuenta.grupo),
      isActive: true,
    };

    const actual = await db.account.findFirst({
      where: { companyId: empresa.id, code: cuenta.code },
      select: { id: true },
    });
    if (actual) {
      await db.account.update({ where: { id: actual.id }, data: datos });
      idsPorCodigo.set(cuenta.code, actual.id);
      existentes++;
    } else {
      const nueva = await db.account.create({
        data: { companyId: empresa.id, code: cuenta.code, ...datos },
      });
      idsPorCodigo.set(cuenta.code, nueva.id);
      creadas++;
    }
  }
  console.log(`✅ Plan de cuentas: ${creadas} creada(s), ${existentes} actualizada(s)`);

  // 4. Períodos abiertos (mes actual y siguiente) ─────────────────────────────
  const hoy = new Date();
  for (const delta of [0, 1]) {
    const fecha = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + delta, 1));
    const year = fecha.getUTCFullYear();
    const month = fecha.getUTCMonth() + 1;
    const periodo = await db.accountingPeriod.upsert({
      where: { companyId_year_month: { companyId: empresa.id, year, month } },
      create: { companyId: empresa.id, year, month, status: 'OPEN' },
      update: {}, // si ya existe NO se toca: cerrarlo es decisión del contador
    });
    console.log(`✅ Período ${year}-${String(month).padStart(2, '0')} ${periodo.status}`);
  }

  // 5. Lo que hay que pegar en el .env de LogiFast ────────────────────────────
  console.log('\n──────────────────────────────────────────────────────────────');
  console.log('Pegá esto en el .env de LogiFast (y reiniciá el backend):');
  console.log('──────────────────────────────────────────────────────────────');
  console.log(`GANESHA_API_URL=http://localhost:3001`);
  console.log(`GANESHA_EMAIL=${EMAIL_ROBOT}`);
  console.log(`GANESHA_PASSWORD=${password}`);
  console.log(`GANESHA_COMPANY_ID=${empresa.id}`);
  console.log('──────────────────────────────────────────────────────────────');
  console.log('Para entrar al panel de Ganesha (usuario humano):');
  console.log(`   email:    ${EMAIL_ADMIN}`);
  console.log(`   password: ${passwordAdmin}`);
  console.log('──────────────────────────────────────────────────────────────');
  console.log('Las contraseñas se muestran UNA sola vez (se guardan hasheadas).');
}

principal()
  .catch((err) => {
    console.error('❌ Error en la configuración:', err?.message || err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
