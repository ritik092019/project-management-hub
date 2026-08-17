import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
const request = (supertest as any).default || supertest;
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import * as bcrypt from 'bcryptjs';

describe('Collaboration & Review System E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let supervisorToken: string;
  let developerToken: string;

  let adminUserId: string;
  let supervisorUserId: string;
  let developerUserId: string;
  let projectId: string;
  let commentId: string;
  let replyId: string;

  // ─── Setup ────────────────────────────────────────────────────────────────

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

    // Clean up any existing test data
    await prisma.activityLog.deleteMany({ where: { project: { name: { startsWith: 'E2E-Collab' } } } });
    await prisma.approvalHistory.deleteMany({ where: { project: { name: { startsWith: 'E2E-Collab' } } } });
    await prisma.projectReview.deleteMany({ where: { project: { name: { startsWith: 'E2E-Collab' } } } });
    await prisma.comment.deleteMany({ where: { project: { name: { startsWith: 'E2E-Collab' } } } });
    await prisma.project.deleteMany({ where: { name: { startsWith: 'E2E-Collab' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'e2e-collab' } } });

    // Create Admin user
    const adminPw = await bcrypt.hash('admin1234', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@e2e-collab.test',
        name: 'E2E Admin',
        passwordHash: adminPw,
        role: 'ADMIN',
      },
    });
    adminUserId = admin.id;

    // Create Supervisor user
    const supPw = await bcrypt.hash('supervisor1234', 10);
    const supervisor = await prisma.user.create({
      data: {
        email: 'supervisor@e2e-collab.test',
        name: 'E2E Supervisor',
        passwordHash: supPw,
        role: 'SUPERVISOR',
      },
    });
    supervisorUserId = supervisor.id;

    // Create Developer user
    const devPw = await bcrypt.hash('developer1234', 10);
    const developer = await prisma.user.create({
      data: {
        email: 'developer@e2e-collab.test',
        name: 'E2E Developer',
        passwordHash: devPw,
        role: 'DEVELOPER',
      },
    });
    developerUserId = developer.id;

    // Create a test project owned by developer, assigned to supervisor
    const project = await prisma.project.create({
      data: {
        name: 'E2E-Collab Test Project',
        description: 'Project for E2E collaboration tests',
        ownerId: developerUserId,
        supervisorId: supervisorUserId,
        approvalStatus: 'PENDING_REVIEW',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        category: 'WEB_APP',
      },
    });
    projectId = project.id;

    // Get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@e2e-collab.test', password: 'admin1234' });
    adminToken = adminLogin.body.data?.token;

    const supLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'supervisor@e2e-collab.test', password: 'supervisor1234' });
    supervisorToken = supLogin.body.data?.token;

    const devLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'developer@e2e-collab.test', password: 'developer1234' });
    developerToken = devLogin.body.data?.token;
  });

  afterAll(async () => {
    await prisma.activityLog.deleteMany({ where: { project: { name: { startsWith: 'E2E-Collab' } } } });
    await prisma.approvalHistory.deleteMany({ where: { project: { name: { startsWith: 'E2E-Collab' } } } });
    await prisma.projectReview.deleteMany({ where: { project: { name: { startsWith: 'E2E-Collab' } } } });
    await prisma.comment.deleteMany({ where: { project: { name: { startsWith: 'E2E-Collab' } } } });
    await prisma.project.deleteMany({ where: { name: { startsWith: 'E2E-Collab' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'e2e-collab' } } });
    await app.close();
  });

  // ─── Comments: GET (Public) ────────────────────────────────────────────────

  describe('Comments - GET (public)', () => {
    it('GET /api/v1/projects/:id/comments — returns empty list initially', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/comments`)
        .expect(200);

      expect(res.body.data?.comments ?? res.body.comments).toEqual([]);
      expect(res.body.data?.total ?? res.body.total).toBe(0);
    });

    it('GET /api/v1/projects/nonexistent/comments — 404 for unknown project', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/projects/nonexistent-id-xyz/comments')
        .expect(404);
    });
  });

  // ─── Comments: POST (Authenticated) ──────────────────────────────────────

  describe('Comments - POST (authenticated)', () => {
    it('POST /api/v1/projects/:id/comments — 401 without token', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/comments`)
        .send({ content: 'Unauthenticated comment' })
        .expect(401);
    });

    it('POST /api/v1/projects/:id/comments — developer can add comment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/comments`)
        .set('Authorization', `Bearer ${developerToken}`)
        .send({ content: 'Looking great, ready for review!' })
        .expect(201);

      const comment = res.body.data?.comment ?? res.body.comment;
      expect(comment).toBeDefined();
      expect(comment.content).toBe('Looking great, ready for review!');
      expect(comment.authorId).toBe(developerUserId);
      commentId = comment.id;
    });

    it('POST /api/v1/projects/:id/comments — supervisor can add comment', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/comments`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ content: 'I will review this project.' })
        .expect(201);

      const comment = res.body.data?.comment ?? res.body.comment;
      expect(comment.authorId).toBe(supervisorUserId);
    });

    it('POST /api/v1/projects/:id/comments — 400 for empty content', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/comments`)
        .set('Authorization', `Bearer ${developerToken}`)
        .send({ content: '' })
        .expect(400);
    });

    it('POST /api/v1/projects/:id/comments — admin can reply to comment (threaded)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Admin reply to developer comment', parentId: commentId })
        .expect(201);

      const comment = res.body.data?.comment ?? res.body.comment;
      expect(comment.parentId).toBe(commentId);
      replyId = comment.id;
    });

    it('GET /api/v1/projects/:id/comments — threaded replies visible in parent', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/comments`)
        .expect(200);

      const comments = res.body.data?.comments ?? res.body.comments;
      const parentComment = comments.find((c: any) => c.id === commentId);
      expect(parentComment).toBeDefined();
      expect(parentComment.replies).toHaveLength(1);
      expect(parentComment.replies[0].id).toBe(replyId);
    });
  });

  // ─── Comments: PATCH / DELETE (RBAC) ─────────────────────────────────────

  describe('Comments - PATCH and DELETE (RBAC)', () => {
    it('PATCH /api/v1/comments/:id — owner can edit own comment', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/comments/${commentId}`)
        .set('Authorization', `Bearer ${developerToken}`)
        .send({ content: 'Updated: ready for review!' })
        .expect(200);

      const comment = res.body.data?.comment ?? res.body.comment;
      expect(comment.content).toBe('Updated: ready for review!');
    });

    it('PATCH /api/v1/comments/:id — 403 editing someone else comment', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/comments/${commentId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ content: 'Unauthorized edit attempt' })
        .expect(403);
    });

    it('PATCH /api/v1/comments/:id — admin can edit any comment', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/comments/${commentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Admin edited this comment' })
        .expect(200);

      const comment = res.body.data?.comment ?? res.body.comment;
      expect(comment.content).toBe('Admin edited this comment');
    });

    it('DELETE /api/v1/comments/:id — 403 deleting someone else reply', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/comments/${replyId}`)
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(403);
    });

    it('DELETE /api/v1/comments/:id — admin can delete any comment', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/comments/${replyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data?.message ?? res.body.message).toContain('deleted');
    });
  });

  // ─── Approval Workflow ────────────────────────────────────────────────────

  describe('Approval Workflow - State Machine', () => {
    it('POST /api/v1/projects/:id/submit — 403 non-owner cannot submit', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/submit`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);
    });

    it('POST /api/v1/projects/:id/submit — developer (owner) can submit', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/submit`)
        .set('Authorization', `Bearer ${developerToken}`);

      expect([200, 201]).toContain(res.status);
      expect(res.body.data?.approvalStatus ?? res.body.approvalStatus).toBe('SUBMITTED');
    });

    it('POST /api/v1/projects/:id/submit — 400 cannot submit again from SUBMITTED', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/submit`)
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(400);
    });

    it('POST /api/v1/projects/:id/review — 403 developer cannot review', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/review`)
        .set('Authorization', `Bearer ${developerToken}`)
        .send({ approvalStatus: 'UNDER_REVIEW', feedbackText: 'Starting review', rating: 4 })
        .expect(403);
    });

    it('POST /api/v1/projects/:id/review — supervisor can start review', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/review`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ approvalStatus: 'UNDER_REVIEW', feedbackText: 'Starting thorough review', rating: 4 })
        .expect(201);

      const status = res.body.data?.approvalStatus ?? res.body.approvalStatus;
      expect(status).toBe('UNDER_REVIEW');
    });

    it('POST /api/v1/projects/:id/review — supervisor can request changes', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/review`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({
          approvalStatus: 'CHANGES_REQUESTED',
          feedbackText: 'Please fix the documentation and add unit tests.',
          rating: 3,
          changesRequestedList: ['Add documentation', 'Add unit tests'],
        })
        .expect(201);

      const review = res.body.data?.review ?? res.body.review;
      expect(res.body.data?.approvalStatus ?? res.body.approvalStatus).toBe('CHANGES_REQUESTED');
      expect(review.changesRequestedList).toEqual(['Add documentation', 'Add unit tests']);
    });

    it('POST /api/v1/projects/:id/resubmit — developer can resubmit after changes', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/resubmit`)
        .set('Authorization', `Bearer ${developerToken}`)
        .send({ notes: 'Documentation and tests added' })
        .expect(200);

      expect(res.body.data?.approvalStatus ?? res.body.approvalStatus).toBe('RESUBMITTED');
    });

    it('POST /api/v1/projects/:id/review — supervisor can approve resubmitted project', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/review`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ approvalStatus: 'APPROVED', feedbackText: 'Excellent work! All issues resolved.', rating: 5 })
        .expect(201);

      expect(res.body.data?.approvalStatus ?? res.body.approvalStatus).toBe('APPROVED');
    });

    it('POST /api/v1/projects/:id/review — 400 invalid transition (DRAFT → APPROVED skipping steps)', async () => {
      // Create a separate project still in DRAFT state to test invalid transition
      const draftProject = await prisma.project.create({
        data: {
          name: 'E2E-Collab Draft Invalid',
          description: 'Draft project for invalid transition test',
          ownerId: developerUserId,
          supervisorId: supervisorUserId,
          approvalStatus: 'DRAFT',
          status: 'IN_PROGRESS',
          priority: 'LOW',
          category: 'WEB_APP',
        },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/projects/${draftProject.id}/review`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ approvalStatus: 'APPROVED', feedbackText: 'Skipping steps - should fail' })
        .expect(400);

      // Clean up
      await prisma.project.delete({ where: { id: draftProject.id } });
    });
  });

  // ─── Reviews History ──────────────────────────────────────────────────────

  describe('Reviews & Approval History', () => {
    it('GET /api/v1/projects/:id/reviews — returns all reviews', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/reviews`)
        .expect(200);

      const reviews = res.body.data?.reviews ?? res.body.reviews;
      expect(Array.isArray(reviews)).toBe(true);
      expect(reviews.length).toBeGreaterThanOrEqual(3); // UNDER_REVIEW + CHANGES_REQUESTED + APPROVED
    });

    it('GET /api/v1/projects/:id/approval-history — returns state transitions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/approval-history`)
        .expect(200);

      const history = res.body.data?.history ?? res.body.history;
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThanOrEqual(4); // submit + start-review + request-changes + approve

      // Verify the final recorded transition is APPROVED
      const approved = history.find((h: any) => h.toStatus === 'APPROVED');
      expect(approved).toBeDefined();
    });

    it('GET /api/v1/projects/:id/reviews — returns current approval status', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/reviews`)
        .expect(200);

      const status = res.body.data?.currentApprovalStatus ?? res.body.currentApprovalStatus;
      expect(status).toBe('APPROVED');
    });
  });

  // ─── Activity Timeline ────────────────────────────────────────────────────

  describe('Activity Timeline', () => {
    it('GET /api/v1/projects/:id/activities — returns all project activities', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/activities`)
        .expect(200);

      const activities = res.body.data?.activities ?? res.body.activities;
      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThan(0);
    });

    it('Activity timeline contains COMMENT entries', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/activities`)
        .expect(200);

      const activities = res.body.data?.activities ?? res.body.activities;
      const commentActivities = activities.filter((a: any) => a.type === 'COMMENT');
      expect(commentActivities.length).toBeGreaterThanOrEqual(2);
    });

    it('Activity timeline contains REVIEW entries', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/activities`)
        .expect(200);

      const activities = res.body.data?.activities ?? res.body.activities;
      const reviewActivities = activities.filter((a: any) => a.type === 'REVIEW');
      expect(reviewActivities.length).toBeGreaterThanOrEqual(3);
    });

    it('Activity timeline contains APPROVAL_CHANGE entries', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/projects/${projectId}/activities`)
        .expect(200);

      const activities = res.body.data?.activities ?? res.body.activities;
      const approvalActivities = activities.filter((a: any) => a.type === 'APPROVAL_CHANGE');
      expect(approvalActivities.length).toBeGreaterThanOrEqual(2); // submit + resubmit
    });

    it('GET activities — 404 for nonexistent project', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/projects/nonexistent-xyz/activities')
        .expect(404);
    });
  });

  // ─── RBAC Edge Cases ─────────────────────────────────────────────────────

  describe('RBAC Edge Cases', () => {
    it('Supervisor cannot review project not assigned to them', async () => {
      // Create another project not assigned to our supervisor
      const otherSup = await prisma.user.create({
        data: {
          email: 'other-sup@e2e-collab.test',
          name: 'Other Supervisor',
          passwordHash: await bcrypt.hash('pass1234', 10),
          role: 'SUPERVISOR',
        },
      });

      const otherProject = await prisma.project.create({
        data: {
          name: 'E2E-Collab Other Project',
          description: 'Another project',
          ownerId: developerUserId,
          supervisorId: otherSup.id,
          approvalStatus: 'SUBMITTED',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          category: 'WEB_APP',
        },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/projects/${otherProject.id}/review`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ approvalStatus: 'UNDER_REVIEW', feedbackText: 'Should not be allowed' })
        .expect(403);

      // Clean up
      await prisma.project.delete({ where: { id: otherProject.id } });
      await prisma.user.delete({ where: { id: otherSup.id } });
    });

    it('Admin can review any project regardless of supervisor assignment', async () => {
      // Create a project for admin to review
      const adminReviewProject = await prisma.project.create({
        data: {
          name: 'E2E-Collab Admin Review',
          description: 'Admin test project',
          ownerId: developerUserId,
          approvalStatus: 'SUBMITTED',
          status: 'IN_PROGRESS',
          priority: 'LOW',
          category: 'WEB_APP',
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/projects/${adminReviewProject.id}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approvalStatus: 'APPROVED', feedbackText: 'Admin approved directly', rating: 5 })
        .expect(201);

      expect(res.body.data?.approvalStatus ?? res.body.approvalStatus).toBe('APPROVED');

      // Clean up
      await prisma.activityLog.deleteMany({ where: { projectId: adminReviewProject.id } });
      await prisma.approvalHistory.deleteMany({ where: { projectId: adminReviewProject.id } });
      await prisma.projectReview.deleteMany({ where: { projectId: adminReviewProject.id } });
      await prisma.project.delete({ where: { id: adminReviewProject.id } });
    });
  });
});
