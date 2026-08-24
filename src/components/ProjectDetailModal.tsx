import React, { useState, useEffect } from 'react';
import { Project, User } from '../types.js';
import { StatusBadge } from './StatusBadge.js';
import { ApprovalBadge } from './ApprovalBadge.js';
import { CommentSection } from './CommentSection.js';
import { ReviewSection } from './ReviewSection.js';
import { ActivityTimeline } from './ActivityTimeline.js';
import { LowLatencySummaryButton } from './LowLatencySummaryButton.js';
import { fetchUsers, formatExternalUrl } from '../services/api.js';
import { ProjectResourcesTab } from './ProjectResourcesTab.js';
import {
  X,
  Calendar,
  User as UserIcon,
  ShieldCheck,
  Github,
  ExternalLink,
  Play,
  FileText,
  Code2,
  Users,
  Layers,
  Edit3,
  Trash2,
  MessageSquare,
  History,
  FolderGit2
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  currentUser: User | null;
  onClose: () => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onProjectUpdated?: (updatedProject: Project) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  currentUser,
  onClose,
  onEdit,
  onDelete,
  onProjectUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'comments' | 'reviews' | 'activity'>('overview');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(project);

  useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  useEffect(() => {
    fetchUsers().then(u => setUsersList(u)).catch(() => {});
  }, []);

  if (!currentProject) return null;

  const canEdit = currentUser && (
    currentUser.role === 'ADMIN' ||
    (currentUser.role === 'SUPERVISOR' && (currentProject.supervisorEmail === currentUser.email || currentUser.email === 'supervisor@team.com')) ||
    (currentUser.role === 'DEVELOPER' && currentProject.ownerEmail === currentUser.email)
  );

  const canDelete = currentUser && (
    currentUser.role === 'ADMIN' ||
    (currentUser.role === 'SUPERVISOR' && (currentProject.supervisorEmail === currentUser.email || currentUser.email === 'supervisor@team.com')) ||
    (currentUser.role === 'DEVELOPER' && currentProject.ownerEmail === currentUser.email)
  );

  const handleProjectUpdated = (updated: Project) => {
    setCurrentProject(updated);
    if (onProjectUpdated) {
      onProjectUpdated(updated);
    }
  };

  return (
    <div id="project-detail-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        id="project-detail-modal-content"
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden my-6 transform transition-all flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Preview Image / Banner */}
        <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-slate-950 shrink-0">
          <img
            src={currentProject.architectureUrl || 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80'}
            alt={currentProject.name}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          
          {/* Close Button */}
          <button
            id="btn-close-detail-modal"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors backdrop-blur-md cursor-pointer border border-slate-700 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Banner Details */}
          <div className="absolute bottom-3 left-6 right-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <StatusBadge status={currentProject.status} size="md" />
                <ApprovalBadge status={currentProject.approvalStatus || 'PENDING_REVIEW'} size="md" />
                {currentProject.priority && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {currentProject.priority} PRIORITY
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {currentProject.name}
              </h2>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {currentProject.links?.live && (
                <a
                  href={formatExternalUrl(currentProject.links.live)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer group/launch"
                  title={`Open Live App: ${formatExternalUrl(currentProject.links.live)}`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                  <span>Launch App</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover/launch:translate-x-0.5 transition-transform" />
                </a>
              )}

              {currentProject.links?.github && (
                <a
                  href={formatExternalUrl(currentProject.links.github)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold shadow-md transition-all cursor-pointer border border-slate-700"
                  title={`Open GitHub Repository: ${formatExternalUrl(currentProject.links.github)}`}
                >
                  <Github className="w-3.5 h-3.5 text-slate-300" />
                  <span>GitHub Code</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}

              {(currentProject.links?.docs || (currentProject as any).documentationUrl) && (
                <a
                  href={formatExternalUrl(currentProject.links?.docs || (currentProject as any).documentationUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-bold shadow-md transition-all cursor-pointer border border-blue-500/50"
                  title="Open Project Documentation"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Docs</span>
                  <ExternalLink className="w-3 h-3 text-blue-400" />
                </a>
              )}

              <LowLatencySummaryButton
                projectId={currentProject.id}
                projectName={currentProject.name}
                buttonText="Flash AI Insights"
                size="md"
              />

              {canEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(currentProject);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Spec</span>
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => {
                    onClose();
                    onDelete(currentProject);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-950 border-b border-slate-800 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400 bg-slate-900/60 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Overview & Spec</span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'resources'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/60 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Resources & GitHub</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'comments'
                ? 'border-blue-500 text-blue-400 bg-slate-900/60 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Discussions & Comments</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-purple-500 text-purple-400 bg-slate-900/60 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Supervisor Approval</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/60 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Activity Log</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Deployment Date</span>
                  <span className="text-xs font-bold text-white flex items-center gap-1 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" /> {currentProject.deploymentDate}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Developer (Owner)</span>
                  <span className="text-xs font-bold text-white flex items-center gap-1 mt-1">
                    <UserIcon className="w-3.5 h-3.5 text-green-400" /> {currentProject.owner}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Supervisor</span>
                  <span className="text-xs font-bold text-white flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> {currentProject.supervisor}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Test Coverage</span>
                  <span className="text-xs font-bold text-white flex items-center gap-1 mt-1">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" /> {currentProject.testCoverage}%
                  </span>
                </div>
              </div>

              {/* Summary & Overview */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Project Summary & Architecture
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {currentProject.description}
                </p>
              </div>

              {/* Tech Stack */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-400" /> Technology Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentProject.techStack.map(tech => (
                    <span
                      key={tech}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Team Members */}
              {currentProject.teamMembers && currentProject.teamMembers.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-green-400" /> Contributors & Team Members
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {currentProject.teamMembers.map(member => (
                      <span
                        key={member}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5"
                      >
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Deployment & Repository Links
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentProject.links?.github && (
                    <a
                      href={formatExternalUrl(currentProject.links.github)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors border border-slate-700"
                    >
                      <Github className="w-4 h-4" />
                      <span>GitHub Repository</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-auto text-slate-400" />
                    </a>
                  )}

                  {currentProject.links?.live && (
                    <a
                      href={formatExternalUrl(currentProject.links.live)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-300 font-medium text-xs transition-colors border border-green-500/30"
                    >
                      <ExternalLink className="w-4 h-4 text-green-400" />
                      <span>Live Production App</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-auto text-green-400" />
                    </a>
                  )}

                  {currentProject.links?.demo && (
                    <a
                      href={formatExternalUrl(currentProject.links.demo)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-xs transition-colors border border-amber-500/30"
                    >
                      <Play className="w-4 h-4 text-amber-400" />
                      <span>Watch Video Demo</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-auto text-amber-400" />
                    </a>
                  )}

                  {currentProject.links?.docs && (
                    <a
                      href={formatExternalUrl(currentProject.links.docs)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-medium text-xs transition-colors border border-blue-500/30"
                    >
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span>Architecture Docs</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-auto text-blue-400" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <ProjectResourcesTab project={currentProject} currentUser={currentUser} />
          )}

          {activeTab === 'comments' && (
            <CommentSection
              projectId={currentProject.id}
              currentUser={currentUser}
              usersList={usersList}
            />
          )}

          {activeTab === 'reviews' && (
            <ReviewSection
              project={currentProject}
              currentUser={currentUser}
              onProjectUpdated={handleProjectUpdated}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityTimeline projectId={currentProject.id} />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Project ID: <code className="font-mono text-slate-300">{currentProject.id}</code></span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer border border-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
