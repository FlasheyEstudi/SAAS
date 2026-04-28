import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  const companies = await prisma.company.findMany()
  const memberships = await prisma.userCompany.findMany()
  
  console.log('Users:', JSON.stringify(users, null, 2))
  console.log('Companies:', JSON.stringify(companies, null, 2))
  console.log('Memberships:', JSON.stringify(memberships, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
