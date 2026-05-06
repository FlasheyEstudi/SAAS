const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const budgets = await prisma.budget.findMany();
  console.log(budgets);
}
main().finally(() => prisma.$disconnect());
