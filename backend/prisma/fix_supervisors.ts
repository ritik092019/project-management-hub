import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing supervisor assignments in SQLite Prisma DB...');
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in DB.`);
  
  const defaultSupervisor = users.find(u => u.role === 'SUPERVISOR' || u.role === 'ADMIN') || users[0];
  if (!defaultSupervisor) {
    console.log('No user found to set as supervisor.');
    return;
  }

  const projects = await prisma.project.findMany();
  for (const project of projects) {
    if (!project.supervisorId) {
      await prisma.project.update({
        where: { id: project.id },
        data: { supervisorId: defaultSupervisor.id }
      });
      console.log(`Updated project "${project.name}" (ID: ${project.id}) -> supervisor: ${defaultSupervisor.name}`);
    }
  }
  console.log('Successfully updated supervisor assignments!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
