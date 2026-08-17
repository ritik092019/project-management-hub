import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
const request = (supertest as any).default || supertest;
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('Analytics Module E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    await app.close();
  });

  // =====================================
  // GET /api/v1/analytics / GET /api/v1/analytics/overview
  // =====================================
  describe('GET /api/v1/analytics (Overview Metrics)', () => {
    it('should return aggregated overview metrics for all time', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics')
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data).toHaveProperty('totalProjects');
      expect(data).toHaveProperty('completedProjects');
      expect(data).toHaveProperty('activeProjects');
      expect(data).toHaveProperty('inProgressCount');
      expect(data).toHaveProperty('testingCount');
      expect(data).toHaveProperty('maintenanceCount');
      expect(data).toHaveProperty('archivedCount');
      expect(data).toHaveProperty('activeDeployments');
      expect(data).toHaveProperty('totalDevelopers');
      expect(data).toHaveProperty('avgTestCoverage');
      expect(data).toHaveProperty('totalLinesOfCode');
      expect(data).toHaveProperty('avgCompletionTimeDays');
      expect(data).toHaveProperty('deploymentsOverTime');
      expect(data).toHaveProperty('deploymentTrends');
      expect(data).toHaveProperty('techDistribution');
      expect(data).toHaveProperty('mostUsedTechStack');
      expect(data).toHaveProperty('statusDistribution');
      expect(data).toHaveProperty('projectsPerDeveloper');
      expect(data).toHaveProperty('projectsPerSupervisor');
      expect(data).toHaveProperty('projectsPerDepartment');
      expect(data).toHaveProperty('topContributors');

      expect(typeof data.totalProjects).toBe('number');
      expect(Array.isArray(data.deploymentsOverTime)).toBe(true);
      expect(Array.isArray(data.techDistribution)).toBe(true);
      expect(Array.isArray(data.statusDistribution)).toBe(true);
      expect(Array.isArray(data.topContributors)).toBe(true);
    });

    it('should return overview metrics via GET /api/v1/analytics/overview', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/overview')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalProjects');
    });

    it('should filter overview metrics by date range (startDate & endDate)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/overview?startDate=2026-01-01&endDate=2026-12-31')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalProjects');
    });

    it('should filter overview metrics by date range alias (from & to)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/overview?from=2026-01-01&to=2026-06-30')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalProjects');
    });

    it('should filter overview metrics by status=DEPLOYED', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/overview?status=DEPLOYED')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.activeProjects).toBe(0);
    });

    it('should filter overview metrics by category=WEB_APP', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/overview?category=WEB_APP')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalProjects');
    });

    it('should filter overview metrics by search keyword', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/overview?search=Cloud')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalProjects');
    });
  });

  // =====================================
  // GET /api/v1/analytics/deployments
  // =====================================
  describe('GET /api/v1/analytics/deployments (Deployment Analytics)', () => {
    it('should return monthly deployment metrics breakdown', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/deployments')
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data).toHaveProperty('totalProjectsCount');
      expect(data).toHaveProperty('deployedProjectsCount');
      expect(data).toHaveProperty('monthlyBreakdown');
      expect(Array.isArray(data.monthlyBreakdown)).toBe(true);

      if (data.monthlyBreakdown.length > 0) {
        const firstMonth = data.monthlyBreakdown[0];
        expect(firstMonth).toHaveProperty('month');
        expect(firstMonth).toHaveProperty('monthName');
        expect(firstMonth).toHaveProperty('created');
        expect(firstMonth).toHaveProperty('completed');
        expect(firstMonth).toHaveProperty('deployed');
      }
    });

    it('should support date range filtering on deployments endpoint', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/deployments?startDate=2026-01-01&endDate=2026-06-30')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('monthlyBreakdown');
    });
  });

  // =====================================
  // GET /api/v1/analytics/technologies
  // =====================================
  describe('GET /api/v1/analytics/technologies (Technology Analytics)', () => {
    it('should return technology stats and popularity breakdown', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/technologies')
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data).toHaveProperty('totalTechnologiesUsed');
      expect(data).toHaveProperty('techStats');
      expect(data).toHaveProperty('mostPopular');
      expect(Array.isArray(data.techStats)).toBe(true);

      if (data.techStats.length > 0) {
        const firstTech = data.techStats[0];
        expect(firstTech).toHaveProperty('name');
        expect(firstTech).toHaveProperty('projectCount');
        expect(firstTech).toHaveProperty('percentage');
        expect(firstTech).toHaveProperty('totalLinesOfCode');
        expect(firstTech).toHaveProperty('avgTestCoverage');
      }
    });
  });

  // =====================================
  // GET /api/v1/analytics/teams
  // =====================================
  describe('GET /api/v1/analytics/teams (Team Analytics)', () => {
    it('should return team statistics and project distribution', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/teams')
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data).toHaveProperty('totalTeams');
      expect(data).toHaveProperty('teamStats');
      expect(Array.isArray(data.teamStats)).toBe(true);

      if (data.teamStats.length > 0) {
        const team = data.teamStats[0];
        expect(team).toHaveProperty('name');
        expect(team).toHaveProperty('projectCount');
        expect(team).toHaveProperty('completedProjectsCount');
      }
    });
  });

  // =====================================
  // GET /api/v1/analytics/contributors
  // =====================================
  describe('GET /api/v1/analytics/contributors (Contributor Analytics)', () => {
    it('should return top contributors leaderboard', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/contributors')
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data).toHaveProperty('totalContributors');
      expect(data).toHaveProperty('contributors');
      expect(Array.isArray(data.contributors)).toBe(true);

      if (data.contributors.length > 0) {
        const contrib = data.contributors[0];
        expect(contrib).toHaveProperty('name');
        expect(contrib).toHaveProperty('projectCount');
        expect(contrib).toHaveProperty('linesOfCode');
        expect(contrib).toHaveProperty('testCoverage');
      }
    });
  });

  // =====================================
  // GET /api/v1/analytics/completion-time
  // =====================================
  describe('GET /api/v1/analytics/completion-time (Completion Time Analytics)', () => {
    it('should return average completion duration statistics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/completion-time')
        .expect(200);

      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data).toHaveProperty('totalMeasuredProjects');
      expect(data).toHaveProperty('avgDurationDays');
      expect(data).toHaveProperty('minDurationDays');
      expect(data).toHaveProperty('maxDurationDays');
      expect(data).toHaveProperty('projectDurations');
      expect(Array.isArray(data.projectDurations)).toBe(true);
    });
  });

  // =====================================
  // Validation & Edge Case Handling
  // =====================================
  describe('Validation & Edge Cases', () => {
    it('should return 400 Bad Request for invalid date format', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/overview?startDate=not-a-valid-date')
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should handle non-existent date range gracefully with zeroed/empty results', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/analytics/overview?startDate=2099-01-01&endDate=2099-12-31')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalProjects).toBe(0);
      expect(res.body.data.completedProjects).toBe(0);
      expect(res.body.data.activeProjects).toBe(0);
    });
  });
});
