import React from 'react';
import { UserRole } from '../types.js';
import { ShieldAlert, ShieldCheck, Code, Eye } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showIcon = true, size = 'md' }) => {
  const getRoleConfig = () => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Admin',
          bg: 'bg-purple-500/10',
          text: 'text-purple-300',
          border: 'border-purple-500/30',
          icon: ShieldAlert
        };
      case 'SUPERVISOR':
        return {
          label: 'Supervisor',
          bg: 'bg-blue-500/10',
          text: 'text-blue-300',
          border: 'border-blue-500/30',
          icon: ShieldCheck
        };
      case 'DEVELOPER':
        return {
          label: 'Developer',
          bg: 'bg-green-500/10',
          text: 'text-green-300',
          border: 'border-green-500/30',
          icon: Code
        };
      case 'VIEWER':
      default:
        return {
          label: 'Viewer',
          bg: 'bg-slate-800',
          text: 'text-slate-300',
          border: 'border-slate-700',
          icon: Eye
        };
    }
  };

  const config = getRoleConfig();
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span id={`role-badge-${role.toLowerCase()}`} className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
