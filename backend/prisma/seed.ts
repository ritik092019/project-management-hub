import { PrismaClient, UserRole, ProjectStatus, ApprovalStatus, Priority, ProjectCategory, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed with complete dummy dataset...');

  // Clean existing data in reverse dependency order
  await prisma.githubCache.deleteMany();
  await prisma.projectResource.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.approvalHistory.deleteMany();
  await prisma.projectReview.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.projectTechnology.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.technology.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Teams
  const coreEngTeam = await prisma.team.create({
    data: {
      name: 'Core Engineering',
      description: 'Primary platform, security, and core infrastructure engineering team',
      department: 'Engineering Leadership',
    },
  });

  const frontendTeam = await prisma.team.create({
    data: {
      name: 'Frontend Guild',
      description: 'UI/UX design systems and web application developers',
      department: 'Frontend & Platform',
    },
  });

  const devopsTeam = await prisma.team.create({
    data: {
      name: 'Cloud Ops & Security',
      description: 'DevOps, CI/CD pipelines, edge routing, and cloud reliability team',
      department: 'DevOps & Reliability',
    },
  });

  const aiTeam = await prisma.team.create({
    data: {
      name: 'AI & Data Platforms',
      description: 'Machine learning models, document intelligence, and big data pipelines',
      department: 'AI & Data Platforms',
    },
  });

  const productTeam = await prisma.team.create({
    data: {
      name: 'Product Management',
      description: 'Product strategy, user insights, and cohort analytics',
      department: 'Product Management',
    },
  });

  console.log('✅ Created 5 Teams');

  // 2. Create Users
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
      teamId: coreEngTeam.id,
    },
  });

  const supervisorVance = await prisma.user.create({
    data: {
      name: 'Dr. Robert Vance',
      email: 'supervisor@team.com',
      passwordHash: defaultPasswordHash,
      role: UserRole.SUPERVISOR,
      department: 'Core Infrastructure',
      title: 'Lead Solutions Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      isActive: true,
      teamId: coreEngTeam.id,
    },
  });

  const supervisorKim = await prisma.user.create({
    data: {
      name: 'David K. Kim',
      email: 'super2@team.com',
      passwordHash: defaultPasswordHash,
      role: UserRole.SUPERVISOR,
      department: 'AI & Data Platforms',
      title: 'Director of AI Infrastructure',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      isActive: true,
      teamId: aiTeam.id,
    },
  });

  const devChen = await prisma.user.create({
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

  const devThorne = await prisma.user.create({
    data: {
      name: 'Marcus Thorne',
      email: 'dev2@team.com',
      passwordHash: defaultPasswordHash,
      role: UserRole.DEVELOPER,
      department: 'Backend Services',
      title: 'Senior Distributed Systems Engineer',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      isActive: true,
      teamId: coreEngTeam.id,
    },
  });

  const devRostova = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'dev3@team.com',
      passwordHash: defaultPasswordHash,
      role: UserRole.DEVELOPER,
      department: 'DevOps & Reliability',
      title: 'Staff Site Reliability Engineer',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      isActive: true,
      teamId: devopsTeam.id,
    },
  });

  const viewerLin = await prisma.user.create({
    data: {
      name: 'Maya Lin',
      email: 'viewer@team.com',
      passwordHash: defaultPasswordHash,
      role: UserRole.VIEWER,
      department: 'Product Management',
      title: 'Lead Product Manager',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      isActive: true,
      teamId: productTeam.id,
    },
  });

  console.log('✅ Created 7 Users (Password for all: Password123!)');

  // 3. Create Technologies
  const techs = await Promise.all([
    prisma.technology.create({ data: { name: 'React', category: 'Frontend', icon: 'Atom' } }),
    prisma.technology.create({ data: { name: 'TypeScript', category: 'Language', icon: 'Code' } }),
    prisma.technology.create({ data: { name: 'NestJS', category: 'Backend', icon: 'Server' } }),
    prisma.technology.create({ data: { name: 'Spring Boot', category: 'Backend', icon: 'Cpu' } }),
    prisma.technology.create({ data: { name: 'Java 21', category: 'Language', icon: 'Coffee' } }),
    prisma.technology.create({ data: { name: 'PostgreSQL', category: 'Database', icon: 'Database' } }),
    prisma.technology.create({ data: { name: 'Prisma ORM', category: 'Database', icon: 'Layers' } }),
    prisma.technology.create({ data: { name: 'Tailwind CSS', category: 'Frontend', icon: 'Palette' } }),
    prisma.technology.create({ data: { name: 'Docker', category: 'DevOps', icon: 'Box' } }),
    prisma.technology.create({ data: { name: 'Kubernetes', category: 'DevOps', icon: 'Cloud' } }),
    prisma.technology.create({ data: { name: 'Redis', category: 'Database', icon: 'Zap' } }),
    prisma.technology.create({ data: { name: 'Python', category: 'Language', icon: 'Terminal' } }),
    prisma.technology.create({ data: { name: 'Go', category: 'Language', icon: 'FastForward' } }),
    prisma.technology.create({ data: { name: 'Kafka', category: 'Infrastructure', icon: 'Activity' } }),
    prisma.technology.create({ data: { name: 'gRPC', category: 'Networking', icon: 'Radio' } }),
  ]);

  const techMap = Object.fromEntries(techs.map((t) => [t.name, t.id]));
  console.log('✅ Created 15 Technologies');

  // 4. Create 10 Projects
  const proj1 = await prisma.project.create({
    data: {
      name: 'Cloud Microservices API Mesh',
      summary: 'High-throughput enterprise service mesh for distributed payment and billing events.',
      description:
        'A cloud-native microservice architecture built with Spring Boot and PostgreSQL, featuring gRPC inter-service communications, Redis distributed caching, and automated deployment pipelines via Docker & Kubernetes.',
      category: ProjectCategory.MICROSERVICE,
      ownerId: devThorne.id,
      supervisorId: supervisorVance.id,
      teamId: coreEngTeam.id,
      status: ProjectStatus.DEPLOYED,
      approvalStatus: ApprovalStatus.APPROVED,
      priority: Priority.HIGH,
      deploymentDate: new Date('2026-06-15'),
      testCoverage: 94.0,
      linesOfCode: 42800,
      githubUrl: 'https://github.com/enterprise-org/cloud-api-mesh',
      liveUrl: 'https://mesh.enterprise-internal.net',
      demoUrl: 'https://youtube.com/watch?v=mesh-demo',
      docsUrl: 'https://docs.enterprise-internal.net/api-mesh',
      documentationUrl: 'https://docs.enterprise-internal.net/api-mesh',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
      architectureUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      name: 'Real-Time Telemetry & Log Visualizer',
      summary: 'High-performance interactive dashboard tracking cluster metrics and server logs.',
      description:
        'Developed using React, TypeScript, and Tailwind CSS on the frontend with a WebSocket event stream. Integrated with PostgreSQL and Elasticsearch to perform real-time date filtering and aggregated log analytics.',
      category: ProjectCategory.WEB_APP,
      ownerId: devChen.id,
      supervisorId: supervisorKim.id,
      teamId: frontendTeam.id,
      status: ProjectStatus.DEPLOYED,
      approvalStatus: ApprovalStatus.APPROVED,
      priority: Priority.HIGH,
      deploymentDate: new Date('2026-07-02'),
      testCoverage: 91.0,
      linesOfCode: 28400,
      githubUrl: 'https://github.com/enterprise-org/telemetry-dash',
      liveUrl: 'https://telemetry.enterprise-internal.net',
      docsUrl: 'https://docs.enterprise-internal.net/telemetry',
      documentationUrl: 'https://docs.enterprise-internal.net/telemetry',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
      architectureUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    },
  });

  const proj3 = await prisma.project.create({
    data: {
      name: 'AI Document Intelligence Engine',
      summary: 'Automated OCR, text extraction, and smart semantic search for enterprise contracts.',
      description:
        'Integrates LLM models with PostgreSQL Vector (pgvector) and Spring Boot services. Extracts key clauses, risks, and metadata from thousands of PDF documents in seconds.',
      category: ProjectCategory.AI_ML,
      ownerId: devChen.id,
      supervisorId: supervisorKim.id,
      teamId: aiTeam.id,
      status: ProjectStatus.DEPLOYED,
      approvalStatus: ApprovalStatus.APPROVED,
      priority: Priority.HIGH,
      deploymentDate: new Date('2026-05-18'),
      testCoverage: 88.0,
      linesOfCode: 35100,
      githubUrl: 'https://github.com/enterprise-org/doc-ai-engine',
      liveUrl: 'https://docai.enterprise-internal.net',
      demoUrl: 'https://youtube.com/watch?v=docai-demo',
      docsUrl: 'https://docs.enterprise-internal.net/docai',
      documentationUrl: 'https://docs.enterprise-internal.net/docai',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
      architectureUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    },
  });

  const proj4 = await prisma.project.create({
    data: {
      name: 'Kubernetes GitOps Deployment Operator',
      summary: 'Automated CI/CD operator managing multi-region cluster state via Declarative Specs.',
      description:
        'A custom Kubernetes operator written in Go and Java Spring Boot. Automatically reconciles cluster states against target Git commits, triggers post-deployment canary testing, and emits audit logs to PostgreSQL.',
      category: ProjectCategory.DEV_TOOLS,
      ownerId: devRostova.id,
      supervisorId: supervisorVance.id,
      teamId: devopsTeam.id,
      status: ProjectStatus.DEPLOYED,
      approvalStatus: ApprovalStatus.APPROVED,
      priority: Priority.HIGH,
      deploymentDate: new Date('2026-04-10'),
      testCoverage: 96.0,
      linesOfCode: 19800,
      githubUrl: 'https://github.com/enterprise-org/k8s-gitops-operator',
      docsUrl: 'https://docs.enterprise-internal.net/gitops-operator',
      documentationUrl: 'https://docs.enterprise-internal.net/gitops-operator',
      imageUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=400&q=80',
      architectureUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80',
    },
  });

  const proj5 = await prisma.project.create({
    data: {
      name: 'Enterprise OAuth2 & JWT Auth Gateway',
      summary: 'Centralized Single-Sign-On (SSO) authority implementing RBAC, JWT, and MFA.',
      description:
        'Secure authentication provider supporting OAuth2 protocols, JWT issuing and validation, fine-grained Role-Based Access Control (Admin, Supervisor, Developer, Viewer), and NestJS security event logging.',
      category: ProjectCategory.MICROSERVICE,
      ownerId: devThorne.id,
      supervisorId: supervisorVance.id,
      teamId: coreEngTeam.id,
      status: ProjectStatus.DEPLOYED,
      approvalStatus: ApprovalStatus.APPROVED,
      priority: Priority.HIGH,
      deploymentDate: new Date('2026-01-22'),
      testCoverage: 98.0,
      linesOfCode: 24500,
      githubUrl: 'https://github.com/enterprise-org/auth-sso-gateway',
      liveUrl: 'https://sso.enterprise-internal.net',
      docsUrl: 'https://docs.enterprise-internal.net/auth-sso',
      documentationUrl: 'https://docs.enterprise-internal.net/auth-sso',
      imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80',
      architectureUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    },
  });

  const proj6 = await prisma.project.create({
    data: {
      name: 'FinTech Event Streaming Pipeline',
      summary: 'Sub-millisecond ledger reconciliation engine processing financial transactions.',
      description:
        'Distributed event processing pipeline utilizing Apache Kafka, Spring Boot microservices, and PostgreSQL partitioned tables. Features automated anomaly detection and fraud alerts.',
      category: ProjectCategory.INFRASTRUCTURE,
      ownerId: devThorne.id,
      supervisorId: adminUser.id,
      teamId: coreEngTeam.id,
      status: ProjectStatus.IN_PROGRESS,
      approvalStatus: ApprovalStatus.CHANGES_REQUESTED,
      priority: Priority.HIGH,
      deploymentDate: new Date('2026-07-28'),
      testCoverage: 85.0,
      linesOfCode: 31200,
      githubUrl: 'https://github.com/enterprise-org/ledger-event-stream',
      demoUrl: 'https://youtube.com/watch?v=ledger-preview',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80',
      architectureUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    },
  });

  const proj7 = await prisma.project.create({
    data: {
      name: 'Customer Success Insights Portal',
      summary: 'Analytics and cohort retention platform for enterprise account health.',
      description:
        'Built with React, Tailwind CSS, TypeScript, and NestJS REST APIs. Features customizable widget dashboards, CSV export, and filtered customer date activity metrics.',
      category: ProjectCategory.WEB_APP,
      ownerId: devChen.id,
      supervisorId: supervisorKim.id,
      teamId: frontendTeam.id,
      status: ProjectStatus.MAINTENANCE,
      approvalStatus: ApprovalStatus.APPROVED,
      priority: Priority.MEDIUM,
      deploymentDate: new Date('2025-11-15'),
      testCoverage: 89.0,
      linesOfCode: 22100,
      githubUrl: 'https://github.com/enterprise-org/cs-insights-portal',
      liveUrl: 'https://insights.enterprise-internal.net',
      docsUrl: 'https://docs.enterprise-internal.net/cs-insights',
      documentationUrl: 'https://docs.enterprise-internal.net/cs-insights',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
      architectureUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    },
  });

  const proj8 = await prisma.project.create({
    data: {
      name: 'Multi-Tenant Edge CDN Router',
      summary: 'Edge proxy providing dynamic route optimization and TLS termination.',
      description:
        'High-performance reverse proxy server deployed across 14 edge points. Built with Go, Docker, and PostgreSQL centralized configuration management.',
      category: ProjectCategory.INFRASTRUCTURE,
      ownerId: devRostova.id,
      supervisorId: supervisorVance.id,
      teamId: devopsTeam.id,
      status: ProjectStatus.DEPLOYED,
      approvalStatus: ApprovalStatus.APPROVED,
      priority: Priority.MEDIUM,
      deploymentDate: new Date('2026-03-05'),
      testCoverage: 92.0,
      linesOfCode: 17300,
      githubUrl: 'https://github.com/enterprise-org/edge-cdn-router',
      liveUrl: 'https://cdn.enterprise-internal.net',
      docsUrl: 'https://docs.enterprise-internal.net/edge-cdn',
      documentationUrl: 'https://docs.enterprise-internal.net/edge-cdn',
      imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80',
      architectureUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=800&q=80',
    },
  });

  const proj9 = await prisma.project.create({
    data: {
      name: 'IoT Fleet Maintenance Scanner',
      summary: 'Automated diagnostic hub scanning sensor telemetry from hardware devices.',
      description:
        'Currently undergoing load testing for IoT payload spikes. Connects MQTT broker queues with NestJS microservices and PostgreSQL time-series logs.',
      category: ProjectCategory.WEB_APP,
      ownerId: devThorne.id,
      supervisorId: supervisorKim.id,
      teamId: aiTeam.id,
      status: ProjectStatus.TESTING,
      approvalStatus: ApprovalStatus.PENDING_REVIEW,
      priority: Priority.MEDIUM,
      deploymentDate: new Date('2026-08-20'),
      testCoverage: 83.0,
      linesOfCode: 26900,
      githubUrl: 'https://github.com/enterprise-org/iot-fleet-scanner',
      demoUrl: 'https://youtube.com/watch?v=iot-scanner-preview',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
      architectureUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    },
  });

  const proj10 = await prisma.project.create({
    data: {
      name: 'Legacy Monolith Billing Service v1',
      summary: 'Former SOAP/XML billing platform safely archived following API Mesh migration.',
      description:
        'Legacy payment engine replaced by Cloud Microservices API Mesh. Retained in read-only maintenance mode for audit retention and historic reporting.',
      category: ProjectCategory.OTHER,
      ownerId: devChen.id,
      supervisorId: supervisorVance.id,
      teamId: coreEngTeam.id,
      status: ProjectStatus.ARCHIVED,
      approvalStatus: ApprovalStatus.APPROVED,
      priority: Priority.LOW,
      deploymentDate: new Date('2024-08-12'),
      testCoverage: 76.0,
      linesOfCode: 64200,
      githubUrl: 'https://github.com/enterprise-org/legacy-billing-v1',
      docsUrl: 'https://docs.enterprise-internal.net/legacy-billing',
      documentationUrl: 'https://docs.enterprise-internal.net/legacy-billing',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80',
      architectureUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    },
  });

  console.log('✅ Created 10 Projects');

  // 5. Link Project Technologies
  await prisma.projectTechnology.createMany({
    data: [
      { projectId: proj1.id, technologyId: techMap['Spring Boot'] },
      { projectId: proj1.id, technologyId: techMap['Java 21'] },
      { projectId: proj1.id, technologyId: techMap['PostgreSQL'] },
      { projectId: proj1.id, technologyId: techMap['Docker'] },
      { projectId: proj1.id, technologyId: techMap['Kubernetes'] },
      { projectId: proj1.id, technologyId: techMap['Redis'] },
      { projectId: proj1.id, technologyId: techMap['gRPC'] },

      { projectId: proj2.id, technologyId: techMap['React'] },
      { projectId: proj2.id, technologyId: techMap['TypeScript'] },
      { projectId: proj2.id, technologyId: techMap['Tailwind CSS'] },
      { projectId: proj2.id, technologyId: techMap['NestJS'] },
      { projectId: proj2.id, technologyId: techMap['PostgreSQL'] },

      { projectId: proj3.id, technologyId: techMap['Python'] },
      { projectId: proj3.id, technologyId: techMap['Spring Boot'] },
      { projectId: proj3.id, technologyId: techMap['PostgreSQL'] },
      { projectId: proj3.id, technologyId: techMap['React'] },

      { projectId: proj4.id, technologyId: techMap['Go'] },
      { projectId: proj4.id, technologyId: techMap['Kubernetes'] },
      { projectId: proj4.id, technologyId: techMap['Docker'] },
      { projectId: proj4.id, technologyId: techMap['PostgreSQL'] },

      { projectId: proj5.id, technologyId: techMap['NestJS'] },
      { projectId: proj5.id, technologyId: techMap['TypeScript'] },
      { projectId: proj5.id, technologyId: techMap['PostgreSQL'] },
      { projectId: proj5.id, technologyId: techMap['Redis'] },

      { projectId: proj6.id, technologyId: techMap['Kafka'] },
      { projectId: proj6.id, technologyId: techMap['Spring Boot'] },
      { projectId: proj6.id, technologyId: techMap['PostgreSQL'] },

      { projectId: proj7.id, technologyId: techMap['React'] },
      { projectId: proj7.id, technologyId: techMap['TypeScript'] },
      { projectId: proj7.id, technologyId: techMap['Tailwind CSS'] },

      { projectId: proj8.id, technologyId: techMap['Go'] },
      { projectId: proj8.id, technologyId: techMap['Docker'] },
      { projectId: proj8.id, technologyId: techMap['Redis'] },

      { projectId: proj9.id, technologyId: techMap['Python'] },
      { projectId: proj9.id, technologyId: techMap['NestJS'] },
      { projectId: proj9.id, technologyId: techMap['PostgreSQL'] },

      { projectId: proj10.id, technologyId: techMap['Java 21'] },
      { projectId: proj10.id, technologyId: techMap['PostgreSQL'] },
    ],
  });

  console.log('✅ Linked Project Technologies');

  // 6. Create Comments
  const cmt1 = await prisma.comment.create({
    data: {
      projectId: proj1.id,
      authorId: supervisorVance.id,
      content:
        'Great architecture design for gRPC inter-service mesh! @Marcus Thorne please verify load test latency under 50ms before final signoff.',
    },
  });

  await prisma.comment.create({
    data: {
      projectId: proj1.id,
      authorId: devThorne.id,
      parentId: cmt1.id,
      content:
        'Thanks @Dr. Robert Vance! Benchmark results show 38ms avg p99 latency across all 4 cluster nodes.',
    },
  });

  await prisma.comment.create({
    data: {
      projectId: proj6.id,
      authorId: adminUser.id,
      content:
        '@Marcus Thorne @Elena Rostova please review the Kafka schema registry compatibility mode. We need zero-downtime evolution.',
    },
  });

  await prisma.comment.create({
    data: {
      projectId: proj9.id,
      authorId: devChen.id,
      content: '@David K. Kim The MQTT load test payload simulator is ready for staging review.',
    },
  });

  console.log('✅ Created Seed Comments');

  // 7. Create Project Reviews
  await prisma.projectReview.create({
    data: {
      projectId: proj1.id,
      supervisorId: supervisorVance.id,
      approvalStatus: ApprovalStatus.APPROVED,
      feedbackText:
        'Comprehensive architecture spec with 94% unit test coverage. Latency benchmarks pass all enterprise SLA thresholds.',
      rating: 5,
    },
  });

  await prisma.projectReview.create({
    data: {
      projectId: proj6.id,
      supervisorId: adminUser.id,
      approvalStatus: ApprovalStatus.CHANGES_REQUESTED,
      feedbackText:
        'Kafka consumer groups require additional idempotency guards. Please raise test coverage to 90% before production deployment.',
      rating: 3,
      changesRequestedList: JSON.stringify([
        'Increase test coverage from 85% to 90%',
        'Implement idempotent message deduplication in Kafka consumer',
        'Add Prometheus lag metric alerts',
      ]),
    },
  });

  await prisma.projectReview.create({
    data: {
      projectId: supervisorKim.id ? proj9.id : proj1.id,
      supervisorId: supervisorKim.id,
      approvalStatus: ApprovalStatus.PENDING_REVIEW,
      feedbackText:
        'Initial build looks promising. Pending completion of IoT hardware stress tests before final deployment sign-off.',
      rating: 4,
    },
  });

  console.log('✅ Created Project Reviews');

  // 8. Create Activity Logs
  await prisma.activityLog.create({
    data: {
      projectId: proj1.id,
      actorId: supervisorVance.id,
      type: 'APPROVAL_CHANGE',
      description: 'changed approval status to APPROVED',
      details: 'Verified gRPC latency benchmarks & 94% test coverage.',
    },
  });

  await prisma.activityLog.create({
    data: {
      projectId: proj6.id,
      actorId: adminUser.id,
      type: 'APPROVAL_CHANGE',
      description: 'requested changes during project review',
      details: 'Requested test coverage increase and Kafka idempotency guards.',
    },
  });

  await prisma.activityLog.create({
    data: {
      projectId: proj1.id,
      actorId: devThorne.id,
      type: 'COMMENT',
      description: 'posted a reply comment mentioning @Dr. Robert Vance',
      details: 'Benchmark results show 38ms avg p99 latency.',
    },
  });

  console.log('✅ Created Activity Logs');

  // 9. Create Notifications
  await prisma.notification.create({
    data: {
      recipientId: devChen.id,
      actorId: supervisorKim.id,
      type: NotificationType.MENTION,
      title: 'Mentioned in Review',
      message: 'David K. Kim mentioned you in a project review note: "Please review the hardware stress test setup."',
      projectId: proj9.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: devThorne.id,
      actorId: adminUser.id,
      type: NotificationType.CHANGES_REQUESTED,
      title: 'Changes Requested',
      message: 'Sarah Jenkins set approval status to CHANGES REQUESTED for FinTech Event Streaming Pipeline.',
      projectId: proj6.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: supervisorVance.id,
      actorId: devThorne.id,
      type: NotificationType.COMMENT,
      title: 'New Reply',
      message: 'Marcus Thorne replied to your comment on Cloud Microservices API Mesh.',
      projectId: proj1.id,
      isRead: true,
    },
  });

  console.log('✅ Created Notifications');
  console.log('🎉 Full database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
