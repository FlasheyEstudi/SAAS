const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const accounts = await prisma.account.findMany();
  console.log(accounts.map(a => ({ code: a.code, isGroup: a.isGroup })));
}
main().finally(() => prisma.$disconnect());
