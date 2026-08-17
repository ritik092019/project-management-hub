import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ProjectsService Unit Tests', () => {
  let projectsService: ProjectsService;
  let prismaService: PrismaService;

  const mockProject = {
    id: 'proj-1',
    name: 'Enterprise Service Mesh',
    description: 'High performance API mesh',
    ownerId: 'user-owner',
    supervisorId: 'user-supervisor',
    status: 'IN_PROGRESS',
    approvalStatus: 'DRAFT',
    priority: 'HIGH',
    category: 'WEB_APP',
    owner: { id: 'user-owner', name: 'Alex Owner', email: 'owner@team.com', role: 'DEVELOPER', avatar: null, department: null, title: null },
    supervisor: { id: 'user-supervisor', name: 'Dr. Supervisor', email: 'supervisor@team.com', role: 'SUPERVISOR', avatar: null, department: null, title: null },
    team: null,
    technologies: [],
  };

  const mockPrisma = {
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    technology: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    projectTechnology: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    approvalHistory: {
      create: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
  };

  const mockNotifications = {
    createNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    projectsService = module.get<ProjectsService>(ProjectsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return formatted project entity when found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      const result = await projectsService.findOne('proj-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('proj-1');
      expect(result.name).toBe('Enterprise Service Mesh');
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(projectsService.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create new project with draft approval status', async () => {
      mockPrisma.project.create.mockResolvedValue(mockProject);

      const dto = {
        name: 'New Project',
        description: 'Description',
        category: 'WEB_APP' as any,
      };

      const user = { id: 'user-owner', name: 'Alex Owner', email: 'owner@team.com', role: 'DEVELOPER' };

      const result = await projectsService.create(dto, user);
      expect(result).toBeDefined();
      expect(mockPrisma.project.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should allow project owner to update project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.project.update.mockResolvedValue({
        ...mockProject,
        name: 'Updated Name',
      });

      const user = { id: 'user-owner', name: 'Alex Owner', email: 'owner@team.com', role: 'DEVELOPER' };
      const dto = { name: 'Updated Name' };

      const result = await projectsService.update('proj-1', dto, user);
      expect(result).toBeDefined();
      expect(mockPrisma.project.update).toHaveBeenCalled();
    });

    it('should prevent non-owner non-admin developer from updating project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      const user = { id: 'other-user', name: 'Other Dev', email: 'other@team.com', role: 'DEVELOPER' };

      await expect(projectsService.update('proj-1', {}, user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('submitForReview', () => {
    it('should allow owner to submit DRAFT project for review', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.project.update.mockResolvedValue({
        ...mockProject,
        approvalStatus: 'SUBMITTED',
        technologies: [],
      });
      mockPrisma.approvalHistory.create.mockResolvedValue({});
      mockPrisma.activityLog.create.mockResolvedValue({});

      const user = { id: 'user-owner', name: 'Alex Owner', email: 'owner@team.com', role: 'DEVELOPER' };

      const result = await projectsService.submitForReview('proj-1', user);
      expect(result).toBeDefined();
      expect(result.approvalStatus).toBe('SUBMITTED');
    });

    it('should prevent non-owner from submitting project for review', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);

      const user = { id: 'other-user', name: 'Other Dev', email: 'other@team.com', role: 'DEVELOPER' };

      await expect(projectsService.submitForReview('proj-1', user)).rejects.toThrow(ForbiddenException);
    });
  });
});
