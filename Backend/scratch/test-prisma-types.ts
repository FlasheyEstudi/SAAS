import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const companies = await prisma.company.findMany({
      where: {
        parentId: 'some-id'
      }
    });
    console.log('Success: parentId is available in Prisma Client');
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
