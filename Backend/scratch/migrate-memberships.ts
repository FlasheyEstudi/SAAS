import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      companyId: { not: null }
    }
  });

  console.log(`Migrating ${users.length} users...`);

  for (const user of users) {
    if (user.companyId) {
      const existing = await prisma.userCompany.findUnique({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId: user.companyId
          }
        }
      });

      if (!existing) {
        await prisma.userCompany.create({
          data: {
            userId: user.id,
            companyId: user.companyId,
            role: 'OWNER'
          }
        });
        console.log(`Linked user ${user.email} to company ${user.companyId}`);
      }
    }
  }

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
