export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'DEVELOPER' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department: string;
  title: string;
}

export type ProjectStatus = 'DEPLOYED' | 'IN_PROGRESS' | 'TESTING' | 'MAINTENANCE' | 'ARCHIVED';

export type ApprovalStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';

export interface ProjectLinks {
  github?: string;
  live?: string;
  demo?: string;
  docs?: string;
}

export interface Comment {
  id: string;
  projectId: string;
  parentId?: string | null;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorRole: UserRole;
  authorAvatar: string;
  content: string;
  mentions?: string[]; // Names of mentioned users
  createdAt: string;
  updatedAt?: string;
  replies?: Comment[];
}

export interface ReviewNote {
  id: string;
  projectId: string;
  supervisorId: string;
  supervisorName: string;
  supervisorEmail: string;
  supervisorAvatar: string;
  approvalStatus: ApprovalStatus;
  feedbackText: string;
  rating?: number; // 1-5 scale
  changesRequestedList?: string[];
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  projectId: string;
  type: 'COMMENT' | 'REVIEW' | 'APPROVAL_CHANGE' | 'STATUS_CHANGE' | 'PROJECT_EDIT' | 'MENTION';
  actorId: string;
  actorName: string;
  actorAvatar: string;
  actorRole: UserRole;
  description: string;
  details?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  recipientEmail: string;
  recipientId?: string;
  type: 'COMMENT' | 'MENTION' | 'APPROVAL_CHANGE' | 'STATUS_CHANGE' | 'REVIEW' | 'REVIEW_FEEDBACK';
  projectId: string;
  projectName: string;
  actorName: string;
  actorAvatar: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  summary: string;
  description: string;
  owner: string; // Developer Name
  ownerEmail: string;
  supervisor: string; // Supervisor Name
  supervisorEmail: string;
  deploymentDate: string; // YYYY-MM-DD
  status: ProjectStatus;
  approvalStatus?: ApprovalStatus;
  techStack: string[];
  links: ProjectLinks;
  testCoverage: number; // Percentage 0-100
  linesOfCode: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  imageUrl?: string;
  architectureUrl?: string;
  teamMembers?: string[];
  commentsCount?: number;
  reviewsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFilterParams {
  search?: string;
  owner?: string;
  supervisor?: string;
  techStack?: string[];
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'deploymentDate' | 'name' | 'testCoverage' | 'linesOfCode';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DashboardAnalytics {
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  inProgressCount: number;
  testingCount: number;
  maintenanceCount: number;
  archivedCount: number;
  activeDeployments: number;
  totalDevelopers: number;
  avgTestCoverage: number;
  totalLinesOfCode: number;
  avgCompletionTimeDays: number;
  deploymentsOverTime: { date: string; count: number; monthName: string; cumulativeCount?: number }[];
  deploymentTrends: { monthName: string; count: number; growthRatePct: number }[];
  techDistribution: { tech: string; count: number; percentage: number }[];
  mostUsedTechStack: { tech: string; count: number; percentage: number }[];
  statusDistribution: { status: ProjectStatus; count: number }[];
  projectsPerDeveloper: { developer: string; count: number }[];
  projectsPerSupervisor: { supervisor: string; count: number }[];
  projectsPerDepartment: { department: string; count: number }[];
  topContributors: { name: string; avatar: string; projectCount: number; linesOfCode: number; testCoverage: number; department?: string }[];
}

export interface UnitTestResult {
  id: string;
  name: string;
  suite: string;
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  error?: string;
}

export interface ApiTestSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: UnitTestResult[];
  timestamp: string;
}

export type ThemePreset = 'light' | 'dark' | 'system' | 'glassmorphism' | 'neon' | 'amoled';
export type AccentColor = 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan';
export type BorderRadiusPreset = 'none' | 'md' | 'xl' | '2xl' | 'full';
export type CardStylePreset = 'glass' | 'solid' | 'border-glow' | 'minimal';
export type FontFamilyPreset = 'sans' | 'mono' | 'serif';
export type AmbientEffectPreset = 'blobs' | 'particles' | 'aurora' | 'grid' | 'none';

export interface ThemeConfig {
  preset: ThemePreset;
  accentColor: AccentColor;
  borderRadius: BorderRadiusPreset;
  cardStyle: CardStylePreset;
  fontFamily: FontFamilyPreset;
  ambientEffect: AmbientEffectPreset;
  enableAnimations?: boolean;
  floatingCards?: boolean;
  parallax3DTilt?: boolean;
  spotlightFollow?: boolean;
  glowBorders?: boolean;
}

export interface ToastNotification {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}
