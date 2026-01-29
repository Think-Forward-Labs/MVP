/**
 * Businesses Section
 * Premium light theme with glass cards - Apple HIG inspired
 */

import { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi';
import type { BusinessOverview } from '../../../types/admin';

export function BusinessesSection() {
  const [businesses, setBusinesses] = useState<BusinessOverview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getBusinesses();
      setBusinesses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load businesses');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: '#16A34A', dot: '#22C55E' };
      case 'trial':
        return { bg: 'rgba(99, 102, 241, 0.1)', color: '#4F46E5', dot: '#6366F1' };
      case 'pending':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706', dot: '#F59E0B' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280', dot: '#9CA3AF' };
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Businesses</h1>
          <p style={styles.subtitle}>
            Manage all organizations on the platform
          </p>
        </div>
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{businesses.length}</span>
            <span style={styles.statLabel}>Total</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statValue}>
              {businesses.filter(b => b.status === 'active').length}
            </span>
            <span style={styles.statLabel}>Active</span>
          </div>
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
            placeholder="Search businesses..."
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
          <p style={styles.loadingText}>Loading businesses...</p>
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
          <button onClick={loadBusinesses} style={styles.retryButton}>
            Try again
          </button>
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <div style={styles.emptyContainer}>
          <div style={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
            </svg>
          </div>
          <p style={styles.emptyTitle}>
            {searchQuery ? 'No results found' : 'No businesses yet'}
          </p>
          <p style={styles.emptyText}>
            {searchQuery ? 'Try adjusting your search' : 'Businesses will appear here when they register'}
          </p>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Business</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((business, index) => {
                const statusStyle = getStatusStyle(business.status);
                return (
                  <tr
                    key={business.id}
                    style={{
                      ...styles.tr,
                      borderBottom: index === filteredBusinesses.length - 1 ? 'none' : '1px solid rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <td style={styles.td}>
                      <div style={styles.businessCell}>
                        <div style={styles.avatar}>
                          {business.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={styles.businessName}>{business.name}</p>
                          <p style={styles.businessSlug}>{business.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.email}>{business.contact_email || '—'}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                      }}>
                        <span style={{ ...styles.statusDot, background: statusStyle.dot }} />
                        {business.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.date}>
                        {new Date(business.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '12px 20px',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '12px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1D1D1F',
  },
  statLabel: {
    fontSize: '11px',
    color: 'rgba(60, 60, 67, 0.6)',
    marginTop: '2px',
  },
  statDivider: {
    width: '1px',
    height: '28px',
    background: 'rgba(0, 0, 0, 0.08)',
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
    transition: 'all 0.2s ease',
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
  tableCard: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '14px 20px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    color: 'rgba(60, 60, 67, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    background: 'rgba(0, 0, 0, 0.02)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  },
  tr: {
    transition: 'background 0.15s ease',
  },
  td: {
    padding: '16px 20px',
    fontSize: '14px',
    color: '#1D1D1F',
    verticalAlign: 'middle',
  },
  businessCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
    color: 'white',
    flexShrink: 0,
  },
  businessName: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1D1D1F',
    margin: 0,
  },
  businessSlug: {
    fontSize: '12px',
    color: 'rgba(60, 60, 67, 0.5)',
    margin: '2px 0 0 0',
  },
  email: {
    color: 'rgba(60, 60, 67, 0.8)',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  date: {
    color: 'rgba(60, 60, 67, 0.6)',
    fontSize: '13px',
  },
};

export default BusinessesSection;
