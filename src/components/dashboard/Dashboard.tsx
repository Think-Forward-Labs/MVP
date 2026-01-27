import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Icons } from '../common/Icons';
import { DashboardMainPanel } from './panels/DashboardMainPanel';
import { reviewsApi, type ReviewResponse } from '../../services/api';
import type { User, Business, DashboardSection } from '../../types/app';

interface DashboardProps {
  user: User | null;
  business: Business | null;
  section: DashboardSection;
  setSection: (section: DashboardSection) => void;
  onLogout: () => void;
  onStartInterview: (mode: 'select' | 'text' | 'voice', reviewId?: string, participantId?: string) => void;
  onViewInterview?: (reviewId: string, participantId: string, interviewId: string) => void;
  onEditInterview?: (reviewId: string, participantId: string, interviewId: string) => void;
  onSelectReview: (reviewId: string) => void;
  onCreateReview: () => void;
}

export function Dashboard({
  user,
  business,
  section: _section,
  setSection: _setSection,
  onLogout,
  onStartInterview,
  onViewInterview,
  onEditInterview,
  onSelectReview,
  onCreateReview,
}: DashboardProps) {
  // TODO: section and setSection will be used for nav
  void _section;
  void _setSection;
  const [hoveredReview, setHoveredReview] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch reviews on mount and when refreshKey changes
  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const data = await reviewsApi.list();
        setReviews(data);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [refreshKey]);

  // Refresh reviews when CreateReviewModal succeeds (triggered by parent)
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if we should refresh (could be triggered by parent closing modal)
      setRefreshKey(prev => prev + 1);
    }, 30000); // Refresh every 30 seconds as fallback

    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#34C759';
      case 'completed':
        return '#007AFF';
      case 'draft':
        return '#FF9500';
      default:
        return 'rgba(120, 120, 128, 0.3)';
    }
  };

  // Calculate stats
  const totalReviews = reviews.length;
  const totalParticipants = reviews.reduce((acc, r) => acc + r.participant_count, 0);
  const completedInterviews = reviews.reduce((acc, r) => acc + r.completed_count, 0);

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

        {/* New Assessment Button */}
        <div style={styles.actionContainer}>
          <button
            style={styles.actionButton}
            onClick={onCreateReview}
          >
            <Icons.Plus />
            <span>New Assessment</span>
          </button>
        </div>

        {/* Reviews List */}
        <div style={styles.historyContainer}>
          <div style={styles.historyHeader}>
            <span style={styles.historyLabel}>Assessments</span>
            <button
              style={styles.filterButton}
              onClick={() => setRefreshKey(prev => prev + 1)}
              title="Refresh"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M23 4v6h-6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div style={styles.reviewList}>
            {loading && reviews.length === 0 ? (
              <div style={styles.loadingState}>
                <div style={styles.spinner} />
                <span>Loading assessments...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div style={styles.emptyState}>
                <Icons.FileText />
                <span>No assessments yet</span>
                <button style={styles.emptyButton} onClick={onCreateReview}>
                  Create your first assessment
                </button>
              </div>
            ) : (
              reviews.map(review => (
                <button
                  key={review.id}
                  style={{
                    ...styles.reviewItem,
                    ...(hoveredReview === review.id ? styles.reviewItemHover : {}),
                  }}
                  onClick={() => onSelectReview(review.id)}
                  onMouseEnter={() => setHoveredReview(review.id)}
                  onMouseLeave={() => setHoveredReview(null)}
                >
                  <span
                    style={{
                      ...styles.statusIndicator,
                      backgroundColor: getStatusColor(review.status),
                    }}
                  />
                  <div style={styles.reviewInfo}>
                    <span style={styles.reviewName}>{review.name}</span>
                    <span style={styles.reviewMeta}>
                      {review.participant_count} participants · {formatDate(review.created_at)}
                    </span>
                  </div>
                  <Icons.ChevronRight />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={styles.sidebarFooter}>
          <div style={styles.userSection}>
            <div style={styles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user?.name || 'User'}</span>
              <span style={styles.userPlan}>{business?.name || 'Business'}</span>
            </div>
            <button style={styles.logoutButton} onClick={onLogout} title="Sign out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        <DashboardMainPanel
          user={user}
          onCreateAssessment={onCreateReview}
          onStartInterview={(reviewId, participantId) => onStartInterview('select', reviewId, participantId)}
          onViewInterview={onViewInterview}
          onEditInterview={onEditInterview}
          stats={{
            totalAssessments: totalReviews,
            totalParticipants: totalParticipants,
            completedInterviews: completedInterviews,
            completionRate: totalParticipants > 0 ? Math.round((completedInterviews / totalParticipants) * 100) : 0,
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
    width: '300px',
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
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: 'rgba(60, 60, 67, 0.6)',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
  },

  // Review List
  reviewList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  reviewItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.15s ease',
  },
  reviewItemHover: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  statusIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  reviewInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  reviewName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1D1D1F',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  reviewMeta: {
    fontSize: '12px',
    color: 'rgba(60, 60, 67, 0.6)',
    fontWeight: '400',
  },

  // Loading & Empty States
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '40px 20px',
    color: 'rgba(60, 60, 67, 0.6)',
    fontSize: '13px',
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '2px solid #E4E4E7',
    borderTopColor: '#18181B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '40px 20px',
    color: 'rgba(60, 60, 67, 0.6)',
    fontSize: '13px',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: '8px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
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
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userPlan: {
    fontSize: '11px',
    color: 'rgba(60, 60, 67, 0.6)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logoutButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: 'rgba(60, 60, 67, 0.6)',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
  },

  // Main Content
  mainContent: {
    flex: 1,
    marginLeft: '300px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    position: 'relative',
    zIndex: 1,
  },
};

export default Dashboard;
