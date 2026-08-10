import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastNotification } from '../types.js';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

interface ToastContextType {
  showToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duration = toast.duration ?? 4000;

    const newToast: ToastNotification = { ...toast, id, duration };

    setToasts(prev => [...prev.slice(-4), newToast]); // Limit to max 5 visible toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const getToastIcon = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
    }
  };

  const getToastBorder = (type: ToastNotification['type']) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-slate-900/95 shadow-emerald-950/40';
      case 'error':
        return 'border-rose-500/40 bg-slate-900/95 shadow-rose-950/40';
      case 'warning':
        return 'border-amber-500/40 bg-slate-900/95 shadow-amber-950/40';
      case 'info':
      default:
        return 'border-blue-500/40 bg-slate-900/95 shadow-blue-950/40';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3 justify-between ${getToastBorder(toast.type)}`}
            >
              <div className="flex items-start gap-2.5">
                {getToastIcon(toast.type)}
                <div>
                  <h5 className="text-xs font-bold text-white leading-tight">{toast.title}</h5>
                  {toast.description && (
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
