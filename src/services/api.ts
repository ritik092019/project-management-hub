import { Project, ProjectFilterParams, DashboardAnalytics, User, ApiTestSummary, Comment, ReviewNote, ActivityItem, Notification, ApprovalStatus } from '../types.js';

const API_BASE = '/api';

// Get stored JWT token
export function getStoredToken(): string | null {
  return localStorage.getItem('jwt_token');
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('jwt_token', token);
  } else {
    localStorage.removeItem('jwt_token');
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// API Calls
export async function loginUser(email: string, password?: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || 'Failed to authenticate user');
  }

  const data = await res.json();
  setStoredToken(data.token);
  return data;
}

export async function registerUser(userData: {
  name: string;
  email: string;
  password?: string;
  role?: string;
  title?: string;
  department?: string;
  avatar?: string;
}): Promise<{ token: string; user: User }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(err.error || 'Failed to register account');
  }

  const data = await res.json();
  setStoredToken(data.token);
  return data;
}

export async function resetPassword(email: string, newPassword?: string, resetToken?: string): Promise<{ message: string; resetCode?: string }> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword, resetToken })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Password reset failed' }));
    throw new Error(err.error || 'Password reset failed');
  }

  return res.json();
}

export async function updateProfile(profileData: {
  name?: string;
  title?: string;
  department?: string;
  avatar?: string;
}): Promise<{ user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Profile update failed' }));
    throw new Error(err.error || 'Failed to update profile');
  }

  const data = await res.json();
  setStoredToken(data.token);
  return data;
}

export async function adminCreateUser(userData: {
  name: string;
  email: string;
  role: string;
  title?: string;
  department?: string;
  avatar?: string;
}): Promise<User> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'User creation failed' }));
    throw new Error(err.error || 'Failed to create user');
  }

  const data = await res.json();
  return data.user;
}

export async function adminUpdateUser(userId: string, updateData: {
  role?: string;
  department?: string;
  title?: string;
  name?: string;
}): Promise<User> {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'User update failed' }));
    throw new Error(err.error || 'Failed to update user');
  }

  const data = await res.json();
  return data.user;
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'User deletion failed' }));
    throw new Error(err.error || 'Failed to delete user');
  }
}

export async function fetchAuditLogs(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/admin/audit-logs`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.logs || [];
}

export async function fetchSystemSettings(): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/system-settings`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return {};
  const data = await res.json();
  return data.settings || {};
}

export async function updateSystemSettings(settings: any): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/system-settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update system settings' }));
    throw new Error(err.error || 'Failed to update system settings');
  }

  const data = await res.json();
  return data.settings;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      setStoredToken(null);
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch (e) {
    return null;
  }
}

export async function fetchProjects(params: ProjectFilterParams = {}): Promise<{ projects: Project[]; total: number; page: number; totalPages: number }> {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.owner && params.owner !== 'ALL') query.set('owner', params.owner);
  if (params.supervisor && params.supervisor !== 'ALL') query.set('supervisor', params.supervisor);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.techStack && params.techStack.length > 0) {
    query.set('tech', params.techStack.join(','));
  }

  const res = await fetch(`${API_BASE}/projects?${query.toString()}`, {
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    throw new Error('Failed to fetch projects');
  }

  return res.json();
}

export async function createProject(projectData: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create project' }));
    throw new Error(err.error || 'Server error creating project');
  }

  const data = await res.json();
  return data.project;
}

export async function updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(projectData)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update project' }));
    throw new Error(err.error || 'Server error updating project');
  }

  const data = await res.json();
  return data.project;
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete project' }));
    throw new Error(err.error || 'Server error deleting project');
  }
}

export async function fetchAnalytics(params: ProjectFilterParams = {}): Promise<DashboardAnalytics> {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.owner && params.owner !== 'ALL') query.set('owner', params.owner);
  if (params.supervisor && params.supervisor !== 'ALL') query.set('supervisor', params.supervisor);
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.techStack && params.techStack.length > 0) {
    query.set('tech', params.techStack.join(','));
  }

  const queryString = query.toString();
  const url = queryString ? `${API_BASE}/analytics?${queryString}` : `${API_BASE}/analytics`;

  const res = await fetch(url, {
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    throw new Error('Failed to fetch dashboard analytics');
  }
  return res.json();
}

export async function fetchDevelopers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/developers`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.developers;
}

export async function fetchSupervisors(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/supervisors`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.supervisors;
}

export async function fetchTechStacks(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/tech-stacks`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.techStacks;
}

export async function fetchOpenApiDocs(): Promise<any> {
  const res = await fetch(`${API_BASE}/docs/openapi.json`);
  if (!res.ok) throw new Error('Failed to load OpenAPI spec');
  return res.json();
}

export async function runServerUnitTests(): Promise<ApiTestSummary> {
  const res = await fetch(`${API_BASE}/tests/run`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to execute REST unit tests');
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.users;
}

// Comments API
export async function fetchProjectComments(projectId: string): Promise<Comment[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/comments`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.comments || [];
}

export async function postProjectComment(projectId: string, content: string, parentId?: string | null): Promise<Comment> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content, parentId })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to post comment' }));
    throw new Error(err.error || 'Failed to post comment');
  }

  const data = await res.json();
  return data.comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete comment' }));
    throw new Error(err.error || 'Failed to delete comment');
  }
}

// Reviews & Approval Workflow API
export async function fetchProjectReviews(projectId: string): Promise<ReviewNote[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/reviews`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.reviews || [];
}

export async function updateProjectApprovalStatus(
  projectId: string,
  approvalStatus: ApprovalStatus,
  feedbackText?: string,
  rating?: number,
  changesRequestedList?: string[]
): Promise<{ project: Project; reviewNote: ReviewNote }> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/approval`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ approvalStatus, feedbackText, rating, changesRequestedList })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update project approval status' }));
    throw new Error(err.error || 'Failed to update approval status');
  }

  return res.json();
}

// Activity Timeline API
export async function fetchProjectActivities(projectId: string): Promise<ActivityItem[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/activities`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.activities || [];
}

// Notifications API
export async function fetchNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) return { notifications: [], unreadCount: 0 };
  return res.json();
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
}

// Gemini AI API Services
export async function sendGeminiChat(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  model: string = 'gemini-3.5-flash',
  customSystemPrompt?: string
): Promise<{ text: string; model: string; timestamp: string }> {
  const res = await fetch(`${API_BASE}/gemini/chat`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ messages, model, customSystemPrompt })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to complete Gemini chat request' }));
    throw new Error(err.error || 'Gemini API call failed');
  }

  return res.json();
}

export async function fetchLowLatencyFlashLite(
  prompt?: string,
  projectId?: string
): Promise<{ text: string; latencyMs: number; model: string; timestamp: string }> {
  const res = await fetch(`${API_BASE}/gemini/flash-lite`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ prompt, projectId })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Low-latency Flash-Lite query failed' }));
    throw new Error(err.error || 'Gemini Flash-Lite API call failed');
  }

  return res.json();
}

