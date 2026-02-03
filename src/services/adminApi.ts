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
  ReviewOverview,
  ReviewDetail,
  InterviewResponse,
  BusinessWithReviews,
  BusinessReviewsResponse,
  Dimension,
  CriticalFlag,
  EvaluationRunSummary,
  EvaluationRunDetail,
  EvaluationScoresResponse,
  EvaluationFlag,
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
   * Get scoring rubric (dimensions, critical flags) for a question
   */
  getQuestionRubric: async (questionId: string): Promise<{
    question_id: string;
    dimensions: Dimension[];
    critical_flags: CriticalFlag[];
    calibration_examples?: Array<{ level: string; score: number; response: string; explanation: string }>;
  }> => {
    return adminRequest(`/admin/questions/${questionId}/rubric`);
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

  // ============ Reviews API (Admin View) ============

  /**
   * List all submitted reviews for admin viewing
   */
  getReviews: async (): Promise<ReviewOverview[]> => {
    return adminRequest<ReviewOverview[]>('/admin/reviews');
  },

  /**
   * Get full review details including interviews
   */
  getReview: async (reviewId: string): Promise<ReviewDetail> => {
    return adminRequest<ReviewDetail>(`/admin/reviews/${reviewId}`);
  },

  /**
   * Get all responses for an interview
   */
  getInterviewResponses: async (interviewId: string): Promise<InterviewResponse[]> => {
    return adminRequest<InterviewResponse[]>(`/admin/interviews/${interviewId}/responses`);
  },

  /**
   * Get businesses with reviews (for admin review board)
   */
  getBusinessesWithReviews: async (): Promise<BusinessWithReviews[]> => {
    return adminRequest<BusinessWithReviews[]>('/admin/businesses-with-reviews');
  },

  /**
   * Get all reviews for a specific business
   */
  getBusinessReviews: async (businessId: string): Promise<BusinessReviewsResponse> => {
    return adminRequest<BusinessReviewsResponse>(`/admin/businesses/${businessId}/reviews`);
  },

  /**
   * Approve a submitted review
   */
  approveReview: async (reviewId: string): Promise<{ message: string }> => {
    return adminRequest(`/admin/reviews/${reviewId}/approve`, {
      method: 'POST',
    });
  },

  /**
   * Revoke approval of a review
   */
  revokeReview: async (reviewId: string): Promise<{ message: string }> => {
    return adminRequest(`/admin/reviews/${reviewId}/revoke`, {
      method: 'POST',
    });
  },

  // ============ Evaluation API ============

  /**
   * Trigger an evaluation run for a review/assessment
   */
  runEvaluation: async (assessmentId: string, options?: {
    config_overrides?: Record<string, unknown>;
    dry_run?: boolean;
  }): Promise<{
    message: string;
    run_id: string;
    run_number: number;
    interviews_to_evaluate: number;
    status: string;
  }> => {
    return adminRequest('/evaluation/run', {
      method: 'POST',
      body: JSON.stringify({
        assessment_id: assessmentId,
        ...options,
      }),
    });
  },

  /**
   * List evaluation runs
   */
  getEvaluationRuns: async (filters?: {
    assessment_id?: string;
    status?: string;
  }): Promise<EvaluationRunSummary[]> => {
    const params = new URLSearchParams();
    if (filters?.assessment_id) params.append('assessment_id', filters.assessment_id);
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return adminRequest<EvaluationRunSummary[]>(`/evaluation/runs${query}`);
  },

  /**
   * Get evaluation run details
   */
  getEvaluationRun: async (runId: string, includeAuditLog = false): Promise<EvaluationRunDetail> => {
    const query = includeAuditLog ? '?include_audit_log=true' : '';
    return adminRequest<EvaluationRunDetail>(`/evaluation/runs/${runId}${query}`);
  },

  /**
   * Get detailed scores for an evaluation run
   */
  getEvaluationScores: async (runId: string): Promise<EvaluationScoresResponse> => {
    return adminRequest<EvaluationScoresResponse>(`/evaluation/runs/${runId}/scores`);
  },

  /**
   * Get flags for an evaluation run
   */
  getEvaluationFlags: async (runId: string, requiresReviewOnly = false): Promise<EvaluationFlag[]> => {
    const query = requiresReviewOnly ? '?requires_review_only=true' : '';
    return adminRequest<EvaluationFlag[]>(`/evaluation/runs/${runId}/flags${query}`);
  },

  /**
   * Get audit log for an evaluation run
   */
  getEvaluationAuditLog: async (runId: string, stage?: string): Promise<Array<{
    id: string;
    timestamp: string;
    stage: string;
    action: string;
    subject_type: string;
    subject_id: string;
    details: Record<string, unknown>;
  }>> => {
    const query = stage ? `?stage=${stage}` : '';
    return adminRequest(`/evaluation/runs/${runId}/audit-log${query}`);
  },

  /**
   * Resolve a flag
   */
  resolveFlag: async (flagId: string, resolution: string, overrideScore?: number): Promise<{ message: string }> => {
    return adminRequest(`/evaluation/flags/${flagId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        resolution,
        override_score: overrideScore,
      }),
    });
  },

  /**
   * Get all evaluation runs for an assessment
   */
  getAssessmentEvaluationRuns: async (assessmentId: string): Promise<Array<{
    id: string;
    run_number: number;
    status: string;
    average_metric_score?: number;
    total_flags: number;
    unresolved_flags: number;
    started_at?: string;
    completed_at?: string;
    created_at: string;
  }>> => {
    return adminRequest(`/evaluation/assessments/${assessmentId}/runs`);
  },

  /**
   * Get latest evaluation for an assessment
   */
  getLatestEvaluation: async (assessmentId: string): Promise<EvaluationRunDetail> => {
    return adminRequest<EvaluationRunDetail>(`/evaluation/assessments/${assessmentId}/latest`);
  },

  /**
   * Get refined report for an evaluation run
   * Returns McKinsey-style narrative insights per metric
   */
  getRefinedReport: async (runId: string): Promise<{
    run_id: string;
    assessment_id: string;
    run_number: number;
    report: {
      metrics: Array<{
        metric_code: string;
        metric_name: string;
        category: string;
        score: number;
        health_status: 'strong' | 'developing' | 'attention' | 'critical';
        summary: string;
        observations: string[];
        recommendations: string[];
        evidence: Array<{
          quote: string;
          role: string;
          supports: 'strength' | 'gap' | 'context';
        }>;
        ai_reasoning?: {
          methodology: string;
          data_points_analyzed: number;
          confidence_factors: string[];
          key_signals: string[];
          limitations: string[];
        };
        benchmark_narrative?: string;
      }>;
      executive_summary: string;
      key_actions: Array<string | {
        title: string;
        description: string;
        owner: string;
        timeline: string;
        priority: 'critical' | 'high' | 'medium';
        impact: 'high' | 'medium' | 'low';
        effort: 'high' | 'medium' | 'low';
      }>;
      critical_issues: Array<string | {
        title: string;
        severity: 'critical' | 'warning';
        metrics: string[];
        avg_score?: number;
        description: string;
        evidence: Array<{ quote: string; role: string }>;
        root_causes: string[];
        business_impact: string;
      }>;
      strengths: Array<string | {
        title: string;
        metrics: string[];
        avg_score?: number;
        description: string;
        evidence: Array<{ quote: string; role: string }>;
        opportunity: string;
      }>;
      generated_at: string;
      evaluation_id: string;
      business_id: string;
    };
  }> => {
    return adminRequest(`/evaluation/runs/${runId}/refined-report`);
  },
};

export default adminApi;
