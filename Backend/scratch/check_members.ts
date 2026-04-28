import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } })
  const memberships = await prisma.userCompany.findMany()
  
  console.log('Users:', users)
  console.log('Memberships:', memberships)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
