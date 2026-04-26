const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({
    include: { companies: true }
  });
  
  for (const user of users) {
    if (user.companyId) {
      const existing = await db.userCompany.findUnique({
        where: { userId_companyId: { userId: user.id, companyId: user.companyId } }
      });
      
      if (!existing) {
        await db.userCompany.create({
          data: {
            userId: user.id,
            companyId: user.companyId,
            role: 'OWNER'
          }
        });
        console.log(`Created membership for user ${user.email} in company ${user.companyId}`);
      } else {
         console.log(`Membership already exists for user ${user.email}`);
      }
    }
  }
}
main().catch(console.error).finally(() => db.$disconnect());
