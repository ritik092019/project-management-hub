import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
const request = (supertest as any).default || supertest;
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import * as bcrypt from 'bcryptjs';

describe('Real-Time Notification System E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let serverPort: number;

  let adminToken: string;
  let supervisorToken: string;
  let developerToken: string;

  let adminUserId: string;
  let supervisorUserId: string;
  let developerUserId: string;
  let projectId: string;
  let testNotifId: string;

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
    const server = await app.listen(0);
    serverPort = server.address().port;

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test notifications & data
    await prisma.notification.deleteMany({ where: { recipient: { email: { contains: 'e2e-notif' } } } });
    await prisma.comment.deleteMany({ where: { project: { name: { startsWith: 'E2E-Notif' } } } });
    await prisma.project.deleteMany({ where: { name: { startsWith: 'E2E-Notif' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'e2e-notif' } } });

    // Create test users
    const adminPw = await bcrypt.hash('admin1234', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@e2e-notif.test',
        name: 'E2E Notif Admin',
        passwordHash: adminPw,
        role: 'ADMIN',
      },
    });
    adminUserId = admin.id;

    const supPw = await bcrypt.hash('supervisor1234', 10);
    const supervisor = await prisma.user.create({
      data: {
        email: 'supervisor@e2e-notif.test',
        name: 'E2E Supervisor',
        passwordHash: supPw,
        role: 'SUPERVISOR',
      },
    });
    supervisorUserId = supervisor.id;

    const devPw = await bcrypt.hash('developer1234', 10);
    const developer = await prisma.user.create({
      data: {
        email: 'developer@e2e-notif.test',
        name: 'E2E Developer',
        passwordHash: devPw,
        role: 'DEVELOPER',
      },
    });
    developerUserId = developer.id;

    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'E2E-Notif Test Project',
        description: 'Project for notification testing',
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
      .send({ email: 'admin@e2e-notif.test', password: 'admin1234' });
    adminToken = adminLogin.body.data?.token;

    const supLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'supervisor@e2e-notif.test', password: 'supervisor1234' });
    supervisorToken = supLogin.body.data?.token;

    const devLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'developer@e2e-notif.test', password: 'developer1234' });
    developerToken = devLogin.body.data?.token;
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { recipient: { email: { contains: 'e2e-notif' } } } });
    await prisma.comment.deleteMany({ where: { project: { name: { startsWith: 'E2E-Notif' } } } });
    await prisma.project.deleteMany({ where: { name: { startsWith: 'E2E-Notif' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'e2e-notif' } } });
    await app.close();
  });

  // ─── REST APIs ────────────────────────────────────────────────────────────

  describe('Notifications REST Endpoints', () => {
    it('GET /api/v1/notifications — 401 without auth token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .expect(401);
    });

    it('GET /api/v1/notifications — returns notification list for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);

      const notifications = res.body.data?.notifications ?? res.body.notifications;
      expect(Array.isArray(notifications)).toBe(true);
      expect(res.body.data).toHaveProperty('unreadCount');
    });

    it('GET /api/v1/notifications/unread-count — returns unread count', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${developerToken}`)
        .expect(200);

      const count = res.body.data?.unreadCount ?? res.body.unreadCount;
      expect(typeof count).toBe('number');
    });
  });

  // ─── Event Triggers & Mentions ──────────────────────────────────────────

  describe('Notification Creation Triggers & @Mentions', () => {
    it('POST /api/v1/projects/:id/comments — creates COMMENT notification for owner/supervisor', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/comments`)
        .set('Authorization', `Bearer ${developerToken}`)
        .send({ content: 'Hello supervisor, project is ready!' })
        .expect(201);

      // Check supervisor's notifications
      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      const notifications = res.body.data?.notifications ?? res.body.notifications;
      expect(notifications.length).toBeGreaterThan(0);
      const commentNotif = notifications.find((n: any) => n.type === 'COMMENT');
      expect(commentNotif).toBeDefined();
      expect(commentNotif.actorId).toBe(developerUserId);
      testNotifId = commentNotif.id;
    });

    it('POST /api/v1/projects/:id/comments — parses @mention and notifies mentioned user', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/projects/${projectId}/comments`)
        .set('Authorization', `Bearer ${developerToken}`)
        .send({ content: 'Hey @supervisor, please check the tests!' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      const notifications = res.body.data?.notifications ?? res.body.notifications;
      const mentionNotif = notifications.find((n: any) => n.type === 'MENTION');
      expect(mentionNotif).toBeDefined();
      expect(mentionNotif.title).toContain('mentioned');
    });

    it('PATCH /api/v1/notifications/:id/read — marks single notification read', async () => {
      if (!testNotifId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/notifications/${testNotifId}/read`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      const notif = res.body.data?.notification ?? res.body.notification;
      expect(notif.isRead).toBe(true);
    });

    it('PATCH /api/v1/notifications/read-all — marks all notifications as read', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      const count = res.body.data?.unreadCount ?? res.body.unreadCount;
      expect(count).toBe(0);
    });

    it('DELETE /api/v1/notifications/:id — deletes notification', async () => {
      if (!testNotifId) return;

      await request(app.getHttpServer())
        .delete(`/api/v1/notifications/${testNotifId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);
    });
  });

  // ─── Socket.IO WebSockets Gateway ────────────────────────────────────────

  describe('Socket.IO WebSockets Gateway', () => {
    it('Refuses Socket.IO connection without JWT token', (done) => {
      const socket: Socket = io(`http://localhost:${serverPort}/notifications`, {
        transports: ['websocket'],
      });

      socket.on('connect_error', () => {
        socket.close();
        done();
      });

      socket.on('error', () => {
        socket.close();
        done();
      });
    });

    it('Authenticates Socket.IO connection with valid JWT token', (done) => {
      const socket: Socket = io(`http://localhost:${serverPort}/notifications`, {
        auth: { token: supervisorToken },
        transports: ['websocket'],
      });

      socket.on('connected', (data) => {
        expect(data.userId).toBe(supervisorUserId);
        socket.close();
        done();
      });
    });

    it('Receives real-time notification over Socket.IO when a comment is posted', (done) => {
      const clientSocket: Socket = io(`http://localhost:${serverPort}/notifications`, {
        auth: { token: supervisorToken },
        transports: ['websocket'],
      });

      clientSocket.on('connected', async () => {
        // Trigger a comment that generates a notification for supervisor
        await request(app.getHttpServer())
          .post(`/api/v1/projects/${projectId}/comments`)
          .set('Authorization', `Bearer ${developerToken}`)
          .send({ content: 'Real-time Socket.IO test comment' })
          .expect(201);
      });

      clientSocket.on('notification:new', (notification) => {
        expect(notification).toBeDefined();
        expect(notification.type).toBe('COMMENT');
        clientSocket.close();
        done();
      });
    });
  });
});
