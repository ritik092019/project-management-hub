import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Populating ownerName and supervisorName for existing projects...');
  const projects = await prisma.project.findMany({
    include: { owner: true, supervisor: true }
  });

  for (const p of projects) {
    const ownerNameVal = (p as any).ownerName || p.owner?.name || 'Ritik asthana';
    const supervisorNameVal = (p as any).supervisorName || p.supervisor?.name || 'Alok Kumar';

    await prisma.project.update({
      where: { id: p.id },
      data: {
        ownerName: ownerNameVal,
        supervisorName: supervisorNameVal
      } as any
    });

    console.log(`Updated Project "${p.name}" (ID: ${p.id}):`);
    console.log(`  -> ownerName: "${ownerNameVal}"`);
    console.log(`  -> supervisorName: "${supervisorNameVal}"`);
  }

  console.log('Done populating ownerName and supervisorName!');
}

main().finally(() => prisma.$disconnect());
