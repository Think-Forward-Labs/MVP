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

export type AdminSection = 'businesses' | 'question-sets' | 'admins' | 'metrics' | 'reviews' | 'evaluations';

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

// Dimension-based scoring (BARS methodology)
export interface DimensionAnchor {
  level: number;           // 1-5 (1=lowest, 5=highest)
  score_range: string;     // e.g., "80-100", "60-80"
  behavior: string;        // Behavioral description for this level
  signals: string[];       // Detection keywords/phrases
  example_phrases: string[]; // Example response phrases for AI training
}

export interface Dimension {
  id: string;              // Unique ID e.g., "trigger_clarity"
  name: string;            // Display name e.g., "Trigger Clarity"
  description: string;     // What this dimension measures
  weight: number;          // Percentage weight (should sum to 100 across all dimensions)
  anchors: DimensionAnchor[]; // 5-level behavioral anchors
}

export interface CriticalFlag {
  id: string;              // e.g., "no_example", "avoidance"
  condition: string;       // Description of when this flag triggers
  signals: string[];       // Keywords that trigger this flag
  action: string;          // What happens when triggered
  max_score?: number;      // Cap score at this level if triggered
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
  // Dimensional scoring (BARS methodology)
  dimensions?: Dimension[];
  critical_flags?: CriticalFlag[];
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
  // For evaluation sorting - computed from most_recent_pending or evaluated_reviews
  latest_evaluation_at?: string;
  evaluated_reviews?: number;
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

// Evaluation Types
export type EvaluationStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ResponseQualityLevel = 'complete' | 'partial' | 'minimal' | 'empty';
export type FlagSeverity = 'critical' | 'warning' | 'info';
export type FlagType = 'contradiction' | 'inconsistency' | 'missing_data' | 'outlier' | 'quality_issue';

export interface EvaluationRunSummary {
  id: string;
  assessment_id?: string;
  run_number: number;
  status: EvaluationStatus | string;  // API returns string
  total_sources?: number;
  total_questions_scored?: number;
  total_metrics_calculated?: number;
  total_flags: number;
  flags_requiring_review?: number;
  unresolved_flags?: number;
  average_metric_score?: number;
  overall_score?: number;  // Alias for average_metric_score for frontend compatibility
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface EvaluationSource {
  id: string;
  source_type: string;
  name: string;
  reference_id?: string;
}

export interface DimensionAnchor {
  level: number;
  score_range: string;
  behavior: string;
}

export interface DimensionScoreDetail {
  dimension_id: string;
  dimension_name: string;
  description?: string;
  weight?: number;
  anchors?: DimensionAnchor[];
  score: number;
  confidence: ConfidenceLevel;
  reasoning: string;
}

export interface QuestionInterdependency {
  linked_question_id: string;
  linked_question_code: string;
  description: string;
  scoring_impact?: string | null;
  type?: string;
}

// What the AI actually checked and found for an interdependency
export interface InterdependencyCheckResult {
  id: string;
  check_type: string;  // "contradiction", "validation", "context", "pathology"
  primary_question_code: string;
  linked_question_code: string;
  interdependency_description: string;  // What should be checked (from question definition)
  primary_score?: number | null;
  linked_score?: number | null;
  passed: boolean;  // true = no issue found, false = issue detected
  reasoning: string;  // AI explanation of what was checked and concluded
  flag_id?: string | null;  // If a flag was created, link to it
}

export interface QuestionScoreDetail {
  id: string;
  source_id: string;
  question_id: string;
  question_code: string;
  question_text?: string;
  overall_score: number;
  dimension_scores: DimensionScoreDetail[];
  interdependencies?: QuestionInterdependency[];
  check_results?: InterdependencyCheckResult[];  // What AI actually found for each interdependency
  confidence: ConfidenceLevel;
  response_quality: ResponseQualityLevel;
  scoring_reasoning?: string;
  raw_response?: string;
  requires_review: boolean;
}

export interface QuestionContribution {
  question_id: string;
  question_code: string;
  score: number;
  weight: number;
  weighted_contribution: number;
}

export interface MetricScoreDetail {
  id: string;
  source_id?: string | null;  // null = aggregated across all sources, otherwise per-interview
  metric_id: string;
  metric_code: string;
  metric_name?: string;
  overall_score: number;
  question_contributions: QuestionContribution[];
  confidence: ConfidenceLevel;
  interpretation?: string;
}

export interface FlagTrigger {
  trigger_type: string;
  source_question?: string;
  target_question?: string;
  condition: string;
}

export interface FlagEvidence {
  question_id: string;
  response_excerpt: string;
  relevance: string;
}

export interface EvaluationFlag {
  id: string;
  flag_type: FlagType;
  severity: FlagSeverity;
  title: string;
  description?: string;
  source_ids: string[];  // Which interview sources this flag applies to
  question_ids?: string[];  // Legacy - use source_ids instead
  triggers?: FlagTrigger[];
  evidence?: FlagEvidence[];
  ai_explanation?: string;
  requires_review: boolean;
  is_resolved: boolean;
  resolution?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at?: string;
}

export interface EvaluationRunDetail {
  id: string;
  assessment_id: string;
  run_number: number;
  status: EvaluationStatus;
  triggered_by: string;
  config: Record<string, unknown>;
  sources: EvaluationSource[];
  question_scores: QuestionScoreDetail[];
  metric_scores: MetricScoreDetail[];
  flags: EvaluationFlag[];
  audit_log: {
    total_entries: number;
    stages_covered: string[];
  };
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface EvaluationScoresResponse {
  run_id: string;
  question_scores: QuestionScoreDetail[];
  metric_scores: MetricScoreDetail[];
}
