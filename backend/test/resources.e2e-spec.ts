import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
const request = (supertest as any).default || supertest;
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import * as bcrypt from 'bcryptjs';

describe('Project Resources & GitHub Integration E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let supervisorToken: string;
  let developerToken: string;
  let viewerToken: string;

  let adminUserId: string;
  let supervisorUserId: string;
  let developerUserId: string;
  let viewerUserId: string;

  let projectId: string;
  let createdResourceId: string;

  jest.setTimeout(30000); // 30s timeout per test

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
    await app.listen(0);

    prisma = app.get<PrismaService>(PrismaService);

    // Clean test resources & cache
    await prisma.projectResource.deleteMany();
    await prisma.githubCache.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('Password123!', 10);

    // Create test users
    const admin = await prisma.user.create({
      data: {
        email: 'resource.admin@test.com',
        name: 'Resource Admin',
        role: 'ADMIN',
        passwordHash,
      },
    });
    adminUserId = admin.id;

    const supervisor = await prisma.user.create({
      data: {
        email: 'resource.supervisor@test.com',
        name: 'Resource Supervisor',
        role: 'SUPERVISOR',
        passwordHash,
      },
    });
    supervisorUserId = supervisor.id;

    const developer = await prisma.user.create({
      data: {
        email: 'resource.developer@test.com',
        name: 'Resource Developer',
        role: 'DEVELOPER',
        passwordHash,
      },
    });
    developerUserId = developer.id;

    const viewer = await prisma.user.create({
      data: {
        email: 'resource.viewer@test.com',
        name: 'Resource Viewer',
        role: 'VIEWER',
        passwordHash,
      },
    });
    viewerUserId = viewer.id;

    // Login users to obtain JWT tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'resource.admin@test.com', password: 'Password123!' });
    adminToken = adminLogin.body.data.token;

    const supLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'resource.supervisor@test.com', password: 'Password123!' });
    supervisorToken = supLogin.body.data.token;

    const devLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'resource.developer@test.com', password: 'Password123!' });
    developerToken = devLogin.body.data.token;

    const viewLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'resource.viewer@test.com', password: 'Password123!' });
    viewerToken = viewLogin.body.data.token;

    // Create a test project owned by developer and supervised by supervisor
    const project = await prisma.project.create({
      data: {
        name: 'Resource & GitHub Test Suite Project',
        description: 'Test project for validating upload, metadata, and GitHub integration',
        ownerId: developerUserId,
        supervisorId: supervisorUserId,
        status: 'IN_PROGRESS',
        approvalStatus: 'DRAFT',
        priority: 'HIGH',
        githubUrl: 'https://github.com/facebook/react',
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.projectResource.deleteMany();
    await prisma.githubCache.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('File Upload & Validation', () => {
    it('should reject file upload without authentication (401)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/files/projects/${projectId}/upload`)
        .attach('file', Buffer.from('dummy content'), 'test.png')
        .expect(401);
    });

    it('should reject file upload for unsupported MIME type (400)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/files/projects/${projectId}/upload`)
        .set('Authorization', `Bearer ${developerToken}`)
        .attach('file', Buffer.from('malicious script'), 'script.exe');

      expect(res.status).toBe(400);
      const errText = res.body.error || res.body.message || JSON.stringify(res.body);
      expect(errText).toContain('Unsupported file type');
    });

    it('should allow project owner (developer) to upload screenshot file', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/files/projects/${projectId}/upload`)
        .set('Authorization', `Bearer ${developerToken}`)
        .field('type', 'SCREENSHOT')
        .field('description', 'Dashboard UI Screenshot mock')
        .attach('file', Buffer.from('fake image data'), 'dashboard.png')
        .expect(201);

      const data = res.body.data;
      expect(data).toBeDefined();
      expect(data.projectId).toBe(projectId);
      expect(data.originalName).toBe('dashboard.png');
      expect(data.type).toBe('SCREENSHOT');
      expect(data.storageUrl).toBeDefined();
      expect(data.description).toBe('Dashboard UI Screenshot mock');

      createdResourceId = data.id;
    });

    it('should allow supervisor to upload architecture diagram PDF', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/files/projects/${projectId}/upload`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .field('type', 'ARCHITECTURE_DIAGRAM')
        .field('description', 'System Architecture Spec PDF')
        .attach('file', Buffer.from('%PDF-1.4 test architecture doc'), 'architecture.pdf')
        .expect(201);

      expect(res.body.data.type).toBe('ARCHITECTURE_DIAGRAM');
      expect(res.body.data.originalName).toBe('architecture.pdf');
    });

    it('should reject file upload for user with VIEWER role (403)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/files/projects/${projectId}/upload`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .attach('file', Buffer.from('fake image data'), 'unauthorized.png')
        .expect(403);
    });
  });

  describe('Resource Management APIs', () => {
    it('should list all resources for the project', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/files/projects/${projectId}`)
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);

      const list = res.body.data;
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(2);
    });

    it('should retrieve a single resource by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/files/${createdResourceId}`)
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(createdResourceId);
      expect(res.body.data.originalName).toBe('dashboard.png');
    });

    it('should update metadata (type, description) of an existing resource', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/files/${createdResourceId}`)
        .set('Authorization', `Bearer ${developerToken}`)
        .send({
          type: 'SCREENSHOT',
          description: 'Updated description for dashboard screenshot',
        })
        .expect(200);

      expect(res.body.data.description).toBe('Updated description for dashboard screenshot');
    });

    it('should prevent unauthorized viewer from deleting a resource (403)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/files/${createdResourceId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });

    it('should allow project owner to delete resource file', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/files/${createdResourceId}`)
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);

      // Verify deletion from DB
      await request(app.getHttpServer())
        .get(`/api/v1/files/${createdResourceId}`)
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(404);
    });
  });

  describe('GitHub API Integration', () => {
    it('should reject invalid GitHub URL format (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/github/repo?url=invalid_url_without_slashes')
        .expect(400);
    });

    it('should fetch public GitHub repository details by URL query', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/github/repo?url=https://github.com/facebook/react')
        .expect(200);

      const data = res.body.data;
      expect(data).toBeDefined();
      expect(data.owner).toBe('facebook');
      expect(data.name).toBe('react');
      expect(typeof data.stars).toBe('number');
      expect(typeof data.forks).toBe('number');
      expect(Array.isArray(data.topLanguages)).toBe(true);
      expect(Array.isArray(data.contributors)).toBe(true);
    });

    it('should fetch project GitHub repository information by project ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/github/projects/${projectId}/repo`)
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);

      const data = res.body.data;
      expect(data).toBeDefined();
      expect(data.name).toBe('react');
      expect(data.repoUrl).toContain('github.com/');
    });

    it('should serve cached GitHub data on consecutive requests for the same project', async () => {
      const res1 = await request(app.getHttpServer())
        .get(`/api/v1/github/projects/${projectId}/repo`)
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);

      const res2 = await request(app.getHttpServer())
        .get(`/api/v1/github/projects/${projectId}/repo`)
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);

      expect(res1.body.data.name).toBe(res2.body.data.name);
      expect(res2.body.data.cachedAt).toBeDefined();
    });

    it('should return 404 when querying non-existent GitHub repository', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/github/repo?url=https://github.com/nonexistent_org_99999/nonexistent_repo_99999')
        .expect(404);
    });
  });
});
