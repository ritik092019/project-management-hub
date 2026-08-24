import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, Clock, UserPlus, FolderPlus, FolderMinus, RefreshCw } from 'lucide-react';

interface PendingRequestItem {
  id: string;
  type: string;
  targetId?: string;
  payload?: string;
  token: string;
  status: string;
  requestedBy?: string;
  createdAt: string;
}

interface PendingApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function PendingApprovalsModal({ isOpen, onClose, onRefresh }: PendingApprovalsModalProps) {
  const [requests, setRequests] = useState<PendingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');
      const res = await fetch('/api/auth/pending-requests', {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const text = await res.text();
      let data: any = [];
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Server returned HTML or non-JSON response. Please refresh the page or ensure backend is running.');
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch pending requests.');
      }

      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error loading requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPendingRequests();
    }
  }, [isOpen]);

  const handleDecision = async (token: string, action: 'approve' | 'reject') => {
    setActionLoading(token);
    try {
      const res = await fetch(`/api/auth/approve-request?token=${encodeURIComponent(token)}&action=${action}`);
      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Server returned invalid response.');
      }

      if (!res.ok) {
        alert(data.message || data.error || 'Action failed.');
      } else {
        alert(data.message || `Request ${action}d successfully!`);
        fetchPendingRequests();
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Gmail Notification Approval Queue</h2>
              <p className="text-xs text-slate-400">Review pending user registrations and project modifications</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPendingRequests}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Refresh requests"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
              <p className="text-sm">Loading pending approval requests...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-500/50" />
              <p className="text-slate-300 font-medium">No pending requests</p>
              <p className="text-xs text-slate-500 mt-1">All user registrations and project changes have been reviewed.</p>
            </div>
          ) : (
            requests.map((item) => {
              let parsedPayload: any = {};
              try {
                if (item.payload) parsedPayload = JSON.parse(item.payload);
              } catch (e) {}

              return (
                <div
                  key={item.id}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-600"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {item.type === 'USER_REGISTRATION' && (
                        <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                          <UserPlus className="w-5 h-5" />
                        </div>
                      )}
                      {item.type === 'PROJECT_CREATE' && (
                        <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                          <FolderPlus className="w-5 h-5" />
                        </div>
                      )}
                      {item.type === 'PROJECT_DELETE' && (
                        <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
                          <FolderMinus className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {item.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {item.type === 'USER_REGISTRATION' && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-100">{parsedPayload.name || 'New Member'}</h4>
                          <p className="text-xs text-slate-400">{parsedPayload.email || item.requestedBy} • Role: <span className="text-slate-300 font-medium">{parsedPayload.role || 'DEVELOPER'}</span></p>
                        </div>
                      )}

                      {item.type === 'PROJECT_CREATE' && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-100">Add Project: "{parsedPayload.name || 'Untitled'}"</h4>
                          <p className="text-xs text-slate-400 line-clamp-1">{parsedPayload.description}</p>
                          <p className="text-xs text-slate-500 mt-1">Requested by: {item.requestedBy}</p>
                        </div>
                      )}

                      {item.type === 'PROJECT_DELETE' && (
                        <div>
                          <h4 className="text-sm font-semibold text-rose-300">Delete Project: "{parsedPayload.projectName || item.targetId}"</h4>
                          <p className="text-xs text-slate-500">Requested by: {item.requestedBy}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      disabled={actionLoading === item.token}
                      onClick={() => handleDecision(item.token, 'approve')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Accept</span>
                    </button>

                    <button
                      disabled={actionLoading === item.token}
                      onClick={() => handleDecision(item.token, 'reject')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
