import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const testEmail = `newuser_${Date.now()}@example.com`;
  console.log(`Registering test user: ${testEmail}...`);

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test New Member',
      passwordHash,
      role: 'DEVELOPER',
      department: 'Frontend Engineering',
      title: 'Fullstack Dev',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isActive: false,
      isApproved: false,
    },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const pendingReq = await prisma.pendingRequest.create({
    data: {
      type: 'USER_REGISTRATION',
      targetId: user.id,
      payload: JSON.stringify({ userId: user.id, email: user.email, name: user.name, role: user.role }),
      token,
      status: 'PENDING',
      requestedBy: user.email,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Created Pending User:', user);
  console.log('✅ Created Pending Request Token:', pendingReq);

  const pendingRequests = await prisma.pendingRequest.findMany({
    where: { status: 'PENDING' },
  });
  console.log(`📊 Total Pending Requests in dev.db: ${pendingRequests.length}`, JSON.stringify(pendingRequests, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
