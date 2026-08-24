import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({
    where: { name: { contains: 'treyjwe' } }
  });

  if (project) {
    console.log(`Found treyjwe project ID: ${project.id}`);
    
    // Find or create Alok Kumar as supervisor
    let alokUser = await prisma.user.findFirst({
      where: { OR: [{ name: { contains: 'Alok' } }, { email: { contains: 'alok' } }] }
    });

    if (!alokUser) {
      alokUser = await prisma.user.create({
        data: {
          name: 'Alok Kumar',
          email: 'alok@csjmu.ac.in',
          role: 'SUPERVISOR'
        }
      });
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { supervisorId: alokUser.id }
    });

    console.log(`Updated treyjwe supervisor to: ${alokUser.name}`);
  } else {
    console.log('treyjwe project not found');
  }
}

main().finally(() => prisma.$disconnect());
