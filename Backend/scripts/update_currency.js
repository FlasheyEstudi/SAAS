const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating currencies to NIO...');
  
  const companyUpdate = await prisma.company.updateMany({
    where: { currency: 'MXN' },
    data: { currency: 'NIO' }
  });
  console.log(`Updated ${companyUpdate.count} companies.`);

  const bankAccountUpdate = await prisma.bankAccount.updateMany({
    where: { currency: 'MXN' },
    data: { currency: 'NIO' }
  });
  console.log(`Updated ${bankAccountUpdate.count} bank accounts.`);
  
  console.log('Done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
