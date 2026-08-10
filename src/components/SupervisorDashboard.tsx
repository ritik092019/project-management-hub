import React, { useState, useEffect } from 'react';
import { Project, User, ApprovalStatus, ReviewNote, ActivityItem } from '../types.js';
import { StatusBadge } from './StatusBadge.js';
import { ApprovalBadge } from './ApprovalBadge.js';
import { updateProjectApprovalStatus, fetchProjectReviews, fetchUsers } from '../services/api.js';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  Star,
  FileText,
  Plus,
  Trash2,
  ListCheck,
  Send,
  Layers,
  Search,
  ExternalLink,
  Code2,
  CheckSquare
} from 'lucide-react';

interface SupervisorDashboardProps {
  currentUser: User;
  projects: Project[];
  onProjectUpdated: () => void;
  onSelectProject: (projectId: string) => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  currentUser,
  projects,
  onProjectUpdated,
  onSelectProject
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ALL_SUPERVISED' | 'TEAM_PERFORMANCE'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectForReview, setSelectedProjectForReview] = useState<Project | null>(null);

  // Review Form state
  const [reviewStatus, setReviewStatus] = useState<ApprovalStatus>('APPROVED');
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [changesList, setChangesList] = useState<string[]>([]);
  const [newChangeItem, setNewChangeItem] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Supervised projects filter
  const supervisedProjects = projects.filter(p =>
    currentUser.role === 'ADMIN' ||
    p.supervisorEmail.toLowerCase() === currentUser.email.toLowerCase() ||
    p.supervisor.toLowerCase() === currentUser.name.toLowerCase()
  );

  const pendingProjects = supervisedProjects.filter(p =>
    !p.approvalStatus || p.approvalStatus === 'PENDING_REVIEW' || p.approvalStatus === 'CHANGES_REQUESTED'
  );

  const approvedProjectsCount = supervisedProjects.filter(p => p.approvalStatus === 'APPROVED').length;

  const filteredPending = pendingProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.techStack.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredAll = supervisedProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.techStack.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenReviewModal = (project: Project) => {
    setSelectedProjectForReview(project);
    setReviewStatus(project.approvalStatus === 'CHANGES_REQUESTED' ? 'CHANGES_REQUESTED' : 'APPROVED');
    setFeedbackText('');
    setRating(5);
    setChangesList([]);
    setNewChangeItem('');
    setReviewError('');
    setReviewSuccess('');
  };

  const handleAddChangeItem = () => {
    if (newChangeItem.trim()) {
      setChangesList([...changesList, newChangeItem.trim()]);
      setNewChangeItem('');
    }
  };

  const handleRemoveChangeItem = (index: number) => {
    setChangesList(changesList.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForReview) return;

    try {
      setSubmittingReview(true);
      setReviewError('');
      await updateProjectApprovalStatus(
        selectedProjectForReview.id,
        reviewStatus,
        feedbackText.trim() || `Approval decision set to ${reviewStatus.replace('_', ' ')}`,
        rating,
        changesList
      );

      setReviewSuccess('Review decision saved successfully!');
      onProjectUpdated();
      setTimeout(() => {
        setSelectedProjectForReview(null);
        setReviewSuccess('');
      }, 1200);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Calculate Developer Performance metrics
  const developersMap = new Map<string, { count: number; avgCoverage: number; approvedCount: number }>();
  supervisedProjects.forEach(p => {
    const dev = p.owner;
    const current = developersMap.get(dev) || { count: 0, avgCoverage: 0, approvedCount: 0 };
    current.count += 1;
    current.avgCoverage += p.testCoverage;
    if (p.approvalStatus === 'APPROVED') current.approvedCount += 1;
    developersMap.set(dev, current);
  });

  const devPerformance = Array.from(developersMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    avgCoverage: Math.round(data.avgCoverage / data.count),
    approvedCount: data.approvedCount,
    approvalRate: Math.round((data.approvedCount / data.count) * 100)
  }));

  return (
    <div id="supervisor-dashboard" className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <UserCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-white">Supervisor Review Hub</h2>
            </div>
            <p className="text-xs text-slate-400">
              Review project submissions, provide feedback, approve releases, and monitor team code quality.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-lg font-black text-amber-400">{pendingProjects.length}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending Review</div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-lg font-black text-emerald-400">{approvedProjectsCount}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approved</div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-lg font-black text-blue-400">{supervisedProjects.length}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Supervised</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-t border-slate-800/80 pt-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Approvals Queue ({pendingProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ALL_SUPERVISED')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'ALL_SUPERVISED'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Supervised Projects ({supervisedProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('TEAM_PERFORMANCE')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'TEAM_PERFORMANCE'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Team Performance Matrix</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search supervised projects by name, owner developer, or tech stack..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* TAB 1: PENDING APPROVALS QUEUE */}
      {activeTab === 'PENDING' && (
        <div className="space-y-4">
          {filteredPending.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-80" />
              <h3 className="text-base font-bold text-white">All Supervised Projects Reviewed</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No project submissions are currently awaiting your approval or review notes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredPending.map(project => (
                <div
                  key={project.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        onClick={() => onSelectProject(project.id)}
                        className="text-base font-bold text-white hover:text-blue-400 cursor-pointer transition-colors"
                      >
                        {project.name}
                      </h3>
                      <StatusBadge status={project.status} size="sm" />
                      <ApprovalBadge status={project.approvalStatus} size="sm" />
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2">{project.summary || project.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
                      <span><strong>Developer:</strong> {project.owner} ({project.ownerEmail})</span>
                      <span>•</span>
                      <span><strong>Coverage:</strong> {project.testCoverage}%</span>
                      <span>•</span>
                      <span><strong>Deployment:</strong> {project.deploymentDate}</span>
                    </div>

                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {project.techStack.map(tech => (
                        <span key={tech} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Spec
                    </button>

                    <button
                      onClick={() => handleOpenReviewModal(project)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                    >
                      <ClipboardCheck className="w-4 h-4" /> Conduct Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL SUPERVISED PROJECTS */}
      {activeTab === 'ALL_SUPERVISED' && (
        <div className="grid grid-cols-1 gap-4">
          {filteredAll.map(project => (
            <div
              key={project.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg hover:border-slate-700 transition-all"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    onClick={() => onSelectProject(project.id)}
                    className="text-base font-bold text-white hover:text-blue-400 cursor-pointer transition-colors"
                  >
                    {project.name}
                  </h3>
                  <StatusBadge status={project.status} size="sm" />
                  <ApprovalBadge status={project.approvalStatus} size="sm" />
                </div>
                <p className="text-xs text-slate-300 line-clamp-1">{project.summary}</p>
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Developer: {project.owner}</span>
                  <span>•</span>
                  <span>Test Coverage: {project.testCoverage}%</span>
                  <span>•</span>
                  <span>LOC: {project.linesOfCode.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleOpenReviewModal(project)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" /> Review / Update
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: TEAM PERFORMANCE MATRIX */}
      {activeTab === 'TEAM_PERFORMANCE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white">Supervised Developer Performance Matrix</h3>
            <p className="text-xs text-slate-400">Workload distribution, approval rates, and test coverage metrics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devPerformance.map(dev => (
              <div key={dev.name} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-100">{dev.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                    {dev.count} Projects
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Test Coverage:</span>
                    <span className="font-bold text-emerald-400">{dev.avgCoverage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${dev.avgCoverage}%` }} />
                  </div>

                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">Approval Rate:</span>
                    <span className="font-bold text-blue-400">{dev.approvalRate}% ({dev.approvedCount}/{dev.count})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INTERACTIVE REVIEW DECISION MODAL */}
      {selectedProjectForReview && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden my-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-blue-400" />
                  Supervisor Project Review
                </h3>
                <p className="text-xs text-slate-400">{selectedProjectForReview.name} • Developer: {selectedProjectForReview.owner}</p>
              </div>
              <button
                onClick={() => setSelectedProjectForReview(null)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitReview} className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
              {reviewError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs rounded-xl">
                  ⚠️ {reviewError}
                </div>
              )}
              {reviewSuccess && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs rounded-xl">
                  ✅ {reviewSuccess}
                </div>
              )}

              {/* Status Decision Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Review Decision *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('APPROVED')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      reviewStatus === 'APPROVED'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('CHANGES_REQUESTED')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      reviewStatus === 'CHANGES_REQUESTED'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> Changes Req.
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('REJECTED')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      reviewStatus === 'REJECTED'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-400" /> Reject
                  </button>
                </div>
              </div>

              {/* Quality Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Quality Rating (1-5 Stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        rating >= star
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-600'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Feedback Text */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Reviewer Notes & Feedback
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide feedback on architecture, code quality, test coverage, or required fixes..."
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actionable Changes Checklist */}
              {reviewStatus === 'CHANGES_REQUESTED' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Actionable Items for Developer
                  </label>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Increase test coverage to 90%..."
                      value={newChangeItem}
                      onChange={e => setNewChangeItem(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChangeItem(); } }}
                      className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddChangeItem}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {changesList.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {changesList.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                          <span>• {item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveChangeItem(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProjectForReview(null)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingReview ? 'Saving Review...' : 'Submit Review Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
