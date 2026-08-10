import React from 'react';
import { User } from '../types.js';
import { RoleBadge } from './RoleBadge.js';
import { NotificationCenter } from './NotificationCenter.js';
import { useTheme } from '../context/ThemeContext.tsx';
import {
  LayoutDashboard,
  FolderKanban,
  ShieldCheck,
  FileCode2,
  Plus,
  LogIn,
  LogOut,
  Terminal,
  Kanban,
  Sun,
  Moon,
  Palette,
  Search,
  Keyboard,
  Command,
  Bot,
  Mic,
  Zap
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'showcase' | 'workspace' | 'analytics' | 'admin' | 'api-docs';
  setActiveTab: (tab: 'showcase' | 'workspace' | 'analytics' | 'admin' | 'api-docs') => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenProfile?: () => void;
  onOpenAddProject: () => void;
  totalProjectsCount: number;
  onSelectProject?: (projectId: string) => void;
  onOpenCommandPalette: () => void;
  onOpenThemeCustomizer: () => void;
  onOpenKeyboardShortcuts: () => void;
  onOpenGeminiChat: () => void;
  onOpenVoiceChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenProfile,
  onOpenAddProject,
  totalProjectsCount,
  onSelectProject,
  onOpenCommandPalette,
  onOpenThemeCustomizer,
  onOpenKeyboardShortcuts,
  onOpenGeminiChat,
  onOpenVoiceChat
}) => {
  const { theme, accentClasses, updateTheme } = useTheme();
  const canAddProject = currentUser && currentUser.role !== 'VIEWER';

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl text-white border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl ${accentClasses.bg} flex items-center justify-center font-bold text-white shadow-lg ${accentClasses.glow}`}>
              <span className="text-base font-extrabold tracking-tight">P</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                  Portfoli.io <span className={`text-[10px] px-2 py-0.5 rounded ${accentClasses.bg}/20 ${accentClasses.text} font-mono border ${accentClasses.border}`}>Enterprise</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Centralized Project Repository & Deployment Hub</p>
            </div>
          </div>

          {/* Command Search Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all cursor-pointer group"
          >
            <Search className="w-3.5 h-3.5 group-hover:text-blue-400 transition-colors" />
            <span className="font-medium">Quick Search / Commands...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono ml-2">
              Ctrl+K
            </kbd>
          </button>

          {/* Nav Tabs */}
          <nav id="navbar-tabs" className="hidden xl:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              id="nav-tab-showcase"
              onClick={() => setActiveTab('showcase')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'showcase'
                  ? `${accentClasses.bg} text-white shadow-md`
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>Project Hub</span>
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${activeTab === 'showcase' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {totalProjectsCount}
              </span>
            </button>

            <button
              id="nav-tab-workspace"
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'workspace'
                  ? `${accentClasses.bg} text-white shadow-md`
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Kanban className="w-4 h-4 text-amber-400" />
              <span>Workspace</span>
              <span className="px-1.5 py-0.2 text-[9px] rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PROD
              </span>
            </button>

            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? `${accentClasses.bg} text-white shadow-md`
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              id="nav-tab-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? `${accentClasses.bg} text-white shadow-md`
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>

            <button
              id="nav-tab-api-docs"
              onClick={() => setActiveTab('api-docs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'api-docs'
                  ? `${accentClasses.bg} text-white shadow-md`
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <span>REST API</span>
            </button>
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Gemini Chatbot Trigger Button */}
            <button
              onClick={onOpenGeminiChat}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 hover:from-blue-600/50 hover:to-purple-600/50 border border-blue-500/40 text-blue-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
              title="Open Gemini AI Assistant"
            >
              <Bot className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">Gemini AI</span>
            </button>

            {/* Real-time Voice Trigger Button */}
            <button
              onClick={onOpenVoiceChat}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/10 cursor-pointer"
              title="Start Gemini Live Voice Conversation"
            >
              <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="hidden lg:inline">Live Voice</span>
            </button>

            {/* Command Palette Mobile Button */}
            <button
              onClick={onOpenCommandPalette}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Search / Command Palette"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Theme Customizer Button */}
            <button
              onClick={onOpenThemeCustomizer}
              className="p-2 rounded-xl bg-slate-800 text-purple-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer relative"
              title="UI Theme & Appearance Studio"
            >
              <Palette className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            </button>

            {/* Quick Dark Mode Quick Toggle */}
            <button
              onClick={() => updateTheme({ preset: theme.preset === 'light' ? 'dark' : 'light' })}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Toggle Light / Dark Theme"
            >
              {theme.preset === 'light' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>

            {/* Keyboard Shortcuts Button */}
            <button
              onClick={onOpenKeyboardShortcuts}
              className="hidden sm:block p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Keyboard Shortcuts Guide"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            <NotificationCenter onSelectProject={onSelectProject} />

            {canAddProject && (
              <button
                id="btn-add-project"
                onClick={onOpenAddProject}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${accentClasses.bg} ${accentClasses.bgHover} text-white shadow-lg ${accentClasses.glow} transition-all transform active:scale-95 cursor-pointer`}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Spec</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl p-1 pr-1.5">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 hover:bg-slate-700/70 p-1 rounded-lg transition-colors cursor-pointer text-left"
                  title="View Profile & Role Permissions"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-blue-500/50"
                  />
                  <div className="hidden lg:block text-left text-xs">
                    <div className="font-semibold text-slate-100 leading-tight">{currentUser.name}</div>
                    <RoleBadge role={currentUser.role} size="sm" />
                  </div>
                </button>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Switch Role / Logout"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/80 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-login-modal"
                onClick={onOpenLogin}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold ${accentClasses.bg} text-white ${accentClasses.bgHover} transition-colors cursor-pointer`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="flex xl:hidden items-center justify-between border-t border-slate-800 py-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('showcase')}
            className={`px-3 py-1 text-xs rounded-lg flex items-center gap-1 shrink-0 ${activeTab === 'showcase' ? `${accentClasses.bg} text-white` : 'text-slate-400'}`}
          >
            <FolderKanban className="w-3.5 h-3.5" /> Projects ({totalProjectsCount})
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1 text-xs rounded-lg flex items-center gap-1 shrink-0 ${activeTab === 'workspace' ? `${accentClasses.bg} text-white` : 'text-slate-400'}`}
          >
            <Kanban className="w-3.5 h-3.5 text-amber-400" /> Workspace
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1 text-xs rounded-lg flex items-center gap-1 shrink-0 ${activeTab === 'analytics' ? `${accentClasses.bg} text-white` : 'text-slate-400'}`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Analytics
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-1 text-xs rounded-lg flex items-center gap-1 shrink-0 ${activeTab === 'admin' ? `${accentClasses.bg} text-white` : 'text-slate-400'}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Admin
          </button>
          <button
            onClick={() => setActiveTab('api-docs')}
            className={`px-3 py-1 text-xs rounded-lg flex items-center gap-1 shrink-0 ${activeTab === 'api-docs' ? `${accentClasses.bg} text-white` : 'text-slate-400'}`}
          >
            <Terminal className="w-3.5 h-3.5" /> REST API
          </button>
        </div>
      </div>
    </header>
  );
};
