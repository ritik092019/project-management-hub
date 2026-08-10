import React from 'react';
import { ApprovalStatus } from '../types.js';
import { CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface ApprovalBadgeProps {
  status?: ApprovalStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const ApprovalBadge: React.FC<ApprovalBadgeProps> = ({ status = 'PENDING_REVIEW', size = 'md' }) => {
  const getConfig = () => {
    switch (status) {
      case 'APPROVED':
        return {
          label: 'Approved',
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dotBg: 'bg-emerald-400',
          icon: CheckCircle2
        };
      case 'CHANGES_REQUESTED':
        return {
          label: 'Changes Requested',
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dotBg: 'bg-amber-400',
          icon: AlertTriangle
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          dotBg: 'bg-rose-400',
          icon: XCircle
        };
      case 'PENDING_REVIEW':
      default:
        return {
          label: 'Pending Review',
          bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          dotBg: 'bg-purple-400',
          icon: Clock
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-xs font-bold'
      : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      id={`approval-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 rounded-lg border ${config.bg} ${sizeClasses} whitespace-nowrap shadow-sm`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
