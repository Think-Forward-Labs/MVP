import React, { useState } from 'react';

// Premium Minimalist Design System
// Inspired by: Aesop, Linear, Stripe, Japanese Ma principle
// Core idea: "Quiet confidence" - luxury through restraint

const InterviewDetailView = () => {
  const [activeTab, setActiveTab] = useState('summary');

  // Mock data
  const interview = {
    candidate: 'Sarah Mitchell',
    position: 'Senior Vice President, Portfolio Management',
    date: 'March 15, 2026',
    duration: '47 minutes',
    status: 'Completed',
    overallScore: 87,
    interviewer: {
      name: 'Michael Chen',
      title: 'VP of Talent Acquisition',
      email: 'michael.chen@firm.com'
    },
    metrics: [
      { label: 'Technical Competency', score: 92 },
      { label: 'Leadership Presence', score: 88 },
      { label: 'Strategic Thinking', score: 85 },
      { label: 'Communication', score: 84 },
      { label: 'Cultural Alignment', score: 89 }
    ],
    flags: [
      { type: 'strength', text: 'Exceptional knowledge of derivatives markets' },
      { type: 'strength', text: 'Strong track record in team development' },
      { type: 'note', text: 'Prefers collaborative decision-making environments' }
    ]
  };

  return (
    <div style={styles.container}>
      {/* Header - Minimal, confident */}
      <header style={styles.header}>
        <button style={styles.backButton}>
          <span style={styles.backArrow}>←</span>
          <span>Back</span>
        </button>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Candidate Name - Large, confident typography */}
        <div style={styles.titleSection}>
          <h1 style={styles.candidateName}>{interview.candidate}</h1>
          <p style={styles.position}>{interview.position}</p>
        </div>

        {/* Score - Understated elegance */}
        <div style={styles.scoreSection}>
          <div style={styles.scoreContainer}>
            <span style={styles.scoreValue}>{interview.overallScore}</span>
            <span style={styles.scoreLabel}>Overall Score</span>
          </div>
          <div style={styles.scoreBar}>
            <div
              style={{
                ...styles.scoreBarFill,
                width: `${interview.overallScore}%`
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Meta Information - Clean, spaced */}
        <div style={styles.metaGrid}>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Interview Date</span>
            <span style={styles.metaValue}>{interview.date}</span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Duration</span>
            <span style={styles.metaValue}>{interview.duration}</span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Status</span>
            <span style={styles.metaValue}>{interview.status}</span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Interviewer</span>
            <span style={styles.metaValue}>{interview.interviewer.name}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Tabs - Subtle, elegant */}
        <div style={styles.tabContainer}>
          {['summary', 'metrics', 'notes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                ...(activeTab === tab ? styles.tabActive : {})
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === 'summary' && (
            <SummaryTab interview={interview} />
          )}
          {activeTab === 'metrics' && (
            <MetricsTab metrics={interview.metrics} />
          )}
          {activeTab === 'notes' && (
            <NotesTab flags={interview.flags} />
          )}
        </div>
      </main>
    </div>
  );
};

// Summary Tab
const SummaryTab = ({ interview }) => (
  <div style={styles.summaryContainer}>
    <p style={styles.summaryText}>
      The candidate demonstrated exceptional expertise in portfolio management
      and derivatives trading. Her leadership experience at previous institutions
      positions her well for this senior role.
    </p>

    <div style={styles.highlightSection}>
      <h3 style={styles.sectionTitle}>Key Strengths</h3>
      <ul style={styles.highlightList}>
        {interview.flags
          .filter(f => f.type === 'strength')
          .map((flag, i) => (
            <li key={i} style={styles.highlightItem}>{flag.text}</li>
          ))}
      </ul>
    </div>

    <div style={styles.highlightSection}>
      <h3 style={styles.sectionTitle}>Considerations</h3>
      <ul style={styles.highlightList}>
        {interview.flags
          .filter(f => f.type === 'note')
          .map((flag, i) => (
            <li key={i} style={styles.highlightItem}>{flag.text}</li>
          ))}
      </ul>
    </div>
  </div>
);

// Metrics Tab
const MetricsTab = ({ metrics }) => (
  <div style={styles.metricsContainer}>
    {metrics.map((metric, index) => (
      <div key={index} style={styles.metricRow}>
        <div style={styles.metricHeader}>
          <span style={styles.metricLabel}>{metric.label}</span>
          <span style={styles.metricScore}>{metric.score}</span>
        </div>
        <div style={styles.metricBar}>
          <div
            style={{
              ...styles.metricBarFill,
              width: `${metric.score}%`
            }}
          />
        </div>
      </div>
    ))}
  </div>
);

// Notes Tab
const NotesTab = ({ flags }) => (
  <div style={styles.notesContainer}>
    <div style={styles.noteCard}>
      <p style={styles.noteText}>
        "Strong technical background with demonstrated success in high-pressure
        trading environments. Consider for future roles in derivatives trading
        or risk management leadership."
      </p>
      <div style={styles.noteFooter}>
        <span style={styles.noteAuthor}>Michael Chen</span>
        <span style={styles.noteDate}>March 15, 2026</span>
      </div>
    </div>
  </div>
);

// Styles - Premium Minimalist
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FFFFFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    color: '#1a1a1a',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },

  // Header
  header: {
    padding: '32px 56px',
    borderBottom: '1px solid #f0f0f0',
  },

  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: '#666666',
    fontSize: '14px',
    fontWeight: '400',
    cursor: 'pointer',
    padding: '8px 0',
    transition: 'color 0.2s ease',
  },

  backArrow: {
    fontSize: '18px',
    fontWeight: '300',
  },

  // Main
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '64px 56px',
  },

  // Title Section
  titleSection: {
    marginBottom: '48px',
  },

  candidateName: {
    fontSize: '36px',
    fontWeight: '400',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
    margin: '0 0 12px 0',
    color: '#1a1a1a',
  },

  position: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#666666',
    margin: 0,
    lineHeight: '1.5',
  },

  // Score Section
  scoreSection: {
    marginBottom: '48px',
  },

  scoreContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '12px',
    marginBottom: '16px',
  },

  scoreValue: {
    fontSize: '48px',
    fontWeight: '300',
    letterSpacing: '-0.02em',
    color: '#1a1a1a',
    fontFeatureSettings: '"tnum"',
  },

  scoreLabel: {
    fontSize: '14px',
    fontWeight: '400',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },

  scoreBar: {
    height: '3px',
    backgroundColor: '#f0f0f0',
    borderRadius: '2px',
    overflow: 'hidden',
  },

  scoreBarFill: {
    height: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: '2px',
    transition: 'width 0.6s ease-out',
  },

  // Divider
  divider: {
    height: '1px',
    backgroundColor: '#f0f0f0',
    margin: '0 0 48px 0',
  },

  // Meta Grid
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '32px',
    marginBottom: '48px',
  },

  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  metaLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },

  metaValue: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#1a1a1a',
  },

  // Tabs
  tabContainer: {
    display: 'flex',
    gap: '32px',
    borderBottom: '1px solid #f0f0f0',
    marginBottom: '48px',
  },

  tab: {
    background: 'none',
    border: 'none',
    padding: '16px 0',
    fontSize: '14px',
    fontWeight: '400',
    color: '#999999',
    cursor: 'pointer',
    position: 'relative',
    transition: 'color 0.2s ease',
  },

  tabActive: {
    color: '#1a1a1a',
    fontWeight: '500',
  },

  tabContent: {
    minHeight: '300px',
  },

  // Summary Tab
  summaryContainer: {
    // Generous spacing
  },

  summaryText: {
    fontSize: '17px',
    lineHeight: '1.7',
    color: '#333333',
    marginBottom: '48px',
    maxWidth: '640px',
  },

  highlightSection: {
    marginBottom: '40px',
  },

  sectionTitle: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '20px',
  },

  highlightList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },

  highlightItem: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#1a1a1a',
    paddingLeft: '16px',
    marginBottom: '12px',
    position: 'relative',
  },

  // Metrics Tab
  metricsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },

  metricRow: {
    // Clean layout
  },

  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '12px',
  },

  metricLabel: {
    fontSize: '15px',
    fontWeight: '400',
    color: '#1a1a1a',
  },

  metricScore: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#1a1a1a',
    fontFeatureSettings: '"tnum"',
  },

  metricBar: {
    height: '2px',
    backgroundColor: '#f0f0f0',
    borderRadius: '1px',
    overflow: 'hidden',
  },

  metricBarFill: {
    height: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: '1px',
    transition: 'width 0.5s ease-out',
  },

  // Notes Tab
  notesContainer: {
    // Generous spacing
  },

  noteCard: {
    borderLeft: '2px solid #e0e0e0',
    paddingLeft: '24px',
  },

  noteText: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#333333',
    fontStyle: 'italic',
    marginBottom: '20px',
  },

  noteFooter: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#999999',
  },

  noteAuthor: {
    fontWeight: '500',
  },

  noteDate: {
    // Normal weight
  },
};

// Add hover effects via CSS-in-JS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  * {
    box-sizing: border-box;
  }

  button:hover {
    color: #1a1a1a !important;
  }

  /* Tab underline animation */
  button[style*="color: rgb(26, 26, 26)"]::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #1a1a1a;
  }

  /* Smooth transitions */
  * {
    transition-property: color, background-color, border-color, opacity;
    transition-duration: 0.2s;
    transition-timing-function: ease;
  }

  /* Premium focus states */
  button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #1a1a1a;
  }
`;
document.head.appendChild(styleSheet);

export default InterviewDetailView;
