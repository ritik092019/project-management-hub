import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AnalyticsService Unit Tests', () => {
  let analyticsService: AnalyticsService;
  let prismaService: PrismaService;

  const mockPrisma = {
    project: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    technology: {
      findMany: jest.fn(),
    },
    team: {
      findMany: jest.fn(),
    },
    projectTechnology: {
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('should calculate and return aggregated project and status metrics', async () => {
      const allProjectsData = [
        {
          id: 'proj-1',
          name: 'P1',
          status: 'DEPLOYED',
          approvalStatus: 'APPROVED',
          priority: 'HIGH',
          deploymentDate: new Date('2026-06-01'),
          createdAt: new Date('2026-05-01'),
          actualCompletionDate: null,
          expectedCompletionDate: null,
          testCoverage: 90,
          linesOfCode: 5000,
          owner: { id: 'u1', name: 'Dev One', avatar: null, department: 'Eng' },
          supervisor: { id: 'u2', name: 'Sup One' },
          team: null,
          technologies: [],
        },
        {
          id: 'proj-2',
          name: 'P2',
          status: 'IN_PROGRESS',
          approvalStatus: 'PENDING_REVIEW',
          priority: 'MEDIUM',
          deploymentDate: null,
          createdAt: new Date('2026-06-01'),
          actualCompletionDate: null,
          expectedCompletionDate: null,
          testCoverage: 80,
          linesOfCode: 3000,
          owner: { id: 'u1', name: 'Dev One', avatar: null, department: 'Eng' },
          supervisor: null,
          team: null,
          technologies: [],
        },
      ];

      mockPrisma.project.count.mockResolvedValue(10);
      mockPrisma.user.count.mockResolvedValue(5);
      mockPrisma.project.findMany.mockResolvedValue(allProjectsData);
      mockPrisma.project.groupBy.mockResolvedValue([
        { status: 'DEPLOYED', _count: { id: 1 } },
        { status: 'IN_PROGRESS', _count: { id: 1 } },
      ]);
      mockPrisma.technology.findMany.mockResolvedValue([
        { id: 'tech-1', name: 'React', projectTechnologies: [{ projectId: 'proj-1' }] },
      ]);
      mockPrisma.team.findMany.mockResolvedValue([
        { id: 'team-1', name: 'Alpha Team', department: 'Eng', projects: [] },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u2', name: 'Sup One', supervisedProjects: [{ id: 'proj-1' }] },
      ]);

      const result = await analyticsService.getDashboardMetrics({});
      expect(result).toBeDefined();
      expect(result.totalProjects).toBe(10);
      expect(result.activeProjects).toBeDefined();
    });
  });
});
