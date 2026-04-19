import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();
  console.log('Companies:', JSON.stringify(companies, null, 2));
  
  for (const company of companies) {
    const periods = await prisma.accountingPeriod.findMany({
      where: { companyId: company.id }
    });
    console.log(`Periods for ${company.name}:`, periods.length);
    if (periods.length > 0) {
      console.log('Sample Period:', periods[0]);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
