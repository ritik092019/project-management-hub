import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, X, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { fetchLowLatencyFlashLite } from '../services/api';

interface LowLatencySummaryButtonProps {
  projectId?: string;
  projectName?: string;
  customPrompt?: string;
  buttonText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LowLatencySummaryButton: React.FC<LowLatencySummaryButtonProps> = ({
  projectId,
  projectName,
  customPrompt,
  buttonText = 'Flash AI Summary',
  size = 'sm'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetchFlashLite = async () => {
    setIsOpen(true);
    setLoading(true);
    setError(null);
    setResultText(null);

    try {
      const res = await fetchLowLatencyFlashLite(customPrompt, projectId);
      setResultText(res.text);
      setLatency(res.latencyMs);
    } catch (err: any) {
      setError(err.message || 'Error fetching Flash-Lite response');
    } finally {
      setLoading(false);
    }
  };

  const buttonPadding = size === 'sm' ? 'px-2.5 py-1 text-xs' : size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  return (
    <>
      <button
        type="button"
        onClick={handleFetchFlashLite}
        className={`${buttonPadding} rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/30 text-amber-300 font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0`}
      >
        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
        <span>{buttonText}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/30 text-amber-400">
                    <Zap className="w-4 h-4 fill-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Low-Latency Gemini Response
                    </h3>
                    <p className="text-[11px] text-amber-400 font-mono">
                      Model: gemini-3.1-flash-lite
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Subject */}
              {projectName && (
                <div className="text-xs text-slate-400 mb-3">
                  Analysis for <span className="font-semibold text-slate-200">{projectName}</span>
                </div>
              )}

              {/* Body Content */}
              {loading && (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-amber-400 text-xs">
                  <Zap className="w-8 h-8 animate-bounce fill-amber-400/20" />
                  <span>Executing lightning-fast response with Gemini 3.1 Flash-Lite...</span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-xl text-xs text-red-300">
                  {error}
                </div>
              )}

              {resultText && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {resultText}
                  </div>

                  {/* Latency Stats Pill */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> High-Speed Inference Complete
                    </span>

                    {latency && (
                      <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono font-bold rounded-lg flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {latency} ms
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
