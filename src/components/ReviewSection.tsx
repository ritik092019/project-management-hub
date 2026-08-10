import React, { useState, useEffect } from 'react';
import { Project, ReviewNote, User, ApprovalStatus } from '../types.js';
import { fetchProjectReviews, updateProjectApprovalStatus } from '../services/api.js';
import { ApprovalBadge } from './ApprovalBadge.js';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Star,
  Plus,
  Trash2,
  Send,
  FileCheck,
  CheckSquare
} from 'lucide-react';

interface ReviewSectionProps {
  project: Project;
  currentUser: User | null;
  onProjectUpdated?: (updatedProject: Project) => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  project,
  currentUser,
  onProjectUpdated
}) => {
  const [reviews, setReviews] = useState<ReviewNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ApprovalStatus>(project.approvalStatus || 'PENDING_REVIEW');
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [changesList, setChangesList] = useState<string[]>([]);
  const [newChangeItem, setNewChangeItem] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSupervisorOrAdmin = currentUser && (currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMIN');

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await fetchProjectReviews(project.id);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load project reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    setSelectedStatus(project.approvalStatus || 'PENDING_REVIEW');
  }, [project.id, project.approvalStatus]);

  const handleAddChangeItem = () => {
    if (newChangeItem.trim()) {
      setChangesList([...changesList, newChangeItem.trim()]);
      setNewChangeItem('');
    }
  };

  const handleRemoveChangeItem = (index: number) => {
    setChangesList(changesList.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (!isSupervisorOrAdmin) return;

    try {
      setSubmitting(true);
      const result = await updateProjectApprovalStatus(
        project.id,
        selectedStatus,
        feedbackText,
        rating,
        changesList
      );

      setFeedbackText('');
      setChangesList([]);
      await loadReviews();

      if (onProjectUpdated) {
        onProjectUpdated(result.project);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit review decision');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">Project Approval & Supervisor Governance</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Supervisor sign-offs, compliance reviews, and change requests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400">Current Status:</span>
          <ApprovalBadge status={project.approvalStatus || 'PENDING_REVIEW'} size="md" />
        </div>
      </div>

      {/* Supervisor Review Submission Form (Only for Supervisors and Admins) */}
      {isSupervisorOrAdmin ? (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Submit Supervisor Review & Decision
            </h4>
          </div>

          {/* Decision Status Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Set Approval Decision:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedStatus('APPROVED')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedStatus === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-2 ring-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Approved</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('CHANGES_REQUESTED')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedStatus === 'CHANGES_REQUESTED'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-2 ring-amber-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Changes Requested</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('REJECTED')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedStatus === 'REJECTED'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 ring-2 ring-rose-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Rejected</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus('PENDING_REVIEW')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedStatus === 'PENDING_REVIEW'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 ring-2 ring-purple-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Pending Review</span>
              </button>
            </div>
          </div>

          {/* Supervisor Rating */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Technical Score / Quality Rating:</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                >
                  <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-400' : 'text-slate-700'}`} />
                </button>
              ))}
              <span className="text-xs text-slate-400 font-semibold ml-2">{rating} / 5 Stars</span>
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Supervisor Feedback & Review Notes:</label>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Provide constructive review comments regarding architecture, test coverage, code quality, or security standards..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Actionable Checklist / Changes Requested */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Action Items / Changes Requested List (Optional):</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChangeItem}
                onChange={e => setNewChangeItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddChangeItem(); } }}
                placeholder="e.g., Increase test coverage to 90%, add rate-limiting headers..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleAddChangeItem}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {changesList.length > 0 && (
              <ul className="space-y-1.5 pt-1">
                {changesList.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveChangeItem(idx)}
                      className="text-slate-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/50 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Updating Decision...' : 'Publish Official Supervisor Review'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 text-center text-xs text-slate-400">
          Supervisors and Admins can update the official approval status and log review notes.
        </div>
      )}

      {/* Historic Review Notes Log */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Review Notes & Decision Audit Log ({reviews.length})
        </h4>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading supervisor reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-6 text-center bg-slate-900/30 rounded-2xl border border-slate-800 text-xs text-slate-400">
            No official supervisor review notes recorded yet.
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src={review.supervisorAvatar}
                    alt={review.supervisorName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/40"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{review.supervisorName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        SUPERVISOR
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(review.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < (review.rating || 5) ? 'fill-amber-400' : 'text-slate-700'}`}
                      />
                    ))}
                  </div>
                  <ApprovalBadge status={review.approvalStatus} size="sm" />
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {review.feedbackText}
              </p>

              {review.changesRequestedList && review.changesRequestedList.length > 0 && (
                <div className="space-y-1.5 bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Action Items Required:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-xs text-amber-200/90 pl-1">
                    {review.changesRequestedList.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
