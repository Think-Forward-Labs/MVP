import type { CSSProperties } from 'react';

export function AnalysisPanel() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Coming Soon State */}
        <div style={styles.comingSoonCard}>
          <div style={styles.iconContainer}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <div style={styles.badge}>Coming Soon</div>

          <h1 style={styles.title}>Document Analysis</h1>
          <p style={styles.description}>
            Upload documents, connect integrations, and get AI-powered insights
            from your business data. This feature is currently in development.
          </p>

          {/* Feature Preview */}
          <div style={styles.featuresGrid}>
            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div style={styles.featureContent}>
                <span style={styles.featureTitle}>Document Upload</span>
                <span style={styles.featureDesc}>PDF, CSV, XLSX analysis</span>
              </div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div style={styles.featureContent}>
                <span style={styles.featureTitle}>Integrations</span>
                <span style={styles.featureDesc}>Connect CRM & tools</span>
              </div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div style={styles.featureContent}>
                <span style={styles.featureTitle}>AI Insights</span>
                <span style={styles.featureDesc}>Automated analysis</span>
              </div>
            </div>

            <div style={styles.featureItem}>
              <div style={styles.featureIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <div style={styles.featureContent}>
                <span style={styles.featureTitle}>Reports</span>
                <span style={styles.featureDesc}>Export & share findings</span>
              </div>
            </div>
          </div>

          {/* Notify Button */}
          <button style={styles.notifyButton} disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span>Get notified when available</span>
          </button>
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
    alignItems: 'center',
    padding: '48px 24px',
    minHeight: '100vh',
  },
  content: {
    width: '100%',
    maxWidth: '520px',
  },
  comingSoonCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '48px 40px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },
  iconContainer: {
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: '20px',
    color: '#9CA3AF',
    marginBottom: '24px',
  },
  badge: {
    display: 'inline-flex',
    padding: '6px 14px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    borderRadius: '20px',
    letterSpacing: '0.02em',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
    letterSpacing: '-0.02em',
    marginBottom: '12px',
  },
  description: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#6B7280',
    maxWidth: '360px',
    marginBottom: '32px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    width: '100%',
    marginBottom: '32px',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '10px',
    textAlign: 'left',
  },
  featureIcon: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    color: '#6B7280',
    flexShrink: 0,
  },
  featureContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  featureTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
  },
  featureDesc: {
    fontSize: '11px',
    color: '#9CA3AF',
  },
  notifyButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    border: 'none',
    borderRadius: '10px',
    cursor: 'not-allowed',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export default AnalysisPanel;
