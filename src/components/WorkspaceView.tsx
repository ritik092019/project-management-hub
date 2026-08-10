import React, { useState, useMemo } from 'react';
import { Project, User, ProjectStatus } from '../types.js';
import { StatusBadge } from './StatusBadge.js';
import { RoleBadge } from './RoleBadge.js';
import {
  Kanban,
  Calendar as CalendarIcon,
  BarChart3,
  LayoutGrid,
  List,
  Sun,
  Moon,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  Sparkles,
  TrendingUp,
  Cpu,
  Layers,
  ExternalLink,
  Code2,
  FileText,
  SlidersHorizontal,
  RefreshCw,
  FolderKanban,
  User as UserIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface WorkspaceViewProps {
  projects: Project[];
  currentUser: User | null;
  onSelectProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onOpenAddProject: () => void;
  onUpdateStatus: (projectId: string, newStatus: ProjectStatus) => Promise<void>;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

type WorkspaceTab = 'kanban' | 'calendar' | 'timeline' | 'analytics' | 'grid-list';
type ViewMode = 'grid' | 'list';

const KANBAN_COLUMNS: { id: ProjectStatus; title: string; color: string; bgLight: string; bgDark: string; border: string }[] = [
  {
    id: 'IN_PROGRESS',
    title: 'In Development',
    color: 'text-blue-500 dark:text-blue-400',
    bgLight: 'bg-blue-50/80',
    bgDark: 'dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-900/50'
  },
  {
    id: 'TESTING',
    title: 'Testing & QA',
    color: 'text-amber-500 dark:text-amber-400',
    bgLight: 'bg-amber-50/80',
    bgDark: 'dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-900/50'
  },
  {
    id: 'MAINTENANCE',
    title: 'Staging & Review',
    color: 'text-cyan-500 dark:text-cyan-400',
    bgLight: 'bg-cyan-50/80',
    bgDark: 'dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-900/50'
  },
  {
    id: 'DEPLOYED',
    title: 'Deployed & Production',
    color: 'text-emerald-500 dark:text-emerald-400',
    bgLight: 'bg-emerald-50/80',
    bgDark: 'dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-900/50'
  }
];

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  projects,
  currentUser,
  onSelectProject,
  onEditProject,
  onDeleteProject,
  onOpenAddProject,
  onUpdateStatus,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [techFilter, setTechFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Grid/List View state & Pagination
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState(false);
  const [visibleItemsCount, setVisibleItemsCount] = useState(6);

  // Calendar State
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(7); // 0-indexed: 7 = August

  // Extract all available tech stacks for filtering
  const allTechs = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => p.techStack.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.techStack.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesTech = techFilter === 'ALL' || p.techStack.includes(techFilter);

      return matchesSearch && matchesStatus && matchesTech;
    });
  }, [projects, searchQuery, statusFilter, techFilter]);

  // Status Change Handler
  const handleStatusMove = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      setUpdatingId(projectId);
      await onUpdateStatus(projectId, newStatus);
    } catch (err) {
      console.error('Failed to move status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = useMemo(() => {
    if (infiniteScrollEnabled) {
      return filteredProjects.slice(0, visibleItemsCount);
    } else {
      const start = (currentPage - 1) * pageSize;
      return filteredProjects.slice(start, start + pageSize);
    }
  }, [filteredProjects, currentPage, pageSize, infiniteScrollEnabled, visibleItemsCount]);

  // Calendar dates generation
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
    const days = [];

    // Blank padding cells for week offset
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(calendarMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${calendarYear}-${monthStr}-${dayStr}`;

      const dayProjects = projects.filter(p => p.deploymentDate === dateKey);
      days.push({ day, dateKey, projects: dayProjects });
    }

    return days;
  }, [calendarYear, calendarMonth, projects]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 min-h-screen">
      
      {/* Workspace Header Toolbar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-colors duration-200">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                <FolderKanban className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Enterprise Workspace & Productivity Suite
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual planning, interactive Kanban workflow, deployment calendars, and progress timelines.
            </p>
          </div>

          {/* Top Actions: Theme Switcher & Add Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleDarkMode}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
              title="Toggle Dark / Light Theme"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {currentUser && currentUser.role !== 'VIEWER' && (
              <button
                onClick={onOpenAddProject}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Sub-Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'kanban'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Kanban Board</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendar View</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'timeline'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Timeline / Gantt</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Velocity Charts</span>
            </button>

            <button
              onClick={() => setActiveTab('grid-list')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === 'grid-list'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Grid / List & Pagination</span>
            </button>
          </div>

          {/* Quick Search inside Workspace */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search workspace projects..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={techFilter}
              onChange={e => { setTechFilter(e.target.value); setCurrentPage(1); }}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Technologies</option>
              {allTechs.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: KANBAN WORKFLOW BOARD */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {KANBAN_COLUMNS.map(column => {
            const columnProjects = filteredProjects.filter(p => p.status === column.id);
            const columnLOC = columnProjects.reduce((acc, p) => acc + p.linesOfCode, 0);

            return (
              <div
                key={column.id}
                className={`p-4 rounded-3xl ${column.bgLight} ${column.bgDark} border ${column.border} flex flex-col min-h-[580px] shadow-sm transition-all`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800/80 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-extrabold text-sm ${column.color}`}>{column.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {columnProjects.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {(columnLOC / 1000).toFixed(1)}k LOC
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                  {columnProjects.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-300/60 dark:border-slate-800 rounded-2xl text-slate-400 text-xs my-auto">
                      No projects in this stage.
                    </div>
                  ) : (
                    columnProjects.map(project => (
                      <div
                        key={project.id}
                        className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-2xl shadow-sm hover:shadow-md transition-all group space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            onClick={() => onSelectProject(project)}
                            className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer line-clamp-2"
                          >
                            {project.name}
                          </h4>
                          <StatusBadge status={project.status} size="sm" />
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {project.summary}
                        </p>

                        {/* Tech Stack Pills */}
                        <div className="flex flex-wrap gap-1">
                          {project.techStack.slice(0, 3).map(tech => (
                            <span key={tech} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono">
                              {tech}
                            </span>
                          ))}
                          {project.techStack.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-mono">+{project.techStack.length - 3}</span>
                          )}
                        </div>

                        {/* Coverage Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Test Coverage</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{project.testCoverage}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${project.testCoverage}%` }}
                            />
                          </div>
                        </div>

                        {/* Owner & Interactive Status Shift Buttons */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                            <span className="truncate max-w-[90px] font-medium">{project.owner}</span>
                          </div>

                          {/* Shift status action */}
                          <div className="flex items-center gap-1">
                            {column.id !== 'IN_PROGRESS' && (
                              <button
                                onClick={() => {
                                  const prevMap: { [key in ProjectStatus]?: ProjectStatus } = {
                                    TESTING: 'IN_PROGRESS',
                                    MAINTENANCE: 'TESTING',
                                    DEPLOYED: 'MAINTENANCE'
                                  };
                                  if (prevMap[column.id]) handleStatusMove(project.id, prevMap[column.id]!);
                                }}
                                disabled={updatingId === project.id}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Move to previous stage"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {column.id !== 'DEPLOYED' && (
                              <button
                                onClick={() => {
                                  const nextMap: { [key in ProjectStatus]?: ProjectStatus } = {
                                    IN_PROGRESS: 'TESTING',
                                    TESTING: 'MAINTENANCE',
                                    MAINTENANCE: 'DEPLOYED'
                                  };
                                  if (nextMap[column.id]) handleStatusMove(project.id, nextMap[column.id]!);
                                }}
                                disabled={updatingId === project.id}
                                className="p-1 text-blue-500 hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
                                title="Move to next stage"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: CALENDAR SCHEDULE VIEW */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'calendar' && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
          
          {/* Calendar Header Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {monthNames[calendarMonth]} {calendarYear} Deployment Schedule
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visual milestone release calendar mapping target production deployments.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear(calendarYear - 1);
                  } else {
                    setCalendarMonth(calendarMonth - 1);
                  }
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setCalendarMonth(7);
                  setCalendarYear(2026);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                August 2026 (Today)
              </button>

              <button
                onClick={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(calendarYear + 1);
                  } else {
                    setCalendarMonth(calendarMonth + 1);
                  }
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((cell, idx) => {
              if (!cell) {
                return (
                  <div key={`blank-${idx}`} className="min-h-[100px] p-2 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-900" />
                );
              }

              const hasProjects = cell.projects.length > 0;

              return (
                <div
                  key={cell.dateKey}
                  className={`min-h-[100px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    hasProjects
                      ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 shadow-sm'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${hasProjects ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      {cell.day}
                    </span>
                    {hasProjects && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[80px]">
                    {cell.projects.map(proj => (
                      <div
                        key={proj.id}
                        onClick={() => onSelectProject(proj)}
                        className="p-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold truncate cursor-pointer hover:bg-blue-500 transition-colors shadow-sm flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                        <span className="truncate">{proj.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: TIMELINE / GANTT VIEW */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'timeline' && (
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" /> Project Milestones & Delivery Timeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gantt timeline tracking project start through target production launch dates.
            </p>
          </div>

          <div className="space-y-4 overflow-x-auto pb-4">
            {/* Timeline Header Months */}
            <div className="min-w-[700px] grid grid-cols-12 gap-2 text-center text-xs font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
              <div>Jan 26</div>
              <div>Feb 26</div>
              <div>Mar 26</div>
              <div>Apr 26</div>
              <div>May 26</div>
              <div>Jun 26</div>
              <div>Jul 26</div>
              <div className="text-blue-500 font-extrabold">Aug 26 (Now)</div>
              <div>Sep 26</div>
              <div>Oct 26</div>
              <div>Nov 26</div>
              <div>Dec 26</div>
            </div>

            {/* Project Timeline Rows */}
            <div className="min-w-[700px] space-y-3">
              {filteredProjects.map(project => {
                // Calculate position based on deployment date month
                const depMonth = project.deploymentDate ? parseInt(project.deploymentDate.substring(5, 7), 10) : 8;
                const startCol = Math.max(1, depMonth - 2);
                const spanCols = 3;

                return (
                  <div
                    key={project.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div className="w-48 shrink-0">
                      <h4
                        onClick={() => onSelectProject(project)}
                        className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-500 cursor-pointer truncate"
                      >
                        {project.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{project.owner}</span>
                        <span>•</span>
                        <span className="font-mono">{project.deploymentDate}</span>
                      </div>
                    </div>

                    <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                      <div
                        style={{ gridColumnStart: startCol, gridColumnEnd: `span ${spanCols}` }}
                        className="p-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md flex items-center justify-between overflow-hidden"
                      >
                        <span className="truncate">{project.status.replace('_', ' ')}</span>
                        <span className="font-mono text-[10px] bg-blue-800 px-1.5 py-0.5 rounded">
                          {project.testCoverage}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: VELOCITY & INTERACTIVE ANALYTICS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" /> Sprint Velocity Trend
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Monthly deployment velocity across teams.</p>
            
            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { month: 'May 26', velocity: 3 },
                  { month: 'Jun 26', velocity: 5 },
                  { month: 'Jul 26', velocity: 4 },
                  { month: 'Aug 26', velocity: 8 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', color: '#fff' }} />
                  <Area type="monotone" dataKey="velocity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-500" /> Tech Stack Allocation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Active projects by framework.</p>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allTechs.slice(0, 6).map(t => ({
                  tech: t,
                  count: projects.filter(p => p.techStack.includes(t)).length
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="tech" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', color: '#fff' }} />
                  <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: GRID / LIST VIEW WITH PAGINATION & INFINITE SCROLL */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'grid-list' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* View Mode Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Display Layout:</span>
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="List / Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pagination mode vs Infinite Scroll toggle */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={infiniteScrollEnabled}
                  onChange={e => {
                    setInfiniteScrollEnabled(e.target.checked);
                    setVisibleItemsCount(pageSize);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Enable Infinite Load Mode</span>
              </label>

              {!infiniteScrollEnabled && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Per Page:</span>
                  <select
                    value={pageSize}
                    onChange={e => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100"
                  >
                    <option value={6}>6</option>
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Render Content in Grid or List Mode */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProjects.map(project => (
                <div
                  key={project.id}
                  className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-2xl shadow-lg transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        onClick={() => onSelectProject(project)}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-500 cursor-pointer"
                      >
                        {project.name}
                      </h3>
                      <StatusBadge status={project.status} size="sm" />
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {project.summary}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {project.techStack.map(tech => (
                        <span key={tech} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>{project.owner}</span>
                    <span className="font-mono text-blue-500 font-bold">{project.testCoverage}% Coverage</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List Table View */
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Project Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Lead Engineer</th>
                    <th className="p-3">Tech Stack</th>
                    <th className="p-3">Coverage</th>
                    <th className="p-3">Target Launch</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedProjects.map(project => (
                    <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{project.name}</td>
                      <td className="p-3"><StatusBadge status={project.status} size="sm" /></td>
                      <td className="p-3">{project.owner}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {project.techStack.slice(0, 2).map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-500">{project.testCoverage}%</td>
                      <td className="p-3 font-mono">{project.deploymentDate}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => onSelectProject(project)}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls or Infinite Scroll Button */}
          {infiniteScrollEnabled ? (
            visibleItemsCount < filteredProjects.length && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setVisibleItemsCount(prev => prev + pageSize)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Load More Workspace Projects ({filteredProjects.length - visibleItemsCount} remaining)</span>
                </button>
              </div>
            )
          ) : (
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Showing {paginatedProjects.length} of {filteredProjects.length} Projects</span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-50 font-bold cursor-pointer"
                >
                  Previous
                </button>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-50 font-bold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
