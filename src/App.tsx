import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Project, ProjectFilterParams, DashboardAnalytics, User, ProjectStatus } from './types.js';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  fetchAnalytics,
  fetchDevelopers,
  fetchSupervisors,
  fetchTechStacks,
  getCurrentUser,
  loginUser,
  setStoredToken
} from './services/api.js';

import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';
import { ToastProvider, useToast } from './context/ToastContext.tsx';

import { Navbar } from './components/Navbar.js';
import { FilterBar } from './components/FilterBar.js';
import { ProjectCard } from './components/ProjectCard.js';
import { ProjectDetailModal } from './components/ProjectDetailModal.js';
import { ProjectFormModal } from './components/ProjectFormModal.js';
import { AnalyticsDashboard } from './components/AnalyticsDashboard.js';
import { AdminPanel } from './components/AdminPanel.js';
import { ApiDocsModal } from './components/ApiDocsModal.js';
import { LoginModal } from './components/LoginModal.js';
import { ProfileModal } from './components/ProfileModal.js';
import { SupervisorDashboard } from './components/SupervisorDashboard.js';
import { TeamMemberDashboard } from './components/TeamMemberDashboard.js';
import { WorkspaceView } from './components/WorkspaceView.js';
import { AmbientBackgroundFX } from './components/AmbientBackgroundFX.tsx';
import { CommandPalette } from './components/CommandPalette.tsx';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal.tsx';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal.tsx';
import { GeminiChatbotModal } from './components/GeminiChatbotModal.tsx';
import { VoiceConversationModal } from './components/VoiceConversationModal.tsx';
import { OfflineBanner } from './components/OfflineBanner.tsx';

import { Layers, Plus, FolderKanban, ShieldCheck, AlertCircle, Sparkles, RefreshCw, Calendar, Cpu, Command, ShieldAlert, Lock, UserCheck, Kanban } from 'lucide-react';

function AppContent() {
  // Navigation & User State
  const [activeTab, setActiveTab] = useState<'showcase' | 'workspace' | 'analytics' | 'admin' | 'api-docs'>('showcase');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const { theme, accentClasses } = useTheme();
  const { showToast } = useToast();

  // Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [developers, setDevelopers] = useState<User[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [techStacks, setTechStacks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<ProjectFilterParams>({
    search: '',
    owner: 'ALL',
    supervisor: 'ALL',
    status: 'ALL',
    startDate: '',
    endDate: '',
    techStack: [],
    sortBy: 'deploymentDate',
    sortOrder: 'desc'
  });

  // Modal States
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formModalProject, setFormModalProject] = useState<Project | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  // Workspace subview mode
  const [workspaceMode, setWorkspaceMode] = useState<'ROLE_PORTAL' | 'KANBAN'>('ROLE_PORTAL');

  // Feature Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isGeminiChatOpen, setIsGeminiChatOpen] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);

  // Initialize App on Mount
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        let user = await getCurrentUser();
        if (!user) {
          const authData = await loginUser('admin@team.com');
          user = authData.user;
        }
        setCurrentUser(user);

        const [devsList, supsList, techList] = await Promise.all([
          fetchDevelopers(),
          fetchSupervisors(),
          fetchTechStacks()
        ]);
        setDevelopers(devsList);
        setSupervisors(supsList);
        setTechStacks(techList);

        await loadProjects(filters);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize portfolio platform.');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts inside text inputs/textareas
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setFormModalProject(null);
        setIsFormModalOpen(true);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsThemeModalOpen(true);
      } else if (e.key === '1') {
        setActiveTab('showcase');
      } else if (e.key === '2') {
        setActiveTab('workspace');
      } else if (e.key === '3') {
        setActiveTab('analytics');
      } else if (e.key === '4') {
        setActiveTab('admin');
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Load Projects
  const loadProjects = useCallback(async (currentFilters: ProjectFilterParams) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProjects(currentFilters);
      setProjects(data.projects);
      setTotalProjectsCount(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects(filters);
  }, [filters, loadProjects]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics(filters)
        .then(data => setAnalytics(data))
        .catch(err => console.error(err));
    }
  }, [activeTab, projects, filters]);

  // Handlers
  const handleFilterChange = (updated: Partial<ProjectFilterParams>) => {
    setFilters(prev => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      owner: 'ALL',
      supervisor: 'ALL',
      status: 'ALL',
      startDate: '',
      endDate: '',
      techStack: [],
      sortBy: 'deploymentDate',
      sortOrder: 'desc'
    });
  };

  const handleLogin = async (email: string) => {
    const authData = await loginUser(email);
    setCurrentUser(authData.user);
    showToast({
      title: `Signed in as ${authData.user.name}`,
      description: `Role permissions set to ${authData.user.role}`,
      type: 'success'
    });
    await loadProjects(filters);
    const analyticsData = await fetchAnalytics();
    setAnalytics(analyticsData);
  };

  const handleLogout = () => {
    setStoredToken(null);
    setCurrentUser(null);
    setIsLoginModalOpen(true);
    showToast({
      title: 'Signed Out',
      description: 'Switching active user profile...',
      type: 'info'
    });
  };

  const handleSaveProject = async (projectData: Partial<Project>) => {
    if (formModalProject) {
      await updateProject(formModalProject.id, projectData);
      showToast({
        title: 'Project Updated',
        description: `Successfully updated specification for ${projectData.name || formModalProject.name}`,
        type: 'success'
      });
    } else {
      await createProject(projectData);
      showToast({
        title: 'New Project Created',
        description: `Successfully published ${projectData.name} to portfolio.`,
        type: 'success'
      });
    }
    await loadProjects(filters);
    const [analyticsData, techList] = await Promise.all([
      fetchAnalytics(),
      fetchTechStacks()
    ]);
    setAnalytics(analyticsData);
    setTechStacks(techList);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    try {
      const projName = deletingProject.name;
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
      showToast({
        title: 'Project Deleted',
        description: `Removed ${projName} from portfolio repository.`,
        type: 'info'
      });
      await loadProjects(filters);
      const analyticsData = await fetchAnalytics();
      setAnalytics(analyticsData);
    } catch (err: any) {
      showToast({
        title: 'Deletion Failed',
        description: err.message || 'Failed to delete project.',
        type: 'error'
      });
    }
  };

  const handleQuickStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      await updateProject(projectId, { status: newStatus });
      showToast({
        title: 'Status Updated',
        description: `Project status changed to ${newStatus}`,
        type: 'success'
      });
      await loadProjects(filters);
      const analyticsData = await fetchAnalytics();
      setAnalytics(analyticsData);
    } catch (err: any) {
      showToast({
        title: 'Status Update Failed',
        description: err.message,
        type: 'error'
      });
    }
  };

  return (
    <div className="min-h-screen font-sans antialiased flex flex-col selection:bg-blue-600 selection:text-white transition-colors duration-300 relative">
      {/* Ambient Animated Visual Background */}
      <AmbientBackgroundFX />

      {/* Header Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAddProject={() => {
          setFormModalProject(null);
          setIsFormModalOpen(true);
        }}
        totalProjectsCount={totalProjectsCount}
        onSelectProject={projectId => {
          const found = projects.find(p => p.id === projectId);
          if (found) setSelectedProject(found);
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenThemeCustomizer={() => setIsThemeModalOpen(true)}
        onOpenKeyboardShortcuts={() => setIsShortcutsModalOpen(true)}
        onOpenGeminiChat={() => setIsGeminiChatOpen(true)}
        onOpenVoiceChat={() => setIsVoiceChatOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
        
        {/* Banner Hero Greeting */}
        {activeTab !== 'workspace' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl text-white shadow-2xl relative overflow-hidden border border-slate-800/80"
          >
            <div className="relative z-10 max-w-3xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Enterprise Software Repository
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Centralized Team Project Portfolio & Deployment Analytics
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Explore software deliverables created by developers and supervised by engineering leadership. Filter projects by <strong className="text-white">deployment date ranges</strong>, owner, supervisor, status, and technology stack.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none p-6 hidden lg:block">
              <Layers className="w-64 h-64 text-blue-400" />
            </div>
          </motion.div>
        )}

        {/* TAB 1: Projects Showcase */}
        {activeTab === 'showcase' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              availableDevelopers={developers.map(d => d.name)}
              availableSupervisors={supervisors.map(s => s.name)}
              availableTechStacks={techStacks}
              totalResults={totalProjectsCount}
            />

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-950/60 text-rose-300 border border-rose-800 flex items-center gap-3 text-xs font-medium">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <span className="flex-1">{error}</span>
                <button
                  onClick={() => loadProjects(filters)}
                  className="px-3 py-1 rounded-lg bg-rose-900 text-rose-100 text-xs font-bold hover:bg-rose-800 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading Indicator / Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-6 space-y-4">
                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                    <div className="h-16 bg-slate-800/60 rounded" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-slate-800 rounded" />
                      <div className="h-6 w-16 bg-slate-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              /* Empty State */
              <div className="p-12 text-center bg-slate-900/80 rounded-3xl border border-slate-800 shadow-xl space-y-4 max-w-lg mx-auto my-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto">
                  <FolderKanban className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">No Projects Found</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    No software projects matched your selected date range or filter criteria. Try expanding dates or clearing filters.
                  </p>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              /* Projects Cards Grid */
              <div id="projects-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {projects.map((project, idx) => (
                    <ProjectCard
                      key={project.id}
                      index={idx}
                      project={project}
                      currentUser={currentUser}
                      onSelect={proj => setSelectedProject(proj)}
                      onEdit={proj => {
                        setFormModalProject(proj);
                        setIsFormModalOpen(true);
                      }}
                      onDelete={proj => setDeletingProject(proj)}
                      activeTechFilters={filters.techStack}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: Workspace Suite & Role Dashboards */}
        {activeTab === 'workspace' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* View Mode Toggle */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-2xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWorkspaceMode('ROLE_PORTAL')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    workspaceMode === 'ROLE_PORTAL'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {currentUser?.role === 'SUPERVISOR' ? 'Supervisor Review Hub' :
                     currentUser?.role === 'DEVELOPER' ? 'Team Member Workspace' : 'Role Dashboard'}
                  </span>
                </button>

                <button
                  onClick={() => setWorkspaceMode('KANBAN')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    workspaceMode === 'KANBAN'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Kanban className="w-4 h-4 text-amber-400" />
                  <span>Interactive Kanban Board</span>
                </button>
              </div>

              {currentUser && (
                <div className="text-xs text-slate-400 font-medium px-3 hidden sm:block">
                  Active Role: <strong className="text-white">{currentUser.role}</strong>
                </div>
              )}
            </div>

            {/* Sub-view Content */}
            {workspaceMode === 'KANBAN' ? (
              <WorkspaceView
                projects={projects}
                currentUser={currentUser}
                onSelectProject={proj => setSelectedProject(proj)}
                onEditProject={proj => {
                  setFormModalProject(proj);
                  setIsFormModalOpen(true);
                }}
                onDeleteProject={proj => setDeletingProject(proj)}
                onOpenAddProject={() => {
                  setFormModalProject(null);
                  setIsFormModalOpen(true);
                }}
                onUpdateStatus={handleQuickStatusChange}
                isDarkMode={true}
              />
            ) : currentUser?.role === 'SUPERVISOR' || currentUser?.role === 'ADMIN' ? (
              <SupervisorDashboard
                currentUser={currentUser}
                projects={projects}
                onProjectUpdated={() => loadProjects(filters)}
                onSelectProject={projectId => {
                  const found = projects.find(p => p.id === projectId);
                  if (found) setSelectedProject(found);
                }}
              />
            ) : (
              <TeamMemberDashboard
                currentUser={currentUser || { id: 'anon', name: 'Developer', email: 'dev@team.com', role: 'DEVELOPER', avatar: '' }}
                projects={projects}
                onOpenAddProject={() => {
                  setFormModalProject(null);
                  setIsFormModalOpen(true);
                }}
                onProjectUpdated={() => loadProjects(filters)}
                onSelectProject={projectId => {
                  const found = projects.find(p => p.id === projectId);
                  if (found) setSelectedProject(found);
                }}
              />
            )}
          </motion.div>
        )}

        {/* TAB 3: Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AnalyticsDashboard
              analytics={analytics}
              loading={loading && !analytics}
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
            />
          </motion.div>
        )}

        {/* TAB 4: Admin Management Panel (Protected Route Check) */}
        {activeTab === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {currentUser?.role === 'ADMIN' ? (
              <AdminPanel
                projects={projects}
                users={[...developers, ...supervisors]}
                currentUser={currentUser}
                onEditProject={proj => {
                  setFormModalProject(proj);
                  setIsFormModalOpen(true);
                }}
                onDeleteProject={proj => setDeletingProject(proj)}
                onAddProject={() => {
                  setFormModalProject(null);
                  setIsFormModalOpen(true);
                }}
                onStatusChange={handleQuickStatusChange}
                onUserDirectoryUpdated={async () => {
                  const [devsList, supsList] = await Promise.all([
                    fetchDevelopers(),
                    fetchSupervisors()
                  ]);
                  setDevelopers(devsList);
                  setSupervisors(supsList);
                }}
              />
            ) : (
              /* Protected Route Access Denied Banner */
              <div className="p-12 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center space-y-4 max-w-xl mx-auto my-12">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Protected Route: Admin Access Required</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    You are currently authenticated as <strong className="text-white">{currentUser?.name || 'Guest'}</strong> with role <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold font-mono">{currentUser?.role || 'VIEWER'}</span>. Admin Panel access is restricted by JWT RBAC policy.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('showcase')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Return to Showcase
                  </button>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
                  >
                    Switch to Admin Account
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 5: REST API Documentation & Testing */}
        {activeTab === 'api-docs' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ApiDocsModal />
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-6 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Team Project Portfolio Showcase Platform • Built with React, TypeScript, Framer Motion & Tailwind CSS</p>
          <button
            onClick={() => setIsShortcutsModalOpen(true)}
            className="text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1 font-mono text-[11px]"
          >
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">?</kbd> Keyboard Shortcuts
          </button>
        </div>
      </footer>

      {/* MODALS */}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        projects={projects}
        currentUser={currentUser}
        onSelectProject={projectId => {
          const found = projects.find(p => p.id === projectId);
          if (found) setSelectedProject(found);
        }}
        onNavigateView={view => {
          if (view === 'GRID') setActiveTab('showcase');
          else if (view === 'KANBAN') setActiveTab('workspace');
          else if (view === 'ANALYTICS') setActiveTab('analytics');
          else if (view === 'ADMIN') setActiveTab('admin');
        }}
        onOpenCreateModal={() => {
          setFormModalProject(null);
          setIsFormModalOpen(true);
        }}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenApiDocsModal={() => setActiveTab('api-docs')}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
      />

      {/* Theme Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Keyboard Shortcuts Guide */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Gemini AI Multi-Turn Chatbot */}
      <GeminiChatbotModal
        isOpen={isGeminiChatOpen}
        onClose={() => setIsGeminiChatOpen(false)}
        onOpenVoiceModal={() => setIsVoiceChatOpen(true)}
        projects={projects}
        selectedProjectForContext={selectedProject}
      />

      {/* Gemini Live Real-time Voice Conversation */}
      <VoiceConversationModal
        isOpen={isVoiceChatOpen}
        onClose={() => setIsVoiceChatOpen(false)}
      />

      {/* Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          currentUser={currentUser}
          onClose={() => setSelectedProject(null)}
          onEdit={proj => {
            setFormModalProject(proj);
            setIsFormModalOpen(true);
          }}
          onDelete={proj => setDeletingProject(proj)}
          onProjectUpdated={updated => {
            setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
            setSelectedProject(updated);
          }}
        />
      )}

      {/* Add / Edit Form Modal */}
      {isFormModalOpen && (
        <ProjectFormModal
          project={formModalProject}
          availableDevelopers={developers}
          availableSupervisors={supervisors}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSaveProject}
        />
      )}

      {/* Login / Role Switcher Modal */}
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={handleLogin}
          currentUser={currentUser}
        />
      )}

      {/* User Profile & Security Modal */}
      {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onUserUpdated={updated => setCurrentUser(updated)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <div id="delete-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="p-3 rounded-2xl bg-rose-950/60 text-rose-400 w-12 h-12 flex items-center justify-center border border-rose-800">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Project Record?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to permanently remove <strong className="text-white">{deletingProject.name}</strong> from the team portfolio showcase?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md cursor-pointer transition-all"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <OfflineBanner />
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
