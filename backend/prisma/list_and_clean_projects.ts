import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DUMMY_PROJECT_NAMES = [
  'Cloud Microservices API Mesh',
  'Real-Time Telemetry & Log Visualizer',
  'AI Document Intelligence Engine',
  'Kubernetes GitOps Deployment Operator',
  'Enterprise OAuth2 & JWT Auth Gateway',
  'FinTech Event Streaming Pipeline',
  'Customer Success Insights Portal',
  'Multi-Tenant Edge CDN Router',
  'IoT Fleet Maintenance Scanner',
  'Legacy Monolith Billing Service v1',
  'Enterprise Microservices Gateway',
  'Autonomous Drone Logistics Platform',
  'AI Pathology Diagnosis Assistant',
  'Quantum Financial Ledger',
  'BioSynth Gene Editing Pipeline',
  'OmniChannel Payment Engine',
  'AeroMesh Drone Flight Controller',
  'CyberShield Zero-Trust Gateway',
  'SolarGrid Energy Distribution Engine',
  'PulseHealth Telemedicine Engine'
];

async function main() {
  console.log('--- CURRENT PROJECTS IN DB BEFORE CLEANUP ---');
  const beforeProjects = await prisma.project.findMany();
  beforeProjects.forEach(p => console.log(`- ID: ${p.id} | Name: "${p.name}"`));

  // Delete dummy projects from database
  const deleted = await prisma.project.deleteMany({
    where: {
      OR: [
        { name: { in: DUMMY_PROJECT_NAMES } },
        { summary: { contains: 'High-throughput enterprise service mesh' } },
        { description: { contains: 'Legacy payment engine replaced' } }
      ]
    }
  });

  console.log(`Deleted ${deleted.count} dummy projects from SQLite DB.`);

  console.log('--- REMAINING USER PROJECTS IN DB ---');
  const remainingProjects = await prisma.project.findMany({ include: { owner: true, supervisor: true } });
  remainingProjects.forEach(p => console.log(`- ID: ${p.id} | Name: "${p.name}" | Owner: ${p.owner?.name} | Supervisor: ${p.supervisor?.name}`));
}

main().finally(() => prisma.$disconnect());
