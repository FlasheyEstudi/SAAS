const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const companies = await prisma.company.findMany();
  console.log('Companies:', companies.map(c => ({ id: c.id, name: c.name })));
  const tp = await prisma.thirdParty.findMany({ select: { id: true, companyId: true, type: true }});
  console.log('Third Parties Total:', tp.length);
  console.log('Third Parties CompanyIds:', [...new Set(tp.map(t => t.companyId))]);
  const bud = await prisma.budget.findMany();
  console.log('Budgets Total:', bud.length);
}
main().finally(() => prisma.$disconnect());
