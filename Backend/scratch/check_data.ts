import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const companies = await prisma.company.findMany();
  
  console.log('USERS:', JSON.stringify(users, null, 2));
  console.log('COMPANIES:', JSON.stringify(companies, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
