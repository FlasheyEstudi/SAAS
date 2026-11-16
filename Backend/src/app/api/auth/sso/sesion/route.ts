import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import { emitirTokenGanesha, secretoSso, verificarTicket } from '@/lib/sso-ticket';

export const dynamic = 'force-dynamic';

const ROLES_MEMBRESIA = ['OWNER', 'ADMIN', 'ACCOUNTANT', 'VIEWER'] as const;
const ROLES_GLOBALES = ['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER'] as const;

/**
 * POST /api/auth/sso/sesion — entrar a Ganesha con la sesión de LogiFast.
 *
 * No crea un sistema de cuentas paralelo: el usuario se identifica con el **mismo correo** que ya
 * usa en LogiFast. Si es la primera vez, aquí se crea su usuario en Ganesha **sin contraseña
 * usable** (hash de un valor aleatorio que nadie conoce) y sus membresías; si ya existe, solo se
 * actualizan. Después se devuelve el token normal de Ganesha, así que el resto de la app no cambia.
 *
 * Seguridad:
 *   - El ticket viene firmado con `LOGIFAST_SSO_SECRET` (HMAC-SHA256, 120 s). Sin el secreto no
 *     se puede fabricar uno, y uno viejo no sirve.
 *   - El cliente **no puede pedir identidades**: el correo, el rol y las empresas viajan en el
 *     ticket firmado por LogiFast, no en el cuerpo de esta petición.
 *   - Solo acepta `tipo: 'admin'` (administración de LogiFast). Las tiendas se habilitan cuando
 *     exista el cobro del plan, con la misma mecánica.
 */
export async function POST(request: NextRequest) {
  try {
    const cuerpo = await request.json().catch(() => ({}));
    const ticket = typeof cuerpo?.ticket === 'string' ? cuerpo.ticket : '';

    const datos = verificarTicket(ticket);
    if (!datos) {
      return error('Ticket de acceso inválido o vencido. Abre Ganesha de nuevo desde LogiFast.', 401);
    }
    if (datos.tipo !== 'admin') {
      return error('Este acceso está habilitado solo para la administración de LogiFast.', 403);
    }

    const email = datos.email.toLowerCase().trim();
    const rolGlobal = (ROLES_GLOBALES as readonly string[]).includes(datos.rol) ? datos.rol : 'VIEWER';

    // Empresas válidas (existen en Ganesha) con su rol dentro de cada una
    const empresas = [];
    for (const e of datos.empresas) {
      const company = await db.company.findUnique({ where: { id: e.companyId }, select: { id: true } });
      if (!company) continue;
      const rol = (ROLES_MEMBRESIA as readonly string[]).includes(e.role) ? e.role : 'VIEWER';
      empresas.push({ companyId: company.id, role: rol as (typeof ROLES_MEMBRESIA)[number] });
    }
    if (empresas.length === 0) {
      return error('La cuenta de LogiFast no está asociada a ninguna empresa de Ganesha.', 403);
    }

    /* Alta o actualización del usuario. `passwordHash` es el hash de un valor aleatorio: la cuenta
       no se puede usar con contraseña, solo entrando desde LogiFast (o si el admin define una). */
    const existente = await db.user.findUnique({ where: { email } });
    const ahora = new Date();
    let usuario = existente;

    if (!usuario) {
      usuario = await db.user.create({
        data: {
          email,
          name: datos.name?.trim() || email,
          passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
          companyId: empresas[0].companyId,
          role: rolGlobal as any,
          isActive: true,
          lastLoginAt: ahora,
        },
      });
    } else {
      usuario = await db.user.update({
        where: { id: usuario.id },
        data: {
          name: datos.name?.trim() || usuario.name,
          role: rolGlobal as any,
          companyId: usuario.companyId ?? empresas[0].companyId,
          isActive: true,
          lastLoginAt: ahora,
        },
      });
    }

    for (const e of empresas) {
      await db.userCompany.upsert({
        where: { userId_companyId: { userId: usuario.id, companyId: e.companyId } },
        create: { userId: usuario.id, companyId: e.companyId, role: e.role },
        update: { role: e.role },
      });
    }

    const membresias = await db.userCompany.findMany({
      where: { userId: usuario.id },
      include: { company: { select: { id: true, name: true } } },
    });

    // Rastro de auditoría: quién entró y desde dónde (útil el día que se venda a las tiendas).
    await db.auditLog
      .create({
        data: {
          companyId: usuario.companyId ?? empresas[0].companyId,
          userId: usuario.id,
          action: 'CREATE',
          entityType: 'SesionLogiFast',
          entityId: usuario.id,
          entityLabel: 'Acceso SSO desde LogiFast',
          newValues: { tipo: datos.tipo, plan: datos.plan ?? null, nonce: datos.nonce ?? null } as any,
        },
      })
      .catch(() => null);

    const token = emitirTokenGanesha(usuario.id);

    return success({
      token,
      user: {
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
        companyId: usuario.companyId,
        availableCompanies: membresias.map((m) => ({
          id: m.companyId,
          name: m.company.name,
          role: m.role,
        })),
        lastLoginAt: usuario.lastLoginAt,
      },
    });
  } catch (err) {
    console.error('[POST /api/auth/sso/sesion]', err);
    return serverError('No se pudo iniciar la sesión desde LogiFast');
  }
}

/**
 * GET /api/auth/sso/sesion?json=1 — utilidad de diagnóstico.
 * Devuelve si el SSO está configurado, **sin** exponer el secreto ni aceptar tickets.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const json = url.searchParams.get('json') === '1';
  if (!json) return NextResponse.redirect(new URL('/', process.env.FRONTEND_URL || 'http://localhost:3000'));

  return NextResponse.json({
    success: true,
    data: {
      configurado: Boolean(secretoSso()),
      frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
    },
  });
}
