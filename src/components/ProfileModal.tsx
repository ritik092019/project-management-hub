import React, { useState } from 'react';
import { User } from '../types.js';
import { RoleBadge } from './RoleBadge.js';
import { updateProfile, getStoredToken } from '../services/api.js';
import {
  X,
  User as UserIcon,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  Building,
  Briefcase,
  Copy,
  Check,
  Save,
  Lock
} from 'lucide-react';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
  onProfileUpdated: (updatedUser: User) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onProfileUpdated }) => {
  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title);
  const [department, setDepartment] = useState(user.department);
  const [avatar, setAvatar] = useState(user.avatar);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  const activeJwt = getStoredToken() || 'No active JWT session token';

  const handleCopyToken = () => {
    navigator.clipboard.writeText(activeJwt);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await updateProfile({ name, title, department, avatar });
      setSuccess('Profile updated successfully!');
      onProfileUpdated(res.user);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getRolePermissions = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return [
          'Full CRUD control over all system projects & specs',
          'User Management: Assign roles, add or delete user accounts',
          'Global Approval Authority: Override supervisor review decisions',
          'System Security: Manage JWT timeout and inspect live audit logs',
          'Analytics & Metrics: Unrestricted enterprise dashboards'
        ];
      case 'SUPERVISOR':
        return [
          'Supervise assigned developer microservices and projects',
          'Conduct Formal Reviews: Approve, Reject, or Request Changes',
          'Attach structured review notes and required modification checklists',
          'Monitor team performance, test coverage, and review turnaround',
          'Full read access to analytics and developer repositories'
        ];
      case 'DEVELOPER':
        return [
          'Create & submit new project specs for supervisor review',
          'Full editing rights over personal assigned projects',
          'Upload technical resources (GitHub, Live URL, Docs, Diagrams)',
          'Track review notes, approval timeline, and changes requested',
          'Post comments and mention team members in project discussions'
        ];
      default:
        return [
          'Read-only access to published portfolio projects',
          'Search and filter project cards by tech stack & date',
          'View Flash AI project summaries & REST API documentation'
        ];
    }
  };

  return (
    <div id="profile-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div
        id="profile-modal-content"
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/50 shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{user.name}</h2>
                <RoleBadge role={user.role} size="sm" />
              </div>
              <p className="text-xs text-slate-400">{user.email} • Profile & Security Controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Edit Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-blue-400" /> Profile Information
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">User ID: {user.id}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email (Read Only)</label>
                <input
                  type="text"
                  disabled
                  value={user.email}
                  className="w-full px-3.5 py-2.5 bg-slate-950/50 border border-slate-800/60 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Avatar Image URL</label>
              <input
                type="text"
                value={avatar}
                onChange={e => setAvatar(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {loading ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </div>
          </form>

          {/* Role Permissions Summary */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" /> Active Role Permissions
              </h3>
              <RoleBadge role={user.role} size="md" />
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
              {getRolePermissions(user.role).map((perm, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active JWT Session Token */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-purple-400" /> Active JWT Bearer Token
              </h3>
              <button
                onClick={handleCopyToken}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedToken ? 'Copied' : 'Copy Token'}
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-400 break-all select-all max-h-24 overflow-y-auto leading-relaxed">
              {activeJwt}
            </div>
          </div>

        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-500">
          Role-Based Access Control (RBAC) System • Enterprise Edition
        </div>
      </div>
    </div>
  );
};
