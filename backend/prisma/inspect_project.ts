import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const p = await prisma.project.findUnique({
    where: { id: '022f2c08-46dd-4d9f-b0d9-906e9a322045' },
    include: { owner: true, supervisor: true }
  });
  console.log('--- PROJECT INSPECTION ---');
  console.log(JSON.stringify(p, null, 2));

  const allProjects = await prisma.project.findMany({ include: { owner: true, supervisor: true } });
  console.log('--- ALL PROJECTS ---');
  console.log(JSON.stringify(allProjects, null, 2));
}

main().finally(() => prisma.$disconnect());
