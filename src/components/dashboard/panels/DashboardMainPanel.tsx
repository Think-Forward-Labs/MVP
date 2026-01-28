import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { reviewsApi, type MyAssessmentResponse } from '../../../services/api';
import type { User } from '../../../types/app';

interface DashboardMainPanelProps {
  user: User | null;
  onCreateAssessment: () => void;
  onStartInterview: (reviewId: string, participantId: string) => void;
  onViewInterview?: (reviewId: string, participantId: string, interviewId: string) => void;
  onEditInterview?: (reviewId: string, participantId: string, interviewId: string) => void;
  stats: {
    totalAssessments: number;
    totalParticipants: number;
    completedInterviews: number;
    completionRate: number;
  };
}

export function DashboardMainPanel({
  user,
  onCreateAssessment,
  onStartInterview,
  onViewInterview,
  onEditInterview,
  stats,
}: DashboardMainPanelProps) {
  const [pendingAssessments, setPendingAssessments] = useState<MyAssessmentResponse[]>([]);
  const [completedAssessments, setCompletedAssessments] = useState<MyAssessmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const data = await reviewsApi.myAssessments();
        // Filter into pending and completed
        setPendingAssessments(data.filter(a =>
          a.participant_status !== 'completed' && a.participant_status !== 'submitted'
        ));
        setCompletedAssessments(data.filter(a =>
          a.participant_status === 'completed' || a.participant_status === 'submitted'
        ));
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessments();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Welcome Section */}
        <header style={styles.header}>
          <div style={styles.welcomeText}>
            <h1 style={styles.greeting}>{getGreeting()}, {user?.name?.split(' ')[0] || 'there'}</h1>
            <p style={styles.subtitle}>Manage your organizational assessments</p>
          </div>
        </header>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stats.totalAssessments}</span>
              <span style={styles.statLabel}>Assessments</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: 'rgba(88, 86, 214, 0.1)', color: '#5856D6'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stats.totalParticipants}</span>
              <span style={styles.statLabel}>Participants</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: 'rgba(52, 199, 89, 0.1)', color: '#34C759'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stats.completedInterviews}</span>
              <span style={styles.statLabel}>Completed</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{...styles.statIcon, backgroundColor: 'rgba(255, 149, 0, 0.1)', color: '#FF9500'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 20V10M18 20V4M6 20v-4" />
              </svg>
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{stats.completionRate}%</span>
              <span style={styles.statLabel}>Completion</span>
            </div>
          </div>
        </div>

        {/* Create Assessment CTA */}
        <div style={styles.ctaSection}>
          <div style={styles.ctaCard}>
            <div style={styles.ctaContent}>
              <div style={styles.ctaIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <div style={styles.ctaText}>
                <h2 style={styles.ctaTitle}>Create New Assessment</h2>
                <p style={styles.ctaDesc}>
                  Launch a CABAS® Discovery assessment to evaluate organizational readiness and capabilities
                </p>
              </div>
            </div>
            <button style={styles.ctaButton} onClick={onCreateAssessment}>
              Get Started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Pending Assessments */}
        {pendingAssessments.length > 0 && (
          <div style={styles.pendingSection}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Your Pending Interviews</h3>
              <span style={styles.pendingCount}>{pendingAssessments.length}</span>
            </div>
            <div style={styles.pendingList}>
              {pendingAssessments.map((assessment) => (
                <button
                  key={assessment.participant_id}
                  style={styles.pendingCard}
                  onClick={() => onStartInterview(assessment.review_id, assessment.participant_id)}
                >
                  <div style={styles.pendingIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div style={styles.pendingContent}>
                    <span style={styles.pendingName}>{assessment.review_name}</span>
                    <span style={styles.pendingStatus}>
                      {assessment.participant_status === 'started'
                        ? `${assessment.interview_progress}% completed`
                        : 'Ready to start'}
                    </span>
                  </div>
                  <div style={styles.pendingAction}>
                    {assessment.participant_status === 'started' ? (
                      <span style={styles.continueLabel}>Continue</span>
                    ) : (
                      <span style={styles.startLabel}>Start</span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Completed Assessments */}
        {completedAssessments.length > 0 && (
          <div style={styles.completedSection}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Completed Assessments</h3>
              <span style={styles.completedCount}>{completedAssessments.length}</span>
            </div>
            <div style={styles.completedList}>
              {completedAssessments.map((assessment) => {
                const isSubmitted = assessment.participant_status === 'submitted';
                const canEdit = !isSubmitted;

                return (
                  <div
                    key={assessment.participant_id}
                    style={styles.completedCard}
                  >
                    <div style={styles.completedIconWrapper}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isSubmitted ? '#34C759' : '#007AFF'} strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <div style={styles.completedContent}>
                      <span style={styles.completedName}>{assessment.review_name}</span>
                      <div style={styles.completedMeta}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: isSubmitted ? 'rgba(52, 199, 89, 0.12)' : 'rgba(0, 122, 255, 0.12)',
                          color: isSubmitted ? '#059669' : '#007AFF',
                        }}>
                          {isSubmitted ? 'Submitted' : 'Completed'}
                        </span>
                        <span style={styles.completedDate}>
                          {new Date(assessment.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div style={styles.completedActions}>
                      <button
                        style={styles.viewButton}
                        onClick={() => {
                          if (onViewInterview && assessment.interview_id) {
                            onViewInterview(assessment.review_id, assessment.participant_id, assessment.interview_id);
                          }
                        }}
                        title="View responses"
                        disabled={!assessment.interview_id}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        View
                      </button>
                      {canEdit && assessment.interview_id && (
                        <button
                          style={styles.editButton}
                          onClick={() => {
                            if (onEditInterview && assessment.interview_id) {
                              onEditInterview(assessment.review_id, assessment.participant_id, assessment.interview_id);
                            }
                          }}
                          title="Edit responses"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {stats.totalAssessments === 0 && pendingAssessments.length === 0 && !loading && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                <line x1="12" y1="12" x2="12" y2="12.01" />
              </svg>
            </div>
            <h3 style={styles.emptyTitle}>No assessments yet</h3>
            <p style={styles.emptyText}>
              Create your first assessment to start collecting insights from your team
            </p>
          </div>
        )}

        {/* Info Card */}
        <div style={styles.infoCard}>
          <div style={styles.infoHeader}>
            <div style={styles.infoIconSmall}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
            <span style={styles.infoTitle}>About CABAS® Discovery</span>
          </div>
          <p style={styles.infoText}>
            A standardized 28-question assessment evaluating business readiness, adaptive capabilities,
            and growth potential. Takes approximately 18-22 minutes to complete.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 24px',
    overflowY: 'auto',
  },
  content: {
    width: '100%',
    maxWidth: '640px',
  },

  // Header
  header: {
    marginBottom: '32px',
  },
  welcomeText: {},
  greeting: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: '-0.02em',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '15px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: 0,
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '32px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  statIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: '10px',
    color: '#007AFF',
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: '-0.02em',
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },

  // CTA Section
  ctaSection: {
    marginBottom: '32px',
  },
  ctaCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
    padding: '28px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '20px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
  },
  ctaContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    flex: 1,
  },
  ctaIcon: {
    width: '52px',
    height: '52px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    borderRadius: '14px',
    color: '#FFFFFF',
    flexShrink: 0,
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1D1D1F',
    margin: '0 0 6px 0',
    letterSpacing: '-0.01em',
  },
  ctaDesc: {
    fontSize: '14px',
    color: 'rgba(60, 60, 67, 0.6)',
    lineHeight: 1.5,
    margin: 0,
  },
  ctaButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },

  // Pending Section
  pendingSection: {
    marginBottom: '32px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1D1D1F',
    margin: 0,
  },
  pendingCount: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#FF9500',
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  pendingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  pendingCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    width: '100%',
    padding: '16px 18px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '14px',
    border: '1px solid rgba(255, 149, 0, 0.2)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  pendingIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: '10px',
    color: '#FF9500',
    flexShrink: 0,
  },
  pendingContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  pendingName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#1D1D1F',
  },
  pendingStatus: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.6)',
  },
  pendingAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#FF9500',
  },
  continueLabel: {
    fontSize: '13px',
    fontWeight: '500',
  },
  startLabel: {
    fontSize: '13px',
    fontWeight: '500',
  },

  // Completed Section
  completedSection: {
    marginBottom: '32px',
  },
  completedCount: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#34C759',
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    padding: '2px 8px',
    borderRadius: '10px',
  },
  completedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  completedCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 18px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '14px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  completedIconWrapper: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: '10px',
    flexShrink: 0,
  },
  completedContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  completedName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#1D1D1F',
  },
  completedMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  completedDate: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.6)',
  },
  completedActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#71717A',
    backgroundColor: 'rgba(118, 118, 128, 0.08)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  // Empty State
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '20px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
    marginBottom: '32px',
  },
  emptyIcon: {
    color: 'rgba(60, 60, 67, 0.3)',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#1D1D1F',
    margin: '0 0 8px 0',
  },
  emptyText: {
    fontSize: '14px',
    color: 'rgba(60, 60, 67, 0.6)',
    textAlign: 'center',
    maxWidth: '280px',
    margin: 0,
    lineHeight: 1.5,
  },

  // Info Card
  infoCard: {
    padding: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.2) inset',
  },
  infoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  infoIconSmall: {
    color: 'rgba(60, 60, 67, 0.5)',
  },
  infoTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1D1D1F',
  },
  infoText: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.6)',
    lineHeight: 1.6,
    margin: 0,
  },
};

export default DashboardMainPanel;
