import React from 'react';
import { ProjectStatus } from '../types.js';
import { CheckCircle2, Clock, Wrench, AlertCircle, Archive } from 'lucide-react';

interface StatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'DEPLOYED':
        return {
          label: 'Live',
          bg: 'bg-green-500/10 text-green-400 border-green-500/20',
          dotBg: 'bg-green-400',
          icon: CheckCircle2
        };
      case 'IN_PROGRESS':
        return {
          label: 'Active Dev',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          dotBg: 'bg-blue-400',
          icon: Clock
        };
      case 'TESTING':
        return {
          label: 'Staging',
          bg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
          dotBg: 'bg-yellow-400',
          icon: AlertCircle
        };
      case 'MAINTENANCE':
        return {
          label: 'Maintenance',
          bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
          dotBg: 'bg-sky-400',
          icon: Wrench
        };
      case 'ARCHIVED':
      default:
        return {
          label: 'Archived',
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          dotBg: 'bg-slate-400',
          icon: Archive
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span id={`status-badge-${status.toLowerCase()}`} className={`inline-flex items-center gap-1.5 rounded-md border ${config.bg} ${sizeClasses} whitespace-nowrap`}>
      <span className="relative flex h-2 w-2">
        {status === 'DEPLOYED' || status === 'IN_PROGRESS' ? (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotBg} opacity-75`} />
        ) : null}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotBg}`} />
      </span>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
