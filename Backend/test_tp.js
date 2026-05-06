const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.company.findFirst();
  
  const thirdPartiesRaw = await prisma.thirdParty.findMany({
    where: { companyId: c.id },
    include: { 
      _count: { select: { invoices: true } },
      invoices: {
        where: { status: { not: 'CANCELLED' } },
        select: { balanceDue: true }
      }
    },
    orderBy: { name: 'asc' },
    skip: 0,
    take: 20,
  });

  const thirdPartiesCount = await prisma.thirdParty.count({ where: { companyId: c.id } });
  
  console.log('Count:', thirdPartiesCount);
  console.log('Result length:', thirdPartiesRaw.length);
}
main().finally(() => prisma.$disconnect());
