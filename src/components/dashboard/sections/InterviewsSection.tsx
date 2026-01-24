import type { CSSProperties } from 'react';
import { Icons } from '../../common/Icons';

interface InterviewsSectionProps {
  onStartInterview: (mode: 'select' | 'text' | 'voice') => void;
}

interface Interview {
  id: number;
  title: string;
  questions: number;
  duration: string;
  status: 'completed' | 'in_progress' | 'not_started';
  completedAt?: string;
  progress?: number;
}

export function InterviewsSection({ onStartInterview }: InterviewsSectionProps) {
  const interviews: Interview[] = [
    { id: 1, title: 'Executive Leadership Assessment', questions: 16, duration: '25 min', status: 'completed', completedAt: 'Jan 22, 2026' },
    { id: 2, title: 'Strategy & Planning Review', questions: 12, duration: '20 min', status: 'completed', completedAt: 'Jan 20, 2026' },
    { id: 3, title: 'Operations Readiness', questions: 14, duration: '22 min', status: 'in_progress', progress: 60 },
    { id: 4, title: 'Technology Infrastructure', questions: 18, duration: '30 min', status: 'not_started' },
    { id: 5, title: 'Team & Culture Assessment', questions: 10, duration: '15 min', status: 'not_started' },
  ];

  return (
    <div style={styles.sectionContainer}>
      <div style={styles.sectionHeader}>
        <div>
          <h1 style={styles.sectionTitle}>Interviews</h1>
          <p style={styles.sectionSubtitle}>Complete structured assessments to evaluate your business</p>
        </div>
        <button style={styles.primaryActionButton} onClick={() => onStartInterview('select')}>
          <Icons.Plus />
          Start Interview
        </button>
      </div>

      <div style={styles.interviewsList}>
        {interviews.map(interview => (
          <div key={interview.id} style={styles.interviewCard}>
            <div style={styles.interviewInfo}>
              <h3 style={styles.interviewTitle}>{interview.title}</h3>
              <div style={styles.interviewMeta}>
                <span style={styles.interviewMetaItem}>
                  <Icons.Interview />
                  {interview.questions} questions
                </span>
                <span style={styles.interviewMetaItem}>
                  <Icons.Clock />
                  {interview.duration}
                </span>
              </div>
            </div>

            <div style={styles.interviewStatus}>
              {interview.status === 'completed' && (
                <>
                  <span style={styles.statusBadgeCompleted}>
                    <Icons.Check />
                    Completed
                  </span>
                  <span style={styles.completedDate}>{interview.completedAt}</span>
                </>
              )}
              {interview.status === 'in_progress' && (
                <>
                  <div style={styles.progressBarSmall}>
                    <div style={{ ...styles.progressBarFill, width: `${interview.progress}%` }} />
                  </div>
                  <span style={styles.progressText}>{interview.progress}% complete</span>
                </>
              )}
              {interview.status === 'not_started' && (
                <span style={styles.statusBadgePending}>Not started</span>
              )}
            </div>

            <button
              style={styles.interviewAction}
              onClick={() => onStartInterview('select')}
            >
              {interview.status === 'completed' ? 'View' : interview.status === 'in_progress' ? 'Continue' : 'Start'}
              <Icons.ChevronRight />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  sectionContainer: {
    maxWidth: '1000px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    marginBottom: '8px',
  },
  sectionSubtitle: {
    fontSize: '15px',
    color: '#71717A',
  },
  primaryActionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  interviewsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  interviewCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '20px 24px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '12px',
  },
  interviewInfo: {
    flex: 1,
  },
  interviewTitle: {
    fontSize: '15px',
    fontWeight: '500',
    marginBottom: '8px',
  },
  interviewMeta: {
    display: 'flex',
    gap: '16px',
  },
  interviewMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#71717A',
  },
  interviewStatus: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    minWidth: '140px',
  },
  statusBadgeCompleted: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#059669',
  },
  statusBadgePending: {
    fontSize: '12px',
    color: '#71717A',
  },
  completedDate: {
    fontSize: '12px',
    color: '#A1A1AA',
  },
  progressBarSmall: {
    width: '100px',
    height: '4px',
    backgroundColor: '#F4F4F5',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#18181B',
  },
  progressText: {
    fontSize: '12px',
    color: '#71717A',
  },
  interviewAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#18181B',
    backgroundColor: '#F4F4F5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default InterviewsSection;
