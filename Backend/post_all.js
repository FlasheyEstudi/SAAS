const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Rescatando Reportes: Publicando datos ---');

  const pCount = await prisma.accountingPeriod.updateMany({
    data: { status: 'OPEN' }
  });
  console.log(`Períodos actualizados: ${pCount.count}`);

  const eCount = await prisma.journalEntry.updateMany({
    where: { status: 'DRAFT' },
    data: { status: 'POSTED' }
  });
  console.log(`Pólizas publicadas: ${eCount.count}`);

  const linesCount = await prisma.journalEntryLine.count();
  console.log(`Total de líneas contables: ${linesCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
