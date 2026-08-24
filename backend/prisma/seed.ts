import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting clean database seed (admin & technologies only, no dummy projects)...');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Core Team
  let coreEngTeam = await prisma.team.findUnique({ where: { name: 'Core Engineering' } });
  if (!coreEngTeam) {
    coreEngTeam = await prisma.team.create({
      data: {
        name: 'Core Engineering',
        description: 'Primary platform, security, and core infrastructure engineering team',
        department: 'Engineering Leadership',
      },
    });
  }

  // 2. Ensure Admin User
  let adminUser = await prisma.user.findUnique({ where: { email: 'ritikasthana092019@gmail.com' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        name: 'Ritika Asthana',
        email: 'ritikasthana092019@gmail.com',
        passwordHash: defaultPasswordHash,
        role: UserRole.ADMIN,
        department: 'Engineering Leadership',
        title: 'Project Lead & Sole Admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        isActive: true,
        isApproved: true,
        teamId: coreEngTeam.id,
      },
    });
  }

  // 3. Create Technologies
  const techNames = [
    { name: 'React', category: 'Frontend', icon: 'Atom' },
    { name: 'TypeScript', category: 'Language', icon: 'Code' },
    { name: 'NestJS', category: 'Backend', icon: 'Server' },
    { name: 'Spring Boot', category: 'Backend', icon: 'Cpu' },
    { name: 'Java 21', category: 'Language', icon: 'Coffee' },
    { name: 'PostgreSQL', category: 'Database', icon: 'Database' },
    { name: 'Prisma ORM', category: 'Database', icon: 'Layers' },
    { name: 'Tailwind CSS', category: 'Frontend', icon: 'Palette' },
    { name: 'Docker', category: 'DevOps', icon: 'Box' },
    { name: 'Kubernetes', category: 'DevOps', icon: 'Cloud' },
    { name: 'Redis', category: 'Database', icon: 'Zap' },
    { name: 'Python', category: 'Language', icon: 'Terminal' },
    { name: 'Go', category: 'Language', icon: 'FastForward' },
    { name: 'Kafka', category: 'Infrastructure', icon: 'Activity' },
    { name: 'gRPC', category: 'Networking', icon: 'Radio' },
  ];

  for (const t of techNames) {
    const existing = await prisma.technology.findUnique({ where: { name: t.name } });
    if (!existing) {
      await prisma.technology.create({ data: t });
    }
  }

  console.log('🎉 Clean seeding completed! No dummy projects or simulated data added.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
