import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FilesService } from './files.service';
import { CloudinaryService } from './cloudinary.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FilesService Unit Tests', () => {
  let filesService: FilesService;
  let prismaService: PrismaService;

  const mockProject = {
    id: 'proj-1',
    name: 'Cloud Mesh',
    ownerId: 'user-owner',
    supervisorId: 'user-supervisor',
    owner: { id: 'user-owner', email: 'owner@team.com' },
    supervisor: { id: 'user-supervisor', email: 'supervisor@team.com' },
  };

  const mockPrisma = {
    project: {
      findUnique: jest.fn(),
    },
    projectResource: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCloudinary = {
    uploadBuffer: jest.fn().mockResolvedValue({
      publicId: 'mock/publicId',
      storageUrl: 'https://cloudinary.com/test.png',
      format: 'png',
      bytes: 1024,
      resourceType: 'image',
    }),
    deleteResource: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CloudinaryService, useValue: mockCloudinary },
      ],
    }).compile();

    filesService = module.get<FilesService>(FilesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should reject file if larger than 50MB limit', async () => {
      const largeFile: any = {
        size: 60 * 1024 * 1024,
        mimetype: 'image/png',
        originalname: 'large.png',
      };
      const user = { id: 'user-owner', role: 'DEVELOPER' };

      await expect(
        filesService.uploadFile('proj-1', user, largeFile, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unsupported file MIME types', async () => {
      const invalidFile: any = {
        size: 1000,
        mimetype: 'application/x-sh',
        originalname: 'script.sh',
      };
      const user = { id: 'user-owner', role: 'DEVELOPER' };

      await expect(
        filesService.uploadFile('proj-1', user, invalidFile, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upload valid image file and persist metadata to database', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(mockProject);
      mockPrisma.projectResource.create.mockResolvedValue({
        id: 'res-1',
        projectId: 'proj-1',
        filename: 'test.png',
        originalName: 'test.png',
        mimeType: 'image/png',
        storageUrl: 'https://cloudinary.com/test.png',
      });

      const validFile: any = {
        size: 5000,
        mimetype: 'image/png',
        originalname: 'test.png',
        buffer: Buffer.from('test data'),
      };
      const user = { id: 'user-owner', role: 'DEVELOPER' };

      const result = await filesService.uploadFile('proj-1', user, validFile, {});
      expect(result).toBeDefined();
      expect(mockCloudinary.uploadBuffer).toHaveBeenCalled();
      expect(mockPrisma.projectResource.create).toHaveBeenCalled();
    });
  });
});
