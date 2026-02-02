/**
 * Evaluations Section - AI-Powered Assessment Evaluation
 * Hierarchical navigation: Businesses > Assessments > Runs > Detail
 * Detail sub-navigation: Summary > Breakdown > Interview
 */

import { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import type {
  EvaluationRunSummary,
  EvaluationRunDetail,
  EvaluationScoresResponse,
  EvaluationFlag,
  MetricScoreDetail,
  QuestionScoreDetail,
  DimensionScoreDetail,
  BusinessReviewItem,
  BusinessWithReviews,
} from '../../../types/admin';

interface EvaluationsSectionProps {
  onError: (message: string) => void;
}

// Navigation state
type NavigationLevel = 'businesses' | 'assessments' | 'runs' | 'detail';
type DetailSubLevel = 'summary' | 'breakdown' | 'interview';

interface NavigationState {
  level: NavigationLevel;
  selectedBusiness?: { id: string; name: string };
  selectedAssessment?: { id: string; name: string };
  selectedRun?: EvaluationRunDetail;
  detailSubLevel?: DetailSubLevel;
  selectedSourceId?: string;
}

// CABAS Metric ordering with client-facing and academic terms
// Order from CABAS v2.1 AI Training Benchmarks, Page 3
const METRIC_ORDER: { code: string; clientName: string; academicTerm: string }[] = [
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

// Helper to get metric display name with academic term
function getMetricDisplayName(metricCode: string, metricName?: string): string {
  const metricDef = METRIC_ORDER.find(m => m.code === metricCode);
  if (metricDef) {
    return `${metricDef.clientName} (${metricDef.academicTerm})`;
  }
  return metricName || metricCode || 'Unknown Metric';
}

// Helper to sort metrics by CABAS order
function sortMetricsByCABASOrder(metrics: MetricScoreDetail[]): MetricScoreDetail[] {
  return [...metrics].sort((a, b) => {
    const aIndex = METRIC_ORDER.findIndex(m => m.code === a.metric_code);
    const bIndex = METRIC_ORDER.findIndex(m => m.code === b.metric_code);
    // Unknown metrics go to end
    const aOrder = aIndex === -1 ? 999 : aIndex;
    const bOrder = bIndex === -1 ? 999 : bIndex;
    return aOrder - bOrder;
  });
}

// ============ Utility Functions ============

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateString?: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

// Institutional RAG status colors
function getScoreColor(score: number): string {
  if (score >= 80) return '#1A7F37'; // Green - Success
  if (score >= 70) return '#0969DA'; // Blue - Good
  if (score >= 60) return '#9A6700'; // Amber - Moderate
  return '#CF222E'; // Red - Attention
}

function getStatusColor(status: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    completed: { bg: 'rgba(22, 163, 74, 0.1)', text: '#16A34A' },
    processing: { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563EB' },
    pending: { bg: 'rgba(217, 119, 6, 0.1)', text: '#D97706' },
    failed: { bg: 'rgba(220, 38, 38, 0.1)', text: '#DC2626' },
  };
  return colors[status] || { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' };
}

function getSeverityColor(severity: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    critical: { bg: 'rgba(220, 38, 38, 0.1)', text: '#DC2626' },
    warning: { bg: 'rgba(217, 119, 6, 0.1)', text: '#D97706' },
    info: { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563EB' },
  };
  return colors[severity] || { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' };
}

// ============ Main Component ============

export function EvaluationsSection({ onError }: EvaluationsSectionProps) {
  // Navigation state
  const [nav, setNav] = useState<NavigationState>({ level: 'businesses' });

  // Data states
  const [businesses, setBusinesses] = useState<BusinessWithReviews[]>([]);
  const [assessments, setAssessments] = useState<BusinessReviewItem[]>([]);
  const [runs, setRuns] = useState<EvaluationRunSummary[]>([]);
  const [scores, setScores] = useState<EvaluationScoresResponse | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  // Note: activeTab kept for future use when tabs are implemented
  const [_activeTab, _setActiveTab] = useState<'metrics' | 'questions' | 'flags'>('metrics');

  // For triggering new evaluations
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [triggeringReview, setTriggeringReview] = useState<string | null>(null);

  useEffect(() => {
    loadBusinesses();
  }, []);

  // ============ Data Loading ============

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getBusinessesWithReviews();

      // Sort by most recent evaluation first (latest_evaluation_at or most_recent_pending)
      const sorted = data.sort((a, b) => {
        // Use latest_evaluation_at if available, otherwise most_recent_pending
        const aDate = a.latest_evaluation_at || a.most_recent_pending || '1970-01-01';
        const bDate = b.latest_evaluation_at || b.most_recent_pending || '1970-01-01';
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      setBusinesses(sorted);
    } catch (err) {
      onError('Failed to load businesses');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssessments = async (businessId: string) => {
    try {
      setIsLoading(true);
      const data = await adminApi.getBusinessReviews(businessId);

      // Combine pending and completed reviews (both are evaluatable)
      const allReviews = [...(data.pending || []), ...(data.completed || [])];

      // Sort by evaluated_at or submitted_at (most recent first)
      const sorted = allReviews.sort((a, b) => {
        const aDate = a.evaluated_at || a.submitted_at || a.created_at || '1970-01-01';
        const bDate = b.evaluated_at || b.submitted_at || b.created_at || '1970-01-01';
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      setAssessments(sorted);
    } catch (err) {
      onError('Failed to load assessments');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRuns = async (assessmentId: string) => {
    try {
      setIsLoading(true);
      const data = await adminApi.getAssessmentEvaluationRuns(assessmentId);

      // Sort by most recent first
      const sorted = data.sort((a, b) => {
        const aDate = a.created_at || '1970-01-01';
        const bDate = b.created_at || '1970-01-01';
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      setRuns(sorted);
    } catch (err) {
      onError('Failed to load evaluation runs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRunDetail = async (runId: string) => {
    try {
      setIsLoading(true);
      const [detail, scoresData] = await Promise.all([
        adminApi.getEvaluationRun(runId),
        adminApi.getEvaluationScores(runId),
      ]);
      setNav(prev => ({
        ...prev,
        level: 'detail',
        selectedRun: detail,
        detailSubLevel: 'summary',
        selectedSourceId: undefined,
      }));
      setScores(scoresData);
      // Tab will default to 'metrics' from useState initialization
    } catch (err) {
      onError('Failed to load evaluation details');
    } finally {
      setIsLoading(false);
    }
  };

  // ============ Navigation ============

  const selectBusiness = (business: { id: string; name: string }) => {
    setNav({ level: 'assessments', selectedBusiness: business });
    loadAssessments(business.id);
  };

  const selectAssessment = (assessment: { id: string; name: string }) => {
    setNav(prev => ({ ...prev, level: 'runs', selectedAssessment: assessment }));
    loadRuns(assessment.id);
  };

  const goBack = () => {
    if (nav.level === 'detail') {
      // Handle sub-navigation within detail view
      if (nav.detailSubLevel === 'interview') {
        // Go back to breakdown
        setNav(prev => ({ ...prev, detailSubLevel: 'breakdown', selectedSourceId: undefined }));
      } else if (nav.detailSubLevel === 'breakdown') {
        // Go back to summary
        setNav(prev => ({ ...prev, detailSubLevel: 'summary' }));
      } else {
        // Go back to runs list
        setNav(prev => ({ ...prev, level: 'runs', selectedRun: undefined, detailSubLevel: undefined, selectedSourceId: undefined }));
        setScores(null);
        if (nav.selectedAssessment) {
          loadRuns(nav.selectedAssessment.id);
        }
      }
    } else if (nav.level === 'runs') {
      setNav(prev => ({ ...prev, level: 'assessments', selectedAssessment: undefined }));
      if (nav.selectedBusiness) {
        loadAssessments(nav.selectedBusiness.id);
      }
    } else if (nav.level === 'assessments') {
      setNav({ level: 'businesses' });
      loadBusinesses();
    }
  };

  // Navigate to breakdown view
  const goToBreakdown = () => {
    setNav(prev => ({ ...prev, detailSubLevel: 'breakdown' }));
  };

  // Navigate to interview detail
  const goToInterviewDetail = (sourceId: string) => {
    setNav(prev => ({ ...prev, detailSubLevel: 'interview', selectedSourceId: sourceId }));
  };

  // ============ Actions ============

  const triggerEvaluation = async (assessmentId: string) => {
    try {
      setTriggeringReview(assessmentId);
      const result = await adminApi.runEvaluation(assessmentId);
      setShowTriggerModal(false);
      // Refresh and show the new run
      await loadRuns(assessmentId);
      setTimeout(() => {
        if (result.run_id) {
          loadRunDetail(result.run_id);
        }
      }, 1000);
    } catch (err) {
      onError('Failed to trigger evaluation');
    } finally {
      setTriggeringReview(null);
    }
  };

  const resolveFlag = async (flagId: string, resolution: string) => {
    try {
      await adminApi.resolveFlag(flagId, resolution);
      if (nav.selectedRun) {
        loadRunDetail(nav.selectedRun.id);
      }
    } catch (err) {
      onError('Failed to resolve flag');
    }
  };

  // ============ Render ============

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* CSS for dimension panel animation */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      {/* Breadcrumb */}
      <Breadcrumb nav={nav} onNavigate={(level) => {
        if (level === 'businesses') {
          setNav({ level: 'businesses' });
          loadBusinesses();
        } else if (level === 'assessments' && nav.selectedBusiness) {
          setNav({ level: 'assessments', selectedBusiness: nav.selectedBusiness });
          loadAssessments(nav.selectedBusiness.id);
        } else if (level === 'runs' && nav.selectedBusiness && nav.selectedAssessment) {
          setNav({ level: 'runs', selectedBusiness: nav.selectedBusiness, selectedAssessment: nav.selectedAssessment });
          loadRuns(nav.selectedAssessment.id);
        }
      }} />

      {/* Level 1: Businesses */}
      {nav.level === 'businesses' && (
        <BusinessesList
          businesses={businesses}
          onSelect={selectBusiness}
        />
      )}

      {/* Level 2: Assessments */}
      {nav.level === 'assessments' && nav.selectedBusiness && (
        <AssessmentsList
          businessName={nav.selectedBusiness.name}
          assessments={assessments}
          onSelect={selectAssessment}
          onBack={goBack}
          onTriggerEvaluation={() => setShowTriggerModal(true)}
        />
      )}

      {/* Level 3: Runs */}
      {nav.level === 'runs' && nav.selectedAssessment && (
        <RunsList
          assessmentName={nav.selectedAssessment.name}
          runs={runs}
          onSelect={loadRunDetail}
          onBack={goBack}
          onTriggerEvaluation={() => triggerEvaluation(nav.selectedAssessment!.id)}
          isTriggering={triggeringReview === nav.selectedAssessment.id}
        />
      )}

      {/* Level 4: Detail - with sub-navigation */}
      {nav.level === 'detail' && nav.selectedRun && (
        <>
          {nav.detailSubLevel === 'summary' && (
            <RunSummaryView
              run={nav.selectedRun}
              scores={scores}
              onBack={goBack}
              onViewBreakdown={goToBreakdown}
            />
          )}
          {nav.detailSubLevel === 'breakdown' && (
            <InterviewBreakdownView
              run={nav.selectedRun}
              scores={scores}
              onBack={goBack}
              onSelectInterview={goToInterviewDetail}
            />
          )}
          {nav.detailSubLevel === 'interview' && nav.selectedSourceId && (
            <InterviewDetailView
              run={nav.selectedRun}
              scores={scores}
              sourceId={nav.selectedSourceId}
              onBack={goBack}
              onResolveFlag={resolveFlag}
            />
          )}
        </>
      )}

      {/* Trigger Modal */}
      {showTriggerModal && (
        <TriggerEvaluationModal
          assessments={assessments}
          triggeringReview={triggeringReview}
          onTrigger={triggerEvaluation}
          onClose={() => setShowTriggerModal(false)}
        />
      )}
    </div>
  );
}

// ============ Breadcrumb ============

function Breadcrumb({
  nav,
  onNavigate
}: {
  nav: NavigationState;
  onNavigate: (level: NavigationLevel) => void;
}) {
  return (
    <div style={styles.breadcrumb}>
      <button
        onClick={() => onNavigate('businesses')}
        style={nav.level === 'businesses' ? styles.breadcrumbActive : styles.breadcrumbLink}
      >
        Evaluations
      </button>

      {nav.selectedBusiness && (
        <>
          <span style={styles.breadcrumbSeparator}>/</span>
          <button
            onClick={() => onNavigate('assessments')}
            style={nav.level === 'assessments' ? styles.breadcrumbActive : styles.breadcrumbLink}
          >
            {nav.selectedBusiness.name}
          </button>
        </>
      )}

      {nav.selectedAssessment && (
        <>
          <span style={styles.breadcrumbSeparator}>/</span>
          <button
            onClick={() => onNavigate('runs')}
            style={nav.level === 'runs' ? styles.breadcrumbActive : styles.breadcrumbLink}
          >
            {nav.selectedAssessment.name}
          </button>
        </>
      )}

      {nav.selectedRun && (
        <>
          <span style={styles.breadcrumbSeparator}>/</span>
          <span style={styles.breadcrumbActive}>
            Run #{nav.selectedRun.run_number}
          </span>
        </>
      )}
    </div>
  );
}

// ============ Level 1: Businesses List ============

function BusinessesList({
  businesses,
  onSelect,
}: {
  businesses: BusinessWithReviews[];
  onSelect: (business: { id: string; name: string }) => void;
}) {
  return (
    <>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Evaluations</h1>
          <p style={styles.subtitle}>Select a business to view evaluation results</p>
        </div>
      </div>

      {businesses.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 style={styles.emptyTitle}>No businesses with evaluations</h3>
          <p style={styles.emptyText}>
            Businesses will appear here once they have submitted reviews for evaluation.
          </p>
        </div>
      ) : (
        <div style={styles.cardGrid}>
          {businesses.map((business) => (
            <div
              key={business.id}
              onClick={() => onSelect({ id: business.id, name: business.name })}
              style={styles.businessCard}
            >
              <div style={styles.businessIcon}>
                {business.name.charAt(0).toUpperCase()}
              </div>
              <div style={styles.businessInfo}>
                <h3 style={styles.businessName}>{business.name}</h3>
                <p style={styles.businessMeta}>
                  {business.total_reviews} assessment{business.total_reviews !== 1 ? 's' : ''} •
                  {business.completed_reviews} evaluated
                </p>
              </div>
              {business.most_recent_pending && (
                <span style={styles.lastEvaluated}>
                  {timeAgo(business.most_recent_pending)}
                </span>
              )}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.chevron}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ============ Level 2: Assessments List ============

function AssessmentsList({
  businessName,
  assessments,
  onSelect,
  onBack,
  onTriggerEvaluation,
}: {
  businessName: string;
  assessments: BusinessReviewItem[];
  onSelect: (assessment: { id: string; name: string }) => void;
  onBack: () => void;
  onTriggerEvaluation: () => void;
}) {
  return (
    <>
      <div style={styles.header}>
        <div>
          <button onClick={onBack} style={styles.backButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 style={styles.title}>{businessName}</h1>
          <p style={styles.subtitle}>Select an assessment to view evaluation runs</p>
        </div>
        <button onClick={onTriggerEvaluation} style={styles.primaryButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Evaluation
        </button>
      </div>

      {assessments.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 style={styles.emptyTitle}>No assessments available</h3>
          <p style={styles.emptyText}>
            This business has no submitted assessments ready for evaluation.
          </p>
        </div>
      ) : (
        <div style={styles.cardGrid}>
          {assessments.map((assessment) => {
            const statusColor = getStatusColor(assessment.status);
            return (
              <div
                key={assessment.id}
                onClick={() => onSelect({ id: assessment.id, name: assessment.name })}
                style={styles.assessmentCard}
              >
                <div style={styles.assessmentHeader}>
                  <h3 style={styles.assessmentName}>{assessment.name}</h3>
                  <span style={{ ...styles.statusBadge, background: statusColor.bg, color: statusColor.text }}>
                    {assessment.status}
                  </span>
                </div>
                <div style={styles.assessmentStats}>
                  <span>{assessment.stats.total_submitted} interview{assessment.stats.total_submitted !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{assessment.evaluated_at ? `Evaluated ${timeAgo(assessment.evaluated_at)}` : 'Not evaluated'}</span>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.chevron}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ============ Level 3: Runs List ============

function RunsList({
  assessmentName,
  runs,
  onSelect,
  onBack,
  onTriggerEvaluation,
  isTriggering,
}: {
  assessmentName: string;
  runs: EvaluationRunSummary[];
  onSelect: (runId: string) => void;
  onBack: () => void;
  onTriggerEvaluation: () => void;
  isTriggering: boolean;
}) {
  return (
    <>
      <div style={styles.header}>
        <div>
          <button onClick={onBack} style={styles.backButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 style={styles.title}>{assessmentName}</h1>
          <p style={styles.subtitle}>Evaluation runs sorted by most recent</p>
        </div>
        <button
          onClick={onTriggerEvaluation}
          style={styles.primaryButton}
          disabled={isTriggering}
        >
          {isTriggering ? (
            <>
              <div style={styles.smallSpinner} />
              Running...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run Evaluation
            </>
          )}
        </button>
      </div>

      {runs.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 style={styles.emptyTitle}>No evaluation runs yet</h3>
          <p style={styles.emptyText}>
            Click "Run Evaluation" to score this assessment with AI.
          </p>
          <button onClick={onTriggerEvaluation} style={styles.emptyButton} disabled={isTriggering}>
            {isTriggering ? 'Running...' : 'Run First Evaluation'}
          </button>
        </div>
      ) : (
        <div style={styles.runsList}>
          {runs.map((run) => (
            <RunCard key={run.id} run={run} onClick={() => onSelect(run.id)} />
          ))}
        </div>
      )}
    </>
  );
}

// ============ Run Card ============

function RunCard({ run, onClick }: { run: EvaluationRunSummary; onClick: () => void }) {
  const statusColor = getStatusColor(run.status);

  return (
    <div onClick={onClick} style={styles.runCard}>
      <div style={styles.runHeader}>
        <div style={styles.runInfo}>
          <span style={styles.runNumber}>Run #{run.run_number}</span>
          <span style={{ ...styles.statusBadge, background: statusColor.bg, color: statusColor.text }}>
            {run.status}
          </span>
        </div>
        <span style={styles.runTime}>{timeAgo(run.created_at)}</span>
      </div>

      <div style={styles.runStats}>
        <div style={styles.runStat}>
          <span style={styles.runStatValue}>{run.total_questions_scored || 0}</span>
          <span style={styles.runStatLabel}>Questions</span>
        </div>
        <div style={styles.runStat}>
          <span style={styles.runStatValue}>{run.total_metrics_calculated || 0}</span>
          <span style={styles.runStatLabel}>Metrics</span>
        </div>
        <div style={styles.runStat}>
          <span style={{
            ...styles.runStatValue,
            color: (run.unresolved_flags || run.flags_requiring_review || 0) > 0 ? '#DC2626' : '#16A34A',
          }}>
            {run.unresolved_flags || run.flags_requiring_review || 0}
          </span>
          <span style={styles.runStatLabel}>Flags</span>
        </div>
        {run.average_metric_score && (
          <div style={styles.runStat}>
            <span style={{ ...styles.runStatValue, color: getScoreColor(run.average_metric_score) }}>
              {Math.round(run.average_metric_score)}
            </span>
            <span style={styles.runStatLabel}>Avg Score</span>
          </div>
        )}
      </div>

      <div style={styles.runMeta}>
        {run.completed_at && (
          <span style={styles.runMetaText}>
            Completed {formatDateTime(run.completed_at)}
          </span>
        )}
      </div>
    </div>
  );
}

// ============ Helper: Get aggregated metrics (for Run Summary view) ============

function getAggregatedMetrics(metricScores: MetricScoreDetail[]): MetricScoreDetail[] {
  // First, check if there are pre-aggregated metrics (source_id is null)
  const aggregatedFromAPI = metricScores.filter(m => m.source_id === null || m.source_id === undefined);

  if (aggregatedFromAPI.length > 0) {
    // Use the pre-aggregated metrics from API, but dedupe by metric_code
    const seen = new Set<string>();
    return aggregatedFromAPI.filter(m => {
      if (seen.has(m.metric_code)) return false;
      seen.add(m.metric_code);
      return true;
    });
  }

  // Otherwise, aggregate per-interview metrics by metric_code (simple average)
  const metricMap = new Map<string, { scores: number[]; sample: MetricScoreDetail }>();

  metricScores.forEach(metric => {
    const code = metric.metric_code;
    if (!metricMap.has(code)) {
      metricMap.set(code, { scores: [], sample: metric });
    }
    metricMap.get(code)!.scores.push(metric.overall_score || 0);
  });

  // Create aggregated metrics (simple average)
  const aggregated: MetricScoreDetail[] = [];
  metricMap.forEach((data, code) => {
    const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    aggregated.push({
      ...data.sample,
      id: `agg-${code}`,
      source_id: null,
      overall_score: avgScore,
    });
  });

  return aggregated;
}

// ============ Helper: Get metrics for a specific interview ============

function getMetricsForInterview(metricScores: MetricScoreDetail[], sourceId: string): MetricScoreDetail[] {
  // Filter metrics that belong to this specific interview
  const interviewMetrics = metricScores.filter(m => m.source_id === sourceId);

  // Dedupe by metric_code (shouldn't have duplicates, but just in case)
  const seen = new Set<string>();
  return interviewMetrics.filter(m => {
    if (seen.has(m.metric_code)) return false;
    seen.add(m.metric_code);
    return true;
  });
}

// ============ Run Summary View (Aggregated) ============

function RunSummaryView({
  run,
  scores,
  onBack,
  onViewBreakdown,
}: {
  run: EvaluationRunDetail;
  scores: EvaluationScoresResponse | null;
  onBack: () => void;
  onViewBreakdown: () => void;
}) {
  const statusColor = getStatusColor(run.status);
  const totalFlags = run.flags?.filter(f => !f.is_resolved) || [];

  // Get aggregated metrics (deduplicated by metric_code) and sort by CABAS order
  const aggregatedMetrics = getAggregatedMetrics(scores?.metric_scores || []);
  const sortedMetrics = sortMetricsByCABASOrder(aggregatedMetrics);

  // Calculate overall score
  const avgScore = sortedMetrics.length > 0
    ? Math.round(sortedMetrics.reduce((sum, m) => sum + (m.overall_score || 0), 0) / sortedMetrics.length)
    : 0;

  // Get RAG status
  const getRAGStatus = (score: number) => {
    if (score >= 70) return { label: 'Strong', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)' };
    if (score >= 50) return { label: 'Moderate', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' };
    return { label: 'Needs Work', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' };
  };

  const ragStatus = getRAGStatus(avgScore);

  // Count metrics by status
  const strongCount = sortedMetrics.filter(m => (m.overall_score || 0) >= 70).length;
  const moderateCount = sortedMetrics.filter(m => (m.overall_score || 0) >= 50 && (m.overall_score || 0) < 70).length;
  const needsWorkCount = sortedMetrics.filter(m => (m.overall_score || 0) < 50).length;

  return (
    <>
      {/* Header */}
      <div style={styles.detailHeader}>
        <button onClick={onBack} style={styles.backButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Runs
        </button>

        <div style={styles.detailTitle}>
          <h1 style={styles.title}>Evaluation Run #{run.run_number}</h1>
          <span style={{ ...styles.statusBadge, background: statusColor.bg, color: statusColor.text }}>
            {run.status}
          </span>
        </div>

        <p style={styles.detailMeta}>
          Started {formatDateTime(run.started_at)} • {run.sources?.length || 0} interview{(run.sources?.length || 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Executive Summary Card */}
      <div style={styles.executiveSummary}>
        <div style={styles.execScoreSection}>
          <div style={styles.execScoreCircle}>
            <span style={{ ...styles.execScoreValue, color: ragStatus.color }}>{avgScore}</span>
            <span style={styles.execScoreLabel}>Overall Score</span>
          </div>
          <span style={{ ...styles.ragBadge, background: ragStatus.bg, color: ragStatus.color }}>
            {ragStatus.label}
          </span>
        </div>

        <div style={styles.execStatsRow}>
          <div style={styles.execStat}>
            <span style={styles.execStatValue}>{run.sources?.length || 0}</span>
            <span style={styles.execStatLabel}>Interviews</span>
          </div>
          <div style={styles.execStat}>
            <span style={styles.execStatValue}>{sortedMetrics.length}</span>
            <span style={styles.execStatLabel}>Metrics</span>
          </div>
          <div style={styles.execStat}>
            <span style={{ ...styles.execStatValue, color: '#16A34A' }}>{strongCount}</span>
            <span style={styles.execStatLabel}>Strong</span>
          </div>
          <div style={styles.execStat}>
            <span style={{ ...styles.execStatValue, color: '#D97706' }}>{moderateCount}</span>
            <span style={styles.execStatLabel}>Moderate</span>
          </div>
          <div style={styles.execStat}>
            <span style={{ ...styles.execStatValue, color: '#DC2626' }}>{needsWorkCount}</span>
            <span style={styles.execStatLabel}>Needs Work</span>
          </div>
          <div style={styles.execStat}>
            <span style={{ ...styles.execStatValue, color: totalFlags.length > 0 ? '#DC2626' : '#16A34A' }}>
              {totalFlags.length}
            </span>
            <span style={styles.execStatLabel}>Flags</span>
          </div>
        </div>
      </div>

      {/* Aggregated Metrics Breakdown - CABAS Order */}
      <div style={styles.sectionHeader}>
        <h2 style={styles.sectionTitle}>Aggregated Metrics</h2>
        <p style={styles.sectionSubtitle}>Weighted averages across all {run.sources?.length || 0} interviews</p>
      </div>

      <div style={styles.metricsBarChart}>
        {sortedMetrics.map((metric) => {
          const scoreColor = getScoreColor(metric.overall_score || 0);
          const displayName = getMetricDisplayName(metric.metric_code, metric.metric_name);

          return (
            <div key={metric.id} style={styles.metricBarRow}>
              <div style={styles.metricBarLabel}>
                <span style={styles.metricBarCode}>{metric.metric_code}</span>
                <span style={styles.metricBarName}>{displayName}</span>
              </div>
              <div style={styles.metricBarContainer}>
                <div style={{ ...styles.metricBarFillAgg, width: `${metric.overall_score || 0}%`, background: scoreColor }} />
              </div>
              <span style={{ ...styles.metricBarScore, color: scoreColor }}>
                {Math.round(metric.overall_score || 0)}
              </span>
            </div>
          );
        })}
      </div>

      {/* View Breakdown Button */}
      <div style={styles.viewBreakdownSection}>
        <button onClick={onViewBreakdown} style={styles.viewBreakdownButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          View Interview Breakdown
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <p style={styles.viewBreakdownHint}>
          See individual interview scores, interdependency analysis, and detailed flags
        </p>
      </div>
    </>
  );
}

// ============ Interview Breakdown View ============

function InterviewBreakdownView({
  run,
  scores,
  onBack,
  onSelectInterview,
}: {
  run: EvaluationRunDetail;
  scores: EvaluationScoresResponse | null;
  onBack: () => void;
  onSelectInterview: (sourceId: string) => void;
}) {
  const sources = run.sources || [];

  // Calculate per-interview stats using metric-based scoring
  const getInterviewStats = (sourceId: string) => {
    const questionScores = scores?.question_scores?.filter(q => q.source_id === sourceId) || [];

    // Get metrics for this interview (filtered by source_id)
    const interviewMetrics = getMetricsForInterview(scores?.metric_scores || [], sourceId);

    // Average score based on metrics (not questions)
    const avgScore = interviewMetrics.length > 0
      ? Math.round(interviewMetrics.reduce((sum, m) => sum + (m.overall_score || 0), 0) / interviewMetrics.length)
      : 0;

    const flagCount = run.flags?.filter(f => f.source_ids?.includes(sourceId)).length || 0;

    return { questionCount: questionScores.length, metricCount: interviewMetrics.length, avgScore, flagCount };
  };

  return (
    <>
      {/* Header */}
      <div style={styles.detailHeader}>
        <button onClick={onBack} style={styles.backButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Summary
        </button>

        <h1 style={styles.title}>Interview Breakdown</h1>
        <p style={styles.detailMeta}>
          {sources.length} interview{sources.length !== 1 ? 's' : ''} in this evaluation
        </p>
      </div>

      {/* Interview List */}
      <div style={styles.interviewList}>
        {sources.map((source, index) => {
          const stats = getInterviewStats(source.id);
          const scoreColor = getScoreColor(stats.avgScore);

          return (
            <div
              key={source.id}
              onClick={() => onSelectInterview(source.id)}
              style={styles.interviewCard}
            >
              <div style={styles.interviewIcon}>
                {index + 1}
              </div>
              <div style={styles.interviewInfo}>
                <h3 style={styles.interviewName}>{source.name || `Interview ${index + 1}`}</h3>
                <p style={styles.interviewMeta}>
                  {source.source_type} • {stats.questionCount} questions scored
                  {stats.flagCount > 0 && (
                    <span style={styles.interviewFlagBadge}>{stats.flagCount} flag{stats.flagCount !== 1 ? 's' : ''}</span>
                  )}
                </p>
              </div>
              <div style={styles.interviewScoreSection}>
                <span style={{ ...styles.interviewScore, color: scoreColor }}>
                  {stats.avgScore}
                </span>
                <span style={styles.interviewScoreLabel}>Avg</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.chevron}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          );
        })}
      </div>

      {sources.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No interview sources found for this evaluation.</p>
        </div>
      )}
    </>
  );
}

// ============ Interview Detail View ============

// Format interview ID: assessment_1768663930241_om0qsig → INT-1768663
function formatInterviewId(sourceId: string): string {
  const match = sourceId.match(/(\d{7})/);
  return match ? `INT-${match[1]}` : `INT-${sourceId.slice(0, 7).toUpperCase()}`;
}

// Get RAG status based on score
function getRAGStatus(score: number): { status: 'green' | 'amber' | 'red'; color: string; bg: string } {
  if (score >= 80) return { status: 'green', color: '#1A7F37', bg: 'rgba(26, 127, 55, 0.1)' };
  if (score >= 60) return { status: 'amber', color: '#9A6700', bg: 'rgba(154, 103, 0, 0.1)' };
  return { status: 'red', color: '#CF222E', bg: 'rgba(207, 34, 46, 0.1)' };
}

// Calculate confidence level
function getConfidenceLevel(metrics: MetricScoreDetail[]): 'High' | 'Medium' | 'Low' {
  if (metrics.length === 0) return 'Low';
  const highCount = metrics.filter(m => m.confidence?.toLowerCase() === 'high').length;
  const ratio = highCount / metrics.length;
  if (ratio >= 0.7) return 'High';
  if (ratio >= 0.4) return 'Medium';
  return 'Low';
}

function InterviewDetailView({
  run,
  scores,
  sourceId,
  onBack,
  onResolveFlag,
}: {
  run: EvaluationRunDetail;
  scores: EvaluationScoresResponse | null;
  sourceId: string;
  onBack: () => void;
  onResolveFlag: (flagId: string, resolution: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'metrics' | 'questions' | 'flags'>('metrics');

  // Find the source
  const source = run.sources?.find(s => s.id === sourceId);
  const sourceName = source?.name || 'Interview';

  // Filter question scores for this interview
  const interviewQuestions = scores?.question_scores?.filter(q => q.source_id === sourceId) || [];

  // Get metrics for this specific interview (filtered by source_id)
  const interviewMetrics = getMetricsForInterview(scores?.metric_scores || [], sourceId);

  // Sort by CABAS order
  const sortedInterviewMetrics = sortMetricsByCABASOrder(interviewMetrics);

  // Get flags for this interview (flags use source_ids, not question_ids)
  const interviewFlags = run.flags?.filter(f =>
    f.source_ids?.includes(sourceId)
  ) || [];

  // Show all unresolved flags, not just requires_review
  const totalFlags = interviewFlags.filter(f => !f.is_resolved);

  // Calculate average score from metrics (not questions)
  const avgScore = sortedInterviewMetrics.length > 0
    ? Math.round(sortedInterviewMetrics.reduce((sum, m) => sum + (m.overall_score || 0), 0) / sortedInterviewMetrics.length)
    : 0;

  // Anonymous ID format
  const formattedId = formatInterviewId(sourceId);
  const ragStatus = getRAGStatus(avgScore);
  const confidence = getConfidenceLevel(sortedInterviewMetrics);

  return (
    <>
      {/* Institutional Header */}
      <div style={institutionalStyles.headerContainer}>
        {/* Top Bar with Breadcrumb */}
        <div style={institutionalStyles.headerTop}>
          <nav style={institutionalStyles.breadcrumb}>
            <button onClick={onBack} style={institutionalStyles.breadcrumbLink}>Evaluations</button>
            <span style={institutionalStyles.breadcrumbSep}>/</span>
            <span style={institutionalStyles.breadcrumbLink}>Run #{run.run_number}</span>
            <span style={institutionalStyles.breadcrumbSep}>/</span>
            <span style={institutionalStyles.breadcrumbCurrent}>{formattedId}</span>
          </nav>
        </div>

        {/* Main Header */}
        <div style={institutionalStyles.headerMain}>
          <div style={institutionalStyles.candidateInfo}>
            <div style={institutionalStyles.avatar}>
              {formattedId.slice(-3)}
            </div>
            <div>
              <h1 style={institutionalStyles.candidateName}>{formattedId}</h1>
              <div style={institutionalStyles.candidateMeta}>
                <span>{sourceName}</span>
                <span style={institutionalStyles.metaDot} />
                <span style={institutionalStyles.methodBadge}>
                  {source?.source_type || 'Interview'}
                </span>
              </div>
            </div>
          </div>

          {/* Score Panel */}
          <div style={institutionalStyles.scorePanel}>
            <div style={institutionalStyles.scoreMain}>
              <span style={{ ...institutionalStyles.scoreValue, color: ragStatus.color }}>
                {avgScore}
              </span>
              <span style={institutionalStyles.scoreMax}>/100</span>
            </div>
            <div style={institutionalStyles.scoreBar}>
              <div style={{
                ...institutionalStyles.scoreBarFill,
                width: `${avgScore}%`,
                backgroundColor: ragStatus.color,
              }} />
            </div>
            <span style={institutionalStyles.scoreLabel}>Overall Assessment Score</span>
          </div>
        </div>

        {/* Metadata Bar */}
        <div style={institutionalStyles.headerMeta}>
          <div style={institutionalStyles.metaItem}>
            <span style={institutionalStyles.metaLabel}>Evaluated</span>
            <span style={institutionalStyles.metaValue}>{formatDate(run.started_at)}</span>
          </div>
          <div style={institutionalStyles.metaItem}>
            <span style={institutionalStyles.metaLabel}>Questions</span>
            <span style={institutionalStyles.metaValue}>{interviewQuestions.length}</span>
          </div>
          <div style={institutionalStyles.metaItem}>
            <span style={institutionalStyles.metaLabel}>Metrics</span>
            <span style={institutionalStyles.metaValue}>{sortedInterviewMetrics.length}</span>
          </div>
          <div style={institutionalStyles.metaItem}>
            <span style={institutionalStyles.metaLabel}>Flags</span>
            <span style={{
              ...institutionalStyles.metaValue,
              color: totalFlags.length > 0 ? '#9A6700' : '#1A7F37',
            }}>
              {totalFlags.length}
            </span>
          </div>
          <div style={institutionalStyles.metaItem}>
            <span style={institutionalStyles.metaLabel}>Confidence</span>
            <span style={institutionalStyles.metaValue}>{confidence}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={institutionalStyles.nav}>
        <div style={institutionalStyles.navInner}>
          {([
            { id: 'metrics' as const, label: 'Metrics', count: sortedInterviewMetrics.length },
            { id: 'questions' as const, label: 'Questions', count: interviewQuestions.length },
            { id: 'flags' as const, label: 'Flags', count: totalFlags.length, alert: totalFlags.length > 0 },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...institutionalStyles.navTab,
                ...(activeTab === tab.id ? institutionalStyles.navTabActive : {}),
              }}
            >
              {tab.label}
              <span style={{
                ...institutionalStyles.navCount,
                ...(activeTab === tab.id ? institutionalStyles.navCountActive : {}),
                ...(tab.alert && activeTab !== tab.id ? institutionalStyles.navCountAlert : {}),
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <div style={institutionalStyles.main}>
        {activeTab === 'metrics' && (
          <InterviewMetricsTab
            metrics={sortedInterviewMetrics}
            questionScores={interviewQuestions}
            flags={interviewFlags}
          />
        )}
        {activeTab === 'questions' && (
          <QuestionsTab questions={interviewQuestions} />
        )}
        {activeTab === 'flags' && (
          <FlagsTab flags={interviewFlags} onResolve={onResolveFlag} />
        )}
      </div>
    </>
  );
}

// Institutional Design System Styles
const institutionalStyles: Record<string, React.CSSProperties> = {
  // Colors
  trustBlue: { color: '#0969DA' },

  // Header Container
  headerContainer: {
    borderBottom: '1px solid #D0D7DE',
    backgroundColor: '#FFFFFF',
    marginBottom: '0',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    borderBottom: '1px solid #D8DEE4',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  breadcrumbLink: {
    color: '#0969DA',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0,
  },
  breadcrumbSep: {
    color: '#8C959F',
  },
  breadcrumbCurrent: {
    color: '#24292F',
    fontWeight: 600,
  },
  headerMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
  },
  candidateInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '6px',
    backgroundColor: '#DDF4FF',
    color: '#0969DA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  candidateName: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#24292F',
    margin: '0 0 4px 0',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  candidateMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#57606A',
  },
  metaDot: {
    width: '3px',
    height: '3px',
    borderRadius: '50%',
    backgroundColor: '#AFB8C1',
  },
  methodBadge: {
    padding: '2px 8px',
    backgroundColor: '#F6F8FA',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#57606A',
  },
  scorePanel: {
    textAlign: 'right' as const,
  },
  scoreMain: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: '2px',
    marginBottom: '8px',
  },
  scoreValue: {
    fontSize: '36px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    lineHeight: 1,
  },
  scoreMax: {
    fontSize: '16px',
    color: '#8C959F',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  scoreBar: {
    width: '120px',
    height: '4px',
    backgroundColor: '#D8DEE4',
    borderRadius: '2px',
    overflow: 'hidden',
    marginLeft: 'auto',
    marginBottom: '4px',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.4s ease',
  },
  scoreLabel: {
    fontSize: '12px',
    color: '#8C959F',
  },
  headerMeta: {
    display: 'flex',
    gap: '32px',
    padding: '12px 24px',
    borderTop: '1px solid #D8DEE4',
    backgroundColor: '#F6F8FA',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  metaLabel: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#8C959F',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  metaValue: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#24292F',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },

  // Navigation
  nav: {
    borderBottom: '1px solid #D0D7DE',
    backgroundColor: '#FFFFFF',
  },
  navInner: {
    display: 'flex',
    padding: '0 24px',
  },
  navTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#57606A',
    cursor: 'pointer',
    transition: 'color 0.15s ease, border-color 0.15s ease',
  },
  navTabActive: {
    color: '#24292F',
    borderBottomColor: '#0969DA',
  },
  navCount: {
    padding: '0 8px',
    minWidth: '20px',
    height: '20px',
    borderRadius: '10px',
    backgroundColor: '#F6F8FA',
    color: '#8C959F',
    fontSize: '12px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  navCountActive: {
    backgroundColor: '#0969DA',
    color: '#FFFFFF',
  },
  navCountAlert: {
    backgroundColor: '#FFF8C5',
    color: '#9A6700',
  },

  // Main Content
  main: {
    padding: '24px',
  },
};

// ============ Interview Metrics Tab (Expandable) ============

function InterviewMetricsTab({
  metrics,
  questionScores,
  flags
}: {
  metrics: MetricScoreDetail[];
  questionScores: QuestionScoreDetail[];
  flags: EvaluationFlag[];
}) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<DimensionScoreDetail | null>(null);

  if (metrics.length === 0) {
    return <p style={styles.emptyTabText}>No metrics calculated for this interview.</p>;
  }

  // Build a map of question_id/code -> QuestionScoreDetail for quick lookup
  const questionMap = new Map<string, QuestionScoreDetail>();
  questionScores.forEach(q => {
    questionMap.set(q.question_id, q);
    questionMap.set(q.question_code, q);
  });

  // Get flags related to a specific metric (by checking question contributions)
  const getFlagsForMetric = (metric: MetricScoreDetail): EvaluationFlag[] => {
    const metricQuestionIds = new Set(metric.question_contributions?.map(qc => qc.question_id) || []);
    return flags.filter(f =>
      f.question_ids?.some(qid => metricQuestionIds.has(qid))
    );
  };

  return (
    <div style={styles.expandableMetricsList}>
      {/* Table Header - Institutional Style */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: '#F6F8FA',
        border: '1px solid #D0D7DE',
        borderRadius: '6px 6px 0 0',
      }}>
        <span style={{ flex: 2, fontSize: '11px', fontWeight: 600, color: '#8C959F', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Metric</span>
        <span style={{ width: '100px', fontSize: '11px', fontWeight: 600, color: '#8C959F', textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'center' as const }}>Score</span>
        <span style={{ width: '80px', fontSize: '11px', fontWeight: 600, color: '#8C959F', textTransform: 'uppercase' as const, letterSpacing: '0.5px', textAlign: 'center' as const }}>Confidence</span>
        <span style={{ width: '40px' }} />
      </div>

      {metrics.map((metric, index) => {
        const isExpanded = expandedMetric === metric.id;
        const scoreColor = getScoreColor(metric.overall_score || 0);
        const displayName = getMetricDisplayName(metric.metric_code, metric.metric_name);
        const contributions = metric.question_contributions || [];
        const metricFlags = getFlagsForMetric(metric);
        const isLast = index === metrics.length - 1;

        return (
          <div key={metric.id} style={{
            ...styles.expandableMetricCard,
            borderRadius: isLast && !isExpanded ? '0 0 6px 6px' : '0',
          }}>
            {/* Metric Header (clickable) */}
            <button
              onClick={() => setExpandedMetric(isExpanded ? null : metric.id)}
              style={styles.expandableMetricHeader}
            >
              <div style={styles.expandableMetricLeft}>
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="#8C959F"
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  <path d="M4.427 5.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 5H4.604a.25.25 0 00-.177.427z" />
                </svg>
                <span style={styles.expandableMetricCode}>{metric.metric_code}</span>
                <span style={styles.expandableMetricName}>{displayName}</span>
              </div>
              <div style={styles.expandableMetricRight}>
                <div style={styles.expandableMetricBarContainer}>
                  <div style={{
                    ...styles.expandableMetricBarFill,
                    width: `${metric.overall_score || 0}%`,
                    background: scoreColor
                  }} />
                </div>
                <span style={{ ...styles.expandableMetricScore, color: scoreColor }}>
                  {Math.round(metric.overall_score || 0)}
                </span>
                <span style={styles.expandableMetricConfidence}>
                  {metric.confidence}
                </span>
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div style={styles.expandableMetricContent}>
                {/* Calculation Summary */}
                {metric.interpretation && (
                  <p style={styles.metricInterpretation}>{metric.interpretation}</p>
                )}

                {/* Question Contributions Table */}
                {contributions.length > 0 && (
                  <div style={styles.contributionsSection}>
                    <h4 style={styles.contributionsSectionTitle}>Question Breakdown</h4>
                    <div style={styles.contributionsTable}>
                      <div style={styles.contributionsTableHeader}>
                        <span style={styles.contributionsTableHeaderCell}>Question</span>
                        <span style={styles.contributionsTableHeaderCellRight}>Score</span>
                        <span style={styles.contributionsTableHeaderCellRight}>Weight</span>
                        <span style={styles.contributionsTableHeaderCellRight}>Contribution</span>
                      </div>
                      {contributions.map((qc) => {
                        const questionDetail = questionMap.get(qc.question_id) || questionMap.get(qc.question_code);
                        const isQuestionExpanded = expandedQuestion === qc.question_id;
                        const qScoreColor = getScoreColor(qc.score || 0);

                        return (
                          <div key={qc.question_id}>
                            {/* Question Row */}
                            <button
                              onClick={() => setExpandedQuestion(isQuestionExpanded ? null : qc.question_id)}
                              style={styles.contributionsTableRow}
                            >
                              <span style={styles.contributionsTableCell}>
                                <svg
                                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                                  stroke="currentColor" strokeWidth="2"
                                  style={{
                                    transform: isQuestionExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s',
                                    marginRight: '6px',
                                    opacity: questionDetail ? 1 : 0.3
                                  }}
                                >
                                  <path d="M9 18l6-6-6-6" />
                                </svg>
                                {qc.question_code}
                              </span>
                              <span style={{ ...styles.contributionsTableCellRight, color: qScoreColor }}>
                                {Math.round(qc.score || 0)}
                              </span>
                              <span style={styles.contributionsTableCellRight}>
                                {qc.weight}%
                              </span>
                              <span style={styles.contributionsTableCellRight}>
                                {(qc.weighted_contribution || 0).toFixed(1)}
                              </span>
                            </button>

                            {/* Question Detail (expanded) */}
                            {isQuestionExpanded && questionDetail && (
                              <div style={styles.questionDetailExpanded}>
                                {/* 1. Question Text */}
                                {questionDetail.question_text && (
                                  <p style={styles.questionDetailText}>
                                    <strong>Q:</strong> {questionDetail.question_text}
                                  </p>
                                )}

                                {/* 2. User Response */}
                                {questionDetail.raw_response && (
                                  <div style={styles.rawResponseSection}>
                                    <h5 style={styles.rawResponseTitle}>User Response</h5>
                                    <p style={styles.rawResponseText}>{questionDetail.raw_response}</p>
                                  </div>
                                )}

                                {/* 3. Quality & Confidence */}
                                <div style={styles.questionDetailMeta}>
                                  <span style={styles.questionDetailMetaItem}>
                                    <strong>Quality:</strong> {questionDetail.response_quality}
                                  </span>
                                  <span style={styles.questionDetailMetaItem}>
                                    <strong>Confidence:</strong> {questionDetail.confidence}
                                  </span>
                                  {questionDetail.requires_review && (
                                    <span style={styles.questionDetailReviewBadge}>Needs Review</span>
                                  )}
                                </div>

                                {/* 4. AI Scoring Reasoning */}
                                {questionDetail.scoring_reasoning && (
                                  <div style={styles.aiReasoningSection}>
                                    <h5 style={styles.aiReasoningTitle}>AI Reasoning</h5>
                                    <p style={styles.aiReasoningText}>{questionDetail.scoring_reasoning}</p>
                                  </div>
                                )}

                                {/* 5. Dimension Scores (clickable for details panel) */}
                                {questionDetail.dimension_scores && questionDetail.dimension_scores.length > 0 && (
                                  <div style={styles.dimensionScoresSection}>
                                    <h5 style={styles.dimensionScoresTitle}>Dimension Scores</h5>
                                    {questionDetail.dimension_scores.map((ds, idx) => (
                                      <div key={idx} style={styles.dimensionScoreItem}>
                                        <div style={styles.dimensionScoreHeader}>
                                          <button
                                            onClick={() => setSelectedDimension(ds)}
                                            style={styles.dimensionScoreButton}
                                          >
                                            {ds.dimension_name}
                                            <svg
                                              width="14" height="14" viewBox="0 0 24 24" fill="none"
                                              stroke="currentColor" strokeWidth="2"
                                              style={{ marginLeft: '6px', opacity: 0.5, verticalAlign: 'middle' }}
                                            >
                                              <circle cx="12" cy="12" r="10" />
                                              <path d="M12 16v-4M12 8h.01" />
                                            </svg>
                                          </button>
                                          <span style={{
                                            ...styles.dimensionScoreValue,
                                            color: getScoreColor((ds.score || 0) * 20)
                                          }}>
                                            {ds.score}/5
                                          </span>
                                        </div>
                                        {ds.reasoning && (
                                          <p style={styles.dimensionScoreReasoning}>{ds.reasoning}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* 6. Interdependency Checks (what AI actually found) */}
                                {questionDetail.check_results && questionDetail.check_results.length > 0 && (
                                  <div style={styles.interdependenciesSection}>
                                    <h5 style={styles.interdependenciesTitle}>
                                      Interdependency Checks ({questionDetail.check_results.length})
                                    </h5>
                                    {questionDetail.check_results.map((cr, idx) => {
                                      const isCurrentQuestion = cr.primary_question_code === questionDetail.question_code;
                                      const linkedCode = isCurrentQuestion ? cr.linked_question_code : cr.primary_question_code;
                                      const passedColor = cr.passed
                                        ? { bg: 'rgba(22, 163, 74, 0.1)', text: '#16A34A' }
                                        : { bg: 'rgba(220, 38, 38, 0.1)', text: '#DC2626' };

                                      return (
                                        <div key={cr.id || idx} style={styles.interdependencyItem}>
                                          <div style={styles.interdependencyHeader}>
                                            <span style={styles.interdependencyLinkedCode}>
                                              → {linkedCode}
                                            </span>
                                            <span style={styles.interdependencyType}>{cr.check_type}</span>
                                            <span style={{
                                              ...styles.checkResultBadge,
                                              background: passedColor.bg,
                                              color: passedColor.text,
                                            }}>
                                              {cr.passed ? '✓ Passed' : '⚠ Issue Found'}
                                            </span>
                                          </div>

                                          {/* What should be checked (expectation) */}
                                          <p style={styles.interdependencyDescription}>
                                            <strong>Check:</strong> {cr.interdependency_description}
                                          </p>

                                          {/* Scores compared */}
                                          {(cr.primary_score !== null || cr.linked_score !== null) && (
                                            <div style={styles.checkScoresRow}>
                                              <span style={styles.checkScoreItem}>
                                                {cr.primary_question_code}: {cr.primary_score?.toFixed(0) ?? 'N/A'}
                                              </span>
                                              <span style={styles.checkScoreArrow}>↔</span>
                                              <span style={styles.checkScoreItem}>
                                                {cr.linked_question_code}: {cr.linked_score?.toFixed(0) ?? 'N/A'}
                                              </span>
                                            </div>
                                          )}

                                          {/* AI's reasoning/finding */}
                                          <div style={styles.checkResultReasoning}>
                                            <strong style={{ color: '#1e293b' }}>AI Finding:</strong>
                                            <p style={{ margin: '4px 0 0 0', color: '#475569' }}>{cr.reasoning}</p>
                                          </div>

                                          {cr.flag_id && (
                                            <p style={styles.interdependencyImpact}>
                                              <strong>Flag Created:</strong> {cr.flag_id}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Fallback: Static interdependencies (if no check_results) */}
                                {(!questionDetail.check_results || questionDetail.check_results.length === 0) &&
                                 questionDetail.interdependencies && questionDetail.interdependencies.length > 0 && (
                                  <div style={styles.interdependenciesSection}>
                                    <h5 style={styles.interdependenciesTitle}>
                                      Interdependencies ({questionDetail.interdependencies.length})
                                    </h5>
                                    {questionDetail.interdependencies.map((dep, idx) => (
                                      <div key={idx} style={styles.interdependencyItem}>
                                        <div style={styles.interdependencyHeader}>
                                          <span style={styles.interdependencyLinkedCode}>
                                            → {dep.linked_question_code}
                                          </span>
                                          {dep.type && (
                                            <span style={styles.interdependencyType}>{dep.type}</span>
                                          )}
                                        </div>
                                        <p style={styles.interdependencyDescription}>{dep.description}</p>
                                        {dep.scoring_impact && (
                                          <p style={styles.interdependencyImpact}>
                                            <strong>Impact:</strong> {dep.scoring_impact}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* No detail available message */}
                            {isQuestionExpanded && !questionDetail && (
                              <div style={styles.questionDetailExpanded}>
                                <p style={styles.noDetailText}>Question scoring details not available.</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Related Flags */}
                {metricFlags.length > 0 && (
                  <div style={styles.metricFlagsSection}>
                    <h4 style={styles.metricFlagsSectionTitle}>
                      Related Flags ({metricFlags.length})
                    </h4>
                    {metricFlags.map((flag) => {
                      const severityColor = getSeverityColor(flag.severity);
                      return (
                        <div key={flag.id} style={styles.metricFlagItem}>
                          <div style={styles.metricFlagHeader}>
                            <span style={{
                              ...styles.metricFlagSeverity,
                              background: severityColor.bg,
                              color: severityColor.text
                            }}>
                              {flag.severity}
                            </span>
                            <span style={styles.metricFlagType}>
                              {flag.flag_type?.replace('_', ' ')}
                            </span>
                          </div>
                          <p style={styles.metricFlagTitle}>{flag.title}</p>
                          {flag.ai_explanation && (
                            <p style={styles.metricFlagExplanation}>{flag.ai_explanation}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No contributions message */}
                {contributions.length === 0 && (
                  <p style={styles.noContributionsText}>
                    No question breakdown available for this metric.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Dimension Details Side Panel */}
      {selectedDimension && (
        <>
          {/* Overlay */}
          <div
            style={styles.dimensionPanelOverlay}
            onClick={() => setSelectedDimension(null)}
          />
          {/* Panel */}
          <div style={styles.dimensionPanel}>
            <div style={styles.dimensionPanelHeader}>
              <h3 style={styles.dimensionPanelTitle}>{selectedDimension.dimension_name}</h3>
              <button
                onClick={() => setSelectedDimension(null)}
                style={styles.dimensionPanelClose}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={styles.dimensionPanelContent}>
              {/* Description */}
              <div style={styles.dimensionPanelSection}>
                <h4 style={styles.dimensionPanelSectionTitle}>What This Measures</h4>
                <p style={styles.dimensionPanelDescription}>
                  {selectedDimension.description || 'No description available.'}
                </p>
              </div>

              {/* Current Score */}
              <div style={styles.dimensionPanelSection}>
                <h4 style={styles.dimensionPanelSectionTitle}>Score Given</h4>
                <div style={styles.dimensionPanelScoreBadge}>
                  <span style={{
                    ...styles.dimensionPanelScoreValue,
                    color: getScoreColor((selectedDimension.score || 0) * 20)
                  }}>
                    {selectedDimension.score}/5
                  </span>
                  {selectedDimension.weight && (
                    <span style={styles.dimensionPanelWeight}>
                      Weight: {selectedDimension.weight}%
                    </span>
                  )}
                </div>
              </div>

              {/* Scoring Anchors */}
              {selectedDimension.anchors && selectedDimension.anchors.length > 0 && (
                <div style={styles.dimensionPanelSection}>
                  <h4 style={styles.dimensionPanelSectionTitle}>Scoring Scale</h4>
                  <div style={styles.dimensionAnchorsGrid}>
                    {selectedDimension.anchors.map((anchor) => (
                      <div
                        key={anchor.level}
                        style={{
                          ...styles.dimensionAnchorItem,
                          backgroundColor: anchor.level === selectedDimension.score
                            ? 'rgba(99, 102, 241, 0.1)'
                            : 'transparent',
                          borderColor: anchor.level === selectedDimension.score
                            ? 'rgba(99, 102, 241, 0.3)'
                            : 'rgba(0, 0, 0, 0.08)',
                        }}
                      >
                        <div style={styles.dimensionAnchorHeader}>
                          <span style={{
                            ...styles.dimensionAnchorLevel,
                            color: getScoreColor(anchor.level * 20)
                          }}>
                            Level {anchor.level}
                          </span>
                          <span style={styles.dimensionAnchorRange}>{anchor.score_range}</span>
                        </div>
                        <p style={styles.dimensionAnchorBehavior}>{anchor.behavior}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Reasoning */}
              {selectedDimension.reasoning && (
                <div style={styles.dimensionPanelSection}>
                  <h4 style={styles.dimensionPanelSectionTitle}>AI Reasoning</h4>
                  <p style={styles.dimensionPanelReasoning}>{selectedDimension.reasoning}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============ Metrics Tab (kept for future tab-based UI) ============
// @ts-ignore - Reserved for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _MetricsTab({ metrics }: { metrics: MetricScoreDetail[] }) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  if (metrics.length === 0) {
    return <p style={styles.emptyTabText}>No metrics calculated yet.</p>;
  }

  return (
    <div style={styles.metricsGrid}>
      {metrics.map((metric) => {
        const isExpanded = expandedMetric === metric.id;
        const scoreColor = getScoreColor(metric.overall_score || 0);

        return (
          <div key={metric.id} style={styles.metricCard}>
            <button
              onClick={() => setExpandedMetric(isExpanded ? null : metric.id)}
              style={styles.metricHeader}
            >
              <div style={styles.metricInfo}>
                <span style={styles.metricCode}>{metric.metric_code}</span>
                <span style={styles.metricName}>{metric.metric_name || metric.metric_id}</span>
              </div>
              <div style={styles.metricScoreContainer}>
                <div style={{ ...styles.metricScoreCircle, borderColor: scoreColor }}>
                  <span style={{ ...styles.metricScoreValue, color: scoreColor }}>
                    {Math.round(metric.overall_score || 0)}
                  </span>
                </div>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginLeft: '8px' }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div style={styles.metricDetail}>
                <div style={styles.metricBar}>
                  <div style={{ ...styles.metricBarFill, width: `${metric.overall_score || 0}%`, background: scoreColor }} />
                </div>

                {metric.interpretation && (
                  <p style={styles.metricInterpretation}>{metric.interpretation}</p>
                )}

                {metric.question_contributions && metric.question_contributions.length > 0 && (
                  <div style={styles.contributionsContainer}>
                    <h4 style={styles.contributionsTitle}>Question Contributions</h4>
                    <div style={styles.contributionsList}>
                      {metric.question_contributions.map((qc, i) => (
                        <div key={i} style={styles.contributionItem}>
                          <span style={styles.contributionCode}>{qc.question_code}</span>
                          <div style={styles.contributionBar}>
                            <div style={{ ...styles.contributionBarFill, width: `${qc.score || 0}%` }} />
                          </div>
                          <span style={styles.contributionScore}>{Math.round(qc.score || 0)}</span>
                          <span style={styles.contributionWeight}>×{qc.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============ Questions Tab ============

function QuestionsTab({ questions }: { questions: QuestionScoreDetail[] }) {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  if (questions.length === 0) {
    return <p style={styles.emptyTabText}>No questions scored yet.</p>;
  }

  // Extract question number from code (e.g., "S1" -> 1, "X3a" -> 3)
  const getQuestionNumber = (code: string): number => {
    const match = code.match(/\d+/);
    return match ? parseInt(match[0], 10) : 999;
  };

  // Sort questions by number
  const sortedQuestions = [...questions].sort((a, b) => {
    const numA = getQuestionNumber(a.question_code);
    const numB = getQuestionNumber(b.question_code);
    if (numA !== numB) return numA - numB;
    // If same number, sort alphabetically (e.g., X3a before X3b)
    return a.question_code.localeCompare(b.question_code);
  });

  return (
    <div style={styles.questionsGrid}>
      {sortedQuestions.map((q, index) => {
        const isExpanded = expandedQuestion === q.id;
        const scoreColor = getScoreColor(q.overall_score || 0);
        const questionNum = index + 1;
        const truncatedText = q.question_text
          ? (q.question_text.length > 60 ? q.question_text.slice(0, 60) + '...' : q.question_text)
          : '';

        return (
          <div key={q.id} style={styles.questionCard}>
            <button
              onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
              style={styles.questionHeader}
            >
              <div style={styles.questionInfoExpanded}>
                <div style={styles.questionCodeRow}>
                  <span style={styles.questionNumber}>#{questionNum}</span>
                  <span style={styles.questionCode}>{q.question_code}</span>
                  <span style={styles.questionConfidence}>{q.confidence}</span>
                  {q.requires_review && <span style={styles.reviewBadge}>Review</span>}
                </div>
                {truncatedText && (
                  <span style={styles.questionPreviewText}>{truncatedText}</span>
                )}
              </div>
              <div style={styles.questionScoreContainer}>
                <span style={{ ...styles.questionScore, color: scoreColor }}>
                  {Math.round(q.overall_score || 0)}
                </span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div style={styles.questionDetail}>
                {/* Full Question Text */}
                {q.question_text && (
                  <div style={styles.questionTextBox}>
                    <h5 style={styles.questionTextLabel}>Question</h5>
                    <p style={styles.questionText}>{q.question_text}</p>
                  </div>
                )}

                {/* User Response */}
                {q.raw_response && (
                  <div style={styles.userResponseBox}>
                    <h5 style={styles.userResponseLabel}>User Response</h5>
                    <p style={styles.userResponseText}>{q.raw_response}</p>
                  </div>
                )}

                {/* Response Quality */}
                <div style={styles.qualityRow}>
                  <span style={styles.qualityLabel}>Response Quality:</span>
                  <span style={styles.qualityValue}>{q.response_quality}</span>
                </div>

                {/* AI Reasoning */}
                {q.scoring_reasoning && (
                  <div style={styles.reasoningBox}>
                    <h5 style={styles.reasoningTitle}>AI Scoring Summary</h5>
                    <p style={styles.reasoningText}>{q.scoring_reasoning}</p>
                  </div>
                )}

                {/* Dimension Scores */}
                {q.dimension_scores && q.dimension_scores.length > 0 && (
                  <div style={styles.dimensionsContainer}>
                    <h5 style={styles.dimensionsTitle}>Dimension Scores</h5>
                    <div style={styles.dimensionsList}>
                      {q.dimension_scores.map((ds, i) => (
                        <div key={i} style={styles.dimensionItem}>
                          <div style={styles.dimensionHeader}>
                            <span style={styles.dimensionName}>{ds.dimension_name}</span>
                            <span style={{ ...styles.dimensionScore, color: getScoreColor((ds.score || 0) * 20) }}>
                              {ds.score}/5
                            </span>
                          </div>
                          <p style={styles.dimensionReasoning}>{ds.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============ Flags Tab ============

function FlagsTab({
  flags,
  onResolve,
}: {
  flags: EvaluationFlag[];
  onResolve: (flagId: string, resolution: string) => void;
}) {
  const [resolvingFlag, setResolvingFlag] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');

  if (!flags || flags.length === 0) {
    return (
      <div style={styles.noFlagsContainer}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="1.5">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p style={styles.noFlagsText}>No flags detected. Evaluation passed all checks.</p>
      </div>
    );
  }

  const unresolvedFlags = flags.filter(f => !f.is_resolved);
  const resolvedFlags = flags.filter(f => f.is_resolved);

  return (
    <div style={styles.flagsContainer}>
      {unresolvedFlags.length > 0 && (
        <div style={styles.flagsSection}>
          <h4 style={styles.flagsSectionTitle}>Open Flags ({unresolvedFlags.length})</h4>
          <div style={styles.flagsList}>
            {unresolvedFlags.map((flag) => {
              const severityColor = getSeverityColor(flag.severity);
              const isResolving = resolvingFlag === flag.id;

              return (
                <div key={flag.id} style={styles.flagCard}>
                  <div style={styles.flagHeader}>
                    <span style={{ ...styles.severityBadge, background: severityColor.bg, color: severityColor.text }}>
                      {flag.severity}
                    </span>
                    <span style={styles.flagType}>{flag.flag_type?.replace('_', ' ')}</span>
                  </div>
                  <h5 style={styles.flagTitle}>{flag.title}</h5>
                  {flag.description && <p style={styles.flagDescription}>{flag.description}</p>}

                  {flag.ai_explanation && (
                    <div style={styles.aiExplanation}>
                      <span style={styles.aiLabel}>AI Analysis:</span>
                      <p style={styles.aiText}>{flag.ai_explanation}</p>
                    </div>
                  )}

                  {isResolving ? (
                    <div style={styles.resolveForm}>
                      <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Enter resolution notes..."
                        style={styles.resolveTextarea}
                        rows={2}
                      />
                      <div style={styles.resolveActions}>
                        <button
                          onClick={() => {
                            setResolvingFlag(null);
                            setResolution('');
                          }}
                          style={styles.cancelButton}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onResolve(flag.id, resolution);
                            setResolvingFlag(null);
                            setResolution('');
                          }}
                          style={styles.confirmButton}
                          disabled={!resolution.trim()}
                        >
                          Resolve Flag
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResolvingFlag(flag.id)}
                      style={styles.resolveButton}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {resolvedFlags.length > 0 && (
        <div style={styles.flagsSection}>
          <h4 style={styles.flagsSectionTitle}>Resolved ({resolvedFlags.length})</h4>
          <div style={styles.flagsList}>
            {resolvedFlags.map((flag) => (
              <div key={flag.id} style={{ ...styles.flagCard, opacity: 0.7 }}>
                <div style={styles.flagHeader}>
                  <span style={styles.resolvedBadge}>Resolved</span>
                  <span style={styles.flagType}>{flag.flag_type?.replace('_', ' ')}</span>
                </div>
                <h5 style={styles.flagTitle}>{flag.title}</h5>
                <p style={styles.resolutionText}>
                  <strong>Resolution:</strong> {flag.resolution}
                </p>
                <span style={styles.resolvedBy}>
                  Resolved by {flag.resolved_by} on {formatDate(flag.resolved_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Trigger Evaluation Modal ============

function TriggerEvaluationModal({
  assessments,
  triggeringReview,
  onTrigger,
  onClose,
}: {
  assessments: BusinessReviewItem[];
  triggeringReview: string | null;
  onTrigger: (assessmentId: string) => void;
  onClose: () => void;
}) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Run New Evaluation</h2>
          <button onClick={onClose} style={styles.modalClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p style={styles.modalSubtitle}>
          Select an assessment to evaluate with AI-powered scoring.
        </p>

        {assessments.length === 0 ? (
          <p style={styles.noReviewsText}>
            No assessments available for evaluation.
          </p>
        ) : (
          <div style={styles.reviewsList}>
            {assessments.map((review) => (
              <div key={review.id} style={styles.reviewItem}>
                <div style={styles.reviewInfo}>
                  <span style={styles.reviewName}>{review.name}</span>
                  <span style={styles.reviewMeta}>
                    {review.stats.total_submitted} submitted
                  </span>
                </div>
                <button
                  onClick={() => onTrigger(review.id)}
                  disabled={triggeringReview === review.id}
                  style={{
                    ...styles.evaluateButton,
                    opacity: triggeringReview === review.id ? 0.6 : 1,
                  }}
                >
                  {triggeringReview === review.id ? 'Starting...' : 'Evaluate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Styles ============

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '32px 40px', maxWidth: '1200px' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: '16px' },
  spinner: { width: '32px', height: '32px', border: '2px solid rgba(0, 0, 0, 0.08)', borderTopColor: '#1D1D1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  smallSpinner: { width: '14px', height: '14px', border: '2px solid rgba(255, 255, 255, 0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { fontSize: '14px', color: 'rgba(60, 60, 67, 0.6)', margin: 0 },

  // Breadcrumb
  breadcrumb: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
  breadcrumbLink: { background: 'none', border: 'none', padding: '4px 8px', fontSize: '14px', color: '#6366F1', cursor: 'pointer', borderRadius: '4px' },
  breadcrumbActive: { background: 'none', border: 'none', padding: '4px 8px', fontSize: '14px', color: '#1D1D1F', fontWeight: 600, cursor: 'default' },
  breadcrumbSeparator: { color: 'rgba(60, 60, 67, 0.3)', fontSize: '14px' },

  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: 600, color: '#1D1D1F', margin: '0 0 4px 0', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '14px', color: 'rgba(60, 60, 67, 0.6)', margin: 0 },
  backButton: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', marginBottom: '12px', borderRadius: '8px', border: 'none', background: 'transparent', color: 'rgba(60, 60, 67, 0.8)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },

  primaryButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)', color: 'white', fontSize: '14px', fontWeight: 500, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' },

  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 40px', background: 'rgba(0, 0, 0, 0.02)', borderRadius: '16px', textAlign: 'center' },
  emptyIcon: { width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '20px', marginBottom: '20px', color: '#6366F1' },
  emptyTitle: { fontSize: '18px', fontWeight: 600, color: '#1D1D1F', margin: '0 0 8px 0' },
  emptyText: { fontSize: '14px', color: 'rgba(60, 60, 67, 0.6)', margin: '0 0 24px 0', maxWidth: '300px' },
  emptyButton: { padding: '12px 24px', borderRadius: '10px', border: 'none', background: '#6366F1', color: 'white', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },

  // Card Grid
  cardGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },

  // Business Card
  businessCard: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'white', borderRadius: '14px', border: '1px solid rgba(0, 0, 0, 0.06)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' },
  businessIcon: { width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: 700, flexShrink: 0 },
  businessInfo: { flex: 1 },
  businessName: { fontSize: '16px', fontWeight: 600, color: '#1D1D1F', margin: '0 0 4px 0' },
  businessMeta: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.6)', margin: 0 },
  lastEvaluated: { fontSize: '12px', color: 'rgba(60, 60, 67, 0.5)', marginRight: '8px' },
  chevron: { color: 'rgba(60, 60, 67, 0.3)', flexShrink: 0 },

  // Assessment Card
  assessmentCard: { display: 'flex', flexDirection: 'column', padding: '20px', background: 'white', borderRadius: '14px', border: '1px solid rgba(0, 0, 0, 0.06)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', position: 'relative' },
  assessmentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  assessmentName: { fontSize: '16px', fontWeight: 600, color: '#1D1D1F', margin: 0 },
  assessmentStats: { display: 'flex', gap: '8px', fontSize: '13px', color: 'rgba(60, 60, 67, 0.6)' },

  // Runs list
  runsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  runCard: { padding: '20px', background: 'white', borderRadius: '14px', border: '1px solid rgba(0, 0, 0, 0.06)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' },
  runHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  runInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  runNumber: { fontSize: '15px', fontWeight: 600, color: '#1D1D1F' },
  statusBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize' },
  runTime: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.5)' },
  runStats: { display: 'flex', gap: '32px', marginBottom: '12px' },
  runStat: { display: 'flex', flexDirection: 'column', gap: '2px' },
  runStatValue: { fontSize: '20px', fontWeight: 600, color: '#1D1D1F' },
  runStatLabel: { fontSize: '12px', color: 'rgba(60, 60, 67, 0.5)' },
  runMeta: { display: 'flex', gap: '16px' },
  runMetaText: { fontSize: '12px', color: 'rgba(60, 60, 67, 0.5)' },

  // Detail view
  detailHeader: { marginBottom: '32px' },
  detailTitle: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' },
  detailMeta: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.6)', margin: 0 },

  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' },
  summaryCard: { padding: '20px', background: 'white', borderRadius: '14px', border: '1px solid rgba(0, 0, 0, 0.06)', textAlign: 'center' },
  summaryValue: { fontSize: '28px', fontWeight: 700, color: '#1D1D1F', display: 'block', marginBottom: '4px' },
  summaryLabel: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.6)' },

  tabs: { display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid rgba(0, 0, 0, 0.06)', paddingBottom: '0' },
  tab: { padding: '12px 20px', borderRadius: '8px 8px 0 0', border: 'none', background: 'transparent', color: 'rgba(60, 60, 67, 0.6)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' },
  tabActive: { background: 'rgba(0, 0, 0, 0.04)', color: '#1D1D1F' },
  tabContent: { minHeight: '400px' },
  emptyTabText: { fontSize: '14px', color: 'rgba(60, 60, 67, 0.5)', textAlign: 'center', padding: '60px 0' },

  // Metrics tab
  metricsGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  metricCard: { background: 'white', borderRadius: '14px', border: '1px solid rgba(0, 0, 0, 0.06)', overflow: 'hidden' },
  metricHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' },
  metricInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  metricCode: { fontSize: '12px', fontWeight: 700, color: '#6366F1', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 10px', borderRadius: '6px' },
  metricName: { fontSize: '15px', fontWeight: 500, color: '#1D1D1F' },
  metricScoreContainer: { display: 'flex', alignItems: 'center' },
  metricScoreCircle: { width: '48px', height: '48px', borderRadius: '50%', border: '3px solid', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  metricScoreValue: { fontSize: '16px', fontWeight: 700 },
  metricDetail: { padding: '0 20px 20px', borderTop: '1px solid rgba(0, 0, 0, 0.06)' },
  metricBar: { height: '8px', background: 'rgba(0, 0, 0, 0.06)', borderRadius: '4px', marginTop: '16px', overflow: 'hidden' },
  metricBarFill: { height: '100%', borderRadius: '4px', transition: 'width 0.3s' },
  metricInterpretation: { fontSize: '14px', color: 'rgba(60, 60, 67, 0.8)', lineHeight: 1.6, margin: '16px 0 0 0' },
  contributionsContainer: { marginTop: '20px' },
  contributionsTitle: { fontSize: '13px', fontWeight: 600, color: '#1D1D1F', margin: '0 0 12px 0' },
  contributionsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  contributionItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  contributionCode: { fontSize: '12px', fontWeight: 600, color: '#6366F1', width: '40px' },
  contributionBar: { flex: 1, height: '6px', background: 'rgba(0, 0, 0, 0.06)', borderRadius: '3px', overflow: 'hidden' },
  contributionBarFill: { height: '100%', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: '3px' },
  contributionScore: { fontSize: '13px', fontWeight: 600, color: '#1D1D1F', width: '30px', textAlign: 'right' },
  contributionWeight: { fontSize: '11px', color: 'rgba(60, 60, 67, 0.5)', width: '40px' },

  // Questions tab (Institutional)
  questionsGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  questionCard: { background: '#FFFFFF', borderRadius: '6px', border: '1px solid #D0D7DE', overflow: 'hidden' },
  questionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' },
  questionInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  questionInfoExpanded: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 },
  questionCodeRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
  questionNumber: { fontSize: '12px', fontWeight: 600, color: '#57606A', background: '#F6F8FA', padding: '4px 8px', borderRadius: '4px', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },
  questionCode: { fontSize: '14px', fontWeight: 600, color: '#24292F', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },
  questionConfidence: { fontSize: '12px', color: '#8C959F', padding: '2px 8px', background: '#F6F8FA', borderRadius: '4px' },
  questionPreviewText: { fontSize: '13px', color: '#57606A', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' },
  reviewBadge: { fontSize: '11px', fontWeight: 600, color: '#9A6700', background: '#FFF8C5', padding: '2px 8px', borderRadius: '4px' },
  questionScoreContainer: { display: 'flex', alignItems: 'center', marginLeft: '16px', flexShrink: 0, gap: '8px' },
  questionScore: { fontSize: '18px', fontWeight: 600, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },
  questionDetail: { padding: '16px', borderTop: '1px solid #D8DEE4' },
  questionTextBox: { marginTop: '0', padding: '12px', background: '#F6F8FA', borderRadius: '6px', marginBottom: '16px' },
  questionTextLabel: { fontSize: '11px', fontWeight: 600, color: '#8C959F', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  questionText: { fontSize: '14px', color: '#24292F', lineHeight: 1.6, margin: 0 },
  userResponseBox: { padding: '12px', background: '#F6F8FA', borderRadius: '6px', marginBottom: '16px', borderLeft: '3px solid #0969DA' },
  userResponseLabel: { fontSize: '11px', fontWeight: 600, color: '#0969DA', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  userResponseText: { fontSize: '14px', color: '#57606A', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' },
  qualityRow: { display: 'flex', gap: '8px', marginBottom: '12px' },
  qualityLabel: { fontSize: '12px', color: '#8C959F' },
  qualityValue: { fontSize: '12px', fontWeight: 500, color: '#24292F' },
  reasoningBox: { padding: '12px', background: '#DDF4FF', borderRadius: '6px', marginBottom: '16px' },
  reasoningTitle: { fontSize: '11px', fontWeight: 600, color: '#0969DA', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  reasoningText: { fontSize: '13px', color: '#57606A', lineHeight: 1.6, margin: 0 },
  dimensionsContainer: { marginTop: '16px' },
  dimensionsTitle: { fontSize: '11px', fontWeight: 600, color: '#8C959F', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  dimensionsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  dimensionItem: { padding: '10px 12px', background: '#FFFFFF', borderRadius: '4px', border: '1px solid #D0D7DE' },
  dimensionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' },
  dimensionName: { fontSize: '14px', fontWeight: 500, color: '#24292F' },
  dimensionScore: { fontSize: '14px', fontWeight: 600, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },
  dimensionReasoning: { fontSize: '13px', color: '#57606A', lineHeight: 1.5, margin: 0 },

  // Flags tab (Institutional)
  noFlagsContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: '16px', textAlign: 'center' },
  noFlagsText: { fontSize: '14px', color: '#1A7F37', margin: 0 },
  flagsContainer: { display: 'flex', flexDirection: 'column', gap: '24px' },
  flagsSection: {},
  flagsSectionTitle: { fontSize: '11px', fontWeight: 600, color: '#8C959F', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  flagsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  flagCard: { padding: '16px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #D0D7DE', borderLeft: '3px solid #9A6700' },
  flagHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  severityBadge: { padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' },
  flagType: { fontSize: '12px', color: '#8C959F' },
  flagTitle: { fontSize: '16px', fontWeight: 600, color: '#24292F', margin: '0 0 8px 0' },
  flagDescription: { fontSize: '14px', color: '#57606A', lineHeight: 1.6, margin: '0 0 16px 0' },
  aiExplanation: { padding: '12px', background: '#F6F8FA', borderRadius: '6px', marginBottom: '16px' },
  aiLabel: { fontSize: '11px', fontWeight: 600, color: '#8C959F', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  aiText: { fontSize: '13px', color: '#57606A', lineHeight: 1.6, margin: 0 },
  resolveButton: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #D0D7DE', background: '#FFFFFF', color: '#24292F', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'background 0.15s' },
  resolveForm: { marginTop: '16px' },
  resolveTextarea: { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #D0D7DE', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', marginBottom: '12px', boxSizing: 'border-box' },
  resolveActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  cancelButton: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #D0D7DE', background: '#FFFFFF', color: '#57606A', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  confirmButton: { padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#1A7F37', color: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },
  resolvedBadge: { padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: '#DAFBE1', color: '#1A7F37' },
  resolutionText: { fontSize: '13px', color: '#57606A', margin: '8px 0' },
  resolvedBy: { fontSize: '12px', color: '#8C959F' },

  // Modal
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { width: '100%', maxWidth: '500px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  modalTitle: { fontSize: '18px', fontWeight: 600, color: '#1D1D1F', margin: 0 },
  modalClose: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(60, 60, 67, 0.6)' },
  modalSubtitle: { fontSize: '14px', color: 'rgba(60, 60, 67, 0.6)', margin: '0 0 20px 0' },
  noReviewsText: { fontSize: '14px', color: 'rgba(60, 60, 67, 0.5)', textAlign: 'center', padding: '40px 0' },
  reviewsList: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' },
  reviewItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(0, 0, 0, 0.02)', borderRadius: '10px' },
  reviewInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  reviewName: { fontSize: '14px', fontWeight: 500, color: '#1D1D1F' },
  reviewMeta: { fontSize: '12px', color: 'rgba(60, 60, 67, 0.5)' },
  evaluateButton: { padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#6366F1', color: 'white', fontSize: '13px', fontWeight: 500, cursor: 'pointer' },

  // ============ Run Summary View Styles ============
  executiveSummary: { padding: '28px', background: 'white', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)' },
  execScoreSection: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' },
  execScoreCircle: { width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  execScoreValue: { fontSize: '36px', fontWeight: 700, lineHeight: 1 },
  execScoreLabel: { fontSize: '11px', color: 'rgba(60, 60, 67, 0.6)', marginTop: '4px' },
  ragBadge: { padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 600 },
  execStatsRow: { display: 'flex', gap: '32px', flexWrap: 'wrap' },
  execStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px' },
  execStatValue: { fontSize: '24px', fontWeight: 700, color: '#1D1D1F' },
  execStatLabel: { fontSize: '12px', color: 'rgba(60, 60, 67, 0.6)', marginTop: '2px' },

  sectionHeader: { marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', fontWeight: 600, color: '#1D1D1F', margin: '0 0 4px 0' },
  sectionSubtitle: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.6)', margin: 0 },

  // Metrics Bar Chart
  metricsBarChart: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', marginBottom: '32px' },
  metricBarRow: { display: 'flex', alignItems: 'center', gap: '16px' },
  metricBarLabel: { width: '280px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' },
  metricBarCode: { fontSize: '11px', fontWeight: 700, color: '#6366F1', background: 'rgba(99, 102, 241, 0.1)', padding: '3px 8px', borderRadius: '4px', minWidth: '36px', textAlign: 'center' },
  metricBarName: { fontSize: '13px', color: '#1D1D1F', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  metricBarContainer: { flex: 1, height: '24px', background: 'rgba(0, 0, 0, 0.04)', borderRadius: '12px', overflow: 'hidden' },
  metricBarFillAgg: { height: '100%', borderRadius: '12px', transition: 'width 0.4s ease-out' },
  metricBarScore: { fontSize: '15px', fontWeight: 700, minWidth: '36px', textAlign: 'right' },

  // Flags Summary
  flagsSummaryList: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' },
  flagSummaryCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'white', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.06)' },
  flagSummaryTitle: { fontSize: '14px', color: '#1D1D1F', fontWeight: 500 },
  flagsMoreText: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.6)', marginTop: '8px' },

  // View Breakdown Button
  viewBreakdownSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(139, 92, 246, 0.04) 100%)', borderRadius: '16px', marginTop: '24px' },
  viewBreakdownButton: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', color: 'white', fontSize: '16px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)', transition: 'transform 0.2s, box-shadow 0.2s' },
  viewBreakdownHint: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.6)', marginTop: '12px', textAlign: 'center' },

  // ============ Interview Breakdown View Styles ============
  interviewList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  interviewCard: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'white', borderRadius: '14px', border: '1px solid rgba(0, 0, 0, 0.06)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' },
  interviewIcon: { width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px', fontWeight: 700, flexShrink: 0 },
  interviewInfo: { flex: 1 },
  interviewName: { fontSize: '15px', fontWeight: 600, color: '#1D1D1F', margin: '0 0 4px 0' },
  interviewMeta: { fontSize: '13px', color: 'rgba(60, 60, 67, 0.6)', margin: 0 },
  interviewFlagBadge: { marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', fontSize: '11px', fontWeight: 500 },
  interviewScoreSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '8px' },
  interviewScore: { fontSize: '22px', fontWeight: 700 },
  interviewScoreLabel: { fontSize: '11px', color: 'rgba(60, 60, 67, 0.5)' },

  // ============ Interview Detail View Styles ============
  scoreBadgeLarge: { fontSize: '18px', fontWeight: 700, marginLeft: '12px' },

  // ============ Expandable Metrics Tab Styles (Institutional) ============
  expandableMetricsList: { display: 'flex', flexDirection: 'column', gap: '0' },
  expandableMetricCard: { background: '#FFFFFF', borderLeft: '1px solid #D0D7DE', borderRight: '1px solid #D0D7DE', borderBottom: '1px solid #D0D7DE', overflow: 'hidden' },
  expandableMetricHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '12px 16px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' },
  expandableMetricLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1 },
  expandableMetricCode: { fontSize: '12px', fontWeight: 600, color: '#0969DA', background: '#DDF4FF', padding: '4px 8px', borderRadius: '4px', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },
  expandableMetricName: { fontSize: '14px', fontWeight: 500, color: '#24292F' },
  expandableMetricRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  expandableMetricBarContainer: { width: '100px', height: '4px', background: '#D8DEE4', borderRadius: '2px', overflow: 'hidden' },
  expandableMetricBarFill: { height: '100%', borderRadius: '2px', transition: 'width 0.3s' },
  expandableMetricScore: { fontSize: '16px', fontWeight: 600, minWidth: '32px', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },
  expandableMetricConfidence: { fontSize: '12px', color: '#8C959F', textTransform: 'capitalize', padding: '2px 8px', background: '#F6F8FA', borderRadius: '4px', minWidth: '50px', textAlign: 'center' },
  expandableMetricContent: { padding: '16px', borderTop: '1px solid #D8DEE4', background: '#F6F8FA' },

  // Contributions Section (Institutional)
  contributionsSection: { marginTop: '16px' },
  contributionsSectionTitle: { fontSize: '11px', fontWeight: 600, color: '#8C959F', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  contributionsTable: { border: '1px solid #D0D7DE', borderRadius: '6px', overflow: 'hidden' },
  contributionsTableHeader: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '8px 12px', background: '#F6F8FA', borderBottom: '1px solid #D0D7DE' },
  contributionsTableHeaderCell: { fontSize: '11px', fontWeight: 600, color: '#8C959F', textTransform: 'uppercase', letterSpacing: '0.5px' },
  contributionsTableHeaderCellRight: { fontSize: '11px', fontWeight: 600, color: '#8C959F', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' },
  contributionsTableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 12px', border: 'none', background: '#FFFFFF', cursor: 'pointer', width: '100%', textAlign: 'left', borderBottom: '1px solid #D8DEE4', transition: 'background 0.1s' },
  contributionsTableCell: { fontSize: '14px', color: '#24292F', fontWeight: 500, display: 'flex', alignItems: 'center', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },
  contributionsTableCellRight: { fontSize: '14px', color: '#24292F', textAlign: 'right', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },

  // Question Detail Expanded (Institutional)
  questionDetailExpanded: { padding: '16px', background: '#F6F8FA', borderBottom: '1px solid #D8DEE4' },
  questionDetailText: { fontSize: '14px', color: '#24292F', margin: '0 0 12px 0', lineHeight: 1.6 },
  questionDetailMeta: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' },
  questionDetailMetaItem: { fontSize: '12px', color: '#57606A' },
  questionDetailReviewBadge: { fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#FFF8C5', color: '#9A6700' },
  noDetailText: { fontSize: '13px', color: '#8C959F', fontStyle: 'italic' },

  // Dimension Scores (Institutional)
  dimensionScoresSection: { marginBottom: '16px' },
  dimensionScoresTitle: { fontSize: '11px', fontWeight: 600, color: '#8C959F', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  dimensionScoreItem: { marginBottom: '12px', paddingLeft: '12px', borderLeft: '3px solid #0969DA' },
  dimensionScoreHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
  dimensionScoreName: { fontSize: '14px', fontWeight: 500, color: '#24292F' },
  dimensionScoreValue: { fontSize: '14px', fontWeight: 600, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },
  dimensionScoreReasoning: { fontSize: '13px', color: '#57606A', margin: 0, lineHeight: 1.5 },
  dimensionScoreButton: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: '14px',
    fontWeight: 500,
    color: '#24292F',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'underline',
    textDecorationColor: '#0969DA',
    textUnderlineOffset: '2px',
  },

  // Dimension Panel (Side Drawer) - Institutional
  dimensionPanelOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(36, 41, 47, 0.5)',
    zIndex: 999,
  },
  dimensionPanel: {
    position: 'fixed' as const,
    top: 0,
    right: 0,
    width: '400px',
    maxWidth: '90vw',
    height: '100vh',
    backgroundColor: '#FFFFFF',
    borderLeft: '1px solid #D0D7DE',
    boxShadow: '-8px 0 24px rgba(140, 149, 159, 0.2)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column' as const,
    animation: 'slideInRight 0.2s ease-out',
  },
  dimensionPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #D0D7DE',
    flexShrink: 0,
  },
  dimensionPanelTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#24292F',
    margin: 0,
  },
  dimensionPanelClose: {
    background: 'transparent',
    border: '1px solid #D0D7DE',
    padding: '8px',
    cursor: 'pointer',
    borderRadius: '6px',
    color: '#57606A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  },
  dimensionPanelContent: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '24px',
  },
  dimensionPanelSection: {
    marginBottom: '24px',
  },
  dimensionPanelSectionTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#8C959F',
    margin: '0 0 10px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  dimensionPanelDescription: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#24292F',
    margin: 0,
  },
  dimensionPanelScoreBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dimensionPanelScoreValue: {
    fontSize: '32px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  dimensionPanelWeight: {
    fontSize: '13px',
    color: '#57606A',
    background: '#F6F8FA',
    padding: '4px 10px',
    borderRadius: '4px',
  },
  dimensionAnchorsGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  dimensionAnchorItem: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #D0D7DE',
    transition: 'background 0.15s ease, border-color 0.15s ease',
  },
  dimensionAnchorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  dimensionAnchorLevel: {
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  dimensionAnchorRange: {
    fontSize: '11px',
    color: '#8C959F',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  dimensionAnchorBehavior: {
    fontSize: '13px',
    lineHeight: 1.5,
    color: '#57606A',
    margin: 0,
  },
  dimensionPanelReasoning: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#57606A',
    margin: 0,
    padding: '12px',
    background: '#F6F8FA',
    borderRadius: '6px',
  },

  // AI Reasoning Section (Institutional)
  aiReasoningSection: { marginBottom: '16px', padding: '12px', background: '#DDF4FF', borderRadius: '6px', border: '1px solid #B6E3FF' },
  aiReasoningTitle: { fontSize: '11px', fontWeight: 600, color: '#0969DA', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  aiReasoningText: { fontSize: '14px', color: '#24292F', margin: 0, lineHeight: 1.6 },

  // Raw Response Section (Institutional)
  rawResponseSection: { padding: '12px', background: '#F6F8FA', borderRadius: '6px', marginBottom: '16px', borderLeft: '3px solid #0969DA' },
  rawResponseTitle: { fontSize: '11px', fontWeight: 600, color: '#0969DA', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  rawResponseText: { fontSize: '13px', color: '#57606A', margin: 0, lineHeight: 1.6, fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },

  // Metric Flags Section (Institutional)
  metricFlagsSection: { marginTop: '16px', padding: '12px', background: '#FFEBE9', borderRadius: '6px', border: '1px solid rgba(207, 34, 46, 0.2)' },
  metricFlagsSectionTitle: { fontSize: '11px', fontWeight: 600, color: '#CF222E', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  metricFlagItem: { marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(207, 34, 46, 0.15)' },
  metricFlagHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
  metricFlagSeverity: { fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' },
  metricFlagType: { fontSize: '12px', color: '#8C959F' },
  metricFlagTitle: { fontSize: '14px', fontWeight: 500, color: '#24292F', margin: '0 0 4px 0' },
  metricFlagExplanation: { fontSize: '13px', color: '#57606A', margin: 0, lineHeight: 1.5 },
  noContributionsText: { fontSize: '13px', color: '#8C959F', fontStyle: 'italic', margin: '16px 0' },

  // Interdependencies Section (Institutional)
  interdependenciesSection: { marginTop: '16px', padding: '12px', background: '#DDF4FF', borderRadius: '6px', border: '1px solid #B6E3FF' },
  interdependenciesTitle: { fontSize: '11px', fontWeight: 600, color: '#0969DA', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  interdependencyItem: { marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #B6E3FF' },
  interdependencyHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' },
  interdependencyLinkedCode: { fontSize: '14px', fontWeight: 600, color: '#0969DA', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },
  interdependencyType: { fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#B6E3FF', color: '#0550AE', textTransform: 'uppercase' },
  interdependencyDescription: { fontSize: '14px', color: '#24292F', margin: '0 0 8px 0', lineHeight: 1.5 },
  interdependencyImpact: { fontSize: '13px', color: '#57606A', margin: 0, padding: '10px 12px', background: '#FFFFFF', borderRadius: '6px', borderLeft: '3px solid #0969DA' },

  // Check Result Styles (Institutional)
  checkResultBadge: { fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', marginLeft: 'auto' },
  checkScoresRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '8px 12px', background: '#FFFFFF', borderRadius: '6px' },
  checkScoreItem: { fontSize: '14px', fontWeight: 500, color: '#24292F', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },
  checkScoreArrow: { fontSize: '14px', color: '#8C959F' },
  checkResultReasoning: { fontSize: '13px', color: '#57606A', lineHeight: 1.6, padding: '10px 12px', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #D0D7DE', marginTop: '8px' },
};

export default EvaluationsSection;
