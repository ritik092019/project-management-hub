import React, { useState } from 'react';
import { ProjectFilterParams } from '../types.js';
import { Search, Calendar, User, ShieldCheck, Cpu, SlidersHorizontal, X, ArrowUpDown, RotateCcw, Filter } from 'lucide-react';

interface FilterBarProps {
  filters: ProjectFilterParams;
  onFilterChange: (updated: Partial<ProjectFilterParams>) => void;
  onResetFilters: () => void;
  availableDevelopers: string[];
  availableSupervisors: string[];
  availableTechStacks: string[];
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableDevelopers,
  availableSupervisors,
  availableTechStacks,
  totalResults
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate active filters count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.owner && filters.owner !== 'ALL') count++;
    if (filters.supervisor && filters.supervisor !== 'ALL') count++;
    if (filters.status && filters.status !== 'ALL') count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.techStack && filters.techStack.length > 0) count += filters.techStack.length;
    return count;
  };

  const activeCount = getActiveFilterCount();

  // Date range quick presets
  const handlePresetDate = (preset: 'ALL' | '30DAYS' | '2026_YTD' | 'Q3_2026' | '2025_HIST') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (preset) {
      case 'ALL':
        onFilterChange({ startDate: '', endDate: '' });
        break;
      case '30DAYS': {
        const d30 = new Date();
        d30.setDate(d30.getDate() - 30);
        onFilterChange({ startDate: d30.toISOString().split('T')[0], endDate: todayStr });
        break;
      }
      case '2026_YTD':
        onFilterChange({ startDate: '2026-01-01', endDate: todayStr });
        break;
      case 'Q3_2026':
        onFilterChange({ startDate: '2026-07-01', endDate: '2026-09-30' });
        break;
      case '2025_HIST':
        onFilterChange({ startDate: '2025-01-01', endDate: '2025-12-31' });
        break;
    }
  };

  const handleTechToggle = (tech: string) => {
    const current = filters.techStack || [];
    if (current.includes(tech)) {
      onFilterChange({ techStack: current.filter(t => t !== tech) });
    } else {
      onFilterChange({ techStack: [...current, tech] });
    }
  };

  return (
    <div id="filter-bar-container" className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4">
      
      {/* Top Search & Primary Filter Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="filter-input-search"
            type="text"
            placeholder="Search projects by name, description, owner, tech stack..."
            value={filters.search || ''}
            onChange={e => onFilterChange({ search: e.target.value })}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {filters.search && (
            <button
              id="btn-clear-search"
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Date Presets Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 shrink-0">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1 hidden sm:flex">
            <Calendar className="w-3.5 h-3.5 text-blue-400" /> Date Range:
          </span>
          <button
            onClick={() => handlePresetDate('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
              !filters.startDate && !filters.endDate
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700/80 hover:bg-slate-700'
            }`}
          >
            All Dates
          </button>
          <button
            onClick={() => handlePresetDate('30DAYS')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
              filters.startDate && filters.endDate && new Date(filters.endDate).getTime() - new Date(filters.startDate).getTime() < 31 * 86400000
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700/80 hover:bg-slate-700'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => handlePresetDate('2026_YTD')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
              filters.startDate === '2026-01-01'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700/80 hover:bg-slate-700'
            }`}
          >
            2026 YTD
          </button>
          <button
            onClick={() => handlePresetDate('2025_HIST')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
              filters.startDate === '2025-01-01'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700/80 hover:bg-slate-700'
            }`}
          >
            2025 History
          </button>
        </div>

        {/* Toggle Controls & Filters Count */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-toggle-advanced-filters"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showAdvanced || activeCount > 0
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          {activeCount > 0 && (
            <button
              id="btn-reset-filters"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Clear all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Range Inputs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        
        {/* Start Date */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Deployed From
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              id="filter-start-date"
              type="date"
              value={filters.startDate || ''}
              onChange={e => onFilterChange({ startDate: e.target.value })}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Deployed To
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              id="filter-end-date"
              type="date"
              value={filters.endDate || ''}
              onChange={e => onFilterChange({ endDate: e.target.value })}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Project Status
          </label>
          <select
            id="filter-status"
            value={filters.status || 'ALL'}
            onChange={e => onFilterChange({ status: e.target.value })}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DEPLOYED">Deployed / Live</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="TESTING">Testing / Staging</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* Sort Selection */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Sort Order
          </label>
          <div className="flex items-center gap-1">
            <select
              id="filter-sort-by"
              value={filters.sortBy || 'deploymentDate'}
              onChange={e => onFilterChange({ sortBy: e.target.value as any })}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="deploymentDate">Deployment Date</option>
              <option value="name">Project Name</option>
              <option value="testCoverage">Test Coverage %</option>
              <option value="linesOfCode">Lines of Code</option>
            </select>
            <button
              id="btn-toggle-sort-order"
              onClick={() => onFilterChange({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer shrink-0 border border-slate-700"
              title={`Sort ${filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filter Collapsible Panel */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Owner Dropdown */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-blue-400" /> Owner (Developer)
              </label>
              <select
                id="filter-owner"
                value={filters.owner || 'ALL'}
                onChange={e => onFilterChange({ owner: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Developers</option>
                {availableDevelopers.map(dev => (
                  <option key={dev} value={dev}>{dev}</option>
                ))}
              </select>
            </div>

            {/* Supervisor Dropdown */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-400" /> Supervisor
              </label>
              <select
                id="filter-supervisor"
                value={filters.supervisor || 'ALL'}
                onChange={e => onFilterChange({ supervisor: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Supervisors</option>
                {availableSupervisors.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tech Stack Multi-Select Badges */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-blue-400" /> Tech Stack Filter (Click to toggle)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
              {availableTechStacks.map(tech => {
                const isSelected = filters.techStack?.includes(tech);
                return (
                  <button
                    key={tech}
                    onClick={() => handleTechToggle(tech)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md border border-blue-500'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results Summary Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span>Showing <strong className="text-white font-bold">{totalResults}</strong> project{totalResults === 1 ? '' : 's'} matching criteria</span>
        </div>
        {activeCount > 0 && (
          <span className="text-blue-400 font-bold">
            {activeCount} filter{activeCount === 1 ? '' : 's'} active
          </span>
        )}
      </div>
    </div>
  );
};
