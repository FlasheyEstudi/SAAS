import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { memberships: true }
  });
  console.log('Users and Memberships:');
  console.log(JSON.stringify(users, (key, value) => key === 'password' ? '***' : value, 2));

  const companies = await prisma.company.findMany();
  console.log('\nCompanies:');
  console.log(JSON.stringify(companies, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
