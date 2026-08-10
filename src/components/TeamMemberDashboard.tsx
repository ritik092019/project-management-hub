import React, { useState } from 'react';
import { Project, User, ApprovalStatus } from '../types.js';
import { StatusBadge } from './StatusBadge.js';
import { ApprovalBadge } from './ApprovalBadge.js';
import { updateProject, createProject } from '../services/api.js';
import {
  FolderKanban,
  Plus,
  Github,
  Globe,
  FileText,
  Video,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Code2,
  ExternalLink,
  Edit,
  Trash2,
  Upload,
  Search,
  Sparkles,
  CheckSquare,
  XCircle,
  FileCode,
  ListTodo
} from 'lucide-react';

interface TeamMemberDashboardProps {
  currentUser: User;
  projects: Project[];
  onOpenAddProject: () => void;
  onProjectUpdated: () => void;
  onSelectProject: (projectId: string) => void;
}

export const TeamMemberDashboard: React.FC<TeamMemberDashboardProps> = ({
  currentUser,
  projects,
  onOpenAddProject,
  onProjectUpdated,
  onSelectProject
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectForResources, setSelectedProjectForResources] = useState<Project | null>(null);

  // Resource Upload form state
  const [githubUrl, setGithubUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [docsUrl, setDocsUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [architectureDiagram, setArchitectureDiagram] = useState('');
  const [savingResources, setSavingResources] = useState(false);
  const [resourceMsg, setResourceMsg] = useState('');

  // Developer's assigned projects
  const myProjects = projects.filter(p =>
    currentUser.role === 'ADMIN' ||
    p.ownerEmail.toLowerCase() === currentUser.email.toLowerCase() ||
    p.owner.toLowerCase() === currentUser.name.toLowerCase() ||
    p.teamMembers.some(m => m.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  const filteredProjects = myProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.techStack.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingCount = myProjects.filter(p => p.approvalStatus === 'PENDING_REVIEW' || !p.approvalStatus).length;
  const approvedCount = myProjects.filter(p => p.approvalStatus === 'APPROVED').length;
  const changesRequestedCount = myProjects.filter(p => p.approvalStatus === 'CHANGES_REQUESTED').length;

  const totalLoc = myProjects.reduce((acc, p) => acc + (p.linesOfCode || 0), 0);
  const avgCoverage = myProjects.length ? Math.round(myProjects.reduce((acc, p) => acc + (p.testCoverage || 0), 0) / myProjects.length) : 0;

  const handleOpenResourcesModal = (project: Project) => {
    setSelectedProjectForResources(project);
    setGithubUrl(project.links?.github || '');
    setLiveUrl(project.links?.live || '');
    setDocsUrl(project.links?.docs || '');
    setVideoUrl(project.links?.demo || '');
    setArchitectureDiagram(project.architectureUrl || '');
    setResourceMsg('');
  };

  const handleSaveResources = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForResources) return;

    try {
      setSavingResources(true);
      await updateProject(selectedProjectForResources.id, {
        links: {
          ...selectedProjectForResources.links,
          github: githubUrl.trim() || undefined,
          live: liveUrl.trim() || undefined,
          docs: docsUrl.trim() || undefined,
          demo: videoUrl.trim() || undefined
        },
        architectureUrl: architectureDiagram.trim() || undefined
      });

      setResourceMsg('Resources updated & attached to project spec!');
      onProjectUpdated();
      setTimeout(() => {
        setSelectedProjectForResources(null);
        setResourceMsg('');
      }, 1200);
    } catch (err: any) {
      setResourceMsg(`Error: ${err.message || 'Failed to save resources'}`);
    } finally {
      setSavingResources(false);
    }
  };

  return (
    <div id="team-member-dashboard" className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Code2 className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-white">Team Member Portal & Workspace</h2>
            </div>
            <p className="text-xs text-slate-400">
              Manage your assigned project deliverables, upload technical specs, and track supervisor review status.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAddProject}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create New Spec
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 border-t border-slate-800/80 pt-4">
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <div className="text-lg font-black text-white">{myProjects.length}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">My Projects</div>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <div className="text-lg font-black text-emerald-400">{approvedCount}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approved</div>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <div className="text-lg font-black text-amber-400">{changesRequestedCount + pendingCount}</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pending / Action Req</div>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <div className="text-lg font-black text-blue-400">{avgCoverage}%</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Test Coverage</div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search my projects by name or technology stack..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* My Projects List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <FolderKanban className="w-12 h-12 text-slate-500 mx-auto opacity-60" />
            <h3 className="text-base font-bold text-white">No Projects Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You do not have any projects assigned matching your filter. Click below to create a new project spec.
            </p>
            <button
              onClick={onOpenAddProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              + Create First Project Spec
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProjects.map(project => (
              <div
                key={project.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all shadow-lg space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
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
                    <p className="text-xs text-slate-300 line-clamp-2">{project.summary}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenResourcesModal(project)}
                      className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-400" /> Resources & URLs
                    </button>

                    <button
                      onClick={() => onSelectProject(project.id)}
                      className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Details
                    </button>
                  </div>
                </div>

                {/* Supervisor Feedback / Action Needed Box */}
                {project.approvalStatus === 'CHANGES_REQUESTED' && (
                  <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-xs space-y-2">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> Supervisor Requested Modifications:
                    </div>
                    <p className="text-amber-200/90 italic">"{project.supervisorNotes || 'Please address test coverage or codebase architecture requirements.'}"</p>
                    
                    {project.actionableChanges && project.actionableChanges.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Action Checklist:</span>
                        {project.actionableChanges.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-amber-200 text-[11px]">
                            <CheckSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Resource Badges */}
                <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-1 border-t border-slate-800/80">
                  {project.githubRepo ? (
                    <a href={project.githubRepo} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-300 hover:text-white">
                      <Github className="w-3.5 h-3.5 text-slate-400" /> GitHub Repo
                    </a>
                  ) : (
                    <span className="text-slate-600 text-[11px]">No Repo Attached</span>
                  )}

                  <span>•</span>

                  {project.liveDemoUrl ? (
                    <a href={project.liveDemoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-400 hover:underline">
                      <Globe className="w-3.5 h-3.5" /> Live Preview
                    </a>
                  ) : (
                    <span className="text-slate-600 text-[11px]">No Live URL</span>
                  )}

                  <span>•</span>

                  <span className="text-slate-400 text-[11px]">Supervisor: <strong>{project.supervisor}</strong></span>
                  <span>•</span>
                  <span className="text-slate-400 text-[11px]">Coverage: <strong>{project.testCoverage}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RESOURCE UPLOAD & MANAGEMENT MODAL */}
      {selectedProjectForResources && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden my-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" /> Attach Project Resources
                </h3>
                <p className="text-xs text-slate-400">{selectedProjectForResources.name}</p>
              </div>
              <button
                onClick={() => setSelectedProjectForResources(null)}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResources} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
              {resourceMsg && (
                <div className="p-3 bg-blue-950/80 border border-blue-800 text-blue-200 text-xs rounded-xl">
                  {resourceMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-slate-400" /> GitHub Repository URL
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/organization/repository"
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> Live App / Deployment URL
                </label>
                <input
                  type="url"
                  placeholder="https://my-project-app.run.app"
                  value={liveUrl}
                  onChange={e => setLiveUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" /> Technical Documentation URL
                </label>
                <input
                  type="url"
                  placeholder="https://docs.enterprise.com/spec-1"
                  value={docsUrl}
                  onChange={e => setDocsUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-400" /> Video Demo URL
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=demo"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Architecture Diagram Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={architectureDiagram}
                  onChange={e => setArchitectureDiagram(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProjectForResources(null)}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingResources}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {savingResources ? 'Saving...' : 'Save & Attach Resources'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
