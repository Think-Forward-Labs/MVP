import type { CSSProperties } from 'react';
import { Icons } from '../../common/Icons';

interface OverviewSectionProps {
  onStartInterview: (mode: 'select' | 'text' | 'voice') => void;
}

export function OverviewSection({ onStartInterview }: OverviewSectionProps) {
  const stats = [
    { label: 'Readiness Score', value: '78', suffix: '/100', trend: '+5', color: '#18181B' },
    { label: 'Interviews Completed', value: '3', suffix: '/5', trend: null, color: '#059669' },
    { label: 'Documents Analyzed', value: '12', suffix: '', trend: '+3', color: '#2563EB' },
    { label: 'Integrations Active', value: '4', suffix: '', trend: null, color: '#7C3AED' },
  ];

  const recentActivity = [
    { type: 'interview', title: 'Leadership Assessment', time: '2 hours ago', status: 'completed' },
    { type: 'document', title: 'Q4 Financial Report.pdf', time: '5 hours ago', status: 'analyzed' },
    { type: 'integration', title: 'Salesforce connected', time: '1 day ago', status: 'active' },
    { type: 'interview', title: 'Strategy Planning', time: '2 days ago', status: 'completed' },
  ];

  return (
    <div style={styles.sectionContainer}>
      <div style={styles.sectionHeader}>
        <div>
          <h1 style={styles.sectionTitle}>Welcome back</h1>
          <p style={styles.sectionSubtitle}>Here's an overview of your business assessment</p>
        </div>
        <button style={styles.primaryActionButton} onClick={() => onStartInterview('select')}>
          <Icons.Plus />
          New Assessment
        </button>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {stats.map((stat, i) => (
          <div key={i} style={styles.statCard}>
            <span style={styles.statLabel}>{stat.label}</span>
            <div style={styles.statValue}>
              <span style={{ color: stat.color }}>{stat.value}</span>
              <span style={styles.statSuffix}>{stat.suffix}</span>
              {stat.trend && (
                <span style={styles.statTrend}>
                  <Icons.TrendingUp />
                  {stat.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActionsSection}>
        <h2 style={styles.subsectionTitle}>Continue your assessment</h2>
        <div style={styles.quickActionsGrid}>
          <button style={styles.quickActionCard} onClick={() => onStartInterview('select')}>
            <div style={styles.quickActionIcon}>
              <Icons.Interview />
            </div>
            <div style={styles.quickActionContent}>
              <h3 style={styles.quickActionTitle}>Take an Interview</h3>
              <p style={styles.quickActionDesc}>Answer questions about your business</p>
            </div>
            <Icons.ChevronRight />
          </button>

          <button style={styles.quickActionCard}>
            <div style={styles.quickActionIcon}>
              <Icons.Upload />
            </div>
            <div style={styles.quickActionContent}>
              <h3 style={styles.quickActionTitle}>Upload Documents</h3>
              <p style={styles.quickActionDesc}>Add reports, policies, or data files</p>
            </div>
            <Icons.ChevronRight />
          </button>

          <button style={styles.quickActionCard}>
            <div style={styles.quickActionIcon}>
              <Icons.Integrations />
            </div>
            <div style={styles.quickActionContent}>
              <h3 style={styles.quickActionTitle}>Connect a Source</h3>
              <p style={styles.quickActionDesc}>Link CRM, database, or social accounts</p>
            </div>
            <Icons.ChevronRight />
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={styles.activitySection}>
        <h2 style={styles.subsectionTitle}>Recent activity</h2>
        <div style={styles.activityList}>
          {recentActivity.map((item, i) => (
            <div key={i} style={styles.activityItem}>
              <div style={styles.activityIcon}>
                {item.type === 'interview' && <Icons.Interview />}
                {item.type === 'document' && <Icons.File />}
                {item.type === 'integration' && <Icons.Integrations />}
              </div>
              <div style={styles.activityContent}>
                <span style={styles.activityTitle}>{item.title}</span>
                <span style={styles.activityTime}>{item.time}</span>
              </div>
              <span style={{
                ...styles.activityStatus,
                color: item.status === 'completed' || item.status === 'active' ? '#059669' : '#71717A'
              }}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
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
  subsectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
  },

  // Stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '40px',
  },
  statCard: {
    padding: '20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E4E4E7',
  },
  statLabel: {
    fontSize: '13px',
    color: '#71717A',
    marginBottom: '8px',
    display: 'block',
  },
  statValue: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    fontSize: '32px',
    fontWeight: '600',
  },
  statSuffix: {
    fontSize: '16px',
    color: '#A1A1AA',
  },
  statTrend: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    color: '#059669',
    marginLeft: '8px',
  },

  // Quick Actions
  quickActionsSection: {
    marginBottom: '40px',
  },
  quickActionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  quickActionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.15s ease',
  },
  quickActionIcon: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: '10px',
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: '15px',
    fontWeight: '500',
    marginBottom: '4px',
  },
  quickActionDesc: {
    fontSize: '13px',
    color: '#71717A',
  },

  // Activity
  activitySection: {},
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E4E4E7',
    overflow: 'hidden',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid #F4F4F5',
  },
  activityIcon: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: '8px',
    color: '#71717A',
  },
  activityContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  activityTitle: {
    fontSize: '14px',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: '12px',
    color: '#A1A1AA',
  },
  activityStatus: {
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
};

export default OverviewSection;
