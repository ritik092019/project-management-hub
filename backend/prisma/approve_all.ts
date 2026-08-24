import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    data: {
      isApproved: true,
      isActive: true,
    },
  });

  console.log(`✅ Approved and activated all existing ${result.count} users in dev.db!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
