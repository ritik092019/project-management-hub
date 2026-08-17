import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
const request = (supertest as any).default || supertest;
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import * as bcrypt from 'bcryptjs';

describe('Projects Module E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let supervisorToken: string;
  let developerToken: string;

  let adminUserId: string;
  let supervisorUserId: string;
  let developerUserId: string;

  let teamId: string;
  let technologyId: string;
  let projectId: string;
  let ownedProjectId: string;

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
    prisma = app.get<PrismaService>(PrismaService);

    const hash = await bcrypt.hash('Password123!', 10);

    // Clean up test data
    await prisma.projectTechnology.deleteMany({ where: { project: { name: { startsWith: 'E2E Test' } } } });
    await prisma.project.deleteMany({ where: { name: { startsWith: 'E2E Test' } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: '@e2etest.local' } } });
    await prisma.team.deleteMany({ where: { name: { startsWith: 'E2E Team' } } });
    await prisma.technology.deleteMany({ where: { name: { startsWith: 'E2ETech' } } });

    // Create test team
    const team = await prisma.team.create({
      data: { name: 'E2E Team Alpha', description: 'E2E Test Team', department: 'QA' },
    });
    teamId = team.id;

    // Create test technology
    const technology = await prisma.technology.create({
      data: { name: 'E2ETech React', category: 'Frontend', icon: 'Code' },
    });
    technologyId = technology.id;

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: 'E2E Admin',
        email: 'admin@e2etest.local',
        passwordHash: hash,
        role: 'ADMIN',
        isActive: true,
      },
    });
    adminUserId = admin.id;

    // Create supervisor user
    const supervisor = await prisma.user.create({
      data: {
        name: 'E2E Supervisor',
        email: 'supervisor@e2etest.local',
        passwordHash: hash,
        role: 'SUPERVISOR',
        isActive: true,
        teamId,
      },
    });
    supervisorUserId = supervisor.id;

    // Create developer user
    const developer = await prisma.user.create({
      data: {
        name: 'E2E Developer',
        email: 'developer@e2etest.local',
        passwordHash: hash,
        role: 'DEVELOPER',
        isActive: true,
        teamId,
      },
    });
    developerUserId = developer.id;

    // Login to get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@e2etest.local', password: 'Password123!' });
    adminToken = adminLogin.body.data?.token;

    const supervisorLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'supervisor@e2etest.local', password: 'Password123!' });
    supervisorToken = supervisorLogin.body.data?.token;

    const devLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'developer@e2etest.local', password: 'Password123!' });
    developerToken = devLogin.body.data?.token;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.projectTechnology.deleteMany({ where: { project: { name: { startsWith: 'E2E Test' } } } });
    await prisma.project.deleteMany({ where: { name: { startsWith: 'E2E Test' } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: '@e2etest.local' } } });
    await prisma.team.deleteMany({ where: { name: { startsWith: 'E2E Team' } } });
    await prisma.technology.deleteMany({ where: { name: { startsWith: 'E2ETech' } } });
    await app.close();
  });

  // =====================================
  // GET /api/v1/projects
  // =====================================
  describe('GET /api/v1/projects (Public List with Filtering)', () => {
    it('should return paginated project list without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?page=1&limit=10')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('meta');
      expect(res.body.data.meta).toHaveProperty('total');
      expect(res.body.data.meta).toHaveProperty('page');
      expect(res.body.data.meta).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should filter by search query on name and description', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?search=Project+Management+Hub')
        .expect(200);

      expect(res.body.success).toBe(true);
      const items = res.body.data.items;
      if (items.length > 0) {
        const names = items.map((p: any) => p.name.toLowerCase());
        expect(names.some((n: string) => n.includes('project management'))).toBe(true);
      }
    });

    it('should return default pagination (page 1, limit 10)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .expect(200);

      expect(res.body.data.meta.page).toBe(1);
      expect(res.body.data.meta.limit).toBe(10);
    });

    it('should accept custom page and limit parameters', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?page=1&limit=5')
        .expect(200);

      expect(res.body.data.meta.page).toBe(1);
      expect(res.body.data.meta.limit).toBe(5);
      expect(res.body.data.items.length).toBeLessThanOrEqual(5);
    });

    it('should filter by status=DEPLOYED', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?status=DEPLOYED')
        .expect(200);

      const items = res.body.data.items;
      items.forEach((p: any) => {
        expect(p.status).toBe('DEPLOYED');
      });
    });

    it('should filter by category=WEB_APP', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?category=WEB_APP')
        .expect(200);

      const items = res.body.data.items;
      items.forEach((p: any) => {
        expect(p.category).toBe('WEB_APP');
      });
    });

    it('should filter by priority=HIGH', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?priority=HIGH')
        .expect(200);

      const items = res.body.data.items;
      items.forEach((p: any) => {
        expect(p.priority).toBe('HIGH');
      });
    });

    it('should filter by date range using from and to', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?from=2026-01-01&to=2026-12-31')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('items');
    });

    it('should sort by name ascending', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?sortBy=name&sortOrder=asc&limit=5')
        .expect(200);

      const items = res.body.data.items;
      if (items.length > 1) {
        const names = items.map((p: any) => p.name.toLowerCase());
        const sorted = [...names].sort();
        expect(names).toEqual(sorted);
      }
    });

    it('should sort by createdAt descending', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?sortBy=createdAt&sortOrder=desc&limit=5')
        .expect(200);

      expect(res.body.success).toBe(true);
      const items = res.body.data.items;
      if (items.length > 1) {
        for (let i = 1; i < items.length; i++) {
          expect(new Date(items[i - 1].createdAt).getTime()).toBeGreaterThanOrEqual(
            new Date(items[i].createdAt).getTime()
          );
        }
      }
    });
  });

  // =====================================
  // POST /api/v1/projects (Create)
  // =====================================
  describe('POST /api/v1/projects (Create Project)', () => {
    it('should reject project creation without authentication', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .send({ name: 'E2E Test Unauthorized Project', description: 'Test' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should create a project as Developer with all required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${developerToken}`)
        .send({
          name: 'E2E Test Project Alpha',
          description: 'E2E test project description for comprehensive testing purposes',
          category: 'WEB_APP',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          technologyIds: [technologyId],
          deploymentDate: '2026-10-15',
          githubUrl: 'https://github.com/test/e2e-project',
          testCoverage: 85.0,
          linesOfCode: 12000,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('E2E Test Project Alpha');
      expect(res.body.data.category).toBe('WEB_APP');
      expect(res.body.data.priority).toBe('HIGH');
      expect(res.body.data.techStack).toContain('E2ETech React');

      ownedProjectId = res.body.data.id;
    });

    it('should create a project as Admin with explicit owner assignment', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E Test Project Beta - Admin Created',
          description: 'Admin created project for full E2E testing',
          category: 'MICROSERVICE',
          priority: 'MEDIUM',
          ownerId: developerUserId,
          supervisorId: supervisorUserId,
          teamId,
          technologyIds: [technologyId],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      projectId = res.body.data.id;
      expect(res.body.data.name).toContain('E2E Test Project Beta');
      expect(res.body.data.category).toBe('MICROSERVICE');
    });

    it('should reject project creation with missing required name field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${developerToken}`)
        .send({ description: 'Missing name field' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject project creation with invalid category enum value', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${developerToken}`)
        .send({
          name: 'E2E Test Invalid Category',
          description: 'Project with invalid category',
          category: 'INVALID_CATEGORY',
        })
      expect(res.status).toBe(400);
    });

    it('should reject project creation for VIEWER role', async () => {
      // Create a viewer user
      const hash = await bcrypt.hash('Password123!', 10);
      const viewer = await prisma.user.create({
        data: {
          name: 'E2E Viewer',
          email: 'viewer@e2etest.local',
          passwordHash: hash,
          role: 'VIEWER',
          isActive: true,
        },
      });

      const viewerLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'viewer@e2etest.local', password: 'Password123!' });
      const viewerToken = viewerLogin.body.data?.token;

      const res = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'E2E Test Viewer Project',
          description: 'Should be rejected',
        })
        .expect(403);

      expect(res.body.success).toBe(false);
      await prisma.user.delete({ where: { id: viewer.id } });
    });
  });

  // =====================================
  // GET /api/v1/projects/:id (Fetch one)
  // =====================================
  describe('GET /api/v1/projects/:id (Get Project by ID)', () => {
    it('should retrieve a project by ID without authentication', async () => {
      if (!projectId) return;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(projectId);
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('category');
      expect(res.body.data).toHaveProperty('techStack');
    });

    it('should return 404 for non-existent project ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // =====================================
  // PATCH /api/v1/projects/:id (Update)
  // =====================================
  describe('PATCH /api/v1/projects/:id (Update Project)', () => {
    it('should allow Developer to update their own project', async () => {
      if (!ownedProjectId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${ownedProjectId}`)
        .set('Authorization', `Bearer ${developerToken}`)
        .send({
          name: 'E2E Test Project Alpha - Updated',
          testCoverage: 92.5,
          status: 'TESTING',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('E2E Test Project Alpha - Updated');
      expect(res.body.data.testCoverage).toBe(92.5);
      expect(res.body.data.status).toBe('TESTING');
    });

    it('should forbid Developer from updating another developer\'s project', async () => {
      if (!projectId) return;

      // Create another developer who doesn't own projectId
      const hash = await bcrypt.hash('Password123!', 10);
      const otherDev = await prisma.user.create({
        data: {
          name: 'E2E Other Developer',
          email: 'otherdev@e2etest.local',
          passwordHash: hash,
          role: 'DEVELOPER',
          isActive: true,
        },
      });

      const otherLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'otherdev@e2etest.local', password: 'Password123!' });
      const otherToken = otherLogin.body.data?.token;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'E2E Test Unauthorized Update' })
        .expect(403);

      expect(res.body.success).toBe(false);
      await prisma.user.delete({ where: { id: otherDev.id } });
    });

    it('should allow Admin to update any project', async () => {
      if (!projectId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'E2E Test Project Beta - Admin Updated',
          linesOfCode: 25000,
          priority: 'HIGH',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.priority).toBe('HIGH');
      expect(res.body.data.linesOfCode).toBe(25000);
    });

    it('should allow Supervisor to update assigned project', async () => {
      if (!projectId) return;

      // projectId has supervisorId = supervisorUserId
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ testCoverage: 88.0 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.testCoverage).toBe(88.0);
    });
  });

  // =====================================
  // POST /api/v1/projects/:id/submit
  // =====================================
  describe('POST /api/v1/projects/:id/submit (Submit for Review)', () => {
    it('should allow project owner to submit for review', async () => {
      if (!ownedProjectId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${ownedProjectId}/submit`)
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.approvalStatus).toBe('SUBMITTED');
    });

    it('should reject submit for review without auth', async () => {
      if (!ownedProjectId) return;

      await request(app.getHttpServer())
        .post(`/api/v1/projects/${ownedProjectId}/submit`)
        .expect(401);
    });
  });

  // =====================================
  // PATCH /api/v1/projects/:id/status
  // =====================================
  describe('PATCH /api/v1/projects/:id/status (Update Status)', () => {
    it('should allow Admin to update project status', async () => {
      if (!projectId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'DEPLOYED', approvalStatus: 'APPROVED' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DEPLOYED');
      expect(res.body.data.approvalStatus).toBe('APPROVED');
    });

    it('should allow Supervisor to update project approval status', async () => {
      if (!projectId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${projectId}/status`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ approvalStatus: 'CHANGES_REQUESTED' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.approvalStatus).toBe('CHANGES_REQUESTED');
    });
  });

  // =====================================
  // PATCH /api/v1/projects/:id/supervisor
  // =====================================
  describe('PATCH /api/v1/projects/:id/supervisor (Assign Supervisor)', () => {
    it('should allow Admin to assign supervisor', async () => {
      if (!ownedProjectId || !supervisorUserId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${ownedProjectId}/supervisor`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ supervisorId: supervisorUserId })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should forbid Developer from assigning supervisor', async () => {
      if (!ownedProjectId || !supervisorUserId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${ownedProjectId}/supervisor`)
        .set('Authorization', `Bearer ${developerToken}`)
        .send({ supervisorId: supervisorUserId })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  // =====================================
  // PATCH /api/v1/projects/:id/team
  // =====================================
  describe('PATCH /api/v1/projects/:id/team (Assign Team)', () => {
    it('should allow Admin to assign team', async () => {
      if (!ownedProjectId || !teamId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${ownedProjectId}/team`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teamId })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 404 when assigning non-existent team', async () => {
      if (!ownedProjectId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/projects/${ownedProjectId}/team`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ teamId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // =====================================
  // POST /api/v1/projects/:id/technologies
  // DELETE /api/v1/projects/:id/technologies/:techId
  // =====================================
  describe('Technology Management Endpoints', () => {
    it('should add technologies to a project', async () => {
      if (!ownedProjectId || !technologyId) return;

      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${ownedProjectId}/technologies`)
        .set('Authorization', `Bearer ${developerToken}`)
        .send({ technologyIds: [technologyId] })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.techStack).toContain('E2ETech React');
    });

    it('should remove a technology from a project', async () => {
      if (!ownedProjectId || !technologyId) return;

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/projects/${ownedProjectId}/technologies/${technologyId}`)
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // =====================================
  // DELETE /api/v1/projects/:id
  // =====================================
  describe('DELETE /api/v1/projects/:id (Delete Project)', () => {
    it('should allow owner (Developer) to delete their own project', async () => {
      if (!ownedProjectId) return;

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/projects/${ownedProjectId}`)
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 404 for deleting already deleted project', async () => {
      if (!ownedProjectId) return;

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/projects/${ownedProjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('should allow Admin to delete any project', async () => {
      if (!projectId) return;

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject deletion without authentication', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/projects/some-project-id')
        .expect(401);
    });
  });

  // =====================================
  // Advanced Filtering Tests
  // =====================================
  describe('Advanced Filtering & Pagination', () => {
    let filteredProjectId: string;

    beforeAll(async () => {
      const techRes = await prisma.technology.findFirst({ where: { name: { startsWith: 'E2ETech' } } });
      const owner = await prisma.user.findFirst({ where: { email: 'developer@e2etest.local' } });
      if (!owner) return;

      const proj = await prisma.project.create({
        data: {
          name: 'E2E Test Filtered Project',
          description: 'A project used for filtering tests',
          summary: 'E2E filtering test project',
          category: 'AI_ML',
          status: 'IN_PROGRESS',
          priority: 'LOW',
          approvalStatus: 'PENDING_REVIEW',
          ownerId: owner.id,
          supervisorId: supervisorUserId,
          teamId,
          deploymentDate: new Date('2026-09-01'),
          testCoverage: 70.0,
          linesOfCode: 8000,
          ...(techRes ? {
            technologies: {
              create: [{ technologyId: techRes.id }],
            },
          } : {}),
        },
      });
      filteredProjectId = proj.id;
    });

    afterAll(async () => {
      if (filteredProjectId) {
        await prisma.projectTechnology.deleteMany({ where: { projectId: filteredProjectId } });
        await prisma.project.deleteMany({ where: { id: filteredProjectId } });
      }
    });

    it('should filter projects by category=AI_ML', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?category=AI_ML')
        .expect(200);

      expect(res.body.success).toBe(true);
      const items = res.body.data.items;
      items.forEach((p: any) => {
        expect(p.category).toBe('AI_ML');
      });
    });

    it('should filter by owner using supervisor ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects?supervisor=${supervisorUserId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should search by project description text', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?search=filtering+tests')
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return totalPages correctly for pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?page=1&limit=2')
        .expect(200);

      const meta = res.body.data.meta;
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(2);
      expect(meta.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should return empty items for out-of-range page', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?page=9999&limit=10')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(0);
    });

    it('should handle multiple filter combination (status + priority + category)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects?status=IN_PROGRESS&priority=LOW&category=AI_ML')
        .expect(200);

      expect(res.body.success).toBe(true);
      const items = res.body.data.items;
      items.forEach((p: any) => {
        expect(p.status).toBe('IN_PROGRESS');
        expect(p.priority).toBe('LOW');
        expect(p.category).toBe('AI_ML');
      });
    });
  });
});
