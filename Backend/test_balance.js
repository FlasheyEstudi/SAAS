const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.accountingPeriod.findFirst({ where: { year: 2026, month: 5 }});
  if (!p) { console.log('Period 2026-05 not found!'); return; }
  console.log('Period:', p.id);

  const lines = await prisma.journalEntryLine.groupBy({
    by: ['accountId'],
    where: {
      journalEntry: {
        period: { year: 2026, month: 5 },
        status: 'POSTED'
      }
    },
    _sum: { debit: true, credit: true }
  });
  console.log('Aggregates length:', lines.length);
  console.log('Aggregates:', lines);
}
main().finally(() => prisma.$disconnect());
