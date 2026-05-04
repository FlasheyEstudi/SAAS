const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:/home/flashey/Escritorio/SAAS/Backend/prisma/db/custom.db'
    }
  }
});

async function main() {
  const users = await prisma.user.findMany({ take: 5 });
  console.log('Users:', JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
