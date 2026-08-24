import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const p = await prisma.project.findUnique({
    where: { id: '8c26f559-9e95-49dc-99c0-0d6840b681cc' },
    include: { owner: true, supervisor: true }
  });
  console.log('--- AROGYA HEALTH CARE INSPECTION ---');
  console.log(JSON.stringify(p, null, 2));
}

main().finally(() => prisma.$disconnect());
