import React, { useState, useEffect } from 'react';
import { Project, User, ProjectStatus, UserRole } from '../types.js';
import { StatusBadge } from './StatusBadge.js';
import { RoleBadge } from './RoleBadge.js';
import {
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  fetchAuditLogs,
  fetchSystemSettings,
  updateSystemSettings
} from '../services/api.js';
import {
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  ShieldAlert,
  UserPlus,
  Lock,
  History,
  Settings,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Key,
  Users,
  Layers,
  Database
} from 'lucide-react';

interface AdminPanelProps {
  projects: Project[];
  users: User[];
  currentUser: User | null;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onAddProject: () => void;
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => Promise<void>;
  onUserDirectoryUpdated?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  projects,
  users,
  currentUser,
  onEditProject,
  onDeleteProject,
  onAddProject,
  onStatusChange,
  onUserDirectoryUpdated
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'projects' | 'users' | 'audit_logs' | 'settings' | 'rbac'>('projects');
  const [searchTerm, setSearchTerm] = useState('');

  // User Management State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('DEVELOPER');
  const [newUserTitle, setNewUserTitle] = useState('');
  const [newUserDept, setNewUserDept] = useState('');
  const [userActionMsg, setUserActionMsg] = useState('');
  const [userActionError, setUserActionError] = useState('');
  const [processingUser, setProcessingUser] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // System Settings State
  const [systemSettings, setSystemSettings] = useState<any>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  useEffect(() => {
    if (activeSubTab === 'audit_logs') {
      loadAuditLogs();
    } else if (activeSubTab === 'settings') {
      loadSettings();
    }
  }, [activeSubTab]);

  const loadAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const logs = await fetchAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await fetchSystemSettings();
      setSystemSettings(settings);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setUserActionError('Name and Email are required.');
      return;
    }

    try {
      setProcessingUser(true);
      setUserActionError('');
      await adminCreateUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        role: newUserRole,
        title: newUserTitle.trim() || undefined,
        department: newUserDept.trim() || undefined
      });

      setUserActionMsg('New user account created successfully!');
      setIsAddUserOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      if (onUserDirectoryUpdated) onUserDirectoryUpdated();
      setTimeout(() => setUserActionMsg(''), 2500);
    } catch (err: any) {
      setUserActionError(err.message || 'Failed to create user');
    } finally {
      setProcessingUser(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setUserActionError('');
      await adminUpdateUser(userId, { role: newRole });
      setUserActionMsg('User role updated successfully.');
      if (onUserDirectoryUpdated) onUserDirectoryUpdated();
      setTimeout(() => setUserActionMsg(''), 2500);
    } catch (err: any) {
      setUserActionError(err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to delete user account "${user.name}" (${user.email})?`)) return;

    try {
      setUserActionError('');
      await adminDeleteUser(user.id);
      setUserActionMsg(`User "${user.name}" deleted successfully.`);
      if (onUserDirectoryUpdated) onUserDirectoryUpdated();
      setTimeout(() => setUserActionMsg(''), 2500);
    } catch (err: any) {
      setUserActionError(err.message || 'Failed to delete user');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsMsg('');
      const updated = await updateSystemSettings(systemSettings);
      setSystemSettings(updated);
      setSettingsMsg('System security & server policies saved successfully!');
      setTimeout(() => setSettingsMsg(''), 2500);
    } catch (err: any) {
      setSettingsMsg(`Error: ${err.message || 'Failed to save settings'}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.supervisor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="admin-panel-container" className="space-y-6">
      
      {/* Admin Panel Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold tracking-tight text-white">Enterprise Administration Portal</h2>
          </div>
          <p className="text-xs text-slate-400">
            System governance, multi-role user accounts management, JWT security controls, and audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-blue-400" />
            <span>Add User Account</span>
          </button>

          <button
            onClick={onAddProject}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Spec</span>
          </button>
        </div>
      </div>

      {/* Action Messages */}
      {userActionMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{userActionMsg}</span>
        </div>
      )}

      {userActionError && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{userActionError}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('projects')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'projects'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Projects Directory ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-400" />
          <span>Users & RBAC ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit_logs')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'audit_logs'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <History className="w-4 h-4 text-purple-400" />
          <span>Audit Logs</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4 text-amber-400" />
          <span>System Security Settings</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rbac')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'rbac'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Permissions Matrix</span>
        </button>
      </div>

      {/* Search Input for Tabs */}
      {(activeSubTab === 'projects' || activeSubTab === 'users') && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeSubTab === 'projects' ? 'Search projects by name, developer, or supervisor...' : 'Search users by name, email, or role...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* SUB-TAB 1: Projects Table */}
      {activeSubTab === 'projects' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden p-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Project Spec</th>
                  <th className="p-3">Developer</th>
                  <th className="p-3">Supervisor</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Coverage</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredProjects.map(project => (
                  <tr key={project.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 font-semibold text-slate-100">
                      <div>{project.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{project.id}</div>
                    </td>
                    <td className="p-3 text-slate-300 font-medium">
                      {project.owner}
                    </td>
                    <td className="p-3 text-slate-400">
                      {project.supervisor}
                    </td>
                    <td className="p-3">
                      <select
                        value={project.status}
                        onChange={e => onStatusChange(project.id, e.target.value as ProjectStatus)}
                        className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="DEPLOYED">Deployed</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="TESTING">Testing</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-400">
                      {project.testCoverage}%
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => onEditProject(project)}
                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteProject(project)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: User Directory & Management */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(u => (
              <div key={u.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-lg flex flex-col justify-between space-y-4">
                <div className="flex items-start gap-3">
                  <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-md shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className="font-bold text-xs text-slate-100 truncate">{u.name}</h4>
                      <RoleBadge role={u.role} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{u.title}</p>
                    <p className="text-[10px] font-mono text-blue-400 truncate">{u.email}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{u.department || 'Engineering'}</p>
                  </div>
                </div>

                {/* Role Switcher & Delete Controls */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                    className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-semibold text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPERVISOR">SUPERVISOR</option>
                    <option value="DEVELOPER">DEVELOPER</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>

                  {u.id !== currentUser?.id && (
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete User Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Audit Logs Feed */}
      {activeSubTab === 'audit_logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                Security & System Audit Log
              </h3>
              <p className="text-xs text-slate-400">Real-time log of security events, role changes, project approvals, and administrative actions.</p>
            </div>
            <button
              onClick={loadAuditLogs}
              className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 text-xs font-bold cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-purple-400">{log.action}</span>
                  <span className="text-slate-500 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-slate-300">
                  <strong>{log.actor}</strong> ({log.actorRole}) — {log.details}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  IP: {log.ipAddress}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: System Security Settings */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              System Security & Token Policy Configuration
            </h3>
            <p className="text-xs text-slate-400">Configure global authentication parameters, session limits, and maintenance flags.</p>
          </div>

          {settingsMsg && (
            <div className="p-3.5 bg-blue-950/80 border border-blue-800 text-blue-200 text-xs rounded-2xl">
              {settingsMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                JWT Token Expiration Time (Hours)
              </label>
              <input
                type="number"
                value={systemSettings.jwtExpirationHours || 24}
                onChange={e => setSystemSettings({ ...systemSettings, jwtExpirationHours: parseInt(e.target.value) || 24 })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Minimum Password Length
              </label>
              <input
                type="number"
                value={systemSettings.minPasswordLength || 6}
                onChange={e => setSystemSettings({ ...systemSettings, minPasswordLength: parseInt(e.target.value) || 6 })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <div className="font-bold text-xs text-slate-200">Allow Self Registration</div>
                <div className="text-[10px] text-slate-500">Permit new users to register developer accounts</div>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.allowSelfRegistration ?? true}
                onChange={e => setSystemSettings({ ...systemSettings, allowSelfRegistration: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <div className="font-bold text-xs text-slate-200">Require Supervisor Approval for Releases</div>
                <div className="text-[10px] text-slate-500">Must be approved before status moves to DEPLOYED</div>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.requireApprovalForDeployments ?? true}
                onChange={e => setSystemSettings({ ...systemSettings, requireApprovalForDeployments: e.target.checked })}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer transition-all disabled:opacity-50"
            >
              {savingSettings ? 'Saving Settings...' : 'Save System Settings'}
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 5: RBAC Permissions Matrix */}
      {activeSubTab === 'rbac' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">Role-Based Access Control (RBAC) Governance</h3>
            <p className="text-xs text-slate-400">Security authorization enforcement matrix for JWT Bearer Tokens.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-2xl overflow-hidden">
              <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Capability / Operation</th>
                  <th className="p-3.5 text-purple-400">Admin</th>
                  <th className="p-3.5 text-blue-400">Supervisor</th>
                  <th className="p-3.5 text-green-400">Developer</th>
                  <th className="p-3.5 text-slate-400">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="p-3.5 font-semibold text-slate-200">View Portfolio & Filter Date Ranges</td>
                  <td className="p-3.5 text-emerald-400 font-bold">✓ Allowed</td>
                  <td className="p-3.5 text-emerald-400 font-bold">✓ Allowed</td>
                  <td className="p-3.5 text-emerald-400 font-bold">✓ Allowed</td>
                  <td className="p-3.5 text-emerald-400 font-bold">✓ Allowed</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-slate-200">Create New Project Spec</td>
                  <td className="p-3.5 text-emerald-400 font-bold">✓ Allowed</td>
                  <td className="p-3.5 text-emerald-400 font-bold">✓ Allowed</td>
                  <td className="p-3.5 text-emerald-400 font-bold">✓ Allowed</td>
                  <td className="p-3.5 text-rose-400 font-bold">✕ Denied (403)</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-slate-200">Approve or Request Changes</td>
                  <td className="p-3.5 text-emerald-400 font-bold">✓ Override</td>
                  <td className="p-3.5 text-emerald-400 font-bold">✓ Allowed</td>
                  <td className="p-3.5 text-rose-400 font-bold">✕ Denied (403)</td>
                  <td className="p-3.5 text-rose-400 font-bold">✕ Denied (403)</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-semibold text-slate-200">Manage System Users & Roles</td>
                  <td className="p-3.5 text-emerald-400 font-bold">✓ Full CRUD</td>
                  <td className="p-3.5 text-rose-400 font-bold">✕ Denied (403)</td>
                  <td className="p-3.5 text-rose-400 font-bold">✕ Denied (403)</td>
                  <td className="p-3.5 text-rose-400 font-bold">✕ Denied (403)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD USER ACCOUNT MODAL */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                Add New User Account
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Green"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="rachel.green@enterprise.com"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role *</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="DEVELOPER">Team Member / Developer</option>
                  <option value="SUPERVISOR">Supervisor / Reviewer</option>
                  <option value="ADMIN">System Administrator</option>
                  <option value="VIEWER">Guest / Viewer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Backend Dev"
                    value={newUserTitle}
                    onChange={e => setNewUserTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Cloud Infra"
                    value={newUserDept}
                    onChange={e => setNewUserDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingUser}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {processingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
