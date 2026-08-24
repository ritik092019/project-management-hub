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
      where: { id: '022f2c08-46dd-4d9f-b0d9-906e9a322045' },
      data: { supervisorId: alokUser.id }
    });
    console.log(`Successfully updated supervisor for dfghsg to ${alokUser.name}!`);
  } else {
    console.log('Alok user not found in database.');
  }
}

main().finally(() => prisma.$disconnect());
