import React, { useState, useEffect } from 'react';
import { ActivityItem } from '../types.js';
import { fetchProjectActivities } from '../services/api.js';
import { RoleBadge } from './RoleBadge.js';
import {
  History,
  ShieldCheck,
  MessageSquare,
  RefreshCw,
  GitCommit,
  Star,
  User,
  Clock
} from 'lucide-react';

interface ActivityTimelineProps {
  projectId: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ projectId }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await fetchProjectActivities(projectId);
      setActivities(data);
    } catch (err) {
      console.error('Failed to load project activity timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [projectId]);

  const getEventIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'APPROVAL_CHANGE':
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      case 'COMMENT':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'REVIEW':
        return <Star className="w-4 h-4 text-amber-400" />;
      case 'STATUS_CHANGE':
        return <RefreshCw className="w-4 h-4 text-cyan-400" />;
      case 'PROJECT_EDIT':
      case 'MENTION':
      default:
        return <GitCommit className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getEventBadgeColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'APPROVAL_CHANGE':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-300';
      case 'COMMENT':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
      case 'REVIEW':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      case 'STATUS_CHANGE':
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';
      case 'PROJECT_EDIT':
      case 'MENTION':
      default:
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Project Audit & Activity Timeline ({activities.length})
          </h3>
        </div>
        <span className="text-xs text-slate-400">Chronological history of updates & interactions</span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading activity timeline...</div>
      ) : activities.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/30 rounded-2xl border border-slate-800/60 space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
          <p className="text-xs font-semibold text-slate-400">No activity recorded yet</p>
          <p className="text-[11px] text-slate-500">Activities will be logged automatically when status changes or comments occur.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {activities.map(act => (
            <div key={act.id} className="relative group">
              {/* Timeline Bullet Icon */}
              <div className="absolute -left-6 top-1.5 p-1.5 rounded-full bg-slate-900 border border-slate-700 shadow-md">
                {getEventIcon(act.type)}
              </div>

              {/* Activity Card */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-2 hover:border-slate-700 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={act.actorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
                      alt={act.actorName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-white">{act.actorName}</span>
                    <RoleBadge role={act.actorRole} size="sm" />
                    <span className="text-xs text-slate-300">{act.description}</span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(act.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                {act.details && (
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 font-mono text-[11px] leading-relaxed">
                    {act.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
