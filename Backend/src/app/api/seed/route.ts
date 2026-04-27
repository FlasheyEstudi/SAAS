import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-helpers';
import bcrypt from 'bcryptjs';

// ============================================================
// SEED ROUTE: Populates the database with realistic Nicaraguan
// accounting data for "Grupo Empresarial Alpha S.A."
// POST /api/seed
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const result = await db.$transaction(async (tx) => {
      // --------------------------------------------------------
      // 0. DELETE ALL EXISTING DATA (reverse FK dependency order)
      // New entities first, then existing ones
      // --------------------------------------------------------
      await tx.fileAttachment.deleteMany();
      await tx.notification.deleteMany();
      await tx.budget.deleteMany();
      await tx.depreciationEntry.deleteMany();
      await tx.fixedAsset.deleteMany();
      await tx.exchangeRate.deleteMany();
      await tx.auditLog.deleteMany();
      await tx.user.deleteMany();
      await tx.bankMovement.deleteMany();
      await tx.invoice.deleteMany();
      await tx.journalEntry.deleteMany(); // cascades to JournalEntryLine
      await tx.bankAccount.deleteMany();
      await tx.thirdParty.deleteMany();
      await tx.costCenter.deleteMany();
      await tx.account.deleteMany();
      await tx.accountingPeriod.deleteMany();
      await tx.company.deleteMany();

      // --------------------------------------------------------
      // 1. COMPANY
      // --------------------------------------------------------
      const company = await tx.company.create({
        data: {
          name: 'Grupo Alpha S.A.',
          taxId: 'J0310000000001', // Example RUC format

          currency: 'NIO',
          address: 'Pista Jean Paul Genie, Edificio Invent, Piso 5, Managua, Nicaragua',
          phone: '+505 2270 1234',
          email: 'contacto@alpha.com.ni',
        },
      });
      const companyId = company.id;

      // --------------------------------------------------------
      // 2. ACCOUNTING PERIODS (Jan-Jun 2026)
      // --------------------------------------------------------
      const periodStatuses = ['CLOSED', 'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED', 'OPEN'];
      const months = [1, 2, 3, 4, 5, 6];
      const periods: { id: string; year: number; month: number }[] = [];

      for (let i = 0; i < 6; i++) {
        const p = await tx.accountingPeriod.create({
          data: {
            companyId,
            year: 2026,
            month: months[i],
            status: periodStatuses[i],
            closedAt: periodStatuses[i] !== 'OPEN' ? new Date(2026, months[i], 28, 18, 0, 0) : null,
          },
        });
        periods.push({ id: p.id, year: p.year, month: p.month });
      }

      // --------------------------------------------------------
      // 3. CHART OF ACCOUNTS (Plan Contable - Mexican PCGE)
      // Create level by level to satisfy FK constraints
      // --------------------------------------------------------

      // Helper: build account create data
      type AccountDef = {
        code: string;
        name: string;
        accountType: string;
        nature: string;
        level: number;
        isGroup: boolean;
        parentCode: string | null;
        description?: string;
      };

      const accountDefs: AccountDef[] = [
        // === ACTIVO (1) ===
        // Level 1
        { code: '1', name: 'Activo', accountType: 'ASSET', nature: 'DEBITOR', level: 1, isGroup: true, parentCode: null },
        // Level 2
        { code: '1.1', name: 'Activo Corriente', accountType: 'ASSET', nature: 'DEBITOR', level: 2, isGroup: true, parentCode: '1' },
        { code: '1.2', name: 'Activo No Corriente', accountType: 'ASSET', nature: 'DEBITOR', level: 2, isGroup: true, parentCode: '1' },
        // Level 3
        { code: '1.1.01', name: 'Efectivo y Equivalentes', accountType: 'ASSET', nature: 'DEBITOR', level: 3, isGroup: true, parentCode: '1.1' },
        { code: '1.1.02', name: 'Cuentas por Cobrar', accountType: 'ASSET', nature: 'DEBITOR', level: 3, isGroup: true, parentCode: '1.1' },
        { code: '1.1.03', name: 'Inventarios', accountType: 'ASSET', nature: 'DEBITOR', level: 3, isGroup: true, parentCode: '1.1' },
        { code: '1.2.01', name: 'Propiedades, Planta y Equipo', accountType: 'ASSET', nature: 'DEBITOR', level: 3, isGroup: true, parentCode: '1.2' },
        { code: '1.2.02', name: 'Depreciación Acumulada', accountType: 'ASSET', nature: 'ACREEDOR', level: 3, isGroup: true, parentCode: '1.2', description: 'CONTRA-ACCOUNT' },
        // Level 4 (leaf accounts)
        { code: '1.1.01.001', name: 'Caja General', accountType: 'ASSET', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '1.1.01' },
        { code: '1.1.01.002', name: 'Banco BAC', accountType: 'ASSET', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '1.1.01' },
        { code: '1.1.01.003', name: 'Banco LAFISE', accountType: 'ASSET', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '1.1.01' },
        { code: '1.1.02.001', name: 'Clientes Nacionales', accountType: 'ASSET', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '1.1.02' },
        { code: '1.1.02.002', name: 'Clientes Internacionales', accountType: 'ASSET', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '1.1.02' },
        { code: '1.1.02.003', name: 'Anticipo a Proveedores', accountType: 'ASSET', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '1.1.02' },
        { code: '1.1.03.001', name: 'Inventario de Mercancías', accountType: 'ASSET', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '1.1.03' },
        { code: '1.1.03.002', name: 'Materia Prima', accountType: 'ASSET', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '1.1.03' },
        { code: '1.2.01.001', name: 'Edificios', accountType: 'ASSET', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '1.2.01' },
        { code: '1.2.01.002', name: 'Mobiliario y Equipo', accountType: 'ASSET', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '1.2.01' },
        { code: '1.2.01.003', name: 'Equipo de Cómputo', accountType: 'ASSET', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '1.2.01' },
        { code: '1.2.01.004', name: 'Vehículos', accountType: 'ASSET', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '1.2.01' },
        { code: '1.2.02.001', name: 'Dep. Edificios', accountType: 'ASSET', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '1.2.02', description: 'CONTRA-ACCOUNT' },
        { code: '1.2.02.002', name: 'Dep. Mobiliario y Equipo', accountType: 'ASSET', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '1.2.02', description: 'CONTRA-ACCOUNT' },

        // === PASIVO (2) ===
        { code: '2', name: 'Pasivo', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 1, isGroup: true, parentCode: null },
        { code: '2.1', name: 'Pasivo Corriente', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 2, isGroup: true, parentCode: '2' },
        { code: '2.2', name: 'Pasivo No Corriente', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 2, isGroup: true, parentCode: '2' },
        { code: '2.1.01', name: 'Proveedores', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 3, isGroup: true, parentCode: '2.1' },
        { code: '2.1.02', name: 'Impuestos por Pagar', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 3, isGroup: true, parentCode: '2.1' },
        { code: '2.1.03', name: 'Cuentas por Pagar', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 3, isGroup: true, parentCode: '2.1' },
        { code: '2.2.01', name: 'Préstamos a Largo Plazo', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 3, isGroup: true, parentCode: '2.2' },
        { code: '2.1.01.001', name: 'Proveedores Nacionales', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '2.1.01' },
        { code: '2.1.01.002', name: 'Proveedores Internacionales', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '2.1.01' },
        { code: '2.1.02.001', name: 'IVA por Pagar', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '2.1.02' },
        { code: '2.1.02.002', name: 'ISR por Pagar', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '2.1.02' },
        { code: '2.1.03.001', name: 'Acreedores Diversos', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '2.1.03' },
        { code: '2.1.03.002', name: 'Sueldos por Pagar', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '2.1.03' },
        { code: '2.2.01.001', name: 'Préstamo Bancario', accountType: 'LIABILITY', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '2.2.01' },

        // === PATRIMONIO (3) ===
        { code: '3', name: 'Patrimonio', accountType: 'EQUITY', nature: 'ACREEDOR', level: 1, isGroup: true, parentCode: null },
        { code: '3.1', name: 'Capital', accountType: 'EQUITY', nature: 'ACREEDOR', level: 2, isGroup: true, parentCode: '3' },
        { code: '3.2', name: 'Resultados', accountType: 'EQUITY', nature: 'ACREEDOR', level: 2, isGroup: true, parentCode: '3' },
        { code: '3.1.01', name: 'Capital Social', accountType: 'EQUITY', nature: 'ACREEDOR', level: 3, isGroup: true, parentCode: '3.1' },
        { code: '3.2.01', name: 'Resultado del Ejercicio', accountType: 'EQUITY', nature: 'ACREEDOR', level: 3, isGroup: true, parentCode: '3.2' },
        { code: '3.2.02', name: 'Resultados de Ejercicios Anteriores', accountType: 'EQUITY', nature: 'ACREEDOR', level: 3, isGroup: true, parentCode: '3.2' },
        { code: '3.1.01.001', name: 'Capital Social Autorizado', accountType: 'EQUITY', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '3.1.01' },
        { code: '3.2.01.001', name: 'Utilidad Neta del Ejercicio', accountType: 'EQUITY', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '3.2.01' },
        { code: '3.2.02.001', name: 'REA Acumulados', accountType: 'EQUITY', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '3.2.02' },

        // === INGRESO (4) ===
        { code: '4', name: 'Ingreso', accountType: 'INCOME', nature: 'ACREEDOR', level: 1, isGroup: true, parentCode: null },
        { code: '4.1', name: 'Ingresos Operacionales', accountType: 'INCOME', nature: 'ACREEDOR', level: 2, isGroup: true, parentCode: '4' },
        { code: '4.2', name: 'Ingresos No Operacionales', accountType: 'INCOME', nature: 'ACREEDOR', level: 2, isGroup: true, parentCode: '4' },
        { code: '4.1.01', name: 'Ventas', accountType: 'INCOME', nature: 'ACREEDOR', level: 3, isGroup: true, parentCode: '4.1' },
        { code: '4.1.02', name: 'Ingresos por Servicios', accountType: 'INCOME', nature: 'ACREEDOR', level: 3, isGroup: true, parentCode: '4.1' },
        { code: '4.2.01', name: 'Otros Ingresos', accountType: 'INCOME', nature: 'ACREEDOR', level: 3, isGroup: true, parentCode: '4.2' },
        { code: '4.1.01.001', name: 'Ventas de Contado', accountType: 'INCOME', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '4.1.01' },
        { code: '4.1.01.002', name: 'Ventas de Crédito', accountType: 'INCOME', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '4.1.01' },
        { code: '4.1.02.001', name: 'Servicios de Consultoría', accountType: 'INCOME', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '4.1.02' },
        { code: '4.2.01.001', name: 'Intereses Ganados', accountType: 'INCOME', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '4.2.01' },
        { code: '4.2.01.002', name: 'Ganancia por Cambio Monetario', accountType: 'INCOME', nature: 'ACREEDOR', level: 4, isGroup: false, parentCode: '4.2.01' },

        // === GASTO (5) ===
        { code: '5', name: 'Gasto', accountType: 'EXPENSE', nature: 'DEBITOR', level: 1, isGroup: true, parentCode: null },
        { code: '5.1', name: 'Gastos Operacionales', accountType: 'EXPENSE', nature: 'DEBITOR', level: 2, isGroup: true, parentCode: '5' },
        { code: '5.2', name: 'Gastos No Operacionales', accountType: 'EXPENSE', nature: 'DEBITOR', level: 2, isGroup: true, parentCode: '5' },
        { code: '5.3', name: 'Depreciación', accountType: 'EXPENSE', nature: 'DEBITOR', level: 2, isGroup: true, parentCode: '5' },
        { code: '5.1.01', name: 'Costo de Ventas', accountType: 'EXPENSE', nature: 'DEBITOR', level: 3, isGroup: true, parentCode: '5.1' },
        { code: '5.1.02', name: 'Gastos de Administración', accountType: 'EXPENSE', nature: 'DEBITOR', level: 3, isGroup: true, parentCode: '5.1' },
        { code: '5.1.03', name: 'Gastos de Ventas', accountType: 'EXPENSE', nature: 'DEBITOR', level: 3, isGroup: true, parentCode: '5.1' },
        { code: '5.2.01', name: 'Otros Gastos', accountType: 'EXPENSE', nature: 'DEBITOR', level: 3, isGroup: true, parentCode: '5.2' },
        { code: '5.2.02', name: 'Impuestos', accountType: 'EXPENSE', nature: 'DEBITOR', level: 3, isGroup: true, parentCode: '5.2' },
        { code: '5.3.01', name: 'Depreciación de Activos', accountType: 'EXPENSE', nature: 'DEBITOR', level: 3, isGroup: true, parentCode: '5.3' },
        // Level 4 (leaf)
        { code: '5.1.01.001', name: 'Compras de Mercancías', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.1.01' },
        { code: '5.1.01.002', name: 'Costo de Ventas Directo', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.1.01' },
        { code: '5.1.02.001', name: 'Sueldos y Salarios', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.1.02' },
        { code: '5.1.02.002', name: 'Servicios Profesionales', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.1.02' },
        { code: '5.1.02.003', name: 'Renta de Oficina', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.1.02' },
        { code: '5.1.02.004', name: 'Servicios de Luz', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.1.02' },
        { code: '5.1.02.005', name: 'Servicios de Teléfono e Internet', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.1.02' },
        { code: '5.1.02.006', name: 'Papelería y Útiles', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.1.02' },
        { code: '5.1.03.001', name: 'Comisiones', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.1.03' },
        { code: '5.1.03.002', name: 'Publicidad y Marketing', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.1.03' },
        { code: '5.1.03.003', name: 'Viáticos', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.1.03' },
        { code: '5.2.01.001', name: 'Intereses Pagados', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.2.01' },
        { code: '5.2.01.002', name: 'Pérdida por Cambio Monetario', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.2.01' },
        { code: '5.2.02.001', name: 'IR', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.2.02' },
        { code: '5.2.02.002', name: 'IMU', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.2.02' },
        { code: '5.3.01.001', name: 'Dep. Edificios', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.3.01' },
        { code: '5.3.01.002', name: 'Dep. Mobiliario y Equipo', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.3.01' },
        { code: '5.3.01.003', name: 'Dep. Equipo de Cómputo', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.3.01' },
        { code: '5.3.01.004', name: 'Dep. Vehículos', accountType: 'EXPENSE', nature: 'DEBITOR', level: 4, isGroup: false, parentCode: '5.3.01' },
      ];

      // Create accounts grouped by level (parents first)
      const accountMap = new Map<string, string>(); // code -> id
      const maxLevel = Math.max(...accountDefs.map(a => a.level));

      for (let level = 1; level <= maxLevel; level++) {
        const levelAccounts = accountDefs.filter(a => a.level === level);
        for (const acct of levelAccounts) {
          const created = await tx.account.create({
            data: {
              companyId,
              code: acct.code,
              name: acct.name,
              accountType: acct.accountType,
              nature: acct.nature,
              level: acct.level,
              isGroup: acct.isGroup,
              parentId: acct.parentCode ? accountMap.get(acct.parentCode)! : null,
              description: acct.description || null,
            },
          });
          accountMap.set(acct.code, created.id);
        }
      }

      // --------------------------------------------------------
      // 4. COST CENTERS (Level by level)
      // --------------------------------------------------------
      const costCenterDefs: { code: string; name: string; level: number; parentCode: string | null }[] = [
        // Level 1
        { code: 'ADM', name: 'Administración General', level: 1, parentCode: null },
        { code: 'VEN', name: 'Ventas', level: 1, parentCode: null },
        { code: 'OPS', name: 'Operaciones', level: 1, parentCode: null },
        { code: 'FIN', name: 'Finanzas', level: 1, parentCode: null },
        // Level 2
        { code: 'ADM01', name: 'Dirección General', level: 2, parentCode: 'ADM' },
        { code: 'ADM02', name: 'Recursos Humanos', level: 2, parentCode: 'ADM' },
        { code: 'ADM03', name: 'Contabilidad', level: 2, parentCode: 'ADM' },
        { code: 'VEN01', name: 'Ventas Nacionales', level: 2, parentCode: 'VEN' },
        { code: 'VEN02', name: 'Ventas Internacionales', level: 2, parentCode: 'VEN' },
        { code: 'OPS01', name: 'Producción', level: 2, parentCode: 'OPS' },
        { code: 'OPS02', name: 'Logística', level: 2, parentCode: 'OPS' },
        { code: 'FIN01', name: 'Tesorería', level: 2, parentCode: 'FIN' },
        { code: 'FIN02', name: 'Crédito y Cobranza', level: 2, parentCode: 'FIN' },
      ];

      const ccMap = new Map<string, string>(); // code -> id

      // Create level 1 first
      for (const cc of costCenterDefs.filter(c => c.level === 1)) {
        const created = await tx.costCenter.create({
          data: { companyId, code: cc.code, name: cc.name, level: cc.level, parentId: null },
        });
        ccMap.set(cc.code, created.id);
      }
      // Then level 2
      for (const cc of costCenterDefs.filter(c => c.level === 2)) {
        const created = await tx.costCenter.create({
          data: { companyId, code: cc.code, name: cc.name, level: cc.level, parentId: ccMap.get(cc.parentCode!)! },
        });
        ccMap.set(cc.code, created.id);
      }

      // --------------------------------------------------------
      // 5. THIRD PARTIES
      // --------------------------------------------------------
      const thirdPartiesData = [
        // CUSTOMERS
        { type: 'CUSTOMER', name: 'Tecnologías del Sur S.A.', taxId: 'J0310000000002', email: 'ventas@tecsur.ni', city: 'Managua', state: 'Managua' },
        { type: 'CUSTOMER', name: 'Constructora de León S.A.', taxId: 'J0310000000003', email: 'contacto@cleon.ni', city: 'León', state: 'León' },
        { type: 'CUSTOMER', name: 'Distribuidora del Norte S.A.', taxId: 'J0310000000004', email: 'pedidos@distnorte.ni', city: 'Estelí', state: 'Estelí' },
        { type: 'CUSTOMER', name: 'Servicios Profesionales Pérez', taxId: '001-010180-0001A', email: 'info@perez.ni', city: 'Granada', state: 'Granada' },
        { type: 'CUSTOMER', name: 'Industrias Metálicas S.A.', taxId: 'J0310000000005', email: 'compras@industrias.ni', city: 'Masaya', state: 'Masaya' },
        // SUPPLIERS
        { type: 'SUPPLIER', name: 'Proveedor de Papelería S.A.', taxId: 'J0310000000006', email: 'ventas@papeleria.ni', city: 'Managua', state: 'Managua' },
        { type: 'SUPPLIER', name: 'Servicios de Mantenimiento NI', taxId: 'J0310000000007', email: 'admin@manteni.ni', city: 'Managua', state: 'Managua' },
        { type: 'SUPPLIER', name: 'Arrendadora Nacional S.A.', taxId: 'J0310000000008', email: 'contratos@arnacional.ni', city: 'Managua', state: 'Managua' },
        { type: 'SUPPLIER', name: 'Consultores Nicaragua Asociados', taxId: 'J0310000000009', email: 'contacto@cnasociados.ni', city: 'Managua', state: 'Managua' },
        { type: 'SUPPLIER', name: 'Distribuidora de Equipos NI', taxId: 'J0310000000010', email: 'ventas@equipos.ni', city: 'León', state: 'León' },
      ];

      const thirdParties = await tx.thirdParty.createMany({
        data: thirdPartiesData.map(tp => ({
          companyId,
          type: tp.type,
          name: tp.name,
          taxId: tp.taxId,
          email: tp.email,
          city: tp.city,
          state: tp.state,
          country: 'Nicaragua',
        })),
      });

      // Fetch third parties back to get IDs
      const allThirdParties = await tx.thirdParty.findMany({ where: { companyId } });
      const tpMap = new Map(allThirdParties.map(tp => [tp.name, tp.id]));

      // --------------------------------------------------------
      // 6. JOURNAL ENTRIES (months 1-5, all POSTED)
      // --------------------------------------------------------

      // Helper to get period ID for a given month
      const getPeriodId = (month: number) => periods.find(p => p.month === month)!.id;

      // Helper to get account ID by code
      const acc = (code: string) => accountMap.get(code)!;

      // Helper to get cost center ID by code
      const cc = (code: string) => ccMap.get(code)!;

      let entryCounter = 0;
      const getEntryNumber = () => String(++entryCounter).padStart(4, '0');

      type JournalEntryDef = {
        periodId: string;
        entryNumber: string;
        description: string;
        entryDate: Date;
        entryType: string;
        status: string;
        lines: { accountId: string; costCenterId?: string; description: string; debit: number; credit: number }[];
      };

      const journalEntries: JournalEntryDef[] = [];

      // ===== MONTH 1 - JANUARY 2026 =====
      const p1 = getPeriodId(1);

      // 1. Póliza de Apertura
      journalEntries.push({
        periodId: p1, entryNumber: getEntryNumber(), description: 'Póliza de Apertura - Capital Social inicial',
        entryDate: new Date(2026, 0, 1), entryType: 'DIARIO', status: 'POSTED',
        lines: [
          { accountId: acc('1.1.01.001'), description: 'Capital aportado en efectivo', debit: 200000, credit: 0 },
          { accountId: acc('1.1.01.002'), description: 'Capital depositado en BAC', debit: 500000, credit: 0 },
          { accountId: acc('1.1.01.003'), description: 'Capital depositado en LAFISE', debit: 200000, credit: 0 },
          { accountId: acc('1.1.03.001'), description: 'Inventario inicial de mercancías', debit: 300000, credit: 0 },
          { accountId: acc('1.2.01.001'), description: 'Edificio corporativo', debit: 2000000, credit: 0 },
          { accountId: acc('1.2.01.002'), description: 'Mobiliario y equipo de oficina', debit: 150000, credit: 0 },
          { accountId: acc('1.2.01.003'), description: 'Equipo de cómputo', debit: 80000, credit: 0 },
          { accountId: acc('3.1.01.001'), description: 'Capital Social Autorizado', debit: 0, credit: 3430000 },
        ],
      });

      // 2. Venta de contado
      journalEntries.push({
        periodId: p1, entryNumber: getEntryNumber(), description: 'Venta de contado - Factura FC-2026-0001',
        entryDate: new Date(2026, 0, 10), entryType: 'INGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('1.1.01.002'), description: 'Pago mediante transferencia BAC', debit: 125000, credit: 0 },
          { accountId: acc('4.1.01.001'), description: 'Venta de mercancías de contado', debit: 0, credit: 125000 - 15000, costCenterId: cc('VEN01') },
          { accountId: acc('2.1.02.001'), description: 'IVA trasladado (15%)', debit: 0, credit: 15000 },
        ],
      });

      // 3. Compra de mercancía
      journalEntries.push({
        periodId: p1, entryNumber: getEntryNumber(), description: 'Compra de mercancías - Factura FP-2026-0001',
        entryDate: new Date(2026, 0, 12), entryType: 'EGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('5.1.01.001'), description: 'Compra de mercancías para reventa', debit: 85000, credit: 0, costCenterId: cc('OPS01') },
          { accountId: acc('2.1.02.001'), description: 'IVA acreditable', debit: 13600, credit: 0 },
          { accountId: acc('1.1.01.003'), description: 'Pago con Banco LAFISE', debit: 0, credit: 98600 },
        ],
      });

      // 4. Pago de renta
      journalEntries.push({
        periodId: p1, entryNumber: getEntryNumber(), description: 'Pago de renta de oficina - Enero 2026',
        entryDate: new Date(2026, 0, 2), entryType: 'EGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('5.1.02.003'), description: 'Renta mensual de oficina', debit: 45000, credit: 0, costCenterId: cc('ADM01') },
          { accountId: acc('1.1.01.002'), description: 'Pago con Banco BAC', debit: 0, credit: 45000 },
        ],
      });

      // 5. Pago de sueldos
      journalEntries.push({
        periodId: p1, entryNumber: getEntryNumber(), description: 'Nómina quincenal - Primera quincena Enero',
        entryDate: new Date(2026, 0, 15), entryType: 'EGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('5.1.02.001'), description: 'Sueldos del personal administrativo', debit: 95000, credit: 0, costCenterId: cc('ADM02') },
          { accountId: acc('5.1.02.001'), description: 'Sueldos del personal de ventas', debit: 35000, credit: 0, costCenterId: cc('VEN01') },
          { accountId: acc('1.1.01.002'), description: 'Pago de nómina vía BAC', debit: 0, credit: 130000 },
        ],
      });

      // ===== MONTH 2 - FEBRUARY 2026 =====
      const p2 = getPeriodId(2);

      // 1. Venta a crédito
      journalEntries.push({
        periodId: p2, entryNumber: getEntryNumber(), description: 'Venta a crédito - Cliente Tecnologías Avanzadas',
        entryDate: new Date(2026, 1, 5), entryType: 'DIARIO', status: 'POSTED',
        lines: [
          { accountId: acc('1.1.02.001'), description: 'Cuenta por cobrar - Tec. Avanzadas', debit: 185000, credit: 0 },
          { accountId: acc('4.1.01.002'), description: 'Venta de mercancías a crédito', debit: 0, credit: 185000 / 1.15, costCenterId: cc('VEN01') },
          { accountId: acc('2.1.02.001'), description: 'IVA trasladado (15%)', debit: 0, credit: 185000 - (185000 / 1.15) },
        ],
      });

      // 2. Pago a proveedor
      journalEntries.push({
        periodId: p2, entryNumber: getEntryNumber(), description: 'Pago a Proveedor de Materiales del Sur',
        entryDate: new Date(2026, 1, 8), entryType: 'EGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('2.1.01.001'), description: 'Liquidación a proveedor nacional', debit: 120000, credit: 0 },
          { accountId: acc('1.1.01.002'), description: 'Pago con Banco BAC', debit: 0, credit: 120000 },
        ],
      });

      // 3. Pago servicios profesionales
      journalEntries.push({
        periodId: p2, entryNumber: getEntryNumber(), description: 'Servicios de contabilidad externa - CFA',
        entryDate: new Date(2026, 1, 12), entryType: 'EGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('5.1.02.002'), description: 'Honorarios contables febrero', debit: 25000, credit: 0, costCenterId: cc('ADM03') },
          { accountId: acc('2.1.02.001'), description: 'IVA retenido', debit: 4000, credit: 0 },
          { accountId: acc('1.1.01.002'), description: 'Pago con Banco BAC', debit: 0, credit: 29000 },
        ],
      });

      // 4. Depreciación mensual
      journalEntries.push({
        periodId: p2, entryNumber: getEntryNumber(), description: 'Depreciación mensual - Febrero 2026',
        entryDate: new Date(2026, 1, 28), entryType: 'DIARIO', status: 'POSTED',
        lines: [
          { accountId: acc('5.3.01.001'), description: 'Depreciación edificio (5% anual)', debit: 8333.33, credit: 0, costCenterId: cc('ADM01') },
          { accountId: acc('5.3.01.002'), description: 'Depreciación mobiliario (20% anual)', debit: 2500, credit: 0, costCenterId: cc('ADM01') },
          { accountId: acc('1.2.02.001'), description: 'Dep. acumulada edificios', debit: 0, credit: 8333.33 },
          { accountId: acc('1.2.02.002'), description: 'Dep. acumulada mobiliario', debit: 0, credit: 2500 },
        ],
      });

      // 5. Ingreso por intereses
      journalEntries.push({
        periodId: p2, entryNumber: getEntryNumber(), description: 'Intereses bancarios - Banco Santander',
        entryDate: new Date(2026, 1, 28), entryType: 'INGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('1.1.01.003'), description: 'Intereses acreditados por LAFISE', debit: 3500, credit: 0 },
          { accountId: acc('4.2.01.001'), description: 'Ingreso por intereses bancarios', debit: 0, credit: 3500, costCenterId: cc('FIN01') },
        ],
      });

      // ===== MONTH 3 - MARCH 2026 =====
      const p3 = getPeriodId(3);

      // 1. Venta de contado grande
      journalEntries.push({
        periodId: p3, entryNumber: getEntryNumber(), description: 'Venta de contado - Constructora del Pacífico',
        entryDate: new Date(2026, 2, 8), entryType: 'INGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('1.1.01.002'), description: 'Pago transferencia BAC', debit: 287500, credit: 0 },
          { accountId: acc('4.1.01.001'), description: 'Venta de mercancías de contado', debit: 0, credit: 287500 / 1.15, costCenterId: cc('VEN01') },
          { accountId: acc('2.1.02.001'), description: 'IVA trasladado (15%)', debit: 0, credit: 287500 - (287500 / 1.15) },
        ],
      });

      // 2. Compra equipo de cómputo
      journalEntries.push({
        periodId: p3, entryNumber: getEntryNumber(), description: 'Compra de equipo de cómputo - 5 laptops',
        entryDate: new Date(2026, 2, 10), entryType: 'EGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('1.2.01.003'), description: 'Equipo de cómputo nuevo', debit: 75000, credit: 0 },
          { accountId: acc('2.1.02.001'), description: 'IVA acreditable', debit: 12000, credit: 0 },
          { accountId: acc('1.1.01.003'), description: 'Pago con Banco LAFISE', debit: 0, credit: 87000 },
        ],
      });

      // 3. Pago servicios profesionales
      journalEntries.push({
        periodId: p3, entryNumber: getEntryNumber(), description: 'Servicios de asesoría fiscal - CFA',
        entryDate: new Date(2026, 2, 15), entryType: 'EGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('5.1.02.002'), description: 'Honorarios asesoría fiscal', debit: 18000, credit: 0, costCenterId: cc('ADM03') },
          { accountId: acc('1.1.01.002'), description: 'Pago con Banco BAC', debit: 0, credit: 18000 },
        ],
      });

      // 4. Cobro de clientes
      journalEntries.push({
        periodId: p3, entryNumber: getEntryNumber(), description: 'Cobro de cliente - Tecnologías Avanzadas',
        entryDate: new Date(2026, 2, 18), entryType: 'INGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('1.1.01.002'), description: 'Depósito recibido en BAC', debit: 185000, credit: 0 },
          { accountId: acc('1.1.02.001'), description: 'Liquidación cuenta por cobrar', debit: 0, credit: 185000 },
        ],
      });

      // 5. Pago de luz y teléfono
      journalEntries.push({
        periodId: p3, entryNumber: getEntryNumber(), description: 'Pago de servicios CFE y Telmex - Marzo',
        entryDate: new Date(2026, 2, 20), entryType: 'EGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('5.1.02.004'), description: 'Servicio de energía eléctrica', debit: 12500, credit: 0, costCenterId: cc('ADM01') },
          { accountId: acc('5.1.02.005'), description: 'Servicio de teléfono e internet', debit: 8500, credit: 0, costCenterId: cc('ADM01') },
          { accountId: acc('1.1.01.002'), description: 'Pago con Banco BAC', debit: 0, credit: 21000 },
        ],
      });

      // ===== MONTH 4 - APRIL 2026 =====
      const p4 = getPeriodId(4);

      // 1. Venta de servicios
      journalEntries.push({
        periodId: p4, entryNumber: getEntryNumber(), description: 'Venta servicios consultoría - Servicios Profesionales Gómez',
        entryDate: new Date(2026, 3, 5), entryType: 'INGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('1.1.01.002'), description: 'Transferencia recibida BAC', debit: 95000, credit: 0 },
          { accountId: acc('4.1.02.001'), description: 'Servicios de consultoría prestados', debit: 0, credit: 95000 / 1.15, costCenterId: cc('VEN01') },
          { accountId: acc('2.1.02.001'), description: 'IVA trasladado (15%)', debit: 0, credit: 95000 - (95000 / 1.15) },
        ],
      });

      // 2. Compra materia prima (15% IVA)
      journalEntries.push({
        periodId: p4, entryNumber: getEntryNumber(), description: 'Compra materia prima - Proveedor de Materiales del Sur',
        entryDate: new Date(2026, 3, 8), entryType: 'DIARIO', status: 'POSTED',
        lines: [
          { accountId: acc('1.1.03.002'), description: 'Materia prima para producción', debit: 165000, credit: 0, costCenterId: cc('OPS01') },
          { accountId: acc('2.1.02.001'), description: 'IVA acreditable (15%)', debit: 165000 * 0.15, credit: 0 },
          { accountId: acc('2.1.01.001'), description: 'Cuenta por pagar a proveedor', debit: 0, credit: 165000 * 1.15 },
        ],
      });

      // 3. Pago de sueldos
      journalEntries.push({
        periodId: p4, entryNumber: getEntryNumber(), description: 'Nómina quincenal - Primera quincena Abril',
        entryDate: new Date(2026, 3, 15), entryType: 'EGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('5.1.02.001'), description: 'Sueldos personal administrativo', debit: 98000, credit: 0, costCenterId: cc('ADM02') },
          { accountId: acc('5.1.02.001'), description: 'Sueldos personal de ventas', debit: 38000, credit: 0, costCenterId: cc('VEN01') },
          { accountId: acc('5.1.02.001'), description: 'Sueldos personal de operaciones', debit: 42000, credit: 0, costCenterId: cc('OPS01') },
          { accountId: acc('1.1.01.002'), description: 'Pago nómina BAC', debit: 0, credit: 178000 },
        ],
      });

      // 4. Publicidad
      journalEntries.push({
        periodId: p4, entryNumber: getEntryNumber(), description: 'Campaña publicitaria digital - Google Ads',
        entryDate: new Date(2026, 3, 10), entryType: 'EGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('5.1.03.002'), description: 'Publicidad y marketing digital', debit: 32000, credit: 0, costCenterId: cc('VEN01') },
          { accountId: acc('1.1.01.002'), description: 'Cargo a tarjeta BAC', debit: 0, credit: 32000 },
        ],
      });

      // 5. Depreciación mensual
      journalEntries.push({
        periodId: p4, entryNumber: getEntryNumber(), description: 'Depreciación mensual - Abril 2026',
        entryDate: new Date(2026, 3, 28), entryType: 'DIARIO', status: 'POSTED',
        lines: [
          { accountId: acc('5.3.01.001'), description: 'Depreciación edificio', debit: 8333.33, credit: 0, costCenterId: cc('ADM01') },
          { accountId: acc('5.3.01.002'), description: 'Depreciación mobiliario', debit: 2500, credit: 0, costCenterId: cc('ADM01') },
          { accountId: acc('5.3.01.003'), description: 'Depreciación equipo de cómputo', debit: 3333.33, credit: 0, costCenterId: cc('ADM03') },
          { accountId: acc('5.3.01.004'), description: 'Depreciación vehículos', debit: 4166.67, credit: 0, costCenterId: cc('OPS02') },
          { accountId: acc('1.2.02.001'), description: 'Dep. acumulada edificios', debit: 0, credit: 8333.33 },
          { accountId: acc('1.2.02.002'), description: 'Dep. acumulada mobiliario', debit: 0, credit: 2500 },
          { accountId: acc('1.1.01.003'), description: 'Dep. acumulada eq. cómputo', debit: 0, credit: 3333.33 },
          { accountId: acc('1.1.01.003'), description: 'Dep. acumulada vehículos', debit: 0, credit: 4166.67 },
        ],
      });

      // ===== MONTH 5 - MAY 2026 =====
      const p5 = getPeriodId(5);

      // 1. Ventas mixtas (contado + crédito)
      journalEntries.push({
        periodId: p5, entryNumber: getEntryNumber(), description: 'Ventas mixtas - Distribuidora Nacional',
        entryDate: new Date(2026, 4, 6), entryType: 'DIARIO', status: 'POSTED',
        lines: [
          { accountId: acc('1.1.01.002'), description: 'Anticipo en efectivo BAC', debit: 150000, credit: 0 },
          { accountId: acc('1.1.02.001'), description: 'Saldo a crédito 30 días', debit: 100000, credit: 0 },
          { accountId: acc('4.1.01.001'), description: 'Parte de venta de contado', debit: 0, credit: 150000 / 1.15, costCenterId: cc('VEN01') },
          { accountId: acc('4.1.01.002'), description: 'Parte de venta a crédito', debit: 0, credit: 100000 / 1.15, costCenterId: cc('VEN01') },
          { accountId: acc('2.1.02.001'), description: 'IVA trasladado total (15%)', debit: 0, credit: 250000 - (250000 / 1.15) },
        ],
      });

      // 2. Pago a proveedores
      journalEntries.push({
        periodId: p5, entryNumber: getEntryNumber(), description: 'Pago parcial a Proveedor de Materiales del Sur',
        entryDate: new Date(2026, 4, 9), entryType: 'EGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('2.1.01.001'), description: 'Pago parcial a proveedor', debit: 100000, credit: 0 },
          { accountId: acc('1.1.01.003'), description: 'Transferencia LAFISE', debit: 0, credit: 100000 },
        ],
      });

      // 3. Gastos de operación varios
      journalEntries.push({
        periodId: p5, entryNumber: getEntryNumber(), description: 'Gastos operacionales varios - Mayo 2026',
        entryDate: new Date(2026, 4, 12), entryType: 'EGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('5.1.02.003'), description: 'Renta de oficina', debit: 45000, credit: 0, costCenterId: cc('ADM01') },
          { accountId: acc('5.1.02.002'), description: 'Servicios profesionales (contabilidad)', debit: 22000, credit: 0, costCenterId: cc('ADM03') },
          { accountId: acc('5.1.02.006'), description: 'Papelería y útiles de oficina', debit: 5500, credit: 0, costCenterId: cc('ADM03') },
          { accountId: acc('5.1.02.004'), description: 'Servicios de luz', debit: 11800, credit: 0, costCenterId: cc('ADM01') },
          { accountId: acc('5.1.02.005'), description: 'Teléfono e internet', debit: 7200, credit: 0, costCenterId: cc('ADM01') },
          { accountId: acc('5.1.03.003'), description: 'Viáticos de ventas', debit: 9500, credit: 0, costCenterId: cc('VEN01') },
          { accountId: acc('1.1.01.002'), description: 'Pago único BAC', debit: 0, credit: 101000 },
        ],
      });

      // 4. Ingreso por intereses
      journalEntries.push({
        periodId: p5, entryNumber: getEntryNumber(), description: 'Intereses bancarios - Santander e inversiones',
        entryDate: new Date(2026, 4, 28), entryType: 'INGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('1.1.01.003'), description: 'Intereses acreditados LAFISE', debit: 4200, credit: 0 },
          { accountId: acc('4.2.01.001'), description: 'Intereses ganados', debit: 0, credit: 4200, costCenterId: cc('FIN01') },
        ],
      });

      // 5. Pago ISR
      journalEntries.push({
        periodId: p5, entryNumber: getEntryNumber(), description: 'Pago de ISR provisional - Trimestre 1',
        entryDate: new Date(2026, 4, 30), entryType: 'EGRESO', status: 'POSTED',
        lines: [
          { accountId: acc('5.2.02.001'), description: 'IR del trimestre', debit: 48000, credit: 0, costCenterId: cc('ADM03') },
          { accountId: acc('1.1.01.002'), description: 'Pago IR vía BAC', debit: 0, credit: 48000 },
        ],
      });

      // Create all journal entries and their lines
      let totalLines = 0;
      const createdEntryIds: string[] = [];

      for (const entry of journalEntries) {
        const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
        const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);

        const created = await tx.journalEntry.create({
          data: {
            companyId,
            periodId: entry.periodId,
            entryNumber: entry.entryNumber,
            description: entry.description,
            entryDate: entry.entryDate,
            entryType: entry.entryType,
            status: entry.status,
            postedAt: new Date(),
            totalDebit,
            totalCredit,
            difference: 0,
            lines: {
              create: entry.lines.map(line => ({
                accountId: line.accountId,
                costCenterId: line.costCenterId || null,
                description: line.description,
                debit: line.debit,
                credit: line.credit,
              })),
            },
          },
        });
        totalLines += entry.lines.length;
        createdEntryIds.push(created.id);
      }

      // --------------------------------------------------------
      // 7. BANK ACCOUNTS
      // --------------------------------------------------------
      const bankAccounts = await tx.bankAccount.createMany({
        data: [
          { companyId, bankName: 'Banco BAC', accountNumber: '0123456789', accountType: 'CHECKING', currency: 'NIO', initialBalance: 500000, currentBalance: 500000 },
          { companyId, bankName: 'Banco LAFISE', accountNumber: '9876543210', accountType: 'CHECKING', currency: 'NIO', initialBalance: 200000, currentBalance: 200000 },
        ],
      });

      const bbvaAccount = await tx.bankAccount.findFirst({ where: { companyId, bankName: 'Banco BAC' } });

      // --------------------------------------------------------
      // 8. BANK MOVEMENTS (BBVA only, last 3 months: Mar-May)
      // --------------------------------------------------------

      // Get journal entry lines for BAC bank account to partially match
      const bbvaAccId = acc('1.1.01.002');

      const bankMovementsData = [
        // March 2026
        { movementDate: new Date(2026, 2, 5), description: 'Traspaso desde otra cuenta', reference: 'TRA-2026-0301', amount: 15000, movementType: 'CREDIT' },
        { movementDate: new Date(2026, 2, 8), description: 'Venta Constructora del Pacífico', reference: 'TRA-2026-0302', amount: 287500, movementType: 'CREDIT' },
        { movementDate: new Date(2026, 2, 10), description: 'Pago CFE Marzo 2026', reference: 'CLI-2026-0301', amount: 12500, movementType: 'DEBIT' },
        { movementDate: new Date(2026, 2, 15), description: 'Asesoría fiscal CFA', reference: 'TRA-2026-0303', amount: 18000, movementType: 'DEBIT' },
        { movementDate: new Date(2026, 2, 18), description: 'Depósito cliente Tec. Avanzadas', reference: 'TRA-2026-0304', amount: 185000, movementType: 'CREDIT' },
        { movementDate: new Date(2026, 2, 20), description: 'CFE + Telmex', reference: 'CLI-2026-0302', amount: 21000, movementType: 'DEBIT' },
        { movementDate: new Date(2026, 2, 22), description: 'Comisión bancaria mensual', reference: 'COM-2026-0301', amount: 850, movementType: 'DEBIT' },
        // April 2026
        { movementDate: new Date(2026, 3, 2), description: 'Renta de oficina abril', reference: 'TRA-2026-0401', amount: 45000, movementType: 'DEBIT' },
        { movementDate: new Date(2026, 3, 5), description: 'Pago SP Gómez - Consultoría', reference: 'TRA-2026-0402', amount: 95000, movementType: 'CREDIT' },
        { movementDate: new Date(2026, 3, 10), description: 'Google Ads', reference: 'TAR-2026-0401', amount: 32000, movementType: 'DEBIT' },
        { movementDate: new Date(2026, 3, 15), description: 'Nómina abril quincena 1', reference: 'NOM-2026-0401', amount: 178000, movementType: 'DEBIT' },
        { movementDate: new Date(2026, 3, 20), description: 'Cobro parcial Industrias Metálicas', reference: 'TRA-2026-0403', amount: 65000, movementType: 'CREDIT' },
        { movementDate: new Date(2026, 3, 25), description: 'Comisión bancaria mensual', reference: 'COM-2026-0401', amount: 850, movementType: 'DEBIT' },
        // May 2026
        { movementDate: new Date(2026, 4, 3), description: 'Anticipo Distribuidora Nacional', reference: 'TRA-2026-0501', amount: 150000, movementType: 'CREDIT' },
        { movementDate: new Date(2026, 4, 6), description: 'Pago por servicios de limpieza', reference: 'TRA-2026-0502', amount: 12000, movementType: 'DEBIT' },
        { movementDate: new Date(2026, 4, 12), description: 'Gastos operacionales varios', reference: 'TRA-2026-0503', amount: 101000, movementType: 'DEBIT' },
        { movementDate: new Date(2026, 4, 18), description: 'Depósito de cliente internacional', reference: 'TRA-2026-0504', amount: 42000, movementType: 'CREDIT' },
        { movementDate: new Date(2026, 4, 25), description: 'Comisión bancaria mensual', reference: 'COM-2026-0501', amount: 850, movementType: 'DEBIT' },
        { movementDate: new Date(2026, 4, 28), description: 'Traspaso a LAFISE', reference: 'TRA-2026-0505', amount: 50000, movementType: 'DEBIT' },
        { movementDate: new Date(2026, 4, 30), description: 'IR provisional', reference: 'SPE-2026-0501', amount: 48000, movementType: 'DEBIT' },
      ];

      await tx.bankMovement.createMany({
        data: bankMovementsData.map(m => ({
          bankAccountId: bbvaAccount!.id,
          ...m,
        })),
      });

      // --------------------------------------------------------
      // 9. INVOICES (last 3 months: Mar-May, mix of statuses)
      // --------------------------------------------------------

      const customerTPs = allThirdParties.filter(tp => tp.type === 'CUSTOMER' || tp.type === 'BOTH');
      const supplierTPs = allThirdParties.filter(tp => tp.type === 'SUPPLIER' || tp.type === 'BOTH');

      const invoicesData = [
        // PAID invoices (5)
        { thirdPartyId: customerTPs[0].id, invoiceType: 'SALE' as const, number: 'FC-2026-0015', issueDate: new Date(2026, 2, 1), dueDate: new Date(2026, 2, 31), totalAmount: 118750, balanceDue: 0, status: 'PAID', description: 'Venta equipo tecnológico' },
        { thirdPartyId: supplierTPs[0].id, invoiceType: 'PURCHASE' as const, number: 'FP-2026-0008', issueDate: new Date(2026, 2, 5), dueDate: new Date(2026, 2, 20), totalAmount: 98600, balanceDue: 0, status: 'PAID', description: 'Materia prima' },
        { thirdPartyId: customerTPs[1].id, invoiceType: 'SALE' as const, number: 'FC-2026-0016', issueDate: new Date(2026, 2, 8), dueDate: new Date(2026, 2, 22), totalAmount: 247844.83, balanceDue: 0, status: 'PAID', description: 'Proyecto construcción' },
        { thirdPartyId: customerTPs[2].id, invoiceType: 'SALE' as const, number: 'FC-2026-0017', issueDate: new Date(2026, 3, 2), dueDate: new Date(2026, 3, 16), totalAmount: 81896.55, balanceDue: 0, status: 'PAID', description: 'Servicios de consultoría' },
        { thirdPartyId: supplierTPs[1].id, invoiceType: 'PURCHASE' as const, number: 'FP-2026-0010', issueDate: new Date(2026, 3, 5), dueDate: new Date(2026, 3, 19), totalAmount: 25000, balanceDue: 0, status: 'PAID', description: 'Servicios de limpieza marzo' },

        // PARTIAL invoices (5)
        { thirdPartyId: customerTPs[2].id, invoiceType: 'SALE' as const, number: 'FC-2026-0018', issueDate: new Date(2026, 3, 10), dueDate: new Date(2026, 4, 10), totalAmount: 165000, balanceDue: 82500, status: 'PARTIAL', description: 'Suministro industrial' },
        { thirdPartyId: customerTPs[3].id, invoiceType: 'SALE' as const, number: 'FC-2026-0019', issueDate: new Date(2026, 3, 15), dueDate: new Date(2026, 4, 15), totalAmount: 55000, balanceDue: 27500, status: 'PARTIAL', description: 'Servicios profesionales' },
        { thirdPartyId: supplierTPs[3].id, invoiceType: 'PURCHASE' as const, number: 'FP-2026-0011', issueDate: new Date(2026, 4, 3), dueDate: new Date(2026, 4, 17), totalAmount: 45000, balanceDue: 22500, status: 'PARTIAL', description: 'Renta mayo' },
        { thirdPartyId: supplierTPs[4].id, invoiceType: 'PURCHASE' as const, number: 'FP-2026-0012', issueDate: new Date(2026, 4, 8), dueDate: new Date(2026, 4, 22), totalAmount: 22000, balanceDue: 11000, status: 'PARTIAL', description: 'Honorarios contables mayo' },
        { thirdPartyId: customerTPs[4].id, invoiceType: 'SALE' as const, number: 'FC-2026-0020', issueDate: new Date(2026, 4, 10), dueDate: new Date(2026, 4, 25), totalAmount: 250000, balanceDue: 125000, status: 'PARTIAL', description: 'Suministro metalúrgico' },

        // PENDING invoices (3)
        { thirdPartyId: customerTPs[0].id, invoiceType: 'SALE' as const, number: 'FC-2026-0021', issueDate: new Date(2026, 4, 15), dueDate: new Date(2026, 5, 15), totalAmount: 95000, balanceDue: 95000, status: 'PENDING', description: 'Equipo tecnológico v2' },
        { thirdPartyId: supplierTPs[4].id, invoiceType: 'PURCHASE' as const, number: 'FP-2026-0013', issueDate: new Date(2026, 4, 18), dueDate: new Date(2026, 5, 2), totalAmount: 15800, balanceDue: 15800, status: 'PENDING', description: 'Papelería y útiles mayo' },
        { thirdPartyId: customerTPs[1].id, invoiceType: 'SALE' as const, number: 'FC-2026-0022', issueDate: new Date(2026, 4, 20), dueDate: new Date(2026, 5, 20), totalAmount: 310000, balanceDue: 310000, status: 'PENDING', description: 'Obra civil fase II' },

        // Overdue invoices (2)
        { thirdPartyId: customerTPs[3].id, invoiceType: 'SALE' as const, number: 'FC-2026-0014', issueDate: new Date(2026, 2, 1), dueDate: new Date(2026, 2, 28), totalAmount: 72000, balanceDue: 72000, status: 'PARTIAL', description: 'Servicios profesionales feb' },
        { thirdPartyId: customerTPs[4].id, invoiceType: 'SALE' as const, number: 'FC-2026-0013', issueDate: new Date(2026, 2, 15), dueDate: new Date(2026, 3, 15), totalAmount: 45000, balanceDue: 45000, status: 'PENDING', description: 'Material industrial feb' },
      ];

      const invoices = await tx.invoice.createMany({
        data: invoicesData.map(inv => ({
          companyId,
          ...inv,
        })),
      });

      // --------------------------------------------------------
      // 10. USERS (3 system users)
      // --------------------------------------------------------
      const usersData = [
        { email: 'admin@alpha.com.ni', name: 'Carlos Mendoza', role: 'ADMIN' as const, password: 'Admin123!' },
        { email: 'contador@alpha.com.ni', name: 'María García', role: 'ACCOUNTANT' as const, password: 'Contador123!' },
        { email: 'gerente@alpha.com.ni', name: 'Roberto López', role: 'MANAGER' as const, password: 'Gerente123!' },
      ];

      const createdUsers: any[] = [];
      for (const u of usersData) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        const user = await tx.user.create({
          data: {
            companyId,
            email: u.email,
            name: u.name,
            role: u.role,
            passwordHash: hashedPassword,
            lastLoginAt: new Date(2026, 5, 1, 9, 0, 0),
          },
        });
        createdUsers.push(user);
      }

      // --------------------------------------------------------
      // 11. AUDIT LOG (5 sample entries)
      // --------------------------------------------------------
      await tx.auditLog.createMany({
        data: [
          {
            companyId,
            userId: createdUsers[0].id,
            action: 'CREATE',
            entityType: 'Company',
            entityId: companyId,
            entityLabel: 'Grupo Empresarial Alpha S.A. de C.V.',
            oldValues: null,
            newValues: JSON.stringify({ name: 'Grupo Alpha S.A.', taxId: 'J0310000000001' }),
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            createdAt: new Date(2026, 0, 1, 8, 0, 0),
          },
          {
            companyId,
            userId: createdUsers[0].id,
            action: 'CLOSE',
            entityType: 'AccountingPeriod',
            entityId: periods[0].id,
            entityLabel: 'Enero 2026',
            oldValues: JSON.stringify({ status: 'OPEN' }),
            newValues: JSON.stringify({ status: 'CLOSED' }),
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            createdAt: new Date(2026, 0, 31, 18, 0, 0),
          },
          {
            companyId,
            userId: createdUsers[1].id,
            action: 'CREATE',
            entityType: 'JournalEntry',
            entityId: createdEntryIds[1],
            entityLabel: 'Póliza 0002 - Venta de contado',
            oldValues: null,
            newValues: JSON.stringify({ entryNumber: '0002', totalDebit: 125000, totalCredit: 125000 }),
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            createdAt: new Date(2026, 0, 10, 10, 30, 0),
          },
          {
            companyId,
            userId: createdUsers[1].id,
            action: 'UPDATE',
            entityType: 'Invoice',
            entityId: 'inv-fc-2026-0016',
            entityLabel: 'FC-2026-0016',
            oldValues: JSON.stringify({ status: 'PENDING', balanceDue: 247844.83 }),
            newValues: JSON.stringify({ status: 'PAID', balanceDue: 0 }),
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            createdAt: new Date(2026, 2, 22, 14, 15, 0),
          },
          {
            companyId,
            userId: createdUsers[2].id,
            action: 'LOGIN',
            entityType: 'User',
            entityId: createdUsers[2].id,
            entityLabel: 'Roberto López',
            oldValues: null,
            newValues: JSON.stringify({ lastLoginAt: '2026-06-01T09:00:00Z' }),
            ipAddress: '192.168.1.102',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            createdAt: new Date(2026, 5, 1, 9, 0, 0),
          },
        ],
      });

      // --------------------------------------------------------
      // 12. EXCHANGE RATES (6 months USD/MXN for 2026)
      // --------------------------------------------------------
      const exchangeRatesData = [
        { fromCurrency: 'USD', toCurrency: 'NIO', rate: 36.65, date: new Date(2026, 0, 1), source: 'BCN' },
        { fromCurrency: 'USD', toCurrency: 'NIO', rate: 36.72, date: new Date(2026, 1, 1), source: 'BCN' },
        { fromCurrency: 'USD', toCurrency: 'NIO', rate: 36.78, date: new Date(2026, 2, 1), source: 'BCN' },
        { fromCurrency: 'USD', toCurrency: 'NIO', rate: 36.85, date: new Date(2026, 3, 1), source: 'BCN' },
        { fromCurrency: 'USD', toCurrency: 'NIO', rate: 36.91, date: new Date(2026, 4, 1), source: 'BCN' },
        { fromCurrency: 'USD', toCurrency: 'NIO', rate: 36.98, date: new Date(2026, 5, 1), source: 'BCN' },
      ];

      await tx.exchangeRate.createMany({
        data: exchangeRatesData.map(er => ({ companyId, ...er })),
      });

      // --------------------------------------------------------
      // 13. FIXED ASSETS (4 assets)
      // --------------------------------------------------------
      const fixedAssetsData = [
        {
          code: 'AF-001', name: 'Edificio Principal', assetType: 'BUILDING',
          purchaseDate: new Date(2020, 0, 15), purchaseAmount: 2000000, salvageValue: 200000,
          usefulLifeMonths: 240, depreciationMethod: 'STRAIGHT_LINE',
          currentBookValue: 2000000 - (2000000 - 200000) / 240 * 52, // ~52 months of depreciation
          accumulatedDepreciation: Math.round((2000000 - 200000) / 240 * 52 * 100) / 100,
          status: 'ACTIVE', location: 'Pista Jean Paul Genie, Managua', accountId: acc('1.2.01.001'),
        },
        {
          code: 'AF-002', name: 'Mobiliario de Oficina', assetType: 'FURNITURE',
          purchaseDate: new Date(2021, 5, 1), purchaseAmount: 150000, salvageValue: 0,
          usefulLifeMonths: 120, depreciationMethod: 'STRAIGHT_LINE',
          currentBookValue: 150000 - (150000 / 120 * 35), // ~35 months
          accumulatedDepreciation: Math.round(150000 / 120 * 35 * 100) / 100,
          status: 'ACTIVE', location: 'Pista Jean Paul Genie, Piso 3', accountId: acc('1.2.01.002'),
        },
        {
          code: 'AF-003', name: 'Servidor Principal', assetType: 'COMPUTER',
          purchaseDate: new Date(2022, 2, 10), purchaseAmount: 80000, salvageValue: 5000,
          usefulLifeMonths: 60, depreciationMethod: 'STRAIGHT_LINE',
          currentBookValue: 80000 - ((80000 - 5000) / 60 * 27), // ~27 months
          accumulatedDepreciation: Math.round((80000 - 5000) / 60 * 27 * 100) / 100,
          status: 'ACTIVE', location: 'Pista Jean Paul Genie, Sala de Servidores', accountId: acc('1.2.01.003'),
        },
        {
          code: 'AF-004', name: 'Camioneta Reparto', assetType: 'VEHICLE',
          purchaseDate: new Date(2023, 0, 20), purchaseAmount: 350000, salvageValue: 35000,
          usefulLifeMonths: 60, depreciationMethod: 'STRAIGHT_LINE',
          currentBookValue: 350000 - ((350000 - 35000) / 60 * 17), // ~17 months
          accumulatedDepreciation: Math.round((350000 - 35000) / 60 * 17 * 100) / 100,
          status: 'ACTIVE', location: 'Pista Jean Paul Genie, Estacionamiento',
        },
      ];

      const createdFixedAssets: any[] = [];
      for (const fa of fixedAssetsData) {
        const asset = await tx.fixedAsset.create({
          data: {
            companyId,
            code: fa.code,
            name: fa.name,
            assetType: fa.assetType,
            purchaseDate: fa.purchaseDate,
            purchaseAmount: fa.purchaseAmount,
            salvageValue: fa.salvageValue,
            usefulLifeMonths: fa.usefulLifeMonths,
            depreciationMethod: fa.depreciationMethod,
            currentBookValue: fa.currentBookValue,
            accumulatedDepreciation: fa.accumulatedDepreciation,
            status: fa.status,
            location: fa.location,
            accountId: fa.accountId || null,
          },
        });
        createdFixedAssets.push(asset);
      }

      // --------------------------------------------------------
      // 14. BUDGETS (5 budgets for January 2026)
      // --------------------------------------------------------
      const budgetsData = [
        { accountId: acc('5.1.02.001'), costCenterId: cc('ADM02'), budgetedAmount: 120000, actualAmount: 95000, description: 'Sueldos y Salarios - Recursos Humanos' },
        { accountId: acc('5.1.02.003'), costCenterId: cc('ADM01'), budgetedAmount: 45000, actualAmount: 45000, description: 'Renta de Oficina - Dirección General' },
        { accountId: acc('5.1.02.002'), costCenterId: cc('ADM03'), budgetedAmount: 30000, actualAmount: 25000, description: 'Servicios Profesionales - Contabilidad' },
        { accountId: acc('5.1.03.002'), costCenterId: cc('VEN01'), budgetedAmount: 20000, actualAmount: 32000, description: 'Publicidad y Marketing - Ventas' },
        { accountId: acc('5.1.01.001'), costCenterId: cc('OPS01'), budgetedAmount: 100000, actualAmount: 85000, description: 'Compras de Mercancías - Producción' },
      ];

      await tx.budget.createMany({
        data: budgetsData.map(b => ({
          companyId,
          year: 2026,
          accountId: b.accountId,
          costCenterId: b.costCenterId,
          month: 1,
          budgetedAmount: b.budgetedAmount,
          actualAmount: b.actualAmount,
          variance: b.budgetedAmount - b.actualAmount,
          description: b.description,
        })),
      });

      // --------------------------------------------------------
      // 15. NOTIFICATIONS (3 system notifications)
      // --------------------------------------------------------
      await tx.notification.createMany({
        data: [
          {
            companyId,
            userId: createdUsers[0].id,
            type: 'SYSTEM',
            title: 'Período Cerrado',
            message: 'Período Enero 2026 cerrado correctamente',
            entityType: 'AccountingPeriod',
            entityId: periods[0].id,
            isRead: true,
            readAt: new Date(2026, 0, 31, 18, 5, 0),
            priority: 'NORMAL',
          },
          {
            companyId,
            userId: createdUsers[0].id,
            type: 'OVERDUE_INVOICE',
            title: 'Facturas Vencidas',
            message: '3 facturas vencidas en Cuentas por Cobrar',
            entityType: 'Invoice',
            entityId: 'overdue-invoices',
            isRead: false,
            readAt: null,
            priority: 'HIGH',
          },
          {
            companyId,
            userId: createdUsers[1].id,
            type: 'BALANCE_MISMATCH',
            title: 'Balance Verificado',
            message: 'Balance de Enero cuadra correctamente',
            entityType: 'AccountingPeriod',
            entityId: periods[0].id,
            isRead: true,
            readAt: new Date(2026, 1, 1, 9, 0, 0),
            priority: 'LOW',
          },
        ],
      });

      // --------------------------------------------------------
      // 16. FILE ATTACHMENTS (2 sample files)
      // --------------------------------------------------------
      // Look up an invoice for the first attachment
      const sampleInvoice = await tx.invoice.findFirst({ where: { companyId, number: 'FC-2026-0015' } });

      await tx.fileAttachment.createMany({
        data: [
          {
            companyId,
            entityType: 'Invoice',
            entityId: sampleInvoice?.id || 'placeholder-invoice-id',
            fileName: 'Factura_FC-2026-0001.pdf',
            fileUrl: '/uploads/invoices/Factura_FC-2026-0001.pdf',
            fileSize: 245760,
            mimeType: 'application/pdf',
            description: 'Factura de venta a Tecnologías Avanzadas S.A.',
            uploadedBy: createdUsers[1].id,
          },
          {
            companyId,
            entityType: 'BankAccount',
            entityId: bbvaAccount?.id || 'placeholder-bank-id',
            fileName: 'Estado_de_Cuenta_BAC_Ene2026.pdf',
            fileUrl: '/uploads/bank-statements/Estado_de_Cuenta_BAC_Ene2026.pdf',
            fileSize: 512000,
            mimeType: 'application/pdf',
            description: 'Estado de cuenta bancario BAC Enero 2026',
            uploadedBy: createdUsers[1].id,
          },
        ],
      });

      // --------------------------------------------------------
      // Return counts
      // --------------------------------------------------------
      return {
        company: 1,
        periods: periods.length,
        accounts: accountDefs.length,
        costCenters: costCenterDefs.length,
        thirdParties: thirdPartiesData.length,
        journalEntries: journalEntries.length,
        journalEntryLines: totalLines,
        bankAccounts: 2,
        bankMovements: bankMovementsData.length,
        invoices: invoicesData.length,
        users: usersData.length,
        auditLogs: 5,
        exchangeRates: exchangeRatesData.length,
        fixedAssets: fixedAssetsData.length,
        budgets: budgetsData.length,
        notifications: 3,
        fileAttachments: 2,
      };
    });

    return success(result);
  } catch (err: unknown) {
    console.error('Seed error:', err);
    const message = err instanceof Error ? err.message : 'Error al ejecutar el seed';
    return serverError(message);
  }
}
