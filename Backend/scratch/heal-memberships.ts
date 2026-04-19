import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting membership healing...');
  const users = await prisma.user.findMany({
    where: {
      companyId: { not: null },
      memberships: { none: {} }
    }
  });

  console.log(`Found ${users.length} users needing membership migration.`);

  for (const user of users) {
    if (user.companyId) {
      await prisma.userCompany.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          role: 'OWNER' // Default for legacy users who are admins
        }
      });
      console.log(`Created membership for user ${user.email} with company ${user.companyId}`);
    }
  }

  console.log('Healing complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
