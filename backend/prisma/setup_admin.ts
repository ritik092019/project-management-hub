import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'ritikasthana092019@gmail.com';
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Ritika Asthana',
      role: UserRole.ADMIN,
      passwordHash: defaultPasswordHash,
      isActive: true,
      isApproved: true,
    },
    create: {
      name: 'Ritika Asthana',
      email: adminEmail,
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      department: 'Engineering Leadership',
      title: 'Project Lead & Sole Admin',
      isActive: true,
      isApproved: true,
    },
  });

  console.log('✅ Admin user set successfully in database:', admin);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
