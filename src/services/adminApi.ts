/**
 * Admin API Service
 * Handles all admin portal API communication
 */

import type {
  Admin,
  AdminLoginResponse,
  BusinessOverview,
  QuestionSetOverview,
  QuestionSetDetail,
  Question,
  AdminListItem,
  Metric,
  QuestionWeightConfig,
  DerivedMetricSource,
  MetricCategory,
} from '../types/admin';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const ADMIN_TOKEN_KEY = 'admin_token';

// Token management (separate from business user tokens)
let adminToken: string | null = null;

export const setAdminAuthToken = (token: string): void => {
  adminToken = token;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

export const getAdminAuthToken = (): string | null => {
  if (!adminToken) {
    adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
  }
  return adminToken;
};

export const clearAdminAuthToken = (): void => {
  adminToken = null;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

// API helper with admin token
const adminRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAdminAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
};

// Admin API
export const adminApi = {
  /**
   * Login as admin
   */
  login: async (email: string, password: string): Promise<{ admin: Admin; token: string }> => {
    const tokenResponse = await adminRequest<AdminLoginResponse>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Save token
    setAdminAuthToken(tokenResponse.access_token);

    // Fetch admin info
    const admin = await adminApi.getMe();

    return {
      admin,
      token: tokenResponse.access_token,
    };
  },

  /**
   * Get current admin info
   */
  getMe: async (): Promise<Admin> => {
    const response = await adminRequest<{
      id: string;
      email: string;
      name: string;
      role: string;
      permissions: string[];
    }>('/admin/me');

    return {
      ...response,
      first_name: response.name.split(' ')[0] || '',
      last_name: response.name.split(' ').slice(1).join(' ') || '',
      is_active: true,
      created_at: new Date().toISOString(),
    } as Admin;
  },

  /**
   * Logout - clears admin token
   */
  logout: (): void => {
    clearAdminAuthToken();
  },

  /**
   * List all businesses
   */
  getBusinesses: async (): Promise<BusinessOverview[]> => {
    return adminRequest<BusinessOverview[]>('/admin/businesses');
  },

  /**
   * List all question sets
   */
  getQuestionSets: async (): Promise<QuestionSetOverview[]> => {
    return adminRequest<QuestionSetOverview[]>('/admin/question-sets');
  },

  /**
   * Get a single question set with all questions
   */
  getQuestionSet: async (questionSetId: string): Promise<QuestionSetDetail> => {
    return adminRequest<QuestionSetDetail>(`/admin/question-sets/${questionSetId}`);
  },

  /**
   * Update a question
   */
  updateQuestion: async (questionId: string, data: Partial<Question>): Promise<{ message: string }> => {
    return adminRequest(`/admin/questions/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Create a new question set
   */
  createQuestionSet: async (data: {
    name: string;
    description?: string;
    version?: string;
  }): Promise<{ id: string; name: string; message: string }> => {
    return adminRequest('/admin/question-sets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a question set
   */
  deleteQuestionSet: async (questionSetId: string): Promise<{ message: string; deleted_questions: number }> => {
    return adminRequest(`/admin/question-sets/${questionSetId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Add a question to a question set
   */
  addQuestion: async (questionSetId: string, data: {
    question_number: number;
    text: string;
    type: string;
    aspect?: string;
    aspect_code?: string;
    description?: string;
    options?: string[];
  }): Promise<{ id: string; order: number; message: string }> => {
    return adminRequest(`/admin/question-sets/${questionSetId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a question
   */
  deleteQuestion: async (questionId: string): Promise<{ message: string }> => {
    return adminRequest(`/admin/questions/${questionId}`, {
      method: 'DELETE',
    });
  },

  /**
   * List all admins (super_admin only)
   */
  getAdmins: async (): Promise<AdminListItem[]> => {
    return adminRequest<AdminListItem[]>('/admin/admins');
  },

  /**
   * Create a new admin (super_admin only)
   */
  createAdmin: async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'support';
  }): Promise<{ id: string; email: string; message: string }> => {
    return adminRequest('/admin/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ============ Metrics API ============

  /**
   * List all metrics
   */
  getMetrics: async (): Promise<Metric[]> => {
    return adminRequest<Metric[]>('/admin/metrics');
  },

  /**
   * Get a single metric by ID
   */
  getMetric: async (metricId: string): Promise<Metric> => {
    return adminRequest<Metric>(`/admin/metrics/${metricId}`);
  },

  /**
   * Create a new metric
   */
  createMetric: async (data: {
    code: string;
    name: string;
    academic_term?: string;
    description?: string;
    interpretation_guide?: string;
    category?: MetricCategory;
    question_weights?: QuestionWeightConfig[];
    source_metrics?: DerivedMetricSource[];
    order?: number;
  }): Promise<{ id: string; code: string; message: string }> => {
    return adminRequest('/admin/metrics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a metric
   */
  updateMetric: async (metricId: string, data: Partial<Metric>): Promise<{ message: string }> => {
    return adminRequest(`/admin/metrics/${metricId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a metric
   */
  deleteMetric: async (metricId: string): Promise<{ message: string }> => {
    return adminRequest(`/admin/metrics/${metricId}`, {
      method: 'DELETE',
    });
  },
};

export default adminApi;
