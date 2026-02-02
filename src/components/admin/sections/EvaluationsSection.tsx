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

// Helper to sort metrics by CABAS order (strategic priority)
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

// Helper to sort metrics by numerical order (M1, M2, M3... M14)
function sortMetricsByNumber(metrics: MetricScoreDetail[]): MetricScoreDetail[] {
  return [...metrics].sort((a, b) => {
    const aNum = parseInt(a.metric_code?.replace(/\D/g, '') || '999', 10);
    const bNum = parseInt(b.metric_code?.replace(/\D/g, '') || '999', 10);
    return aNum - bNum;
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

  // Get aggregated metrics (deduplicated by metric_code) and sort by numerical order
  const aggregatedMetrics = getAggregatedMetrics(scores?.metric_scores || []);
  const sortedMetrics = sortMetricsByNumber(aggregatedMetrics);

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
  const [selectedDimension, setSelectedDimension] = useState<DimensionScoreDetail | null>(null);

  // Find the source
  const source = run.sources?.find(s => s.id === sourceId);
  const sourceName = source?.name || 'Interview';

  // Filter question scores for this interview
  const interviewQuestions = scores?.question_scores?.filter(q => q.source_id === sourceId) || [];

  // Get metrics for this specific interview (filtered by source_id)
  const interviewMetrics = getMetricsForInterview(scores?.metric_scores || [], sourceId);

  // Sort by numerical order (M1, M2, M3... M14)
  const sortedInterviewMetrics = sortMetricsByNumber(interviewMetrics);

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

  // Get top and bottom performers for horizontal bars
  const sortedByScore = [...sortedInterviewMetrics].sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));
  const topPerformers = sortedByScore.slice(0, 3);
  const bottomPerformers = sortedByScore.slice(-3).reverse();

  return (
    <div style={dashboardStyles.container}>
      {/* Premium Header */}
      <header style={dashboardStyles.header}>
        {/* Breadcrumb */}
        <nav style={dashboardStyles.breadcrumb}>
          <button onClick={onBack} style={dashboardStyles.breadcrumbLink}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" />
            </svg>
            Back to Evaluations
          </button>
          <span style={dashboardStyles.breadcrumbSep}>/</span>
          <span style={dashboardStyles.breadcrumbText}>Run #{run.run_number}</span>
          <span style={dashboardStyles.breadcrumbSep}>/</span>
          <span style={dashboardStyles.breadcrumbCurrent}>{formattedId}</span>
        </nav>

        {/* Title Row */}
        <div style={dashboardStyles.titleRow}>
          <div style={dashboardStyles.titleLeft}>
            <div style={dashboardStyles.idBadge}>
              <span style={dashboardStyles.idBadgeIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </span>
              <div>
                <h1 style={dashboardStyles.idTitle}>{formattedId}</h1>
                <p style={dashboardStyles.idSubtitle}>
                  {sourceName} • {source?.source_type || 'Interview'} • {formatDate(run.started_at)}
                </p>
              </div>
            </div>
          </div>
          <div style={dashboardStyles.titleRight}>
            <div style={dashboardStyles.confidenceBadge}>
              <span style={dashboardStyles.confidenceLabel}>Confidence</span>
              <span style={dashboardStyles.confidenceValue}>{confidence}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Dashboard */}
      <div style={dashboardStyles.summarySection}>
        {/* Left: Overall Score Card */}
        <div style={dashboardStyles.scoreCard}>
          <div style={dashboardStyles.scoreCardHeader}>
            <span style={dashboardStyles.scoreCardLabel}>Overall Score</span>
            <span style={{
              ...dashboardStyles.ragBadge,
              backgroundColor: ragStatus.bg,
              color: ragStatus.color,
            }}>
              {ragStatus.status.toUpperCase()}
            </span>
          </div>
          <div style={dashboardStyles.scoreCardMain}>
            <span style={{ ...dashboardStyles.scoreNumber, color: ragStatus.color }}>
              {avgScore}
            </span>
            <span style={dashboardStyles.scoreOutOf}>/100</span>
          </div>
          <div style={dashboardStyles.scoreBarContainer}>
            <div style={dashboardStyles.scoreBarBg}>
              <div style={{
                ...dashboardStyles.scoreBarFill,
                width: `${avgScore}%`,
                backgroundColor: ragStatus.color,
              }} />
            </div>
          </div>
          {/* Quick Stats */}
          <div style={dashboardStyles.quickStats}>
            <div style={dashboardStyles.quickStat}>
              <span style={dashboardStyles.quickStatValue}>{interviewQuestions.length}</span>
              <span style={dashboardStyles.quickStatLabel}>Questions</span>
            </div>
            <div style={dashboardStyles.quickStatDivider} />
            <div style={dashboardStyles.quickStat}>
              <span style={dashboardStyles.quickStatValue}>{sortedInterviewMetrics.length}</span>
              <span style={dashboardStyles.quickStatLabel}>Metrics</span>
            </div>
            <div style={dashboardStyles.quickStatDivider} />
            <div style={dashboardStyles.quickStat}>
              <span style={{
                ...dashboardStyles.quickStatValue,
                color: totalFlags.length > 0 ? '#CF222E' : '#1A7F37',
              }}>
                {totalFlags.length}
              </span>
              <span style={dashboardStyles.quickStatLabel}>Flags</span>
            </div>
          </div>
        </div>

        {/* Right: Performance Overview */}
        <div style={dashboardStyles.performanceCard}>
          {/* Metric Distribution Strip (Option C) */}
          <div style={dashboardStyles.metricStripSection}>
            <div style={dashboardStyles.sectionHeader}>
              <span style={dashboardStyles.sectionTitle}>Metric Distribution</span>
              <span style={dashboardStyles.sectionSubtitle}>{sortedInterviewMetrics.length} metrics evaluated</span>
            </div>
            <div style={dashboardStyles.metricStrip}>
              {sortedInterviewMetrics.map((metric, idx) => {
                const score = metric.overall_score || 0;
                const color = getScoreColor(score);
                const metricDef = METRIC_ORDER.find(m => m.code === metric.metric_code);
                return (
                  <div
                    key={metric.id || idx}
                    style={{
                      ...dashboardStyles.metricBlock,
                      backgroundColor: color,
                    }}
                    title={`${metricDef?.clientName || metric.metric_code}: ${Math.round(score)}`}
                  >
                    <span style={dashboardStyles.metricBlockCode}>{metric.metric_code}</span>
                  </div>
                );
              })}
            </div>
            <div style={dashboardStyles.metricLegend}>
              <span style={dashboardStyles.legendItem}>
                <span style={{ ...dashboardStyles.legendDot, backgroundColor: '#1A7F37' }} />
                80+ Excellent
              </span>
              <span style={dashboardStyles.legendItem}>
                <span style={{ ...dashboardStyles.legendDot, backgroundColor: '#0969DA' }} />
                70-79 Good
              </span>
              <span style={dashboardStyles.legendItem}>
                <span style={{ ...dashboardStyles.legendDot, backgroundColor: '#9A6700' }} />
                60-69 Moderate
              </span>
              <span style={dashboardStyles.legendItem}>
                <span style={{ ...dashboardStyles.legendDot, backgroundColor: '#CF222E' }} />
                &lt;60 Attention
              </span>
            </div>
          </div>

          {/* Top & Bottom Performers (Option B) */}
          <div style={dashboardStyles.performersSection}>
            {/* Top Performers */}
            <div style={dashboardStyles.performerColumn}>
              <span style={dashboardStyles.performerTitle}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="#1A7F37">
                  <path d="M4.53 4.75A.75.75 0 015.28 4h5.44a.75.75 0 01.75.75v5.44a.75.75 0 01-1.5 0V6.31L5.03 11.25a.75.75 0 01-1.06-1.06l4.94-4.94H5.28a.75.75 0 01-.75-.75z" />
                </svg>
                Top Performers
              </span>
              {topPerformers.map((metric, idx) => {
                const score = metric.overall_score || 0;
                const metricDef = METRIC_ORDER.find(m => m.code === metric.metric_code);
                return (
                  <div key={idx} style={dashboardStyles.performerBar}>
                    <div style={dashboardStyles.performerInfo}>
                      <span style={dashboardStyles.performerCode}>{metric.metric_code}</span>
                      <span style={dashboardStyles.performerName}>{metricDef?.clientName || metric.metric_name}</span>
                    </div>
                    <div style={dashboardStyles.performerBarContainer}>
                      <div style={{
                        ...dashboardStyles.performerBarFill,
                        width: `${score}%`,
                        backgroundColor: getScoreColor(score),
                      }} />
                    </div>
                    <span style={{ ...dashboardStyles.performerScore, color: getScoreColor(score) }}>
                      {Math.round(score)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Performers */}
            <div style={dashboardStyles.performerColumn}>
              <span style={dashboardStyles.performerTitle}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="#CF222E">
                  <path d="M11.47 11.25a.75.75 0 01-.75.75H5.28a.75.75 0 01-.75-.75V5.81a.75.75 0 011.5 0v3.63l4.94-4.94a.75.75 0 011.06 1.06L7.09 10.5h3.63a.75.75 0 01.75.75z" />
                </svg>
                Needs Attention
              </span>
              {bottomPerformers.map((metric, idx) => {
                const score = metric.overall_score || 0;
                const metricDef = METRIC_ORDER.find(m => m.code === metric.metric_code);
                return (
                  <div key={idx} style={dashboardStyles.performerBar}>
                    <div style={dashboardStyles.performerInfo}>
                      <span style={dashboardStyles.performerCode}>{metric.metric_code}</span>
                      <span style={dashboardStyles.performerName}>{metricDef?.clientName || metric.metric_name}</span>
                    </div>
                    <div style={dashboardStyles.performerBarContainer}>
                      <div style={{
                        ...dashboardStyles.performerBarFill,
                        width: `${score}%`,
                        backgroundColor: getScoreColor(score),
                      }} />
                    </div>
                    <span style={{ ...dashboardStyles.performerScore, color: getScoreColor(score) }}>
                      {Math.round(score)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={dashboardStyles.tabNav}>
        <div style={dashboardStyles.tabNavInner}>
          {([
            { id: 'metrics' as const, label: 'All Metrics', count: sortedInterviewMetrics.length, icon: 'M16 4v12H0V4a2 2 0 012-2h12a2 2 0 012 2zM4.5 6.5a.5.5 0 00-.5.5v6a.5.5 0 001 0V7a.5.5 0 00-.5-.5zm4 0a.5.5 0 00-.5.5v6a.5.5 0 001 0V7a.5.5 0 00-.5-.5zm4 0a.5.5 0 00-.5.5v6a.5.5 0 001 0V7a.5.5 0 00-.5-.5z' },
            { id: 'questions' as const, label: 'Questions', count: interviewQuestions.length, icon: 'M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM8 5a.75.75 0 00-.75.75v2.5a.75.75 0 001.5 0v-2.5A.75.75 0 008 5zm1 6a1 1 0 11-2 0 1 1 0 012 0z' },
            { id: 'flags' as const, label: 'Flags', count: totalFlags.length, alert: totalFlags.length > 0, icon: 'M3.5 3.75a.25.25 0 01.25-.25h8.5a.25.25 0 01.25.25v8.5a.25.25 0 01-.25.25h-8.5a.25.25 0 01-.25-.25v-8.5zM3.75 2A1.75 1.75 0 002 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 12.25v-8.5A1.75 1.75 0 0012.25 2h-8.5z' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...dashboardStyles.tab,
                ...(activeTab === tab.id ? dashboardStyles.tabActive : {}),
              }}
            >
              {tab.label}
              <span style={{
                ...dashboardStyles.tabCount,
                ...(activeTab === tab.id ? dashboardStyles.tabCountActive : {}),
                ...(tab.alert && activeTab !== tab.id ? dashboardStyles.tabCountAlert : {}),
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <div style={dashboardStyles.tabContent}>
        {activeTab === 'metrics' && (
          <InterviewMetricsTab
            metrics={sortedInterviewMetrics}
            questionScores={interviewQuestions}
            flags={interviewFlags}
            onSelectDimension={setSelectedDimension}
          />
        )}
        {activeTab === 'questions' && (
          <QuestionsTab
            questions={interviewQuestions}
            onSelectDimension={setSelectedDimension}
          />
        )}
        {activeTab === 'flags' && (
          <FlagsTab flags={interviewFlags} onResolve={onResolveFlag} />
        )}
      </div>

      {/* Dimension Details Side Panel (shared by Metrics and Questions tabs) */}
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
              {/* 1. What This Measures (Description) */}
              <div style={styles.dimensionPanelSection}>
                <h4 style={styles.dimensionPanelSectionTitle}>What This Measures</h4>
                <p style={styles.dimensionPanelDescription}>
                  {selectedDimension.description || 'No description available.'}
                </p>
              </div>

              {/* 2. Score with pips */}
              <div style={styles.dimensionPanelSection}>
                <h4 style={styles.dimensionPanelSectionTitle}>Score</h4>
                <div style={styles.dimensionPanelScoreBadge}>
                  <span style={{
                    ...styles.dimensionPanelScoreValue,
                    color: getScoreColor((selectedDimension.score || 0) * 20)
                  }}>
                    {selectedDimension.score}
                  </span>
                  <span style={{ fontSize: '16px', color: '#8C959F', fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' }}>/5</span>
                  {/* Pips */}
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '16px' }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <div
                        key={n}
                        style={{
                          width: '24px',
                          height: '6px',
                          borderRadius: '3px',
                          backgroundColor: n <= (selectedDimension.score || 0)
                            ? getScoreColor((selectedDimension.score || 0) * 20)
                            : '#D8DEE4',
                        }}
                      />
                    ))}
                  </div>
                </div>
                {selectedDimension.weight && (
                  <span style={{ ...styles.dimensionPanelWeight, marginTop: '8px', display: 'inline-block' }}>
                    Weight: {selectedDimension.weight}%
                  </span>
                )}
              </div>

              {/* 3. AI Reasoning */}
              {selectedDimension.reasoning && (
                <div style={styles.dimensionPanelSection}>
                  <h4 style={styles.dimensionPanelSectionTitle}>AI Reasoning</h4>
                  <p style={styles.dimensionPanelReasoning}>{selectedDimension.reasoning}</p>
                </div>
              )}

              {/* 4. Scoring Scale (Anchors) */}
              {selectedDimension.anchors && selectedDimension.anchors.length > 0 && (
                <div style={styles.dimensionPanelSection}>
                  <h4 style={styles.dimensionPanelSectionTitle}>Scoring Scale</h4>
                  <div style={styles.dimensionAnchorsGrid}>
                    {selectedDimension.anchors.map((anchor) => {
                      const isCurrentLevel = anchor.level === selectedDimension.score;
                      const levelColor = getScoreColor(anchor.level * 20);
                      return (
                        <div
                          key={anchor.level}
                          style={{
                            ...styles.dimensionAnchorItem,
                            backgroundColor: isCurrentLevel ? `${levelColor}10` : 'transparent',
                            borderColor: isCurrentLevel ? levelColor : '#D0D7DE',
                          }}
                        >
                          <div style={styles.dimensionAnchorHeader}>
                            <span style={{
                              ...styles.dimensionAnchorLevel,
                              color: levelColor
                            }}>
                              {anchor.level}
                            </span>
                            <span style={styles.dimensionAnchorRange}>{anchor.score_range}</span>
                            {isCurrentLevel && (
                              <span style={{
                                marginLeft: 'auto',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: levelColor,
                                backgroundColor: `${levelColor}15`,
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}>
                                Current
                              </span>
                            )}
                          </div>
                          <p style={styles.dimensionAnchorBehavior}>{anchor.behavior}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Premium Dashboard Styles
const dashboardStyles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#F6F8FA',
    minHeight: '100vh',
  },
  // Header
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #D0D7DE',
    padding: '16px 24px 20px',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  breadcrumbLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#0969DA',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  breadcrumbSep: {
    color: '#8C959F',
    fontSize: '13px',
  },
  breadcrumbText: {
    fontSize: '13px',
    color: '#57606A',
  },
  breadcrumbCurrent: {
    fontSize: '13px',
    color: '#24292F',
    fontWeight: 600,
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  idBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  idBadgeIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: '#F6F8FA',
    border: '1px solid #D0D7DE',
    color: '#57606A',
  },
  idTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#24292F',
    margin: 0,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  idSubtitle: {
    fontSize: '13px',
    color: '#57606A',
    margin: '2px 0 0 0',
  },
  titleRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  confidenceBadge: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '2px',
  },
  confidenceLabel: {
    fontSize: '11px',
    color: '#8C959F',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  confidenceValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#24292F',
  },
  // Summary Section
  summarySection: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '20px',
    padding: '20px 24px',
  },
  // Score Card
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #D0D7DE',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  scoreCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  scoreCardLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#57606A',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  ragBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '4px',
    letterSpacing: '0.3px',
  },
  scoreCardMain: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    marginBottom: '12px',
  },
  scoreNumber: {
    fontSize: '56px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    lineHeight: 1,
  },
  scoreOutOf: {
    fontSize: '20px',
    color: '#8C959F',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  scoreBarContainer: {
    marginBottom: '20px',
  },
  scoreBarBg: {
    height: '8px',
    backgroundColor: '#E5E7EB',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  quickStats: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '16px 0 0',
    borderTop: '1px solid #E5E7EB',
  },
  quickStat: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  quickStatValue: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#24292F',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  quickStatLabel: {
    fontSize: '11px',
    color: '#8C959F',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  quickStatDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: '#E5E7EB',
  },
  // Performance Card
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #D0D7DE',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  // Metric Strip
  metricStripSection: {
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid #E5E7EB',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#24292F',
  },
  sectionSubtitle: {
    fontSize: '12px',
    color: '#8C959F',
  },
  metricStrip: {
    display: 'flex',
    gap: '4px',
    marginBottom: '12px',
  },
  metricBlock: {
    flex: 1,
    height: '32px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'default',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  metricBlockCode: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#FFFFFF',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
  },
  metricLegend: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#57606A',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '2px',
  },
  // Performers
  performersSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  performerColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  performerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#57606A',
    marginBottom: '4px',
  },
  performerBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  performerInfo: {
    width: '140px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  performerCode: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#24292F',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  performerName: {
    fontSize: '12px',
    color: '#57606A',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  performerBarContainer: {
    flex: 1,
    height: '6px',
    backgroundColor: '#E5E7EB',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  performerBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  performerScore: {
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    width: '32px',
    textAlign: 'right' as const,
  },
  // Tab Navigation
  tabNav: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #D0D7DE',
    padding: '0 24px',
  },
  tabNavInner: {
    display: 'flex',
    gap: '0',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#57606A',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
    marginBottom: '-1px',
  },
  tabActive: {
    color: '#24292F',
    borderBottomColor: '#0969DA',
  },
  tabCount: {
    fontSize: '12px',
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: '#E5E7EB',
    color: '#57606A',
  },
  tabCountActive: {
    backgroundColor: 'rgba(9, 105, 218, 0.1)',
    color: '#0969DA',
  },
  tabCountAlert: {
    backgroundColor: 'rgba(207, 34, 46, 0.1)',
    color: '#CF222E',
  },
  // Tab Content
  tabContent: {
    padding: '20px 24px',
  },
};

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

// Premium Minimalist Styles for Question Detail Expansion
// Inspired by Apple HIG, Material Design 3, Stripe, and Notion
const premiumStyles: Record<string, React.CSSProperties> = {
  // Container - stronger contrast with white cards
  expandedContainer: {
    padding: '20px',
    backgroundColor: '#F0F2F5',
    borderBottom: '1px solid #D0D7DE',
  },

  // Question text block
  questionBlock: {
    marginBottom: '16px',
  },
  questionText: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#24292F',
    lineHeight: 1.6,
    margin: 0,
  },

  // Response block - white card with subtle shadow for contrast
  responseBlock: {
    padding: '16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  responseText: {
    fontSize: '14px',
    color: '#57606A',
    lineHeight: 1.7,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },

  // Metadata row - inline pills
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '16px',
  },
  metaPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #D8DEE4',
    fontSize: '12px',
  },
  metaPillLabel: {
    color: '#8C959F',
    fontWeight: 400,
  },
  metaPillValue: {
    color: '#24292F',
    fontWeight: 500,
  },
  reviewPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    backgroundColor: '#FFF8C5',
    color: '#9A6700',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: 500,
  },

  // AI Reasoning block - white card with shadow
  reasoningBlock: {
    padding: '14px 16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  reasoningHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  reasoningLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#8C959F',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  reasoningText: {
    fontSize: '14px',
    color: '#57606A',
    lineHeight: 1.6,
    margin: 0,
  },

  // Section label - consistent
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#8C959F',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
    marginBottom: '12px',
  },

  // Dimensions block - horizontal rows with pips
  dimensionsBlock: {
    marginBottom: '16px',
  },
  dimensionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  dimensionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '10px 14px',
    backgroundColor: '#FFFFFF',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    transition: 'box-shadow 0.15s',
  },
  dimensionName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#24292F',
  },
  dimensionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dimensionPips: {
    display: 'flex',
    gap: '3px',
  },
  pip: {
    width: '8px',
    height: '8px',
    borderRadius: '2px',
    backgroundColor: '#D8DEE4',
  },
  pipFilled: {
    // Color set dynamically
  },
  dimensionScore: {
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    color: '#57606A',
    minWidth: '28px',
    textAlign: 'right' as const,
  },

  // Checks block
  checksBlock: {
    marginBottom: '0',
  },
  checkCount: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '18px',
    height: '18px',
    padding: '0 6px',
    backgroundColor: '#E5E7EB',
    borderRadius: '9px',
    fontSize: '11px',
    fontWeight: 500,
    color: '#57606A',
  },
  checksList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  checkCard: {
    padding: '12px 14px',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  },
  checkHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  checkCodes: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  checkCodePrimary: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#24292F',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  checkCodeLinked: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0969DA',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  checkStatus: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
  },
  checkType: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#8C959F',
    padding: '2px 8px',
    backgroundColor: '#F6F8FA',
    borderRadius: '4px',
    marginBottom: '8px',
    display: 'inline-block',
  },
  checkDescription: {
    fontSize: '13px',
    color: '#57606A',
    lineHeight: 1.5,
    margin: '0 0 10px 0',
  },
  checkScores: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
  },
  checkScoreChip: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#57606A',
    padding: '4px 10px',
    backgroundColor: '#F6F8FA',
    borderRadius: '4px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  checkReasoning: {
    fontSize: '13px',
    color: '#57606A',
    lineHeight: 1.5,
    margin: 0,
    fontStyle: 'italic' as const,
  },
  checkFlag: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 500,
    color: '#9A6700',
    padding: '2px 8px',
    backgroundColor: '#FFF8C5',
    borderRadius: '4px',
    marginTop: '8px',
  },
};

// ============ Interview Metrics Tab (Expandable) ============

function InterviewMetricsTab({
  metrics,
  questionScores,
  flags,
  onSelectDimension,
}: {
  metrics: MetricScoreDetail[];
  questionScores: QuestionScoreDetail[];
  flags: EvaluationFlag[];
  onSelectDimension?: (dimension: DimensionScoreDetail) => void;
}) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

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

                            {/* Question Detail (expanded) - Premium Minimalist Design */}
                            {isQuestionExpanded && questionDetail && (
                              <div style={premiumStyles.expandedContainer}>
                                {/* Question Text - Clean typography */}
                                {questionDetail.question_text && (
                                  <div style={premiumStyles.questionBlock}>
                                    <p style={premiumStyles.questionText}>{questionDetail.question_text}</p>
                                  </div>
                                )}

                                {/* User Response - Prominent but clean */}
                                {questionDetail.raw_response && (
                                  <div style={premiumStyles.responseBlock}>
                                    <p style={premiumStyles.responseText}>{questionDetail.raw_response}</p>
                                  </div>
                                )}

                                {/* Inline Metadata Pills */}
                                <div style={premiumStyles.metaRow}>
                                  <span style={premiumStyles.metaPill}>
                                    <span style={premiumStyles.metaPillLabel}>Quality</span>
                                    <span style={premiumStyles.metaPillValue}>{questionDetail.response_quality}</span>
                                  </span>
                                  <span style={premiumStyles.metaPill}>
                                    <span style={premiumStyles.metaPillLabel}>Confidence</span>
                                    <span style={premiumStyles.metaPillValue}>{questionDetail.confidence}</span>
                                  </span>
                                  {questionDetail.requires_review && (
                                    <span style={premiumStyles.reviewPill}>Review needed</span>
                                  )}
                                </div>

                                {/* AI Reasoning - Subtle card */}
                                {questionDetail.scoring_reasoning && (
                                  <div style={premiumStyles.reasoningBlock}>
                                    <div style={premiumStyles.reasoningHeader}>
                                      <svg width="16" height="16" viewBox="0 0 16 16" fill="#8C959F">
                                        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM6.5 7.75A.75.75 0 0 0 5 7.75v0c0 1.64.425 2.786 1.025 3.56.577.745 1.29 1.19 1.975 1.19s1.398-.445 1.975-1.19c.6-.774 1.025-1.92 1.025-3.56a.75.75 0 0 0-1.5 0c0 1.36-.35 2.214-.775 2.762-.402.52-.775.688-1.225.688s-.823-.168-1.225-.688C6.85 9.964 6.5 9.11 6.5 7.75Zm1-3a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"/>
                                      </svg>
                                      <span style={premiumStyles.reasoningLabel}>AI Analysis</span>
                                    </div>
                                    <p style={premiumStyles.reasoningText}>{questionDetail.scoring_reasoning}</p>
                                  </div>
                                )}

                                {/* Dimension Scores - Horizontal rows with pips */}
                                {questionDetail.dimension_scores && questionDetail.dimension_scores.length > 0 && (
                                  <div style={premiumStyles.dimensionsBlock}>
                                    <span style={premiumStyles.sectionLabel}>Dimensions</span>
                                    <div style={premiumStyles.dimensionsList}>
                                      {questionDetail.dimension_scores.map((ds, idx) => {
                                        const dimScoreColor = getScoreColor((ds.score || 0) * 20);
                                        return (
                                          <button
                                            key={idx}
                                            onClick={() => onSelectDimension?.(ds)}
                                            style={premiumStyles.dimensionRow}
                                          >
                                            <span style={premiumStyles.dimensionName}>{ds.dimension_name}</span>
                                            <div style={premiumStyles.dimensionRight}>
                                              {/* Pips visualization */}
                                              <div style={premiumStyles.dimensionPips}>
                                                {[1, 2, 3, 4, 5].map(n => (
                                                  <div
                                                    key={n}
                                                    style={{
                                                      ...premiumStyles.pip,
                                                      backgroundColor: n <= (ds.score || 0)
                                                        ? dimScoreColor
                                                        : '#D8DEE4',
                                                    }}
                                                  />
                                                ))}
                                              </div>
                                              <span style={premiumStyles.dimensionScore}>{ds.score}/5</span>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Interdependency Checks - Premium minimal */}
                                {questionDetail.check_results && questionDetail.check_results.length > 0 && (
                                  <div style={premiumStyles.checksBlock}>
                                    <span style={premiumStyles.sectionLabel}>
                                      Interdependency Checks
                                      <span style={premiumStyles.checkCount}>{questionDetail.check_results.length}</span>
                                    </span>
                                    <div style={premiumStyles.checksList}>
                                      {questionDetail.check_results.map((cr, idx) => {
                                        const isCurrentQuestion = cr.primary_question_code === questionDetail.question_code;
                                        const linkedCode = isCurrentQuestion ? cr.linked_question_code : cr.primary_question_code;
                                        const passed = cr.passed;

                                        return (
                                          <div key={cr.id || idx} style={premiumStyles.checkCard}>
                                            {/* Check header */}
                                            <div style={premiumStyles.checkHeader}>
                                              <div style={premiumStyles.checkCodes}>
                                                <span style={premiumStyles.checkCodePrimary}>{questionDetail.question_code}</span>
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="#8C959F">
                                                  <path d="M4 2.5L7.5 6 4 9.5" stroke="#8C959F" strokeWidth="1.5" fill="none"/>
                                                </svg>
                                                <span style={premiumStyles.checkCodeLinked}>{linkedCode}</span>
                                              </div>
                                              <span style={{
                                                ...premiumStyles.checkStatus,
                                                backgroundColor: passed ? '#DAFBE1' : '#FFEBE9',
                                                color: passed ? '#1A7F37' : '#CF222E',
                                              }}>
                                                {passed ? 'Passed' : 'Issue'}
                                              </span>
                                            </div>

                                            {/* Check type badge */}
                                            <span style={premiumStyles.checkType}>{cr.check_type}</span>

                                            {/* Description */}
                                            <p style={premiumStyles.checkDescription}>{cr.interdependency_description}</p>

                                            {/* Score comparison - inline */}
                                            {(cr.primary_score !== null || cr.linked_score !== null) && (
                                              <div style={premiumStyles.checkScores}>
                                                <span style={premiumStyles.checkScoreChip}>
                                                  {cr.primary_question_code}
                                                  <strong style={{ marginLeft: '4px', color: getScoreColor(cr.primary_score || 0) }}>
                                                    {cr.primary_score?.toFixed(0) ?? '—'}
                                                  </strong>
                                                </span>
                                                <span style={premiumStyles.checkScoreChip}>
                                                  {cr.linked_question_code}
                                                  <strong style={{ marginLeft: '4px', color: getScoreColor(cr.linked_score || 0) }}>
                                                    {cr.linked_score?.toFixed(0) ?? '—'}
                                                  </strong>
                                                </span>
                                              </div>
                                            )}

                                            {/* AI reasoning */}
                                            {cr.reasoning && (
                                              <p style={premiumStyles.checkReasoning}>{cr.reasoning}</p>
                                            )}

                                            {cr.flag_id && (
                                              <span style={premiumStyles.checkFlag}>Flag: {cr.flag_id}</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Fallback: Static interdependencies (if no check_results) */}
                                {(!questionDetail.check_results || questionDetail.check_results.length === 0) &&
                                 questionDetail.interdependencies && questionDetail.interdependencies.length > 0 && (
                                  <div style={premiumStyles.checksBlock}>
                                    <span style={premiumStyles.sectionLabel}>
                                      Interdependencies
                                      <span style={premiumStyles.checkCount}>{questionDetail.interdependencies.length}</span>
                                    </span>
                                    <div style={premiumStyles.checksList}>
                                      {questionDetail.interdependencies.map((dep, idx) => (
                                        <div key={idx} style={premiumStyles.checkCard}>
                                          <div style={premiumStyles.checkHeader}>
                                            <span style={premiumStyles.checkCodeLinked}>{dep.linked_question_code}</span>
                                            {dep.type && <span style={premiumStyles.checkType}>{dep.type}</span>}
                                          </div>
                                          <p style={premiumStyles.checkDescription}>{dep.description}</p>
                                          {dep.scoring_impact && (
                                            <p style={premiumStyles.checkReasoning}>{dep.scoring_impact}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
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

// ============ Questions Tab (Premium Minimalist Design) ============

function QuestionsTab({
  questions,
  onSelectDimension
}: {
  questions: QuestionScoreDetail[];
  onSelectDimension?: (dimension: DimensionScoreDetail) => void;
}) {
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
    return a.question_code.localeCompare(b.question_code);
  });

  return (
    <div style={questionsTabStyles.container}>
      {/* Table Header - Institutional Style */}
      <div style={questionsTabStyles.tableHeader}>
        <span style={{ width: '56px', ...questionsTabStyles.headerLabel, textAlign: 'center' as const }}>#</span>
        <span style={{ flex: 2, ...questionsTabStyles.headerLabel }}>Question</span>
        <span style={{ width: '100px', ...questionsTabStyles.headerLabel, textAlign: 'center' as const }}>Score</span>
        <span style={{ width: '80px', ...questionsTabStyles.headerLabel, textAlign: 'center' as const }}>Confidence</span>
        <span style={{ width: '40px' }} />
      </div>

      {sortedQuestions.map((q, index) => {
        const isExpanded = expandedQuestion === q.id;
        const scoreColor = getScoreColor(q.overall_score || 0);
        const questionNum = index + 1;
        const truncatedText = q.question_text
          ? (q.question_text.length > 80 ? q.question_text.slice(0, 80) + '...' : q.question_text)
          : '';
        const isLast = index === sortedQuestions.length - 1;

        return (
          <div key={q.id} style={{
            ...questionsTabStyles.questionRow,
            borderRadius: isLast && !isExpanded ? '0 0 6px 6px' : '0',
          }}>
            {/* Question Row (clickable) */}
            <button
              onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
              style={questionsTabStyles.questionButton}
            >
              {/* Number Column */}
              <div style={questionsTabStyles.numberColumn}>
                <svg
                  width="14" height="14" viewBox="0 0 16 16" fill="#8C959F"
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.15s',
                    flexShrink: 0,
                  }}
                >
                  <path d="M4.427 9.573l3.396-3.396a.25.25 0 01.354 0l3.396 3.396a.25.25 0 01-.177.427H4.604a.25.25 0 01-.177-.427z" />
                </svg>
                <span style={questionsTabStyles.questionNumber}>{questionNum}</span>
              </div>
              {/* Question Info Column */}
              <div style={questionsTabStyles.questionLeft}>
                <span style={questionsTabStyles.questionCode}>{q.question_code}</span>
                <span style={questionsTabStyles.questionPreview}>{truncatedText}</span>
              </div>
              <div style={questionsTabStyles.questionRight}>
                <div style={{ width: '100px', textAlign: 'center' as const }}>
                  <span style={{ ...questionsTabStyles.scoreValue, color: scoreColor }}>
                    {Math.round(q.overall_score || 0)}
                  </span>
                </div>
                <div style={{ width: '80px', textAlign: 'center' as const }}>
                  <span style={questionsTabStyles.confidenceBadge}>{q.confidence}</span>
                </div>
                {q.requires_review && (
                  <span style={questionsTabStyles.reviewBadge}>Review</span>
                )}
              </div>
            </button>

            {/* Premium Expanded Content */}
            {isExpanded && (
              <div style={premiumStyles.expandedContainer}>
                {/* Question Text */}
                {q.question_text && (
                  <div style={premiumStyles.questionBlock}>
                    <p style={premiumStyles.questionText}>{q.question_text}</p>
                  </div>
                )}

                {/* User Response */}
                {q.raw_response && (
                  <div style={premiumStyles.responseBlock}>
                    <p style={premiumStyles.responseText}>{q.raw_response}</p>
                  </div>
                )}

                {/* Meta Pills Row */}
                <div style={premiumStyles.metaRow}>
                  <span style={premiumStyles.metaPill}>
                    <span style={premiumStyles.metaPillLabel}>Quality</span>
                    <span style={premiumStyles.metaPillValue}>{q.response_quality}</span>
                  </span>
                  <span style={premiumStyles.metaPill}>
                    <span style={premiumStyles.metaPillLabel}>Confidence</span>
                    <span style={premiumStyles.metaPillValue}>{q.confidence}</span>
                  </span>
                  {q.requires_review && (
                    <span style={premiumStyles.reviewPill}>Review needed</span>
                  )}
                </div>

                {/* AI Reasoning */}
                {q.scoring_reasoning && (
                  <div style={premiumStyles.reasoningBlock}>
                    <div style={premiumStyles.reasoningHeader}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="#8C959F">
                        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zM5.78 8.75a9.64 9.64 0 001.363 4.177c.255.426.542.832.857 1.215.245-.296.551-.705.857-1.215A9.64 9.64 0 0010.22 8.75H5.78zm4.44-1.5a9.64 9.64 0 00-1.363-4.177c-.307-.51-.612-.919-.857-1.215a9.927 9.927 0 00-.857 1.215A9.64 9.64 0 005.78 7.25h4.44zm-5.944 1.5H1.543a6.507 6.507 0 004.666 5.5c-.123-.181-.24-.365-.352-.552-.715-1.192-1.437-2.874-1.581-4.948zm-2.733-1.5h2.733c.144-2.074.866-3.756 1.58-4.948.12-.197.237-.381.353-.552a6.507 6.507 0 00-4.666 5.5zm10.181 1.5c-.144 2.074-.866 3.756-1.58 4.948-.12.197-.237.381-.353.552a6.507 6.507 0 004.666-5.5h-2.733zm2.733-1.5a6.507 6.507 0 00-4.666-5.5c.123.181.24.365.353.552.714 1.192 1.436 2.874 1.58 4.948h2.733z" />
                      </svg>
                      <span style={premiumStyles.reasoningLabel}>AI Analysis</span>
                    </div>
                    <p style={premiumStyles.reasoningText}>{q.scoring_reasoning}</p>
                  </div>
                )}

                {/* Dimensions with Pips */}
                {q.dimension_scores && q.dimension_scores.length > 0 && (
                  <div style={premiumStyles.dimensionsBlock}>
                    <span style={premiumStyles.sectionLabel}>Dimensions</span>
                    <div style={premiumStyles.dimensionsList}>
                      {q.dimension_scores.map((ds, idx) => {
                        const dimScore = ds.score || 0;
                        const dimScoreColor = getScoreColor(dimScore * 20);
                        return (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectDimension) onSelectDimension(ds);
                            }}
                            style={premiumStyles.dimensionRow}
                          >
                            <span style={premiumStyles.dimensionName}>{ds.dimension_name}</span>
                            <div style={premiumStyles.dimensionRight}>
                              {/* Pip Visualization */}
                              <div style={premiumStyles.dimensionPips}>
                                {[1, 2, 3, 4, 5].map(n => (
                                  <div
                                    key={n}
                                    style={{
                                      ...premiumStyles.pip,
                                      backgroundColor: n <= dimScore ? dimScoreColor : '#D8DEE4',
                                    }}
                                  />
                                ))}
                              </div>
                              <span style={premiumStyles.dimensionScore}>{dimScore}/5</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Interdependency Checks */}
                {q.check_results && q.check_results.length > 0 && (
                  <div style={premiumStyles.checksBlock}>
                    <span style={premiumStyles.sectionLabel}>
                      Interdependency Checks
                      <span style={premiumStyles.checkCount}>{q.check_results.length}</span>
                    </span>
                    <div style={premiumStyles.checksList}>
                      {q.check_results.map((cr, idx) => {
                        const linkedCode = cr.question_ids?.filter(id => id !== q.question_id)[0] || cr.linked_question_code;
                        return (
                          <div key={cr.id || idx} style={premiumStyles.checkCard}>
                            {/* Header: Codes + Status */}
                            <div style={premiumStyles.checkHeader}>
                              <div style={premiumStyles.checkCodes}>
                                <span style={premiumStyles.checkCodePrimary}>{q.question_code}</span>
                                {linkedCode && (
                                  <>
                                    <span style={{ color: '#8C959F' }}>↔</span>
                                    <span style={premiumStyles.checkCodeLinked}>{linkedCode}</span>
                                  </>
                                )}
                              </div>
                              <span style={{
                                ...premiumStyles.checkStatus,
                                backgroundColor: cr.passed ? 'rgba(26, 127, 55, 0.1)' : 'rgba(207, 34, 46, 0.1)',
                                color: cr.passed ? '#1A7F37' : '#CF222E',
                              }}>
                                {cr.passed ? 'PASS' : 'FAIL'}
                              </span>
                            </div>
                            <span style={premiumStyles.checkType}>{cr.check_type}</span>
                            {/* Description */}
                            <p style={premiumStyles.checkDescription}>{cr.interdependency_description}</p>
                            {/* Score chips */}
                            {(cr.q1_score !== undefined || cr.q2_score !== undefined) && (
                              <div style={premiumStyles.checkScores}>
                                <span style={premiumStyles.checkScoreChip}>
                                  Q1 Score: {Math.round(cr.q1_score || 0)}
                                </span>
                                {cr.q2_score !== undefined && (
                                  <span style={premiumStyles.checkScoreChip}>
                                    Q2 Score: {Math.round(cr.q2_score || 0)}
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Reasoning */}
                            {cr.reasoning && (
                              <p style={premiumStyles.checkReasoning}>{cr.reasoning}</p>
                            )}
                            {/* Flag indicator */}
                            {cr.flag_id && (
                              <span style={premiumStyles.checkFlag}>Flag: {cr.flag_id}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Interdependencies (legacy format support) */}
                {q.interdependencies && q.interdependencies.length > 0 && !q.check_results?.length && (
                  <div style={premiumStyles.checksBlock}>
                    <span style={premiumStyles.sectionLabel}>
                      Question Dependencies
                      <span style={premiumStyles.checkCount}>{q.interdependencies.length}</span>
                    </span>
                    <div style={premiumStyles.checksList}>
                      {q.interdependencies.map((dep, idx) => (
                        <div key={idx} style={premiumStyles.checkCard}>
                          <div style={premiumStyles.checkHeader}>
                            <span style={premiumStyles.checkCodeLinked}>{dep.linked_question_code}</span>
                            {dep.type && <span style={premiumStyles.checkType}>{dep.type}</span>}
                          </div>
                          <p style={premiumStyles.checkDescription}>{dep.description}</p>
                          {dep.scoring_impact && (
                            <p style={premiumStyles.checkReasoning}>{dep.scoring_impact}</p>
                          )}
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

// Questions Tab Premium Styles
const questionsTabStyles: Record<string, React.CSSProperties> = {
  container: {
    border: '1px solid #D0D7DE',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#F6F8FA',
    borderBottom: '1px solid #D0D7DE',
  },
  headerLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#8C959F',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  questionRow: {
    borderBottom: '1px solid #D0D7DE',
  },
  questionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  numberColumn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '56px',
    flexShrink: 0,
  },
  questionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 2,
    minWidth: 0,
  },
  questionNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#F6F8FA',
    border: '1px solid #D8DEE4',
    fontSize: '12px',
    fontWeight: 600,
    color: '#57606A',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    flexShrink: 0,
  },
  questionCode: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#24292F',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    flexShrink: 0,
  },
  questionPreview: {
    fontSize: '13px',
    color: '#57606A',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  questionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  scoreValue: {
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  confidenceBadge: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#57606A',
    padding: '2px 8px',
    backgroundColor: '#F6F8FA',
    borderRadius: '4px',
  },
  reviewBadge: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#9A6700',
    padding: '2px 8px',
    backgroundColor: '#FFF8C5',
    borderRadius: '4px',
  },
};

// ============ Flags Tab (Premium Minimalist Design) ============

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
      <div style={flagsTabStyles.emptyState}>
        <div style={flagsTabStyles.emptyIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A7F37" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 style={flagsTabStyles.emptyTitle}>No flags identified</h3>
        <p style={flagsTabStyles.emptyText}>All responses passed quality validation checks.</p>
      </div>
    );
  }

  const unresolvedFlags = flags.filter(f => !f.is_resolved);
  const resolvedFlags = flags.filter(f => f.is_resolved);

  return (
    <div style={flagsTabStyles.container}>
      {/* Open Flags Section */}
      {unresolvedFlags.length > 0 && (
        <div style={flagsTabStyles.section}>
          <div style={flagsTabStyles.sectionHeader}>
            <span style={flagsTabStyles.sectionLabel}>Open Flags</span>
            <span style={flagsTabStyles.countBadge}>{unresolvedFlags.length}</span>
          </div>
          <div style={flagsTabStyles.flagsList}>
            {unresolvedFlags.map((flag) => {
              const isResolving = resolvingFlag === flag.id;
              const severityStyle = getSeverityStyle(flag.severity);

              return (
                <div
                  key={flag.id}
                  style={{
                    ...flagsTabStyles.flagCard,
                    borderLeft: `3px solid ${severityStyle.accent}`,
                  }}
                >
                  {/* Flag Header */}
                  <div style={flagsTabStyles.flagHeader}>
                    <span style={{
                      ...flagsTabStyles.severityBadge,
                      backgroundColor: severityStyle.bg,
                      color: severityStyle.text,
                    }}>
                      {flag.severity.toUpperCase()}
                    </span>
                    <span style={flagsTabStyles.flagType}>
                      {flag.flag_type?.replace(/_/g, ' ')}
                    </span>
                    <span style={flagsTabStyles.impactBadge}>
                      Impact: {flag.severity === 'critical' ? 'High' : flag.severity === 'warning' ? 'Medium' : 'Low'}
                    </span>
                  </div>

                  {/* Flag Title */}
                  <h3 style={flagsTabStyles.flagTitle}>{flag.title}</h3>

                  {/* Flag Description */}
                  {flag.description && (
                    <p style={flagsTabStyles.flagDescription}>{flag.description}</p>
                  )}

                  {/* AI Analysis */}
                  {flag.ai_explanation && (
                    <div style={flagsTabStyles.analysisBlock}>
                      <span style={flagsTabStyles.analysisLabel}>Analysis</span>
                      <p style={flagsTabStyles.analysisText}>{flag.ai_explanation}</p>
                    </div>
                  )}

                  {/* Related Questions */}
                  {flag.question_ids && flag.question_ids.length > 0 && (
                    <div style={flagsTabStyles.relatedRow}>
                      <span style={flagsTabStyles.relatedLabel}>Related:</span>
                      {flag.question_ids.map((qid, idx) => (
                        <span key={idx} style={flagsTabStyles.relatedCode}>{qid}</span>
                      ))}
                    </div>
                  )}

                  {/* Resolve Form or Button */}
                  {isResolving ? (
                    <div style={flagsTabStyles.resolveForm}>
                      <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Enter resolution notes..."
                        style={flagsTabStyles.resolveTextarea}
                        rows={3}
                      />
                      <div style={flagsTabStyles.resolveActions}>
                        <button
                          onClick={() => {
                            setResolvingFlag(null);
                            setResolution('');
                          }}
                          style={flagsTabStyles.cancelButton}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onResolve(flag.id, resolution);
                            setResolvingFlag(null);
                            setResolution('');
                          }}
                          style={flagsTabStyles.confirmButton}
                          disabled={!resolution.trim()}
                        >
                          Resolve Flag
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResolvingFlag(flag.id)}
                      style={flagsTabStyles.resolveButton}
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolved Flags Section */}
      {resolvedFlags.length > 0 && (
        <div style={flagsTabStyles.section}>
          <div style={flagsTabStyles.sectionHeader}>
            <span style={flagsTabStyles.sectionLabel}>Resolved</span>
            <span style={flagsTabStyles.countBadgeResolved}>{resolvedFlags.length}</span>
          </div>
          <div style={flagsTabStyles.flagsList}>
            {resolvedFlags.map((flag) => (
              <div key={flag.id} style={flagsTabStyles.resolvedCard}>
                <div style={flagsTabStyles.flagHeader}>
                  <span style={flagsTabStyles.resolvedBadge}>Resolved</span>
                  <span style={flagsTabStyles.flagType}>
                    {flag.flag_type?.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 style={flagsTabStyles.flagTitleResolved}>{flag.title}</h3>
                <div style={flagsTabStyles.resolutionBlock}>
                  <span style={flagsTabStyles.resolutionLabel}>Resolution</span>
                  <p style={flagsTabStyles.resolutionText}>{flag.resolution}</p>
                </div>
                <span style={flagsTabStyles.resolvedMeta}>
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

// Get severity style helper
function getSeverityStyle(severity: string): { bg: string; text: string; accent: string } {
  const styles: Record<string, { bg: string; text: string; accent: string }> = {
    critical: { bg: 'rgba(207, 34, 46, 0.1)', text: '#CF222E', accent: '#CF222E' },
    warning: { bg: 'rgba(154, 103, 0, 0.1)', text: '#9A6700', accent: '#9A6700' },
    info: { bg: 'rgba(9, 105, 218, 0.1)', text: '#0969DA', accent: '#0969DA' },
  };
  return styles[severity] || styles.info;
}

// Flags Tab Premium Styles
const flagsTabStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  // Empty state
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center' as const,
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'rgba(26, 127, 55, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#24292F',
    margin: '0 0 4px 0',
  },
  emptyText: {
    fontSize: '14px',
    color: '#57606A',
    margin: 0,
  },
  // Section
  section: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#8C959F',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  countBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#CF222E',
    backgroundColor: 'rgba(207, 34, 46, 0.1)',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  countBadgeResolved: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#1A7F37',
    backgroundColor: 'rgba(26, 127, 55, 0.1)',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  flagsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  // Flag Card
  flagCard: {
    padding: '16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    border: '1px solid #D0D7DE',
  },
  flagHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  severityBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '4px',
  },
  flagType: {
    fontSize: '12px',
    color: '#57606A',
    textTransform: 'capitalize' as const,
  },
  impactBadge: {
    marginLeft: 'auto',
    fontSize: '11px',
    color: '#8C959F',
  },
  flagTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#24292F',
    margin: '0 0 8px 0',
  },
  flagDescription: {
    fontSize: '14px',
    color: '#57606A',
    lineHeight: 1.5,
    margin: '0 0 16px 0',
  },
  // Analysis block
  analysisBlock: {
    padding: '12px',
    backgroundColor: '#F6F8FA',
    borderRadius: '6px',
    marginBottom: '16px',
  },
  analysisLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#8C959F',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
    marginBottom: '6px',
  },
  analysisText: {
    fontSize: '13px',
    color: '#57606A',
    lineHeight: 1.5,
    margin: 0,
  },
  // Related questions
  relatedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '16px',
  },
  relatedLabel: {
    fontSize: '12px',
    color: '#8C959F',
  },
  relatedCode: {
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    color: '#0969DA',
    backgroundColor: 'rgba(9, 105, 218, 0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  // Resolve form
  resolveForm: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#F6F8FA',
    borderRadius: '6px',
  },
  resolveTextarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #D0D7DE',
    borderRadius: '6px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    marginBottom: '12px',
  },
  resolveActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  cancelButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#24292F',
    backgroundColor: '#FFFFFF',
    border: '1px solid #D0D7DE',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  confirmButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#FFFFFF',
    backgroundColor: '#1A7F37',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  resolveButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#24292F',
    backgroundColor: '#FFFFFF',
    border: '1px solid #D0D7DE',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  // Resolved card
  resolvedCard: {
    padding: '16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #D0D7DE',
    opacity: 0.75,
  },
  resolvedBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#1A7F37',
    backgroundColor: 'rgba(26, 127, 55, 0.1)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  flagTitleResolved: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#57606A',
    margin: '0 0 12px 0',
  },
  resolutionBlock: {
    padding: '12px',
    backgroundColor: '#F6F8FA',
    borderRadius: '6px',
    marginBottom: '8px',
  },
  resolutionLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#8C959F',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
    marginBottom: '6px',
  },
  resolutionText: {
    fontSize: '13px',
    color: '#57606A',
    lineHeight: 1.5,
    margin: 0,
  },
  resolvedMeta: {
    fontSize: '12px',
    color: '#8C959F',
  },
};

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
