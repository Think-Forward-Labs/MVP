import type { CSSProperties } from 'react';
import { Icons } from '../../common/Icons';

interface Dimension {
  name: string;
  score: number;
  status: 'strong' | 'moderate' | 'needs_attention';
}

interface Insight {
  type: 'strength' | 'opportunity' | 'risk';
  title: string;
  desc: string;
}

export function AnalysisSection() {
  const dimensions: Dimension[] = [
    { name: 'Strategic Planning', score: 85, status: 'strong' },
    { name: 'Operations & Processes', score: 72, status: 'moderate' },
    { name: 'Technology & Infrastructure', score: 68, status: 'moderate' },
    { name: 'Team & Culture', score: 81, status: 'strong' },
    { name: 'Financial Health', score: 77, status: 'moderate' },
    { name: 'Market Position', score: 64, status: 'needs_attention' },
  ];

  const insights: Insight[] = [
    { type: 'strength', title: 'Strong leadership alignment', desc: 'Your leadership team shows consistent strategic vision across interviews.' },
    { type: 'opportunity', title: 'Technology modernization', desc: 'Documents indicate legacy systems may be limiting operational efficiency.' },
    { type: 'risk', title: 'Market expansion readiness', desc: 'Current data suggests gaps in competitive analysis capabilities.' },
  ];

  return (
    <div style={styles.sectionContainer}>
      <div style={styles.sectionHeader}>
        <div>
          <h1 style={styles.sectionTitle}>Analysis & Insights</h1>
          <p style={styles.sectionSubtitle}>AI-powered diagnosis of your business readiness</p>
        </div>
        <button style={styles.secondaryButton}>
          Export Report
        </button>
      </div>

      {/* Overall Score */}
      <div style={styles.overallScoreCard}>
        <div style={styles.scoreCircle}>
          <span style={styles.scoreNumber}>78</span>
          <span style={styles.scoreMax}>/100</span>
        </div>
        <div style={styles.scoreInfo}>
          <h2 style={styles.scoreTitle}>Overall Readiness Score</h2>
          <p style={styles.scoreDesc}>
            Your organization demonstrates solid foundations with opportunities for improvement
            in technology and market positioning.
          </p>
          <div style={styles.scoreMeta}>
            <span>Based on 3 interviews, 12 documents, 4 integrations</span>
            <span>Last updated: Jan 24, 2026</span>
          </div>
        </div>
      </div>

      {/* Dimension Scores */}
      <div style={styles.dimensionsSection}>
        <h2 style={styles.subsectionTitle}>Readiness by dimension</h2>
        <div style={styles.dimensionsGrid}>
          {dimensions.map((dim, i) => (
            <div key={i} style={styles.dimensionCard}>
              <div style={styles.dimensionHeader}>
                <span style={styles.dimensionName}>{dim.name}</span>
                <span style={{
                  ...styles.dimensionScore,
                  color: dim.score >= 80 ? '#059669' : dim.score >= 65 ? '#D97706' : '#DC2626'
                }}>
                  {dim.score}
                </span>
              </div>
              <div style={styles.dimensionBar}>
                <div style={{
                  ...styles.dimensionBarFill,
                  width: `${dim.score}%`,
                  backgroundColor: dim.score >= 80 ? '#059669' : dim.score >= 65 ? '#D97706' : '#DC2626'
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div style={styles.insightsSection}>
        <h2 style={styles.subsectionTitle}>Key insights</h2>
        <div style={styles.insightsList}>
          {insights.map((insight, i) => (
            <div key={i} style={styles.insightCard}>
              <div style={{
                ...styles.insightIcon,
                backgroundColor: insight.type === 'strength' ? '#ECFDF5' : insight.type === 'opportunity' ? '#FEF3C7' : '#FEE2E2',
                color: insight.type === 'strength' ? '#059669' : insight.type === 'opportunity' ? '#D97706' : '#DC2626'
              }}>
                {insight.type === 'strength' && <Icons.TrendingUp />}
                {insight.type === 'opportunity' && <Icons.AlertCircle />}
                {insight.type === 'risk' && <Icons.AlertCircle />}
              </div>
              <div style={styles.insightContent}>
                <h3 style={styles.insightTitle}>{insight.title}</h3>
                <p style={styles.insightDesc}>{insight.desc}</p>
              </div>
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
  secondaryButton: {
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#18181B',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  subsectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  overallScoreCard: {
    display: 'flex',
    gap: '40px',
    padding: '40px',
    backgroundColor: '#18181B',
    borderRadius: '16px',
    marginBottom: '40px',
    color: '#FFFFFF',
  },
  scoreCircle: {
    display: 'flex',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: '72px',
    fontWeight: '600',
    lineHeight: 1,
  },
  scoreMax: {
    fontSize: '24px',
    color: '#71717A',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  scoreDesc: {
    fontSize: '15px',
    color: '#A1A1AA',
    lineHeight: '1.6',
    marginBottom: '20px',
  },
  scoreMeta: {
    display: 'flex',
    gap: '24px',
    fontSize: '13px',
    color: '#71717A',
  },
  dimensionsSection: {
    marginBottom: '40px',
  },
  dimensionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  dimensionCard: {
    padding: '20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E4E4E7',
  },
  dimensionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  dimensionName: {
    fontSize: '14px',
    fontWeight: '500',
  },
  dimensionScore: {
    fontSize: '18px',
    fontWeight: '600',
  },
  dimensionBar: {
    height: '6px',
    backgroundColor: '#F4F4F5',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  dimensionBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  insightsSection: {},
  insightsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  insightCard: {
    display: 'flex',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E4E4E7',
  },
  insightIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    flexShrink: 0,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: '15px',
    fontWeight: '500',
    marginBottom: '4px',
  },
  insightDesc: {
    fontSize: '14px',
    color: '#71717A',
    lineHeight: '1.5',
  },
};

export default AnalysisSection;
