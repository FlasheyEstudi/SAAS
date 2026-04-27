const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  try {
    console.log('Starting FULL seed...');
    
    await db.journalEntryLine.deleteMany();
    await db.journalEntry.deleteMany();
    await db.account.deleteMany();
    await db.accountingPeriod.deleteMany();
    await db.company.deleteMany();
    await db.user.deleteMany();

    const company = await db.company.create({
      data: {
        name: 'Grupo Alpha S.A.',
        taxId: 'J0310000000001',
        currency: 'NIO',
      },
    });
    const companyId = company.id;

    // Periods 2026
    for (let m = 1; m <= 12; m++) {
      await db.accountingPeriod.create({
        data: { companyId, year: 2026, month: m, status: m < 5 ? 'CLOSED' : 'OPEN' }
      });
    }

    // Chart of Accounts (Simplified)
    const accounts = [
      { code: '1', name: 'Activo', type: 'ASSET', nature: 'DEBITOR', level: 1 },
      { code: '1.1', name: 'Activo Corriente', type: 'ASSET', nature: 'DEBITOR', level: 2, parentCode: '1' },
      { code: '1.1.01', name: 'Caja y Bancos', type: 'ASSET', nature: 'DEBITOR', level: 3, parentCode: '1.1' },
      { code: '1.1.01.001', name: 'Caja General', type: 'ASSET', nature: 'DEBITOR', level: 4, parentCode: '1.1.01' },
      { code: '1.1.01.002', name: 'Banco BAC', type: 'ASSET', nature: 'DEBITOR', level: 4, parentCode: '1.1.01' },
      
      { code: '2', name: 'Pasivo', type: 'LIABILITY', nature: 'CREDITOR', level: 1 },
      { code: '3', name: 'Patrimonio', type: 'EQUITY', nature: 'CREDITOR', level: 1 },
      
      { code: '4', name: 'Ingreso', type: 'INCOME', nature: 'CREDITOR', level: 1 },
      { code: '4.1', name: 'Ventas', type: 'INCOME', nature: 'CREDITOR', level: 2, parentCode: '4' },
      { code: '4.1.01', name: 'Ventas de Servicios', type: 'INCOME', nature: 'CREDITOR', level: 3, parentCode: '4.1' },
      
      { code: '5', name: 'Gasto', type: 'EXPENSE', nature: 'DEBITOR', level: 1 },
      { code: '5.1', name: 'Gastos de Venta', type: 'EXPENSE', nature: 'DEBITOR', level: 2, parentCode: '5' },
    ];

    const codeToId = {};
    for (const a of accounts) {
      const created = await db.account.create({
        data: {
          companyId,
          code: a.code,
          name: a.name,
          accountType: a.type,
          nature: a.nature,
          level: a.level,
          isGroup: a.level < 4,
          parentId: a.parentCode ? codeToId[a.parentCode] : null
        }
      });
      codeToId[a.code] = created.id;
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const user = await db.user.create({
      data: {
        companyId,
        email: 'admin@alpha.com.ni',
        name: 'Carlos Mendoza',
        role: 'ADMIN',
        passwordHash: hashedPassword,
      }
    });
    await db.userCompany.create({
      data: {
        userId: user.id,
        companyId,
        role: 'OWNER'
      }
    });

    console.log('FULL SEED SUCCESS! Company ID:', companyId);
  } catch (e) {
    console.error(e);
  } finally {
    await db.$disconnect();
  }
}

main();
