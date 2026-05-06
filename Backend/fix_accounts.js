const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.account.updateMany({
    data: { isGroup: false }
  });
  console.log('Accounts updated');
}
main().finally(() => prisma.$disconnect());
