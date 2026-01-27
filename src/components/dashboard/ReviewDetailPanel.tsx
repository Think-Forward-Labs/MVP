import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Icons } from '../common/Icons';
import { reviewsApi } from '../../services/api';
import type { User, ReviewDetail } from '../../types/app';

interface ReviewDetailPanelProps {
  review: ReviewDetail;
  user: User | null;
  onBack: () => void;
  onStartInterview: (reviewId: string, participantId: string) => void;
  onParticipantAdded: () => void;
}

export function ReviewDetailPanel({
  review,
  user,
  onBack,
  onStartInterview,
  onParticipantAdded,
}: ReviewDetailPanelProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(review.name);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentUserParticipant = review.participants.find(
    p => user && p.email.toLowerCase() === user.email.toLowerCase()
  );

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await reviewsApi.addParticipant(review.id, email, name);
      setEmail('');
      setName('');
      setShowInviteForm(false);
      onParticipantAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setLoading(false);
    }
  };

  const completedCount = review.participants.filter(p => p.status === 'completed' || p.status === 'submitted').length;
  const submittedCount = review.participants.filter(p => p.status === 'submitted').length;
  const totalCount = review.participants.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const canSubmitAssessment = review.is_creator && review.status === 'ongoing' && submittedCount > 0;

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      draft: 'Draft',
      ongoing: 'Ongoing',
      submitted: 'Submitted',
      reviewed: 'Under Review',
      evaluated: 'Evaluated',
      archived: 'Archived',
      // Legacy statuses
      active: 'Ongoing',
      completed: 'Evaluated',
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      draft: { bg: '#F4F4F5', text: '#52525B' },
      ongoing: { bg: '#DBEAFE', text: '#1E40AF' },
      submitted: { bg: '#FEF3C7', text: '#92400E' },
      reviewed: { bg: '#E0E7FF', text: '#3730A3' },
      evaluated: { bg: '#D1FAE5', text: '#065F46' },
      archived: { bg: '#F4F4F5', text: '#71717A' },
    };
    return map[status] || { bg: '#F4F4F5', text: '#52525B' };
  };

  const getParticipantStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      submitted: 'Submitted',
      completed: 'Done',
      started: 'In progress',
      invited: 'Pending',
    };
    return map[status] || status;
  };

  const handleSubmitAssessment = async () => {
    setIsSubmittingAssessment(true);
    setSubmitError(null);
    try {
      await reviewsApi.submit(review.id);
      onParticipantAdded(); // Refresh the data
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit assessment');
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  // Avatar colors - consistent color per person based on name hash
  const getAvatarColor = (name: string) => {
    const colors = [
      { bg: '#DBEAFE', text: '#1E40AF' }, // Blue
      { bg: '#DCE8D8', text: '#166534' }, // Green
      { bg: '#FEE2E2', text: '#991B1B' }, // Red
      { bg: '#FEF3C7', text: '#92400E' }, // Amber
      { bg: '#E0E7FF', text: '#3730A3' }, // Indigo
      { bg: '#FCE7F3', text: '#9D174D' }, // Pink
      { bg: '#CCFBF1', text: '#115E59' }, // Teal
      { bg: '#F3E8FF', text: '#6B21A8' }, // Purple
    ];
    // Simple hash based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handleTitleSave = async () => {
    if (editedTitle.trim() && editedTitle !== review.name) {
      try {
        await reviewsApi.update(review.id, { name: editedTitle.trim() });
        onParticipantAdded(); // Refresh the data
      } catch (err) {
        setEditedTitle(review.name); // Revert on error
      }
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(review.name);
      setIsEditingTitle(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Glass Background */}
      <div style={styles.bgGradient} />
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />

      {/* Top Bar */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={onBack}>
          <Icons.ArrowLeft />
          <span>Assessments</span>
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Page Header */}
        <div style={styles.pageHeader}>
          <div style={styles.titleRow}>
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={e => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                style={styles.titleInput}
                autoFocus
              />
            ) : (
              <h1
                style={styles.title}
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit"
              >
                {review.name}
                <span style={styles.editIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </span>
              </h1>
            )}
            <span style={{
              ...styles.statusBadge,
              backgroundColor: getStatusColor(review.status).bg,
              color: getStatusColor(review.status).text,
            }}>{getStatusLabel(review.status)}</span>
          </div>
          {review.goal && <p style={styles.subtitle}>{review.goal}</p>}
        </div>

        {/* Stats Row */}
        <div style={styles.statsRow}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{totalCount}</span>
            <span style={styles.statLabel}>Participants</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span style={styles.statValue}>{completedCount}</span>
            <span style={styles.statLabel}>Completed</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span style={styles.statValue}>{submittedCount}</span>
            <span style={styles.statLabel}>Submitted</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span style={styles.statValue}>{progressPercent}%</span>
            <span style={styles.statLabel}>Progress</span>
          </div>
          <div style={styles.progressBarWrapper}>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Submit Assessment Section */}
        {canSubmitAssessment && (
          <div style={styles.submitSection}>
            <div style={styles.submitInfo}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              <span>{submittedCount} of {totalCount} participants have submitted their interviews. Ready to submit for evaluation?</span>
            </div>
            {submitError && <div style={styles.submitError}>{submitError}</div>}
            <button
              style={{...styles.submitAssessmentBtn, opacity: isSubmittingAssessment ? 0.7 : 1}}
              onClick={handleSubmitAssessment}
              disabled={isSubmittingAssessment}
            >
              {isSubmittingAssessment ? 'Submitting...' : 'Submit Assessment for Evaluation'}
            </button>
          </div>
        )}

        {/* Assessment Already Submitted Notice */}
        {review.status === 'submitted' && (
          <div style={styles.submittedNotice}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>This assessment has been submitted for evaluation. Responses are now locked.</span>
          </div>
        )}

        {/* Main Grid */}
        <div style={styles.grid}>
          {/* Left Column */}
          <div style={styles.mainCol}>
            {/* Data Sources Section */}
            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Data Sources</h2>
              </div>
              <div style={styles.cardList}>
                {/* Interview - Active */}
                <div style={styles.card}>
                  <div style={styles.cardIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <div style={styles.cardContent}>
                    <div style={styles.cardHeader}>
                      <span style={styles.cardTitle}>Interview</span>
                      <span style={styles.activeTag}>Active</span>
                    </div>
                    <p style={styles.cardDesc}>Structured conversations to gather participant insights</p>
                  </div>
                  {currentUserParticipant && currentUserParticipant.status !== 'completed' && (
                    <button
                      style={styles.cardAction}
                      onClick={() => onStartInterview(review.id, currentUserParticipant.id)}
                    >
                      {currentUserParticipant.status === 'started' ? 'Continue' : 'Start'}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Document Analysis - Coming Soon */}
                <div style={styles.cardDisabled}>
                  <div style={styles.cardIconDisabled}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div style={styles.cardContent}>
                    <div style={styles.cardHeader}>
                      <span style={styles.cardTitleDisabled}>Document Analysis</span>
                      <span style={styles.comingSoonTag}>Coming soon</span>
                    </div>
                    <p style={styles.cardDescDisabled}>Upload documents for automated analysis</p>
                  </div>
                </div>

                {/* Source Connectors - Coming Soon */}
                <div style={styles.cardDisabled}>
                  <div style={styles.cardIconDisabled}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </div>
                  <div style={styles.cardContent}>
                    <div style={styles.cardHeader}>
                      <span style={styles.cardTitleDisabled}>Source Connectors</span>
                      <span style={styles.comingSoonTag}>Coming soon</span>
                    </div>
                    <p style={styles.cardDescDisabled}>Connect external tools and data sources</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div style={styles.sideCol}>
            {/* Team Section */}
            <section style={styles.section}>
              <div style={styles.sectionHeader}>
                <h2 style={styles.sectionTitle}>Team</h2>
                <button
                  style={styles.inviteBtn}
                  onClick={() => setShowInviteForm(!showInviteForm)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Invite
                </button>
              </div>

              {/* Invite Form */}
              {showInviteForm && (
                <div style={styles.inviteFormContainer}>
                  <form onSubmit={handleInvite} style={styles.inviteForm}>
                    {error && <div style={styles.errorMsg}>{error}</div>}
                    <input
                      type="text"
                      placeholder="Name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      style={styles.input}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={styles.input}
                      required
                    />
                    <div style={styles.inviteFormActions}>
                      <button
                        type="button"
                        style={styles.cancelBtn}
                        onClick={() => {
                          setShowInviteForm(false);
                          setError(null);
                          setEmail('');
                          setName('');
                        }}
                      >
                        Cancel
                      </button>
                      <button type="submit" style={styles.submitBtn} disabled={loading}>
                        {loading ? 'Sending...' : 'Send invite'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Team List */}
              <div style={styles.teamList}>
                {review.participants.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <p style={styles.emptyText}>No participants yet</p>
                    <p style={styles.emptyHint}>Invite team members to start</p>
                  </div>
                ) : (
                  review.participants.map(participant => {
                    const isCurrentUser = user && participant.email.toLowerCase() === user.email.toLowerCase();
                    const initials = participant.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);
                    const avatarColor = getAvatarColor(participant.name);

                    return (
                      <div key={participant.id} style={styles.teamMember}>
                        <div style={{
                          ...styles.avatar,
                          backgroundColor: avatarColor.bg,
                          color: avatarColor.text,
                        }}>{initials}</div>
                        <div style={styles.memberInfo}>
                          <div style={styles.memberNameRow}>
                            <span style={styles.memberName}>{participant.name}</span>
                            {isCurrentUser && <span style={styles.youLabel}>You</span>}
                          </div>
                          <span style={styles.memberEmail}>{participant.email}</span>
                        </div>
                        <span style={styles.memberStatus}>
                          {getParticipantStatusLabel(participant.status)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// All colors from black (#18181B) and zinc palette only
const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F5F5F7',
    position: 'relative',
    overflow: 'hidden',
  },

  // Glass Background
  bgGradient: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #F5F5F7 0%, #E8E8ED 50%, #F5F5F7 100%)',
    zIndex: 0,
  },
  bgOrb1: {
    position: 'fixed',
    top: '-20%',
    right: '-10%',
    width: '60%',
    height: '60%',
    background: 'radial-gradient(circle, rgba(0, 0, 0, 0.03) 0%, transparent 70%)',
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'fixed',
    bottom: '-30%',
    left: '-10%',
    width: '50%',
    height: '50%',
    background: 'radial-gradient(circle, rgba(0, 0, 0, 0.02) 0%, transparent 70%)',
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
  },

  // Top Bar
  topBar: {
    position: 'relative',
    zIndex: 10,
    padding: '12px 24px',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    marginLeft: '-10px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#52525B',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },

  // Content
  content: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '32px 24px',
  },

  // Page Header
  pageHeader: {
    marginBottom: '24px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '6px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#18181B',
    letterSpacing: '-0.02em',
    margin: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  titleInput: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#18181B',
    letterSpacing: '-0.02em',
    margin: 0,
    padding: '4px 8px',
    border: '1px solid #E4E4E7',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    minWidth: '300px',
  },
  editIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#A1A1AA',
    opacity: 0.4,
  },
  statusBadge: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#52525B',
    backgroundColor: '#F4F4F5',
    padding: '4px 10px',
    borderRadius: '4px',
  },
  subtitle: {
    fontSize: '15px',
    color: '#71717A',
    margin: 0,
    lineHeight: 1.5,
  },

  // Stats Row
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '20px 24px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '12px',
    marginBottom: '32px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#18181B',
    letterSpacing: '-0.02em',
  },
  statLabel: {
    fontSize: '13px',
    color: '#71717A',
  },
  statDivider: {
    width: '1px',
    height: '36px',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  progressBarWrapper: {
    flex: 1,
    marginLeft: '8px',
  },
  progressTrack: {
    height: '6px',
    backgroundColor: '#E4E4E7',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#18181B',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },

  // Grid Layout
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '24px',
  },
  mainCol: {},
  sideCol: {},

  // Section
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#18181B',
    margin: 0,
  },

  // Card List
  cardList: {},
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
  cardDisabled: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
    opacity: 0.5,
  },
  cardIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181B',
    borderRadius: '8px',
    color: '#FFFFFF',
    flexShrink: 0,
  },
  cardIconDisabled: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4E4E7',
    borderRadius: '8px',
    color: '#71717A',
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#18181B',
  },
  cardTitleDisabled: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#71717A',
  },
  activeTag: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#18181B',
    backgroundColor: '#F4F4F5',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  comingSoonTag: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#A1A1AA',
    backgroundColor: '#FAFAFA',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  cardDesc: {
    fontSize: '13px',
    color: '#71717A',
    margin: 0,
  },
  cardDescDisabled: {
    fontSize: '13px',
    color: '#A1A1AA',
    margin: 0,
  },
  cardAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    flexShrink: 0,
  },

  // Invite Button
  inviteBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#18181B',
    backgroundColor: '#F4F4F5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },

  // Invite Form
  inviteFormContainer: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
    backgroundColor: 'rgba(118, 118, 128, 0.06)',
  },
  inviteForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  errorMsg: {
    fontSize: '13px',
    color: '#DC2626',
    padding: '10px 12px',
    backgroundColor: '#FEF2F2',
    borderRadius: '6px',
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    color: '#18181B',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '6px',
    outline: 'none',
  },
  inviteFormActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '4px',
  },
  cancelBtn: {
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#71717A',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },

  // Team List
  teamList: {
    padding: '8px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: '10px',
    color: '#A1A1AA',
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#52525B',
    margin: '0 0 4px 0',
  },
  emptyHint: {
    fontSize: '13px',
    color: '#A1A1AA',
    margin: 0,
  },
  teamMember: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4E4E7',
    borderRadius: '8px',
    color: '#52525B',
    fontSize: '13px',
    fontWeight: '600',
    flexShrink: 0,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  memberName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#18181B',
  },
  youLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#71717A',
    backgroundColor: '#F4F4F5',
    padding: '1px 5px',
    borderRadius: '3px',
  },
  memberEmail: {
    fontSize: '13px',
    color: '#71717A',
  },
  memberStatus: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#71717A',
    flexShrink: 0,
  },

  // Submit Assessment Section
  submitSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px 24px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '12px',
    marginBottom: '32px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  submitInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#52525B',
  },
  submitError: {
    fontSize: '13px',
    color: '#DC2626',
    padding: '10px 12px',
    backgroundColor: '#FEF2F2',
    borderRadius: '6px',
  },
  submitAssessmentBtn: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#059669',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    transition: 'all 0.15s ease',
  },
  submittedNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 20px',
    backgroundColor: '#D1FAE5',
    color: '#065F46',
    fontSize: '14px',
    borderRadius: '12px',
    marginBottom: '32px',
  },
};

export default ReviewDetailPanel;
