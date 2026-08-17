import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSocketsMap: Map<string, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '') ||
        (client.handshake.query?.token as string);

      if (!token) {
        this.logger.warn(`Connection attempt rejected: missing token (Socket ID: ${client.id})`);
        client.emit('error', { message: 'Authentication token required' });
        client.disconnect(true);
        return;
      }

      const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'super-secret-key-change-in-production';
      const payload = this.jwtService.verify(token, { secret: jwtSecret });

      const userId = payload.sub || payload.id;
      if (!userId) {
        client.disconnect(true);
        return;
      }

      // Attach user info to socket
      client.data.user = payload;
      client.data.userId = userId;

      // Join user-specific room
      const room = `user_${userId}`;
      client.join(room);

      // Track active sockets
      if (!this.userSocketsMap.has(userId)) {
        this.userSocketsMap.set(userId, new Set());
      }
      this.userSocketsMap.get(userId)!.add(client.id);

      this.logger.log(`Authenticated user connected: ${payload.email || userId} (Socket: ${client.id}, Room: ${room})`);

      client.emit('connected', {
        message: 'Successfully connected to notifications gateway',
        userId,
      });
    } catch (err: any) {
      this.logger.warn(`Socket authentication failed: ${err.message}`);
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSocketsMap.has(userId)) {
      const userSockets = this.userSocketsMap.get(userId)!;
      userSockets.delete(client.id);
      if (userSockets.size === 0) {
        this.userSocketsMap.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Client ping/pong handler for connection sanity check
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  /**
   * Emit real-time notification to a specific user
   */
  sendNotificationToUser(userId: string, notification: any, unreadCount?: number) {
    const room = `user_${userId}`;
    this.server.to(room).emit('notification:new', notification);
    if (typeof unreadCount === 'number') {
      this.server.to(room).emit('notification:unread_count', { count: unreadCount });
    }
    this.logger.log(`Emitted live notification to room: ${room}`);
  }

  /**
   * Emit updated unread count to a specific user
   */
  sendUnreadCountToUser(userId: string, count: number) {
    const room = `user_${userId}`;
    this.server.to(room).emit('notification:unread_count', { count });
  }
}
