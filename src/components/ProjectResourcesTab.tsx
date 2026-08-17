import React, { useState, useEffect } from 'react';
import { Project, User, ProjectResource, ResourceType, GithubRepoInfo } from '../types.js';
import { fetchProjectFiles, uploadProjectFile, deleteProjectFile, fetchGithubRepoInfo } from '../services/api.js';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  FileCode,
  Download,
  Trash2,
  Github,
  Star,
  GitFork,
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  Code2,
  Layers,
  Sparkles,
  Plus
} from 'lucide-react';

interface ProjectResourcesTabProps {
  project: Project;
  currentUser: User | null;
}

export const ProjectResourcesTab: React.FC<ProjectResourcesTabProps> = ({ project, currentUser }) => {
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [githubInfo, setGithubInfo] = useState<GithubRepoInfo | null>(null);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resourceType, setResourceType] = useState<ResourceType>('SCREENSHOT');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const canManage = currentUser && (
    currentUser.role === 'ADMIN' ||
    (currentUser.role === 'SUPERVISOR' && (project.supervisorEmail === currentUser.email || currentUser.email === 'supervisor@team.com')) ||
    (currentUser.role === 'DEVELOPER' && project.ownerEmail === currentUser.email)
  );

  const loadResources = async () => {
    try {
      setLoadingResources(true);
      const data = await fetchProjectFiles(project.id);
      setResources(data);
    } catch (err) {
      console.error('Failed to load project resources:', err);
    } finally {
      setLoadingResources(false);
    }
  };

  const loadGithub = async () => {
    if (!project.links?.github && !(project as any).githubUrl) return;
    const url = project.links?.github || (project as any).githubUrl;
    try {
      setLoadingGithub(true);
      const info = await fetchGithubRepoInfo(url || project.id);
      setGithubInfo(info);
    } catch (err) {
      console.error('Failed to load GitHub info:', err);
    } finally {
      setLoadingGithub(false);
    }
  };

  useEffect(() => {
    loadResources();
    loadGithub();
  }, [project.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Auto set resource type
      if (file.type.startsWith('image/')) {
        setResourceType('SCREENSHOT');
      } else if (file.type === 'application/pdf') {
        setResourceType('DOCUMENTATION');
      } else if (file.type.includes('presentation') || file.type.includes('powerpoint')) {
        setResourceType('PRESENTATION');
      } else if (file.type.startsWith('video/')) {
        setResourceType('DEMO_VIDEO');
      } else {
        setResourceType('OTHER');
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const uploaded = await uploadProjectFile(project.id, selectedFile, resourceType, description);
      setResources(prev => [uploaded, ...prev]);
      setSuccessMsg(`"${selectedFile.name}" uploaded successfully!`);
      setSelectedFile(null);
      setDescription('');
      setShowUploadForm(false);

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResource = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deleteProjectFile(id);
      setResources(prev => prev.filter(r => r.id !== id));
      setSuccessMsg('Resource removed');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete resource');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getResourceTypeBadge = (type: ResourceType) => {
    switch (type) {
      case 'SCREENSHOT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Screenshot</span>;
      case 'ARCHITECTURE_DIAGRAM':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">Architecture</span>;
      case 'DOCUMENTATION':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">Doc PDF</span>;
      case 'PRESENTATION':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Presentation</span>;
      case 'DEMO_VIDEO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Video Demo</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">Resource</span>;
    }
  };

  const screenshots = resources.filter(r => r.type === 'SCREENSHOT' || r.type === 'ARCHITECTURE_DIAGRAM' || r.mimeType?.startsWith('image/'));
  const documents = resources.filter(r => r.type !== 'SCREENSHOT' && r.type !== 'ARCHITECTURE_DIAGRAM' && !r.mimeType?.startsWith('image/'));

  return (
    <div className="space-y-6 text-slate-200">
      {/* Messages */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Project Resources & GitHub Intelligence</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cloud-hosted media assets, specs, and live repository telemetry
          </p>
        </div>

        {canManage && !showUploadForm && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Resource</span>
          </button>
        )}
      </div>

      {/* Upload Modal / Form */}
      {showUploadForm && (
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-blue-500/30 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <Upload className="w-4 h-4" /> Upload New Resource File
            </span>
            <button
              onClick={() => setShowUploadForm(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Select File (Max 50MB)
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 cursor-pointer bg-slate-900 border border-slate-800 rounded-xl p-1.5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Resource Category
                </label>
                <select
                  value={resourceType}
                  onChange={e => setResourceType(e.target.value as ResourceType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="SCREENSHOT">Screenshot / UI Mockup</option>
                  <option value="ARCHITECTURE_DIAGRAM">Architecture Diagram</option>
                  <option value="DOCUMENTATION">PDF Documentation</option>
                  <option value="PRESENTATION">Slide Deck / Presentation</option>
                  <option value="DEMO_VIDEO">Demo Video MP4/WebM</option>
                  <option value="OTHER">Other Project File</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Description / Context (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g., System architecture flow diagram v2"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-md transition-all"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload to Cloud</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GitHub Repository Live Stats */}
      {loadingGithub ? (
        <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Fetching live GitHub repository metadata...</span>
        </div>
      ) : githubInfo ? (
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 shadow-inner space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                <Github className="w-5 h-5 text-white" />
              </div>
              <div>
                <a
                  href={githubInfo.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-white hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                >
                  <span>{githubInfo.fullName}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  {githubInfo.description || 'No repository description provided'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Branch: {githubInfo.defaultBranch}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                githubInfo.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {githubInfo.status}
              </span>
            </div>
          </div>

          {/* Key Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
              <Star className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">{githubInfo.stars}</div>
                <div className="text-[10px] text-slate-400">Stars</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
              <GitFork className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">{githubInfo.forks}</div>
                <div className="text-[10px] text-slate-400">Forks</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">{githubInfo.openIssues}</div>
                <div className="text-[10px] text-slate-400">Open Issues</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-3">
              <Eye className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">{githubInfo.subscribersCount}</div>
                <div className="text-[10px] text-slate-400">Subscribers</div>
              </div>
            </div>
          </div>

          {/* Languages & Latest Commit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Top Languages */}
            {githubInfo.topLanguages?.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 block mb-2">
                  Top Languages Breakdown
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {githubInfo.topLanguages.map((lang, idx) => (
                    <span
                      key={lang}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Commit */}
            {githubInfo.latestCommit && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">
                  Latest Commit on {githubInfo.defaultBranch}
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-blue-400 text-[11px] font-bold">
                    {githubInfo.latestCommit.sha}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(githubInfo.latestCommit.authorDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-1 truncate">
                  "{githubInfo.latestCommit.message}"
                </p>
                <div className="text-[10px] text-slate-400 mt-1">
                  by {githubInfo.latestCommit.authorName}
                </div>
              </div>
            )}
          </div>

          {/* Contributors */}
          {githubInfo.contributors?.length > 0 && (
            <div className="pt-1">
              <span className="text-[11px] font-bold text-slate-400 block mb-2">
                Top Contributors ({githubInfo.contributors.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {githubInfo.contributors.map(c => (
                  <a
                    key={c.login}
                    href={c.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs transition-colors"
                  >
                    <img src={c.avatarUrl} alt={c.login} className="w-4 h-4 rounded-full" />
                    <span className="text-slate-300 font-medium text-[11px]">{c.login}</span>
                    <span className="text-[10px] text-slate-500 font-bold">({c.contributions})</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : project.links?.github || (project as any).githubUrl ? (
        <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 text-center">
          Unable to load GitHub details or repository is private.
        </div>
      ) : null}

      {/* Screenshots Gallery Section */}
      <div>
        <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          <span>Screenshots & Visual Diagrams ({screenshots.length})</span>
        </h4>

        {screenshots.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950/30 border border-dashed border-slate-800 text-center text-xs text-slate-500">
            No screenshots or architecture diagrams uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {screenshots.map(file => (
              <div
                key={file.id}
                className="group relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col"
              >
                <div className="relative h-32 w-full overflow-hidden bg-slate-900">
                  <img
                    src={file.storageUrl}
                    alt={file.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                      href={file.storageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl bg-slate-900/90 text-white hover:bg-blue-600 transition-colors shadow-md"
                      title="View Full Size"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    {canManage && (
                      <button
                        onClick={() => handleDeleteResource(file.id, file.originalName)}
                        className="p-1.5 rounded-xl bg-rose-600/90 text-white hover:bg-rose-600 transition-colors shadow-md cursor-pointer"
                        title="Delete Resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-2.5 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-200 truncate" title={file.originalName}>
                      {file.originalName}
                    </span>
                    {getResourceTypeBadge(file.type)}
                  </div>
                  {file.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-1">{file.description}</p>
                  )}
                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-900">
                    <span>{formatBytes(file.sizeBytes)}</span>
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents & PDF Section */}
      <div>
        <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-purple-400" />
          <span>Documentation & External Files ({documents.length})</span>
        </h4>

        {documents.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-950/30 border border-dashed border-slate-800 text-center text-xs text-slate-500">
            No documentation PDFs or presentations attached yet.
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map(file => (
              <div
                key={file.id}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-slate-900 text-purple-400 border border-slate-800 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white truncate" title={file.originalName}>
                        {file.originalName}
                      </span>
                      {getResourceTypeBadge(file.type)}
                    </div>
                    {file.description && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{file.description}</p>
                    )}
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-1">
                      <span>{formatBytes(file.sizeBytes)}</span>
                      <span>•</span>
                      <span>Uploaded by {file.uploader?.name || 'User'}</span>
                      <span>•</span>
                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={file.storageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                  {canManage && (
                    <button
                      onClick={() => handleDeleteResource(file.id, file.originalName)}
                      className="p-1.5 rounded-xl bg-rose-600/10 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/20 transition-all cursor-pointer"
                      title="Delete File"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
