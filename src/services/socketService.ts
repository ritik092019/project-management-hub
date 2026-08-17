import { io, Socket } from 'socket.io-client';
import { Notification } from '../types.js';

type NotificationHandler = (notification: Notification) => void;
type UnreadCountHandler = (count: number) => void;
type ConnectionStatusHandler = (isConnected: boolean) => void;

class SocketService {
  private socket: Socket | null = null;
  private notificationListeners: Set<NotificationHandler> = new Set();
  private unreadCountListeners: Set<UnreadCountHandler> = new Set();
  private connectionListeners: Set<ConnectionStatusHandler> = new Set();
  private isConnected = false;

  public connect(token: string) {
    if (this.socket && this.socket.connected) {
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    // Connect to NestJS backend Gateway on namespace /notifications
    const serverUrl = window.location.origin.includes('localhost:5173') || window.location.origin.includes('localhost:3000')
      ? 'http://localhost:4000/notifications'
      : `${window.location.origin}/notifications`;

    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('⚡ Socket.IO connected to Notification Gateway');
      this.isConnected = true;
      this.notifyConnectionListeners(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('⚠️ Socket.IO disconnected:', reason);
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    });

    this.socket.on('notification:new', (notification: Notification) => {
      console.log('🔔 Live notification received:', notification);
      this.notificationListeners.forEach((listener) => listener(notification));
    });

    this.socket.on('notification:unread_count', (data: { count: number }) => {
      this.unreadCountListeners.forEach((listener) => listener(data.count));
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.notifyConnectionListeners(false);
  }

  public onNotification(handler: NotificationHandler) {
    this.notificationListeners.add(handler);
    return () => {
      this.notificationListeners.delete(handler);
    };
  }

  public onUnreadCount(handler: UnreadCountHandler) {
    this.unreadCountListeners.add(handler);
    return () => {
      this.unreadCountListeners.delete(handler);
    };
  }

  public onConnectionStatus(handler: ConnectionStatusHandler) {
    this.connectionListeners.add(handler);
    handler(this.isConnected);
    return () => {
      this.connectionListeners.delete(handler);
    };
  }

  private notifyConnectionListeners(status: boolean) {
    this.connectionListeners.forEach((listener) => listener(status));
  }

  public getIsConnected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
