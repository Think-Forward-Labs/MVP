import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Icons } from '../common/Icons';
import { AssessmentsPanel } from './panels/AssessmentsPanel';
import type { User, DashboardSection } from '../../types/app';

interface DashboardProps {
  user: User | null;
  section: DashboardSection;
  setSection: (section: DashboardSection) => void;
  onLogout: () => void;
  onStartInterview: (mode: 'select' | 'text' | 'voice') => void;
}

interface Interview {
  id: string;
  title: string;
  status: 'complete' | 'in-progress' | 'pending';
  duration?: string;
  date: Date;
}

interface Batch {
  id: string;
  name: string;
  date: Date;
  interviews: Interview[];
  isExpanded: boolean;
}

export function Dashboard({ user, section, setSection, onLogout, onStartInterview }: DashboardProps) {
  const [hoveredBatch, setHoveredBatch] = useState<string | null>(null);
  const [hoveredInterview, setHoveredInterview] = useState<string | null>(null);

  const [batches, setBatches] = useState<Batch[]>([
    {
      id: 'b1',
      name: 'Q4 Leadership Review',
      date: new Date(Date.now() - 86400000),
      isExpanded: true,
      interviews: [
        { id: 'i1', title: 'Executive leadership assessment', status: 'complete', duration: '23 min', date: new Date(Date.now() - 86400000) },
        { id: 'i2', title: 'Strategy & planning review', status: 'complete', duration: '18 min', date: new Date(Date.now() - 90000000) },
        { id: 'i3', title: 'Team culture evaluation', status: 'in-progress', date: new Date(Date.now() - 93600000) },
      ]
    },
    {
      id: 'b2',
      name: 'Operations Assessment',
      date: new Date(Date.now() - 259200000),
      isExpanded: false,
      interviews: [
        { id: 'i4', title: 'Process efficiency review', status: 'complete', duration: '31 min', date: new Date(Date.now() - 259200000) },
        { id: 'i5', title: 'Resource allocation analysis', status: 'complete', duration: '27 min', date: new Date(Date.now() - 262800000) },
      ]
    },
    {
      id: 'b3',
      name: 'Technology Infrastructure',
      date: new Date(Date.now() - 604800000),
      isExpanded: false,
      interviews: [
        { id: 'i6', title: 'Systems architecture review', status: 'complete', duration: '42 min', date: new Date(Date.now() - 604800000) },
        { id: 'i7', title: 'Security assessment', status: 'pending', date: new Date(Date.now() - 608400000) },
      ]
    },
  ]);

  const toggleBatch = (batchId: string) => {
    setBatches(prev => prev.map(batch =>
      batch.id === batchId ? { ...batch, isExpanded: !batch.isExpanded } : batch
    ));
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate stats
  const totalInterviews = batches.reduce((acc, b) => acc + b.interviews.length, 0);
  const completedInterviews = batches.reduce((acc, b) => acc + b.interviews.filter(i => i.status === 'complete').length, 0);
  const inProgressInterviews = batches.reduce((acc, b) => acc + b.interviews.filter(i => i.status === 'in-progress').length, 0);

  return (
    <div style={styles.container}>
      {/* Gradient Background */}
      <div style={styles.backgroundGradient} />
      <div style={styles.backgroundOrb1} />
      <div style={styles.backgroundOrb2} />
      <div style={styles.backgroundOrb3} />

      {/* Left Sidebar - Glass Effect */}
      <aside style={styles.sidebar}>
        {/* Top Tabs */}
        <div style={styles.tabContainer}>
          <button
            style={{
              ...styles.tab,
              ...styles.tabActive,
            }}
          >
            Assessments
          </button>
          <div style={styles.tabDisabled}>
            <span>Analysis</span>
            <span style={styles.comingSoonBadge}>Soon</span>
          </div>
        </div>

        {/* New Session Button */}
        <div style={styles.actionContainer}>
          <button
            style={styles.actionButton}
            onClick={() => onStartInterview('select')}
          >
            <Icons.Plus />
            <span>New session</span>
          </button>
        </div>

        {/* Sessions/History List */}
        <div style={styles.historyContainer}>
          <div style={styles.historyHeader}>
            <span style={styles.historyLabel}>Sessions</span>
            <button style={styles.filterButton}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </button>
          </div>

          <div style={styles.batchList}>
            {batches.map(batch => (
              <div key={batch.id} style={styles.batchItem}>
                <button
                  style={{
                    ...styles.batchHeader,
                    ...(hoveredBatch === batch.id ? styles.batchHeaderHover : {}),
                  }}
                  onClick={() => toggleBatch(batch.id)}
                  onMouseEnter={() => setHoveredBatch(batch.id)}
                  onMouseLeave={() => setHoveredBatch(null)}
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      transform: batch.isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      color: 'rgba(120, 120, 128, 0.6)',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <div style={styles.batchInfo}>
                    <span style={styles.batchName}>{batch.name}</span>
                    <span style={styles.batchMeta}>
                      {batch.interviews.length} interviews · {formatDate(batch.date)}
                    </span>
                  </div>
                </button>

                {batch.isExpanded && (
                  <div style={styles.interviewList}>
                    {batch.interviews.map(interview => (
                      <button
                        key={interview.id}
                        style={{
                          ...styles.interviewItem,
                          ...(hoveredInterview === interview.id ? styles.interviewItemHover : {}),
                        }}
                        onMouseEnter={() => setHoveredInterview(interview.id)}
                        onMouseLeave={() => setHoveredInterview(null)}
                      >
                        <span
                          style={{
                            ...styles.statusIndicator,
                            backgroundColor: interview.status === 'complete' ? '#34C759' :
                              interview.status === 'in-progress' ? '#FF9500' : 'rgba(120, 120, 128, 0.3)',
                          }}
                        />
                        <span style={styles.interviewTitle}>{interview.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={styles.sidebarFooter}>
          <div style={styles.userSection}>
            <div style={styles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user?.name || 'paul oamen'}</span>
              <span style={styles.userPlan}>Max plan</span>
            </div>
            <button style={styles.expandButton}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        <AssessmentsPanel
          onStartInterview={onStartInterview}
          stats={{
            totalInterviews,
            completedInterviews,
            inProgressInterviews,
            totalBatches: batches.length,
          }}
        />
      </main>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#F5F5F7',
    position: 'relative',
    overflow: 'hidden',
  },

  // Background Elements
  backgroundGradient: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #F5F5F7 0%, #E8E8ED 50%, #F5F5F7 100%)',
    zIndex: 0,
  },
  backgroundOrb1: {
    position: 'fixed',
    top: '-20%',
    right: '-10%',
    width: '60%',
    height: '60%',
    background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
  },
  backgroundOrb2: {
    position: 'fixed',
    bottom: '-30%',
    left: '-10%',
    width: '50%',
    height: '50%',
    background: 'radial-gradient(circle, rgba(88, 86, 214, 0.06) 0%, transparent 70%)',
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
  },
  backgroundOrb3: {
    position: 'fixed',
    top: '40%',
    right: '20%',
    width: '30%',
    height: '30%',
    background: 'radial-gradient(circle, rgba(52, 199, 89, 0.05) 0%, transparent 70%)',
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
  },

  // Sidebar - Glass Effect
  sidebar: {
    width: '280px',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRight: '1px solid rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 10,
  },

  // Tabs - Glass Effect
  tabContainer: {
    display: 'flex',
    padding: '4px',
    gap: '2px',
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: '10px',
    margin: '16px 16px 0',
  },
  tab: {
    flex: 1,
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.6)',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#1D1D1F',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  tabDisabled: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.3)',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    cursor: 'not-allowed',
  },
  comingSoonBadge: {
    fontSize: '9px',
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },

  // Action Button - Glass Effect
  actionContainer: {
    padding: '16px 16px 12px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#1D1D1F',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },

  // History
  historyContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px 8px',
  },
  historyLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'rgba(60, 60, 67, 0.6)',
  },
  filterButton: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: 'rgba(60, 60, 67, 0.6)',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'color 0.15s ease',
  },

  // Batch List
  batchList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 8px',
  },
  batchItem: {
    marginBottom: '4px',
  },
  batchHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    width: '100%',
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.15s ease',
  },
  batchHeaderHover: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  batchInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  batchName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1D1D1F',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  batchMeta: {
    fontSize: '11px',
    color: 'rgba(60, 60, 67, 0.6)',
    fontWeight: '400',
  },

  // Interview List
  interviewList: {
    marginLeft: '18px',
    paddingLeft: '12px',
    borderLeft: '1px solid rgba(0, 0, 0, 0.06)',
    marginTop: '2px',
    marginBottom: '4px',
  },
  interviewItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '6px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.15s ease',
  },
  interviewItemHover: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  statusIndicator: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  interviewTitle: {
    fontSize: '12px',
    fontWeight: '400',
    color: 'rgba(60, 60, 67, 0.85)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  // Footer - Glass Effect
  sidebarFooter: {
    padding: '12px 16px',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px',
    cursor: 'pointer',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1D1D1F',
  },
  userPlan: {
    fontSize: '11px',
    color: 'rgba(60, 60, 67, 0.6)',
  },
  expandButton: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: 'rgba(60, 60, 67, 0.6)',
    cursor: 'pointer',
  },

  // Main Content
  mainContent: {
    flex: 1,
    marginLeft: '280px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    position: 'relative',
    zIndex: 1,
  },
};

export default Dashboard;
