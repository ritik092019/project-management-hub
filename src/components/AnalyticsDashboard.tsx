import React, { useState } from 'react';
import { DashboardAnalytics, ProjectFilterParams } from '../types.js';
import { AnimatedCounter } from './AnimatedCounter.js';
import {
  Layers,
  Rocket,
  Code2,
  Users,
  TrendingUp,
  Cpu,
  PieChart as PieIcon,
  Activity,
  Calendar,
  Clock,
  Award,
  BarChart3,
  CheckCircle2,
  Filter,
  RefreshCw,
  FolderKanban,
  Zap,
  Building2,
  ArrowUpRight,
  Sparkles
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
  CartesianGrid,
  Legend
} from 'recharts';

interface AnalyticsDashboardProps {
  analytics: DashboardAnalytics | null;
  loading: boolean;
  filters?: ProjectFilterParams;
  onFilterChange?: (updated: Partial<ProjectFilterParams>) => void;
  onResetFilters?: () => void;
}

const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#06b6d4', '#eab308', '#ec4899', '#6366f1', '#14b8a6'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  loading,
  filters,
  onFilterChange,
  onResetFilters
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'deployments' | 'trends'>('deployments');

  // Date range presets
  const applyDatePreset = (preset: 'all' | '2026_ytd' | '2026_q1' | '2026_q2' | '2026_q3' | 'last_6m') => {
    if (!onFilterChange) return;

    if (preset === 'all') {
      onFilterChange({ startDate: '', endDate: '' });
    } else if (preset === '2026_ytd') {
      onFilterChange({ startDate: '2026-01-01', endDate: '2026-12-31' });
    } else if (preset === '2026_q1') {
      onFilterChange({ startDate: '2026-01-01', endDate: '2026-03-31' });
    } else if (preset === '2026_q2') {
      onFilterChange({ startDate: '2026-04-01', endDate: '2026-06-30' });
    } else if (preset === '2026_q3') {
      onFilterChange({ startDate: '2026-07-01', endDate: '2026-09-30' });
    } else if (preset === 'last_6m') {
      onFilterChange({ startDate: '2026-03-01', endDate: '2026-08-31' });
    }
  };

  const isFiltered = Boolean(filters?.startDate || filters?.endDate || (filters?.owner && filters.owner !== 'ALL') || (filters?.supervisor && filters.supervisor !== 'ALL') || (filters?.status && filters.status !== 'ALL') || (filters?.techStack && filters.techStack.length > 0));

  if (loading && !analytics) {
    return (
      <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-4 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl my-4">
        <Activity className="w-10 h-10 animate-spin text-blue-500" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Calculating Team Portfolio Analytics...</h3>
          <p className="text-xs text-slate-400">Aggregating project deployments, test coverages, and technology stats in real time.</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-3xl border border-slate-800 my-4 space-y-3">
        <FolderKanban className="w-10 h-10 mx-auto text-slate-500" />
        <p className="text-sm font-semibold text-slate-300">No analytics data available for the current filter criteria.</p>
        {onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  // Derived statistics
  const activeCount = analytics.activeProjects || (analytics.inProgressCount + analytics.testingCount + (analytics.maintenanceCount || 0));
  const completedCount = analytics.completedProjects || analytics.activeDeployments;
  const completionPercentage = analytics.totalProjects > 0 ? Math.round((completedCount / analytics.totalProjects) * 100) : 0;
  const activePercentage = analytics.totalProjects > 0 ? Math.round((activeCount / analytics.totalProjects) * 100) : 0;

  // Pie chart data for status distribution
  const statusPieData = analytics.statusDistribution
    .filter(s => s.count > 0)
    .map(s => ({
      name: s.status.replace('_', ' '),
      value: s.count,
      statusKey: s.status
    }));

  const getStatusColor = (statusKey: string) => {
    switch (statusKey) {
      case 'DEPLOYED': return '#22c55e';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'TESTING': return '#eab308';
      case 'MAINTENANCE': return '#06b6d4';
      case 'ARCHIVED': return '#64748b';
      default: return '#3b82f6';
    }
  };

  // Peak month calculation
  const peakMonthObj = analytics.deploymentsOverTime.reduce(
    (max, item) => (item.count > max.count ? item : max),
    { monthName: 'N/A', count: 0 }
  );

  return (
    <div id="analytics-dashboard-container" className="space-y-6">
      
      {/* Date Range & Interactive Filtering Control Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Real-Time Analytics Date Range
                {loading && <Activity className="w-4 h-4 animate-spin text-blue-400" />}
              </h2>
              <p className="text-xs text-slate-400">
                Filter productivity metrics, deployment trends, and tech stack insights by custom date ranges.
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => applyDatePreset('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !filters?.startDate && !filters?.endDate
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => applyDatePreset('2026_ytd')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filters?.startDate === '2026-01-01' && filters?.endDate === '2026-12-31'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              2026 YTD
            </button>
            <button
              onClick={() => applyDatePreset('2026_q1')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filters?.startDate === '2026-01-01' && filters?.endDate === '2026-03-31'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Q1 2026
            </button>
            <button
              onClick={() => applyDatePreset('2026_q2')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filters?.startDate === '2026-04-01' && filters?.endDate === '2026-06-30'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Q2 2026
            </button>
            <button
              onClick={() => applyDatePreset('2026_q3')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filters?.startDate === '2026-07-01' && filters?.endDate === '2026-09-30'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Q3 2026
            </button>
          </div>
        </div>

        {/* Custom Start / End Date Pickers */}
        {onFilterChange && (
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Start Date:</span>
                <input
                  type="date"
                  value={filters?.startDate || ''}
                  onChange={e => onFilterChange({ startDate: e.target.value })}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">End Date:</span>
                <input
                  type="date"
                  value={filters?.endDate || ''}
                  onChange={e => onFilterChange({ endDate: e.target.value })}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {isFiltered && onResetFilters && (
              <button
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                Reset Range Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPI Insight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Projects & Range Stat */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Projects</span>
            <div className="text-2xl font-extrabold text-white mt-1">
              <AnimatedCounter value={analytics.totalProjects} />
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span>{completedCount} Completed / {activeCount} In Flight</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Active vs Completed Ratio */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active vs Deployed</span>
            <div className="text-2xl font-extrabold text-green-400 mt-1">
              <AnimatedCounter value={completionPercentage} suffix="%" /> <span className="text-xs font-normal text-slate-400">Deployed</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              {activePercentage}% Currently Active In Pipeline
            </div>
          </div>
          <div className="p-3 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20">
            <Rocket className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Avg Project Completion Time */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Completion Time</span>
            <div className="text-2xl font-extrabold text-sky-400 mt-1">
              <AnimatedCounter value={analytics.avgCompletionTimeDays || 54} /> <span className="text-xs font-normal text-slate-400">days</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              Test Coverage: <strong className="text-purple-400">{analytics.avgTestCoverage}%</strong>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Peak Monthly Velocity */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Peak Velocity Month</span>
            <div className="text-2xl font-extrabold text-purple-400 mt-1">
              {peakMonthObj.monthName}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              {peakMonthObj.count} projects deployed in month
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Row 2: Interactive Deployments Chart & Status Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Deployments Over Time (Area / Bar Interactive Toggle) */}
        <div className="lg:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" /> Monthly Deployments & Velocity Trends
              </h3>
              <p className="text-xs text-slate-400">Track software deployment throughput across engineering milestones.</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveChartTab('deployments')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'deployments' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Volume
              </button>
              <button
                onClick={() => setActiveChartTab('trends')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'trends' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Growth Trend
              </button>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            {activeChartTab === 'deployments' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.deploymentsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="deploymentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="monthName" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                    formatter={(val: any) => [`${val} projects`, 'Monthly Deployments']}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#deploymentGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.deploymentTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="monthName" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                    formatter={(val: any) => [`${val}%`, 'Growth Rate']}
                  />
                  <Bar dataKey="growthRatePct" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Active vs Completed & Status Pie */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-green-400" /> Lifecycle Status Breakdown
            </h3>
            <p className="text-xs text-slate-400">Distribution of projects by active delivery stage.</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.statusKey)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  formatter={(val: any) => [`${val} projects`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            {analytics.statusDistribution.map(item => (
              <div key={item.status} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getStatusColor(item.status) }} />
                  <span className="text-slate-300 font-medium">{item.status.replace('_', ' ')}</span>
                </div>
                <span className="font-mono text-slate-400 font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Most Used Tech Stack & Projects by Technology */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Projects by Technology Stack */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" /> Projects by Technology
              </h3>
              <p className="text-xs text-slate-400">Frequency of frameworks, databases & infrastructure components.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-purple-300 font-bold">
              {analytics.techDistribution.length} Techs
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.techDistribution.slice(0, 7)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="tech" type="category" stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                  formatter={(val: any) => [`${val} projects`, 'Usage Count']}
                />
                <Bar dataKey="count" fill="#a855f7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Used Tech Stack Highlights */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" /> Most Used Tech Stack
            </h3>
            <p className="text-xs text-slate-400">Core technologies driving maximum enterprise deliverables.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {analytics.mostUsedTechStack.map((techItem, index) => (
              <div key={techItem.tech} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 font-mono">#{index + 1}</span>
                    <span className="font-bold text-xs text-white">{techItem.tech}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{techItem.count} project{techItem.count === 1 ? '' : 's'}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-bold">
                    {techItem.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Projects by Team & Top Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Projects by Team / Supervisor */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-400" /> Projects by Team & Leadership
            </h3>
            <p className="text-xs text-slate-400">Breakdown of software initiatives supervised by engineering leaders.</p>
          </div>

          <div className="space-y-3 pt-2">
            {analytics.projectsPerSupervisor.map(sup => {
              const maxSupCount = Math.max(...analytics.projectsPerSupervisor.map(s => s.count), 1);
              const widthPct = Math.round((sup.count / maxSupCount) * 100);
              return (
                <div key={sup.supervisor} className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-sky-400" /> {sup.supervisor}
                    </span>
                    <span className="font-bold text-sky-400 font-mono">
                      {sup.count} project{sup.count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Contributors Leaderboard */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" /> Top Contributors & Developers
              </h3>
              <p className="text-xs text-slate-400">Lead engineers sorted by project output and code contribution volume.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
              {analytics.topContributors.length} Engineers
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {analytics.topContributors.map((contrib, idx) => (
              <div
                key={contrib.name}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={contrib.avatar}
                      alt={contrib.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-800 shrink-0"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center border border-slate-900">
                      {idx + 1}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white">{contrib.name}</h4>
                    <p className="text-[11px] text-slate-400">{contrib.department}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-xs font-bold text-blue-400">{contrib.projectCount} projects</span>
                    <p className="text-[10px] text-slate-500 font-mono">{(contrib.linesOfCode / 1000).toFixed(1)}k LOC</p>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-green-500/10 text-green-300 border border-green-500/20 text-[11px] font-bold">
                    {contrib.testCoverage}% Cov
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Summary Footer Banner */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>Real-time analytics recalculated based on enterprise repository database state.</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Total Lines of Code: <strong className="text-slate-300">{(analytics.totalLinesOfCode).toLocaleString()} LOC</strong>
        </div>
      </div>

    </div>
  );
};
