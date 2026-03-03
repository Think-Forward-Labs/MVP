/**
 * Dashboard V2 Utilities
 * Score colors, quadrant calculation, formatting, metric lookups
 */

import type { MetricDef, MetricScoreDetail, MetricInsight, CompanySize, QuadrantResult } from './types';

// CABAS Metric ordering — from CABAS v2.1 AI Training Benchmarks, Page 3
export const METRIC_ORDER: MetricDef[] = [
  { code: 'M1', clientName: 'Operational Strength', academicTerm: 'Technical Fitness' },
  { code: 'M2', clientName: 'Future Readiness', academicTerm: 'Evolutionary Fitness' },
  { code: 'M9', clientName: 'Run/Transform Balance', academicTerm: 'Ambidexterity' },
  { code: 'M5', clientName: 'Market Radar', academicTerm: 'Sensing' },
  { code: 'M3', clientName: 'Insight-to-Action', academicTerm: 'Learning Effectiveness' },
  { code: 'M13', clientName: 'Defensible Strengths', academicTerm: 'VRIN Competitive Advantage' },
  { code: 'M4', clientName: 'Implementation Speed', academicTerm: 'Execution Agility' },
  { code: 'M6', clientName: 'Decision Flow', academicTerm: 'Information Flow Quality' },
  { code: 'M7', clientName: 'Knowledge Leverage', academicTerm: 'Integration & Reuse' },
  { code: 'M8', clientName: 'Accountability Speed', academicTerm: 'Ownership Latency' },
  { code: 'M10', clientName: 'Change Readiness', academicTerm: 'Organizational Readiness' },
  { code: 'M11', clientName: 'Structure Fitness', academicTerm: 'Organizational Design' },
  { code: 'M12', clientName: 'Capacity & Tools', academicTerm: 'Resource Availability' },
  { code: 'M14', clientName: 'Risk Tolerance', academicTerm: 'Risk Appetite' },
];

// Get metric display name
export function getMetricDisplayName(metricCode: string, metricName?: string): string {
  const def = METRIC_ORDER.find(m => m.code === metricCode);
  return def?.clientName || metricName || metricCode || 'Unknown';
}

// Get metric academic term
export function getMetricAcademicTerm(metricCode: string): string {
  const def = METRIC_ORDER.find(m => m.code === metricCode);
  return def?.academicTerm || '';
}

// Sort metrics by M-number
export function sortMetricsByNumber(metrics: MetricScoreDetail[]): MetricScoreDetail[] {
  return [...metrics].sort((a, b) => {
    const aNum = parseInt(a.metric_code?.replace(/\D/g, '') || '999', 10);
    const bNum = parseInt(b.metric_code?.replace(/\D/g, '') || '999', 10);
    return aNum - bNum;
  });
}

// Get aggregated metrics (source_id is null)
export function getAggregatedMetrics(metrics: MetricScoreDetail[]): MetricScoreDetail[] {
  return metrics.filter(m => !m.source_id);
}

// 14-Metric color palette — NO red or green (reserved for sentiment)
// Uses blues, purples, teals, ambers, pinks, slates to stay distinct from sentiment
export const METRIC_COLORS: Record<string, { base: string; bg10: string; bg06: string }> = {
  M1:  { base: '#3B82F6', bg10: 'rgba(59,130,246,0.10)',  bg06: 'rgba(59,130,246,0.06)' },   // blue
  M2:  { base: '#8B5CF6', bg10: 'rgba(139,92,246,0.10)',  bg06: 'rgba(139,92,246,0.06)' },   // violet
  M3:  { base: '#06B6D4', bg10: 'rgba(6,182,212,0.10)',   bg06: 'rgba(6,182,212,0.06)' },    // cyan
  M4:  { base: '#F59E0B', bg10: 'rgba(245,158,11,0.10)',  bg06: 'rgba(245,158,11,0.06)' },   // amber
  M5:  { base: '#0EA5E9', bg10: 'rgba(14,165,233,0.10)',  bg06: 'rgba(14,165,233,0.06)' },   // sky blue
  M6:  { base: '#D946EF', bg10: 'rgba(217,70,239,0.10)',  bg06: 'rgba(217,70,239,0.06)' },   // fuchsia
  M7:  { base: '#6366F1', bg10: 'rgba(99,102,241,0.10)',  bg06: 'rgba(99,102,241,0.06)' },   // indigo
  M8:  { base: '#EC4899', bg10: 'rgba(236,72,153,0.10)',  bg06: 'rgba(236,72,153,0.06)' },   // pink
  M9:  { base: '#14B8A6', bg10: 'rgba(20,184,166,0.10)',  bg06: 'rgba(20,184,166,0.06)' },   // teal
  M10: { base: '#F97316', bg10: 'rgba(249,115,22,0.10)',  bg06: 'rgba(249,115,22,0.06)' },   // orange
  M11: { base: '#7C3AED', bg10: 'rgba(124,58,237,0.10)',  bg06: 'rgba(124,58,237,0.06)' },   // purple
  M12: { base: '#A855F7', bg10: 'rgba(168,85,247,0.10)',  bg06: 'rgba(168,85,247,0.06)' },   // medium purple
  M13: { base: '#0891B2', bg10: 'rgba(8,145,178,0.10)',   bg06: 'rgba(8,145,178,0.06)' },    // dark cyan
  M14: { base: '#CA8A04', bg10: 'rgba(202,138,4,0.10)',   bg06: 'rgba(202,138,4,0.06)' },    // dark amber
};

// Score → color — muted institutional palette (not neon)
export function scoreColor(score: number): string {
  if (score >= 70) return '#22C55E'; // muted green
  if (score >= 55) return '#3B82F6'; // muted blue
  if (score >= 40) return '#F59E0B'; // amber
  return '#EF4444'; // muted red
}

// Score → label matching Iva's mockup
export function scoreLabel(score: number): string {
  if (score >= 70) return 'STRONG';
  if (score >= 55) return 'ADEQUATE';
  if (score >= 40) return 'WATCH AREA';
  return 'CRITICAL GAP';
}

// Legacy aliases (keep for compatibility)
export function getScoreColor(score: number): string {
  return scoreColor(score);
}
export function getScoreColorRaw(score: number, _theme: 'light' | 'dark' = 'light'): string {
  return scoreColor(score);
}
export function getScoreLabel(score: number): string {
  return scoreLabel(score);
}

// Health status → color
export function getHealthColor(status: string): string {
  switch (status) {
    case 'excellent': return 'var(--dv2-score-excellent)';
    case 'good': return 'var(--dv2-score-good)';
    case 'at_risk': return 'var(--dv2-score-at-risk)';
    case 'critical': return 'var(--dv2-score-critical)';
    default: return 'var(--dv2-text-secondary)';
  }
}

// Get metric score from sorted metrics or refined insights
export function getMetricScore(
  code: string,
  sortedMetrics: MetricScoreDetail[],
  metricInsights: MetricInsight[]
): number {
  const metric = sortedMetrics.find(m => m.metric_code === code);
  if (metric?.overall_score) return metric.overall_score;
  const refined = metricInsights.find(m => m.metric_code === code);
  return refined?.score || 0;
}

// Operational Strength (X-axis) composite
export function calcOperationalStrength(
  sortedMetrics: MetricScoreDetail[],
  insights: MetricInsight[]
): number {
  const get = (code: string) => getMetricScore(code, sortedMetrics, insights);
  return Math.round(
    get('M1') * 0.40 +
    get('M4') * 0.20 +
    get('M9') * 0.15 +
    get('M11') * 0.15 +
    get('M8') * 0.10
  );
}

// Future Readiness (Y-axis) composite
export function calcFutureReadiness(
  sortedMetrics: MetricScoreDetail[],
  insights: MetricInsight[]
): number {
  const get = (code: string) => getMetricScore(code, sortedMetrics, insights);
  return Math.round(
    get('M2') * 0.40 +
    get('M5') * 0.20 +
    get('M3') * 0.15 +
    get('M14') * 0.15 +
    get('M10') * 0.10
  );
}

// Quadrant determination
export function getQuadrant(
  sortedMetrics: MetricScoreDetail[],
  insights: MetricInsight[]
): QuadrantResult {
  const m1 = getMetricScore('M1', sortedMetrics, insights);
  const m2 = getMetricScore('M2', sortedMetrics, insights);
  const x = calcOperationalStrength(sortedMetrics, insights);
  const y = calcFutureReadiness(sortedMetrics, insights);

  let name: string;
  let color: string;

  if (m1 >= 65 && m2 >= 65) { name = 'Adaptive Leader'; color = '#22C55E'; }
  else if (m1 >= 65 && m2 < 65) { name = 'Solid Performer'; color = '#F59E0B'; }
  else if (m1 < 65 && m2 >= 65) { name = 'Scattered Experimenter'; color = '#3B82F6'; }
  else { name = 'At-Risk'; color = '#EF4444'; }

  return { name, color, x, y };
}

// Risk exposure calculation
export const SPEND_BY_SIZE: Record<CompanySize, { label: string; spend: number }> = {
  micro: { label: '< 50', spend: 75000 },
  small: { label: '50–149', spend: 200000 },
  medium: { label: '150–250', spend: 375000 },
  large: { label: '> 250', spend: 500000 },
  other: { label: 'Not sure', spend: 200000 },
};

export const RISK_BANDS = [
  { maxScore: 29, midpoint: 0.75, label: 'Severely at risk', sources: 'Bain 88%, McKinsey 70%' },
  { maxScore: 49, midpoint: 0.60, label: 'At risk', sources: 'BCG 65% failure rate' },
  { maxScore: 69, midpoint: 0.40, label: 'Moderate risk without intervention', sources: 'BCG 35% success rate' },
  { maxScore: 100, midpoint: 0.20, label: 'Good odds but not guaranteed', sources: 'Prosci 7x with excellent CM' },
];

export function calcRiskExposure(m2Score: number, companySize: CompanySize) {
  const spend = SPEND_BY_SIZE[companySize].spend;
  const band = RISK_BANDS.find(b => m2Score <= b.maxScore) || RISK_BANDS[RISK_BANDS.length - 1];
  const low = Math.round(spend * band.midpoint * 0.75);
  const high = Math.round(spend * band.midpoint * 1.25);
  const mid = Math.round(spend * band.midpoint);
  const formatted = `£${(low / 1000).toFixed(0)}k–£${(high / 1000).toFixed(0)}k`;
  return { low, high, mid, formatted, band };
}

// Format date
export function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// Format date+time
export function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

// Severity → color
export function getSeverityColor(severity: string): { bg: string; text: string; border: string } {
  switch (severity) {
    case 'critical':
      return { bg: 'var(--dv2-severity-critical-bg)', text: 'var(--dv2-severity-critical-text)', border: 'var(--dv2-severity-critical-border)' };
    case 'warning':
    case 'moderate':
      return { bg: 'var(--dv2-severity-warning-bg)', text: 'var(--dv2-severity-warning-text)', border: 'var(--dv2-severity-warning-border)' };
    default:
      return { bg: 'var(--dv2-severity-info-bg)', text: 'var(--dv2-severity-info-text)', border: 'var(--dv2-severity-info-border)' };
  }
}

// Priority sort order
export function priorityOrder(priority: string): number {
  switch (priority) {
    case 'critical': return 0;
    case 'high': return 1;
    case 'medium': return 2;
    default: return 3;
  }
}

// Normalize refined report data (handle string[] vs object[] formats)
export function normalizeActions(actions: Array<string | Record<string, unknown>>): import('./types').KeyActionType[] {
  return actions.map(action => {
    if (typeof action === 'string') {
      return {
        title: action,
        description: '',
        owner: '',
        timeline: '',
        priority: 'medium' as const,
        impact: 'medium' as const,
        effort: 'medium' as const,
        metrics: [],
        evidence: [],
        related_issues: [],
      };
    }
    return {
      title: (action.title as string) || '',
      description: (action.description as string) || '',
      owner: (action.owner as string) || '',
      timeline: (action.timeline as string) || '',
      priority: (action.priority as 'critical' | 'high' | 'medium') || 'medium',
      impact: (action.impact as 'high' | 'medium' | 'low') || 'medium',
      effort: (action.effort as 'high' | 'medium' | 'low') || 'medium',
      metrics: (action.metrics as string[]) || [],
      evidence: (action.evidence as Array<{ quote: string; role: string }>) || [],
      related_issues: (action.related_issues as string[]) || [],
    };
  });
}

export function normalizeIssues(issues: Array<string | Record<string, unknown>>): import('./types').CriticalIssueType[] {
  return issues.map(issue => {
    if (typeof issue === 'string') {
      return {
        title: issue.length > 50 ? issue.substring(0, 50) + '...' : issue,
        severity: 'critical' as const,
        metrics: [],
        description: issue,
        evidence: [],
        root_causes: [],
        business_impact: '',
      };
    }
    return issue as unknown as import('./types').CriticalIssueType;
  });
}

export function normalizeStrengths(strengths: Array<string | Record<string, unknown>>): import('./types').StrengthType[] {
  return strengths.map(s => {
    if (typeof s === 'string') {
      return {
        title: s.length > 50 ? s.substring(0, 50) + '...' : s,
        metrics: [],
        description: s,
        evidence: [],
        opportunity: '',
      };
    }
    return s as unknown as import('./types').StrengthType;
  });
}
