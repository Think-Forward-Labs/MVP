/**
 * Dashboard V2 Types
 * Re-exports admin types + dashboard-specific interfaces
 */

export type {
  EvaluationRunDetail,
  EvaluationScoresResponse,
  EvaluationFlag,
  MetricScoreDetail,
  QuestionScoreDetail,
  BusinessWithReviews,
} from '../../types/admin';

// Metric definition with client-facing and academic names
export interface MetricDef {
  code: string;
  clientName: string;
  academicTerm: string;
}

// Two-phase observation pipeline types
export interface VerbatimQuote {
  text: string;
  role: string;
  question_code: string;
  verified: boolean;
}

export interface StructuredObservation {
  lens_id: string;
  lens_name: string;
  text: string;
  sentiment: 'positive' | 'negative';
  severity_scope: string;
  severity_urgency: string;
  severity_score: number;
  evidence: VerbatimQuote[];
  is_emergent: boolean;
  business_impact: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface StructuredRecommendation {
  action: string;
  first_step: string;
  owner_role: string;
  linked_observations: string[];
  evidence_anchor: string;
  expected_outcome: string;
  timeframe: string;
}

// Refined report metric insight
export interface MetricInsight {
  metric_code: string;
  metric_name: string;
  category: string;
  score: number;
  health_status: 'excellent' | 'good' | 'at_risk' | 'critical';
  summary: string;
  observations: (string | StructuredObservation)[];
  recommendations: (string | StructuredRecommendation)[];
  synthesized_impact?: string;
  evidence: Array<{ quote: string; role: string; supports: 'strength' | 'gap' | 'context' }>;
  ai_reasoning?: {
    methodology: string;
    data_points_analyzed: number;
    confidence_factors: string[];
    key_signals: string[];
    limitations: string[];
  };
  benchmark_narrative?: string;
  context_data?: Record<string, unknown>;
}

// Critical issue from refined report
export interface CriticalIssueType {
  title: string;
  severity: 'critical' | 'warning';
  metrics: string[];
  avg_score?: number;
  description: string;
  evidence: Array<{ quote: string; role: string }>;
  root_causes: string[];
  business_impact: string;
}

// Strength from refined report
export interface StrengthType {
  title: string;
  metrics: string[];
  avg_score?: number;
  description: string;
  evidence: Array<{ quote: string; role: string }>;
  opportunity: string;
}

// Key action from refined report
export interface KeyActionType {
  title: string;
  description: string;
  owner: string;
  timeline: string;
  priority: 'critical' | 'high' | 'medium';
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  metrics?: string[];
  evidence?: Array<{ quote: string; role: string }>;
  related_issues?: string[];
}

// Detected pathology
export interface PathologyType {
  pathology_type: string;
  severity: 'critical' | 'moderate' | 'informational';
  client_title: string;
  client_description: string;
  coaching_question: string;
  icon: string;
  category: string;
  evidence: Array<{ quote: string; role: string }>;
  related_metrics: string[];
  is_core?: boolean;
  client_anchor?: string;
  roadmap?: {
    title?: string;
    urgency?: string;
    month_1?: { theme?: string; actions?: string[] };
    month_2?: { theme?: string; actions?: string[] };
    month_3?: { theme?: string; actions?: string[] };
  };
}

// Level comparison for CEO Mirror
export interface LevelComparison {
  level_scores: Record<string, Record<string, { level: string; score: number; respondent_count: number }>>;
  implementation_gaps: Array<{
    metric_code: string;
    metric_name: string;
    senior_score: number;
    frontline_score: number;
    gap: number;
    direction: string;
  }>;
  narrative: string;
  source_count: number;
  levels_present: string[];
}

// Full refined report shape
export interface RefinedReport {
  metrics: MetricInsight[];
  executive_summary: string;
  key_actions: KeyActionType[];
  critical_issues: CriticalIssueType[];
  strengths: StrengthType[];
  pathologies: PathologyType[];
  contradictions: Array<{
    contradiction_id: string;
    primary_question_code: string;
    linked_question_code: string;
    severity: 'high' | 'moderate';
    client_title: string;
    client_callout: string;
    client_description: string;
    coaching_question: string;
    evidence: Array<{ quote: string; role: string }>;
    related_metrics: string[];
  }>;
  cross_metric_insights?: Record<string, string>;
  level_comparison?: LevelComparison;
}

// Company size for risk calculation
export type CompanySize = 'micro' | 'small' | 'medium' | 'large' | 'other';

// Quadrant result
export interface QuadrantResult {
  name: string;
  color: string;
  x: number;
  y: number;
}

// Theme
export type DashboardTheme = 'light' | 'dark';

// Dashboard V2 props
export interface DashboardV2Props {
  runId: string;
  businessName?: string;
  onBack: () => void;
}
