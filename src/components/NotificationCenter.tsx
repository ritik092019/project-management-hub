import React, { useState, useEffect, useRef } from 'react';
import { Notification } from '../types.js';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/api.js';
import { Bell, MessageSquare, AtSign, CheckCircle2, Clock, AlertTriangle, CheckCheck } from 'lucide-react';

interface NotificationCenterProps {
  onSelectProject?: (projectId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onSelectProject }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notif: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (onSelectProject && notif.projectId) {
      onSelectProject(notif.projectId);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'MENTION':
        return <AtSign className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'APPROVAL_CHANGE':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'REVIEW':
        return <AlertTriangle className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'COMMENT':
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        id="btn-notification-center"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700/60 flex items-center justify-center"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          id="notification-dropdown-menu"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden transform transition-all duration-150 animate-in fade-in slide-in-from-top-2"
        >
          {/* Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white tracking-wide">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/50">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Loading activity notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto opacity-40" />
                <p className="text-xs font-medium text-slate-400">No notifications right now</p>
                <p className="text-[11px] text-slate-500">
                  You will get notified when teammates mention you, comment, or update approvals.
                </p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 sm:p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    notif.isRead
                      ? 'bg-slate-900/60 hover:bg-slate-800/50 opacity-80'
                      : 'bg-blue-950/20 hover:bg-blue-900/30 border-l-2 border-l-blue-500'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={notif.actorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                      alt={notif.actorName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700"
                    />
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-slate-800">
                      {getIcon(notif.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {!notif.isRead && (
                        <button
                          onClick={e => handleMarkAsRead(notif, e)}
                          className="text-blue-400 hover:underline cursor-pointer"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
