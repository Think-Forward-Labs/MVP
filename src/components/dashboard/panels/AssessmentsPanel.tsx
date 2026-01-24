import type { CSSProperties } from 'react';

interface AssessmentsPanelProps {
  onStartInterview: (mode: 'select' | 'text' | 'voice') => void;
  stats: {
    totalInterviews: number;
    completedInterviews: number;
    inProgressInterviews: number;
    totalBatches: number;
  };
}

export function AssessmentsPanel({ onStartInterview, stats }: AssessmentsPanelProps) {
  const completionRate = stats.totalInterviews > 0
    ? Math.round((stats.completedInterviews / stats.totalInterviews) * 100)
    : 0;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header with brand */}
        <header style={styles.header}>
          <div style={styles.brandMark}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="url(#brandGradient)" />
              <path
                d="M11 18L15.5 22.5L25 13"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="brandGradient" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1D1D1F" />
                  <stop offset="1" stopColor="#3A3A3C" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </header>

        {/* Welcome Section */}
        <div style={styles.welcomeSection}>
          <h1 style={styles.title}>Start an assessment</h1>
          <p style={styles.subtitle}>
            Structured interviews to evaluate your business readiness, capabilities, and growth potential.
          </p>
        </div>

        {/* Primary Actions - Glass Cards */}
        <div style={styles.actionsContainer}>
          <button
            style={styles.primaryAction}
            onClick={() => onStartInterview('text')}
          >
            <div style={styles.actionIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div style={styles.actionContent}>
              <span style={styles.actionTitle}>Text Interview</span>
              <span style={styles.actionDesc}>Type your responses at your own pace</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <button
            style={styles.secondaryAction}
            onClick={() => onStartInterview('voice')}
          >
            <div style={styles.secondaryActionIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <div style={styles.actionContent}>
              <span style={styles.secondaryActionTitle}>Voice Interview</span>
              <span style={styles.secondaryActionDesc}>Speak naturally, we'll transcribe</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(60, 60, 67, 0.3)' }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Stats Section - Glass Effect */}
        {stats.totalInterviews > 0 && (
          <div style={styles.statsSection}>
            <div style={styles.statsCard}>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <span style={styles.statValue}>{stats.completedInterviews}</span>
                  <span style={styles.statLabel}>Completed</span>
                </div>

                <div style={styles.statCard}>
                  <span style={styles.statValue}>{stats.inProgressInterviews}</span>
                  <span style={styles.statLabel}>In Progress</span>
                </div>

                <div style={styles.statCard}>
                  <span style={styles.statValue}>{stats.totalBatches}</span>
                  <span style={styles.statLabel}>Sessions</span>
                </div>

                <div style={styles.statCard}>
                  <span style={styles.statValue}>{completionRate}%</span>
                  <span style={styles.statLabel}>Completion</span>
                </div>
              </div>

              {/* Progress indicator */}
              <div style={styles.progressContainer}>
                <div style={styles.progressHeader}>
                  <span style={styles.progressLabel}>Overall progress</span>
                  <span style={styles.progressValue}>{stats.completedInterviews} of {stats.totalInterviews}</span>
                </div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${completionRate}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Info - Glass Card */}
        <div style={styles.infoSection}>
          <div style={styles.infoCard}>
            <div style={styles.infoHeader}>
              <div style={styles.infoIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <span style={styles.infoTitle}>About the assessment</span>
            </div>
            <p style={styles.infoText}>
              CABAS® Discovery is a standardized 28-question assessment designed to evaluate your
              business readiness, adaptive capabilities, and growth potential. Takes approximately
              18-22 minutes to complete.
            </p>
            <div style={styles.infoMetrics}>
              <div style={styles.infoMetric}>
                <span style={styles.metricValue}>28</span>
                <span style={styles.metricLabel}>Questions</span>
              </div>
              <div style={styles.infoMetric}>
                <span style={styles.metricValue}>18-22</span>
                <span style={styles.metricLabel}>Minutes</span>
              </div>
              <div style={styles.infoMetric}>
                <span style={styles.metricValue}>10</span>
                <span style={styles.metricLabel}>Categories</span>
              </div>
            </div>
          </div>
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
    padding: '48px 24px',
    overflowY: 'auto',
  },
  content: {
    width: '100%',
    maxWidth: '480px',
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '40px',
  },
  brandMark: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Welcome
  welcomeSection: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: '-0.02em',
    marginBottom: '12px',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '15px',
    fontWeight: '400',
    color: 'rgba(60, 60, 67, 0.6)',
    lineHeight: 1.6,
    maxWidth: '380px',
    margin: '0 auto',
  },

  // Actions - Glass Effect
  actionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '48px',
  },
  primaryAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '18px 22px',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  secondaryAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '18px 22px',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  actionIcon: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    color: '#FFFFFF',
  },
  actionContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  actionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: '-0.01em',
  },
  actionDesc: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  secondaryActionIcon: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: '12px',
    color: '#1D1D1F',
  },
  secondaryActionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: '-0.01em',
  },
  secondaryActionDesc: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.6)',
  },

  // Stats - Glass Effect
  statsSection: {
    marginBottom: '32px',
  },
  statsCard: {
    padding: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '20px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '26px',
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: '-0.02em',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },

  // Progress
  progressContainer: {
    padding: '16px',
    backgroundColor: 'rgba(118, 118, 128, 0.08)',
    borderRadius: '12px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  progressLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1D1D1F',
  },
  progressValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.6)',
  },
  progressBar: {
    height: '6px',
    backgroundColor: 'rgba(118, 118, 128, 0.16)',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #34C759 0%, #30D158 100%)',
    borderRadius: '3px',
    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Assessment Info - Glass Effect
  infoSection: {
    marginBottom: '32px',
  },
  infoCard: {
    padding: '22px 24px',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  infoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  infoIcon: {
    color: 'rgba(60, 60, 67, 0.6)',
  },
  infoTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: '-0.01em',
  },
  infoText: {
    fontSize: '13px',
    lineHeight: 1.6,
    color: 'rgba(60, 60, 67, 0.6)',
    marginBottom: '20px',
  },
  infoMetrics: {
    display: 'flex',
    gap: '32px',
  },
  infoMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  metricValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: '-0.02em',
  },
  metricLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
};

export default AssessmentsPanel;
