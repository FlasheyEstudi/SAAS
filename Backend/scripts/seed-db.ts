import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  try {
    console.log('Starting seed...');
    await db.$transaction(async (tx) => {
      // Delete existing data
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
      await tx.journalEntryLine.deleteMany();
      await tx.journalEntry.deleteMany();
      await tx.bankAccount.deleteMany();
      await tx.thirdParty.deleteMany();
      await tx.costCenter.deleteMany();
      await tx.account.deleteMany();
      await tx.accountingPeriod.deleteMany();
      await tx.company.deleteMany();

      console.log('Existing data cleared.');

      // Create Company
      const company = await tx.company.create({
        data: {
          name: 'Grupo Alpha S.A.',
          taxId: 'J0310000000001',
          currency: 'NIO',
          address: 'Managua, Nicaragua',
          phone: '+505 2270 1234',
          email: 'contacto@alpha.com.ni',
        },
      });
      const companyId = company.id;
      console.log('Company created:', companyId);

      // Periods 2026
      const months = [1, 2, 3, 4, 5, 6];
      for (let i = 0; i < 6; i++) {
        await tx.accountingPeriod.create({
          data: {
            companyId,
            year: 2026,
            month: months[i],
            status: i < 5 ? 'CLOSED' : 'OPEN',
          },
        });
      }
      console.log('Periods for 2026 created.');

      // Users
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      await tx.user.create({
        data: {
          companyId,
          email: 'admin@alpha.com.ni',
          name: 'Carlos Mendoza',
          role: 'ADMIN',
          password: hashedPassword,
        },
      });
      console.log('Admin user created.');
    });
    console.log('Seed completed successfully!');
  } catch (e) {
    console.error('Seed failed:', e);
  } finally {
    await db.$disconnect();
  }
}

main();
