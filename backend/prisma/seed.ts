import { PrismaClient, UserRole, ProjectStatus, ApprovalStatus, Priority, ProjectCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed (admin, technologies, and sample projects)...');

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

  // 4. Create Initial Sample Projects if none exist
  const existingProjectsCount = await prisma.project.count();
  if (existingProjectsCount === 0) {
    console.log('🚀 Creating initial sample projects for portfolio dashboard...');

    const sampleProjects = [
      {
        name: 'Team Project Hub Dashboard',
        summary: 'Centralized web platform for project governance, supervisor reviews, and live metrics.',
        description: 'A comprehensive full-stack enterprise dashboard built with React 19, NestJS, and PostgreSQL. Enables multi-role project submissions, automated approval workflows, supervisor feedback, and real-time collaboration.',
        category: ProjectCategory.WEB_APP,
        ownerId: adminUser.id,
        ownerName: adminUser.name,
        supervisorId: adminUser.id,
        supervisorName: adminUser.name,
        teamId: coreEngTeam.id,
        status: ProjectStatus.DEPLOYED,
        approvalStatus: ApprovalStatus.APPROVED,
        priority: Priority.HIGH,
        githubUrl: 'https://github.com/ritik092019/project-management-hub',
        liveUrl: 'https://project-hub-frontend-05j3.onrender.com',
        testCoverage: 94.5,
        linesOfCode: 18450,
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      },
      {
        name: 'AI Code Review Assistant',
        summary: 'LLM-powered automated code quality & security compliance analyzer.',
        description: 'Intelligent AI service integrating Google Gemini 2.5 Flash to automatically inspect pull requests, detect architectural anti-patterns, and provide immediate refactoring recommendations.',
        category: ProjectCategory.AI_ML,
        ownerId: adminUser.id,
        ownerName: adminUser.name,
        supervisorId: adminUser.id,
        supervisorName: adminUser.name,
        teamId: coreEngTeam.id,
        status: ProjectStatus.IN_PROGRESS,
        approvalStatus: ApprovalStatus.APPROVED,
        priority: Priority.HIGH,
        githubUrl: 'https://github.com/ritik092019/ai-code-reviewer',
        testCoverage: 88.0,
        linesOfCode: 12300,
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
      },
      {
        name: 'High-Throughput API Gateway',
        summary: 'Resilient Microservices Gateway with JWT Auth & Distributed Rate Limiting.',
        description: 'Cloud-native API gateway built with NestJS and Redis, handling authentication, CORS security, request proxying, and distributed token-bucket rate limiting for microservice clusters.',
        category: ProjectCategory.MICROSERVICE,
        ownerId: adminUser.id,
        ownerName: adminUser.name,
        supervisorId: adminUser.id,
        supervisorName: adminUser.name,
        teamId: coreEngTeam.id,
        status: ProjectStatus.DEPLOYED,
        approvalStatus: ApprovalStatus.APPROVED,
        priority: Priority.MEDIUM,
        githubUrl: 'https://github.com/ritik092019/api-gateway',
        testCoverage: 96.2,
        linesOfCode: 9800,
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
      },
      {
        name: 'Real-Time Event Analytics Pipeline',
        summary: 'Streaming data processing system capturing and visualizing telemetry metrics.',
        description: 'Distributed event processing pipeline using Apache Kafka, WebSockets, and Recharts. Stream real-time app telemetry with low latency and instant visual dashboards.',
        category: ProjectCategory.INFRASTRUCTURE,
        ownerId: adminUser.id,
        ownerName: adminUser.name,
        supervisorId: adminUser.id,
        supervisorName: adminUser.name,
        teamId: coreEngTeam.id,
        status: ProjectStatus.TESTING,
        approvalStatus: ApprovalStatus.APPROVED,
        priority: Priority.MEDIUM,
        githubUrl: 'https://github.com/ritik092019/event-analytics',
        testCoverage: 91.0,
        linesOfCode: 14200,
        imageUrl: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800',
      },
    ];

    for (const projData of sampleProjects) {
      await prisma.project.create({ data: projData });
    }
    console.log('✅ Created 4 sample portfolio projects successfully!');
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
