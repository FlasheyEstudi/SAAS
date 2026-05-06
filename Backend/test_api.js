const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.company.findFirst();
  console.log('Company:', c.id);
  const user = await prisma.user.findFirst({where: {role: 'ADMIN'}});
  // We need a valid token to bypass auth? The API uses requireAuth which decodes the token from cookies or auth headers.
  // Actually, wait! The frontend sends the request to /api/... 
  console.log('Done');
}
main().finally(() => prisma.$disconnect());
