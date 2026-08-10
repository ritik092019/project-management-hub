import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K / Cmd + K', action: 'Open Global Command Palette & Quick Search' },
    { key: 'N', action: 'Create New Project Specification' },
    { key: 'T', action: 'Open Theme & Visual Customizer' },
    { key: 'A', action: 'Open REST API & Integration Schema Docs' },
    { key: '1', action: 'Switch to Grid View' },
    { key: '2', action: 'Switch to Kanban Pipeline Board' },
    { key: '3', action: 'Switch to Analytics Dashboard' },
    { key: '4', action: 'Switch to Admin & User Management' },
    { key: 'Esc', action: 'Close active modal or popup window' },
  ];

  return (
    <div id="shortcuts-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        id="shortcuts-modal-content"
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden my-6 transform transition-all flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Keyboard Shortcuts</h3>
              <p className="text-[11px] text-slate-400">Quick keys for instant power navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {shortcuts.map((sc, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-300 font-medium">{sc.action}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-indigo-300 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors border border-slate-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
