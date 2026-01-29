/**
 * Question Sets Section
 * Premium light theme with glass cards - Apple HIG inspired
 */

import { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import type { QuestionSetOverview } from '../../../types/admin';
import { QuestionSetDetailView } from './QuestionSetDetailView';

export function QuestionSetsSection() {
  const [questionSets, setQuestionSets] = useState<QuestionSetOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuestionSetId, setSelectedQuestionSetId] = useState<string | null>(null);

  useEffect(() => {
    loadQuestionSets();
  }, []);

  const loadQuestionSets = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getQuestionSets();
      setQuestionSets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question sets');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSets = questionSets.filter(
    (qs) =>
      qs.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qs.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
      case 'published':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: '#16A34A' };
      case 'draft':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280' };
    }
  };

  // Show detail view if a question set is selected
  if (selectedQuestionSetId) {
    return (
      <QuestionSetDetailView
        questionSetId={selectedQuestionSetId}
        onBack={() => setSelectedQuestionSetId(null)}
      />
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Question Sets</h1>
          <p style={styles.subtitle}>
            Manage assessment question sets
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchContainer}>
        <div style={styles.searchWrapper}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={styles.searchIcon}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search question sets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading question sets...</p>
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p style={styles.errorText}>{error}</p>
          <button onClick={loadQuestionSets} style={styles.retryButton}>
            Try again
          </button>
        </div>
      ) : filteredSets.length === 0 ? (
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </div>
          <p style={styles.emptyTitle}>
            {searchQuery ? 'No results found' : 'No question sets yet'}
          </p>
          <p style={styles.emptyText}>
            {searchQuery ? 'Try adjusting your search' : 'Create your first question set to get started'}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredSets.map((qs) => {
            const statusStyle = getStatusStyle(qs.status);
            return (
              <div key={qs.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    background: statusStyle.bg,
                    color: statusStyle.color,
                  }}>
                    {qs.status}
                  </span>
                </div>

                <h3 style={styles.cardTitle}>{qs.name}</h3>
                <p style={styles.cardDescription}>
                  {qs.description || 'No description provided'}
                </p>

                <div style={styles.cardStats}>
                  <div style={styles.stat}>
                    <span style={styles.statValue}>{qs.total_questions}</span>
                    <span style={styles.statLabel}>Questions</span>
                  </div>
                  <div style={styles.statDivider} />
                  <div style={styles.stat}>
                    <span style={styles.statValue}>{qs.version}</span>
                    <span style={styles.statLabel}>Version</span>
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <span style={styles.createdAt}>
                    {new Date(qs.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <button
                    style={styles.viewButton}
                    onClick={() => setSelectedQuestionSetId(qs.id)}
                  >
                    View
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '32px 40px',
    maxWidth: '1100px',
  },
  header: {
    marginBottom: '28px',
  },
  title: {
    fontSize: '26px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: '4px 0 0 0',
  },
  searchContainer: {
    marginBottom: '24px',
  },
  searchWrapper: {
    position: 'relative',
    maxWidth: '320px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(60, 60, 67, 0.4)',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    height: '42px',
    paddingLeft: '42px',
    paddingRight: '16px',
    borderRadius: '10px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    background: 'rgba(255, 255, 255, 0.9)',
    fontSize: '14px',
    color: '#1D1D1F',
    outline: 'none',
    boxSizing: 'border-box',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    gap: '16px',
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '2px solid rgba(0, 0, 0, 0.08)',
    borderTopColor: '#1D1D1F',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: 0,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '80px 0',
    gap: '12px',
  },
  errorIcon: {
    color: '#DC2626',
    marginBottom: '4px',
  },
  errorText: {
    fontSize: '14px',
    color: '#DC2626',
    margin: 0,
  },
  retryButton: {
    marginTop: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    background: '#1D1D1F',
    color: 'white',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '80px 0',
    gap: '8px',
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'rgba(0, 0, 0, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(60, 60, 67, 0.3)',
    marginBottom: '8px',
  },
  emptyTitle: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#1D1D1F',
    margin: 0,
  },
  emptyText: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
    padding: '20px',
    transition: 'all 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  cardIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1D1D1F',
    margin: '0 0 6px 0',
    letterSpacing: '-0.01em',
  },
  cardDescription: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.6)',
    margin: '0 0 16px 0',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '14px 0',
    borderTop: '1px solid rgba(0, 0, 0, 0.04)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
    marginBottom: '14px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1D1D1F',
  },
  statLabel: {
    fontSize: '11px',
    color: 'rgba(60, 60, 67, 0.5)',
  },
  statDivider: {
    width: '1px',
    height: '28px',
    background: 'rgba(0, 0, 0, 0.06)',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createdAt: {
    fontSize: '12px',
    color: 'rgba(60, 60, 67, 0.5)',
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    color: 'white',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
};

export default QuestionSetsSection;
