/**
 * Reviews Section - Admin Review Board
 * Clean, minimal design inspired by Vercel
 * Matches user-side interview UI patterns
 */

import { useState, useEffect, useRef } from 'react';
import { adminApi } from '../../../services/adminApi';
import type {
  BusinessWithReviews,
  BusinessReviewsResponse,
  BusinessReviewItem,
  ReviewDetail,
  InterviewSummary,
  InterviewResponse,
} from '../../../types/admin';

interface ReviewsSectionProps {
  onError: (message: string) => void;
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

function formatDuration(seconds: number): string {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
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

// ============ Business Card (Vercel-style compact) ============

function BusinessCard({
  business,
  onClick,
}: {
  business: BusinessWithReviews;
  onClick: () => void;
}) {
  return (
    <div onClick={onClick} style={cardStyles.business}>
      <div style={cardStyles.businessHeader}>
        <div style={cardStyles.businessAvatar}>
          {business.name.charAt(0).toUpperCase()}
        </div>
        <div style={cardStyles.businessInfo}>
          <span style={cardStyles.businessName}>{business.name}</span>
          <span style={cardStyles.businessSlug}>{business.slug}</span>
        </div>
        {business.has_pending && (
          <span style={cardStyles.pendingDot} />
        )}
      </div>

      <div style={cardStyles.businessStats}>
        <div style={cardStyles.stat}>
          <span style={{
            ...cardStyles.statValue,
            color: business.pending_reviews > 0 ? '#D97706' : '#18181B',
          }}>
            {business.pending_reviews}
          </span>
          <span style={cardStyles.statLabel}>pending</span>
        </div>
        <div style={cardStyles.statDivider} />
        <div style={cardStyles.stat}>
          <span style={{ ...cardStyles.statValue, color: '#059669' }}>
            {business.completed_reviews}
          </span>
          <span style={cardStyles.statLabel}>approved</span>
        </div>
      </div>

      {business.most_recent_pending && (
        <div style={cardStyles.recentActivity}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{timeAgo(business.most_recent_pending)}</span>
        </div>
      )}
    </div>
  );
}

const cardStyles: Record<string, React.CSSProperties> = {
  business: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
  },
  businessHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
  },
  businessAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: '#18181B',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
  },
  businessInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  businessName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#18181B',
  },
  businessSlug: {
    fontSize: '12px',
    color: '#71717A',
  },
  pendingDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#F59E0B',
  },
  businessStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingTop: '14px',
    borderTop: '1px solid #F4F4F5',
  },
  stat: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 600,
  },
  statLabel: {
    fontSize: '12px',
    color: '#A1A1AA',
  },
  statDivider: {
    width: '1px',
    height: '20px',
    backgroundColor: '#E4E4E7',
  },
  recentActivity: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '12px',
    fontSize: '12px',
    color: '#71717A',
  },
};

// ============ Review Item Row ============

function ReviewRow({
  review,
  isPending,
  onView,
  onApprove,
  onRevoke,
  isLoading,
}: {
  review: BusinessReviewItem;
  isPending: boolean;
  onView: () => void;
  onApprove?: () => void;
  onRevoke?: () => void;
  isLoading: boolean;
}) {
  return (
    <div style={rowStyles.container}>
      <div style={rowStyles.content} onClick={onView}>
        <div style={rowStyles.main}>
          <span style={rowStyles.name}>{review.name}</span>
          <span style={rowStyles.meta}>
            {review.question_set_name} · {review.interview_count} interviews
          </span>
        </div>
        <span style={rowStyles.date}>
          {isPending ? formatDateTime(review.submitted_at) : formatDateTime(review.evaluated_at)}
        </span>
      </div>

      <div style={rowStyles.actions}>
        <button onClick={onView} style={rowStyles.viewBtn}>View</button>

        {isPending && onApprove && (
          <button
            onClick={onApprove}
            disabled={isLoading}
            style={rowStyles.approveBtn}
          >
            {isLoading ? 'Approving...' : 'Approve'}
          </button>
        )}

        {!isPending && onRevoke && (
          <button
            onClick={onRevoke}
            disabled={isLoading}
            style={rowStyles.revokeBtn}
          >
            {isLoading ? 'Revoking...' : 'Revoke'}
          </button>
        )}
      </div>
    </div>
  );
}

const rowStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  content: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    marginRight: '16px',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  name: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#18181B',
  },
  meta: {
    fontSize: '13px',
    color: '#71717A',
  },
  date: {
    fontSize: '12px',
    color: '#A1A1AA',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  viewBtn: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#18181B',
    backgroundColor: '#F4F4F5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  approveBtn: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  revokeBtn: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#DC2626',
    backgroundColor: 'transparent',
    border: '1px solid #E4E4E7',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

// ============ Response Card (matches user interview UI) ============

function ResponseCard({ response }: { response: InterviewResponse }) {
  return (
    <div style={responseStyles.card}>
      <div style={responseStyles.header}>
        <span style={responseStyles.questionBadge}>Q{response.question_number}</span>
        {response.question_aspect_code && (
          <span style={responseStyles.aspectBadge}>{response.question_aspect_code}</span>
        )}
      </div>

      <p style={responseStyles.question}>{response.question_text}</p>

      <div style={responseStyles.answer}>
        {response.is_voice && (
          <div style={responseStyles.voiceTag}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
            </svg>
            <span>Voice</span>
          </div>
        )}
        <p style={responseStyles.answerText}>
          {response.text || <em style={{ color: '#A1A1AA' }}>No response</em>}
        </p>
      </div>

      {response.evaluation && (
        <div style={responseStyles.evaluation}>
          <div style={responseStyles.evalHeader}>
            <span style={responseStyles.evalTitle}>Evaluation</span>
            <span style={responseStyles.confidence}>
              {((response.evaluation.confidence_score || 0) * 100).toFixed(0)}%
            </span>
          </div>
          {response.evaluation.checklist_results && (
            <div style={responseStyles.checklist}>
              {response.evaluation.checklist_results.map((item) => (
                <div key={item.item_id} style={responseStyles.checkItem}>
                  {item.satisfied ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  )}
                  <span style={{ color: item.satisfied ? '#52525B' : '#A1A1AA' }}>
                    {item.item_text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={responseStyles.meta}>
        <span>Time: {formatDuration(response.time_spent_seconds)}</span>
        {response.is_followup && (
          <span style={responseStyles.followupTag}>Follow-up #{response.followup_count}</span>
        )}
      </div>
    </div>
  );
}

const responseStyles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  questionBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  aspectBadge: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#71717A',
    backgroundColor: '#F4F4F5',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  question: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#18181B',
    lineHeight: 1.6,
    margin: '0 0 14px 0',
  },
  answer: {
    backgroundColor: '#FAFAFA',
    borderRadius: '8px',
    padding: '14px 16px',
  },
  voiceTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 500,
    color: '#6366F1',
    marginBottom: '8px',
  },
  answerText: {
    fontSize: '14px',
    color: '#52525B',
    lineHeight: 1.7,
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  evaluation: {
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '1px solid #F4F4F5',
  },
  evalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  evalTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  confidence: {
    fontSize: '12px',
    color: '#A1A1AA',
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '1px solid #F4F4F5',
    fontSize: '12px',
    color: '#A1A1AA',
  },
  followupTag: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    padding: '2px 8px',
    borderRadius: '4px',
  },
};

// ============ Interview Accordion ============

function InterviewAccordion({
  interview,
  isAnonymous,
  onError,
  onViewFull,
}: {
  interview: InterviewSummary;
  isAnonymous: boolean;
  onError: (message: string) => void;
  onViewFull: (interview: InterviewSummary, responses: InterviewResponse[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (responses.length > 0) {
      setIsOpen(!isOpen);
      return;
    }

    setLoading(true);
    try {
      const data = await adminApi.getInterviewResponses(interview.id);
      setResponses(data);
      setIsOpen(true);
    } catch {
      onError('Failed to load responses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={accordionStyles.container}>
      <div onClick={toggle} style={accordionStyles.header}>
        <div style={accordionStyles.avatar}>
          {isAnonymous ? '?' : interview.participant_name.charAt(0).toUpperCase()}
        </div>
        <div style={accordionStyles.info}>
          <span style={accordionStyles.name}>
            {isAnonymous ? 'Anonymous' : interview.participant_name}
          </span>
          <span style={accordionStyles.meta}>
            {interview.response_count} responses · {formatDuration(interview.duration_seconds)}
          </span>
        </div>
        <div style={accordionStyles.right}>
          <span style={{
            ...accordionStyles.status,
            color: interview.status === 'submitted' ? '#059669' : '#71717A',
          }}>
            {interview.status === 'submitted' ? 'Complete' : interview.status}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#71717A"
            strokeWidth="2"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s ease',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {loading && (
        <div style={accordionStyles.loading}>
          <div style={accordionStyles.spinner} />
        </div>
      )}

      {isOpen && responses.length > 0 && (
        <div style={accordionStyles.content}>
          <button
            onClick={() => onViewFull(interview, responses)}
            style={accordionStyles.fullViewBtn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            View Full Interview
          </button>

          {responses.slice(0, 3).map((response) => (
            <ResponseCard key={response.id} response={response} />
          ))}

          {responses.length > 3 && (
            <button
              onClick={() => onViewFull(interview, responses)}
              style={accordionStyles.showMoreBtn}
            >
              +{responses.length - 3} more responses
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const accordionStyles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '8px',
    marginBottom: '8px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    cursor: 'pointer',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    backgroundColor: '#F4F4F5',
    color: '#52525B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
  },
  info: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  name: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#18181B',
  },
  meta: {
    fontSize: '13px',
    color: '#71717A',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  status: {
    fontSize: '13px',
    fontWeight: 500,
  },
  loading: {
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    borderTop: '1px solid #F4F4F5',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #E4E4E7',
    borderTopColor: '#18181B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  content: {
    padding: '16px',
    backgroundColor: '#FAFAFA',
    borderTop: '1px solid #E4E4E7',
  },
  fullViewBtn: {
    width: '100%',
    padding: '10px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#18181B',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  showMoreBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#71717A',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
};

// ============ Question Mini Sidebar ============

function QuestionMiniSidebar({
  responses,
  activeIndex,
  onNavigate,
}: {
  responses: InterviewResponse[];
  activeIndex: number;
  onNavigate: (index: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + '...' : text;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: isExpanded ? '220px' : '52px',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid #E4E4E7',
        zIndex: 50,
        transition: 'width 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingTop: '72px',
        paddingBottom: '24px',
      }}>
        {responses.map((resp, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={resp.id}
              onClick={() => onNavigate(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 10px',
                cursor: 'pointer',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                borderRadius: '0 8px 8px 0',
                transition: 'background-color 0.15s ease',
              }}
            >
              {/* Circle */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isActive ? '#6366F1' : '#18181B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                flexShrink: 0,
                boxShadow: isActive ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none',
              }}>
                {isActive ? resp.question_number : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>

              {/* Expanded text */}
              {isExpanded && (
                <div style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    color: isActive ? '#6366F1' : '#71717A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {resp.question_aspect_code || `Q${resp.question_number}`}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: isActive ? '#18181B' : '#52525B',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {truncate(resp.question_text, 28)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ Full Interview View ============

function FullInterviewView({
  interview,
  responses,
  isAnonymous,
  onBack,
}: {
  interview: InterviewSummary;
  responses: InterviewResponse[];
  isAnonymous: boolean;
  onBack: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const responseRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollToResponse = (index: number) => {
    setActiveIndex(index);
    responseRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Track scroll position to update active index
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY + 100;
      for (let i = responseRefs.current.length - 1; i >= 0; i--) {
        const ref = responseRefs.current[i];
        if (ref && ref.offsetTop <= scrollTop) {
          setActiveIndex(i);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={fullViewStyles.container}>
      {/* Mini Sidebar */}
      <QuestionMiniSidebar
        responses={responses}
        activeIndex={activeIndex}
        onNavigate={scrollToResponse}
      />

      {/* Header */}
      <header style={fullViewStyles.header}>
        <button onClick={onBack} style={fullViewStyles.backBtn}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={fullViewStyles.headerTitle}>
          {isAnonymous ? 'Anonymous Participant' : interview.participant_name}
        </span>
        <span style={fullViewStyles.headerMeta}>
          {responses.length} responses · {formatDuration(interview.duration_seconds)}
        </span>
      </header>

      {/* Content */}
      <main style={fullViewStyles.main}>
        <div style={fullViewStyles.content}>
          {responses.map((response, index) => (
            <div
              key={response.id}
              ref={(el) => { responseRefs.current[index] = el; }}
              style={fullViewStyles.responseCard}
            >
              <div style={fullViewStyles.cardHeader}>
                <div style={fullViewStyles.questionBadge}>Q{response.question_number}</div>
                <span style={fullViewStyles.aspect}>{response.question_aspect || response.question_aspect_code}</span>
              </div>
              <p style={fullViewStyles.questionText}>{response.question_text}</p>
              <div style={fullViewStyles.responseBox}>
                {response.is_voice && (
                  <div style={fullViewStyles.voiceIndicator}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2" />
                    </svg>
                    <span>Voice transcription</span>
                  </div>
                )}
                <p style={fullViewStyles.responseText}>
                  {response.text || <em style={{ color: '#A1A1AA' }}>No response provided</em>}
                </p>
              </div>

              {/* Evaluation if present */}
              {response.evaluation && response.evaluation.checklist_results && (
                <div style={fullViewStyles.evalSection}>
                  <div style={fullViewStyles.evalHeader}>
                    <span style={fullViewStyles.evalTitle}>Evaluation</span>
                    <span style={fullViewStyles.evalConfidence}>
                      {((response.evaluation.confidence_score || 0) * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <div style={fullViewStyles.checklist}>
                    {response.evaluation.checklist_results.map((item) => (
                      <div key={item.item_id} style={fullViewStyles.checkItem}>
                        {item.satisfied ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        )}
                        <span style={{ color: item.satisfied ? '#52525B' : '#A1A1AA' }}>
                          {item.item_text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={fullViewStyles.footer}>
        <button onClick={onBack} style={fullViewStyles.footerBtn}>
          Back to Assessment
        </button>
      </footer>
    </div>
  );
}

const fullViewStyles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FAFAFA',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    position: 'sticky',
    top: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 24px 16px 76px', // offset for sidebar
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E4E4E7',
    zIndex: 40,
  },
  backBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#18181B',
  },
  headerMeta: {
    fontSize: '13px',
    color: '#71717A',
    marginLeft: 'auto',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    paddingLeft: '52px', // sidebar width
  },
  content: {
    maxWidth: '680px',
    margin: '0 auto',
    padding: '24px',
  },
  responseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #E4E4E7',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  questionBadge: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  aspect: {
    fontSize: '12px',
    color: '#71717A',
    fontWeight: 500,
  },
  questionText: {
    fontSize: '14px',
    color: '#18181B',
    lineHeight: 1.6,
    margin: '0 0 16px 0',
  },
  responseBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: '8px',
    padding: '14px 16px',
  },
  voiceIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    fontWeight: 500,
    color: '#6366F1',
    marginBottom: '8px',
  },
  responseText: {
    fontSize: '14px',
    color: '#52525B',
    lineHeight: 1.7,
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  evalSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #F4F4F5',
  },
  evalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  evalTitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  evalConfidence: {
    fontSize: '12px',
    color: '#A1A1AA',
  },
  checklist: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  footer: {
    padding: '16px 24px 16px 76px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E4E4E7',
  },
  footerBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#52525B',
    backgroundColor: '#F4F4F5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

// ============ Assessment Detail ============

function AssessmentDetail({
  reviewId,
  onBack,
  onError,
  onStatusChange,
}: {
  reviewId: string;
  onBack: () => void;
  onError: (message: string) => void;
  onStatusChange: () => void;
}) {
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [fullView, setFullView] = useState<{
    interview: InterviewSummary;
    responses: InterviewResponse[];
  } | null>(null);

  useEffect(() => {
    loadReview();
  }, [reviewId]);

  const loadReview = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getReview(reviewId);
      setReview(data);
    } catch {
      onError('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await adminApi.approveReview(reviewId);
      await loadReview();
      onStatusChange();
    } catch {
      onError('Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    setActionLoading(true);
    try {
      await adminApi.revokeReview(reviewId);
      await loadReview();
      onStatusChange();
    } catch {
      onError('Failed to revoke');
    } finally {
      setActionLoading(false);
    }
  };

  if (fullView) {
    return (
      <FullInterviewView
        interview={fullView.interview}
        responses={fullView.responses}
        isAnonymous={review?.settings.anonymous_responses || false}
        onBack={() => setFullView(null)}
      />
    );
  }

  if (loading) {
    return (
      <div style={detailStyles.loading}>
        <div style={detailStyles.spinner} />
        <p style={detailStyles.loadingText}>Loading...</p>
      </div>
    );
  }

  if (!review) return null;

  const isPending = review.status === 'submitted';
  const interviews = review.interviews.filter(i => i.status === 'submitted');

  return (
    <div style={detailStyles.container}>
      <button onClick={onBack} style={detailStyles.backBtn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div style={detailStyles.header}>
        <div>
          <h1 style={detailStyles.title}>{review.name}</h1>
          <p style={detailStyles.subtitle}>
            {review.business.name} · {review.question_set.name}
          </p>
        </div>
        {isPending ? (
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            style={detailStyles.approveBtn}
          >
            {actionLoading ? 'Approving...' : 'Approve'}
          </button>
        ) : (
          <button
            onClick={handleRevoke}
            disabled={actionLoading}
            style={detailStyles.revokeBtn}
          >
            {actionLoading ? 'Revoking...' : 'Revoke'}
          </button>
        )}
      </div>

      <div style={detailStyles.stats}>
        <div style={detailStyles.statItem}>
          <span style={detailStyles.statValue}>{interviews.length}</span>
          <span style={detailStyles.statLabel}>Interviews</span>
        </div>
        <div style={detailStyles.statItem}>
          <span style={detailStyles.statValue}>{review.question_set.total_questions}</span>
          <span style={detailStyles.statLabel}>Questions</span>
        </div>
        <div style={detailStyles.statItem}>
          <span style={detailStyles.statValue}>
            {review.stats.total_submitted}/{review.stats.total_invited}
          </span>
          <span style={detailStyles.statLabel}>Participation</span>
        </div>
        <div style={detailStyles.statItem}>
          <span style={{ ...detailStyles.statValue, fontSize: '14px' }}>
            {formatDate(review.submitted_at)}
          </span>
          <span style={detailStyles.statLabel}>Submitted</span>
        </div>
      </div>

      {review.goal && (
        <div style={detailStyles.goalCard}>
          <span style={detailStyles.goalLabel}>Goal</span>
          <p style={detailStyles.goalText}>{review.goal}</p>
        </div>
      )}

      <div style={detailStyles.section}>
        <h2 style={detailStyles.sectionTitle}>
          Interviews ({interviews.length})
        </h2>
        {interviews.length === 0 ? (
          <p style={detailStyles.emptyText}>No submitted interviews</p>
        ) : (
          interviews.map((interview) => (
            <InterviewAccordion
              key={interview.id}
              interview={interview}
              isAnonymous={review.settings.anonymous_responses}
              onError={onError}
              onViewFull={(int, resp) => setFullView({ interview: int, responses: resp })}
            />
          ))
        )}
      </div>
    </div>
  );
}

const detailStyles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px 32px',
    maxWidth: '900px',
  },
  loading: {
    padding: '80px',
    textAlign: 'center',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '2px solid #E4E4E7',
    borderTopColor: '#18181B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    fontSize: '14px',
    color: '#71717A',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 0',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#71717A',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#18181B',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#71717A',
    margin: '4px 0 0 0',
  },
  approveBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  revokeBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#DC2626',
    backgroundColor: 'transparent',
    border: '1px solid #E4E4E7',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  stats: {
    display: 'flex',
    gap: '32px',
    padding: '20px 24px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#18181B',
  },
  statLabel: {
    fontSize: '12px',
    color: '#A1A1AA',
  },
  goalCard: {
    padding: '16px 20px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  goalLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  goalText: {
    fontSize: '14px',
    color: '#18181B',
    lineHeight: 1.6,
    margin: '8px 0 0 0',
  },
  section: {
    marginTop: '8px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#18181B',
    margin: '0 0 12px 0',
  },
  emptyText: {
    fontSize: '14px',
    color: '#A1A1AA',
    textAlign: 'center',
    padding: '40px',
  },
};

// ============ Business Detail ============

function BusinessDetail({
  businessId,
  onBack,
  onError,
  onViewAssessment,
}: {
  businessId: string;
  onBack: () => void;
  onError: (message: string) => void;
  onViewAssessment: (reviewId: string) => void;
}) {
  const [data, setData] = useState<BusinessReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [businessId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await adminApi.getBusinessReviews(businessId);
      setData(result);
      if (result.pending.length === 0 && result.completed.length > 0) {
        setTab('completed');
      }
    } catch {
      onError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      await adminApi.approveReview(reviewId);
      await loadData();
    } catch {
      onError('Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      await adminApi.revokeReview(reviewId);
      await loadData();
    } catch {
      onError('Failed to revoke');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={businessDetailStyles.loading}>
        <div style={businessDetailStyles.spinner} />
      </div>
    );
  }

  if (!data) return null;

  const reviews = tab === 'pending' ? data.pending : data.completed;

  return (
    <div style={businessDetailStyles.container}>
      <button onClick={onBack} style={businessDetailStyles.backBtn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div style={businessDetailStyles.header}>
        <div style={businessDetailStyles.avatar}>
          {data.business.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={businessDetailStyles.title}>{data.business.name}</h1>
          <p style={businessDetailStyles.subtitle}>
            {data.pending.length + data.completed.length} assessments
          </p>
        </div>
      </div>

      <div style={businessDetailStyles.tabs}>
        {(['pending', 'completed'] as const).map((t) => {
          const count = t === 'pending' ? data.pending.length : data.completed.length;
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...businessDetailStyles.tab,
                backgroundColor: active ? '#FFFFFF' : 'transparent',
                color: active ? '#18181B' : '#71717A',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t === 'pending' ? 'Pending' : 'Approved'}
              {count > 0 && (
                <span style={{
                  ...businessDetailStyles.tabCount,
                  backgroundColor: active ? (t === 'pending' ? '#FEF3C7' : '#D1FAE5') : '#F4F4F5',
                  color: t === 'pending' ? '#D97706' : '#059669',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {reviews.length === 0 ? (
        <p style={businessDetailStyles.empty}>No {tab} reviews</p>
      ) : (
        reviews.map((review) => (
          <ReviewRow
            key={review.id}
            review={review}
            isPending={tab === 'pending'}
            onView={() => onViewAssessment(review.id)}
            onApprove={tab === 'pending' ? () => handleApprove(review.id) : undefined}
            onRevoke={tab === 'completed' ? () => handleRevoke(review.id) : undefined}
            isLoading={actionLoading === review.id}
          />
        ))
      )}
    </div>
  );
}

const businessDetailStyles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px 32px',
    maxWidth: '800px',
  },
  loading: {
    padding: '80px',
    display: 'flex',
    justifyContent: 'center',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '2px solid #E4E4E7',
    borderTopColor: '#18181B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 0',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#71717A',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    backgroundColor: '#18181B',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 600,
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#18181B',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#71717A',
    margin: '4px 0 0 0',
  },
  tabs: {
    display: 'inline-flex',
    gap: '4px',
    padding: '4px',
    backgroundColor: '#F4F4F5',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tabCount: {
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: 600,
    borderRadius: '10px',
  },
  empty: {
    fontSize: '14px',
    color: '#A1A1AA',
    textAlign: 'center',
    padding: '60px 20px',
  },
};

// ============ Logo Color Generator ============

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
  // Generate consistent color based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % LOGO_COLORS.length;
  return LOGO_COLORS[index];
}

// ============ Split-Pane Reviews ============

interface PendingReview {
  id: string;
  name: string;
  goal?: string;
  question_set_name: string;
  interview_count: number;
  stats: {
    total_invited: number;
    total_submitted: number;
  };
  submitted_at?: string;
}

function SplitPaneReviews({
  businesses,
  onViewSource,
  onApprove,
  approvingReview,
  onRefresh,
}: {
  businesses: BusinessWithReviews[];
  onViewSource: (reviewId: string, businessId: string) => void;
  onApprove: (reviewId: string) => Promise<void>;
  approvingReview: string | null;
  onRefresh: () => void;
}) {
  // Only show businesses with pending reviews
  const pendingBusinesses = businesses.filter(b => b.pending_reviews > 0);

  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    pendingBusinesses.length > 0 ? pendingBusinesses[0].id : null
  );
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<Record<string, InterviewSummary[]>>({});
  const [loadingInterviews, setLoadingInterviews] = useState<string | null>(null);

  const selectedBusiness = pendingBusinesses.find(b => b.id === selectedBusinessId);

  // Load reviews when business changes
  useEffect(() => {
    if (selectedBusinessId) {
      loadReviews(selectedBusinessId);
    }
  }, [selectedBusinessId]);

  const loadReviews = async (businessId: string) => {
    setLoadingReviews(true);
    try {
      const data = await adminApi.getBusinessReviews(businessId);
      // Only show pending reviews
      setReviews(data.pending || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const toggleExpand = async (reviewId: string) => {
    if (expandedReview === reviewId) {
      setExpandedReview(null);
      return;
    }

    setExpandedReview(reviewId);

    // Load interviews if not already loaded
    if (!interviews[reviewId]) {
      setLoadingInterviews(reviewId);
      try {
        const detail = await adminApi.getReview(reviewId);
        setInterviews(prev => ({
          ...prev,
          [reviewId]: detail.interviews || [],
        }));
      } catch (err) {
        console.error('Failed to load interviews:', err);
      } finally {
        setLoadingInterviews(null);
      }
    }
  };

  const handleApprove = async (reviewId: string) => {
    await onApprove(reviewId);
    // Reload reviews for this business
    if (selectedBusinessId) {
      await loadReviews(selectedBusinessId);
    }
  };

  if (pendingBusinesses.length === 0) {
    return (
      <div style={splitStyles.emptyState}>
        <div style={splitStyles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" />
          </svg>
        </div>
        <h3 style={splitStyles.emptyTitle}>All caught up</h3>
        <p style={splitStyles.emptyText}>No pending assessments to review</p>
      </div>
    );
  }

  return (
    <div style={splitStyles.container}>
      {/* Stats Subtitle */}
      <p style={splitStyles.subtitle}>
        {pendingBusinesses.length} business{pendingBusinesses.length !== 1 ? 'es' : ''} · {pendingBusinesses.reduce((sum, b) => sum + b.pending_reviews, 0)} pending
      </p>

      {/* Split Pane Container */}
      <div style={splitStyles.splitContainer}>
        {/* Left Panel - Business List */}
        <div style={splitStyles.leftPanel}>
          <div style={splitStyles.panelHeader}>
            <span style={splitStyles.panelLabel}>Businesses</span>
          </div>
          <div style={splitStyles.businessList}>
            {pendingBusinesses.map(business => {
              const isSelected = business.id === selectedBusinessId;
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
                      {business.pending_reviews} pending
                    </span>
                  </div>
                  {business.pending_reviews > 0 && (
                    <span style={splitStyles.pendingBadge}>
                      {business.pending_reviews}
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
                    {reviews.length} pending assessment{reviews.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button onClick={onRefresh} style={splitStyles.refreshBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 4v6h-6M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                  </svg>
                </button>
              </div>

              <div style={splitStyles.assessmentList}>
                {loadingReviews ? (
                  <div style={splitStyles.loadingRow}>
                    <div style={splitStyles.spinner} />
                  </div>
                ) : reviews.length === 0 ? (
                  <div style={splitStyles.noReviews}>
                    <span>No pending reviews</span>
                  </div>
                ) : (
                  reviews.map(review => {
                    const isExpanded = expandedReview === review.id;
                    const isApproving = approvingReview === review.id;
                    const reviewInterviews = interviews[review.id] || [];
                    const isLoadingInterviews = loadingInterviews === review.id;

                    return (
                      <div key={review.id} style={splitStyles.assessmentCard}>
                        {/* Card Header */}
                        <div style={splitStyles.cardHeader}>
                          <div
                            style={splitStyles.cardInfo}
                            onClick={() => toggleExpand(review.id)}
                          >
                            <div style={splitStyles.cardTitleRow}>
                              <h3 style={splitStyles.cardTitle}>{review.name}</h3>
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#999999"
                                strokeWidth="2"
                                style={{
                                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                  transition: 'transform 0.2s ease',
                                  flexShrink: 0,
                                }}
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                            <span style={splitStyles.cardMeta}>
                              {review.question_set_name} · {review.interview_count} source{review.interview_count !== 1 ? 's' : ''}
                              {review.submitted_at && ` · ${timeAgo(review.submitted_at)}`}
                            </span>
                          </div>
                          <button
                            onClick={() => handleApprove(review.id)}
                            disabled={isApproving}
                            style={{
                              ...splitStyles.approveBtn,
                              opacity: isApproving ? 0.7 : 1,
                            }}
                          >
                            {isApproving ? (
                              <>
                                <div style={splitStyles.miniSpinner} />
                                <span>Approving...</span>
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Expanded Sources */}
                        {isExpanded && (
                          <div style={splitStyles.sourcesSection}>
                            {isLoadingInterviews ? (
                              <div style={splitStyles.loadingRow}>
                                <div style={splitStyles.spinner} />
                              </div>
                            ) : reviewInterviews.length === 0 ? (
                              <div style={splitStyles.noSources}>
                                No sources found
                              </div>
                            ) : (
                              <div style={splitStyles.sourcesList}>
                                {reviewInterviews.filter(i => i.status === 'submitted').map((interview, index) => (
                                  <div
                                    key={interview.id}
                                    onClick={() => onViewSource(review.id, selectedBusiness.id)}
                                    style={splitStyles.sourceItem}
                                  >
                                    <div style={splitStyles.sourceIndex}>
                                      {index + 1}
                                    </div>
                                    <div style={splitStyles.sourceInfo}>
                                      <span style={splitStyles.sourceName}>
                                        {interview.participant_name || 'Anonymous'}
                                      </span>
                                      <span style={splitStyles.sourceMeta}>
                                        {interview.response_count} responses · {formatDuration(interview.duration_seconds)}
                                      </span>
                                    </div>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCCCCC" strokeWidth="2">
                                      <path d="M9 18l6-6-6-6" />
                                    </svg>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div style={splitStyles.noSelection}>
              Select a business to view pending reviews
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Split-pane styles
const splitStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  subtitle: {
    fontSize: '13px',
    color: '#888888',
    margin: '0 0 16px 0',
  },
  splitContainer: {
    display: 'flex',
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E8E8E8',
    overflow: 'hidden',
    minHeight: '500px',
  },
  leftPanel: {
    width: '280px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
  },
  divider: {
    width: '1px',
    backgroundColor: '#EEEEEE',
    flexShrink: 0,
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FAFAFA',
    minWidth: 0,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #EEEEEE',
  },
  panelLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  businessList: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  businessItemWrapper: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
  },
  businessItemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  businessName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1A1A1A',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  businessMeta: {
    fontSize: '12px',
    color: '#888888',
  },
  pendingBadge: {
    minWidth: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: '#F59E0B',
    borderRadius: '10px',
    padding: '0 6px',
  },
  selectedBusinessName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1A1A1A',
    display: 'block',
  },
  selectedBusinessMeta: {
    fontSize: '13px',
    color: '#888888',
    display: 'block',
    marginTop: '2px',
  },
  refreshBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #E4E4E7',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    color: '#666666',
  },
  assessmentList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
  assessmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E8E8E8',
    marginBottom: '12px',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '16px',
    gap: '16px',
  },
  cardInfo: {
    flex: 1,
    cursor: 'pointer',
    minWidth: 0,
  },
  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#1A1A1A',
    margin: 0,
    flex: 1,
  },
  cardMeta: {
    fontSize: '13px',
    color: '#888888',
    display: 'block',
    marginTop: '4px',
  },
  approveBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 500,
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
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
  sourcesSection: {
    borderTop: '1px solid #F0F0F0',
    backgroundColor: '#FAFAFA',
    padding: '12px 16px',
  },
  sourcesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sourceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    backgroundColor: '#FFFFFF',
    borderRadius: '6px',
    border: '1px solid #EEEEEE',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
  },
  sourceIndex: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#F0F0F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 600,
    color: '#666666',
    flexShrink: 0,
  },
  sourceInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  sourceName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1A1A1A',
  },
  sourceMeta: {
    fontSize: '12px',
    color: '#888888',
  },
  noSources: {
    fontSize: '13px',
    color: '#AAAAAA',
    textAlign: 'center',
    padding: '12px',
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #E4E4E7',
    borderTopColor: '#18181B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  noReviews: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#AAAAAA',
    fontSize: '14px',
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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 40px',
    textAlign: 'center',
  },
  emptyIcon: {
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#666666',
    margin: '0 0 8px 0',
  },
  emptyText: {
    fontSize: '14px',
    color: '#999999',
    margin: '0',
  },
};

// ============ Main Reviews Section ============

type ViewState =
  | { type: 'board' }
  | { type: 'board'; selectedBusinessId?: string }
  | { type: 'assessment'; reviewId: string; businessId: string };

export function ReviewsSection({ onError }: ReviewsSectionProps) {
  const [businesses, setBusinesses] = useState<BusinessWithReviews[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ type: 'board' });
  const [approvingReview, setApprovingReview] = useState<string | null>(null);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getBusinessesWithReviews();
      setBusinesses(data);
    } catch {
      onError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    setApprovingReview(reviewId);
    try {
      await adminApi.approveReview(reviewId);
      // Refresh business list to update counts
      await loadBusinesses();
    } catch {
      onError('Failed to approve review');
    } finally {
      setApprovingReview(null);
    }
  };

  // When viewing assessment detail
  if (view.type === 'assessment') {
    return (
      <AssessmentDetail
        reviewId={view.reviewId}
        onBack={() => setView({ type: 'board', selectedBusinessId: view.businessId })}
        onError={onError}
        onStatusChange={loadBusinesses}
      />
    );
  }

  // Main split-pane view
  return (
    <div style={mainStyles.container}>
      {loading ? (
        <div style={mainStyles.loading}>
          <div style={mainStyles.spinner} />
        </div>
      ) : (
        <SplitPaneReviews
          businesses={businesses}
          onViewSource={(reviewId, businessId) => setView({
            type: 'assessment',
            reviewId,
            businessId,
          })}
          onApprove={handleApprove}
          approvingReview={approvingReview}
          onRefresh={loadBusinesses}
        />
      )}
    </div>
  );
}

const mainStyles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px 32px',
    height: '100%',
  },
  loading: {
    padding: '80px',
    display: 'flex',
    justifyContent: 'center',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '2px solid #E4E4E7',
    borderTopColor: '#18181B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default ReviewsSection;
