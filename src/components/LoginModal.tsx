import React, { useState } from 'react';
import { User, UserRole } from '../types.js';
import { RoleBadge } from './RoleBadge.js';
import { registerUser, resetPassword } from '../services/api.js';
import {
  X,
  LogIn,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  UserCheck,
  Building,
  Mail,
  Lock,
  ArrowRight
} from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (email: string) => Promise<void>;
  currentUser: User | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin, currentUser }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>('LOGIN');
  
  // Login State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('DEVELOPER');
  const [regTitle, setRegTitle] = useState('');
  const [regDept, setRegDept] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot Password State
  const [resetStep, setResetStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [resetEmail, setResetEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const demoAccounts = [
    {
      role: 'ADMIN' as UserRole,
      portalName: 'Admin Portal',
      name: 'Sarah Jenkins',
      title: 'VP of Software Engineering',
      email: 'admin@team.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      description: 'Manage users, projects, system settings, security policy & audit logs.'
    },
    {
      role: 'SUPERVISOR' as UserRole,
      portalName: 'Supervisor Portal',
      name: 'Dr. Robert Vance',
      title: 'Lead Solutions Architect',
      email: 'supervisor@team.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      description: 'Review project submissions, provide review notes, approve or request changes.'
    },
    {
      role: 'DEVELOPER' as UserRole,
      portalName: 'Team Member Portal',
      name: 'Alex Chen',
      title: 'Senior Fullstack Developer',
      email: 'developer@team.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      description: 'Create & manage assigned projects, upload specs, and track approval status.'
    },
    {
      role: 'VIEWER' as UserRole,
      portalName: 'Guest Portfolio Explorer',
      name: 'Maya Lin',
      title: 'Lead Product Manager',
      email: 'viewer@team.com',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
      description: 'Read-only access to project cards, metrics, and API documentation.'
    }
  ];

  const handleQuickLogin = async (email: string) => {
    try {
      setLoading(true);
      setError('');
      setError('');
      await onLogin(email);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Please enter your email address.');
      return;
    }
    handleQuickLogin(emailInput.trim());
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim()) {
      setError('Name and Email address are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await registerUser({
        name: regName.trim(),
        email: regEmail.trim(),
        role: regRole,
        title: regTitle.trim() || undefined,
        department: regDept.trim() || undefined,
        password: regPassword || undefined
      });

      setSuccessMsg(`Welcome ${res.user.name}! Your account has been created.`);
      await onLogin(res.user.email);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Please enter your account email.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await resetPassword(resetEmail.trim());
      if (res.resetCode) {
        setGeneratedCode(res.resetCode);
        setResetStep('VERIFY');
        setSuccessMsg(`Verification code [${res.resetCode}] sent to ${resetEmail}.`);
      }
    } catch (err: any) {
      setError(err.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredCode.trim() !== generatedCode.trim()) {
      setError('Invalid verification code. Please check code or request a new one.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await resetPassword(resetEmail.trim(), newPassword);
      setSuccessMsg('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        setMode('LOGIN');
        setEmailInput(resetEmail);
        setResetStep('REQUEST');
        setSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div
        id="login-modal-content"
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden my-8 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Multi-Role Auth Portal
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono border border-blue-500/30">
                  JWT 256-Bit
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'LOGIN' && 'Select a role portal or sign in with credentials.'}
                {mode === 'REGISTER' && 'Create a new team account with RBAC permissions.'}
                {mode === 'FORGOT_PASSWORD' && 'Recover your account access with secure code verification.'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-login-modal"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1.5 gap-1 text-xs font-semibold">
          <button
            onClick={() => { setMode('LOGIN'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'LOGIN' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Portals & Login
          </button>
          <button
            onClick={() => { setMode('REGISTER'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'REGISTER' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register Member
          </button>
          <button
            onClick={() => { setMode('FORGOT_PASSWORD'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'FORGOT_PASSWORD' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Reset Password
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          
          {/* Status Messages */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5 shadow-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2.5 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* MODE 1: LOGIN & PORTALS */}
          {mode === 'LOGIN' && (
            <div className="space-y-5">
              
              {/* Quick Role Portal Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> One-Click Role Login Portals
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  {demoAccounts.map(acc => {
                    const isSelected = currentUser?.email.toLowerCase() === acc.email.toLowerCase();
                    return (
                      <button
                        key={acc.email}
                        onClick={() => handleQuickLogin(acc.email)}
                        disabled={loading}
                        className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3.5 ${
                          isSelected
                            ? 'bg-blue-500/15 border-blue-500 text-white ring-1 ring-blue-500 shadow-lg shadow-blue-500/10'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                        }`}
                      >
                        <img src={acc.avatar} alt={acc.name} className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-800 shrink-0 shadow-md" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-100">{acc.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({acc.portalName})</span>
                            </div>
                            <RoleBadge role={acc.role} size="sm" />
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{acc.title}</p>
                          <p className="text-[10px] text-slate-500 italic mt-0.5 leading-tight">{acc.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Input Login */}
              <form onSubmit={handleLoginSubmit} className="pt-4 border-t border-slate-800 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Sign In With Account Credentials</span>
                  <button
                    type="button"
                    onClick={() => setMode('FORGOT_PASSWORD')}
                    className="text-blue-400 hover:underline text-[11px] normal-case"
                  >
                    Forgot Password?
                  </button>
                </label>

                <div className="space-y-2.5">
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      placeholder="Enter account email..."
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      placeholder="Password (optional for demo)..."
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Authenticating...' : 'Sign In To Portal'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 2: REGISTER MEMBER */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-2xl text-xs text-blue-300">
                Create a new developer or supervisor account to submit projects, request approvals, and collaborate.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="jordan.miller@enterprise.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Select Role *</label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="DEVELOPER">Team Member / Developer</option>
                    <option value="SUPERVISOR">Supervisor / Reviewer</option>
                    <option value="VIEWER">Guest / Viewer</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Engineering"
                    value={regDept}
                    onChange={e => setRegDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Fullstack Software Developer"
                  value={regTitle}
                  onChange={e => setRegTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Create a password..."
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Account...' : 'Register & Create Account'}
              </button>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD */}
          {mode === 'FORGOT_PASSWORD' && (
            <div className="space-y-4">
              {resetStep === 'REQUEST' ? (
                <form onSubmit={handleResetRequest} className="space-y-3.5">
                  <p className="text-xs text-slate-300">
                    Enter your account email address below. A 6-digit security verification code will be generated to reset your password.
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Account Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. developer@team.com"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    {loading ? 'Sending Code...' : 'Generate Reset Verification Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetVerifyAndSubmit} className="space-y-3.5">
                  <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-xs text-amber-200">
                    Security Code: <span className="font-mono font-bold text-amber-400">{generatedCode}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Enter 6-Digit Verification Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 849201"
                      value={enteredCode}
                      onChange={e => setEnteredCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono tracking-widest placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter new strong password..."
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {loading ? 'Updating Password...' : 'Confirm & Update Password'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-400 flex items-center justify-between px-6">
          <span>🔒 256-bit JWT Authorization</span>
          <span className="text-slate-500">Portfoli.io Security Suite v2.4</span>
        </div>
      </div>
    </div>
  );
};
