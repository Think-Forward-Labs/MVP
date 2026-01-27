// Application-wide types for Think Forward platform

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
  business_id?: string;
  level?: string | null;
  created_at?: string;
}

export interface Business {
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

export interface BusinessOnboarding {
  industry: string;
  size: string;
  description: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
}

export interface UserContext {
  user: User;
  business: Business | null;
}

export interface Review {
  id: string;
  name: string;
  description?: string;
  goal?: string | null;
  focus_areas?: string[];
  additional_context?: string | null;
  status: 'draft' | 'ongoing' | 'submitted' | 'reviewed' | 'evaluated' | 'archived';
  question_set_id: string;
  business_id?: string;
  participant_count: number;
  completed_count: number;
  submitted_count?: number;
  interview_count?: number;
  created_by?: string;
  is_creator?: boolean;
  current_user_participant?: {
    id: string;
    status: string;
    interview_id?: string | null;
  } | null;
  created_at: string;
  updated_at?: string;
}

export interface ReviewDetail extends Review {
  question_set?: {
    id: string;
    name: string;
    total_questions: number;
  } | null;
  participants: ReviewParticipant[];
  interviews: ReviewInterview[];
}

export interface MyAssessment {
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

export interface ReviewParticipant {
  id: string;
  review_id: string;
  user_id?: string;
  email: string;
  name: string;
  status: 'invited' | 'started' | 'completed' | 'submitted';
  invited_at: string;
  completed_at?: string;
}

export interface ReviewInterview {
  id: string;
  participant_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'submitted' | 'abandoned';
  started_at?: string;
  completed_at?: string;
  response_count: number;
}

// Interview response for editing
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

export type AppView = 'landing' | 'dashboard' | 'review-detail';

export type DashboardSection =
  | 'overview'
  | 'interviews'
  | 'documents'
  | 'integrations'
  | 'analysis'
  | 'settings';

export type AuthMode = 'login' | 'signup';
