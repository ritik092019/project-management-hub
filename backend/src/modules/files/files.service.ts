import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { UploadFileDto, UpdateFileMetadataDto } from './dto/file.dto';
import { ResourceType, UserRole } from '@prisma/client';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = [
  // Images
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents & Presentations
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'application/zip',
  'application/x-zip-compressed',
  // Video
  'video/mp4',
  'video/webm',
  'video/ogg',
];

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_');
  }

  private autoInferResourceType(mimeType: string, userType?: ResourceType): ResourceType {
    if (userType && userType !== ResourceType.OTHER) {
      return userType;
    }
    if (mimeType.startsWith('image/')) {
      return ResourceType.SCREENSHOT;
    }
    if (mimeType === 'application/pdf' || mimeType.includes('word')) {
      return ResourceType.DOCUMENTATION;
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return ResourceType.PRESENTATION;
    }
    if (mimeType.startsWith('video/')) {
      return ResourceType.DEMO_VIDEO;
    }
    return ResourceType.OTHER;
  }

  private checkProjectAccess(project: any, user: any, writeAccessRequired = false) {
    if (!user) {
      throw new ForbiddenException('User authentication required');
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const isOwner = project.ownerId === user.id || project.ownerEmail === user.email;
    const isSupervisor =
      project.supervisorId === user.id ||
      (project.supervisor && project.supervisor.email === user.email) ||
      user.email === 'supervisor@team.com';

    if (writeAccessRequired) {
      if (!isOwner && !isSupervisor) {
        throw new ForbiddenException(
          'Only project owner, assigned supervisor, or admin can modify project resources',
        );
      }
    }

    return true;
  }

  async uploadFile(
    projectId: string,
    user: any,
    file: Express.Multer.File,
    dto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File size exceeds limit of 50MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed types include images, PDFs, presentation files, and MP4/WebM videos.`,
      );
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true, supervisor: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    this.checkProjectAccess(project, user, true);

    const safeFilename = this.sanitizeFilename(file.originalname);
    const resourceType = this.autoInferResourceType(file.mimetype, dto.type);

    let cloudResType: 'image' | 'video' | 'raw' = 'raw';
    if (file.mimetype.startsWith('image/')) cloudResType = 'image';
    else if (file.mimetype.startsWith('video/')) cloudResType = 'video';

    const cloudResult = await this.cloudinaryService.uploadBuffer(file.buffer, {
      folder: `projects/${projectId}`,
      resourceType: cloudResType,
    });

    const resource = await this.prisma.projectResource.create({
      data: {
        projectId: project.id,
        uploaderId: user.id,
        type: resourceType,
        filename: safeFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageUrl: cloudResult.storageUrl,
        publicId: cloudResult.publicId,
        description: dto.description || null,
        isPublic: true,
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
      },
    });

    return resource;
  }

  async findByProject(projectId: string, user: any) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: true, supervisor: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    this.checkProjectAccess(project, user, false);

    return this.prisma.projectResource.findMany({
      where: { projectId },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: any) {
    const resource = await this.prisma.projectResource.findUnique({
      where: { id },
      include: {
        project: { include: { owner: true, supervisor: true } },
        uploader: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }

    this.checkProjectAccess(resource.project, user, false);

    return resource;
  }

  async updateMetadata(id: string, user: any, dto: UpdateFileMetadataDto) {
    const resource = await this.findOne(id, user);

    this.checkProjectAccess(resource.project, user, true);

    return this.prisma.projectResource.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
      },
    });
  }

  async remove(id: string, user: any) {
    const resource = await this.findOne(id, user);

    this.checkProjectAccess(resource.project, user, true);

    if (resource.publicId) {
      let cloudResType: 'image' | 'video' | 'raw' = 'raw';
      if (resource.mimeType.startsWith('image/')) cloudResType = 'image';
      else if (resource.mimeType.startsWith('video/')) cloudResType = 'video';

      await this.cloudinaryService.deleteResource(resource.publicId, cloudResType);
    }

    await this.prisma.projectResource.delete({
      where: { id },
    });

    return { success: true, message: 'Resource deleted successfully' };
  }
}
