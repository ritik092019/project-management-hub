import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationInput {
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  title: string;
  message: string;
  projectId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Format raw Prisma Notification to UI DTO structure
   */
  private formatNotification(n: any) {
    return {
      id: n.id,
      recipientId: n.recipientId,
      recipientEmail: n.recipient?.email || '',
      actorId: n.actorId || null,
      actorName: n.actor?.name || 'System',
      actorAvatar: n.actor?.avatar || null,
      actorEmail: n.actor?.email || '',
      type: n.type,
      title: n.title,
      message: n.message,
      projectId: n.projectId || null,
      projectName: n.project?.name || null,
      isRead: n.isRead,
      metadata: n.metadata ? (typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata) : null,
      createdAt: n.createdAt.toISOString(),
    };
  }

  /**
   * Create notification, persist in DB, and push live over WebSockets
   */
  async createNotification(input: CreateNotificationInput) {
    // Avoid self-notification
    if (input.actorId && input.actorId === input.recipientId) {
      return null;
    }

    // Ensure recipient exists
    const recipient = await this.prisma.user.findUnique({ where: { id: input.recipientId } });
    if (!recipient) {
      this.logger.warn(`Recipient with ID "${input.recipientId}" not found. Notification skipped.`);
      return null;
    }

    const metadataString = input.metadata ? JSON.stringify(input.metadata) : null;

    const notification = await this.prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        actorId: input.actorId || null,
        type: input.type,
        title: input.title,
        message: input.message,
        projectId: input.projectId || null,
        metadata: metadataString,
      },
      include: {
        recipient: { select: { id: true, email: true, name: true } },
        actor: { select: { id: true, email: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
      },
    });

    const formatted = this.formatNotification(notification);
    const unreadCount = await this.getUnreadCount(input.recipientId);

    // Broadcast live over Socket.IO
    this.notificationsGateway.sendNotificationToUser(input.recipientId, formatted, unreadCount);

    return formatted;
  }

  /**
   * Parse `@username` or `@name` from text and trigger MENTION notifications
   */
  async processMentions(text: string, actorId: string, projectId: string) {
    const mentionRegex = /@([a-zA-Z0-9._-]+(?:\s+[a-zA-Z0-9._-]+)?)/g;
    const matches = text.match(mentionRegex);
    if (!matches || matches.length === 0) return [];

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    const actorName = actor?.name || 'Someone';

    const notifiedUserIds = new Set<string>();

    for (const rawMatch of matches) {
      const targetName = rawMatch.substring(1).trim().toLowerCase();
      
      // Find user matching name or email prefix
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: targetName } },
            { email: { contains: targetName } },
          ],
        },
      });

      for (const u of users) {
        if (u.id !== actorId && !notifiedUserIds.has(u.id)) {
          notifiedUserIds.add(u.id);
          await this.createNotification({
            recipientId: u.id,
            actorId,
            type: NotificationType.MENTION,
            title: 'You were mentioned',
            message: `${actorName} mentioned you in a comment on "${project?.name || 'Project'}": "${text.substring(0, 60)}..."`,
            projectId,
          });
        }
      }
    }

    return Array.from(notifiedUserIds);
  }

  /**
   * Fetch paginated list of user notifications
   */
  async findUserNotifications(userId: string, isRead?: boolean, take = 50, skip = 0) {
    const where: any = { recipientId: userId };
    if (typeof isRead === 'boolean') {
      where.isRead = isRead;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          recipient: { select: { id: true, email: true, name: true } },
          actor: { select: { id: true, email: true, name: true, avatar: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
    ]);

    return {
      notifications: notifications.map((n) => this.formatNotification(n)),
      total,
      unreadCount,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification "${id}" not found.`);
    }

    if (notification.recipientId !== userId) {
      throw new ForbiddenException('You can only modify your own notifications.');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        recipient: { select: { id: true, email: true, name: true } },
        actor: { select: { id: true, email: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
      },
    });

    const unreadCount = await this.getUnreadCount(userId);
    this.notificationsGateway.sendUnreadCountToUser(userId, unreadCount);

    return {
      message: 'Notification marked as read',
      notification: this.formatNotification(updated),
      unreadCount,
    };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });

    this.notificationsGateway.sendUnreadCountToUser(userId, 0);

    return {
      message: 'All notifications marked as read',
      unreadCount: 0,
    };
  }

  /**
   * Delete a notification
   */
  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification "${id}" not found.`);
    }

    if (notification.recipientId !== userId) {
      throw new ForbiddenException('You can only delete your own notifications.');
    }

    await this.prisma.notification.delete({ where: { id } });

    const unreadCount = await this.getUnreadCount(userId);
    this.notificationsGateway.sendUnreadCountToUser(userId, unreadCount);

    return { message: 'Notification deleted successfully', unreadCount };
  }
}
