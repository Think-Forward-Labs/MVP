/**
 * Admin Portal Types
 */

export type AdminRole = 'super_admin' | 'admin' | 'support';

export interface Admin {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  role: AdminRole;
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

export interface AdminLoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
}

export interface BusinessOverview {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'pending' | 'trial';
  contact_email?: string;
  created_at: string;
}

export interface QuestionSetOverview {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  status: string;
  total_questions: number;
  created_at: string;
}

export interface AdminListItem {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
}

export type AdminSection = 'businesses' | 'question-sets' | 'admins' | 'metrics' | 'reviews';

// Question Types
export type QuestionType = 'open' | 'scale' | 'percentage' | 'single_select' | 'multi_select';
export type QuestionStatus = 'active' | 'draft' | 'archived';

export interface ScaleConfig {
  min: number;
  max: number;
  min_label: string;
  max_label: string;
}

export interface MetricWeight {
  metric_code: string;
  metric_name: string;
  weight: number;
}

export interface ScoreAnchor {
  range: string;
  description: string;
}

export interface ChecklistItem {
  id: string;
  key: string;
  description: string;
}

export interface ExampleAnswer {
  level: string;
  score_range: string;
  answer: string;
}

export interface Interdependency {
  linked_question_id: string;
  linked_question_code: string;
  description: string;
  scoring_impact: string;
}

export interface Question {
  id: string;
  question_set_id: string;
  question_number: number;
  order: number;
  aspect: string;
  aspect_code: string;
  text: string;
  description?: string;
  type: QuestionType;
  options?: string[];
  scale?: ScaleConfig;
  required: boolean;
  status: QuestionStatus;
  // CABAS Assessment Fields
  purpose?: string;
  metrics_weights?: MetricWeight[];
  scoring_instruction?: string;
  detection_keywords?: string[];
  interdependencies?: Interdependency[];
  score_anchors?: ScoreAnchor[];
  scoring_note?: string;
  example_answers?: ExampleAnswer[];
  checklist?: ChecklistItem[];
  created_at: string;
  created_by?: string;
}

export interface QuestionSetDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  version: string;
  status: string;
  language: string;
  estimated_duration_minutes: number;
  total_questions: number;
  aspects: string[];
  questions: Question[];
  created_at: string;
  created_by?: string;
}

// Metric Types
export type MetricCategory = 'core' | 'derived';
export type MetricStatus = 'active' | 'draft' | 'archived';

export interface QuestionWeightConfig {
  question_id: string;
  question_code: string;
  question_text: string;
  weight: number;
}

export interface DerivedMetricSource {
  metric_id: string;
  metric_code: string;
  metric_name: string;
  weight: number;
}

export interface Metric {
  id: string;
  code: string;
  name: string;
  academic_term?: string;
  description?: string;
  interpretation_guide?: string;
  category: MetricCategory;
  status: MetricStatus;
  question_weights: QuestionWeightConfig[];
  source_metrics: DerivedMetricSource[];
  order: number;
  created_at: string;
  created_by?: string;
}

export interface MetricOverview {
  id: string;
  code: string;
  name: string;
  category: MetricCategory;
  status: MetricStatus;
  question_count: number;
  order: number;
}

// Review Types (Admin View)
export type ReviewStatus = 'draft' | 'ongoing' | 'submitted' | 'reviewed' | 'evaluated' | 'archived';
export type InterviewStatus = 'pending' | 'in_progress' | 'completed' | 'submitted' | 'abandoned';
export type InterviewMode = 'text' | 'voice' | 'voice_agent';
export type ResponseStatus = 'pending' | 'complete' | 'needs_followup' | 'skipped';

export interface ReviewStats {
  total_invited: number;
  total_started: number;
  total_completed: number;
  total_submitted: number;
}

export interface ReviewOverview {
  id: string;
  name: string;
  goal?: string;
  status: ReviewStatus;
  business_id: string;
  business_name: string;
  question_set_id: string;
  question_set_name: string;
  stats: ReviewStats;
  submitted_at?: string;
  submitted_by?: string;
  evaluated_at?: string;
  created_at: string;
  interview_count: number;
}

export interface InterviewProgress {
  current_question: number;
  total_questions: number;
  percentage: number;
}

export interface InterviewSummary {
  id: string;
  participant_id: string;
  user_id?: string;
  participant_email?: string;
  participant_name: string;
  status: InterviewStatus;
  mode: InterviewMode;
  progress: InterviewProgress;
  response_count: number;
  started_at?: string;
  completed_at?: string;
  submitted_at?: string;
  duration_seconds: number;
}

export interface ReviewDetail {
  id: string;
  name: string;
  description?: string;
  goal?: string;
  focus_areas: string[];
  additional_context?: string;
  status: ReviewStatus;
  business: {
    id: string;
    name: string;
  };
  question_set: {
    id: string;
    name: string;
    total_questions: number;
  };
  settings: {
    anonymous_responses: boolean;
    show_progress_to_participants: boolean;
    allow_save_and_continue: boolean;
    deadline?: string;
  };
  stats: ReviewStats;
  interviews: InterviewSummary[];
  submitted_at?: string;
  submitted_by?: string;
  evaluated_at?: string;
  created_at: string;
  created_by: string;
}

export interface ChecklistItemResult {
  item_id: string;
  item_text: string;
  satisfied: boolean;
  extracted_value?: string;
}

export interface LLMEvaluation {
  evaluated_at: string;
  model_used: string;
  checklist_results: ChecklistItemResult[];
  all_satisfied: boolean;
  suggested_followup?: string;
  merged_response?: string;
  confidence_score: number;
  raw_response?: string;
}

export interface VoiceData {
  audio_duration_seconds: number;
  transcription_confidence: number;
  language_detected?: string;
}

export interface InterviewResponse {
  id: string;
  question_id: string;
  question_number: number;
  question_text: string;
  question_aspect?: string;
  question_aspect_code?: string;
  text: string;
  is_voice: boolean;
  voice_data?: VoiceData;
  status: ResponseStatus;
  evaluation?: LLMEvaluation;
  is_followup: boolean;
  parent_response_id?: string;
  followup_count: number;
  time_spent_seconds: number;
  started_at?: string;
  submitted_at?: string;
}

// Business with Reviews (Admin Board View)
export interface BusinessWithReviews {
  id: string;
  name: string;
  slug: string;
  status: string;
  pending_reviews: number;
  completed_reviews: number;
  total_reviews: number;
  most_recent_pending?: string;
  has_pending: boolean;
}

export interface BusinessReviewItem {
  id: string;
  name: string;
  goal?: string;
  status: ReviewStatus;
  question_set_id: string;
  question_set_name: string;
  stats: ReviewStats;
  interview_count: number;
  submitted_at?: string;
  evaluated_at?: string;
  created_at: string;
}

export interface BusinessReviewsResponse {
  business: {
    id: string;
    name: string;
    slug: string;
  };
  pending: BusinessReviewItem[];
  completed: BusinessReviewItem[];
}
