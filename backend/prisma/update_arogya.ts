import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const alokUser = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: 'Alok' } },
        { email: { contains: 'alok' } }
      ]
    }
  });

  if (alokUser) {
    console.log(`Found Alok user: ${alokUser.name} (${alokUser.id})`);
    await prisma.project.update({
      where: { id: '8c26f559-9e95-49dc-99c0-0d6840b681cc' },
      data: { supervisorId: alokUser.id }
    });
    console.log(`Successfully updated supervisor for arogya health care to ${alokUser.name}!`);
  } else {
    console.log('Alok user not found in DB');
  }
}

main().finally(() => prisma.$disconnect());
