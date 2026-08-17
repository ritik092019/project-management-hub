import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
const request = (supertest as any).default || supertest;
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import * as bcrypt from 'bcryptjs';

describe('Auth End-to-End (E2E) Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let devToken: string;
  let devRefreshToken: string;
  let devUserId: string;

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

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return JWT access and refresh tokens', async () => {
      const testEmail = `e2e_user_${Date.now()}@test.com`;

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          password: 'Password123!',
          name: 'E2E Test User',
          role: 'DEVELOPER',
          department: 'Quality Assurance',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe(testEmail);

      devToken = res.body.data.token;
      devRefreshToken = res.body.data.refreshToken;
      devUserId = res.body.data.user.id;
    });

    it('should reject registration with invalid email format (DTO validation)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: '123',
          name: 'Invalid User',
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should fail login with wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@team.com',
          password: 'WrongPassword!',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should login successfully as ADMIN if seeded or registered', async () => {
      // Ensure admin user exists with Password123!
      let admin = await prisma.user.findUnique({ where: { email: 'e2e_admin@test.com' } });
      if (!admin) {
        admin = await prisma.user.create({
          data: {
            email: 'e2e_admin@test.com',
            name: 'E2E Admin',
            passwordHash: await bcrypt.hash('Password123!', 10),
            role: 'ADMIN',
          },
        });
      }

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'e2e_admin@test.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      adminToken = res.body.data.token;
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should issue new tokens when providing a valid refresh token', async () => {
      if (!devRefreshToken) return;

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: devRefreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });
  });

  describe('GET /api/v1/auth/me (Protected Route)', () => {
    it('should return current profile when Bearer token is provided', async () => {
      if (!devToken) return;

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${devToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(devUserId);
    });

    it('should reject access without Authorization header', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Role Authorization (RolesGuard)', () => {
    it('should forbid DEVELOPER from accessing ADMIN status patch endpoint', async () => {
      if (!devToken) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${devUserId}/status`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ isActive: false })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should allow ADMIN to update user status', async () => {
      if (!adminToken || !devUserId) return;

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/users/${devUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
