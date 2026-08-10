import React, { useState, useEffect } from 'react';
import { Project, User } from '../types.js';
import { useTheme } from '../context/ThemeContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import {
  Search,
  Plus,
  LayoutGrid,
  Kanban,
  BarChart3,
  ShieldAlert,
  Palette,
  FileCode2,
  ExternalLink,
  X,
  Code2,
  CheckCircle2,
  Terminal,
  User as UserIcon,
  HelpCircle
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  currentUser: User | null;
  onSelectProject: (projectId: string) => void;
  onNavigateView: (view: 'GRID' | 'KANBAN' | 'ANALYTICS' | 'ADMIN') => void;
  onOpenCreateModal: () => void;
  onOpenThemeModal: () => void;
  onOpenApiDocsModal: () => void;
  onOpenShortcutsModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  projects,
  currentUser,
  onSelectProject,
  onNavigateView,
  onOpenCreateModal,
  onOpenThemeModal,
  onOpenApiDocsModal,
  onOpenShortcutsModal
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { accentClasses } = useTheme();
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keydown handler for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or toggle
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase()) ||
    p.owner.toLowerCase().includes(query.toLowerCase()) ||
    p.techStack.some(t => t.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 5);

  const quickActions = [
    {
      id: 'create-project',
      title: 'Create New Project Spec',
      subtitle: 'Add a new microservice or frontend app spec',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onClose();
        onOpenCreateModal();
      }
    },
    {
      id: 'open-theme',
      title: 'Customize UI & Themes',
      subtitle: 'Switch presets, accent colors, and card styles',
      icon: <Palette className="w-4 h-4 text-purple-400" />,
      action: () => {
        onClose();
        onOpenThemeModal();
      }
    },
    {
      id: 'open-apidocs',
      title: 'API & Integration Docs',
      subtitle: 'View REST endpoints and JSON spec schema',
      icon: <FileCode2 className="w-4 h-4 text-blue-400" />,
      action: () => {
        onClose();
        onOpenApiDocsModal();
      }
    },
    {
      id: 'view-grid',
      title: 'Switch to Grid View',
      subtitle: 'View projects in rich card grid',
      icon: <LayoutGrid className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onClose();
        onNavigateView('GRID');
      }
    },
    {
      id: 'view-kanban',
      title: 'Switch to Kanban Board',
      subtitle: 'View pipeline status columns',
      icon: <Kanban className="w-4 h-4 text-amber-400" />,
      action: () => {
        onClose();
        onNavigateView('KANBAN');
      }
    },
    {
      id: 'view-analytics',
      title: 'View Analytics Dashboard',
      subtitle: 'Explore deployment trends and tech distribution',
      icon: <BarChart3 className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onClose();
        onNavigateView('ANALYTICS');
      }
    },
    {
      id: 'shortcuts-guide',
      title: 'Keyboard Shortcuts Guide',
      subtitle: 'View all quick keys and navigation shortcuts',
      icon: <HelpCircle className="w-4 h-4 text-rose-400" />,
      action: () => {
        onClose();
        onOpenShortcutsModal();
      }
    }
  ].filter(action =>
    action.title.toLowerCase().includes(query.toLowerCase()) ||
    action.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div id="command-palette-backdrop" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 p-3">
      <div
        id="command-palette-modal"
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden transform transition-all flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search projects, owners, technologies..."
            className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500 font-medium"
            autoFocus
          />
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
            ESC to close
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {/* Quick Actions Group */}
          {quickActions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 block mb-1">
                Quick Navigation & Actions
              </span>
              {quickActions.map(act => (
                <button
                  key={act.id}
                  onClick={act.action}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-slate-700 transition-colors">
                      {act.icon}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{act.title}</h5>
                      <p className="text-[11px] text-slate-400">{act.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono group-hover:text-slate-300">Run</span>
                </button>
              ))}
            </div>
          )}

          {/* Projects Results Group */}
          {filteredProjects.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 block mb-1">
                Matching Projects ({filteredProjects.length})
              </span>
              {filteredProjects.map(proj => (
                <button
                  key={proj.id}
                  onClick={() => {
                    onClose();
                    onSelectProject(proj.id);
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 transition-all cursor-pointer flex items-center justify-between text-left group border border-transparent hover:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{proj.name}</h5>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">Dev: {proj.owner}</span>
                        <span className="text-[10px] text-slate-500">•</span>
                        <span className="text-[10px] text-cyan-400 font-mono">{proj.testCoverage}% test coverage</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                    {proj.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {quickActions.length === 0 && filteredProjects.length === 0 && (
            <div className="p-8 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto opacity-50" />
              <p className="text-xs font-semibold text-slate-400">No matching commands or projects found</p>
              <p className="text-[11px] text-slate-500">Try searching for "Deploy", "Kanban", or project names like "Cloud Mesh".</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">K</kbd> to toggle</span>
          </div>
          <span>Engineering Portfolio Engine</span>
        </div>
      </div>
    </div>
  );
};
