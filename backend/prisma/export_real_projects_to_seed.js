const Database = require('../node_modules/better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'dev.db');
const db = new Database(dbPath);

const projects = db.prepare('SELECT * FROM projects').all();
console.log(`Exporting ${projects.length} real projects from dev.db to seed.ts...`);

const projectsFormatted = projects.map(p => ({
  name: p.name,
  summary: p.summary || '',
  description: p.description || p.summary || '',
  category: p.category || 'WEB_APP',
  ownerName: p.ownerName || 'Ritika Asthana',
  supervisorName: p.supervisorName || 'Dr. Anshu Singh Ma’am',
  status: p.status || 'DEPLOYED',
  approvalStatus: p.approvalStatus || 'APPROVED',
  priority: p.priority || 'MEDIUM',
  deploymentDate: p.deploymentDate ? new Date(p.deploymentDate).toISOString() : null,
  githubUrl: p.githubUrl || null,
  liveUrl: p.liveUrl || null,
  demoUrl: p.demoUrl || null,
  docsUrl: p.docsUrl || null,
  documentationUrl: p.documentationUrl || null,
  testCoverage: p.testCoverage || 0,
  linesOfCode: p.linesOfCode || 0,
  imageUrl: p.imageUrl || null,
  thumbnail: p.thumbnail || null,
  architectureUrl: p.architectureUrl || null,
}));

const seedTsContent = `import { PrismaClient, UserRole, ProjectStatus, ApprovalStatus, Priority, ProjectCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with real user projects...');

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

  // 4. Populate Real Projects
  const rawProjects = ${JSON.stringify(projectsFormatted, null, 2)};

  for (const projData of rawProjects) {
    const existing = await prisma.project.findFirst({ where: { name: projData.name } });
    if (!existing) {
      await prisma.project.create({
        data: {
          ...projData,
          category: projData.category as any,
          status: projData.status as any,
          approvalStatus: projData.approvalStatus as any,
          priority: projData.priority as any,
          ownerId: adminUser.id,
          supervisorId: adminUser.id,
          teamId: coreEngTeam.id,
        }
      });
      console.log(\`✅ Created real project: "\${projData.name}" (Owner: \${projData.ownerName})\`);
    }
  }

  console.log('🎉 Database seeding with all 12 real projects completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

fs.writeFileSync(path.resolve(__dirname, 'seed.ts'), seedTsContent);
console.log('Successfully updated backend/prisma/seed.ts with all 12 real projects!');
