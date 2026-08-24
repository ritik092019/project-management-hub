import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';

export function ApprovalHandler() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    alreadyProcessed?: boolean;
    type?: string;
    status?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    async function processToken() {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const action = urlParams.get('action') || 'approve';

      if (!token) {
        setLoading(false);
        setResult({ error: 'Missing approval token parameter in URL.' });
        return;
      }

      try {
        const res = await fetch(`/api/auth/approve-request?token=${encodeURIComponent(token)}&action=${encodeURIComponent(action)}`);
        const text = await res.text();
        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Server returned non-JSON response.');
        }

        if (!res.ok) {
          setResult({ error: data.message || data.error || 'Failed to process approval request.' });
        } else {
          setResult(data);
        }
      } catch (err: any) {
        setResult({ error: err.message || 'Network error while processing approval token.' });
      } finally {
        setLoading(false);
      }
    }

    processToken();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-6 border border-slate-600">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
        </div>

        <h1 className="text-2xl font-bold text-slate-100 mb-2">Project Hub Authorization</h1>
        <p className="text-slate-400 text-sm mb-6">Admin Decision & Action Portal</p>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm">Verifying token and applying decision...</p>
          </div>
        ) : result?.error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 text-red-400 font-semibold mb-1">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <span>Approval Failed</span>
            </div>
            <p className="text-xs text-red-300/80">{result.error}</p>
          </div>
        ) : result?.alreadyProcessed ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>Already Processed</span>
            </div>
            <p className="text-xs text-amber-300/80">{result.message}</p>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>Action Verified & Completed</span>
            </div>
            <p className="text-xs text-emerald-300/90 leading-relaxed mt-1">{result?.message}</p>
          </div>
        )}

        <a
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/25"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </a>
      </div>
    </div>
  );
}
