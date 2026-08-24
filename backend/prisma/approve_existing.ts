import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    data: {
      isApproved: true,
      isActive: true,
    },
  });
  console.log('✅ Successfully updated existing users to isApproved=true:', result);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
