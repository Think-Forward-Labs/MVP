import React, { useState } from 'react';

/**
 * Premium Interview Detail UI - Enterprise Grade
 *
 * Design Sources:
 * - Apple Glassmorphism / Liquid Glass (macOS, visionOS)
 * - Material Design 3 elevation and color system
 * - McKinsey consulting-grade data presentation
 * - Stripe, Linear, Mercury premium patterns
 */

// Premium Design System
const premium = {
  // Premium Color Palette - Warm, sophisticated, not gray
  colors: {
    // Backgrounds with subtle warmth
    canvas: '#F8F9FC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceMuted: '#F4F6FA',

    // Glass surfaces
    glassLight: 'rgba(255, 255, 255, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    glassOverlay: 'rgba(255, 255, 255, 0.85)',

    // Text with proper contrast
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',

    // Premium accent - deep blue
    primary: '#2563EB',
    primaryLight: '#3B82F6',
    primaryMuted: 'rgba(37, 99, 235, 0.08)',
    primaryGlow: 'rgba(37, 99, 235, 0.15)',

    // Semantic - refined tones
    success: '#059669',
    successLight: '#10B981',
    successMuted: 'rgba(5, 150, 105, 0.08)',

    warning: '#D97706',
    warningLight: '#F59E0B',
    warningMuted: 'rgba(217, 119, 6, 0.08)',

    negative: '#DC2626',
    negativeLight: '#EF4444',
    negativeMuted: 'rgba(220, 38, 38, 0.08)',

    // Refined borders
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    borderAccent: 'rgba(37, 99, 235, 0.2)',
  },

  // Shadows - Multi-layer for premium depth
  shadows: {
    // Subtle lift
    sm: `
      0 1px 2px rgba(15, 23, 42, 0.04),
      0 1px 3px rgba(15, 23, 42, 0.08)
    `,
    // Card elevation
    md: `
      0 2px 4px rgba(15, 23, 42, 0.04),
      0 4px 8px rgba(15, 23, 42, 0.06),
      0 8px 16px rgba(15, 23, 42, 0.06)
    `,
    // Prominent elevation
    lg: `
      0 4px 8px rgba(15, 23, 42, 0.04),
      0 8px 16px rgba(15, 23, 42, 0.06),
      0 16px 32px rgba(15, 23, 42, 0.08)
    `,
    // Glass shadow
    glass: `
      0 8px 32px rgba(15, 23, 42, 0.12),
      0 2px 8px rgba(15, 23, 42, 0.08)
    `,
    // Inner glow for inputs
    glow: `
      0 0 0 3px rgba(37, 99, 235, 0.12),
      0 1px 2px rgba(15, 23, 42, 0.08)
    `,
  },

  // Typography
  font: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
  },

  // Spacing (8px base)
  space: {
    1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64,
  },

  // Border radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  // Transitions
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

// Interview Data
const interviewData = {
  candidate: {
    name: 'Sarah Chen',
    role: 'Senior Product Manager',
    date: 'January 28, 2025',
    overallScore: 76,
  },
  summary: {
    questions: 24,
    metrics: 14,
    flags: 2,
  },
  metrics: [
    {
      id: 'm1', code: 'M1', name: 'Operational Strength', academic: 'Technical Fitness',
      score: 82, confidence: 'High',
      insight: 'Demonstrates strong technical foundation with consistent execution patterns. Evidence of systematic process optimization and quality-focused methodology.',
      breakdown: [
        { code: 'Q1', score: 85, weight: 30, contribution: 25.5 },
        { code: 'Q4', score: 78, weight: 40, contribution: 31.2 },
        { code: 'Q9', score: 81, weight: 30, contribution: 24.3 },
      ],
    },
    {
      id: 'm2', code: 'M2', name: 'Future Readiness', academic: 'Evolutionary Fitness',
      score: 68, confidence: 'Medium',
      insight: 'Shows adaptability with opportunity for growth in emerging technology adoption and forward-looking strategic planning capabilities.',
      breakdown: [
        { code: 'Q2', score: 72, weight: 35, contribution: 25.2 },
        { code: 'Q5', score: 65, weight: 35, contribution: 22.8 },
        { code: 'Q11', score: 67, weight: 30, contribution: 20.1 },
      ],
    },
    {
      id: 'm3', code: 'M9', name: 'Run/Transform Balance', academic: 'Ambidexterity',
      score: 74, confidence: 'High',
      insight: 'Maintains effective equilibrium between operational excellence and innovation. Resource allocation reflects strategic priorities.',
      breakdown: [
        { code: 'Q3', score: 76, weight: 50, contribution: 38.0 },
        { code: 'Q7', score: 72, weight: 50, contribution: 36.0 },
      ],
    },
    {
      id: 'm4', code: 'M5', name: 'Market Radar', academic: 'Sensing',
      score: 85, confidence: 'High',
      insight: 'Exceptional market awareness with proactive identification of opportunities. Strong evidence of systematic competitive intelligence.',
      breakdown: [
        { code: 'Q6', score: 88, weight: 60, contribution: 52.8 },
        { code: 'Q12', score: 80, weight: 40, contribution: 32.0 },
      ],
    },
    {
      id: 'm5', code: 'M3', name: 'Insight-to-Action', academic: 'Learning Effectiveness',
      score: 71, confidence: 'Medium',
      insight: 'Capable of translating analytical insights into executable strategies with potential to accelerate implementation velocity.',
      breakdown: [
        { code: 'Q8', score: 74, weight: 45, contribution: 33.3 },
        { code: 'Q10', score: 68, weight: 55, contribution: 37.4 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1', number: 1, code: 'Q1', score: 85, confidence: 'High', quality: 'Comprehensive',
      question: 'Describe your approach to managing cross-functional teams during a complex product launch.',
      response: 'I establish clear communication channels early in the process. For a recent product launch, I implemented a dedicated collaboration workspace, bi-weekly synchronization meetings with all stakeholders, and created comprehensive documentation. Each team maintained clear ownership areas with defined handoff protocols.',
      dimensions: [
        { name: 'Communication', score: 5, note: 'Exceptional clarity in articulating communication structures.' },
        { name: 'Process Design', score: 4, note: 'Strong systematic approach to coordination.' },
        { name: 'Leadership', score: 4, note: 'Clear evidence of team orchestration.' },
      ],
    },
    {
      id: 'q2', number: 2, code: 'Q2', score: 72, confidence: 'High', quality: 'Detailed',
      question: 'How do you approach prioritization when facing competing initiatives with constrained resources?',
      response: 'I employ a structured framework combining impact analysis with urgency assessment. First, I develop a matrix weighing business value against implementation effort. Then I validate priorities through stakeholder alignment sessions.',
      dimensions: [
        { name: 'Strategic Thinking', score: 4, note: 'Well-articulated prioritization framework.' },
        { name: 'Stakeholder Management', score: 4, note: 'Effective alignment practices.' },
        { name: 'Analytical Skills', score: 3, note: 'Solid framework with room for data-driven enhancement.' },
      ],
    },
    {
      id: 'q3', number: 3, code: 'Q3', score: 62, confidence: 'Medium', quality: 'Adequate', flagged: true,
      question: 'Describe a situation where you needed to pivot product strategy based on market feedback.',
      response: 'At my previous company, we launched a B2B feature that received negative market feedback. Within three weeks, I led a rapid discovery phase including customer interviews and competitive analysis. We pivoted to a self-service model which increased adoption by 40%.',
      dimensions: [
        { name: 'Adaptability', score: 3, note: 'Willingness to adjust but limited process detail.' },
        { name: 'Customer Focus', score: 4, note: 'Good responsiveness to market signals.' },
        { name: 'Results Orientation', score: 3, note: 'Outcome mentioned but timeline noted for review.' },
      ],
    },
  ],
  flags: [
    {
      id: 'f1', severity: 'warning', category: 'Inconsistency',
      title: 'Timeline Discrepancy Identified',
      description: 'Responses to Q3 and Q12 contain potentially conflicting information regarding the duration of the product pivot initiative.',
      analysis: 'In Q3, the candidate references completing a pivot within three weeks. However, in Q12, the same project is described as a six-month transformation. This may indicate timeline confusion or conflation of separate initiatives.',
      related: ['Q3', 'Q12'],
    },
    {
      id: 'f2', severity: 'info', category: 'Incomplete Response',
      title: 'Partial Response Coverage',
      description: 'The response to Q15 addressed two of four expected components for comprehensive coverage.',
      analysis: 'The question requested coverage of risk identification, mitigation strategies, contingency planning, and stakeholder communication. Only risk identification and mitigation were addressed.',
      related: ['Q15'],
    },
  ],
};

// Score utilities
const getScoreLevel = (score) => {
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 60) return 'moderate';
  return 'needs-improvement';
};

const scoreStyles = {
  excellent: { color: premium.colors.success, bg: premium.colors.successMuted },
  good: { color: premium.colors.primary, bg: premium.colors.primaryMuted },
  moderate: { color: premium.colors.warning, bg: premium.colors.warningMuted },
  'needs-improvement': { color: premium.colors.negative, bg: premium.colors.negativeMuted },
};

// Global Styles
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: ${premium.font.sans};
      background: linear-gradient(135deg, #F8F9FC 0%, #EEF2FF 50%, #F8F9FC 100%);
      background-attachment: fixed;
      color: ${premium.colors.text};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      min-height: 100vh;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(24px); }
      to { opacity: 1; transform: translateX(0); }
    }

    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    .fade-in { animation: fadeIn 0.35s ease-out forwards; }
    .slide-in { animation: slideIn 0.3s ease-out forwards; }
    .scale-in { animation: scaleIn 0.25s ease-out forwards; }

    .glass-card {
      background: ${premium.colors.glassLight};
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid ${premium.colors.glassBorder};
      box-shadow: ${premium.shadows.glass};
    }

    .interactive {
      transition: all ${premium.transition.base};
    }

    .interactive:hover {
      transform: translateY(-1px);
      box-shadow: ${premium.shadows.lg};
    }

    .clickable {
      cursor: pointer;
      transition: all ${premium.transition.fast};
    }

    .clickable:hover {
      background: ${premium.colors.surfaceMuted};
    }

    .clickable:active {
      transform: scale(0.99);
    }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${premium.colors.border}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${premium.colors.textMuted}; }
  `}</style>
);

// Main Component
export default function PremiumInterviewDetail() {
  const [activeTab, setActiveTab] = useState('metrics');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedDimension, setSelectedDimension] = useState(null);

  const { candidate, summary, metrics, questions, flags } = interviewData;
  const scoreLevel = getScoreLevel(candidate.overallScore);
  const scoreStyle = scoreStyles[scoreLevel];

  return (
    <div style={styles.container}>
      <GlobalStyles />

      {/* Premium Header with Glass Effect */}
      <header style={styles.header} className="glass-card fade-in">
        <div style={styles.headerInner}>
          {/* Back Navigation */}
          <button style={styles.backButton} className="clickable">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Interview Breakdown</span>
          </button>

          {/* Title Section */}
          <div style={styles.titleSection}>
            <div style={styles.titleLeft}>
              <h1 style={styles.title}>{candidate.name}</h1>
              <p style={styles.subtitle}>{candidate.role}</p>
            </div>

            {/* Score Display */}
            <div style={styles.scoreCard}>
              <div style={styles.scoreRing}>
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke={premium.colors.border} strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={scoreStyle.color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(candidate.overallScore / 100) * 213.6} 213.6`}
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                </svg>
                <span style={{ ...styles.scoreValue, color: scoreStyle.color }}>
                  {candidate.overallScore}
                </span>
              </div>
              <span style={styles.scoreLabel}>Overall Score</span>
            </div>
          </div>

          {/* Meta Information */}
          <div style={styles.metaRow}>
            <span style={styles.metaItem}>{candidate.date}</span>
            <span style={styles.metaDot} />
            <span style={styles.metaItem}>{summary.questions} questions</span>
            <span style={styles.metaDot} />
            <span style={styles.metaItem}>{summary.metrics} metrics</span>
            <span style={styles.metaDot} />
            <span style={{
              ...styles.metaItem,
              color: summary.flags > 0 ? premium.colors.warning : premium.colors.success,
              fontWeight: 500,
            }}>
              {summary.flags} {summary.flags === 1 ? 'flag' : 'flags'}
            </span>
          </div>
        </div>
      </header>

      {/* Summary Stats */}
      <div style={styles.statsGrid}>
        <StatCard
          label="Questions Scored"
          value={summary.questions}
          delay={0}
        />
        <StatCard
          label="Metrics Calculated"
          value={summary.metrics}
          delay={50}
        />
        <StatCard
          label="Flags for Review"
          value={summary.flags}
          highlight={summary.flags > 0 ? 'warning' : 'success'}
          delay={100}
        />
        <StatCard
          label="Average Score"
          value={candidate.overallScore}
          highlight={scoreLevel}
          delay={150}
        />
      </div>

      {/* Navigation Tabs */}
      <nav style={styles.nav}>
        <div style={styles.navTabs}>
          {[
            { id: 'metrics', label: 'Metrics', count: metrics.length },
            { id: 'questions', label: 'Questions', count: questions.length },
            { id: 'flags', label: 'Flags', count: flags.length, alert: flags.length > 0 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setExpandedId(null); }}
              style={{
                ...styles.navTab,
                ...(activeTab === tab.id ? styles.navTabActive : {}),
              }}
              className="clickable"
            >
              <span style={styles.navTabLabel}>{tab.label}</span>
              <span style={{
                ...styles.navTabCount,
                ...(activeTab === tab.id ? styles.navTabCountActive : {}),
                ...(tab.alert && activeTab !== tab.id ? styles.navTabCountAlert : {}),
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content Area */}
      <main style={styles.main}>
        {activeTab === 'metrics' && (
          <MetricsList
            metrics={metrics}
            expandedId={expandedId}
            onToggle={setExpandedId}
          />
        )}

        {activeTab === 'questions' && (
          <QuestionsList
            questions={questions}
            expandedId={expandedId}
            onToggle={setExpandedId}
            onDimensionSelect={setSelectedDimension}
          />
        )}

        {activeTab === 'flags' && (
          <FlagsList flags={flags} />
        )}
      </main>

      {/* Dimension Detail Panel */}
      {selectedDimension && (
        <DimensionPanel
          dimension={selectedDimension}
          onClose={() => setSelectedDimension(null)}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, highlight, delay = 0 }) {
  const getHighlightStyle = () => {
    if (!highlight) return {};
    if (highlight === 'warning') return { color: premium.colors.warning };
    if (highlight === 'success') return { color: premium.colors.success };
    return { color: scoreStyles[highlight]?.color || premium.colors.text };
  };

  return (
    <div
      style={{ ...styles.statCard, animationDelay: `${delay}ms` }}
      className="glass-card interactive fade-in"
    >
      <span style={{ ...styles.statValue, ...getHighlightStyle() }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

// Metrics List
function MetricsList({ metrics, expandedId, onToggle }) {
  return (
    <div style={styles.list}>
      {metrics.map((metric, i) => (
        <MetricCard
          key={metric.id}
          metric={metric}
          isExpanded={expandedId === metric.id}
          onToggle={() => onToggle(expandedId === metric.id ? null : metric.id)}
          delay={i * 40}
        />
      ))}
    </div>
  );
}

function MetricCard({ metric, isExpanded, onToggle, delay }) {
  const level = getScoreLevel(metric.score);
  const style = scoreStyles[level];

  return (
    <div
      style={{ ...styles.card, animationDelay: `${delay}ms` }}
      className="fade-in"
    >
      <button onClick={onToggle} style={styles.cardHeader} className="clickable">
        <div style={styles.cardHeaderLeft}>
          <div style={styles.metricBadge}>{metric.code}</div>
          <div style={styles.metricInfo}>
            <span style={styles.metricName}>{metric.name}</span>
            <span style={styles.metricAcademic}>{metric.academic}</span>
          </div>
        </div>

        <div style={styles.cardHeaderRight}>
          <div style={styles.progressContainer}>
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${metric.score}%`,
                  backgroundColor: style.color,
                }}
              />
            </div>
          </div>
          <span style={{ ...styles.metricScore, color: style.color }}>{metric.score}</span>
          <span style={styles.confidenceTag}>{metric.confidence}</span>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={premium.colors.textMuted} strokeWidth="2" strokeLinecap="round"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: premium.transition.base,
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div style={styles.cardContent} className="fade-in">
          <p style={styles.insight}>{metric.insight}</p>

          <div style={styles.breakdownSection}>
            <h4 style={styles.sectionLabel}>Question Contributions</h4>
            <div style={styles.breakdownTable}>
              <div style={styles.breakdownHeader}>
                <span>Question</span>
                <span>Score</span>
                <span>Weight</span>
                <span>Contribution</span>
              </div>
              {metric.breakdown.map((row, i) => (
                <div key={i} style={styles.breakdownRow}>
                  <span style={styles.breakdownCode}>{row.code}</span>
                  <span style={{ color: scoreStyles[getScoreLevel(row.score)].color, fontWeight: 600 }}>
                    {row.score}
                  </span>
                  <span>{row.weight}%</span>
                  <span style={{ fontWeight: 500 }}>{row.contribution.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Questions List
function QuestionsList({ questions, expandedId, onToggle, onDimensionSelect }) {
  return (
    <div style={styles.list}>
      {questions.map((question, i) => (
        <QuestionCard
          key={question.id}
          question={question}
          isExpanded={expandedId === question.id}
          onToggle={() => onToggle(expandedId === question.id ? null : question.id)}
          onDimensionSelect={onDimensionSelect}
          delay={i * 40}
        />
      ))}
    </div>
  );
}

function QuestionCard({ question, isExpanded, onToggle, onDimensionSelect, delay }) {
  const level = getScoreLevel(question.score);
  const style = scoreStyles[level];

  return (
    <div
      style={{ ...styles.card, animationDelay: `${delay}ms` }}
      className="fade-in"
    >
      <button onClick={onToggle} style={styles.cardHeader} className="clickable">
        <div style={styles.cardHeaderLeft}>
          <div style={styles.questionNumberBadge}>{question.number}</div>
          <span style={styles.questionCode}>{question.code}</span>
          {question.flagged && (
            <span style={styles.flagBadge}>Review Required</span>
          )}
        </div>

        <div style={styles.cardHeaderRight}>
          <span style={styles.confidenceTag}>{question.confidence}</span>
          <span style={{ ...styles.questionScore, color: style.color }}>{question.score}</span>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={premium.colors.textMuted} strokeWidth="2" strokeLinecap="round"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
              transition: premium.transition.base,
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div style={styles.cardContent} className="fade-in">
          {/* Question */}
          <div style={styles.questionSection}>
            <span style={styles.sectionLabel}>Question</span>
            <p style={styles.questionText}>{question.question}</p>
          </div>

          {/* Response */}
          <div style={styles.responseSection}>
            <span style={styles.responseLabel}>Response</span>
            <p style={styles.responseText}>{question.response}</p>
          </div>

          {/* Quality Tags */}
          <div style={styles.tagsRow}>
            <div style={styles.qualityTag}>
              <span style={styles.tagLabel}>Quality</span>
              <span style={styles.tagValue}>{question.quality}</span>
            </div>
            <div style={styles.qualityTag}>
              <span style={styles.tagLabel}>Confidence</span>
              <span style={styles.tagValue}>{question.confidence}</span>
            </div>
          </div>

          {/* Dimensions */}
          <div style={styles.dimensionsSection}>
            <span style={styles.sectionLabel}>Dimension Scores</span>
            <div style={styles.dimensionList}>
              {question.dimensions.map((dim, i) => (
                <button
                  key={i}
                  style={styles.dimensionRow}
                  onClick={(e) => { e.stopPropagation(); onDimensionSelect(dim); }}
                  className="clickable"
                >
                  <span style={styles.dimensionName}>{dim.name}</span>
                  <div style={styles.dimensionRight}>
                    <div style={styles.scorePips}>
                      {[1,2,3,4,5].map(n => (
                        <div
                          key={n}
                          style={{
                            ...styles.scorePip,
                            backgroundColor: n <= dim.score
                              ? scoreStyles[getScoreLevel(dim.score * 20)].color
                              : premium.colors.border,
                          }}
                        />
                      ))}
                    </div>
                    <span style={styles.dimensionScoreText}>{dim.score}/5</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Flags List
function FlagsList({ flags }) {
  if (flags.length === 0) {
    return (
      <div style={styles.emptyState} className="fade-in">
        <div style={styles.emptyIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={premium.colors.success} strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h3 style={styles.emptyTitle}>All Clear</h3>
        <p style={styles.emptyText}>No issues requiring review at this time.</p>
      </div>
    );
  }

  return (
    <div style={styles.list}>
      <div style={styles.flagsHeader}>
        <span style={styles.flagsTitle}>Items Requiring Review</span>
        <span style={styles.flagsCount}>{flags.length}</span>
      </div>

      {flags.map((flag, i) => (
        <FlagCard key={flag.id} flag={flag} delay={i * 60} />
      ))}
    </div>
  );
}

function FlagCard({ flag, delay }) {
  const severityStyles = {
    warning: { color: premium.colors.warning, bg: premium.colors.warningMuted },
    info: { color: premium.colors.textSecondary, bg: premium.colors.surfaceMuted },
    critical: { color: premium.colors.negative, bg: premium.colors.negativeMuted },
  };
  const sev = severityStyles[flag.severity];

  return (
    <div
      style={{ ...styles.flagCard, animationDelay: `${delay}ms` }}
      className="glass-card fade-in"
    >
      <div style={styles.flagHeader}>
        <span style={{ ...styles.severityBadge, color: sev.color, backgroundColor: sev.bg }}>
          {flag.severity}
        </span>
        <span style={styles.flagCategory}>{flag.category}</span>
      </div>

      <h3 style={styles.flagTitle}>{flag.title}</h3>
      <p style={styles.flagDescription}>{flag.description}</p>

      <div style={styles.analysisBox}>
        <span style={styles.analysisLabel}>Analysis</span>
        <p style={styles.analysisText}>{flag.analysis}</p>
      </div>

      <div style={styles.relatedRow}>
        <span style={styles.relatedLabel}>Related</span>
        <span style={styles.relatedCodes}>{flag.related.join(', ')}</span>
      </div>

      <button style={styles.resolveButton} className="clickable">
        Mark as Resolved
      </button>
    </div>
  );
}

// Dimension Panel
function DimensionPanel({ dimension, onClose }) {
  const level = getScoreLevel(dimension.score * 20);
  const style = scoreStyles[level];

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.panel} className="slide-in">
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>{dimension.name}</h2>
          <button style={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={styles.panelContent}>
          <div style={styles.panelSection}>
            <span style={styles.panelLabel}>Score</span>
            <div style={styles.panelScoreDisplay}>
              <span style={{ ...styles.panelScoreValue, color: style.color }}>
                {dimension.score}/5
              </span>
              <div style={styles.panelScoreBar}>
                {[1,2,3,4,5].map(n => (
                  <div
                    key={n}
                    style={{
                      ...styles.panelScoreSegment,
                      backgroundColor: n <= dimension.score ? style.color : premium.colors.border,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={styles.panelSection}>
            <span style={styles.panelLabel}>Reasoning</span>
            <p style={styles.panelReasoning}>{dimension.note}</p>
          </div>

          <div style={styles.panelSection}>
            <span style={styles.panelLabel}>Scoring Scale</span>
            <div style={styles.scaleList}>
              {[
                { level: 5, name: 'Exceptional', desc: 'Consistently exceeds expectations' },
                { level: 4, name: 'Strong', desc: 'Clearly demonstrates competency' },
                { level: 3, name: 'Adequate', desc: 'Meets baseline expectations' },
                { level: 2, name: 'Developing', desc: 'Partial capability demonstrated' },
                { level: 1, name: 'Limited', desc: 'Significant development needed' },
              ].map(scale => (
                <div
                  key={scale.level}
                  style={{
                    ...styles.scaleItem,
                    backgroundColor: scale.level === dimension.score ? style.bg : 'transparent',
                    borderColor: scale.level === dimension.score ? style.color : premium.colors.border,
                  }}
                >
                  <div style={styles.scaleHeader}>
                    <span style={styles.scaleLevel}>{scale.level}</span>
                    <span style={styles.scaleName}>{scale.name}</span>
                    {scale.level === dimension.score && (
                      <span style={{ ...styles.currentBadge, color: style.color, backgroundColor: style.bg }}>
                        Current
                      </span>
                    )}
                  </div>
                  <span style={styles.scaleDesc}>{scale.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Styles
const styles = {
  container: {
    maxWidth: 1140,
    margin: '0 auto',
    padding: `${premium.space[8]}px ${premium.space[6]}px`,
  },

  // Header
  header: {
    borderRadius: premium.radius.xl,
    marginBottom: premium.space[6],
    overflow: 'hidden',
  },
  headerInner: {
    padding: `${premium.space[6]}px ${premium.space[8]}px`,
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: premium.space[2],
    padding: `${premium.space[2]}px ${premium.space[3]}px`,
    marginLeft: -premium.space[3],
    background: 'none',
    border: 'none',
    borderRadius: premium.radius.sm,
    color: premium.colors.textSecondary,
    fontSize: 14,
    fontWeight: 500,
    marginBottom: premium.space[5],
  },
  titleSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: premium.space[5],
  },
  titleLeft: {},
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: premium.colors.text,
    letterSpacing: -0.5,
    marginBottom: premium.space[1],
  },
  subtitle: {
    fontSize: 16,
    color: premium.colors.textSecondary,
    fontWeight: 400,
  },
  scoreCard: {
    textAlign: 'center',
  },
  scoreRing: {
    position: 'relative',
    width: 80,
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 700,
    fontFamily: premium.font.mono,
  },
  scoreLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    color: premium.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: premium.space[1],
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: premium.space[3],
  },
  metaItem: {
    fontSize: 14,
    color: premium.colors.textSecondary,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    backgroundColor: premium.colors.border,
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: premium.space[4],
    marginBottom: premium.space[6],
  },
  statCard: {
    padding: `${premium.space[5]}px ${premium.space[4]}px`,
    borderRadius: premium.radius.lg,
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: 32,
    fontWeight: 700,
    color: premium.colors.text,
    fontFamily: premium.font.mono,
    letterSpacing: -1,
    marginBottom: premium.space[1],
  },
  statLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: premium.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Navigation
  nav: {
    marginBottom: premium.space[6],
  },
  navTabs: {
    display: 'flex',
    gap: premium.space[1],
    borderBottom: `1px solid ${premium.colors.border}`,
  },
  navTab: {
    display: 'flex',
    alignItems: 'center',
    gap: premium.space[2],
    padding: `${premium.space[3]}px ${premium.space[4]}px`,
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: -1,
    borderRadius: 0,
  },
  navTabActive: {
    borderBottomColor: premium.colors.primary,
  },
  navTabLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: premium.colors.textSecondary,
  },
  navTabCount: {
    padding: `2px ${premium.space[2]}px`,
    borderRadius: premium.radius.sm,
    fontSize: 12,
    fontWeight: 600,
    backgroundColor: premium.colors.surfaceMuted,
    color: premium.colors.textMuted,
  },
  navTabCountActive: {
    backgroundColor: premium.colors.primary,
    color: '#FFFFFF',
  },
  navTabCountAlert: {
    backgroundColor: premium.colors.warningMuted,
    color: premium.colors.warning,
  },

  // Main
  main: {
    minHeight: 400,
  },

  // List
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: premium.space[3],
  },

  // Card
  card: {
    backgroundColor: premium.colors.surface,
    borderRadius: premium.radius.lg,
    border: `1px solid ${premium.colors.border}`,
    boxShadow: premium.shadows.sm,
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: `${premium.space[4]}px ${premium.space[5]}px`,
    background: 'none',
    border: 'none',
    borderRadius: `${premium.radius.lg}px ${premium.radius.lg}px 0 0`,
    textAlign: 'left',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: premium.space[3],
  },
  cardHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: premium.space[4],
  },
  cardContent: {
    padding: premium.space[5],
    borderTop: `1px solid ${premium.colors.borderLight}`,
    backgroundColor: premium.colors.surfaceMuted,
  },

  // Metric card specifics
  metricBadge: {
    padding: `${premium.space[1]}px ${premium.space[3]}px`,
    backgroundColor: premium.colors.primaryMuted,
    borderRadius: premium.radius.sm,
    fontSize: 12,
    fontWeight: 700,
    color: premium.colors.primary,
    fontFamily: premium.font.mono,
  },
  metricInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  metricName: {
    fontSize: 15,
    fontWeight: 600,
    color: premium.colors.text,
  },
  metricAcademic: {
    fontSize: 12,
    color: premium.colors.textMuted,
  },
  progressContainer: {
    width: 120,
  },
  progressTrack: {
    height: 6,
    backgroundColor: premium.colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    transition: `width ${premium.transition.slow}`,
  },
  metricScore: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: premium.font.mono,
    minWidth: 32,
    textAlign: 'right',
  },
  confidenceTag: {
    padding: `${premium.space[1]}px ${premium.space[2]}px`,
    backgroundColor: premium.colors.surfaceMuted,
    borderRadius: premium.radius.sm,
    fontSize: 11,
    fontWeight: 500,
    color: premium.colors.textMuted,
  },
  insight: {
    fontSize: 14,
    lineHeight: 1.65,
    color: premium.colors.textSecondary,
    marginBottom: premium.space[5],
  },

  // Breakdown
  breakdownSection: {},
  sectionLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: premium.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: premium.space[3],
  },
  breakdownTable: {
    backgroundColor: premium.colors.surface,
    borderRadius: premium.radius.md,
    border: `1px solid ${premium.colors.border}`,
    overflow: 'hidden',
  },
  breakdownHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1.2fr',
    padding: `${premium.space[2]}px ${premium.space[4]}px`,
    backgroundColor: premium.colors.surfaceMuted,
    fontSize: 11,
    fontWeight: 600,
    color: premium.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  breakdownRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1.2fr',
    padding: `${premium.space[3]}px ${premium.space[4]}px`,
    borderTop: `1px solid ${premium.colors.borderLight}`,
    fontSize: 14,
    color: premium.colors.text,
    alignItems: 'center',
  },
  breakdownCode: {
    fontWeight: 600,
    fontFamily: premium.font.mono,
    color: premium.colors.primary,
  },

  // Question card specifics
  questionNumberBadge: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: premium.colors.primaryMuted,
    borderRadius: premium.radius.sm,
    fontSize: 13,
    fontWeight: 700,
    color: premium.colors.primary,
  },
  questionCode: {
    fontSize: 14,
    fontWeight: 600,
    color: premium.colors.text,
    fontFamily: premium.font.mono,
  },
  flagBadge: {
    padding: `3px ${premium.space[2]}px`,
    backgroundColor: premium.colors.warningMuted,
    borderRadius: premium.radius.sm,
    fontSize: 11,
    fontWeight: 600,
    color: premium.colors.warning,
  },
  questionScore: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: premium.font.mono,
  },
  questionSection: {
    marginBottom: premium.space[4],
  },
  questionText: {
    fontSize: 15,
    lineHeight: 1.6,
    color: premium.colors.text,
  },
  responseSection: {
    padding: premium.space[4],
    backgroundColor: premium.colors.surface,
    borderRadius: premium.radius.md,
    borderLeft: `3px solid ${premium.colors.success}`,
    marginBottom: premium.space[4],
  },
  responseLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: premium.colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: premium.space[2],
  },
  responseText: {
    fontSize: 14,
    lineHeight: 1.7,
    color: premium.colors.textSecondary,
  },
  tagsRow: {
    display: 'flex',
    gap: premium.space[3],
    marginBottom: premium.space[5],
  },
  qualityTag: {
    display: 'flex',
    alignItems: 'center',
    gap: premium.space[2],
    padding: `${premium.space[1]}px ${premium.space[3]}px`,
    backgroundColor: premium.colors.surface,
    borderRadius: premium.radius.sm,
    border: `1px solid ${premium.colors.border}`,
  },
  tagLabel: {
    fontSize: 12,
    color: premium.colors.textMuted,
  },
  tagValue: {
    fontSize: 13,
    fontWeight: 500,
    color: premium.colors.text,
  },

  // Dimensions
  dimensionsSection: {},
  dimensionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: premium.space[2],
  },
  dimensionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: premium.space[3],
    backgroundColor: premium.colors.surface,
    border: `1px solid ${premium.colors.border}`,
    borderRadius: premium.radius.md,
    textAlign: 'left',
  },
  dimensionName: {
    fontSize: 14,
    fontWeight: 500,
    color: premium.colors.text,
  },
  dimensionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: premium.space[3],
  },
  scorePips: {
    display: 'flex',
    gap: premium.space[1],
  },
  scorePip: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    transition: premium.transition.fast,
  },
  dimensionScoreText: {
    fontSize: 13,
    fontWeight: 500,
    color: premium.colors.textMuted,
    fontFamily: premium.font.mono,
  },

  // Flags
  flagsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: premium.space[4],
  },
  flagsTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: premium.colors.text,
  },
  flagsCount: {
    fontSize: 13,
    color: premium.colors.textMuted,
  },
  flagCard: {
    padding: premium.space[5],
    borderRadius: premium.radius.lg,
  },
  flagHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: premium.space[2],
    marginBottom: premium.space[3],
  },
  severityBadge: {
    padding: `3px ${premium.space[2]}px`,
    borderRadius: premium.radius.sm,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  flagCategory: {
    fontSize: 12,
    color: premium.colors.textMuted,
  },
  flagTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: premium.colors.text,
    marginBottom: premium.space[2],
  },
  flagDescription: {
    fontSize: 14,
    lineHeight: 1.6,
    color: premium.colors.textSecondary,
    marginBottom: premium.space[4],
  },
  analysisBox: {
    padding: premium.space[4],
    backgroundColor: premium.colors.surfaceMuted,
    borderRadius: premium.radius.md,
    marginBottom: premium.space[4],
  },
  analysisLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: premium.colors.textMuted,
    marginBottom: premium.space[2],
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 1.6,
    color: premium.colors.textSecondary,
  },
  relatedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: premium.space[2],
    marginBottom: premium.space[4],
  },
  relatedLabel: {
    fontSize: 12,
    color: premium.colors.textMuted,
  },
  relatedCodes: {
    fontSize: 14,
    fontWeight: 500,
    fontFamily: premium.font.mono,
    color: premium.colors.primary,
  },
  resolveButton: {
    padding: `${premium.space[2]}px ${premium.space[4]}px`,
    backgroundColor: premium.colors.surface,
    border: `1px solid ${premium.colors.border}`,
    borderRadius: premium.radius.md,
    fontSize: 14,
    fontWeight: 500,
    color: premium.colors.text,
  },

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: premium.space[12],
  },
  emptyIcon: {
    width: 64,
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: premium.colors.successMuted,
    borderRadius: premium.radius.lg,
    margin: '0 auto',
    marginBottom: premium.space[4],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: premium.colors.text,
    marginBottom: premium.space[1],
  },
  emptyText: {
    fontSize: 14,
    color: premium.colors.textMuted,
  },

  // Panel
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 100,
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 420,
    maxWidth: '92vw',
    height: '100vh',
    backgroundColor: premium.colors.surface,
    boxShadow: premium.shadows.lg,
    zIndex: 101,
    display: 'flex',
    flexDirection: 'column',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: premium.space[5],
    borderBottom: `1px solid ${premium.colors.border}`,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: premium.colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: premium.radius.sm,
    color: premium.colors.textMuted,
    cursor: 'pointer',
  },
  panelContent: {
    flex: 1,
    overflow: 'auto',
    padding: premium.space[5],
  },
  panelSection: {
    marginBottom: premium.space[6],
  },
  panelLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: premium.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: premium.space[2],
  },
  panelScoreDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: premium.space[4],
  },
  panelScoreValue: {
    fontSize: 28,
    fontWeight: 700,
  },
  panelScoreBar: {
    display: 'flex',
    gap: premium.space[1],
  },
  panelScoreSegment: {
    width: 28,
    height: 8,
    borderRadius: 4,
    transition: premium.transition.base,
  },
  panelReasoning: {
    fontSize: 14,
    lineHeight: 1.65,
    color: premium.colors.textSecondary,
    padding: premium.space[4],
    backgroundColor: premium.colors.surfaceMuted,
    borderRadius: premium.radius.md,
  },
  scaleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: premium.space[2],
  },
  scaleItem: {
    padding: premium.space[3],
    borderRadius: premium.radius.md,
    border: '1px solid',
    transition: premium.transition.fast,
  },
  scaleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: premium.space[2],
    marginBottom: premium.space[1],
  },
  scaleLevel: {
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: premium.colors.surfaceMuted,
    borderRadius: premium.radius.sm,
    fontSize: 12,
    fontWeight: 700,
    color: premium.colors.textSecondary,
  },
  scaleName: {
    fontSize: 14,
    fontWeight: 500,
    color: premium.colors.text,
  },
  currentBadge: {
    marginLeft: 'auto',
    padding: `2px ${premium.space[2]}px`,
    borderRadius: premium.radius.sm,
    fontSize: 11,
    fontWeight: 600,
  },
  scaleDesc: {
    fontSize: 13,
    color: premium.colors.textMuted,
    marginLeft: 30,
  },
};
