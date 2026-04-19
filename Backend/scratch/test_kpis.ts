import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({ where: { name: 'Grupo Alpha' } });
  if (!company) {
    console.log('Company not found');
    return;
  }
  
  console.log('Testing KPI endpoint for company:', company.id);
  
  try {
    const response = await fetch(`http://localhost:3001/api/dashboard/kpis?companyId=${company.id}`);
    const data = await response.json();
    console.log('KPI DATA:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('Fetch error:', err.message);
  }
}

main().finally(() => prisma.$disconnect());
