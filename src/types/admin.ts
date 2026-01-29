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

export type AdminSection = 'businesses' | 'question-sets' | 'admins';

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
  interdependencies?: string;
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
