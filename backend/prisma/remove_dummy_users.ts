import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DUMMY_EMAILS = [
  'supervisor@team.com',
  'super2@team.com',
  'developer@team.com',
  'dev2@team.com',
  'dev3@team.com',
  'viewer@team.com',
  'admin@team.com'
];

async function main() {
  console.log('Cleaning dummy users from SQLite DB...');
  const deleted = await prisma.user.deleteMany({
    where: {
      email: { in: DUMMY_EMAILS }
    }
  });

  console.log(`Deleted ${deleted.count} dummy user records from SQLite DB.`);
  const remaining = await prisma.user.findMany();
  console.log('Remaining registered users in DB:');
  remaining.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role}]`));
}

main().finally(() => prisma.$disconnect());
