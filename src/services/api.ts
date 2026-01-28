/**
 * API Service for ThinkForward MVP
 * Handles all communication with the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Types for API responses
export interface ApiQuestion {
  id: string;
  number: number;
  total: number;
  aspect: string;
  aspect_code: string;
  text: string;
  type: 'open' | 'scale' | 'percentage' | 'single_select' | 'multi_select';
  options?: string[];
  scale?: {
    min: number;
    max: number;
    min_label: string;
    max_label: string;
  };
}

export interface ApiQuestionResponse {
  complete: boolean;
  question?: ApiQuestion;
  followup?: string | null;
  is_followup: boolean;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  message?: string;
}

export interface StartInterviewResponse {
  id: string;
  status: string;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  resumed: boolean;
}

export interface SubmitResponsePayload {
  question_id: string;
  text: string;
  is_voice?: boolean;
  voice_data?: {
    audio_url: string;
    duration_seconds: number;
    transcription?: string;
  };
  is_followup?: boolean;
  parent_response_id?: string;
}

export interface ChecklistResultItem {
  item_id: string;
  item_text: string;
  satisfied: boolean;
  extracted_value: string | null;
}

export interface SubmitResponseResult {
  response_id: string;
  status: string;
  evaluation?: {
    all_satisfied: boolean;
    followup_question?: string;
    merged_response?: string;
    checklist_results?: ChecklistResultItem[];
  };
  next_action: 'complete' | 'next_question' | 'followup' | 'approve_merged' | 'stay';
  interview_status: 'in_progress' | 'completed';
}

export interface ApproveMergedResult {
  approved: boolean;
  next_action: 'complete' | 'next_question' | 'stay';
  interview_status: 'in_progress' | 'completed';
}

export interface InterviewState {
  id: string;
  mode: string;
  status: string;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  metadata: {
    started_at?: string;
    completed_at?: string;
    duration_seconds?: number;
  };
  response_count: number;
}

export interface ChecklistItemDef {
  id: string;
  key: string;
  description: string;
}

export interface AllQuestionsQuestion {
  id: string;
  number: number;
  aspect: string;
  aspect_code: string;
  text: string;
  type: 'open' | 'scale' | 'percentage' | 'single_select' | 'multi_select';
  options?: string[];
  scale?: {
    min: number;
    max: number;
    min_label: string;
    max_label: string;
  };
  checklist: ChecklistItemDef[];
}

export interface AllQuestionsResponse {
  interview_id: string;
  current_question: number;
  total_questions: number;
  questions: AllQuestionsQuestion[];
}

// Auth token management
let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('auth_token');
};

// API helper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();

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

// Interview API
export const interviewApi = {
  /**
   * Start a new interview session
   */
  start: async (
    reviewId: string,
    participantId: string,
    mode: 'text' | 'voice' = 'text'
  ): Promise<StartInterviewResponse> => {
    return apiRequest<StartInterviewResponse>('/interviews/start', {
      method: 'POST',
      body: JSON.stringify({
        review_id: reviewId,
        participant_id: participantId,
        mode,
      }),
    });
  },

  /**
   * Get the current question for an interview
   */
  getCurrentQuestion: async (interviewId: string): Promise<ApiQuestionResponse> => {
    return apiRequest<ApiQuestionResponse>(`/interviews/${interviewId}/current-question`);
  },

  /**
   * Submit a response to a question
   */
  submitResponse: async (
    interviewId: string,
    payload: SubmitResponsePayload
  ): Promise<SubmitResponseResult> => {
    return apiRequest<SubmitResponseResult>(`/interviews/${interviewId}/respond`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get full interview state
   */
  getState: async (interviewId: string): Promise<InterviewState> => {
    return apiRequest<InterviewState>(`/interviews/${interviewId}`);
  },

  /**
   * Skip the current question
   */
  skip: async (interviewId: string, questionId: string): Promise<{ skipped: boolean; interview_status: string }> => {
    return apiRequest(`/interviews/${interviewId}/skip?question_id=${questionId}`, {
      method: 'POST',
    });
  },

  /**
   * Abandon the interview
   */
  abandon: async (interviewId: string): Promise<{ message: string }> => {
    return apiRequest(`/interviews/${interviewId}/abandon`, {
      method: 'POST',
    });
  },

  /**
   * Approve a merged response and move to next question
   */
  approveMerged: async (
    interviewId: string,
    questionId: string,
    approvedText: string
  ): Promise<ApproveMergedResult> => {
    return apiRequest<ApproveMergedResult>(`/interviews/${interviewId}/approve-merged`, {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        approved_text: approvedText,
      }),
    });
  },

  /**
   * Get all questions for an interview (pre-fetch for local navigation)
   */
  getAllQuestions: async (interviewId: string): Promise<AllQuestionsResponse> => {
    return apiRequest<AllQuestionsResponse>(`/interviews/${interviewId}/questions`);
  },
};

// Questions API (for fetching all questions - useful for offline/demo mode)
export const questionsApi = {
  /**
   * Get all questions for a question set
   */
  getAll: async (questionSetId: string): Promise<ApiQuestion[]> => {
    return apiRequest<ApiQuestion[]>(`/admin/questions?question_set_id=${questionSetId}`);
  },

  /**
   * Get a single question by ID
   */
  getById: async (questionId: string): Promise<ApiQuestion> => {
    return apiRequest<ApiQuestion>(`/admin/questions/${questionId}`);
  },
};

// Voice API - Text-to-Speech
export interface TTSResponse {
  audio: string; // base64 encoded audio
  format: string;
  voice: string;
}

export interface VoiceConfigResponse {
  websocket_url: string;
  api_key: string;
  available_voices: string[];
}

export const voiceApi = {
  /**
   * Convert text to speech and return base64 audio (demo endpoint - no auth required)
   */
  textToSpeech: async (text: string, voice: string = 'theia'): Promise<TTSResponse> => {
    return apiRequest<TTSResponse>('/voice/tts/demo', {
      method: 'POST',
      body: JSON.stringify({ text, voice }),
    });
  },

  /**
   * Get available voices
   */
  getVoices: async (): Promise<{ voices: Array<{ id: string; model: string; gender: string }>; default: string }> => {
    return apiRequest('/voice/voices');
  },

  /**
   * Get voice configuration for real-time STT (WebSocket URL + API key)
   */
  getConfig: async (): Promise<VoiceConfigResponse> => {
    return apiRequest<VoiceConfigResponse>('/voice/config');
  },
};

// Helper to play base64 audio
export const playBase64Audio = (base64Audio: string, format: string = 'mp3'): Promise<void> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`data:audio/${format};base64,${base64Audio}`);
    audio.onended = () => resolve();
    audio.onerror = (e) => reject(e);
    audio.play().catch(reject);
  });
};

// Auth API types
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  business_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
  business_id?: string;
  level?: string | null;
  created_at?: string;
  preferences?: Record<string, unknown>;
}

export interface BusinessResponse {
  id: string;
  name: string;
  description?: string | null;
  industry?: string | null;
  size?: string | null;
  status: 'active' | 'inactive' | 'pending' | 'trial';
  onboarding_completed: boolean;
  created_at?: string;
  owner_id?: string;
}

export interface BusinessOnboardingRequest {
  industry: string;
  size: string;
  description: string;
}

export interface OnboardingResponse {
  message: string;
  business: BusinessResponse;
}

export interface MeResponse {
  user: UserResponse;
  business: BusinessResponse | null;
}

// Auth API
export const authApi = {
  /**
   * Register a new business and user
   */
  register: async (
    email: string,
    password: string,
    name: string,
    businessName: string
  ): Promise<AuthTokenResponse> => {
    return apiRequest<AuthTokenResponse>('/business/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        name,
        business_name: businessName,
      }),
    });
  },

  /**
   * Login with email and password
   */
  login: async (email: string, password: string): Promise<AuthTokenResponse> => {
    return apiRequest<AuthTokenResponse>('/business/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Get current user and business info
   */
  getMe: async (): Promise<MeResponse> => {
    return apiRequest<MeResponse>('/business/me');
  },

  /**
   * Update user preferences (merge with existing)
   */
  updatePreferences: async (preferences: Record<string, unknown>): Promise<{ message: string; preferences: Record<string, unknown> }> => {
    return apiRequest<{ message: string; preferences: Record<string, unknown> }>('/business/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ preferences }),
    });
  },

  /**
   * Complete business onboarding
   */
  completeOnboarding: async (
    industry: string,
    size: string,
    description: string
  ): Promise<OnboardingResponse> => {
    return apiRequest<OnboardingResponse>('/business/onboarding', {
      method: 'POST',
      body: JSON.stringify({ industry, size, description }),
    });
  },
};

// Reviews API types
export interface ReviewResponse {
  id: string;
  name: string;
  description?: string;
  goal?: string;
  focus_areas?: string[];
  status: 'draft' | 'ongoing' | 'submitted' | 'reviewed' | 'evaluated' | 'archived';
  question_set_id: string;
  business_id: string;
  participant_count: number;
  completed_count: number;
  submitted_count: number;
  created_at: string;
  updated_at?: string;
}

export interface ReviewParticipantResponse {
  id: string;
  review_id: string;
  user_id?: string;
  email: string;
  name: string;
  status: 'invited' | 'started' | 'completed' | 'submitted';
  invited_at: string;
  completed_at?: string;
}

export interface ReviewInterviewResponse {
  id: string;
  participant_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'submitted' | 'abandoned';
  started_at?: string;
  completed_at?: string;
  response_count: number;
}

// Interview Response types (for editing)
export interface InterviewResponseItem {
  id: string;
  question_id: string;
  question_number: number;
  question_text: string;
  question_aspect: string;
  question_aspect_code: string;
  text: string;
  is_voice: boolean;
  status: string;
  is_followup: boolean;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewResponsesResponse {
  interview_id: string;
  interview_status: string;
  can_edit: boolean;
  responses: InterviewResponseItem[];
}

export interface ReviewStatsResponse {
  review_id: string;
  review_status: string;
  total_participants: number;
  total_interviews: number;
  participant_stats: {
    invited: number;
    started: number;
    completed: number;
    submitted: number;
  };
  interview_stats: {
    pending: number;
    in_progress: number;
    completed: number;
    submitted: number;
    abandoned: number;
  };
  can_submit: boolean;
}

export interface ReviewDetailResponse extends ReviewResponse {
  participants: ReviewParticipantResponse[];
  interviews: ReviewInterviewResponse[];
}

export interface CreateReviewRequest {
  question_set_id: string;
  name?: string;  // Optional - will be auto-generated from goal by LLM
  description?: string;
  goal: string;  // Required - primary goal/objective
  focus_areas?: string[];
  additional_context?: string;
}

export interface MyAssessmentResponse {
  review_id: string;
  review_name: string;
  review_status: string;
  participant_id: string;
  participant_status: string;
  interview_id?: string | null;
  interview_status?: string | null;
  interview_progress: number;
  created_at: string;
}

export interface AddParticipantRequest {
  email: string;
  name: string;
}

// Reviews API
export const reviewsApi = {
  /**
   * List all reviews for the current business
   */
  list: async (): Promise<ReviewResponse[]> => {
    return apiRequest<ReviewResponse[]>('/business/reviews');
  },

  /**
   * Get review details by ID (includes participants and interviews)
   */
  getById: async (reviewId: string): Promise<ReviewDetailResponse> => {
    return apiRequest<ReviewDetailResponse>(`/business/reviews/${reviewId}`);
  },

  /**
   * Create a new review
   * Name is optional - will be auto-generated from goal by LLM if not provided
   */
  create: async (
    questionSetId: string,
    goal: string,
    options?: {
      name?: string;
      description?: string;
      focus_areas?: string[];
      additional_context?: string;
    }
  ): Promise<ReviewResponse> => {
    return apiRequest<ReviewResponse>('/business/reviews', {
      method: 'POST',
      body: JSON.stringify({
        question_set_id: questionSetId,
        name: options?.name,
        goal,
        focus_areas: options?.focus_areas,
        additional_context: options?.additional_context,
      }),
    });
  },

  /**
   * Get assessments where current user is a participant
   */
  myAssessments: async (): Promise<MyAssessmentResponse[]> => {
    return apiRequest<MyAssessmentResponse[]>('/business/my-assessments');
  },

  /**
   * Add a participant to a review
   */
  addParticipant: async (
    reviewId: string,
    email: string,
    name: string
  ): Promise<ReviewParticipantResponse> => {
    return apiRequest<ReviewParticipantResponse>(`/business/reviews/${reviewId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  },

  /**
   * Update a review
   */
  update: async (
    reviewId: string,
    data: {
      name?: string;
      description?: string;
      goal?: string;
      focus_areas?: string[];
      additional_context?: string;
    }
  ): Promise<ReviewResponse> => {
    return apiRequest<ReviewResponse>(`/business/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Submit assessment for evaluation (locks all interviews)
   */
  submit: async (reviewId: string): Promise<{ id: string; status: string; message: string }> => {
    return apiRequest(`/business/reviews/${reviewId}/submit`, {
      method: 'POST',
    });
  },

  /**
   * Get assessment statistics
   */
  getStats: async (reviewId: string): Promise<ReviewStatsResponse> => {
    return apiRequest<ReviewStatsResponse>(`/business/reviews/${reviewId}/stats`);
  },
};

// Extended Interview API for response management
export const interviewResponsesApi = {
  /**
   * Get all responses for an interview (for review/editing)
   */
  getResponses: async (interviewId: string): Promise<InterviewResponsesResponse> => {
    return apiRequest<InterviewResponsesResponse>(`/interviews/${interviewId}/responses`);
  },

  /**
   * Edit a response
   */
  editResponse: async (
    interviewId: string,
    responseId: string,
    text: string
  ): Promise<{ id: string; text: string; message: string }> => {
    return apiRequest(`/interviews/${interviewId}/responses/${responseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ text }),
    });
  },

  /**
   * Submit interview to assessment pool
   */
  submitInterview: async (interviewId: string): Promise<{ id: string; status: string; message: string }> => {
    return apiRequest(`/interviews/${interviewId}/submit`, {
      method: 'POST',
    });
  },
};

// Voice Agent API - Deepgram Voice Agent mode
export interface VoiceAgentConfigResponse {
  websocket_url: string;
  api_key: string;
  settings_message: Record<string, any>;
}

export interface ConversationTurn {
  role: 'agent' | 'user';
  text: string;
  timestamp?: number;
}

export interface SaveVoiceSessionResponse {
  success: boolean;
  response_id: string;
  next_action: 'complete' | 'next_question' | 'stay';
  interview_status: 'in_progress' | 'completed';
  next_question_id?: string;
}

export const voiceAgentApi = {
  /**
   * Get Voice Agent configuration for a specific question.
   * Returns WebSocket URL, API key, and Settings message.
   */
  getConfig: async (
    interviewId: string,
    questionId: string,
  ): Promise<VoiceAgentConfigResponse> => {
    return apiRequest<VoiceAgentConfigResponse>(
      `/voice-agent/config?interview_id=${interviewId}&question_id=${questionId}`
    );
  },

  /**
   * Save a voice agent session transcript and move to next question.
   */
  saveSession: async (
    interviewId: string,
    questionId: string,
    userTranscript: string,
    conversationHistory: ConversationTurn[] = [],
  ): Promise<SaveVoiceSessionResponse> => {
    return apiRequest<SaveVoiceSessionResponse>(
      `/interviews/${interviewId}/save-voice-session`,
      {
        method: 'POST',
        body: JSON.stringify({
          question_id: questionId,
          user_transcript: userTranscript,
          conversation_history: conversationHistory,
        }),
      }
    );
  },
};

export default {
  interview: interviewApi,
  interviewResponses: interviewResponsesApi,
  questions: questionsApi,
  voice: voiceApi,
  voiceAgent: voiceAgentApi,
  auth: authApi,
  reviews: reviewsApi,
  playBase64Audio,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
};
