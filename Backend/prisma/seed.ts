import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Iniciando SUPER-SEED PREMIUM (2025-2026)...');

    // 1. Limpieza Total (Transaccional)
    const tables = [
      'Notification', 'Budget', 'DepreciationEntry', 'FixedAsset',
      'ExchangeRate', 'AuditLog', 'UserCompany', 'BankMovement',
      'TaxEntry', 'PaymentSchedule', 'InvoiceLine', 'Invoice',
      'JournalEntryLine', 'JournalEntry', 'BankAccount', 'PaymentTerm',
      'TaxRate', 'ThirdParty', 'FinancialConcept', 'CostCenter',
      'Account', 'AccountingPeriod', 'User', 'Company'
    ];
    
    for (const table of tables) {
      try {
        await (db as any)[table.toLowerCase().charAt(0) + table.slice(1)].deleteMany();
      } catch (e) {}
    }

    // 2. Empresa Global
    const company = await db.company.create({
      data: {
        name: 'Ganesha Enterprise Solutions S.A.',
        taxId: 'J031000000123',
        currency: 'NIO',
        address: 'Centro Corporativo Invercasa, Piso 5, Managua',
        email: 'corporativo@ganesha.ni',
        phone: '+505 2222-9000',
        metadata: {
          accountMapping: {
            clientes: '1.1.02.01',
            proveedores: '2.1.01.01',
            ivaPagar: '2.1.02.01',
            ivaAcreditable: '1.1.03.01',
            retIrRecibida: '1.1.03.02',
            retIrPagar: '2.1.02.02'
          }
        }
      }
    });
    const cid = company.id;

    // 3. Usuarios por Rol
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const users = [
      { email: 'admin@ganesha.com', name: 'Director General', role: 'ADMIN' },
      { email: 'cfo@ganesha.com', name: 'Director Financiero', role: 'MANAGER' },
      { email: 'contador@ganesha.com', name: 'Contador General', role: 'ACCOUNTANT' }
    ];

    for (const u of users) {
      const created = await db.user.create({
        data: { email: u.email, name: u.name, passwordHash: hashedPassword, role: u.role as any, companyId: cid }
      });
      // Mapeo seguro de roles para la membresía
      const membershipRole = u.role === 'ADMIN' ? 'OWNER' : (u.role === 'MANAGER' ? 'ADMIN' : 'ACCOUNTANT');
      await db.userCompany.create({ data: { userId: created.id, companyId: cid, role: membershipRole as any } });
    }

    // 4. Plan de Cuentas (Nivel 4-5)
    console.log('📊 Generando Plan de Cuentas Avanzado...');
    const coa = [
      { code: '1', name: 'ACTIVO', type: 'ASSET', nature: 'DEBITOR', isGroup: true },
      { code: '1.1', name: 'ACTIVO CORRIENTE', type: 'ASSET', nature: 'DEBITOR', isGroup: true, parent: '1' },
      { code: '1.1.01', name: 'CAJA Y BANCOS', type: 'ASSET', nature: 'DEBITOR', isGroup: true, parent: '1.1' },
      { code: '1.1.01.01', name: 'BANCO BAC NIO', type: 'ASSET', nature: 'DEBITOR', isGroup: false, parent: '1.1.01' },
      { code: '1.1.01.02', name: 'BANCO LAFISE USD', type: 'ASSET', nature: 'DEBITOR', isGroup: false, parent: '1.1.01' },
      { code: '1.1.02', name: 'CUENTAS POR COBRAR', type: 'ASSET', nature: 'DEBITOR', isGroup: true, parent: '1.1' },
      { code: '1.1.02.01', name: 'CLIENTES NACIONALES', type: 'ASSET', nature: 'DEBITOR', isGroup: false, parent: '1.1.02' },
      { code: '1.1.02.02', name: 'CLIENTES EXTRANJEROS', type: 'ASSET', nature: 'DEBITOR', isGroup: false, parent: '1.1.02' },
      { code: '1.1.03', name: 'INVENTARIOS', type: 'ASSET', nature: 'DEBITOR', isGroup: true, parent: '1.1' },
      { code: '1.1.03.01', name: 'PRODUCTOS TERMINADOS', type: 'ASSET', nature: 'DEBITOR', isGroup: false, parent: '1.1.03' },
      { code: '1.2', name: 'ACTIVO NO CORRIENTE', type: 'ASSET', nature: 'DEBITOR', isGroup: true, parent: '1' },
      { code: '1.2.01', name: 'PROPIEDAD, PLANTA Y EQUIPO', type: 'ASSET', nature: 'DEBITOR', isGroup: true, parent: '1.2' },
      { code: '1.2.01.01', name: 'EQUIPO DE COMPUTO', type: 'ASSET', nature: 'DEBITOR', isGroup: false, parent: '1.2.01' },
      { code: '1.2.01.02', name: 'VEHICULOS', type: 'ASSET', nature: 'DEBITOR', isGroup: false, parent: '1.2.01' },
      { code: '1.2.02', name: 'DEPRECIACION ACUMULADA', type: 'ASSET', nature: 'ACREEDOR', isGroup: false, parent: '1.2' },

      { code: '2', name: 'PASIVO', type: 'LIABILITY', nature: 'ACREEDOR', isGroup: true },
      { code: '2.1', name: 'PASIVO CORRIENTE', type: 'LIABILITY', nature: 'ACREEDOR', isGroup: true, parent: '2' },
      { code: '2.1.01', name: 'PROVEEDORES', type: 'LIABILITY', nature: 'ACREEDOR', isGroup: true, parent: '2.1' },
      { code: '2.1.01.01', name: 'PROVEEDORES LOCALES', type: 'LIABILITY', nature: 'ACREEDOR', isGroup: false, parent: '2.1.01' },
      { code: '2.1.02', name: 'IMPUESTOS POR PAGAR', type: 'LIABILITY', nature: 'ACREEDOR', isGroup: true, parent: '2.1' },
      { code: '2.1.02.01', name: 'IVA POR PAGAR (15%)', type: 'LIABILITY', nature: 'ACREEDOR', isGroup: false, parent: '2.1.02' },

      { code: '3', name: 'PATRIMONIO', type: 'EQUITY', nature: 'ACREEDOR', isGroup: true },
      { code: '3.1', name: 'CAPITAL SOCIAL', type: 'EQUITY', nature: 'ACREEDOR', isGroup: false, parent: '3' },
      { code: '3.2', name: 'RESULTADOS ACUMULADOS', type: 'EQUITY', nature: 'ACREEDOR', isGroup: false, parent: '3' },

      { code: '4', name: 'INGRESOS', type: 'INCOME', nature: 'ACREEDOR', isGroup: true },
      { code: '4.1', name: 'INGRESOS OPERATIVOS', type: 'INCOME', nature: 'ACREEDOR', isGroup: true, parent: '4' },
      { code: '4.1.01', name: 'VENTAS DE HARDWARE', type: 'INCOME', nature: 'ACREEDOR', isGroup: false, parent: '4.1' },
      { code: '4.1.02', name: 'SERVICIOS DE CLOUD', type: 'INCOME', nature: 'ACREEDOR', isGroup: false, parent: '4.1' },

      { code: '5', name: 'GASTOS', type: 'EXPENSE', nature: 'DEBITOR', isGroup: true },
      { code: '5.1', name: 'GASTOS ADMINISTRATIVOS', type: 'EXPENSE', nature: 'DEBITOR', isGroup: true, parent: '5' },
      { code: '5.1.01', name: 'NOMINA Y SALARIOS', type: 'EXPENSE', nature: 'DEBITOR', isGroup: false, parent: '5.1' },
      { code: '5.1.02', name: 'ALQUILER DE OFICINAS', type: 'EXPENSE', nature: 'DEBITOR', isGroup: false, parent: '5.1' },
      { code: '5.1.03', name: 'SERVICIOS BASICOS', type: 'EXPENSE', nature: 'DEBITOR', isGroup: false, parent: '5.1' },
      { code: '5.2', name: 'GASTOS DE VENTAS', type: 'EXPENSE', nature: 'DEBITOR', isGroup: true, parent: '5' },
      { code: '5.2.01', name: 'PUBLICIDAD DIGITAL', type: 'EXPENSE', nature: 'DEBITOR', isGroup: false, parent: '5.2' },
      { code: '5.3', name: 'GASTOS DE DEPRECIACION', type: 'EXPENSE', nature: 'DEBITOR', isGroup: false, parent: '5' },
    ];

    const accMap: Record<string, string> = {};
    for (const a of coa) {
      const created = await db.account.create({
        data: {
          companyId: cid, code: a.code, name: a.name, accountType: a.type as any,
          nature: a.nature as any, isGroup: a.isGroup, level: a.code.split('.').length,
          parentId: a.parent ? accMap[a.parent] : null
        }
      });
      accMap[a.code] = created.id;
    }

    // 5. Períodos (2025 Cerrados, 2026 Abiertos)
    const periods: any[] = [];
    for (let y of [2025, 2026]) {
      for (let m = 1; m <= 12; m++) {
        periods.push(await db.accountingPeriod.create({
          data: { companyId: cid, year: y, month: m, status: y === 2025 ? 'CLOSED' : 'OPEN' }
        }));
      }
    }

    // 6. Entidades de Soporte
    const tpCust = await db.thirdParty.create({ data: { companyId: cid, name: 'Corporación Multinacional S.A.', type: 'CUSTOMER', taxId: 'RUC-M-999', email: 'finanzas@multicorp.com' } });
    const tpSupp = await db.thirdParty.create({ data: { companyId: cid, name: 'Inmobiliaria Central', type: 'SUPPLIER', taxId: 'RUC-I-888', email: 'rentas@central.ni' } });
    
    const bankBac = await db.bankAccount.create({ data: { companyId: cid, bankName: 'BAC Credomatic NIO', accountNumber: '100200300', accountType: 'CHECKING', initialBalance: 1000000, currentBalance: 1000000, currency: 'NIO' } });
    const bankLafise = await db.bankAccount.create({ data: { companyId: cid, bankName: 'LAFISE USD', accountNumber: '500600700', accountType: 'SAVINGS', initialBalance: 50000, currentBalance: 50000, currency: 'USD' } });

    const ccAdm = await db.costCenter.create({ data: { companyId: cid, code: 'CC-ADM', name: 'Administración Central' } });
    const ccVta = await db.costCenter.create({ data: { companyId: cid, code: 'CC-VTA', name: 'Fuerza de Ventas' } });

    // 7. Transacciones de 18 Meses (Ene 2025 - Jun 2026)
    console.log('💳 Generando flujo transaccional de 18 meses...');
    for (let i = 0; i < 150; i++) {
      const date = new Date(2025, 0, 1);
      date.setDate(date.getDate() + (i * 3.5)); // Espaciado lúdico
      
      const isSale = i % 3 !== 0; // Más ventas que compras
      const amount = 1500 + (Math.random() * 15000);
      const iva = amount * 0.15;
      const total = amount + iva;
      const status = i % 4 === 0 ? 'PENDING' : 'PAID';

      const p = periods.find(p => p.year === date.getFullYear() && p.month === date.getMonth() + 1);
      if (!p) continue;

      // --- DIVERSIFICACIÓN DE CUENTAS ---
      const expenseCodes = ['5.1.01', '5.1.02', '5.1.03', '5.2.01'];
      const selectedExpenseAccount = expenseCodes[i % expenseCodes.length];
      const accountId = isSale ? accMap['4.1.01'] : accMap[selectedExpenseAccount];

      const inv = await db.invoice.create({
        data: {
          companyId: cid, thirdPartyId: isSale ? tpCust.id : tpSupp.id,
          invoiceType: isSale ? 'SALE' : 'PURCHASE', number: `${isSale ? 'FACT' : 'COMP'}-${2000 + i}`,
          issueDate: date, dueDate: new Date(date.getTime() + 30*24*3600000),
          subtotal: amount, taxAmount: iva, totalAmount: total, balanceDue: status === 'PAID' ? 0 : total,
          status: status as any
        }
      });

      // Póliza Contable Automática
      const je = await db.journalEntry.create({
        data: {
          companyId: cid, periodId: p.id, entryNumber: `POL-${inv.number}`,
          description: `Registro de ${isSale ? 'Venta' : 'Compra'} #${inv.number}`,
          entryDate: date, entryType: isSale ? 'INGRESO' : 'EGRESO', status: 'POSTED',
          totalDebit: total, totalCredit: total,
          lines: {
            create: [
              { accountId: isSale ? accMap['1.1.02.01'] : accountId, debit: isSale ? total : amount, credit: 0, description: 'Partida principal', costCenterId: isSale ? ccVta.id : ccAdm.id },
              { accountId: isSale ? accountId : accMap['2.1.01.01'], debit: 0, credit: isSale ? amount : total, description: 'Contrapartida' },
              { accountId: isSale ? accMap['2.1.02.01'] : accMap['1.1.03.01'], debit: isSale ? 0 : iva, credit: isSale ? iva : 0, description: 'IVA' }
            ]
          }
        }
      });
      await db.invoice.update({ where: { id: inv.id }, data: { journalEntryId: je.id } });

      if (status === 'PAID') {
        await db.bankMovement.create({
          data: {
            bankAccountId: bankBac.id, movementDate: date, amount: total,
            description: `Pago ${inv.number}`, movementType: isSale ? 'DEBIT' : 'CREDIT', status: 'RECONCILED'
          }
        });
      }
    }

    // 8. Activos Fijos y Depreciación Histórica
    console.log('🏠 Configurando Activos Fijos...');
    const laptop = await db.fixedAsset.create({
      data: {
        companyId: cid, code: 'ASSET-001', name: 'Servidor Dell PowerEdge', assetType: 'COMPUTER',
        purchaseDate: new Date('2025-01-01'), purchaseAmount: 5000, currentBookValue: 5000,
        usefulLifeMonths: 48, accountId: accMap['1.2.01.01']
      }
    });

    // Simular 12 meses de depreciación en 2025
    for (let m = 1; m <= 12; m++) {
      const depAmt = 5000 / 48;
      await db.depreciationEntry.create({
        data: {
          companyId: cid, fixedAssetId: laptop.id, year: 2025, month: m,
          depreciationAmount: depAmt, accumulatedTotal: depAmt * m, bookValueAfter: 5000 - (depAmt * m)
        }
      });
    }

    // 9. Presupuestos 2026
    console.log('📊 Estableciendo Presupuestos...');
    for (let m = 1; m <= 12; m++) {
      await db.budget.create({
        data: {
          companyId: cid, year: 2026, month: m, accountId: accMap['5.1.01'],
          budgetedAmount: 50000, actualAmount: 48500, variance: 1500, description: 'Presupuesto Nómina'
        }
      });
    }

    console.log('✅ SUPER-SEED COMPLETADA EXITOSAMENTE.');
    console.log('Empresa: Ganesha Enterprise Solutions S.A.');
    console.log('Usuario: admin@ganesha.com / Admin123!');

  } catch (err) {
    console.error('❌ Error en Seed:', err);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
