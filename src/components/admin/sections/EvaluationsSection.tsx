/**
 * Evaluations Section - AI-Powered Assessment Evaluation
 * Hierarchical navigation: Businesses > Assessments > Runs > Detail
 * Detail sub-navigation: Summary > Breakdown > Interview
 */

import { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import { EuniceChatPanel } from '../../chat/EuniceChatPanel';
import { SiriOrb } from '../../interview/SiriOrb';
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
  onSidebarCollapse?: (collapsed: boolean) => void;
  sidebarCollapsed?: boolean;
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
    return metricDef.clientName;
  }
  return metricName || metricCode || 'Unknown Metric';
}

// Helper to sort metrics by CABAS order (strategic priority)
function _sortMetricsByCABASOrder(metrics: MetricScoreDetail[]): MetricScoreDetail[] {
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

export function EvaluationsSection({ onError, onSidebarCollapse, sidebarCollapsed }: EvaluationsSectionProps) {
  // Navigation state
  const [nav, setNav] = useState<NavigationState>({ level: 'businesses' });

  // Data states
  const [businesses, setBusinesses] = useState<BusinessWithReviews[]>([]);
  const [assessments, setAssessments] = useState<BusinessReviewItem[]>([]);
  const [runs, setRuns] = useState<EvaluationRunSummary[]>([]);
  const [scores, setScores] = useState<EvaluationScoresResponse | null>(null);

  // Stripe-style enriched data
  const [enrichedBusinesses, setEnrichedBusinesses] = useState<{
    id: string;
    name: string;
    assessments: {
      id: string;
      name: string;
      status: string;
      latestRun?: EvaluationRunSummary;
      runs: EvaluationRunSummary[];
      stats: { total_submitted: number };
      evaluated_at?: string;
    }[];
    total_reviews: number;
    completed_reviews: number;
  }[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  // Note: activeTab kept for future use when tabs are implemented
  const [_activeTab, _setActiveTab] = useState<'metrics' | 'questions' | 'flags'>('metrics');

  // For triggering new evaluations
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [triggeringReview, setTriggeringReview] = useState<string | null>(null);

  // Eunice AI Chat
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Handle chat open/close with sidebar collapse
  const handleOpenChat = () => {
    setIsChatOpen(true);
    onSidebarCollapse?.(true); // Collapse sidebar when chat opens
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
    onSidebarCollapse?.(false); // Expand sidebar when chat closes
  };

  const [runningProgress, setRunningProgress] = useState<{
    step: number;
    total: number;
    message: string;
  } | undefined>(undefined);

  useEffect(() => {
    loadEnrichedBusinesses();
  }, []);

  // ============ Data Loading ============

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getBusinessesWithEvaluations();

      // Sort by most recent evaluation first
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

  // Load enriched data for Stripe-style view
  const loadEnrichedBusinesses = async () => {
    try {
      setIsLoading(true);
      const businessesData = await adminApi.getBusinessesWithEvaluations();

      // Sort by most recent evaluation first
      const sortedBusinesses = businessesData.sort((a, b) => {
        const aDate = a.latest_evaluation_at || a.most_recent_pending || '1970-01-01';
        const bDate = b.latest_evaluation_at || b.most_recent_pending || '1970-01-01';
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });

      // Load assessments and runs for each business in parallel
      const enriched = await Promise.all(
        sortedBusinesses.map(async (business) => {
          try {
            const reviewsData = await adminApi.getBusinessReviews(business.id);
            const allReviews = [...(reviewsData.pending || []), ...(reviewsData.completed || [])];

            // Load runs for each assessment
            const assessmentsWithRuns = await Promise.all(
              allReviews.map(async (review) => {
                try {
                  const runsData = await adminApi.getAssessmentEvaluationRuns(review.id);
                  const sortedRuns = runsData.sort((a, b) => {
                    const aDate = a.created_at || '1970-01-01';
                    const bDate = b.created_at || '1970-01-01';
                    return new Date(bDate).getTime() - new Date(aDate).getTime();
                  });

                  return {
                    id: review.id,
                    name: review.name,
                    status: review.status,
                    latestRun: sortedRuns[0],
                    runs: sortedRuns,
                    stats: review.stats,
                    evaluated_at: review.evaluated_at,
                  };
                } catch {
                  return {
                    id: review.id,
                    name: review.name,
                    status: review.status,
                    latestRun: undefined,
                    runs: [],
                    stats: review.stats,
                    evaluated_at: review.evaluated_at,
                  };
                }
              })
            );

            // Sort assessments by most recent run or evaluation
            const sortedAssessments = assessmentsWithRuns.sort((a, b) => {
              const aDate = a.latestRun?.created_at || a.evaluated_at || '1970-01-01';
              const bDate = b.latestRun?.created_at || b.evaluated_at || '1970-01-01';
              return new Date(bDate).getTime() - new Date(aDate).getTime();
            });

            return {
              id: business.id,
              name: business.name,
              assessments: sortedAssessments,
              total_reviews: business.total_reviews,
              completed_reviews: business.completed_reviews,
            };
          } catch {
            return {
              id: business.id,
              name: business.name,
              assessments: [],
              total_reviews: business.total_reviews,
              completed_reviews: business.completed_reviews,
            };
          }
        })
      );

      setEnrichedBusinesses(enriched);
      setBusinesses(sortedBusinesses);
    } catch (err) {
      onError('Failed to load evaluations data');
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

  const loadRunDetail = async (runId: string, businessId?: string, isPolling = false) => {
    try {
      if (!isPolling) setIsLoading(true);
      const [detail, scoresData] = await Promise.all([
        adminApi.getEvaluationRun(runId),
        adminApi.getEvaluationScores(runId),
      ]);

      // Find business info if businessId provided (from split-pane view)
      let selectedBusiness = nav.selectedBusiness;
      if (businessId && !selectedBusiness) {
        const business = enrichedBusinesses.find(b => b.id === businessId);
        if (business) {
          selectedBusiness = { id: business.id, name: business.name };
        }
      }

      setNav(prev => ({
        ...prev,
        level: 'detail',
        selectedBusiness: selectedBusiness,
        selectedRun: detail,
        detailSubLevel: 'summary',
        selectedSourceId: undefined,
      }));
      setScores(scoresData);

      // If evaluation is still processing, poll for updates
      if (detail.status === 'processing' || detail.status === 'pending') {
        setTimeout(() => loadRunDetail(runId, businessId, true), 3000);
      }
    } catch (err) {
      onError('Failed to load evaluation details');
    } finally {
      if (!isPolling) setIsLoading(false);
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
        // Go back to summary (main aggregated view)
        setNav(prev => ({ ...prev, detailSubLevel: 'summary', selectedSourceId: undefined }));
      } else if (nav.detailSubLevel === 'breakdown') {
        // Go back to summary
        setNav(prev => ({ ...prev, detailSubLevel: 'summary' }));
      } else {
        // Go back to split-pane view (businesses level) with same business selected
        const businessToSelect = nav.selectedBusiness;
        setNav({
          level: 'businesses',
          selectedBusiness: businessToSelect, // Preserve for initialSelectedBusinessId
        });
        setScores(null);
        loadBusinesses();
      }
    } else if (nav.level === 'runs') {
      // Go back to split-pane view with same business selected
      const businessToSelect = nav.selectedBusiness;
      setNav({
        level: 'businesses',
        selectedBusiness: businessToSelect,
      });
      loadBusinesses();
    } else if (nav.level === 'assessments') {
      // Go back to split-pane view with same business selected
      const businessToSelect = nav.selectedBusiness;
      setNav({
        level: 'businesses',
        selectedBusiness: businessToSelect,
      });
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

      // Simulate progress steps for better UX
      const progressSteps = [
        { step: 1, total: 5, message: 'Loading interview data...' },
        { step: 2, total: 5, message: 'Analyzing responses...' },
        { step: 3, total: 5, message: 'Calculating metrics...' },
        { step: 4, total: 5, message: 'Generating insights...' },
        { step: 5, total: 5, message: 'Finalizing report...' },
      ];

      // Show progress animation
      for (const progress of progressSteps) {
        setRunningProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const result = await adminApi.runEvaluation(assessmentId);
      setShowTriggerModal(false);
      setRunningProgress(undefined);

      // Refresh enriched data for Stripe-style view
      if (nav.level === 'businesses') {
        await loadEnrichedBusinesses();
        // Auto-navigate to the new run
        if (result.run_id) {
          setTimeout(() => loadRunDetail(result.run_id), 500);
        }
      } else {
        // Fallback for old-style navigation
        await loadRuns(assessmentId);
        setTimeout(() => {
          if (result.run_id) {
            loadRunDetail(result.run_id);
          }
        }, 1000);
      }
    } catch (err) {
      onError('Failed to trigger evaluation');
      setRunningProgress(undefined);
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

  const mainContent = (
    <div style={styles.container}>
      {/* CSS for animations */}
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes borderRotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .ask-eunice-wrapper {
          position: relative;
          display: inline-block;
          border-radius: 24px;
          padding: 1px;
          background: rgba(0, 0, 0, 0.12);
          overflow: hidden;
        }
        .ask-eunice-wrapper::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 300%;
          height: 300%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            transparent 320deg,
            rgba(139, 92, 246, 0.5) 340deg,
            rgba(168, 85, 247, 0.9) 350deg,
            rgba(236, 72, 153, 0.9) 355deg,
            rgba(168, 85, 247, 0.5) 360deg
          );
          animation: borderRotate 3s linear infinite;
        }
        .ask-eunice-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 16px 6px 6px;
          background: #fff;
          color: #1D1D1F;
          border: none;
          border-radius: 23px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.28s cubic-bezier(0.32, 0.72, 0, 1);
          letter-spacing: -0.01em;
        }
        .ask-eunice-wrapper:hover::before {
          animation: borderRotate 2s linear infinite;
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

      {/* Level 1: Split-Pane Unified View */}
      {nav.level === 'businesses' && (
        <SplitPaneEvaluations
          businesses={enrichedBusinesses}
          onViewRun={loadRunDetail}
          onTriggerEvaluation={triggerEvaluation}
          triggeringAssessment={triggeringReview}
          runningProgress={runningProgress}
          initialSelectedBusinessId={nav.selectedBusiness?.id}
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
              businessName={nav.selectedBusiness?.name}
              onBack={goBack}
              onViewBreakdown={goToBreakdown}
              onViewInterview={goToInterviewDetail}
              onOpenChat={handleOpenChat}
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

  // Wrap in flex container when chat is available
  if (nav.selectedRun) {
    return (
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto', transition: 'all 0.28s cubic-bezier(0.32, 0.72, 0, 1)' }}>
          {mainContent}
        </div>
        <EuniceChatPanel
          isOpen={isChatOpen}
          onClose={handleCloseChat}
          runId={nav.selectedRun.id}
          evaluationName={`Run #${nav.selectedRun.run_number}`}
        />
      </div>
    );
  }

  return mainContent;
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

// ============ NEW: Split-Pane Master-Detail View ============

// Logo color generator for business avatars
const LOGO_COLORS = [
  { bg: '#1A1A1A', text: '#FFFFFF' }, // Black
  { bg: '#6366F1', text: '#FFFFFF' }, // Indigo
  { bg: '#8B5CF6', text: '#FFFFFF' }, // Violet
  { bg: '#EC4899', text: '#FFFFFF' }, // Pink
  { bg: '#F59E0B', text: '#FFFFFF' }, // Amber
  { bg: '#10B981', text: '#FFFFFF' }, // Emerald
  { bg: '#3B82F6', text: '#FFFFFF' }, // Blue
  { bg: '#EF4444', text: '#FFFFFF' }, // Red
  { bg: '#14B8A6', text: '#FFFFFF' }, // Teal
  { bg: '#F97316', text: '#FFFFFF' }, // Orange
];

function getLogoColor(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % LOGO_COLORS.length;
  return LOGO_COLORS[index];
}

interface AssessmentWithRuns {
  id: string;
  name: string;
  status: string;
  latestRun?: EvaluationRunSummary;
  runs: EvaluationRunSummary[];
  stats: {
    total_submitted: number;
  };
  evaluated_at?: string;
}

interface BusinessWithAssessments {
  id: string;
  name: string;
  assessments: AssessmentWithRuns[];
  total_reviews: number;
  completed_reviews: number;
}

function SplitPaneEvaluations({
  businesses,
  onViewRun,
  onTriggerEvaluation,
  triggeringAssessment,
  runningProgress,
  initialSelectedBusinessId,
}: {
  businesses: BusinessWithAssessments[];
  onViewRun: (runId: string, businessId: string) => void;
  onTriggerEvaluation: (assessmentId: string) => void;
  triggeringAssessment: string | null;
  runningProgress?: { step: number; total: number; message: string };
  initialSelectedBusinessId?: string;
}) {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    initialSelectedBusinessId || (businesses.length > 0 ? businesses[0].id : null)
  );
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  const toggleHistory = (assessmentId: string) => {
    setExpandedHistory(prev => prev === assessmentId ? null : assessmentId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return { text: '#1A7F37', bar: '#1A7F37' };
    if (score >= 50) return { text: '#9A6700', bar: '#9A6700' };
    if (score >= 30) return { text: '#CF222E', bar: '#CF222E' };
    return { text: '#8C959F', bar: '#D0D0D0' };
  };

  if (businesses.length === 0) {
    return (
      <div style={splitStyles.emptyState}>
        <div style={splitStyles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="1.5">
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 style={splitStyles.emptyTitle}>No evaluations yet</h3>
        <p style={splitStyles.emptyText}>Businesses will appear here once they have submitted assessments.</p>
      </div>
    );
  }

  return (
    <div style={splitStyles.container}>
      {/* Stats Subtitle */}
      <p style={splitStyles.subtitle}>
        {businesses.length} business{businesses.length !== 1 ? 'es' : ''} · {businesses.reduce((sum, b) => sum + b.assessments.length, 0)} assessments
      </p>

      {/* Split Pane Container */}
      <div style={splitStyles.splitContainer}>
        {/* Left Panel - Business List */}
        <div style={splitStyles.leftPanel}>
          <div style={splitStyles.panelHeader}>
            <span style={splitStyles.panelLabel}>Businesses</span>
          </div>
          <div style={splitStyles.businessList}>
            {businesses.map(business => {
              const isSelected = business.id === selectedBusinessId;
              const hasRuns = business.assessments.some(a => a.runs.length > 0);
              const avgScore = hasRuns
                ? Math.round(
                    business.assessments
                      .filter(a => a.latestRun)
                      .reduce((sum, a) => sum + (a.latestRun?.overall_score || 0), 0) /
                    Math.max(1, business.assessments.filter(a => a.latestRun).length)
                  )
                : null;
              const logoColor = getLogoColor(business.name);

              return (
                <div
                  key={business.id}
                  onClick={() => setSelectedBusinessId(business.id)}
                  style={{
                    ...splitStyles.businessItemWrapper,
                    backgroundColor: isSelected ? '#F5F5F5' : 'transparent',
                  }}
                >
                  {/* Selection Indicator */}
                  <div style={{
                    ...splitStyles.selectionIndicator,
                    backgroundColor: isSelected ? '#1A1A1A' : 'transparent',
                  }} />
                  {/* Circular Logo */}
                  <div style={{
                    ...splitStyles.businessLogo,
                    backgroundColor: logoColor.bg,
                    color: logoColor.text,
                  }}>
                    {business.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={splitStyles.businessItemContent}>
                    <span style={splitStyles.businessName}>{business.name}</span>
                    <span style={splitStyles.businessMeta}>
                      {business.assessments.length} assessment{business.assessments.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {avgScore !== null && (
                    <span style={{
                      ...splitStyles.businessScore,
                      color: getScoreColor(avgScore).text,
                    }}>
                      {avgScore}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Vertical Divider */}
        <div style={splitStyles.divider} />

        {/* Right Panel - Assessments */}
        <div style={splitStyles.rightPanel}>
          {selectedBusiness ? (
            <>
              <div style={splitStyles.panelHeader}>
                <div>
                  <span style={splitStyles.selectedBusinessName}>{selectedBusiness.name}</span>
                  <span style={splitStyles.selectedBusinessMeta}>
                    {selectedBusiness.assessments.length} assessment{selectedBusiness.assessments.length !== 1 ? 's' : ''} · {selectedBusiness.completed_reviews} evaluated
                  </span>
                </div>
              </div>

              <div style={splitStyles.assessmentList}>
                {selectedBusiness.assessments.map(assessment => {
                  const isRunning = triggeringAssessment === assessment.id;
                  const hasRuns = assessment.runs.length > 0;
                  const latestRun = assessment.latestRun;
                  const score = latestRun?.overall_score || 0;
                  const scoreColors = getScoreColor(score);
                  const isHistoryOpen = expandedHistory === assessment.id;

                  return (
                    <div key={assessment.id} style={splitStyles.assessmentCard}>
                      {/* Assessment Header Row */}
                      <div style={splitStyles.assessmentHeader}>
                        <div style={splitStyles.assessmentInfo}>
                          <h3 style={splitStyles.assessmentName}>{assessment.name}</h3>
                          {latestRun && (
                            <span style={splitStyles.assessmentMeta}>
                              Last run {timeAgo(latestRun.created_at)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => onTriggerEvaluation(assessment.id)}
                          disabled={isRunning}
                          style={{
                            ...splitStyles.runButton,
                            opacity: isRunning ? 0.7 : 1,
                          }}
                        >
                          {isRunning ? (
                            <>
                              <div style={splitStyles.miniSpinner} />
                              <span>Running...</span>
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                              <span>Run Evaluation</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Progress Bar (when running) */}
                      {isRunning && runningProgress && (
                        <div style={splitStyles.progressSection}>
                          <div style={splitStyles.progressBar}>
                            <div style={{
                              ...splitStyles.progressFill,
                              width: `${(runningProgress.step / runningProgress.total) * 100}%`,
                            }} />
                          </div>
                          <div style={splitStyles.progressInfo}>
                            <span style={splitStyles.progressMessage}>{runningProgress.message}</span>
                            <span style={splitStyles.progressStep}>Step {runningProgress.step}/{runningProgress.total}</span>
                          </div>
                        </div>
                      )}

                      {/* Score Display (when has runs) */}
                      {hasRuns && latestRun && !isRunning && (
                        <div
                          onClick={() => onViewRun(latestRun.id, selectedBusiness!.id)}
                          style={splitStyles.scoreRow}
                        >
                          <div style={splitStyles.scoreDisplay}>
                            <span style={{ ...splitStyles.scoreValue, color: scoreColors.text }}>
                              {score}
                            </span>
                            <span style={splitStyles.scoreMax}>/100</span>
                            <div style={splitStyles.scoreBar}>
                              <div style={{
                                ...splitStyles.scoreBarFill,
                                width: `${score}%`,
                                backgroundColor: scoreColors.bar,
                              }} />
                            </div>
                          </div>
                          <div style={splitStyles.runDetails}>
                            {(latestRun.total_flags || 0) > 0 && (
                              <span style={splitStyles.flagBadge}>{latestRun.total_flags} flags</span>
                            )}
                            <span style={splitStyles.viewLink}>View details →</span>
                          </div>
                        </div>
                      )}

                      {/* No runs state */}
                      {!hasRuns && !isRunning && (
                        <div style={splitStyles.noRunsRow}>
                          <span style={splitStyles.noRunsText}>No evaluations yet</span>
                        </div>
                      )}

                      {/* History Dropdown */}
                      {hasRuns && assessment.runs.length > 1 && (
                        <div style={splitStyles.historySection}>
                          <button
                            onClick={() => toggleHistory(assessment.id)}
                            style={splitStyles.historyToggle}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{
                                transform: isHistoryOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                              }}
                            >
                              <path d="M6 9l6 6 6-6" />
                            </svg>
                            <span>Previous runs ({assessment.runs.length - 1})</span>
                          </button>

                          {isHistoryOpen && (
                            <div style={splitStyles.historyList}>
                              {assessment.runs.slice(1).map((run, idx) => {
                                const runScore = run.overall_score || 0;
                                const runColors = getScoreColor(runScore);
                                return (
                                  <div
                                    key={run.id}
                                    onClick={() => onViewRun(run.id, selectedBusiness!.id)}
                                    style={splitStyles.historyItem}
                                  >
                                    <span style={splitStyles.historyRun}>Run #{assessment.runs.length - idx - 1}</span>
                                    <span style={{ ...splitStyles.historyScore, color: runColors.text }}>{runScore}</span>
                                    <span style={splitStyles.historyDate}>{timeAgo(run.created_at)}</span>
                                    <span style={splitStyles.historyArrow}>→</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={splitStyles.noSelection}>
              <span>Select a business to view assessments</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Split-pane styles - Elegant master-detail layout
const splitStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  },
  subtitle: {
    fontSize: '13px',
    color: '#888888',
    margin: '0 0 16px 0',
  },
  // Split container
  splitContainer: {
    display: 'flex',
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E8E8E8',
    overflow: 'hidden',
    minHeight: '500px',
  },
  // Left panel - Business list
  leftPanel: {
    width: '280px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#FFFFFF',
  },
  panelHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #EEEEEE',
  },
  panelLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#999999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  businessList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '4px 0',
  },
  businessItemWrapper: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '12px 16px 12px 0',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  selectionIndicator: {
    width: '3px',
    alignSelf: 'stretch',
    borderRadius: '0 2px 2px 0',
    flexShrink: 0,
    marginRight: '12px',
  },
  businessLogo: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    flexShrink: 0,
    marginRight: '12px',
  },
  businessItemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    minWidth: 0,
  },
  businessName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1A1A1A',
  },
  businessMeta: {
    fontSize: '12px',
    color: '#888888',
  },
  businessScore: {
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  // Divider
  divider: {
    width: '1px',
    backgroundColor: '#EEEEEE',
    flexShrink: 0,
  },
  // Right panel - Assessments
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#FAFAFA',
    minWidth: 0,
  },
  selectedBusinessName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    display: 'block',
  },
  selectedBusinessMeta: {
    fontSize: '12px',
    color: '#888888',
    display: 'block',
    marginTop: '2px',
  },
  assessmentList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  assessmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E8E8E8',
    padding: '16px 20px',
  },
  assessmentHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
  },
  assessmentInfo: {
    flex: 1,
    minWidth: 0,
  },
  assessmentName: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#1A1A1A',
    margin: '0 0 4px 0',
  },
  assessmentMeta: {
    fontSize: '12px',
    color: '#888888',
  },
  runButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    flexShrink: 0,
  },
  miniSpinner: {
    width: '12px',
    height: '12px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  progressSection: {
    marginTop: '12px',
    padding: '12px 14px',
    backgroundColor: '#F0F7FF',
    borderRadius: '6px',
    border: '1px solid #CCE0FF',
  },
  progressBar: {
    height: '3px',
    backgroundColor: '#E0E0E0',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0969DA',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressMessage: {
    fontSize: '12px',
    color: '#0969DA',
    fontWeight: 500,
  },
  progressStep: {
    fontSize: '11px',
    color: '#666666',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '1px solid #EEEEEE',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  scoreDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  scoreValue: {
    fontSize: '22px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  scoreMax: {
    fontSize: '13px',
    color: '#AAAAAA',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  scoreBar: {
    width: '80px',
    height: '4px',
    backgroundColor: '#E8E8E8',
    borderRadius: '2px',
    overflow: 'hidden',
    marginLeft: '12px',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  runDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  flagBadge: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#9A6700',
    backgroundColor: '#FFF8C5',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  viewLink: {
    fontSize: '13px',
    color: '#888888',
    fontWeight: 500,
  },
  noRunsRow: {
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '1px solid #EEEEEE',
  },
  noRunsText: {
    fontSize: '13px',
    color: '#AAAAAA',
    fontStyle: 'italic' as const,
  },
  historySection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #EEEEEE',
  },
  historyToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#888888',
    fontWeight: 500,
  },
  historyList: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 10px',
    backgroundColor: '#F5F5F5',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  historyRun: {
    fontSize: '12px',
    color: '#666666',
  },
  historyScore: {
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  historyDate: {
    fontSize: '12px',
    color: '#999999',
    flex: 1,
  },
  historyArrow: {
    fontSize: '12px',
    color: '#CCCCCC',
  },
  noSelection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#AAAAAA',
    fontSize: '14px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 40px',
    textAlign: 'center' as const,
  },
  emptyIcon: {
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#666666',
    margin: '0 0 8px 0',
  },
  emptyText: {
    fontSize: '14px',
    color: '#999999',
    margin: '0',
  },
};

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

// Dummy data for the new dashboard design
const DUMMY_EXECUTIVE_SUMMARY = `Your organization excels at executing today's work but is blind to market shifts. Frontline workers see problems first but have learned to "keep their heads down" unless issues are safety-critical. This creates a dangerous gap: the people closest to operational reality are systematically excluded from shaping how work gets done.

The data reveals strong operational execution (Operational Strength: 62) but concerning gaps in adaptability (Future Readiness: 28). Multiple perception-reality contradictions suggest leadership may not have accurate visibility into actual organizational dynamics.`;

const DUMMY_KEY_ACTIONS: KeyActionType[] = [
  {
    title: 'Protect 10% exploration time for frontline teams to enable grassroots innovation',
    description: 'Carve out dedicated time each week where frontline workers can experiment with process improvements without performance pressure. Start with pilot teams and measure outcomes.',
    owner: 'Operations Director',
    timeline: '30 days',
    priority: 'critical' as const,
    impact: 'high' as const,
    effort: 'medium' as const,
  },
  {
    title: 'Establish skip-level sensing sessions to surface frontline insights directly to leadership',
    description: 'Create bi-weekly sessions where executives hear directly from frontline workers without middle management filtering. Focus on real problems and improvement ideas.',
    owner: 'CEO',
    timeline: '14 days',
    priority: 'high' as const,
    impact: 'high' as const,
    effort: 'low' as const,
  },
  {
    title: 'Conduct tool friction audit across teams to identify and eliminate workflow blockers',
    description: 'Systematically document where current tools create friction, manual workarounds, or data re-entry. Prioritize fixes based on time saved and frustration reduced.',
    owner: 'IT Lead',
    timeline: '45 days',
    priority: 'medium' as const,
    impact: 'medium' as const,
    effort: 'medium' as const,
  },
];

const DUMMY_CRITICAL_ISSUES = [
  {
    id: 'issue_1',
    title: 'The Invisible Innovation Gap',
    severity: 'critical',
    metrics: ['M2', 'M5', 'M8'],
    avgScore: 18,
    description: 'Your frontline workers see problems first but have zero capacity to solve them creatively. 95% of time is spent on prescribed tasks with no slack for improvement.',
    evidence: [
      { quote: "Pretty much all of it, like 95%. I'm here to do the work, not think about how to improve the work.", role: 'Field Technician' },
      { quote: "Risks and experiments happen higher up. We just do what we're told.", role: 'Field Technician' },
    ],
    rootCauses: ['Optimization Lock', 'Risk Paralysis'],
    businessImpact: 'Competitive vulnerability as market evolves',
  },
  {
    id: 'issue_2',
    title: 'Perception-Reality Gap in Collaboration',
    severity: 'warning',
    metrics: ['M1', 'M4'],
    avgScore: 42,
    description: 'Teams rate cross-team collaboration highly but describe isolated working patterns. This gap suggests leadership may have inaccurate visibility into actual team dynamics.',
    evidence: [
      { quote: "Don't really have cross-team meetings at my level. Coordination mostly happens above us.", role: 'Field Technician' },
    ],
    rootCauses: ['Information Flow Gap'],
    businessImpact: 'Missed alignment opportunities, duplicated efforts',
  },
];

const DUMMY_STRENGTHS = [
  {
    id: 'strength_1',
    title: 'Strong Operational Execution',
    metrics: ['M1', 'M4'],
    avgScore: 66,
    description: 'Your teams deliver reliably on current commitments. Work gets done, deadlines are met, and quality is maintained.',
    evidence: [
      { quote: "The core work is solid - climb up, fix things, climb down. We know what we're doing.", role: 'Field Technician' },
    ],
    opportunity: 'Leverage this foundation for controlled experimentation',
  },
  {
    id: 'strength_2',
    title: 'Safety Culture Foundation',
    metrics: ['M6'],
    avgScore: 72,
    description: 'Safety-critical concerns are taken seriously and can stop work when needed. This psychological safety around safety issues is a foundation to build on.',
    evidence: [
      { quote: "For immediate safety issues, yes, we can stop work and that's respected.", role: 'Field Technician' },
    ],
    opportunity: 'Extend this safety culture to include operational improvement ideas',
  },
];

// Dummy Metric Insights - narrative-focused per-metric descriptions (all 14 metrics)
const DUMMY_METRIC_INSIGHTS = [
  // OPERATIONAL STRENGTH
  {
    metric_code: 'M1',
    metric_name: 'Operational Strength',
    category: 'Operational Strength',
    executive_insight: 'Operational Strength scores 66/100 vs research target ≥65 (Helfat & Peteraf, 2003). You exceed the threshold by 2%. At this level, monitor for \'competency trap\' — strong execution can mask need for adaptation. Your current advantage is narrow and could erode without deliberate investment in adaptive capacity.',
    health_status: 'strong' as const,
    score: 66,
    summary: 'Your operational execution is a clear strength. Teams deliver reliably on commitments, and work quality remains consistent.',
    observations: [
      'Strong alignment between stated processes and actual practice',
      'Day-to-day task completion is reliable and predictable',
      'However, this strength may mask deeper rigidity — improvement opportunities go unexplored',
    ],
    evidence: [
      { quote: "The core work is solid. Climb up, fix things, climb down. We know what we're doing.", role: 'Field Technician', supports: 'strength' as const },
    ],
    ai_reasoning: {
      methodology: 'Analyzed 12 responses across questions measuring process adherence, task completion quality, and delivery reliability.',
      data_points_analyzed: 12,
      confidence_factors: ['High consistency across all frontline responses', 'Clear examples cited in multiple interviews'],
      key_signals: ['100% reported reliable task completion', '83% described clear process understanding', 'Zero missed delivery complaints mentioned'],
      limitations: ['Limited senior leadership perspective', 'No quantitative delivery metrics available'],
    },
    benchmark_narrative: "You're performing above industry median (66 vs 58) but below top-quartile performers (78+).",
    recommendations: [
      'Leverage this foundation to introduce controlled experiments',
      'Protect execution while creating space for small innovations',
    ],
    related_issue_ids: [],
    related_strength_ids: ['strength_1'],
    related_action_ids: [],
  },
  {
    metric_code: 'M4',
    metric_name: 'Implementation Speed',
    category: 'Operational Strength',
    health_status: 'developing' as const,
    score: 56,
    summary: 'Changes happen, but slowly. Approval processes and hierarchical decision-making create bottlenecks.',
    observations: [
      'Good ideas take months to move through approval chains',
      'Frontline can identify improvements but lacks authority to implement',
      'Speed is acceptable for routine work but too slow for adaptation',
    ],
    evidence: [
      { quote: "We can suggest things, but it goes up the chain and... you know, it takes time.", role: 'Field Technician', supports: 'gap' as const },
    ],
    ai_reasoning: {
      methodology: 'Evaluated responses about decision-making speed, approval processes, and time-to-implementation for improvements.',
      data_points_analyzed: 9,
      confidence_factors: ['Consistent complaints about approval delays', 'Multiple examples of slow implementation'],
      key_signals: ['Average reported approval time: 2-3 months', 'No examples of rapid iteration', 'Hierarchical approval cited as main bottleneck'],
      limitations: ['No comparison to actual project timelines', 'Self-reported estimates only'],
    },
    benchmark_narrative: "At 56, you're near the median but significantly behind agile organizations (75+).",
    recommendations: [
      'Delegate more decision authority to frontline teams',
      'Create fast-track approval for low-risk improvements',
    ],
    related_issue_ids: ['issue_2'],
    related_strength_ids: [],
    related_action_ids: [],
  },
  {
    metric_code: 'M7',
    metric_name: 'Resource Efficiency',
    category: 'Operational Strength',
    health_status: 'strong' as const,
    score: 72,
    summary: 'Resources are well-utilized for current operations. Teams make do with what they have.',
    observations: [
      'Strong culture of resourcefulness and making things work',
      'Good allocation of people to tasks based on skills',
      'However, efficiency focus may crowd out investment in new capabilities',
    ],
    evidence: [
      { quote: "We're pretty efficient. Everyone knows their job and gets on with it.", role: 'Field Technician', supports: 'strength' as const },
    ],
    ai_reasoning: {
      methodology: 'Assessed resource utilization patterns, skill-task matching, and efficiency culture indicators.',
      data_points_analyzed: 8,
      confidence_factors: ['Consistent positive efficiency narratives', 'No complaints about resource waste'],
      key_signals: ['High task ownership reported', 'Clear role definitions mentioned', 'Resourcefulness praised as cultural value'],
      limitations: ['No quantitative utilization metrics', 'May reflect optimization bias'],
    },
    benchmark_narrative: "You're performing well (72) against the 65 median. Top performers balance efficiency with slack for innovation.",
    recommendations: [
      'Maintain efficiency while protecting time for improvement work',
      'Ensure efficiency doesn\'t become a barrier to necessary investment',
    ],
    related_issue_ids: [],
    related_strength_ids: ['strength_1'],
    related_action_ids: [],
  },
  {
    metric_code: 'M10',
    metric_name: 'Quality Standards',
    category: 'Operational Strength',
    health_status: 'strong' as const,
    score: 68,
    summary: 'Quality is taken seriously. Clear standards exist and are generally followed.',
    observations: [
      'Strong quality culture especially for safety-critical work',
      'Standards are documented and understood',
      'Quality checks are embedded in workflows',
    ],
    evidence: [
      { quote: "Quality matters here. We don't cut corners on the important stuff.", role: 'Field Technician', supports: 'strength' as const },
    ],
    ai_reasoning: {
      methodology: 'Evaluated quality awareness, standards adherence, and quality culture indicators.',
      data_points_analyzed: 10,
      confidence_factors: ['Strong safety-quality link in responses', 'Consistent quality-first language'],
      key_signals: ['Zero tolerance for safety shortcuts mentioned', 'Quality checks described as routine', 'Pride in work quality evident'],
      limitations: ['No defect rate data available', 'Self-reported quality perceptions'],
    },
    benchmark_narrative: "At 68, you're above median (60) with room to reach excellence (80+).",
    recommendations: [
      'Extend quality mindset from safety-critical to all improvement work',
      'Create quality metrics for process improvements, not just outputs',
    ],
    related_issue_ids: [],
    related_strength_ids: ['strength_2'],
    related_action_ids: [],
  },
  // FUTURE READINESS
  {
    metric_code: 'M2',
    metric_name: 'Future Readiness',
    category: 'Future Readiness',
    executive_insight: 'Future Readiness scores 18/100 vs research target ≥60 (Teece, 2018). CRITICAL: 70% below the research target and below the critical threshold of 40. Your organization is operating blind to emerging threats and opportunities. This score correlates with strategic disruption risk in dynamic capabilities literature.',
    health_status: 'critical' as const,
    score: 18,
    summary: 'Your organization is optimized for today but dangerously blind to tomorrow.',
    observations: [
      '95% of frontline time is allocated to prescribed tasks with no slack',
      'Zero formal mechanisms for environmental scanning at operational levels',
      'Risk-taking is explicitly discouraged — experimentation happens "higher up"',
    ],
    evidence: [
      { quote: "Pretty much all of it, like 95%. No slack time for extras. I'm here to do the work, not think about how to improve the work.", role: 'Field Technician', supports: 'gap' as const },
      { quote: "Risks and experiments happen higher up. We just do what we're told.", role: 'Field Technician', supports: 'gap' as const },
    ],
    ai_reasoning: {
      methodology: 'Analyzed 28 responses across 3 questions (S1, RA1, X3b) that directly measure future-oriented thinking and scanning behavior.',
      data_points_analyzed: 28,
      confidence_factors: ['High response consistency across all frontline interviews', 'Multiple corroborating quotes', 'Clear pattern across different question types'],
      key_signals: ['95% time allocation to prescribed tasks (X3b)', 'Zero examples of environmental scanning at frontline (S1)', 'All risk-taking examples cited were senior-level (RA1)'],
      limitations: ['Only frontline roles represented', 'No external market data to validate competitive position', 'Senior leadership perspective not captured'],
    },
    benchmark_narrative: "Your score of 18 is significantly below industry median of 45. Top-quartile organizations score 72+ by protecting exploration time.",
    recommendations: [
      'Protect 10% exploration time for frontline teams',
      'Establish simple "signal surfacing" mechanisms',
      'Recognize and reward small experiments, even failures',
    ],
    related_issue_ids: ['issue_1'],
    related_strength_ids: [],
    related_action_ids: ['action_1'],
  },
  {
    metric_code: 'M5',
    metric_name: 'Market Radar',
    category: 'Future Readiness',
    executive_insight: 'Market Radar scores 0/100 vs research target ≥60 (Teece, 2007). CRITICAL: 100% below threshold. Scores below 40 indicate strategic blind spots. Your teams have zero systematic market sensing — competitive signals are invisible until they become crises. Action required within 30 days.',
    health_status: 'critical' as const,
    score: 0,
    summary: 'Your frontline has zero visibility into market shifts or competitive dynamics.',
    observations: [
      'Market intelligence stays at senior levels and doesn\'t reach operators',
      'No mechanisms for frontline to surface customer or competitor signals',
      'People find out about problems "when standing in front of them"',
    ],
    evidence: [
      { quote: "Market stuff I don't really see from my level. That's more senior management territory.", role: 'Field Technician', supports: 'gap' as const },
    ],
    ai_reasoning: {
      methodology: 'Evaluated market awareness, competitive intelligence access, and signal-sharing behaviors.',
      data_points_analyzed: 6,
      confidence_factors: ['Complete absence of market awareness at frontline', 'Unanimous responses indicating information gap'],
      key_signals: ['Zero market information reaching frontline', 'No formal or informal signal-sharing described', 'Market awareness explicitly delegated to "management"'],
      limitations: ['Small sample size for this specific metric', 'No management perspective to contrast'],
    },
    benchmark_narrative: "A score of 0 indicates complete absence of frontline market sensing. Industry leaders score 60+ through systematic signal-sharing.",
    recommendations: [
      'Create bi-weekly "signal sharing" sessions across levels',
      'Establish simple channels for frontline to report market observations',
    ],
    related_issue_ids: ['issue_1'],
    related_strength_ids: [],
    related_action_ids: ['action_2'],
  },
  {
    metric_code: 'M8',
    metric_name: 'Innovation Capacity',
    category: 'Future Readiness',
    health_status: 'attention' as const,
    score: 24,
    summary: 'Frontline has no time, permission, or mechanisms for creative problem-solving.',
    observations: [
      'Time allocation is 95%+ on prescribed tasks',
      'Innovation is seen as "not their job" at operational levels',
      'Good ideas exist but have no pathway to implementation',
    ],
    evidence: [
      { quote: "We have ideas, sure. But there's no time or place to do anything about them.", role: 'Field Technician', supports: 'gap' as const },
    ],
    ai_reasoning: {
      methodology: 'Assessed innovation time allocation, idea generation mechanisms, and implementation pathways.',
      data_points_analyzed: 11,
      confidence_factors: ['Consistent time-pressure complaints', 'Ideas exist but lack outlet'],
      key_signals: ['<5% time available for non-prescribed work', 'No formal idea capture system mentioned', 'Innovation attributed to "other levels"'],
      limitations: ['No data on actual ideas generated', 'Self-reported time estimates'],
    },
    benchmark_narrative: "At 24, you're well below the 52 median. Top performers create structured 'innovation time' for all levels.",
    recommendations: [
      'Pilot a "20% time" program with one team',
      'Create a simple idea submission and tracking system',
    ],
    related_issue_ids: ['issue_1'],
    related_strength_ids: [],
    related_action_ids: ['action_1'],
  },
  {
    metric_code: 'M11',
    metric_name: 'Adaptability',
    category: 'Future Readiness',
    health_status: 'attention' as const,
    score: 32,
    summary: 'The organization can respond to change, but only through top-down directives, not organic adaptation.',
    observations: [
      'Change happens when mandated from above',
      'Frontline waits for instructions rather than adapting proactively',
      'Resilience exists but is reactive, not anticipatory',
    ],
    evidence: [
      { quote: "When things change, we wait for the new procedure. That's how it works.", role: 'Field Technician', supports: 'gap' as const },
    ],
    ai_reasoning: {
      methodology: 'Evaluated change response patterns, proactive vs reactive adaptation, and adaptation speed.',
      data_points_analyzed: 8,
      confidence_factors: ['Consistent "wait for instructions" pattern', 'No proactive adaptation examples'],
      key_signals: ['Adaptation only through formal procedure changes', 'No local adaptation authority', 'Reactive stance described as normal'],
      limitations: ['No data on actual change events', 'May underestimate informal adaptation'],
    },
    benchmark_narrative: "At 32, you trail the 55 median. Adaptable organizations score 70+ through distributed adaptation authority.",
    recommendations: [
      'Empower teams to make local adaptations within guardrails',
      'Create "adaptation retrospectives" after change events',
    ],
    related_issue_ids: ['issue_1'],
    related_strength_ids: [],
    related_action_ids: [],
  },
  // CULTURAL HEALTH
  {
    metric_code: 'M3',
    metric_name: 'Insight-to-Action',
    category: 'Cultural Health',
    health_status: 'attention' as const,
    score: 34,
    summary: 'Insights are generated but rarely translate into action. Good observations die in the system.',
    observations: [
      'People notice problems and opportunities but lack pathways to act',
      'Suggestions go "up the chain" and disappear',
      'Learned helplessness about driving change',
    ],
    evidence: [
      { quote: "I've suggested things before. Nothing really happens. You learn to just do your job.", role: 'Field Technician', supports: 'gap' as const },
    ],
    ai_reasoning: {
      methodology: 'Tracked insight generation, suggestion outcomes, and action-taking patterns.',
      data_points_analyzed: 14,
      confidence_factors: ['Multiple "suggestions go nowhere" examples', 'Resignation language detected'],
      key_signals: ['High insight generation, low action conversion', 'No feedback loops described', 'Learned helplessness patterns evident'],
      limitations: ['No tracking of actual suggestion outcomes', 'Perception-based assessment'],
    },
    benchmark_narrative: "At 34, you're below the 50 median. High-performing cultures score 70+ by closing the insight-to-action loop.",
    recommendations: [
      'Create visible feedback loops for suggestions',
      'Track and report on suggestion outcomes monthly',
    ],
    related_issue_ids: ['issue_2'],
    related_strength_ids: [],
    related_action_ids: ['action_2'],
  },
  {
    metric_code: 'M6',
    metric_name: 'Psychological Safety',
    category: 'Cultural Health',
    health_status: 'developing' as const,
    score: 42,
    summary: 'Safety-critical concerns are taken seriously, but speaking up about operational improvements is risky.',
    observations: [
      'Physical safety concerns can stop work — this is respected',
      'However, suggesting process improvements or questioning decisions feels unsafe',
      'People have learned to "keep their heads down" on non-safety issues',
    ],
    evidence: [
      { quote: "For immediate safety issues, yes, we can stop work and that's respected.", role: 'Field Technician', supports: 'strength' as const },
    ],
    ai_reasoning: {
      methodology: 'Assessed speaking-up behaviors across different domains: safety, process, and strategic.',
      data_points_analyzed: 15,
      confidence_factors: ['Clear bifurcation between safety and non-safety voice', 'Consistent "keep head down" language'],
      key_signals: ['100% safety-voice confidence', '<30% process-improvement voice confidence', 'Self-censorship on non-safety topics'],
      limitations: ['Limited examples of actual speaking-up outcomes', 'May reflect individual rather than systemic patterns'],
    },
    benchmark_narrative: "You're at 42 vs industry median of 55. The gap suggests safety culture hasn't extended to operational voice.",
    recommendations: [
      'Extend the safety culture model to include improvement ideas',
      'Create safe channels for anonymous operational feedback',
    ],
    related_issue_ids: [],
    related_strength_ids: ['strength_2'],
    related_action_ids: [],
  },
  {
    metric_code: 'M9',
    metric_name: 'Learning Culture',
    category: 'Cultural Health',
    health_status: 'strong' as const,
    score: 64,
    summary: 'Learning from mistakes happens, especially for safety incidents. Broader learning culture is less developed.',
    observations: [
      'Safety incidents trigger thorough review and learning',
      'Operational learning is more ad-hoc and informal',
      'Knowledge sharing between teams is limited',
    ],
    evidence: [
      { quote: "After any safety incident, we do a proper review. Everyone learns from it.", role: 'Field Technician', supports: 'strength' as const },
    ],
    ai_reasoning: {
      methodology: 'Evaluated learning behaviors, knowledge sharing, and post-incident review practices.',
      data_points_analyzed: 12,
      confidence_factors: ['Strong safety-learning connection', 'Learning mechanisms exist but are narrow'],
      key_signals: ['Structured safety learning in place', 'Informal operational learning only', 'Limited cross-team knowledge flow'],
      limitations: ['No data on learning outcomes', 'May overweight safety-learning due to prominence'],
    },
    benchmark_narrative: "At 64, you're above median (55). Extending safety-learning practices to operations could reach 80+.",
    recommendations: [
      'Apply safety incident review practices to operational challenges',
      'Create regular cross-team learning sessions',
    ],
    related_issue_ids: [],
    related_strength_ids: ['strength_2'],
    related_action_ids: [],
  },
  {
    metric_code: 'M12',
    metric_name: 'Collaboration Quality',
    category: 'Cultural Health',
    health_status: 'developing' as const,
    score: 48,
    summary: 'Teams work well internally but cross-team collaboration is limited and mostly top-down coordinated.',
    observations: [
      'Strong within-team cooperation and support',
      'Cross-team interaction happens mainly through management',
      'Siloed knowledge and limited horizontal communication',
    ],
    evidence: [
      { quote: "Within my team, we're solid. Other teams... we don't really interact much.", role: 'Field Technician', supports: 'gap' as const },
    ],
    ai_reasoning: {
      methodology: 'Assessed within-team and cross-team collaboration patterns and quality.',
      data_points_analyzed: 10,
      confidence_factors: ['Clear internal/external collaboration gap', 'Consistent silo descriptions'],
      key_signals: ['High within-team trust', 'Low cross-team interaction', 'Management as primary coordination mechanism'],
      limitations: ['Limited data on actual collaboration outcomes', 'May reflect role constraints'],
    },
    benchmark_narrative: "At 48, you're near median (50) but below collaborative organizations (70+).",
    recommendations: [
      'Create regular cross-team touchpoints at frontline level',
      'Establish peer networks across team boundaries',
    ],
    related_issue_ids: ['issue_2'],
    related_strength_ids: [],
    related_action_ids: [],
  },
  // RESOURCE CAPABILITY
  {
    metric_code: 'M13',
    metric_name: 'Skills & Capabilities',
    category: 'Resource Capability',
    health_status: 'strong' as const,
    score: 70,
    summary: 'Teams have the skills needed for current work. Future capability development is less clear.',
    observations: [
      'Strong technical skills for existing operations',
      'Good training for current role requirements',
      'Less investment in emerging or future-oriented skills',
    ],
    evidence: [
      { quote: "We're well trained for what we do. The company invests in that.", role: 'Field Technician', supports: 'strength' as const },
    ],
    ai_reasoning: {
      methodology: 'Evaluated current skill adequacy, training investment, and future capability preparation.',
      data_points_analyzed: 9,
      confidence_factors: ['Consistent skill confidence for current work', 'Training investment acknowledged'],
      key_signals: ['High current-skill confidence', 'Training focused on existing role', 'No future-skill development mentioned'],
      limitations: ['Self-assessed skill levels', 'No skills gap analysis data'],
    },
    benchmark_narrative: "At 70, you're above median (62). Future-ready organizations invest equally in emerging skills (80+).",
    recommendations: [
      'Assess emerging skill needs for next 3-5 years',
      'Create development pathways for future capabilities',
    ],
    related_issue_ids: [],
    related_strength_ids: [],
    related_action_ids: [],
  },
  {
    metric_code: 'M14',
    metric_name: 'Tools & Technology',
    category: 'Resource Capability',
    health_status: 'developing' as const,
    score: 52,
    summary: 'Tools work for current needs but create friction. Technology is adequate, not enabling.',
    observations: [
      'Basic tools are in place and functional',
      'Technology creates friction rather than removing it',
      'Limited technology for improvement or innovation support',
    ],
    evidence: [
      { quote: "The tools do the job. Could they be better? Sure. But they work.", role: 'Field Technician', supports: 'context' as const },
    ],
    ai_reasoning: {
      methodology: 'Assessed tool adequacy, technology friction, and enablement vs burden balance.',
      data_points_analyzed: 7,
      confidence_factors: ['Consistent "adequate but not great" sentiment', 'Friction examples provided'],
      key_signals: ['Basic functionality confirmed', 'Improvement friction mentioned', 'No technology as enabler examples'],
      limitations: ['Limited specific tool feedback', 'No comparison to alternatives'],
    },
    benchmark_narrative: "At 52, you're at median. Technology-enabled organizations score 75+ by removing friction.",
    recommendations: [
      'Conduct a "tool friction audit" with frontline teams',
      'Prioritize technology investments that remove friction',
    ],
    related_issue_ids: [],
    related_strength_ids: [],
    related_action_ids: ['action_3'],
  },
];

// Helper to get health status color and label
const getHealthStatus = (status: string) => {
  switch (status) {
    case 'exceptional': return { color: '#1A7F37', bg: 'rgba(52, 199, 89, 0.10)', label: 'Exceptional' };
    case 'strong': return { color: '#0969DA', bg: 'rgba(0, 122, 255, 0.10)', label: 'Strong' };
    case 'developing': return { color: '#9A6700', bg: 'rgba(255, 149, 0, 0.10)', label: 'Developing' };
    case 'attention': return { color: '#CF222E', bg: 'rgba(255, 59, 48, 0.10)', label: 'Attention' };
    case 'critical': return { color: '#CF222E', bg: 'rgba(255, 59, 48, 0.12)', label: 'Critical' };
    default: return { color: '#86868B', bg: 'rgba(0, 0, 0, 0.05)', label: 'Unknown' };
  }
};

type SummaryTabType = 'issues' | 'strengths' | 'sources';

// Type for critical issues from API
type CriticalIssueType = {
  title: string;
  severity: 'critical' | 'warning';
  metrics: string[];
  avg_score?: number;
  description: string;
  evidence: Array<{ quote: string; role: string }>;
  root_causes: string[];
  business_impact: string;
};

// Type for strengths from API
type StrengthType = {
  title: string;
  metrics: string[];
  avg_score?: number;
  description: string;
  evidence: Array<{ quote: string; role: string }>;
  opportunity: string;
};

// Type for key actions from API
type KeyActionType = {
  title: string;
  description: string;
  owner: string;
  timeline: string;
  priority: 'critical' | 'high' | 'medium';
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
};

// Type for refined metric insights (from API or dummy data)
// Research benchmarks for executive insight display (from CABAS Business Language Guide Section 9)
const RESEARCH_BENCHMARKS: Record<string, { target: number; critical: number; source: string }> = {
  M1:  { target: 65, critical: 45, source: 'Helfat & Peteraf (2003)' },
  M2:  { target: 60, critical: 40, source: 'Teece (2018)' },
  M3:  { target: 65, critical: 45, source: 'Argyris & Schön' },
  M4:  { target: 60, critical: 40, source: 'Eisenhardt (1989)' },
  M5:  { target: 60, critical: 40, source: 'Teece (2007)' },
  M6:  { target: 60, critical: 40, source: 'March & Simon' },
  M7:  { target: 55, critical: 35, source: 'Grant (1996)' },
  M8:  { target: 60, critical: 40, source: 'Boyd OODA Loop' },
  M9:  { target: 75, critical: 45, source: 'March (1991)' },
  M10: { target: 60, critical: 40, source: 'Edmondson (1999)' },
  M11: { target: 60, critical: 40, source: 'O\'Reilly & Tushman' },
  M12: { target: 55, critical: 35, source: 'Barney (1991)' },
  M13: { target: 50, critical: 30, source: 'Barney RBV' },
  M14: { target: 55, critical: 35, source: 'Mission Command' },
};

type MetricInsight = {
  metric_code: string;
  metric_name: string;
  category: string;
  health_status: 'strong' | 'developing' | 'attention' | 'critical';
  score: number;
  executive_insight?: string;
  summary: string;
  observations: string[];
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
  recommendations: string[];
  // Optional fields for issue/action linking (may not be present in API data)
  related_issue_ids?: string[];
  related_action_ids?: string[];
};

function RunSummaryView({
  run,
  scores,
  businessName,
  onBack,
  onViewBreakdown,
  onViewInterview,
  onOpenChat,
}: {
  run: EvaluationRunDetail;
  scores: EvaluationScoresResponse | null;
  businessName?: string;
  onBack: () => void;
  onViewBreakdown: () => void;
  onViewInterview: (sourceId: string) => void;
  onOpenChat: () => void;
}) {
  const [activeTab, setActiveTab] = useState<SummaryTabType>('issues');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [expandedAIReasoning, setExpandedAIReasoning] = useState<string | null>(null);
  const [showStrategicReasoning, setShowStrategicReasoning] = useState(false);
  const [showSummaryReasoning, setShowSummaryReasoning] = useState(false);
  const [showActionsReasoning, setShowActionsReasoning] = useState(false);
  const [expandedActionIndex, setExpandedActionIndex] = useState<number | null>(null);
  const [showFullExecutiveSummary, setShowFullExecutiveSummary] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle report download
  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      await adminApi.downloadReport(run.id, businessName);
    } catch (error) {
      console.error('Failed to download report:', error);
      // Could add toast notification here
    } finally {
      setIsDownloading(false);
    }
  };

  // State for refined report
  const [refinedReport, setRefinedReport] = useState<{
    metrics: MetricInsight[];
    executive_summary: string;
    key_actions: KeyActionType[];
    critical_issues: CriticalIssueType[];
    strengths: StrengthType[];
  } | null>(null);
  const [refinedReportLoading, setRefinedReportLoading] = useState(true);

  // Fetch refined report when run changes
  useEffect(() => {
    const fetchRefinedReport = async () => {
      if (!run?.id) return;

      setRefinedReportLoading(true);
      try {
        const response = await adminApi.getRefinedReport(run.id);
        if (response?.report) {
          // Normalize critical_issues: handle both old (string[]) and new (object[]) formats
          const normalizedIssues: CriticalIssueType[] = (response.report.critical_issues || []).map((issue: CriticalIssueType | string) => {
            if (typeof issue === 'string') {
              // Convert old string format to rich object
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
            return issue;
          });

          // Normalize strengths: handle both old (string[]) and new (object[]) formats
          const normalizedStrengths: StrengthType[] = (response.report.strengths || []).map((strength: StrengthType | string) => {
            if (typeof strength === 'string') {
              // Convert old string format to rich object
              return {
                title: strength.length > 50 ? strength.substring(0, 50) + '...' : strength,
                metrics: [],
                description: strength,
                evidence: [],
                opportunity: '',
              };
            }
            return strength;
          });

          // Normalize key_actions: handle both old (string[]) and new (object[]) formats
          const normalizedActions: KeyActionType[] = (response.report.key_actions || []).map((action: KeyActionType | string) => {
            if (typeof action === 'string') {
              // Convert old string format to rich object - use full string as title
              return {
                title: action,
                description: '',
                owner: '',
                timeline: '',
                priority: 'medium' as const,
                impact: 'medium' as const,
                effort: 'medium' as const,
              };
            }
            return action;
          });

          setRefinedReport({
            metrics: response.report.metrics || [],
            executive_summary: response.report.executive_summary || '',
            key_actions: normalizedActions,
            critical_issues: normalizedIssues,
            strengths: normalizedStrengths,
          });
        }
      } catch (err) {
        // If no refined report exists, we'll use dummy data
        setRefinedReport(null);
      } finally {
        setRefinedReportLoading(false);
      }
    };

    fetchRefinedReport();
  }, [run?.id, run?.status]); // Re-fetch when status changes (e.g., processing -> completed)

  // Use refined report metrics if available, otherwise fallback to dummy data
  const metricInsights: MetricInsight[] = refinedReport?.metrics?.length
    ? refinedReport.metrics
    : DUMMY_METRIC_INSIGHTS;

  const statusColor = getStatusColor(run.status);
  const totalFlags = run.flags?.filter(f => !f.is_resolved) || [];

  // Get aggregated metrics
  const aggregatedMetrics = getAggregatedMetrics(scores?.metric_scores || []);
  const sortedMetrics = sortMetricsByNumber(aggregatedMetrics);

  // Helper to get individual metric score by code
  const getMetricScore = (code: string): number => {
    const metric = sortedMetrics.find(m => m.metric_code === code);
    return metric?.overall_score || 0;
  };

  // Weighted composite: Operational Strength (X-axis)
  // X = (M1 × 0.40) + (M4 × 0.20) + (M9 × 0.15) + (M11 × 0.15) + (M8 × 0.10)
  const operationalStrength = sortedMetrics.length > 0
    ? Math.round(
        (getMetricScore('M1') * 0.40) +
        (getMetricScore('M4') * 0.20) +
        (getMetricScore('M9') * 0.15) +
        (getMetricScore('M11') * 0.15) +
        (getMetricScore('M8') * 0.10)
      )
    : 0;

  // Weighted composite: Future Readiness (Y-axis)
  // Y = (M2 × 0.40) + (M5 × 0.20) + (M3 × 0.15) + (M14 × 0.15) + (M10 × 0.10)
  const futureReadiness = sortedMetrics.length > 0
    ? Math.round(
        (getMetricScore('M2') * 0.40) +
        (getMetricScore('M5') * 0.20) +
        (getMetricScore('M3') * 0.15) +
        (getMetricScore('M14') * 0.15) +
        (getMetricScore('M10') * 0.10)
      )
    : 0;

  // Overall = average of both axes
  const avgScore = sortedMetrics.length > 0
    ? Math.round((operationalStrength + futureReadiness) / 2)
    : 0;

  // Gap = X - Y (positive = stronger operational, negative = stronger future readiness)
  const pointGap = operationalStrength - futureReadiness;

  // Determine quadrant
  const getQuadrant = (opStrength: number, futReady: number) => {
    if (opStrength >= 50 && futReady >= 50) return { name: 'Adaptive Leader', color: '#1A7F37' };
    if (opStrength >= 50 && futReady < 50) return { name: 'Solid Performer', color: '#C65D07' };
    if (opStrength < 50 && futReady >= 50) return { name: 'Scattered Experimenter', color: '#0969DA' };
    return { name: 'At-Risk', color: '#CF222E' };
  };

  const quadrant = getQuadrant(operationalStrength, futureReadiness);

  const dashStyles = dashboardStyles;

  return (
    <div style={dashStyles.container}>
      {/* Header */}
      <div style={dashStyles.header}>
        {/* Top row: Back button on left, disclaimer on right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '16px' }}>
          <button onClick={onBack} style={dashStyles.backButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Runs
          </button>

          {/* AI Disclaimer */}
          <span style={{
            fontSize: '13px',
            color: 'rgba(60, 60, 67, 0.45)',
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}>
            Eunice can make mistakes—please review carefully.
          </span>
        </div>

        <div style={dashStyles.headerMain}>
          <div style={dashStyles.headerLeft}>
            <h1 style={dashStyles.title}>Evaluation Summary</h1>
            <p style={dashStyles.subtitle}>
              Run #{run.run_number} • {formatDateTime(run.started_at)} • {run.sources?.length || 0} data source{(run.sources?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={dashStyles.headerRight}>
            <span style={{ ...dashStyles.statusBadge, background: statusColor.bg, color: statusColor.text }}>
              {run.status}
            </span>
            {/* Ask Eunice Button - Animated Gradient Border */}
            <div className="ask-eunice-wrapper">
              <button
                className="ask-eunice-btn"
                onClick={onOpenChat}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <SiriOrb size={28} isSpeaking={false} isListening={true} />
                </div>
                <span style={{ color: '#1D1D1F' }}>Ask Eunice</span>
              </button>
            </div>
            <button
              style={dashStyles.downloadButton}
              onClick={handleDownloadReport}
              disabled={isDownloading || run.status !== 'completed'}
            >
              {isDownloading ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid currentColor',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              )}
              {isDownloading ? 'Downloading...' : 'Download Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Processing Banner - shows when evaluation is still running */}
      {(run.status === 'processing' || run.status === 'pending') && (
        <div style={{
          background: 'linear-gradient(90deg, #EFF6FF 0%, #DBEAFE 100%)',
          border: '1px solid #93C5FD',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #3B82F6',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: '#1E40AF', fontSize: '14px' }}>
              Evaluation in Progress
            </p>
            <p style={{ margin: '4px 0 0 0', color: '#3B82F6', fontSize: '13px' }}>
              Processing responses and generating insights... This page will update automatically when complete.
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Two Column Layout: Strategic Position + Executive Summary */}
      <div style={dashStyles.twoColumnGrid}>
        {/* Strategic Position Quadrant */}
        <div style={dashStyles.quadrantCard}>
          <h3 style={dashStyles.cardTitle}>Strategic Position</h3>

          <div style={dashStyles.quadrantContainer}>
            {/* Quadrant Grid */}
            <div style={dashStyles.quadrantGrid}>
              {/* Y-axis label */}
              <div style={dashStyles.yAxisLabel}>
                <span style={dashStyles.axisText}>Future Readiness</span>
              </div>

              {/* Quadrant boxes */}
              <div style={dashStyles.quadrantBoxes}>
                <div style={{ ...dashStyles.quadrantBox, ...dashStyles.quadrantTL }}>
                  <span style={dashStyles.quadrantLabel}>Scattered Experimenter</span>
                </div>
                <div style={{ ...dashStyles.quadrantBox, ...dashStyles.quadrantTR }}>
                  <span style={dashStyles.quadrantLabel}>Adaptive Leader</span>
                </div>
                <div style={{ ...dashStyles.quadrantBox, ...dashStyles.quadrantBL }}>
                  <span style={dashStyles.quadrantLabel}>At-Risk</span>
                </div>
                <div style={{ ...dashStyles.quadrantBox, ...dashStyles.quadrantBR }}>
                  <span style={dashStyles.quadrantLabel}>Solid Performer</span>
                </div>

                {/* Position dot */}
                <div style={{
                  ...dashStyles.positionDot,
                  left: `${operationalStrength}%`,
                  bottom: `${futureReadiness}%`,
                }} />
              </div>

              {/* X-axis label */}
              <div style={dashStyles.xAxisLabel}>
                <span style={dashStyles.axisText}>Operational Strength</span>
              </div>
            </div>
          </div>

          {/* Quadrant Result */}
          <div style={dashStyles.quadrantResult}>
            <span style={{ ...dashStyles.quadrantResultLabel, color: quadrant.color }}>
              {quadrant.name}
            </span>
          </div>

          {/* Key Stats */}
          <div style={dashStyles.keyStatsRow}>
            <div style={dashStyles.keyStat}>
              <span style={dashStyles.keyStatValue}>{operationalStrength}</span>
              <span style={dashStyles.keyStatLabel}>Op. Strength</span>
            </div>
            <div style={dashStyles.keyStat}>
              <span style={dashStyles.keyStatValue}>{futureReadiness}</span>
              <span style={dashStyles.keyStatLabel}>Future Ready</span>
            </div>
            <div style={dashStyles.keyStat}>
              <span style={dashStyles.keyStatValue}>{pointGap > 0 ? '+' : ''}{pointGap}</span>
              <span style={dashStyles.keyStatLabel}>Gap</span>
            </div>
            <div style={dashStyles.keyStat}>
              <span style={dashStyles.keyStatValue}>{avgScore}</span>
              <span style={dashStyles.keyStatLabel}>Overall</span>
            </div>
          </div>

          {/* How we reached this conclusion */}
          <div style={dashStyles.reasoningToggleSection}>
            <button
              onClick={() => setShowStrategicReasoning(!showStrategicReasoning)}
              style={dashStyles.reasoningToggleBtn}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>How we reached this conclusion</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  marginLeft: '4px',
                  opacity: 0.5,
                  transform: showStrategicReasoning ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {showStrategicReasoning && (
              <div style={dashStyles.reasoningContent}>
                <p style={dashStyles.reasoningText}>
                  Strategic position is determined by a weighted composite of your 14 metric scores across two axes.
                  Operational Strength (X-axis) weighs execution capability, process maturity, and knowledge systems.
                  Future Readiness (Y-axis) weighs adaptive capacity, innovation culture, and strategic foresight.
                  Your "{quadrant.name}" positioning reflects {operationalStrength > futureReadiness
                    ? 'stronger current execution relative to adaptive capacity'
                    : operationalStrength < futureReadiness
                    ? 'stronger adaptive capacity relative to current execution'
                    : 'balanced capability across both dimensions'}.
                  {Math.abs(pointGap) > 15
                    ? ` The ${Math.abs(pointGap)}-point gap between axes signals a meaningful imbalance that warrants focused attention.`
                    : ` The ${Math.abs(pointGap)}-point gap suggests reasonable balance between operational and adaptive capabilities.`}
                </p>
                {(run.sources?.length || 0) <= 2 && (
                  <p style={{ ...dashStyles.reasoningText, marginTop: '8px', fontStyle: 'italic', color: 'rgba(60, 60, 67, 0.5)' }}>
                    Note: This assessment is based on {run.sources?.length || 0} respondent{(run.sources?.length || 0) !== 1 ? 's' : ''}. Results become more reliable with broader organizational input.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Executive Summary */}
        <div style={dashStyles.summaryCard}>
          <div style={dashStyles.summaryHeader}>
            <h3 style={dashStyles.cardTitle}>Executive Summary</h3>
            <button style={dashStyles.editButton}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          </div>

          {(() => {
            const summary = refinedReport?.executive_summary || DUMMY_EXECUTIVE_SUMMARY;
            const words = summary.split(/\s+/).filter(w => w.length > 0);
            const WORD_LIMIT = 100;
            const needsTruncation = words.length > WORD_LIMIT;
            const truncatedText = needsTruncation
              ? words.slice(0, WORD_LIMIT).join(' ') + '...'
              : summary;
            const displayText = showFullExecutiveSummary ? summary : truncatedText;

            return (
              <div style={{ margin: '0 0 20px 0' }}>
                <p
                  style={{
                    ...dashStyles.summaryText,
                    margin: 0,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  {displayText}
                </p>
                {needsTruncation && (
                  <button
                    onClick={() => setShowFullExecutiveSummary(!showFullExecutiveSummary)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1D1D1F',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: '8px 0 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {showFullExecutiveSummary ? 'See less' : 'See more'}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        transform: showFullExecutiveSummary ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })()}

          {/* Quick Stats */}
          <div style={dashStyles.quickStatsRow}>
            <div style={dashStyles.quickStat}>
              <span style={{ ...dashStyles.quickStatValue, color: (refinedReport?.critical_issues?.length || DUMMY_CRITICAL_ISSUES.length) > 0 ? '#CF222E' : '#1A7F37' }}>
                {refinedReport?.critical_issues?.length || DUMMY_CRITICAL_ISSUES.length}
              </span>
              <span style={dashStyles.quickStatLabel}>Critical Issues</span>
            </div>
            <div style={dashStyles.quickStat}>
              <span style={{ ...dashStyles.quickStatValue, color: '#1A7F37' }}>
                {refinedReport?.strengths?.length || DUMMY_STRENGTHS.length}
              </span>
              <span style={dashStyles.quickStatLabel}>Strengths</span>
            </div>
            <div style={dashStyles.quickStat}>
              <span style={dashStyles.quickStatValue}>
                {refinedReport?.key_actions?.length || DUMMY_KEY_ACTIONS.length}
              </span>
              <span style={dashStyles.quickStatLabel}>Actions</span>
            </div>
            <div style={dashStyles.quickStat}>
              <span style={{ ...dashStyles.quickStatValue, color: totalFlags.length > 0 ? '#9A6700' : '#1A7F37' }}>
                {totalFlags.length}
              </span>
              <span style={dashStyles.quickStatLabel}>Flags</span>
            </div>
          </div>

          {/* How we reached this conclusion */}
          <div style={dashStyles.reasoningToggleSection}>
            <button
              onClick={() => setShowSummaryReasoning(!showSummaryReasoning)}
              style={dashStyles.reasoningToggleBtn}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>How we reached this conclusion</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  marginLeft: '4px',
                  opacity: 0.5,
                  transform: showSummaryReasoning ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {showSummaryReasoning && (
              <div style={dashStyles.reasoningContent}>
                <p style={dashStyles.reasoningText}>
                  This executive summary synthesizes insights from {sortedMetrics.length} metrics across {run.sources?.length || 'multiple'} data sources.
                  Critical issues are flagged based on scores below 50% or significant gaps between related metrics.
                  Strengths represent areas scoring above 70% with consistent performance across dimensions.
                  The analysis weighs recency, source reliability, and cross-validation between interview responses.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Actions Section */}
      <div style={dashStyles.actionsSection}>
        <div style={dashStyles.actionsSectionHeader}>
          <h3 style={dashStyles.sectionTitle}>Key Actions to Take</h3>
          <button style={dashStyles.addButton}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Action
          </button>
        </div>

        <style>{`
          @keyframes slideInFromRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>

        <div style={dashStyles.actionsList}>
          {/* Use refined report key_actions if available, otherwise fallback to dummy data */}
          {(refinedReport?.key_actions?.length ? refinedReport.key_actions : DUMMY_KEY_ACTIONS).map((action, index) => {
            const priorityColors = {
              critical: { bg: '#FEE2E2', text: '#DC2626', dot: '#DC2626' },
              high: { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' },
              medium: { bg: '#DBEAFE', text: '#2563EB', dot: '#3B82F6' },
              low: { bg: '#D1FAE5', text: '#059669', dot: '#10B981' },
            };
            const pStyle = priorityColors[action.priority] || priorityColors.medium;

            return (
              <div
                key={index}
                onClick={() => setExpandedActionIndex(index)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px 20px',
                  backgroundColor: '#FAFAFA',
                  borderRadius: '10px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5F5F5';
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FAFAFA';
                  e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
                }}
              >
                {/* Priority Dot */}
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: pStyle.dot,
                  marginTop: '6px',
                  flexShrink: 0,
                }} />

                {/* Title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#1A1A1A',
                    lineHeight: 1.5,
                    display: 'block',
                  }}>
                    {action.title}
                  </span>
                </div>

                {/* Expand Icon */}
                <div style={{
                  color: '#999',
                  flexShrink: 0,
                  marginTop: '2px',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Details Side Drawer */}
        {expandedActionIndex !== null && (() => {
          const actions = refinedReport?.key_actions?.length ? refinedReport.key_actions : DUMMY_KEY_ACTIONS;
          const action = actions[expandedActionIndex];
          const priorityConfig = {
            critical: { bg: '#FEE2E2', text: '#DC2626', label: 'Critical' },
            high: { bg: '#FEF3C7', text: '#D97706', label: 'High' },
            medium: { bg: '#DBEAFE', text: '#2563EB', label: 'Medium' },
            low: { bg: '#D1FAE5', text: '#059669', label: 'Low' },
          };
          const pStyle = priorityConfig[action.priority] || priorityConfig.medium;

          return (
            <>
              {/* Backdrop */}
              <div
                onClick={() => setExpandedActionIndex(null)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.4)',
                  zIndex: 1000,
                  animation: 'fadeIn 0.2s ease',
                }}
              />

              {/* Drawer */}
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  right: 0,
                  width: '440px',
                  maxWidth: '90vw',
                  height: '100%',
                  background: '#FFFFFF',
                  boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.12)',
                  zIndex: 1001,
                  overflow: 'auto',
                  animation: 'slideInFromRight 0.25s ease',
                }}
              >
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  borderBottom: '1px solid #F0F0F0',
                }}>
                  <span style={{
                    background: pStyle.bg,
                    color: pStyle.text,
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                  }}>
                    {pStyle.label} Priority
                  </span>
                  <button
                    onClick={() => setExpandedActionIndex(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      color: '#999',
                      borderRadius: '6px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F5F5F5';
                      e.currentTarget.style.color = '#666';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#999';
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                  {/* Title */}
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#1A1A1A',
                    margin: '0 0 24px 0',
                    lineHeight: 1.5,
                    letterSpacing: '-0.01em',
                  }}>
                    {action.title}
                  </h3>

                  {/* Description */}
                  {action.description && (
                    <div style={{ marginBottom: '28px' }}>
                      <h4 style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#888',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: '0 0 10px 0',
                      }}>
                        Description
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: '#444',
                        lineHeight: 1.7,
                        margin: 0,
                      }}>
                        {action.description}
                      </p>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    padding: '20px',
                    background: '#FAFAFA',
                    borderRadius: '10px',
                    marginBottom: '24px',
                  }}>
                    {action.owner && (
                      <div>
                        <h4 style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#888',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          margin: '0 0 6px 0',
                        }}>
                          Owner
                        </h4>
                        <p style={{ fontSize: '14px', color: '#1A1A1A', margin: 0, fontWeight: 500 }}>
                          {action.owner}
                        </p>
                      </div>
                    )}
                    {action.timeline && (
                      <div>
                        <h4 style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#888',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          margin: '0 0 6px 0',
                        }}>
                          Timeline
                        </h4>
                        <p style={{ fontSize: '14px', color: '#1A1A1A', margin: 0, fontWeight: 500 }}>
                          {action.timeline}
                        </p>
                      </div>
                    )}
                    <div>
                      <h4 style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#888',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: '0 0 6px 0',
                      }}>
                        Impact
                      </h4>
                      <p style={{ fontSize: '14px', color: '#1A1A1A', margin: 0, fontWeight: 500, textTransform: 'capitalize' }}>
                        {action.impact}
                      </p>
                    </div>
                    <div>
                      <h4 style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#888',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: '0 0 6px 0',
                      }}>
                        Effort
                      </h4>
                      <p style={{ fontSize: '14px', color: '#1A1A1A', margin: 0, fontWeight: 500, textTransform: 'capitalize' }}>
                        {action.effort}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '20px 24px',
                  borderTop: '1px solid #F0F0F0',
                  background: '#FFFFFF',
                  display: 'flex',
                  gap: '12px',
                }}>
                  <button
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      background: '#1A1A1A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#1A1A1A'}
                  >
                    Mark as Started
                  </button>
                  <button
                    style={{
                      padding: '12px 20px',
                      background: '#FFFFFF',
                      color: '#666',
                      border: '1px solid #E0E0E0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#F5F5F5';
                      e.currentTarget.style.borderColor = '#CCC';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#E0E0E0';
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </>
          );
        })()}

        {/* How we reached this conclusion */}
        <div style={{ ...dashStyles.reasoningToggleSection, marginTop: '16px' }}>
          <button
            onClick={() => setShowActionsReasoning(!showActionsReasoning)}
            style={dashStyles.reasoningToggleBtn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>How we reached this conclusion</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                marginLeft: '4px',
                opacity: 0.5,
                transform: showActionsReasoning ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {showActionsReasoning && (
            <div style={dashStyles.reasoningContent}>
              <p style={dashStyles.reasoningText}>
                Key actions are prioritized using a weighted scoring model that considers: (1) potential business impact based on metric gaps,
                (2) feasibility given current resource capacity, (3) interdependencies between metrics, and (4) time-to-value.
                Critical actions address scores below 40% in high-impact areas. High-priority actions target the largest gaps between
                current state and industry benchmarks.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Metric Insights Section - McKinsey "Insight Headlines" Style */}
      <div style={dashStyles.metricInsightsSection}>
        <div style={dashStyles.metricInsightsHeader}>
          <h3 style={dashStyles.metricInsightsTitle}>Where You Stand</h3>
          <p style={dashStyles.metricInsightsSubtitle}>
            14 dimensions analyzed • Research-grounded scoring framework
          </p>
        </div>

        {/* Group metrics by category */}
        {refinedReportLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#86868B' }}>
            Loading refined insights...
          </div>
        ) : [
          { name: 'Operational Strength', subtitle: 'How well you execute today', codes: ['M1', 'M4', 'M7', 'M10'] },
          { name: 'Future Readiness', subtitle: 'How ready you are for tomorrow', codes: ['M2', 'M5', 'M8', 'M11'] },
          { name: 'Cultural Health', subtitle: 'How your people enable change', codes: ['M3', 'M6', 'M9', 'M12'] },
          { name: 'Resource Capability', subtitle: 'Whether you have what you need', codes: ['M13', 'M14'] },
        ].map((category) => {
          const categoryMetrics = metricInsights.filter(m => category.codes.includes(m.metric_code));
          if (categoryMetrics.length === 0) return null;

          // Calculate category average
          const categoryAvg = Math.round(categoryMetrics.reduce((sum, m) => sum + m.score, 0) / categoryMetrics.length);
          const categoryHealth = getHealthStatus(
            categoryAvg >= 70 ? 'strong' : categoryAvg >= 50 ? 'developing' : categoryAvg >= 30 ? 'attention' : 'critical'
          );

          return (
            <div key={category.name} style={dashStyles.metricInsightsCategorySection}>
              {/* Category Header */}
              <div style={dashStyles.metricInsightsCategoryHeader}>
                <span style={dashStyles.metricInsightsCategoryTitle}>{category.name}</span>
                <span style={{ ...dashStyles.metricInsightsCategoryAvg, color: categoryHealth.color }}>
                  Avg: {categoryAvg}
                </span>
              </div>

              {/* Metrics in this category - Insight Headlines */}
              <div style={dashStyles.metricInsightsList}>
                {categoryMetrics.map((insight, idx) => {
                  const health = getHealthStatus(insight.health_status);
                  const isExpanded = expandedMetric === insight.metric_code;
                  const isAIReasoningExpanded = expandedAIReasoning === insight.metric_code;
                  const isLastInCategory = idx === categoryMetrics.length - 1;

                  // Create mini health bar segments (10 segments)
                  const filledSegments = Math.round(insight.score / 10);

                  return (
                    <div
                      key={insight.metric_code}
                      style={{
                        ...dashStyles.metricInsightCard,
                        borderBottom: isLastInCategory ? 'none' : '1px solid #EEEEEE',
                      }}
                    >
                      {/* Insight Headline Row */}
                      <div
                        style={{
                          ...dashStyles.metricInsightCardHeader,
                          backgroundColor: isExpanded ? '#F7F7F7' : 'transparent',
                        }}
                        onClick={() => setExpandedMetric(isExpanded ? null : insight.metric_code)}
                      >
                        {/* Mini health bar - fills from bottom */}
                        <div style={dashStyles.metricInsightHealthBar}>
                          {[...Array(10)].map((_, i) => (
                            <div
                              key={i}
                              style={{
                                ...dashStyles.metricInsightHealthBarSegment,
                                backgroundColor: i >= (10 - filledSegments) ? health.color : '#E8E8E8',
                              }}
                            />
                          ))}
                        </div>

                        {/* Insight headline + metric name */}
                        <div style={dashStyles.metricInsightCardLeft}>
                          <h4 style={dashStyles.metricInsightHeadline}>{insight.summary}</h4>
                          <p style={dashStyles.metricInsightMetricName}>{insight.metric_name}</p>
                        </div>

                        {/* Status badge + chevron */}
                        <div style={dashStyles.metricInsightCardRight}>
                          <span style={{
                            ...dashStyles.metricInsightHealthBadge,
                            backgroundColor: health.bg,
                            color: health.color,
                          }}>
                            {health.label}
                          </span>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{
                              ...dashStyles.metricInsightChevron,
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </div>
                      </div>

                      {/* Expanded Content - Clean & Elegant */}
                      {isExpanded && (
                        <div style={dashStyles.metricInsightExpandedContent} onClick={(e) => e.stopPropagation()}>

                          {/* Executive Insight — First thing a CEO reads */}
                          {(() => {
                            const bm = RESEARCH_BENCHMARKS[insight.metric_code];
                            if (!bm && !insight.executive_insight) return null;

                            const gapPct = bm ? Math.round(Math.abs(insight.score - bm.target) / bm.target * 100) : 0;
                            const aboveTarget = bm ? insight.score >= bm.target : false;
                            const belowCritical = bm ? insight.score < bm.critical : false;

                            return (
                              <div style={dashStyles.executiveInsightSection}>
                                {/* Score vs Target bar */}
                                {bm && (
                                  <div style={dashStyles.executiveInsightBar}>
                                    <div style={dashStyles.executiveInsightBarTrack}>
                                      {/* Critical zone */}
                                      <div style={{
                                        position: 'absolute' as const,
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: `${bm.critical}%`,
                                        backgroundColor: 'rgba(248, 215, 218, 0.5)',
                                        borderRadius: '4px 0 0 4px',
                                      }} />
                                      {/* Target marker */}
                                      <div style={{
                                        position: 'absolute' as const,
                                        left: `${bm.target}%`,
                                        top: '-2px',
                                        bottom: '-2px',
                                        width: '2px',
                                        backgroundColor: '#86868B',
                                        zIndex: 2,
                                      }} />
                                      {/* Score fill */}
                                      <div style={{
                                        position: 'absolute' as const,
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: `${Math.min(insight.score, 100)}%`,
                                        backgroundColor: belowCritical ? '#CF222E' : aboveTarget ? '#1A7F37' : '#C65D07',
                                        borderRadius: '4px',
                                        opacity: 0.7,
                                        transition: 'width 0.6s ease',
                                      }} />
                                    </div>
                                    <div style={dashStyles.executiveInsightBarLabels}>
                                      <span style={{ fontSize: '10px', color: '#CF222E', fontWeight: 500 }}>
                                        Critical &lt;{bm.critical}
                                      </span>
                                      <span style={{ fontSize: '10px', color: '#86868B', fontWeight: 500 }}>
                                        Target ≥{bm.target} ({bm.source})
                                      </span>
                                      <span style={{
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: belowCritical ? '#CF222E' : aboveTarget ? '#1A7F37' : '#C65D07',
                                      }}>
                                        Score: {insight.score} ({aboveTarget ? `+${gapPct}%` : `-${gapPct}%`})
                                      </span>
                                    </div>
                                  </div>
                                )}

                                {/* LLM-generated executive insight text */}
                                {insight.executive_insight && (
                                  <p style={dashStyles.executiveInsightText}>
                                    {insight.executive_insight}
                                  </p>
                                )}
                              </div>
                            );
                          })()}

                          {/* Two Column Layout */}
                          <div style={dashStyles.metricExpandedGrid}>
                            {/* Left Column - What We Found */}
                            <div style={dashStyles.metricExpandedColumn}>
                              <span style={dashStyles.metricExpandedLabel}>What we found</span>
                              <div style={dashStyles.metricExpandedObsList}>
                                {insight.observations.map((obs, obsIdx) => (
                                  <p key={obsIdx} style={dashStyles.metricExpandedObsItem}>{obs}</p>
                                ))}
                              </div>

                              {/* Quote */}
                              {insight.evidence.slice(0, 1).map((ev, evIdx) => (
                                <div key={evIdx} style={dashStyles.metricExpandedQuote}>
                                  <p style={dashStyles.metricExpandedQuoteText}>"{ev.quote}"</p>
                                  <span style={dashStyles.metricExpandedQuoteSource}>{ev.role}</span>
                                </div>
                              ))}
                            </div>

                            {/* Right Column - What To Do */}
                            <div style={dashStyles.metricExpandedColumn}>
                              <span style={dashStyles.metricExpandedLabel}>What to consider</span>
                              <div style={dashStyles.metricExpandedRecList}>
                                {insight.recommendations.slice(0, 3).map((rec, recIdx) => (
                                  <div key={recIdx} style={dashStyles.metricExpandedRecItem}>
                                    <span style={dashStyles.metricExpandedRecNum}>{recIdx + 1}</span>
                                    <span style={dashStyles.metricExpandedRecText}>{rec}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Benchmark - subtle inline */}
                              {insight.benchmark_narrative && (
                                <p style={dashStyles.metricExpandedBenchmark}>
                                  {insight.benchmark_narrative}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* AI Reasoning - Minimal Toggle */}
                          {insight.ai_reasoning && (
                            <div style={dashStyles.metricExpandedAISection}>
                              <button
                                onClick={() => setExpandedAIReasoning(isAIReasoningExpanded ? null : insight.metric_code)}
                                style={dashStyles.metricExpandedAIToggle}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5">
                                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span>How we reached this conclusion</span>
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  style={{
                                    marginLeft: '4px',
                                    opacity: 0.5,
                                    transform: isAIReasoningExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease',
                                  }}
                                >
                                  <path d="M6 9l6 6 6-6" />
                                </svg>
                              </button>

                              {isAIReasoningExpanded && (
                                <div style={dashStyles.metricExpandedAIContent}>
                                  <div style={dashStyles.metricExpandedAIGrid}>
                                    {/* Methodology */}
                                    <div style={dashStyles.metricExpandedAIBlock}>
                                      <span style={dashStyles.metricExpandedAIBlockLabel}>Methodology</span>
                                      <p style={dashStyles.metricExpandedAIBlockText}>{insight.ai_reasoning.methodology}</p>
                                      <span style={dashStyles.metricExpandedAIBadge}>{insight.ai_reasoning.data_points_analyzed} data points analyzed</span>
                                    </div>

                                    {/* Key Signals */}
                                    <div style={dashStyles.metricExpandedAIBlock}>
                                      <span style={dashStyles.metricExpandedAIBlockLabel}>Key signals detected</span>
                                      {insight.ai_reasoning.key_signals.map((signal, i) => (
                                        <p key={i} style={dashStyles.metricExpandedAIListItem}>• {signal}</p>
                                      ))}
                                    </div>

                                    {/* Confidence */}
                                    <div style={dashStyles.metricExpandedAIBlock}>
                                      <span style={dashStyles.metricExpandedAIBlockLabel}>Confidence factors</span>
                                      {insight.ai_reasoning.confidence_factors.map((factor, i) => (
                                        <p key={i} style={{ ...dashStyles.metricExpandedAIListItem, color: '#1A7F37' }}>✓ {factor}</p>
                                      ))}
                                    </div>

                                    {/* Limitations */}
                                    <div style={dashStyles.metricExpandedAIBlock}>
                                      <span style={dashStyles.metricExpandedAIBlockLabel}>Limitations</span>
                                      {insight.ai_reasoning.limitations.map((lim, i) => (
                                        <p key={i} style={{ ...dashStyles.metricExpandedAIListItem, color: '#9A6700' }}>– {lim}</p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Footer with related links */}
                          {((insight.related_issue_ids?.length ?? 0) > 0 || (insight.related_action_ids?.length ?? 0) > 0) && (
                            <div style={dashStyles.metricInsightFooter}>
                              {(insight.related_issue_ids?.length ?? 0) > 0 && (
                                <span style={{
                                  ...dashStyles.metricInsightRelatedTag,
                                  backgroundColor: '#FEE2E2',
                                  color: '#B91C1C',
                                }}>
                                  Related Issue
                                </span>
                              )}
                              {(insight.related_action_ids?.length ?? 0) > 0 && (
                                <span style={{
                                  ...dashStyles.metricInsightRelatedTag,
                                  backgroundColor: '#DBEAFE',
                                  color: '#1D4ED8',
                                }}>
                                  Has Action
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabbed Content */}
      <div style={dashStyles.tabbedSection}>
        <div style={dashStyles.tabsHeader}>
          {[
            { id: 'issues', label: 'Critical Issues', count: refinedReport?.critical_issues?.length || DUMMY_CRITICAL_ISSUES.length },
            { id: 'strengths', label: 'Strengths', count: refinedReport?.strengths?.length || DUMMY_STRENGTHS.length },
            { id: 'sources', label: 'Data Sources', count: run.sources?.length || 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SummaryTabType)}
              style={{
                ...dashStyles.tab,
                ...(activeTab === tab.id ? dashStyles.tabActive : {}),
              }}
            >
              {tab.label}
              <span style={{
                ...dashStyles.tabCount,
                ...(activeTab === tab.id ? dashStyles.tabCountActive : {}),
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div style={dashStyles.tabContent}>
          {/* Critical Issues Tab */}
          {activeTab === 'issues' && (
            <div style={dashStyles.premiumList}>
              {refinedReport?.critical_issues?.length ? (
                // Real data from refined report (rich objects)
                refinedReport.critical_issues.map((issue, idx) => {
                  const isLast = idx === refinedReport.critical_issues.length - 1;
                  const severityColor = issue.severity === 'critical' ? '#CF222E' : '#9A6700';

                  return (
                    <div
                      key={`issue-${idx}`}
                      style={{
                        ...dashStyles.premiumCard,
                        borderBottom: isLast ? 'none' : '1px solid #EEEEEE',
                      }}
                    >
                      {/* Header Row */}
                      <div style={dashStyles.premiumCardHeader}>
                        {/* Severity indicator */}
                        <div style={{
                          ...dashStyles.premiumSeverityDot,
                          backgroundColor: severityColor,
                        }} />

                        {/* Title & Description */}
                        <div style={dashStyles.premiumCardMain}>
                          <h4 style={dashStyles.premiumCardTitle}>{issue.title}</h4>
                          <p style={dashStyles.premiumCardDesc}>{issue.description}</p>
                        </div>

                        {/* Metrics badge */}
                        <div style={dashStyles.premiumCardMeta}>
                          <span style={dashStyles.premiumMetricsBadge}>
                            {issue.metrics.join(' · ')}
                          </span>
                          {issue.avg_score !== undefined && (
                            <span style={{ ...dashStyles.premiumScoreBadge, color: severityColor }}>
                              {issue.avg_score}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Evidence & Context - Two Column */}
                      <div style={dashStyles.premiumCardBody}>
                        <div style={dashStyles.premiumCardColumn}>
                          <span style={dashStyles.premiumLabel}>Supporting Evidence</span>
                          {issue.evidence.slice(0, 1).map((ev, evIdx) => (
                            <div key={evIdx} style={dashStyles.premiumQuote}>
                              <p style={dashStyles.premiumQuoteText}>"{ev.quote}"</p>
                              <span style={dashStyles.premiumQuoteSource}>{ev.role}</span>
                            </div>
                          ))}
                        </div>

                        <div style={dashStyles.premiumCardColumn}>
                          <span style={dashStyles.premiumLabel}>Root Cause</span>
                          <div style={dashStyles.premiumTagsRow}>
                            {issue.root_causes.map((cause, cIdx) => (
                              <span key={cIdx} style={dashStyles.premiumTag}>{cause}</span>
                            ))}
                          </div>
                          <span style={{ ...dashStyles.premiumLabel, marginTop: '16px' }}>Business Impact</span>
                          <p style={dashStyles.premiumImpactText}>{issue.business_impact}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Fallback to dummy data (rich objects)
                DUMMY_CRITICAL_ISSUES.map((issue, idx) => {
                  const isLast = idx === DUMMY_CRITICAL_ISSUES.length - 1;
                  const severityColor = issue.severity === 'critical' ? '#CF222E' : '#9A6700';

                  return (
                    <div
                      key={issue.id}
                      style={{
                        ...dashStyles.premiumCard,
                        borderBottom: isLast ? 'none' : '1px solid #EEEEEE',
                      }}
                    >
                      {/* Header Row */}
                      <div style={dashStyles.premiumCardHeader}>
                        {/* Severity indicator */}
                        <div style={{
                          ...dashStyles.premiumSeverityDot,
                          backgroundColor: severityColor,
                        }} />

                        {/* Title & Description */}
                        <div style={dashStyles.premiumCardMain}>
                          <h4 style={dashStyles.premiumCardTitle}>{issue.title}</h4>
                          <p style={dashStyles.premiumCardDesc}>{issue.description}</p>
                        </div>

                        {/* Metrics badge */}
                        <div style={dashStyles.premiumCardMeta}>
                          <span style={dashStyles.premiumMetricsBadge}>
                            {issue.metrics.join(' · ')}
                          </span>
                          <span style={{ ...dashStyles.premiumScoreBadge, color: severityColor }}>
                            {issue.avgScore}
                          </span>
                        </div>
                      </div>

                      {/* Evidence & Context - Two Column */}
                      <div style={dashStyles.premiumCardBody}>
                        <div style={dashStyles.premiumCardColumn}>
                          <span style={dashStyles.premiumLabel}>Supporting Evidence</span>
                          {issue.evidence.slice(0, 1).map((ev, evIdx) => (
                            <div key={evIdx} style={dashStyles.premiumQuote}>
                              <p style={dashStyles.premiumQuoteText}>"{ev.quote}"</p>
                              <span style={dashStyles.premiumQuoteSource}>{ev.role}</span>
                            </div>
                          ))}
                        </div>

                        <div style={dashStyles.premiumCardColumn}>
                          <span style={dashStyles.premiumLabel}>Root Cause</span>
                          <div style={dashStyles.premiumTagsRow}>
                            {issue.rootCauses.map((cause, cIdx) => (
                              <span key={cIdx} style={dashStyles.premiumTag}>{cause}</span>
                            ))}
                          </div>
                          <span style={{ ...dashStyles.premiumLabel, marginTop: '16px' }}>Business Impact</span>
                          <p style={dashStyles.premiumImpactText}>{issue.businessImpact}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Strengths Tab */}
          {activeTab === 'strengths' && (
            <div style={dashStyles.premiumList}>
              {refinedReport?.strengths?.length ? (
                // Real data from refined report (rich objects)
                refinedReport.strengths.map((strength, idx) => {
                  const isLast = idx === refinedReport.strengths.length - 1;

                  return (
                    <div
                      key={`strength-${idx}`}
                      style={{
                        ...dashStyles.premiumCard,
                        borderBottom: isLast ? 'none' : '1px solid #EEEEEE',
                      }}
                    >
                      {/* Header Row */}
                      <div style={dashStyles.premiumCardHeader}>
                        {/* Strength indicator */}
                        <div style={{
                          ...dashStyles.premiumSeverityDot,
                          backgroundColor: '#1A7F37',
                        }} />

                        {/* Title & Description */}
                        <div style={dashStyles.premiumCardMain}>
                          <h4 style={dashStyles.premiumCardTitle}>{strength.title}</h4>
                          <p style={dashStyles.premiumCardDesc}>{strength.description}</p>
                        </div>

                        {/* Metrics badge */}
                        <div style={dashStyles.premiumCardMeta}>
                          <span style={dashStyles.premiumMetricsBadge}>
                            {strength.metrics.join(' · ')}
                          </span>
                          {strength.avg_score !== undefined && (
                            <span style={{ ...dashStyles.premiumScoreBadge, color: '#1A7F37' }}>
                              {strength.avg_score}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Evidence & Opportunity - Two Column */}
                      <div style={dashStyles.premiumCardBody}>
                        <div style={dashStyles.premiumCardColumn}>
                          <span style={dashStyles.premiumLabel}>Supporting Evidence</span>
                          {strength.evidence.slice(0, 1).map((ev, evIdx) => (
                            <div key={evIdx} style={dashStyles.premiumQuote}>
                              <p style={dashStyles.premiumQuoteText}>"{ev.quote}"</p>
                              <span style={dashStyles.premiumQuoteSource}>{ev.role}</span>
                            </div>
                          ))}
                        </div>

                        <div style={dashStyles.premiumCardColumn}>
                          <span style={dashStyles.premiumLabel}>Opportunity</span>
                          <p style={dashStyles.premiumOpportunityText}>{strength.opportunity}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Fallback to dummy data (rich objects)
                DUMMY_STRENGTHS.map((strength, idx) => {
                  const isLast = idx === DUMMY_STRENGTHS.length - 1;

                  return (
                    <div
                      key={strength.id}
                      style={{
                        ...dashStyles.premiumCard,
                        borderBottom: isLast ? 'none' : '1px solid #EEEEEE',
                      }}
                    >
                      {/* Header Row */}
                      <div style={dashStyles.premiumCardHeader}>
                        {/* Strength indicator */}
                        <div style={{
                          ...dashStyles.premiumSeverityDot,
                          backgroundColor: '#1A7F37',
                        }} />

                        {/* Title & Description */}
                        <div style={dashStyles.premiumCardMain}>
                          <h4 style={dashStyles.premiumCardTitle}>{strength.title}</h4>
                          <p style={dashStyles.premiumCardDesc}>{strength.description}</p>
                        </div>

                        {/* Metrics badge */}
                        <div style={dashStyles.premiumCardMeta}>
                          <span style={dashStyles.premiumMetricsBadge}>
                            {strength.metrics.join(' · ')}
                          </span>
                          <span style={{ ...dashStyles.premiumScoreBadge, color: '#1A7F37' }}>
                            {strength.avgScore}
                          </span>
                        </div>
                      </div>

                      {/* Evidence & Opportunity - Two Column */}
                      <div style={dashStyles.premiumCardBody}>
                        <div style={dashStyles.premiumCardColumn}>
                          <span style={dashStyles.premiumLabel}>Supporting Evidence</span>
                          {strength.evidence.slice(0, 1).map((ev, evIdx) => (
                            <div key={evIdx} style={dashStyles.premiumQuote}>
                              <p style={dashStyles.premiumQuoteText}>"{ev.quote}"</p>
                              <span style={dashStyles.premiumQuoteSource}>{ev.role}</span>
                            </div>
                          ))}
                        </div>

                        <div style={dashStyles.premiumCardColumn}>
                          <span style={dashStyles.premiumLabel}>Opportunity</span>
                          <p style={dashStyles.premiumOpportunityText}>{strength.opportunity}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Data Sources Tab - Premium Redesign */}
          {activeTab === 'sources' && (
            <div style={dashStyles.premiumSourcesList}>
              {(run.sources || []).map((source, idx) => {
                const isVoice = source.source_type?.toLowerCase().includes('voice');
                const isLast = idx === (run.sources?.length || 0) - 1;
                const questionCount = scores?.question_scores?.filter(q => q.source_id === source.id).length || 28;

                return (
                  <div
                    key={source.id}
                    style={{
                      ...dashStyles.premiumSourceRow,
                      borderBottom: isLast ? 'none' : '1px solid #EEEEEE',
                    }}
                    onClick={() => onViewInterview(source.id)}
                  >
                    {/* Type Icon */}
                    <div style={dashStyles.premiumSourceIcon}>
                      {isVoice ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                        </svg>
                      )}
                    </div>

                    {/* Main Info */}
                    <div style={dashStyles.premiumSourceMain}>
                      <span style={dashStyles.premiumSourceId}>{formatInterviewId(source.id)}</span>
                      <span style={dashStyles.premiumSourceType}>{isVoice ? 'Voice Interview' : 'Form Response'}</span>
                    </div>

                    {/* Meta */}
                    <div style={dashStyles.premiumSourceMeta}>
                      <span style={dashStyles.premiumSourceDate}>{formatDate(run.started_at)}</span>
                      <span style={dashStyles.premiumSourceQuestions}>{questionCount} questions</span>
                    </div>

                    {/* Arrow */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                );
              })}

              {/* Add Source Button */}
              <button style={dashStyles.premiumAddSource}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Data Source
              </button>

              {/* Coming Soon */}
              <div style={dashStyles.premiumComingSoon}>
                <span style={dashStyles.premiumComingSoonLabel}>Coming Soon</span>
                <div style={dashStyles.premiumComingSoonItems}>
                  <span style={dashStyles.premiumComingSoonItem}>Document uploads (PDF, reports)</span>
                  <span style={dashStyles.premiumComingSoonItem}>CRM & social media connectors</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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
  // ============ ELEGANT INTERVIEW DETAIL HEADER ============

  // Breadcrumb - Minimal
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '20px',
  },
  breadcrumbLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#888888',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.15s',
  },
  breadcrumbSep: {
    color: '#CCCCCC',
    fontSize: '13px',
  },
  breadcrumbText: {
    fontSize: '13px',
    color: '#888888',
  },
  breadcrumbCurrent: {
    fontSize: '13px',
    color: '#1A1A1A',
    fontWeight: 500,
  },

  // Title Row - Clean
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleLeft: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  idBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  idBadgeIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#F5F5F5',
    color: '#888888',
  },
  idTitle: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: 0,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    letterSpacing: '-0.02em',
  },
  idSubtitle: {
    fontSize: '13px',
    color: '#888888',
    margin: '4px 0 0 0',
  },
  titleRight: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '24px',
  },
  confidenceBadge: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '2px',
  },
  confidenceLabel: {
    fontSize: '11px',
    color: '#999999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  confidenceValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
  },

  // Summary Section - Elegant Grid
  summarySection: {
    display: 'grid',
    gridTemplateColumns: '280px 1fr',
    gap: '16px',
    padding: '20px 0',
  },

  // Score Card - Clean with subtle shadow for contrast
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E5E5',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  scoreCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  scoreCardLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#999999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  ragBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '4px',
    textTransform: 'capitalize' as const,
  },
  scoreCardMain: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    marginBottom: '16px',
  },
  scoreNumber: {
    fontSize: '48px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    lineHeight: 1,
  },
  scoreOutOf: {
    fontSize: '18px',
    color: '#CCCCCC',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  scoreBarContainer: {
    marginBottom: '20px',
  },
  scoreBarBg: {
    height: '6px',
    backgroundColor: '#EEEEEE',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  quickStats: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 0 0',
    borderTop: '1px solid #EEEEEE',
  },
  quickStatDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: '#EEEEEE',
  },

  // Performance Card - Refined with subtle shadow
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E5E5',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },

  // Section Header for Metric Distribution
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1A1A1A',
  },
  sectionSubtitle: {
    fontSize: '12px',
    color: '#999999',
  },

  // Metric Strip - With proper spacing
  metricStripSection: {
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid #EEEEEE',
  },
  metricStrip: {
    display: 'flex',
    gap: '3px',
    marginBottom: '12px',
  },
  metricBlock: {
    flex: 1,
    height: '28px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'default',
  },
  metricBlockCode: {
    fontSize: '9px',
    fontWeight: 600,
    color: '#FFFFFF',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    textShadow: '0 1px 1px rgba(0,0,0,0.15)',
  },
  metricLegend: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '10px',
    color: '#999999',
  },
  legendDot: {
    width: '6px',
    height: '6px',
    borderRadius: '2px',
  },

  // Performers - Cleaner
  performersSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  performerColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  performerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#888888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  performerBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  performerInfo: {
    width: '130px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  performerCode: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#666666',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  performerName: {
    fontSize: '12px',
    color: '#888888',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  performerBarContainer: {
    flex: 1,
    height: '4px',
    backgroundColor: '#EEEEEE',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  performerBarFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  performerScore: {
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    width: '28px',
    textAlign: 'right' as const,
  },

  // Tab Navigation - Elegant
  tabNav: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px 8px 0 0',
    border: '1px solid #E0E0E0',
    borderBottom: 'none',
    padding: '0 20px',
    marginTop: '4px',
  },
  tabNavInner: {
    display: 'flex',
    gap: '0',
  },
  tabCountAlert: {
    backgroundColor: 'rgba(207, 34, 46, 0.1)',
    color: '#CF222E',
  },

  // ============ AGGREGATED DASHBOARD STYLES (Premium Minimal) ============

  // Container - Clean background
  container: {
    padding: '24px 32px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#FAFAFA',
    minHeight: '100vh',
  },

  // Back Button - minimal ghost style
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    marginBottom: '20px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: '#888888',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'color 0.15s',
  },

  // Header - clean, spacious
  header: {
    marginBottom: '32px',
  },
  headerMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {},
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: '0 0 6px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '15px',
    color: '#86868B',
    margin: 0,
    fontWeight: 400,
  },
  statusBadge: {
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 500,
    textTransform: 'capitalize' as const,
  },
  downloadButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: '#F5F5F7',
    color: '#1D1D1F',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },

  // Two Column Grid - proper spacing
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    gap: '24px',
    marginBottom: '24px',
  },

  // Card base style - minimal elevation
  quadrantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    padding: '24px',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#86868B',
    margin: '0 0 20px 0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  quadrantContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  quadrantGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  yAxisLabel: {
    writingMode: 'vertical-lr' as const,
    transform: 'rotate(180deg)',
    position: 'absolute' as const,
    left: '-28px',
    top: '50%',
    marginTop: '-50px',
  },
  axisText: {
    fontSize: '10px',
    fontWeight: 500,
    color: '#86868B',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  quadrantBoxes: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    width: '220px',
    height: '220px',
    position: 'relative' as const,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.06)',
  },
  quadrantBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    transition: 'opacity 0.2s',
  },
  quadrantTL: { backgroundColor: 'rgba(214, 234, 248, 0.5)' },  // Scattered Experimenter - blue
  quadrantTR: { backgroundColor: 'rgba(212, 237, 218, 0.5)' },  // Adaptive Leader - green
  quadrantBL: { backgroundColor: 'rgba(248, 215, 218, 0.5)' },  // At-Risk - red
  quadrantBR: { backgroundColor: 'rgba(252, 228, 214, 0.5)' },  // Solid Performer - orange
  quadrantLabel: {
    fontSize: '9px',
    fontWeight: 600,
    color: '#6E6E73',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  positionDot: {
    position: 'absolute' as const,
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#1D1D1F',
    border: '3px solid #FFFFFF',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    transform: 'translate(-50%, 50%)',
  },
  xAxisLabel: {
    marginTop: '12px',
  },
  quadrantResult: {
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  quadrantResultLabel: {
    fontSize: '17px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
  },
  keyStatsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '20px 0 0',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
  },
  keyStat: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  keyStatValue: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#1D1D1F',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
    fontFeatureSettings: '"tnum"',
  },
  keyStatLabel: {
    fontSize: '11px',
    color: '#86868B',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },

  // Summary Card - minimal
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  summaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    background: '#F5F5F7',
    color: '#6E6E73',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  summaryText: {
    fontSize: '15px',
    color: '#1D1D1F',
    lineHeight: 1.7,
    margin: '0 0 20px 0',
    flex: 1,
  },
  quickStatsRow: {
    display: 'flex',
    gap: '32px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
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
    color: '#1D1D1F',
    fontFeatureSettings: '"tnum"',
  },
  quickStatLabel: {
    fontSize: '11px',
    color: '#86868B',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },

  // Actions Section - minimal
  actionsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    padding: '24px',
    marginBottom: '24px',
  },
  actionsSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  actionsSectionTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    background: '#F5F5F7',
    color: '#6E6E73',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  actionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  actionCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '16px 20px',
    backgroundColor: '#F9FAFB',
    borderRadius: '10px',
    border: '1px solid rgba(0, 0, 0, 0.04)',
  },
  actionPriority: {
    fontSize: '18px',
    flexShrink: 0,
    width: '24px',
    textAlign: 'center' as const,
  },
  actionContent: {
    flex: 1,
  },
  actionMain: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '8px',
  },
  actionNumber: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1D1D1F',
  },
  actionText: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#1D1D1F',
    lineHeight: 1.4,
  },
  actionMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#86868B',
  },
  actionOwner: {},
  actionDivider: { color: '#C7C7CC' },
  actionTimeline: {},
  actionImpact: {},
  actionActions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
    alignSelf: 'center',
  },
  actionEditBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    background: 'rgba(0, 0, 0, 0.04)',
    color: '#6E6E73',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  actionDismissBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    background: 'transparent',
    color: '#AEAEB2',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'color 0.2s',
  },

  // Tabbed Section - minimal
  tabbedSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E0E0E0',
    overflow: 'hidden',
  },
  tabsHeader: {
    display: 'flex',
    gap: '0',
    padding: '0 24px',
    borderBottom: '1px solid #EEEEEE',
    backgroundColor: '#FAFAFA',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 20px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#888888',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
    marginBottom: '-1px',
  },
  tabActive: {
    color: '#1A1A1A',
    borderBottomColor: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  tabCount: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 7px',
    borderRadius: '4px',
    backgroundColor: '#EEEEEE',
    color: '#888888',
    fontFeatureSettings: '"tnum"',
  },
  tabCountActive: {
    backgroundColor: '#E8E8E8',
    color: '#1A1A1A',
  },
  tabContent: {
    padding: '0',
  },

  // Premium Card Styles (shared)
  premiumList: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  premiumCard: {
    padding: '24px 28px',
  },
  premiumCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '20px',
  },
  premiumSeverityDot: {
    width: '8px',
    height: '8px',
    borderRadius: '4px',
    flexShrink: 0,
    marginTop: '7px',
  },
  premiumCardMain: {
    flex: 1,
    minWidth: 0,
  },
  premiumCardTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 6px 0',
    lineHeight: 1.4,
  },
  premiumCardDesc: {
    fontSize: '14px',
    color: '#666666',
    margin: 0,
    lineHeight: 1.5,
  },
  premiumCardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  premiumMetricsBadge: {
    fontSize: '12px',
    color: '#888888',
    fontFamily: 'monospace',
  },
  premiumScoreBadge: {
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
  premiumCardBody: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    marginLeft: '24px',
  },
  premiumCardColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  premiumLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#999999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '10px',
  },
  premiumQuote: {
    paddingLeft: '14px',
    borderLeft: '2px solid #E0E0E0',
  },
  premiumQuoteText: {
    fontSize: '13px',
    color: '#555555',
    fontStyle: 'italic' as const,
    lineHeight: 1.6,
    margin: '0 0 6px 0',
  },
  premiumQuoteSource: {
    fontSize: '12px',
    color: '#999999',
  },
  premiumTagsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '4px',
  },
  premiumTag: {
    padding: '5px 12px',
    backgroundColor: '#F5F5F5',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#666666',
  },
  premiumImpactText: {
    fontSize: '13px',
    color: '#CF222E',
    margin: 0,
    lineHeight: 1.5,
  },
  premiumOpportunityText: {
    fontSize: '13px',
    color: '#0969DA',
    margin: 0,
    lineHeight: 1.5,
  },

  // Premium Sources List
  premiumSourcesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '0 0 20px 0',
  },
  premiumSourceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 28px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  premiumSourceIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#F5F5F5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  premiumSourceMain: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  premiumSourceId: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1A1A1A',
  },
  premiumSourceType: {
    fontSize: '12px',
    color: '#888888',
  },
  premiumSourceMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '2px',
    flexShrink: 0,
    marginRight: '8px',
  },
  premiumSourceDate: {
    fontSize: '13px',
    color: '#666666',
  },
  premiumSourceQuestions: {
    fontSize: '12px',
    color: '#999999',
  },
  premiumAddSource: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    margin: '8px 28px',
    padding: '12px',
    borderRadius: '6px',
    border: '1px dashed #D0D0D0',
    backgroundColor: 'transparent',
    color: '#888888',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
  premiumComingSoon: {
    margin: '16px 28px 0',
    padding: '16px 20px',
    backgroundColor: '#FAFAFA',
    borderRadius: '6px',
  },
  premiumComingSoonLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#AAAAAA',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    display: 'block',
    marginBottom: '10px',
  },
  premiumComingSoonItems: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  premiumComingSoonItem: {
    fontSize: '13px',
    color: '#888888',
  },

  // Issues Tab - subtle surface tint for contrast
  issuesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  issueCard: {
    padding: '20px',
    backgroundColor: '#F9FAFB',
    borderRadius: '10px',
    border: '1px solid rgba(0, 0, 0, 0.04)',
  },
  issueHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
  },
  severityBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  issueMetrics: {
    fontSize: '13px',
    color: '#86868B',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
    fontFeatureSettings: '"tnum"',
  },
  issueTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: '0 0 10px 0',
    letterSpacing: '-0.01em',
  },
  issueDescription: {
    fontSize: '15px',
    color: '#6E6E73',
    lineHeight: 1.6,
    margin: '0 0 20px 0',
  },
  evidenceSection: {
    marginBottom: '20px',
  },
  evidenceLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#86868B',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '10px',
  },
  evidenceQuote: {
    padding: '14px 16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    marginBottom: '10px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
  },
  quoteText: {
    fontSize: '14px',
    color: '#1D1D1F',
    fontStyle: 'italic' as const,
    display: 'block',
    marginBottom: '6px',
    lineHeight: 1.5,
  },
  quoteRole: {
    fontSize: '12px',
    color: '#86868B',
    fontWeight: 500,
  },
  issueFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
  },
  rootCauses: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  footerLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#86868B',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  rootCauseBadge: {
    padding: '4px 10px',
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    color: '#C55F00',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
  },
  businessImpact: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '4px',
  },
  impactText: {
    fontSize: '13px',
    color: '#FF3B30',
    fontWeight: 500,
  },

  // Strengths Tab - subtle surface for contrast
  strengthsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  strengthCard: {
    padding: '20px',
    backgroundColor: '#F9FAFB',
    borderRadius: '10px',
    border: '1px solid rgba(0, 0, 0, 0.04)',
  },
  strengthHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
  },
  strengthBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    color: '#248A3D',
  },
  strengthMetrics: {
    fontSize: '13px',
    color: '#86868B',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
    fontFeatureSettings: '"tnum"',
  },
  strengthTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: '0 0 10px 0',
    letterSpacing: '-0.01em',
  },
  strengthDescription: {
    fontSize: '15px',
    color: '#6E6E73',
    lineHeight: 1.6,
    margin: '0 0 20px 0',
  },
  opportunitySection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    padding: '14px 16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid rgba(0, 122, 255, 0.2)',
  },
  opportunityLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#007AFF',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  opportunityText: {
    fontSize: '14px',
    color: '#0055D4',
    fontWeight: 500,
    lineHeight: 1.4,
  },

  // Sources Tab - clean table
  sourcesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  sourcesTable: {
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(0, 0, 0, 0.06)',
  },
  sourcesTableHeader: {
    display: 'grid',
    gridTemplateColumns: '100px 1fr 100px 100px 40px',
    padding: '12px 20px',
    backgroundColor: '#F9FAFB',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  sourcesTableHeaderCell: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#86868B',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  sourcesTableRow: {
    display: 'grid',
    gridTemplateColumns: '100px 1fr 100px 100px 40px',
    padding: '14px 20px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  sourcesTableCell: {
    fontSize: '14px',
    color: '#1D1D1F',
    display: 'flex',
    alignItems: 'center',
  },
  sourcesTableCellAction: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    color: '#AEAEB2',
  },
  addSourceButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    width: '100%',
    borderRadius: '10px',
    border: '2px dashed rgba(0, 0, 0, 0.08)',
    background: 'transparent',
    color: '#86868B',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'border-color 0.2s, color 0.2s',
  },
  futureSourcesHint: {
    padding: '20px',
    backgroundColor: '#F5F5F7',
    borderRadius: '12px',
    marginTop: '16px',
  },
  futureSourcesTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#6E6E73',
    margin: '0 0 10px 0',
  },
  futureSourcesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  futureSourceItem: {
    fontSize: '14px',
    color: '#86868B',
  },

  // Metrics Tab - clean grouped lists
  metricsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '28px',
  },
  metricCategory: {},
  metricCategoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  metricCategoryTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#86868B',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  metricCategoryAvg: {
    fontSize: '14px',
    fontWeight: 600,
    fontFeatureSettings: '"tnum"',
  },
  metricCategoryList: {
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    backgroundColor: '#FFFFFF',
  },
  metricRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '14px 20px',
    border: 'none',
    borderTop: '1px solid rgba(0, 0, 0, 0.04)',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'background 0.15s',
  },
  metricRowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  metricRowCode: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    padding: '5px 10px',
    borderRadius: '6px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", monospace',
  },
  metricRowName: {
    fontSize: '15px',
    color: '#1D1D1F',
    fontWeight: 500,
  },
  metricRowRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  metricRowBar: {
    width: '120px',
    height: '6px',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  metricRowBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.4s ease-out',
  },
  metricRowScore: {
    fontSize: '15px',
    fontWeight: 600,
    fontFeatureSettings: '"tnum"',
    width: '36px',
    textAlign: 'right' as const,
  },
  metricExpanded: {
    padding: '20px',
    backgroundColor: '#F5F5F7',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
  },
  metricExpandedText: {
    fontSize: '14px',
    color: '#6E6E73',
    lineHeight: 1.6,
    margin: '0 0 16px 0',
  },
  viewDetailButton: {
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    background: '#FFFFFF',
    color: '#007AFF',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    transition: 'box-shadow 0.2s',
  },

  // =====================================================
  // METRIC INSIGHTS - McKinsey "Insight Headlines" Style
  // =====================================================

  metricInsightsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E0E0E0',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  metricInsightsHeader: {
    padding: '24px 32px 20px',
    borderBottom: '1px solid #E0E0E0',
  },
  metricInsightsTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 6px 0',
    letterSpacing: '-0.01em',
  },
  metricInsightsSubtitle: {
    fontSize: '14px',
    color: '#666666',
    margin: 0,
  },

  // Category section
  metricInsightsCategorySection: {},
  metricInsightsCategoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    backgroundColor: '#F7F7F7',
    borderBottom: '1px solid #E0E0E0',
    borderTop: '1px solid #E0E0E0',
  },
  metricInsightsCategoryTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#1A1A1A',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    margin: 0,
  },
  metricInsightsCategoryAvg: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#666666',
  },
  metricInsightsCategoryLine: {
    display: 'none',
  },
  metricInsightsList: {
    display: 'flex',
    flexDirection: 'column' as const,
  },

  // Metric row - Insight headline style
  metricInsightCard: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #EEEEEE',
  },
  metricInsightCardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '20px 32px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  metricInsightHealthBar: {
    width: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    paddingTop: '4px',
    flexShrink: 0,
  },
  metricInsightHealthBarSegment: {
    height: '3px',
    borderRadius: '1px',
    backgroundColor: '#E0E0E0',
  },
  metricInsightCardLeft: {
    flex: 1,
    minWidth: 0,
  },
  metricInsightHeadline: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#1A1A1A',
    margin: '0 0 4px 0',
    lineHeight: 1.4,
  },
  metricInsightMetricName: {
    fontSize: '12px',
    color: '#888888',
    margin: 0,
    fontWeight: 400,
  },
  metricInsightCardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
    paddingTop: '2px',
  },
  metricInsightHealthBadge: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  metricInsightChevron: {
    color: '#CCCCCC',
    flexShrink: 0,
    transition: 'transform 0.2s ease',
  },

  // Expanded content - Clean & Elegant
  metricInsightExpandedContent: {
    padding: '24px 32px 28px 80px',
    backgroundColor: '#FAFAFA',
    borderTop: '1px solid #EEEEEE',
  },

  // Executive Insight section (first thing shown on expand)
  executiveInsightSection: {
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid #E8E8E8',
  },
  executiveInsightBar: {
    marginBottom: '12px',
  },
  executiveInsightBarTrack: {
    position: 'relative' as const,
    height: '6px',
    backgroundColor: '#F0F0F0',
    borderRadius: '4px',
    overflow: 'visible',
  },
  executiveInsightBarLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '6px',
  },
  executiveInsightText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#1D1D1F',
    fontWeight: 450,
    letterSpacing: '-0.01em',
    margin: 0,
  },

  // Two column grid
  metricExpandedGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
  },
  metricExpandedColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  metricExpandedLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#999999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: '14px',
  },

  // Observations
  metricExpandedObsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginBottom: '20px',
  },
  metricExpandedObsItem: {
    fontSize: '14px',
    color: '#444444',
    lineHeight: 1.6,
    margin: 0,
  },

  // Quote - elegant left border
  metricExpandedQuote: {
    paddingLeft: '16px',
    borderLeft: '2px solid #D0D0D0',
  },
  metricExpandedQuoteText: {
    fontSize: '13px',
    color: '#666666',
    fontStyle: 'italic' as const,
    lineHeight: 1.6,
    margin: '0 0 6px 0',
  },
  metricExpandedQuoteSource: {
    fontSize: '12px',
    color: '#999999',
  },

  // Recommendations - numbered
  metricExpandedRecList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '20px',
  },
  metricExpandedRecItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  metricExpandedRecNum: {
    width: '20px',
    height: '20px',
    borderRadius: '10px',
    backgroundColor: '#E8E8E8',
    color: '#666666',
    fontSize: '11px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '1px',
  },
  metricExpandedRecText: {
    fontSize: '14px',
    color: '#333333',
    lineHeight: 1.5,
  },

  // Benchmark - subtle
  metricExpandedBenchmark: {
    fontSize: '13px',
    color: '#666666',
    lineHeight: 1.5,
    margin: 0,
    paddingTop: '12px',
    borderTop: '1px solid #E8E8E8',
  },

  // AI Reasoning - Minimal
  metricExpandedAISection: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #E8E8E8',
  },
  metricExpandedAIToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: 0,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#888888',
    transition: 'color 0.15s ease',
  },
  metricExpandedAIContent: {
    marginTop: '20px',
  },
  metricExpandedAIGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px 40px',
  },
  metricExpandedAIBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  metricExpandedAIBlockLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#AAAAAA',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  metricExpandedAIBlockText: {
    fontSize: '13px',
    color: '#555555',
    lineHeight: 1.6,
    margin: '0 0 8px 0',
  },
  metricExpandedAIBadge: {
    display: 'inline-flex',
    alignSelf: 'flex-start',
    padding: '4px 10px',
    backgroundColor: '#F0F0F0',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#666666',
  },
  metricExpandedAIListItem: {
    fontSize: '13px',
    color: '#555555',
    lineHeight: 1.6,
    margin: '0 0 4px 0',
  },

  // Legacy styles - kept for compatibility
  metricInsightObservations: {},
  metricInsightObservation: {},
  metricInsightObservationBullet: {},
  metricInsightEvidence: {},
  metricInsightQuote: {},
  metricInsightQuoteRole: {},
  metricInsightBenchmark: {},
  metricInsightBenchmarkIcon: {},
  metricInsightBenchmarkText: {},
  metricInsightRecommendations: {},
  metricInsightRecommendationsLabel: {},
  metricInsightRecommendation: {},
  metricInsightRecommendationIcon: {},
  metricInsightAIReasoning: {},
  metricInsightAIReasoningToggle: {},
  metricInsightAIReasoningIcon: {},
  metricInsightAIReasoningText: {},
  metricInsightAIReasoningChevron: {},
  metricInsightAIReasoningContent: {},
  metricInsightAIReasoningSection: {},
  metricInsightAIReasoningSectionTitle: {},
  metricInsightAIReasoningSectionText: {},
  metricInsightAIReasoningList: {},
  metricInsightAIReasoningListItem: {},
  metricInsightAIReasoningListIcon: {},
  metricInsightAIReasoningDataBadge: {},

  // Reasoning Toggle Section - "How we reached this conclusion"
  reasoningToggleSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #EEEEEE',
  },
  reasoningToggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px 0',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#888888',
    fontWeight: 500,
    transition: 'color 0.15s',
  },
  reasoningContent: {
    marginTop: '12px',
    padding: '16px',
    backgroundColor: '#FAFAFA',
    borderRadius: '6px',
    border: '1px solid #EEEEEE',
  },
  reasoningText: {
    fontSize: '13px',
    color: '#555555',
    lineHeight: 1.7,
    margin: 0,
  },

  // Footer
  metricInsightFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '1px solid #E0E0E0',
  },
  metricInsightRelatedTag: {
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },

  // Deprecated - keeping for compatibility
  metricInsightSummary: {},
  metricInsightPreview: {},
  metricInsightCardCollapsed: {},
  metricInsightHealthIndicator: {},
  metricInsightTitleGroup: {},
  metricInsightName: {},
  metricInsightCategory: {},
  metricInsightHealthBarFill: {},
};

// Institutional Design System Styles
const _institutionalStyles: Record<string, React.CSSProperties> = {
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
// Premium Expanded Content Styles - Elegant
const premiumStyles: Record<string, React.CSSProperties> = {
  // Container - White card with subtle border for differentiation
  expandedContainer: {
    padding: '24px',
    margin: '12px 20px 16px 20px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E5E5',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },

  // Question text block - Card style
  questionBlock: {
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#FAFAFA',
    borderRadius: '6px',
    border: '1px solid #EEEEEE',
  },
  questionText: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#1A1A1A',
    lineHeight: 1.6,
    margin: 0,
  },

  // Response block - Card style with left accent
  responseBlock: {
    padding: '16px 16px 16px 20px',
    borderLeft: '3px solid #0969DA',
    marginBottom: '20px',
    backgroundColor: '#F8FAFC',
    borderRadius: '0 6px 6px 0',
  },
  responseText: {
    fontSize: '14px',
    color: '#555555',
    lineHeight: 1.7,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },

  // Metadata row - Clean inline pills
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '10px',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid #EEEEEE',
  },
  metaPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 12px',
    backgroundColor: '#F5F5F5',
    borderRadius: '4px',
    fontSize: '12px',
  },
  metaPillLabel: {
    color: '#999999',
    fontWeight: 400,
  },
  metaPillValue: {
    color: '#1A1A1A',
    fontWeight: 500,
  },
  reviewPill: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 12px',
    backgroundColor: 'rgba(154, 103, 0, 0.08)',
    color: '#9A6700',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
  },

  // AI Reasoning block - Card style
  reasoningBlock: {
    padding: '16px',
    backgroundColor: '#FAFAFA',
    borderRadius: '6px',
    border: '1px solid #EEEEEE',
    marginBottom: '24px',
  },
  reasoningHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid #E8E8E8',
  },
  reasoningLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#888888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  reasoningText: {
    fontSize: '13px',
    color: '#555555',
    lineHeight: 1.7,
    margin: 0,
  },

  // Section label - Consistent with separator
  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#888888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #EEEEEE',
  },

  // Dimensions block - Card style
  dimensionsBlock: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#FAFAFA',
    borderRadius: '6px',
    border: '1px solid #EEEEEE',
  },
  dimensionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0',
  },
  dimensionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '12px 14px',
    marginBottom: '4px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E8E8E8',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.15s',
  },
  dimensionName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#444444',
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
    width: '6px',
    height: '6px',
    borderRadius: '2px',
    backgroundColor: '#E0E0E0',
  },
  pipFilled: {
    // Color set dynamically
  },
  dimensionScore: {
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    color: '#888888',
    minWidth: '28px',
    textAlign: 'right' as const,
  },

  // Checks block - Card style container
  checksBlock: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#FAFAFA',
    borderRadius: '6px',
    border: '1px solid #EEEEEE',
  },
  checkCount: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '18px',
    height: '18px',
    padding: '0 6px',
    backgroundColor: '#E8E8E8',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 500,
    color: '#555555',
  },
  checksList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  checkCard: {
    padding: '14px 16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E8E8E8',
    borderRadius: '6px',
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
    fontSize: '12px',
    fontWeight: 600,
    color: '#666666',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  checkCodeLinked: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#0969DA',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  checkStatus: {
    fontSize: '10px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  checkType: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#999999',
    marginBottom: '6px',
    display: 'inline-block',
  },
  checkDescription: {
    fontSize: '13px',
    color: '#666666',
    lineHeight: 1.5,
    margin: '0 0 10px 0',
  },
  checkScores: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  checkScoreChip: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#666666',
    padding: '4px 10px',
    backgroundColor: '#F5F5F5',
    borderRadius: '4px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  checkReasoning: {
    fontSize: '13px',
    color: '#888888',
    lineHeight: 1.5,
    margin: 0,
    fontStyle: 'italic' as const,
  },
  checkFlag: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 600,
    color: '#9A6700',
    padding: '3px 8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
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
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5">
                                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                      </svg>
                                      <span style={premiumStyles.reasoningLabel}>How we reached this conclusion</span>
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
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span style={premiumStyles.reasoningLabel}>How we reached this conclusion</span>
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
                        const linkedCode = cr.linked_question_code;
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
                            {(cr.primary_score !== undefined || cr.linked_score !== undefined) && (
                              <div style={premiumStyles.checkScores}>
                                <span style={premiumStyles.checkScoreChip}>
                                  Primary Score: {Math.round(cr.primary_score || 0)}
                                </span>
                                {cr.linked_score !== undefined && (
                                  <span style={premiumStyles.checkScoreChip}>
                                    Linked Score: {Math.round(cr.linked_score || 0)}
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
// Questions Tab - Elegant Styles
const questionsTabStyles: Record<string, React.CSSProperties> = {
  container: {
    // No outer border - cleaner look
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#FAFAFA',
    borderBottom: '1px solid #EEEEEE',
  },
  headerLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#999999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  questionRow: {
    borderBottom: '1px solid #EEEEEE',
  },
  questionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '16px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'background-color 0.15s',
  },
  numberColumn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '56px',
    flexShrink: 0,
  },
  questionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 2,
    minWidth: 0,
  },
  questionNumber: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#888888',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    minWidth: '20px',
  },
  questionCode: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#666666',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    flexShrink: 0,
  },
  questionPreview: {
    fontSize: '14px',
    color: '#555555',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  questionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  scoreValue: {
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
  },
  confidenceBadge: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#888888',
    padding: '3px 8px',
    backgroundColor: '#F5F5F5',
    borderRadius: '4px',
  },
  reviewBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#9A6700',
    padding: '3px 8px',
    backgroundColor: 'rgba(154, 103, 0, 0.08)',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
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
                  style={flagsTabStyles.flagCard}
                >
                  {/* Flag Header */}
                  <div style={flagsTabStyles.flagHeader}>
                    {/* Severity dot */}
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: severityStyle.accent,
                      flexShrink: 0,
                    }} />
                    <span style={{
                      ...flagsTabStyles.severityBadge,
                      backgroundColor: severityStyle.bg,
                      color: severityStyle.text,
                    }}>
                      {flag.severity}
                    </span>
                    <span style={flagsTabStyles.flagType}>
                      {flag.flag_type?.replace(/_/g, ' ')}
                    </span>
                    <span style={flagsTabStyles.impactBadge}>
                      {flag.severity === 'critical' ? 'High Impact' : flag.severity === 'warning' ? 'Medium Impact' : 'Low Impact'}
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

// Flags Tab - Elegant Styles
const flagsTabStyles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px 28px',
  },

  // Empty state - Clean & Minimal
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 24px',
    textAlign: 'center' as const,
  },
  emptyIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '22px',
    backgroundColor: 'rgba(26, 127, 55, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: '0 0 6px 0',
  },
  emptyText: {
    fontSize: '13px',
    color: '#888888',
    margin: 0,
  },

  // Section - Elegant spacing
  section: {
    marginBottom: '28px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#999999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  countBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#CF222E',
    backgroundColor: 'rgba(207, 34, 46, 0.08)',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  countBadgeResolved: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#1A7F37',
    backgroundColor: 'rgba(26, 127, 55, 0.08)',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  flagsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0',
    padding: '16px 20px',
  },

  // Flag Card - Elevated with subtle border
  flagCard: {
    padding: '20px 24px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E8E8E8',
    borderRadius: '8px',
    marginBottom: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  flagHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  severityBadge: {
    fontSize: '10px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  flagType: {
    fontSize: '12px',
    color: '#888888',
    textTransform: 'capitalize' as const,
  },
  impactBadge: {
    marginLeft: 'auto',
    fontSize: '11px',
    color: '#999999',
  },
  flagTitle: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#1A1A1A',
    margin: '0 0 8px 0',
    lineHeight: 1.4,
  },
  flagDescription: {
    fontSize: '14px',
    color: '#666666',
    lineHeight: 1.6,
    margin: '0 0 16px 0',
  },

  // Analysis block - Elegant left border
  analysisBlock: {
    paddingLeft: '16px',
    borderLeft: '2px solid #E0E0E0',
    marginBottom: '16px',
  },
  analysisLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#999999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  analysisText: {
    fontSize: '13px',
    color: '#555555',
    lineHeight: 1.6,
    margin: 0,
  },

  // Related questions - Clean tags
  relatedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  relatedLabel: {
    fontSize: '12px',
    color: '#999999',
  },
  relatedCode: {
    fontSize: '11px',
    fontWeight: 500,
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    color: '#666666',
    backgroundColor: '#F5F5F5',
    padding: '3px 8px',
    borderRadius: '4px',
  },

  // Resolve form - Clean
  resolveForm: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #EEEEEE',
  },
  resolveTextarea: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '13px',
    border: '1px solid #E0E0E0',
    borderRadius: '6px',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    marginBottom: '12px',
    backgroundColor: '#FAFAFA',
  },
  resolveActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#666666',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  confirmButton: {
    padding: '8px 18px',
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
    color: '#888888',
    backgroundColor: 'transparent',
    border: '1px solid #E0E0E0',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },

  // Resolved card - Subtle
  resolvedCard: {
    padding: '16px 24px',
    backgroundColor: '#FAFAFA',
    borderBottom: '1px solid #EEEEEE',
  },
  resolvedBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#1A7F37',
    backgroundColor: 'rgba(26, 127, 55, 0.08)',
    padding: '3px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
  flagTitleResolved: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#888888',
    margin: '0 0 12px 0',
  },
  resolutionBlock: {
    paddingLeft: '14px',
    borderLeft: '2px solid #D0D0D0',
    marginBottom: '10px',
  },
  resolutionLabel: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#999999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  resolutionText: {
    fontSize: '13px',
    color: '#666666',
    lineHeight: 1.6,
    margin: 0,
  },
  resolvedMeta: {
    fontSize: '12px',
    color: '#AAAAAA',
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
