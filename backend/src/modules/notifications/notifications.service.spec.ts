import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaService } from '../../prisma/prisma.service';

describe('NotificationsService Unit Tests', () => {
  let notificationsService: NotificationsService;
  let prismaService: PrismaService;

  const mockRecipient = { id: 'user-1', name: 'Test User', email: 'user@test.com', avatar: null };
  const mockActor = { id: 'user-author', name: 'Author Dev', email: 'author@test.com', avatar: null };

  /** Full DB notification row that the service will format before emitting */
  const mockNotifRow = {
    id: 'notif-1',
    recipientId: 'user-1',
    actorId: null,
    projectId: null,
    type: 'COMMENT',
    title: 'New Comment',
    message: 'Alex commented on your project',
    isRead: false,
    metadata: null,
    createdAt: new Date('2026-08-10T12:00:00.000Z'),
    recipient: mockRecipient,
    actor: null,
    project: null,
  };

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  };

  const mockGateway = {
    sendNotificationToUser: jest.fn(),
    sendUnreadCountToUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsGateway, useValue: mockGateway },
      ],
    }).compile();

    notificationsService = module.get<NotificationsService>(NotificationsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should persist notification to DB and emit WebSocket event', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockRecipient);
      mockPrisma.notification.create.mockResolvedValue(mockNotifRow);
      mockPrisma.notification.count.mockResolvedValue(3);

      const result = await notificationsService.createNotification({
        recipientId: 'user-1',
        type: 'COMMENT' as any,
        title: 'New Comment',
        message: 'Alex commented on your project',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('notif-1');
      // Gateway should be called with the formatted notification and unread count
      expect(mockGateway.sendNotificationToUser).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ id: 'notif-1', type: 'COMMENT' }),
        3,
      );
    });

    it('should return null when recipient user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await notificationsService.createNotification({
        recipientId: 'non-existent-user',
        type: 'COMMENT' as any,
        title: 'Test',
        message: 'Test message',
      });

      expect(result).toBeNull();
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('processMentions', () => {
    it('should extract @mentions from comment body and create notification for mentioned user', async () => {
      const mentionNotifRow = {
        ...mockNotifRow,
        id: 'notif-mention',
        recipientId: 'user-alex',
        actorId: 'user-author',
        type: 'MENTION',
        title: 'You were mentioned',
        message: 'Author Dev mentioned you in a comment',
        createdAt: new Date('2026-08-10T12:00:00.000Z'),
        recipient: { id: 'user-alex', name: 'Alex Chen', email: 'alex@team.com', avatar: null },
        actor: mockActor,
      };

      // user.findMany for @mention lookup
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-alex', name: 'Alex Chen', email: 'alex@team.com' },
      ]);
      // project.findUnique for project info in mention notification
      mockPrisma.project.findUnique.mockResolvedValue({ id: 'proj-1', name: 'Test Project' });
      // user.findUnique for actor info (called by createNotification to verify recipient)
      mockPrisma.user.findUnique.mockResolvedValue(
        { id: 'user-alex', name: 'Alex Chen', email: 'alex@team.com', avatar: null }
      );
      mockPrisma.notification.create.mockResolvedValue(mentionNotifRow);
      mockPrisma.notification.count.mockResolvedValue(1);

      await notificationsService.processMentions(
        'Great progress @Alex Chen please review!',
        'user-author',
        'proj-1',
      );

      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });
  });
});
