import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultUrls: Record<string, { githubUrl?: string; liveUrl?: string; demoUrl?: string; docsUrl?: string }> = {
  'proj-101': {
    githubUrl: 'https://github.com/enterprise-org/cloud-api-mesh',
    liveUrl: 'https://mesh.enterprise-internal.net',
    demoUrl: 'https://youtube.com/watch?v=mesh-demo',
    docsUrl: 'https://docs.enterprise-internal.net/api-mesh'
  },
  'proj-102': {
    githubUrl: 'https://github.com/enterprise-org/telemetry-dash',
    liveUrl: 'https://telemetry.enterprise-internal.net',
    docsUrl: 'https://docs.enterprise-internal.net/telemetry'
  },
  'proj-103': {
    githubUrl: 'https://github.com/enterprise-org/doc-ai-engine',
    liveUrl: 'https://docai.enterprise-internal.net',
    demoUrl: 'https://youtube.com/watch?v=docai-demo',
    docsUrl: 'https://docs.enterprise-internal.net/docai'
  },
  'proj-104': {
    githubUrl: 'https://github.com/enterprise-org/k8s-gitops-operator',
    liveUrl: 'https://gitops.enterprise-internal.net',
    docsUrl: 'https://docs.enterprise-internal.net/gitops-operator'
  },
  'proj-105': {
    githubUrl: 'https://github.com/enterprise-org/oauth2-jwt-gateway',
    liveUrl: 'https://auth.enterprise-internal.net',
    docsUrl: 'https://docs.enterprise-internal.net/auth-gateway'
  }
};

async function main() {
  console.log('Populating URL columns in SQLite Prisma DB...');
  const projects = await prisma.project.findMany();
  for (const project of projects) {
    const defaults = defaultUrls[project.id] || {
      githubUrl: `https://github.com/enterprise-org/${project.name.toLowerCase().replace(/[^a-z0-0]/g, '-')}`,
      liveUrl: `https://${project.name.toLowerCase().replace(/[^a-z0-0]/g, '-')}.enterprise-internal.net`,
      docsUrl: `https://docs.enterprise-internal.net/${project.name.toLowerCase().replace(/[^a-z0-0]/g, '-')}`
    };

    await prisma.project.update({
      where: { id: project.id },
      data: {
        githubUrl: project.githubUrl || defaults.githubUrl,
        liveUrl: project.liveUrl || defaults.liveUrl,
        demoUrl: project.demoUrl || defaults.demoUrl,
        docsUrl: project.docsUrl || defaults.docsUrl,
        documentationUrl: project.documentationUrl || project.docsUrl || defaults.docsUrl,
      }
    });
  }
  console.log('Successfully updated project URLs in SQLite database!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
