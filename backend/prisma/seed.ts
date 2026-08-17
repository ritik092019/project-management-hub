import { PrismaClient, UserRole, ProjectStatus, ApprovalStatus, Priority, ProjectCategory } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed with authentication data...');

  // Clean existing data
  await prisma.projectTechnology.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.technology.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // Create Teams
  const coreEngineering = await prisma.team.create({
    data: {
      name: 'Core Engineering',
      description: 'Primary platform and core infrastructure engineering team',
      department: 'Engineering',
    },
  });

  const frontendTeam = await prisma.team.create({
    data: {
      name: 'Frontend Guild',
      description: 'UI/UX and modern Web Application developers',
      department: 'Product',
    },
  });

  const devopsTeam = await prisma.team.create({
    data: {
      name: 'Cloud Ops & Security',
      description: 'DevOps, CI/CD pipelines, and cloud reliability team',
      department: 'Infrastructure',
    },
  });

  console.log('✅ Created teams');

  // Create Users with Hashed Passwords
  const adminUser = await prisma.user.create({
    data: {
      name: 'Sarah Jenkins',
      email: 'admin@team.com',
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      department: 'Engineering Leadership',
      title: 'VP of Software Engineering',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      isActive: true,
      teamId: coreEngineering.id,
    },
  });

  const supervisorUser = await prisma.user.create({
    data: {
      name: 'Dr. Robert Vance',
      email: 'supervisor@team.com',
      passwordHash: defaultPasswordHash,
      role: UserRole.SUPERVISOR,
      department: 'Core Infrastructure',
      title: 'Lead Solutions Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      isActive: true,
      teamId: coreEngineering.id,
    },
  });

  const devUser1 = await prisma.user.create({
    data: {
      name: 'Alex Chen',
      email: 'developer@team.com',
      passwordHash: defaultPasswordHash,
      role: UserRole.DEVELOPER,
      department: 'Frontend & Platform',
      title: 'Senior Fullstack Developer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isActive: true,
      teamId: frontendTeam.id,
    },
  });

  const devUser2 = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'elena.r@company.com',
      passwordHash: defaultPasswordHash,
      role: UserRole.DEVELOPER,
      department: 'Infrastructure',
      title: 'DevOps Engineer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      isActive: true,
      teamId: devopsTeam.id,
    },
  });

  console.log('✅ Created users with bcrypt hashed passwords (Password: Password123!)');

  // Create Technologies
  const techs = await Promise.all([
    prisma.technology.create({ data: { name: 'React 19', category: 'Frontend', icon: 'Atom' } }),
    prisma.technology.create({ data: { name: 'TypeScript', category: 'Language', icon: 'Code' } }),
    prisma.technology.create({ data: { name: 'NestJS', category: 'Backend', icon: 'Server' } }),
    prisma.technology.create({ data: { name: 'PostgreSQL', category: 'Database', icon: 'Database' } }),
    prisma.technology.create({ data: { name: 'Prisma ORM', category: 'Database', icon: 'Layers' } }),
    prisma.technology.create({ data: { name: 'Tailwind CSS', category: 'Frontend', icon: 'Palette' } }),
    prisma.technology.create({ data: { name: 'Docker', category: 'DevOps', icon: 'Box' } }),
    prisma.technology.create({ data: { name: 'Kubernetes', category: 'DevOps', icon: 'Cloud' } }),
    prisma.technology.create({ data: { name: 'Redis', category: 'Database', icon: 'Zap' } }),
    prisma.technology.create({ data: { name: 'Python', category: 'Language', icon: 'Terminal' } }),
  ]);

  const techMap = Object.fromEntries(techs.map((t) => [t.name, t.id]));

  // Create Projects
  const proj1 = await prisma.project.create({
    data: {
      name: 'Project Management Hub',
      summary: 'Centralized developer repository and team dashboard',
      description:
        'Comprehensive dashboard for tracking company projects, architectural designs, deployment status, unit test coverage, and supervisor reviews.',
      category: ProjectCategory.WEB_APP,
      ownerId: devUser1.id,
      supervisorId: supervisorUser.id,
      teamId: frontendTeam.id,
      status: ProjectStatus.DEPLOYED,
      approvalStatus: ApprovalStatus.APPROVED,
      priority: Priority.HIGH,
      deploymentDate: new Date('2026-03-15'),
      expectedCompletionDate: new Date('2026-03-10'),
      actualCompletionDate: new Date('2026-03-15'),
      githubUrl: 'https://github.com/company/project-hub',
      liveUrl: 'https://hub.company.internal',
      demoUrl: 'https://demo.company.internal/project-hub',
      docsUrl: 'https://docs.company.internal/project-hub',
      documentationUrl: 'https://docs.company.internal/project-hub',
      testCoverage: 94.5,
      linesOfCode: 18450,
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      name: 'Cloud Microservices API Mesh',
      summary: 'High-throughput enterprise service mesh for billing events',
      description:
        'A cloud-native microservice architecture built with Spring Boot, NestJS, and PostgreSQL, featuring gRPC inter-service communications, Redis caching, and automated deployment pipelines.',
      category: ProjectCategory.MICROSERVICE,
      ownerId: devUser2.id,
      supervisorId: supervisorUser.id,
      teamId: devopsTeam.id,
      status: ProjectStatus.IN_PROGRESS,
      approvalStatus: ApprovalStatus.PENDING_REVIEW,
      priority: Priority.HIGH,
      deploymentDate: new Date('2026-06-15'),
      expectedCompletionDate: new Date('2026-06-30'),
      githubUrl: 'https://github.com/company/api-mesh',
      liveUrl: 'https://mesh.company.internal',
      docsUrl: 'https://docs.company.internal/api-mesh',
      documentationUrl: 'https://docs.company.internal/api-mesh',
      testCoverage: 88.0,
      linesOfCode: 24500,
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600',
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600',
    },
  });

  await prisma.projectTechnology.createMany({
    data: [
      { projectId: proj1.id, technologyId: techMap['React 19'] },
      { projectId: proj1.id, technologyId: techMap['TypeScript'] },
      { projectId: proj1.id, technologyId: techMap['NestJS'] },
      { projectId: proj1.id, technologyId: techMap['PostgreSQL'] },
      { projectId: proj1.id, technologyId: techMap['Prisma ORM'] },
      { projectId: proj2.id, technologyId: techMap['NestJS'] },
      { projectId: proj2.id, technologyId: techMap['PostgreSQL'] },
      { projectId: proj2.id, technologyId: techMap['Docker'] },
      { projectId: proj2.id, technologyId: techMap['Kubernetes'] },
      { projectId: proj2.id, technologyId: techMap['Redis'] },
    ],
  });

  console.log('✅ Created initial projects and technology links');
  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
