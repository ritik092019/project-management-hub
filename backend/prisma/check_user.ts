import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isApproved: true,
      isActive: true,
      createdAt: true,
    },
  });
  console.log('📊 Current Users in dev.db:', JSON.stringify(users, null, 2));

  const pendingRequests = await prisma.pendingRequest.findMany();
  console.log('📋 Current Pending Requests in dev.db:', JSON.stringify(pendingRequests, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
