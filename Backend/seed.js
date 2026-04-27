const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  try {
    console.log('Starting seed (CommonJS)...');
    
    // Clear existing data in correct order
    await db.fileAttachment.deleteMany();
    await db.notification.deleteMany();
    await db.budget.deleteMany();
    await db.depreciationEntry.deleteMany();
    await db.fixedAsset.deleteMany();
    await db.exchangeRate.deleteMany();
    await db.auditLog.deleteMany();
    await db.user.deleteMany();
    await db.bankMovement.deleteMany();
    await db.invoice.deleteMany();
    await db.journalEntryLine.deleteMany();
    await db.journalEntry.deleteMany();
    await db.bankAccount.deleteMany();
    await db.thirdParty.deleteMany();
    await db.costCenter.deleteMany();
    await db.account.deleteMany();
    await db.accountingPeriod.deleteMany();
    await db.company.deleteMany();

    console.log('Data cleared.');

    // Create Company
    const company = await db.company.create({
      data: {
        name: 'Grupo Empresarial Alpha S.A.',
        taxId: 'J0310000000001',
        currency: 'NIO',
        address: 'Managua, Nicaragua',
        phone: '+505 2270 1234',
        email: 'admin@alpha.com.ni',
      },
    });
    const companyId = company.id;
    console.log('Company created:', companyId);

    // Create periods for 2026
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    for (const month of months) {
      await db.accountingPeriod.create({
        data: {
          companyId,
          year: 2026,
          month,
          status: month < 5 ? 'CLOSED' : 'OPEN',
        },
      });
    }
    console.log('Periods for 2026 created.');

    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const user = await db.user.create({
      data: {
        companyId,
        email: 'admin@alpha.com.ni',
        name: 'Carlos Mendoza',
        role: 'ADMIN',
        passwordHash: hashedPassword,
        isActive: true
      },
    });
    await db.userCompany.create({
      data: {
        userId: user.id,
        companyId,
        role: 'OWNER'
      }
    });
    console.log('Admin user recreated and added to company membership.');

    console.log('Seed SUCCESS!');
  } catch (e) {
    console.error('Seed ERROR:', e);
  } finally {
    await db.$disconnect();
  }
}

main();
