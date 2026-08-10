import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus, User } from '../types.js';
import { X, Plus, Trash2, Save, Calendar, User as UserIcon, ShieldCheck, Layers, Link as LinkIcon } from 'lucide-react';

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
  const [owner, setOwner] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [deploymentDate, setDeploymentDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('DEPLOYED');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [testCoverage, setTestCoverage] = useState(85);
  const [linesOfCode, setLinesOfCode] = useState(15000);
  
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

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setSummary(project.summary || '');
      setDescription(project.description || '');
      setOwner(project.owner || '');
      setOwnerEmail(project.ownerEmail || '');
      setSupervisor(project.supervisor || '');
      setSupervisorEmail(project.supervisorEmail || '');
      setDeploymentDate(project.deploymentDate || '');
      setStatus(project.status || 'DEPLOYED');
      setPriority(project.priority || 'MEDIUM');
      setTestCoverage(project.testCoverage || 85);
      setLinesOfCode(project.linesOfCode || 15000);
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
      setTechStack(['Spring Boot', 'React', 'PostgreSQL', 'Docker']);
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
        summary: summary || description.slice(0, 100),
        description,
        owner,
        ownerEmail,
        supervisor,
        supervisorEmail,
        deploymentDate,
        status,
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
    <div id="project-form-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div
        id="project-form-modal-content"
        className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden my-8"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEditing ? 'Edit Team Project' : 'Add New Team Project'}
            </h2>
            <p className="text-xs text-slate-400">
              Fill in key metadata, deployment dates, links, and technology stack.
            </p>
          </div>
          <button
            id="btn-close-form-modal"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 text-rose-300 text-xs border border-rose-800 font-medium">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Project Name */}
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
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Owner & Supervisor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-green-400" /> Developer (Owner) *
              </label>
              <select
                id="form-input-owner"
                value={owner}
                onChange={handleOwnerSelect}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableSupervisors.map(sup => (
                  <option key={sup.id} value={sup.name}>
                    {sup.name} ({sup.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Deployment Date, Status & Priority */}
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Status
              </label>
              <select
                id="form-input-status"
                value={status}
                onChange={e => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DEPLOYED">Deployed / Active</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="TESTING">Testing Phase</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Priority
              </label>
              <select
                id="form-input-priority"
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Description & Architecture Details *
            </label>
            <textarea
              id="form-input-description"
              rows={3}
              placeholder="Detailed summary of architecture, Spring Boot services, database schemas, and purpose..."
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                if (!summary) setSummary(e.target.value.slice(0, 100));
              }}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Tech Stack Tag Builder */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-400" /> Tech Stack Tags *
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="e.g. Spring Boot, React, PostgreSQL..."
                value={newTechInput}
                onChange={e => setNewTechInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500"
              />
              <button
                type="button"
                onClick={handleAddTech}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Add Tag
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {techStack.map(tech => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center gap-1"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(tech)}
                    className="text-blue-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Project View Photo URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-purple-400" /> Project View Photo URL (Card Background / Thumbnail)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-... or custom screenshot URL"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Links Section */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-blue-400" /> Links & Artifact URLs
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">GitHub Repository URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/org/repo"
                  value={github}
                  onChange={e => setGithub(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Live Production URL</label>
                <input
                  type="url"
                  placeholder="https://app.enterprise-internal.net"
                  value={live}
                  onChange={e => setLive(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Video Demo URL</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=demo"
                  value={demo}
                  onChange={e => setDemo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Documentation URL</label>
                <input
                  type="url"
                  placeholder="https://docs.enterprise-internal.net"
                  value={docs}
                  onChange={e => setDocs(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Test Coverage & Lines of Code */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Test Coverage ({testCoverage}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={testCoverage}
                onChange={e => setTestCoverage(Number(e.target.value))}
                className="w-full accent-blue-600"
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
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer border border-slate-800"
            >
              Cancel
            </button>

            <button
              id="btn-submit-project"
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : isEditing ? 'Update Project' : 'Save New Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
