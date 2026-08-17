import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: bcrypt.hashSync('Password123!', 10),
    role: 'DEVELOPER',
    department: 'Engineering',
    title: 'Software Engineer',
    avatar: 'https://avatar.com/1.png',
    isActive: true,
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  // Use both sign and signAsync since the service may use either
  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock_jwt_token_123'),
    signAsync: jest.fn().mockResolvedValue('mock_jwt_token_123'),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('mock_secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
    // Re-assign after clear so they return correct values
    mockJwt.sign.mockReturnValue('mock_jwt_token_123');
    mockJwt.signAsync.mockResolvedValue('mock_jwt_token_123');
  });

  describe('login', () => {
    it('should authenticate user and return accessToken on valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.token).toBe('mock_jwt_token_123');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException when email not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'unknown@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.login({ email: 'test@example.com', password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register new user and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const dto = {
        name: 'New Developer',
        email: 'newdev@example.com',
        password: 'Password123!',
        role: 'DEVELOPER' as any,
      };

      const result = await authService.register(dto);
      expect(result.token).toBe('mock_jwt_token_123');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email is already taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const dto = {
        name: 'Duplicate Developer',
        email: 'test@example.com',
        password: 'Password123!',
      };

      await expect(authService.register(dto)).rejects.toThrow(ConflictException);
    });
  });
});
