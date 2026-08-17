import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Helper to format raw database comment into UI comment structure
   */
  private formatComment(c: any): any {
    return {
      id: c.id,
      projectId: c.projectId,
      parentId: c.parentId || null,
      authorId: c.authorId,
      authorName: c.author?.name || 'Anonymous User',
      authorEmail: c.author?.email || '',
      authorRole: c.author?.role || 'DEVELOPER',
      authorAvatar:
        c.author?.avatar ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt?.toISOString(),
      replies: c.replies ? c.replies.map((r: any) => this.formatComment(r)) : [],
    };
  }

  /**
   * Fetch threaded discussion for a project
   */
  async findByProject(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found.`);
    }

    const comments = await this.prisma.comment.findMany({
      where: { projectId, parentId: null },
      include: {
        author: { select: { id: true, name: true, email: true, role: true, avatar: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, email: true, role: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = comments.map((c) => this.formatComment(c));
    return {
      comments: formatted,
      total: formatted.length,
    };
  }

  /**
   * Add a new project comment or threaded reply
   */
  async create(projectId: string, user: any, dto: CreateCommentDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found.`);
    }

    let parentComment: any = null;
    if (dto.parentId) {
      parentComment = await this.prisma.comment.findUnique({ where: { id: dto.parentId } });
      if (!parentComment || parentComment.projectId !== projectId) {
        throw new BadRequestException(`Parent comment with ID "${dto.parentId}" not found in this project.`);
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        projectId,
        authorId: user.id,
        content: dto.content.trim(),
        parentId: dto.parentId || null,
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true, avatar: true } },
      },
    });

    // Record activity log
    await this.prisma.activityLog.create({
      data: {
        projectId,
        actorId: user.id,
        type: 'COMMENT',
        description: dto.parentId ? `replied to a comment on ${project.name}` : `posted a new comment on ${project.name}`,
        details: dto.content.length > 80 ? dto.content.substring(0, 80) + '...' : dto.content,
      },
    });

    // ─── Real-Time Notifications ──────────────────────────────────────────

    // 1. Threaded reply notification
    if (parentComment && parentComment.authorId !== user.id) {
      await this.notificationsService.createNotification({
        recipientId: parentComment.authorId,
        actorId: user.id,
        type: NotificationType.REPLY,
        title: 'New reply to your comment',
        message: `${user.name || 'Someone'} replied to your comment on "${project.name}": "${dto.content.substring(0, 60)}..."`,
        projectId,
      });
    }

    // 2. New comment on project (notify project owner & supervisor)
    if (!parentComment) {
      const recipients = new Set<string>();
      if (project.ownerId && project.ownerId !== user.id) recipients.add(project.ownerId);
      if (project.supervisorId && project.supervisorId !== user.id) recipients.add(project.supervisorId);

      for (const recipientId of recipients) {
        await this.notificationsService.createNotification({
          recipientId,
          actorId: user.id,
          type: NotificationType.COMMENT,
          title: 'New comment on project',
          message: `${user.name || 'Someone'} commented on "${project.name}": "${dto.content.substring(0, 60)}..."`,
          projectId,
        });
      }
    }

    // 3. Process @mentions
    await this.notificationsService.processMentions(dto.content, user.id, projectId);

    return {
      message: 'Comment added successfully',
      comment: this.formatComment(comment),
    };
  }

  /**
   * Update an existing comment (Author or Admin)
   */
  async update(commentId: string, user: any, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID "${commentId}" not found.`);
    }

    if (user.role !== 'ADMIN' && comment.authorId !== user.id) {
      throw new ForbiddenException('You can only edit your own comments.');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content.trim() },
      include: {
        author: { select: { id: true, name: true, email: true, role: true, avatar: true } },
      },
    });

    return {
      message: 'Comment updated successfully',
      comment: this.formatComment(updated),
    };
  }

  /**
   * Delete a comment (Author or Admin)
   */
  async remove(commentId: string, user: any) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID "${commentId}" not found.`);
    }

    if (user.role !== 'ADMIN' && comment.authorId !== user.id) {
      throw new ForbiddenException('You can only delete your own comments.');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });

    return { message: 'Comment deleted successfully' };
  }
}
