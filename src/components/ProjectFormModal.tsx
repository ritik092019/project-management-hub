import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, ApprovalStatus, User } from '../types.js';
import {
  X,
  Plus,
  Trash2,
  Save,
  Calendar,
  User as UserIcon,
  ShieldCheck,
  Layers,
  Link as LinkIcon,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Tag,
  Code2,
  Globe,
  Sparkles,
  FileText
} from 'lucide-react';

interface ProjectFormModalProps {
  project?: Project | null; // null if adding new
  availableDevelopers: User[];
  availableSupervisors: User[];
  onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<void>;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  project,
  availableDevelopers,
  availableSupervisors,
  onClose,
  onSave
}) => {
  const isEditing = Boolean(project);

  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('WEB_APP');
  const [owner, setOwner] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [deploymentDate, setDeploymentDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('DEPLOYED');
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('APPROVED');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [testCoverage, setTestCoverage] = useState(94);
  const [linesOfCode, setLinesOfCode] = useState(42800);

  // Tech stack tags
  const [techStack, setTechStack] = useState<string[]>([]);
  const [newTechInput, setNewTechInput] = useState('');

  // Image & Links
  const [imageUrl, setImageUrl] = useState('');
  const [github, setGithub] = useState('');
  const [live, setLive] = useState('');
  const [demo, setDemo] = useState('');
  const [docs, setDocs] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setErrorMessage('Image file size must be under 15MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawUrl = event.target?.result as string;
        if (!rawUrl) return;

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
            setImageUrl(compressedUrl);
          } else {
            setImageUrl(rawUrl);
          }
        };
        img.onerror = () => {
          setImageUrl(rawUrl);
        };
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setSummary(project.summary || '');
      setDescription(project.description || '');
      setCategory((project as any).category || 'WEB_APP');
      setOwner(project.owner || '');
      setOwnerEmail(project.ownerEmail || '');
      setSupervisor(project.supervisor || '');
      setSupervisorEmail(project.supervisorEmail || '');
      setDeploymentDate(project.deploymentDate || '');
      setStatus(project.status || 'DEPLOYED');
      setApprovalStatus(project.approvalStatus || 'APPROVED');
      setPriority(project.priority || 'HIGH');
      setTestCoverage(project.testCoverage ?? 94);
      setLinesOfCode(project.linesOfCode ?? 42800);
      setTechStack(project.techStack || []);
      setImageUrl(project.imageUrl || project.architectureUrl || '');
      setGithub(project.links?.github || '');
      setLive(project.links?.live || '');
      setDemo(project.links?.demo || '');
      setDocs(project.links?.docs || '');
    } else {
      // Default initial values for new project
      const todayStr = new Date().toISOString().split('T')[0];
      setDeploymentDate(todayStr);
      setTechStack(['Spring Boot', 'Docker', 'Kubernetes', 'Java 21', 'gRPC', 'Redis', 'PostgreSQL']);
      if (availableDevelopers.length > 0) {
        setOwner(availableDevelopers[0].name);
        setOwnerEmail(availableDevelopers[0].email);
      }
      if (availableSupervisors.length > 0) {
        setSupervisor(availableSupervisors[0].name);
        setSupervisorEmail(availableSupervisors[0].email);
      }
    }
  }, [project, availableDevelopers, availableSupervisors]);

  const handleOwnerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dev = availableDevelopers.find(d => d.name === e.target.value);
    if (dev) {
      setOwner(dev.name);
      setOwnerEmail(dev.email);
    } else {
      setOwner(e.target.value);
    }
  };

  const handleSupervisorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sup = availableSupervisors.find(s => s.name === e.target.value);
    if (sup) {
      setSupervisor(sup.name);
      setSupervisorEmail(sup.email);
    } else {
      setSupervisor(e.target.value);
    }
  };

  const handleAddTech = () => {
    if (newTechInput.trim() && !techStack.includes(newTechInput.trim())) {
      setTechStack([...techStack, newTechInput.trim()]);
      setNewTechInput('');
    }
  };

  const handleRemoveTech = (techToRemove: string) => {
    setTechStack(techStack.filter(t => t !== techToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Project name is required.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Project description is required.');
      return;
    }
    if (!deploymentDate) {
      setErrorMessage('Deployment date is required.');
      return;
    }
    if (techStack.length === 0) {
      setErrorMessage('Please add at least one technology to the tech stack.');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        name,
        summary: summary.trim() || description.slice(0, 150),
        description,
        category: category as any,
        owner,
        ownerEmail,
        supervisor,
        supervisorEmail,
        deploymentDate,
        status,
        approvalStatus,
        priority,
        testCoverage,
        linesOfCode,
        techStack,
        imageUrl: imageUrl.trim() || undefined,
        architectureUrl: imageUrl.trim() || undefined,
        links: {
          github: github.trim() || undefined,
          live: live.trim() || undefined,
          demo: demo.trim() || undefined,
          docs: docs.trim() || undefined
        }
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save project. Check permissions.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="project-form-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div
        id="project-form-modal-content"
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden my-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              {isEditing ? 'Edit Project Specification' : 'Publish New Team Project'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fill in complete project table details (metadata, screenshot, status, approval state, live URL, metrics).
            </p>
          </div>
          <button
            id="btn-close-form-modal"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 text-rose-300 text-xs border border-rose-800 font-semibold flex items-center gap-2 shadow-md">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* SECTION 1: CORE SPECIFICATION */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> 1. Project Identity & Summary
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Project Name *
              </label>
              <input
                id="form-input-name"
                type="text"
                placeholder="e.g. Enterprise Microservices Gateway"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="WEB_APP">Web Application</option>
                  <option value="MOBILE_APP">Mobile Application</option>
                  <option value="MICROSERVICE">Microservice / Backend</option>
                  <option value="AI_ML">AI / Machine Learning</option>
                  <option value="DEV_TOOLS">Developer Tooling</option>
                  <option value="INFRASTRUCTURE">Cloud & Infrastructure</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Priority Banner
                </label>
                <select
                  id="form-input-priority"
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="HIGH">High Priority (Red Badge)</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Card Short Summary (Displayed on Card Face)
              </label>
              <input
                type="text"
                placeholder="e.g. High-throughput enterprise service mesh for distributed payment and billing events."
                value={summary}
                onChange={e => setSummary(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Full Description & Architecture Details *
              </label>
              <textarea
                id="form-input-description"
                rows={3}
                placeholder="Detailed explanation of services, architecture, database schemas, and functionality..."
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  if (!summary) setSummary(e.target.value.slice(0, 150));
                }}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* SECTION 2: OWNERSHIP & GOVERNANCE */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <UserIcon className="w-4 h-4" /> 2. Project Ownership & Supervisor
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" /> Developer (Owner) *
                </label>
                <select
                  id="form-input-owner"
                  value={owner}
                  onChange={handleOwnerSelect}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableDevelopers.map(dev => (
                    <option key={dev.id} value={dev.name}>
                      {dev.name} ({dev.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Supervisor *
                </label>
                <select
                  id="form-input-supervisor"
                  value={supervisor}
                  onChange={handleSupervisorSelect}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableSupervisors.map(sup => (
                    <option key={sup.id} value={sup.name}>
                      {sup.name} ({sup.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: LIFECYCLE, STATUS & APPROVAL */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> 3. Deployment Date, Status & Approval Badge
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" /> Deployment Date *
                </label>
                <input
                  id="form-input-deployment-date"
                  type="date"
                  value={deploymentDate}
                  onChange={e => setDeploymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Lifecycle Status
                </label>
                <select
                  id="form-input-status"
                  value={status}
                  onChange={e => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DEPLOYED">Live / Deployed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="TESTING">Testing Phase</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Approval Badge
                </label>
                <select
                  value={approvalStatus}
                  onChange={e => setApprovalStatus(e.target.value as ApprovalStatus)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="APPROVED">Approved (Green Check)</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="CHANGES_REQUESTED">Changes Requested</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: PROJECT SCREENSHOT / CARD BACKGROUND */}
          <div className="space-y-3 p-4 rounded-2xl bg-purple-950/20 border border-purple-800/40">
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-400" /> 4. Project Screenshot / Card Background Image
              </span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-rose-400 hover:text-rose-300 text-[11px] normal-case cursor-pointer font-bold"
                >
                  Remove Image
                </button>
              )}
            </label>
            <p className="text-[11px] text-slate-400">
              Upload a screenshot file or paste an image URL. This image is rendered as the main header picture on the project card.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-purple-500/40 hover:border-purple-400 hover:bg-purple-950/40 text-purple-200 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-md">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Upload Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {imageUrl && (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-purple-500/40 shadow-lg mt-2 group">
                <img
                  src={imageUrl}
                  alt="Card Background Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end justify-between p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-slate-950/80 px-2 py-0.5 rounded border border-purple-800/50">
                    Card Header Photo Preview
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: LINKS & LIVE APPLICATION */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4" /> 5. Live Application URL & Project Links
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-emerald-300 mb-0.5 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-400" /> Live App URL (Opened by Launch App) *
                </label>
                <input
                  type="url"
                  placeholder="https://app.enterprise-internal.net or http://localhost:5173"
                  value={live}
                  onChange={e => setLive(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-emerald-500/40 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-0.5">GitHub Repository URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/org/repo"
                  value={github}
                  onChange={e => setGithub(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-0.5">Video Demo URL</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=demo"
                  value={demo}
                  onChange={e => setDemo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-0.5">Documentation URL</label>
                <input
                  type="url"
                  placeholder="https://docs.enterprise-internal.net"
                  value={docs}
                  onChange={e => setDocs(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: METRICS & TECH STACK */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Code2 className="w-4 h-4" /> 6. Code Metrics & Technology Stack
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Test Pass Coverage ({testCoverage}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={testCoverage}
                  onChange={e => setTestCoverage(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Lines of Code (LOC)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={linesOfCode}
                  onChange={e => setLinesOfCode(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" /> Technology Stack Tags *
              </label>
              <div className="flex gap-2 mb-2.5">
                <input
                  type="text"
                  placeholder="e.g. Spring Boot, Docker, Kubernetes, Java 21, gRPC, Redis, PostgreSQL..."
                  value={newTechInput}
                  onChange={e => setNewTechInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTech();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={handleAddTech}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md"
                >
                  Add Tag
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {techStack.map(tech => (
                  <span
                    key={tech}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-200 border border-slate-700 flex items-center gap-1.5 shadow-sm"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(tech)}
                      className="text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 cursor-pointer border border-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              id="btn-submit-project"
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : isEditing ? 'Update Project Specification' : 'Save & Publish Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
