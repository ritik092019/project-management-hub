import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { Project, User } from '../types.js';
import { formatExternalUrl } from '../services/api.js';
import { StatusBadge } from './StatusBadge.js';
import { ApprovalBadge } from './ApprovalBadge.js';
import { useTheme } from '../context/ThemeContext.tsx';
import { MagneticButton } from './MagneticButton.js';
import { LowLatencySummaryButton } from './LowLatencySummaryButton.js';
import {
  Github,
  ExternalLink,
  Play,
  FileText,
  Calendar,
  User as UserIcon,
  ShieldCheck,
  Edit3,
  Trash2,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Layers,
  Cpu,
  Eye,
  Maximize2,
  X,
  Image as ImageIcon,
  Share2,
  Copy,
  Check,
  Send,
  Mail,
  Globe,
  MessageCircle,
  Code,
  Share,
  CheckCircle2
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  currentUser: User | null;
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  activeTechFilters?: string[];
  index?: number;
}

const FALLBACK_PROJECT_PHOTOS: Record<string, string> = {
  'proj-101': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80',
  'proj-102': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
  'proj-103': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
  'proj-104': 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=1000&q=80',
  'proj-105': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1000&q=80',
  'proj-106': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1000&q=80',
  'proj-107': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80',
  'proj-108': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80'
};

const GENERIC_PHOTOS = [
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'
];

const isValidImgUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./')
  );
};

const getProjectPhoto = (project: Project): string => {
  if (project.imageUrl && isValidImgUrl(project.imageUrl)) return project.imageUrl.trim();
  if (project.architectureUrl && isValidImgUrl(project.architectureUrl)) return project.architectureUrl.trim();
  if (FALLBACK_PROJECT_PHOTOS[project.id]) return FALLBACK_PROJECT_PHOTOS[project.id];

  let hash = 0;
  for (let i = 0; i < project.name.length; i++) {
    hash += project.name.charCodeAt(i);
  }
  return GENERIC_PHOTOS[hash % GENERIC_PHOTOS.length];
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  currentUser,
  onSelect,
  onEdit,
  onDelete,
  activeTechFilters = [],
  index = 0
}) => {
  const { theme, accentClasses } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);

  // Dynamic Image State with onError Fallback
  const [imgSrc, setImgSrc] = useState<string>(() => getProjectPhoto(project));

  React.useEffect(() => {
    setImgSrc(getProjectPhoto(project));
  }, [project]);

  // Motion values for smooth 3D tilt & scale
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateXTransform = useTransform(mouseY, [-0.5, 0.5], [7, -7]);
  const rotateYTransform = useTransform(mouseX, [-0.5, 0.5], [-7, 7]);

  const rotateXSpring = useSpring(rotateXTransform, { stiffness: 180, damping: 22 });
  const rotateYSpring = useSpring(rotateYTransform, { stiffness: 180, damping: 22 });
  const scaleSpring = useSpring(1, { stiffness: 180, damping: 22 });

  // Spotlight, UI & Photo Lightbox states
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [activeShareTab, setActiveShareTab] = useState<'social' | 'embed'>('social');

  const projectPhoto = getProjectPhoto(project);

  // Social Sharing URLs & Text Construction
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?project=${project.id}`
    : `https://app.com/project/${project.id}`;

  const shareTitle = `Project Spec: ${project.name}`;
  const shareSummaryText = `Check out "${project.name}" on our Enterprise Dev Portfolio! Developed by ${project.owner} (${project.status} • ${project.testCoverage}% test coverage).`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Failed to copy share link', err);
    }
  };

  const handleCopySnippet = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2500);
    } catch (err) {
      console.error('Failed to copy snippet', err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareSummaryText,
          url: shareUrl
        });
      } catch (err) {
        console.log('Native share cancelled or failed', err);
      }
    } else {
      handleCopyLink();
    }
  };

  // Social Media Destinations
  const socialPlatforms = [
    {
      name: 'X / Twitter',
      color: 'bg-black hover:bg-slate-900 border-slate-700 text-white',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareSummaryText)}&url=${encodeURIComponent(shareUrl)}&hashtags=TechPortfolio,SoftwareEngineering,DevSpec`
    },
    {
      name: 'LinkedIn',
      color: 'bg-[#0A66C2] hover:bg-[#084e96] border-blue-600 text-white',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z"/>
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'WhatsApp',
      color: 'bg-[#25D366] hover:bg-[#1eb856] border-emerald-500 text-white',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.81 9.81 0 0 0 12.04 2zm.01 16.65c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.32a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.22 8.24z"/>
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`🚀 *${project.name}*\n${shareSummaryText}\n\n👉 View Project: ${shareUrl}`)}`
    },
    {
      name: 'Reddit',
      color: 'bg-[#FF4500] hover:bg-[#e03d00] border-orange-600 text-white',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.182 1.207.49 1.207-.856 2.843-1.42 4.667-1.49l.913-4.28 3.027.64c.057.652.6 1.138 1.22 1.138z"/>
        </svg>
      ),
      url: `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`${project.name} - ${project.summary || project.description}`)}`
    },
    {
      name: 'Facebook',
      color: 'bg-[#1877F2] hover:bg-[#1261cc] border-blue-500 text-white',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Telegram',
      color: 'bg-[#229ED9] hover:bg-[#1c87ba] border-cyan-500 text-white',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm5.262 7.172c.118 1.584-.33 6.948-.545 9.24-.09 1.056-.47 1.411-.84 1.446-.81.075-1.425-.535-2.21-1.05-.123-.08-1.93-1.233-2.593-1.812-.183-.16-.395-.478.016-.84.957-.84 2.102-1.92 2.805-2.61.323-.318.647-1.06-.056-1.06-.807 0-2.23 1.497-3.15 2.12-.41.278-.78.412-1.11.405-.363-.008-1.06-.205-1.58-.374-.637-.208-1.143-.32-1.098-.675.023-.186.278-.377.765-.572 3.003-1.306 5.006-2.167 6.009-2.584 2.862-1.192 3.456-1.4 3.843-1.407.085 0 .275.02.398.12.104.084.133.198.147.28z"/>
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareSummaryText)}`
    },
    {
      name: 'Email',
      color: 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-100',
      icon: <Mail className="w-4 h-4 text-amber-400" />,
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareSummaryText}\n\nView Project Spec online:\n${shareUrl}`)}`
    }
  ];

  // Animations enabled check
  const isAnimationEnabled = theme.enableAnimations !== false;
  const isTiltEnabled = isAnimationEnabled && theme.parallax3DTilt !== false;
  const isSpotlightEnabled = isAnimationEnabled && theme.spotlightFollow !== false;
  const isGlowBorderEnabled = isAnimationEnabled && theme.glowBorders !== false;

  // Check RBAC permission for Edit/Delete
  const canEdit = currentUser && (
    currentUser.role === 'ADMIN' ||
    (currentUser.role === 'SUPERVISOR' && (project.supervisorEmail === currentUser.email || currentUser.email === 'supervisor@team.com')) ||
    (currentUser.role === 'DEVELOPER' && project.ownerEmail === currentUser.email)
  );

  const canDelete = currentUser && (
    currentUser.role === 'ADMIN' ||
    (currentUser.role === 'SUPERVISOR' && (project.supervisorEmail === currentUser.email || currentUser.email === 'supervisor@team.com')) ||
    (currentUser.role === 'DEVELOPER' && project.ownerEmail === currentUser.email)
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();

    if (isTiltEnabled) {
      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(normX);
      mouseY.set(normY);
    }

    if (isSpotlightEnabled) {
      const posX = ((e.clientX - rect.left) / rect.width) * 100;
      const posY = ((e.clientY - rect.top) / rect.height) * 100;
      setSpotlight({ x: posX, y: posY, opacity: 1 });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isAnimationEnabled) {
      scaleSpring.set(1.05); // Smooth scale enlarge to 1.05 on hover
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
    scaleSpring.set(1);
    setSpotlight(prev => ({ ...prev, opacity: 0 }));
  };

  const getCardStyleClasses = () => {
    switch (theme.cardStyle) {
      case 'border-glow':
        return `bg-slate-900/90 border border-slate-800 ${accentClasses.border}`;
      case 'solid':
        return 'bg-slate-950 border border-slate-800';
      case 'minimal':
        return 'bg-slate-900/40 border border-slate-800/60';
      case 'glass':
      default:
        return 'bg-slate-900/85 backdrop-blur-xl border border-slate-800/90';
    }
  };

  return (
    <>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        whileHover={isAnimationEnabled ? { scale: 1.05 } : undefined}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          rotateX: isTiltEnabled ? rotateXSpring : 0,
          rotateY: isTiltEnabled ? rotateYSpring : 0,
          transformStyle: 'preserve-3d',
          perspective: 1000
        }}
        id={`project-card-${project.id}`}
        className={`project-card group relative rounded-3xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl ${
          isHovered ? 'shadow-2xl shadow-blue-500/20' : ''
        } ${getCardStyleClasses()}`}
      >
        {/* Background Project View Photo Ambient Glow */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-3xl">
          <img
            src={projectPhoto}
            alt=""
            className="w-full h-full object-cover opacity-15 blur-2xl group-hover:opacity-30 transition-opacity duration-700 scale-120"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/50" />
        </div>

        {/* Animated Gradient Border Overlay */}
        {isGlowBorderEnabled && (
          <div
            className={`absolute inset-0 rounded-3xl pointer-events-none transition-opacity duration-500 z-10 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              padding: '1.5px',
              background: `linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(168, 85, 247, 0.4), rgba(236, 72, 153, 0.6))`,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude'
            }}
          />
        )}

        {/* Mouse Spotlight Following Glow */}
        {isSpotlightEnabled && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-3xl z-10"
            style={{
              opacity: spotlight.opacity,
              background: `radial-gradient(400px circle at ${spotlight.x}% ${spotlight.y}%, rgba(59, 130, 246, 0.15), transparent 80%)`
            }}
          />
        )}

        <div className="relative z-20">
          
          {/* Project View Photo Banner Header */}
          <div
            onClick={() => onSelect(project)}
            className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden mb-4 shadow-xl border border-slate-700/60 group/photo cursor-pointer"
          >
            {/* Main Project View Screenshot */}
            <img
              src={imgSrc}
              alt={project.name}
              onError={() => {
                const fallback = FALLBACK_PROJECT_PHOTOS[project.id] || GENERIC_PHOTOS[0];
                if (imgSrc !== fallback) {
                  setImgSrc(fallback);
                }
              }}
              className="w-full h-full object-cover transform group-hover/photo:scale-110 transition-transform duration-700 ease-out"
              loading="lazy"
            />

            {/* Gradient Scrim Overlay for Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/20" />

            {/* Floating Header Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md text-[10px] font-extrabold text-white border border-slate-700/60 shadow-md flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-400" />
                  {formatDate(project.deploymentDate)}
                </span>
                {project.priority === 'HIGH' && (
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-rose-500/80 text-white shadow-md border border-rose-400/50 animate-pulse">
                    High Priority
                  </span>
                )}
              </div>

              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={project.status} size="sm" />
                <ApprovalBadge status={project.approvalStatus || 'PENDING_REVIEW'} size="sm" />
              </div>
            </div>

            {/* Bottom Photo Overlay: Title & Lightbox Trigger */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 z-10">
              <div className="flex-1 min-w-0 pr-2">
                <span className="text-[9px] uppercase tracking-wider text-blue-300 font-extrabold bg-blue-950/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-blue-800/50 inline-flex items-center gap-1 mb-1">
                  <ImageIcon className="w-2.5 h-2.5" /> Project Photo View
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white drop-shadow-md group-hover/photo:text-blue-300 transition-colors line-clamp-1 tracking-tight">
                  {project.name}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {project.links?.live && (
                  <a
                    href={formatExternalUrl(project.links.live)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-600 text-emerald-300 hover:text-white backdrop-blur-md border border-emerald-500/60 transition-all shadow-xl flex items-center gap-1.5 text-[11px] font-extrabold shrink-0 cursor-pointer hover:scale-105 group/launch"
                    title="Launch Project Live Application"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="hidden sm:inline">Launch App</span>
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400 group-hover/launch:text-white group-hover/launch:translate-x-0.5 transition-transform" />
                  </a>
                )}

                {project.links?.github && (
                  <a
                    href={formatExternalUrl(project.links.github)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-700 text-slate-200 hover:text-white backdrop-blur-md border border-slate-700 transition-all shadow-xl flex items-center gap-1.5 text-[11px] font-extrabold shrink-0 cursor-pointer hover:scale-105 group/github"
                    title="Open GitHub Code Repository"
                  >
                    <Github className="w-3.5 h-3.5 text-slate-300 group-hover/github:text-white" />
                    <span className="hidden sm:inline">GitHub</span>
                  </a>
                )}

                {(project.links?.docs || (project as any).documentationUrl) && (
                  <a
                    href={formatExternalUrl(project.links?.docs || (project as any).documentationUrl)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-950/90 hover:bg-blue-600 text-blue-300 hover:text-white backdrop-blur-md border border-blue-500/60 transition-all shadow-xl flex items-center gap-1.5 text-[11px] font-extrabold shrink-0 cursor-pointer hover:scale-105 group/docs"
                    title="Open Project Documentation"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400 group-hover/docs:text-white" />
                    <span className="hidden sm:inline">Docs</span>
                  </a>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsShareModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-purple-950/85 hover:bg-purple-600 text-white backdrop-blur-md border border-purple-700/80 transition-all shadow-xl flex items-center gap-1 text-[11px] font-bold shrink-0 cursor-pointer hover:scale-105"
                  title="Share Project Card to Social Media"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-300 group-hover/photo:text-white" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPhotoModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-slate-950/85 hover:bg-blue-600 text-white backdrop-blur-md border border-slate-700/80 transition-all shadow-xl flex items-center gap-1 text-[11px] font-bold shrink-0 cursor-pointer hover:scale-105"
                  title="Expand Project Photo Lightbox"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400 group-hover/photo:text-white" />
                  <span className="hidden sm:inline">View Image</span>
                </button>
              </div>
            </div>
          </div>

          {/* Project Description Summary */}
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3.5 font-normal">
            {project.summary || project.description}
          </p>

          {/* Owner & Supervisor Badges */}
          <div className="flex flex-wrap items-center gap-3 py-2.5 border-y border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[10px] shadow-sm">
                {project.owner.charAt(0)}
              </div>
              <span className="font-semibold text-slate-200">{project.owner}</span>
              <span className="text-[10px] text-slate-500">(Dev)</span>
            </div>

            <span className="text-slate-700">•</span>

            <div className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Sup: <strong className="text-slate-300 font-semibold">{project.supervisor}</strong></span>
            </div>
          </div>

          {/* Interactive Tech Stack Chips */}
          <div className="mt-3">
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-hidden">
              {project.techStack.map(tech => {
                const isMatchingFilter = activeTechFilters.some(
                  f => f.toLowerCase() === tech.toLowerCase()
                );
                return (
                  <motion.span
                    key={tech}
                    whileHover={isAnimationEnabled ? { scale: 1.08 } : undefined}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-default ${
                      isMatchingFilter
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                        : 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {tech}
                  </motion.span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card Footer: Metrics, Links, and Actions */}
        <div className="relative z-20 pt-3 mt-3 border-t border-slate-800/90 space-y-3">
          {/* Test Coverage & Code Stats Bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2 flex-1 max-w-[68%]">
              <span>Coverage:</span>
              <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    project.testCoverage >= 90
                      ? 'bg-emerald-400'
                      : project.testCoverage >= 80
                      ? 'bg-blue-400'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${project.testCoverage}%` }}
                />
              </div>
              <span className="font-bold text-slate-200">{project.testCoverage}%</span>
            </div>

            <div className="font-mono text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
              {project.linesOfCode ? `${(project.linesOfCode / 1000).toFixed(1)}k LOC` : '12.4k LOC'}
            </div>
          </div>

          {/* Links Bar & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
            {/* External Links & Low-Latency Flash Button */}
            <div className="flex items-center gap-1.5">
              <LowLatencySummaryButton projectId={project.id} projectName={project.name} buttonText="Flash AI" size="sm" />

              {project.links?.github && (
                <a
                  href={formatExternalUrl(project.links.github)}
                  target="_blank"
                  rel="noreferrer"
                  title="GitHub Repository"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  onClick={e => e.stopPropagation()}
                >
                  <Github className="w-3.5 h-3.5" />
                </a>
              )}

              {project.links?.live && (
                <a
                  href={formatExternalUrl(project.links.live)}
                  target="_blank"
                  rel="noreferrer"
                  title="Live Deployed URL"
                  className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-xl transition-colors cursor-pointer"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {project.links?.demo && (
                <a
                  href={formatExternalUrl(project.links.demo)}
                  target="_blank"
                  rel="noreferrer"
                  title="Watch Video Demo"
                  className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors cursor-pointer"
                  onClick={e => e.stopPropagation()}
                >
                  <Play className="w-3.5 h-3.5" />
                </a>
              )}

              {project.links?.docs && (
                <a
                  href={formatExternalUrl(project.links.docs)}
                  target="_blank"
                  rel="noreferrer"
                  title="Architecture Documentation"
                  className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors cursor-pointer"
                  onClick={e => e.stopPropagation()}
                >
                  <FileText className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={e => {
                  e.stopPropagation();
                  setIsShareModalOpen(true);
                }}
                title="Share Project Card to Social Media"
                className="p-1.5 text-purple-400 hover:text-white hover:bg-purple-600/30 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold border border-purple-500/30 hover:border-purple-400/60"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              {project.links?.github && (
                <a
                  href={formatExternalUrl(project.links.github)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => {
                    e.stopPropagation();
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer group/github"
                  title="Open GitHub Code Repository"
                >
                  <Github className="w-3.5 h-3.5 text-slate-300 group-hover/github:text-white" />
                  <span>GitHub</span>
                </a>
              )}

              {(project.links?.docs || (project as any).documentationUrl) && (
                <a
                  href={formatExternalUrl(project.links?.docs || (project as any).documentationUrl)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => {
                    e.stopPropagation();
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold text-blue-300 bg-blue-950/80 hover:bg-blue-600 hover:text-white border border-blue-500/50 rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer group/docs"
                  title="Open Project Documentation"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400 group-hover/docs:text-white" />
                  <span>Docs</span>
                </a>
              )}

              {project.links?.live && (
                <a
                  href={formatExternalUrl(project.links.live)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => {
                    e.stopPropagation();
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-600 hover:text-white border border-emerald-500/50 rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer group/launch"
                  title="Launch Running App in New Tab"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Launch App</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400 group-hover/launch:text-white group-hover/launch:translate-x-0.5 transition-transform" />
                </a>
              )}

              <MagneticButton
                enableMagnetic={isAnimationEnabled}
                onClick={() => onSelect(project)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </MagneticButton>

              {canEdit && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onEdit(project);
                  }}
                  title="Edit Project"
                  className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}

              {canDelete && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(project);
                  }}
                  title="Delete Project"
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* High-Definition Project View Photo Lightbox Modal */}
      <AnimatePresence>
        {isPhotoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsPhotoModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <ImageIcon className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white">
                      {project.name} — Project Screenshot Preview
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Owner: {project.owner} • Deployed: {project.deploymentDate}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Full Image Frame */}
              <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center p-4">
                <img
                  src={projectPhoto}
                  alt={project.name}
                  className="max-h-[60vh] w-auto object-contain rounded-2xl shadow-2xl border border-slate-800/80"
                />
              </div>

              {/* Modal Footer Info */}
              <div className="p-5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1 max-w-xl">
                  <p className="text-slate-300 line-clamp-2">
                    {project.description || project.summary}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {project.techStack.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setIsPhotoModalOpen(false);
                      setIsShareModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600 border border-purple-500/40 text-purple-200 hover:text-white font-bold cursor-pointer transition-colors shadow-lg flex items-center gap-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Card</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPhotoModalOpen(false);
                      onSelect(project);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
                  >
                    <span>Open Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Media Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsShareModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col my-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-400 border border-purple-500/30 shadow-md">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                      Share Project Card
                    </h3>
                    <p className="text-xs text-slate-400">
                      Share <strong className="text-slate-200">{project.name}</strong> to any social account
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Card Mini Preview Box */}
              <div className="p-4 bg-slate-950/60 border-b border-slate-800/80">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3 shadow-inner">
                  <img
                    src={projectPhoto}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-700/60 shadow"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                        {project.owner}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                        {project.testCoverage}% Test Pass
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white truncate">
                      {project.name}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {project.summary || project.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <button
                    onClick={() => setActiveShareTab('social')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeShareTab === 'social'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Social Media Accounts</span>
                  </button>

                  <button
                    onClick={() => setActiveShareTab('embed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeShareTab === 'embed'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Markdown & Embed</span>
                  </button>

                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={handleNativeShare}
                      className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Native Share</span>
                    </button>
                  )}
                </div>

                {/* Tab Content: Social Grid */}
                {activeShareTab === 'social' && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Click to Share to Social Media Account:
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {socialPlatforms.map(platform => (
                        <a
                          key={platform.name}
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-3 rounded-2xl border transition-all duration-200 flex items-center gap-2.5 font-bold text-xs shadow-md cursor-pointer hover:scale-[1.03] ${platform.color}`}
                        >
                          <span className="p-1 rounded-lg bg-white/10 shrink-0">
                            {platform.icon}
                          </span>
                          <span className="truncate">{platform.name}</span>
                        </a>
                      ))}
                    </div>

                    {/* Copy Direct URL Box */}
                    <div className="pt-2">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Direct Card Share Link:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 select-all"
                        />
                        <button
                          onClick={handleCopyLink}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                            copiedLink
                              ? 'bg-emerald-600 text-white'
                              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20'
                          }`}
                        >
                          {copiedLink ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 animate-bounce" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content: Embed / Markdown Code */}
                {activeShareTab === 'embed' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        Markdown Badge (for GitHub READMEs):
                      </label>
                      <div className="relative">
                        <textarea
                          readOnly
                          rows={2}
                          value={`[![${project.name} Spec](https://img.shields.io/badge/Project-${encodeURIComponent(project.name)}-purple)](${shareUrl})`}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 resize-none focus:outline-none"
                        />
                        <button
                          onClick={() => handleCopySnippet(`[![${project.name} Spec](https://img.shields.io/badge/Project-${encodeURIComponent(project.name)}-purple)](${shareUrl})`)}
                          className="absolute top-2 right-2 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1">
                        HTML Iframe Card Snippet:
                      </label>
                      <div className="relative">
                        <textarea
                          readOnly
                          rows={3}
                          value={`<iframe src="${shareUrl}" width="100%" height="450" frameborder="0" title="${project.name} Card"></iframe>`}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 resize-none focus:outline-none"
                        />
                        <button
                          onClick={() => handleCopySnippet(`<iframe src="${shareUrl}" width="100%" height="450" frameborder="0" title="${project.name} Card"></iframe>`)}
                          className="absolute top-2 right-2 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                    </div>

                    {copiedSnippet && (
                      <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Snippet copied to clipboard!
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Direct link generated for project ID #{project.id}</span>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const ProjectCardSkeleton: React.FC = () => (
  <div className="relative overflow-hidden bg-slate-900/60 border border-slate-800/90 rounded-3xl p-5 space-y-4 shadow-xl">
    {/* Image Header Skeleton */}
    <div className="h-44 w-full bg-slate-800 rounded-2xl animate-pulse" />
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-slate-800 rounded-full w-1/3 animate-pulse" />
        <div className="h-5 bg-slate-800 rounded-xl w-2/3 animate-pulse" />
      </div>
      <div className="h-6 w-20 bg-slate-800 rounded-full animate-pulse" />
    </div>
    <div className="space-y-1.5">
      <div className="h-3 bg-slate-800 rounded-lg w-full animate-pulse" />
      <div className="h-3 bg-slate-800 rounded-lg w-4/5 animate-pulse" />
    </div>
    <div className="flex gap-2">
      <div className="h-6 bg-slate-800 rounded-lg w-16 animate-pulse" />
      <div className="h-6 bg-slate-800 rounded-lg w-20 animate-pulse" />
      <div className="h-6 bg-slate-800 rounded-lg w-14 animate-pulse" />
    </div>
  </div>
);
