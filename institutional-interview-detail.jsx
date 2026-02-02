import React, { useState } from 'react';

/**
 * Institutional-Grade Interview Detail UI
 *
 * Design Sources:
 * - Bloomberg Terminal: Data-forward, invisible UI
 * - Goldman Sachs / JP Morgan: Trust through precision
 * - McKinsey Digital: Sophisticated data presentation
 * - Stripe/Brex: Modern institutional fintech
 *
 * Key Principles:
 * - Sharp corners (4-6px) for formality
 * - Borders over shadows for professionalism
 * - Monospace numbers for precision
 * - Blue as trust anchor
 * - High contrast, WCAG AAA compliance
 * - Data density with proper hierarchy
 */

// Institutional Design System
const ds = {
  colors: {
    // Pure white canvas - clean, not gray
    canvas: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceRaised: '#FAFBFC',
    surfaceInset: '#F6F8FA',

    // Professional text hierarchy
    text: '#24292F',
    textSecondary: '#57606A',
    textTertiary: '#8C959F',

    // Trust blue - institutional standard
    brand: '#0969DA',
    brandDark: '#0550AE',
    brandLight: '#54AEFF',
    brandSubtle: '#DDF4FF',
    brandMuted: '#B6E3FF',

    // Borders - primary depth mechanism
    border: '#D0D7DE',
    borderMuted: '#D8DEE4',
    borderStrong: '#AFB8C1',

    // Semantic
    success: '#1A7F37',
    successSubtle: '#DAFBE1',
    warning: '#9A6700',
    warningSubtle: '#FFF8C5',
    danger: '#CF222E',
    dangerSubtle: '#FFEBE9',
    neutral: '#6E7781',
    neutralSubtle: '#F6F8FA',
  },

  // Typography
  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },

  text: {
    xs: { size: 12, weight: 400, height: 1.5 },
    sm: { size: 14, weight: 400, height: 1.5 },
    base: { size: 16, weight: 400, height: 1.5 },
    lg: { size: 20, weight: 600, height: 1.4 },
    xl: { size: 24, weight: 600, height: 1.3 },
    '2xl': { size: 32, weight: 600, height: 1.25 },
  },

  // Spacing - 4px base grid
  space: {
    1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64,
  },

  // Sharp radii for institutional feel
  radius: {
    sm: 4,
    md: 6,
    lg: 8,
  },

  // Subtle shadows - borders are primary
  shadow: {
    sm: '0 1px 0 rgba(31, 35, 40, 0.04)',
    md: '0 3px 6px rgba(140, 149, 159, 0.15)',
    lg: '0 8px 24px rgba(140, 149, 159, 0.2)',
    inset: 'inset 0 1px 0 rgba(208, 215, 222, 0.2)',
  },
};

// Data
const data = {
  candidate: {
    name: 'Sarah Chen',
    role: 'Senior Product Manager',
    department: 'Strategy & Operations',
    date: '28 Jan 2025',
    time: '14:30 UTC',
    overallScore: 76,
  },
  summary: {
    questionsScored: 24,
    metricsCalculated: 14,
    flagsForReview: 2,
    averageConfidence: 'High',
  },
  metrics: [
    {
      id: 'm1', code: 'M1', name: 'Operational Strength', academic: 'Technical Fitness',
      score: 82, confidence: 'High', weight: 12,
      insight: 'Demonstrates strong technical foundation with consistent execution. Evidence of systematic process optimization and quality management.',
      breakdown: [
        { code: 'Q1', text: 'Cross-functional team management', score: 85, weight: 30, contribution: 25.5 },
        { code: 'Q4', text: 'Process optimization approach', score: 78, weight: 40, contribution: 31.2 },
        { code: 'Q9', text: 'Quality assurance methodology', score: 81, weight: 30, contribution: 24.3 },
      ],
    },
    {
      id: 'm2', code: 'M2', name: 'Future Readiness', academic: 'Evolutionary Fitness',
      score: 68, confidence: 'Medium', weight: 10,
      insight: 'Shows adaptability with opportunity for growth in emerging technology adoption and strategic foresight.',
      breakdown: [
        { code: 'Q2', text: 'Technology adoption strategy', score: 72, weight: 35, contribution: 25.2 },
        { code: 'Q5', text: 'Innovation pipeline management', score: 65, weight: 35, contribution: 22.8 },
        { code: 'Q11', text: 'Market trend analysis', score: 67, weight: 30, contribution: 20.1 },
      ],
    },
    {
      id: 'm3', code: 'M9', name: 'Run/Transform Balance', academic: 'Ambidexterity',
      score: 74, confidence: 'High', weight: 8,
      insight: 'Maintains effective equilibrium between operational excellence and transformation initiatives.',
      breakdown: [
        { code: 'Q3', text: 'Resource allocation decisions', score: 76, weight: 50, contribution: 38.0 },
        { code: 'Q7', text: 'Change management approach', score: 72, weight: 50, contribution: 36.0 },
      ],
    },
    {
      id: 'm4', code: 'M5', name: 'Market Radar', academic: 'Sensing',
      score: 85, confidence: 'High', weight: 10,
      insight: 'Exceptional market awareness with proactive competitive intelligence capabilities.',
      breakdown: [
        { code: 'Q6', text: 'Competitive landscape analysis', score: 88, weight: 60, contribution: 52.8 },
        { code: 'Q12', text: 'Customer insight integration', score: 80, weight: 40, contribution: 32.0 },
      ],
    },
    {
      id: 'm5', code: 'M3', name: 'Insight-to-Action', academic: 'Learning Effectiveness',
      score: 71, confidence: 'Medium', weight: 9,
      insight: 'Capable of translating insights into strategy with potential to accelerate execution.',
      breakdown: [
        { code: 'Q8', text: 'Data-driven decision making', score: 74, weight: 45, contribution: 33.3 },
        { code: 'Q10', text: 'Strategic implementation', score: 68, weight: 55, contribution: 37.4 },
      ],
    },
  ],
  questions: [
    {
      id: 'q1', number: 1, code: 'Q1', score: 85, confidence: 'High', quality: 'Comprehensive',
      text: 'Describe your approach to managing cross-functional teams during complex initiatives.',
      response: 'I establish clear communication protocols early in the process. For a recent product launch, I implemented dedicated collaboration channels, bi-weekly synchronization meetings with all stakeholders, and comprehensive documentation standards. Each team maintained defined ownership areas with explicit handoff protocols.',
      dimensions: [
        { name: 'Communication', score: 5, reasoning: 'Exceptional clarity in describing communication structures and stakeholder management.' },
        { name: 'Process Design', score: 4, reasoning: 'Strong systematic approach to cross-functional coordination.' },
        { name: 'Leadership', score: 4, reasoning: 'Clear evidence of effective team orchestration capabilities.' },
      ],
    },
    {
      id: 'q2', number: 2, code: 'Q2', score: 72, confidence: 'High', quality: 'Detailed',
      text: 'How do you approach prioritization decisions when facing resource constraints?',
      response: 'I employ a structured framework combining impact analysis with urgency assessment. I develop a matrix weighing business value against implementation complexity, then validate through stakeholder alignment sessions.',
      dimensions: [
        { name: 'Strategic Thinking', score: 4, reasoning: 'Well-articulated prioritization framework with clear methodology.' },
        { name: 'Stakeholder Management', score: 4, reasoning: 'Demonstrates effective alignment and consensus-building practices.' },
        { name: 'Analytical Skills', score: 3, reasoning: 'Solid framework with opportunity for more quantitative rigor.' },
      ],
    },
    {
      id: 'q3', number: 3, code: 'Q3', score: 62, confidence: 'Medium', quality: 'Adequate', flagged: true,
      text: 'Describe a strategic pivot based on market feedback and the resulting outcome.',
      response: 'At my previous organization, we launched a B2B feature that received negative market feedback. Within three weeks, I led a rapid discovery phase including customer interviews and competitive analysis. We pivoted to a self-service model which increased adoption by 40%.',
      dimensions: [
        { name: 'Adaptability', score: 3, reasoning: 'Demonstrates willingness to adjust but limited process detail.' },
        { name: 'Customer Focus', score: 4, reasoning: 'Good responsiveness to market signals and customer needs.' },
        { name: 'Results Orientation', score: 3, reasoning: 'Outcome documented but timeline requires clarification.' },
      ],
    },
  ],
  flags: [
    {
      id: 'f1', severity: 'warning', category: 'Data Inconsistency',
      title: 'Timeline discrepancy identified',
      summary: 'Conflicting duration references for product pivot initiative across Q3 and Q12.',
      detail: 'In Q3, candidate states pivot completed "within three weeks." In Q12, same initiative referenced as "six-month transformation." Recommend clarification during follow-up.',
      related: ['Q3', 'Q12'],
      impact: 'Medium',
    },
    {
      id: 'f2', severity: 'info', category: 'Response Completeness',
      title: 'Partial coverage on Q15',
      summary: 'Response addressed 2 of 4 expected evaluation components.',
      detail: 'Question required coverage of: risk identification, mitigation strategies, contingency planning, stakeholder communication. Response covered risk identification and mitigation only.',
      related: ['Q15'],
      impact: 'Low',
    },
  ],
};

// Utilities
const getScoreLevel = (score) => {
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 60) return 'moderate';
  return 'attention';
};

const levelStyles = {
  excellent: { color: ds.colors.success, bg: ds.colors.successSubtle },
  good: { color: ds.colors.brand, bg: ds.colors.brandSubtle },
  moderate: { color: ds.colors.warning, bg: ds.colors.warningSubtle },
  attention: { color: ds.colors.danger, bg: ds.colors.dangerSubtle },
};

// Global Styles
const GlobalStyles = () => (
  <style>{`
    @import url('https://rsms.me/inter/inter.css');

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      font-family: ${ds.font.sans};
      font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on, 'cv03' on;
    }

    body {
      background: ${ds.colors.canvas};
      color: ${ds.colors.text};
      font-size: 14px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .fade-in { animation: fadeIn 0.2s ease-out forwards; }
    .slide-up { animation: slideUp 0.25s ease-out forwards; }

    .focus-ring:focus {
      outline: 2px solid ${ds.colors.brand};
      outline-offset: 2px;
    }

    .focus-ring:focus:not(:focus-visible) {
      outline: none;
    }

    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${ds.colors.borderMuted}; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: ${ds.colors.borderStrong}; }
  `}</style>
);

// Main Component
export default function InstitutionalInterviewDetail() {
  const [activeTab, setActiveTab] = useState('metrics');
  const [expandedId, setExpandedId] = useState(null);
  const [dimensionPanel, setDimensionPanel] = useState(null);

  const { candidate, summary, metrics, questions, flags } = data;
  const scoreLevel = getScoreLevel(candidate.overallScore);
  const scoreStyle = levelStyles[scoreLevel];

  return (
    <div style={styles.page}>
      <GlobalStyles />

      {/* Page Header */}
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <nav style={styles.breadcrumb}>
            <a href="#" style={styles.breadcrumbLink}>Evaluations</a>
            <span style={styles.breadcrumbSep}>/</span>
            <a href="#" style={styles.breadcrumbLink}>Q1 2025 Cohort</a>
            <span style={styles.breadcrumbSep}>/</span>
            <span style={styles.breadcrumbCurrent}>{candidate.name}</span>
          </nav>
          <div style={styles.headerActions}>
            <button style={styles.secondaryButton}>Export PDF</button>
            <button style={styles.primaryButton}>Complete Review</button>
          </div>
        </div>

        <div style={styles.headerMain}>
          <div style={styles.candidateInfo}>
            <div style={styles.avatar}>
              {candidate.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={styles.candidateDetails}>
              <h1 style={styles.candidateName}>{candidate.name}</h1>
              <div style={styles.candidateMeta}>
                <span>{candidate.role}</span>
                <span style={styles.metaDot} />
                <span>{candidate.department}</span>
              </div>
            </div>
          </div>

          <div style={styles.scorePanel}>
            <div style={styles.scoreMain}>
              <span style={{ ...styles.scoreValue, color: scoreStyle.color }}>
                {candidate.overallScore}
              </span>
              <span style={styles.scoreMax}>/100</span>
            </div>
            <div style={styles.scoreBar}>
              <div style={{
                ...styles.scoreBarFill,
                width: `${candidate.overallScore}%`,
                backgroundColor: scoreStyle.color,
              }} />
            </div>
            <span style={styles.scoreLabel}>Overall Assessment Score</span>
          </div>
        </div>

        <div style={styles.headerMeta}>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Evaluated</span>
            <span style={styles.metaValue}>{candidate.date}, {candidate.time}</span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Questions</span>
            <span style={styles.metaValue}>{summary.questionsScored}</span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Metrics</span>
            <span style={styles.metaValue}>{summary.metricsCalculated}</span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Flags</span>
            <span style={{
              ...styles.metaValue,
              color: summary.flagsForReview > 0 ? ds.colors.warning : ds.colors.success,
            }}>
              {summary.flagsForReview}
            </span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Confidence</span>
            <span style={styles.metaValue}>{summary.averageConfidence}</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
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
              className="focus-ring"
            >
              {tab.label}
              <span style={{
                ...styles.navCount,
                ...(activeTab === tab.id ? styles.navCountActive : {}),
                ...(tab.alert && activeTab !== tab.id ? styles.navCountAlert : {}),
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main style={styles.main}>
        {activeTab === 'metrics' && (
          <MetricsView
            metrics={metrics}
            expandedId={expandedId}
            onToggle={setExpandedId}
          />
        )}

        {activeTab === 'questions' && (
          <QuestionsView
            questions={questions}
            expandedId={expandedId}
            onToggle={setExpandedId}
            onDimensionSelect={setDimensionPanel}
          />
        )}

        {activeTab === 'flags' && (
          <FlagsView flags={flags} />
        )}
      </main>

      {/* Dimension Panel */}
      {dimensionPanel && (
        <DimensionPanel
          dimension={dimensionPanel}
          onClose={() => setDimensionPanel(null)}
        />
      )}
    </div>
  );
}

// Metrics View
function MetricsView({ metrics, expandedId, onToggle }) {
  return (
    <div style={styles.content}>
      {/* Summary Table Header */}
      <div style={styles.tableHeader}>
        <div style={{ ...styles.tableHeaderCell, flex: 2 }}>Metric</div>
        <div style={styles.tableHeaderCell}>Score</div>
        <div style={styles.tableHeaderCell}>Confidence</div>
        <div style={styles.tableHeaderCell}>Weight</div>
        <div style={{ ...styles.tableHeaderCell, width: 40 }} />
      </div>

      {/* Metric Rows */}
      {metrics.map((metric, i) => (
        <MetricRow
          key={metric.id}
          metric={metric}
          isExpanded={expandedId === metric.id}
          onToggle={() => onToggle(expandedId === metric.id ? null : metric.id)}
          index={i}
        />
      ))}
    </div>
  );
}

function MetricRow({ metric, isExpanded, onToggle, index }) {
  const level = getScoreLevel(metric.score);
  const style = levelStyles[level];

  return (
    <div style={{ ...styles.tableRow, animationDelay: `${index * 30}ms` }} className="slide-up">
      <button onClick={onToggle} style={styles.tableRowButton} className="focus-ring">
        <div style={{ ...styles.tableCell, flex: 2 }}>
          <span style={styles.metricCode}>{metric.code}</span>
          <div style={styles.metricNameGroup}>
            <span style={styles.metricName}>{metric.name}</span>
            <span style={styles.metricAcademic}>{metric.academic}</span>
          </div>
        </div>
        <div style={styles.tableCell}>
          <span style={{ ...styles.scoreText, color: style.color }}>{metric.score}</span>
        </div>
        <div style={styles.tableCell}>
          <span style={styles.confidenceBadge}>{metric.confidence}</span>
        </div>
        <div style={styles.tableCell}>
          <span style={styles.weightText}>{metric.weight}%</span>
        </div>
        <div style={{ ...styles.tableCell, width: 40, justifyContent: 'center' }}>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill={ds.colors.textTertiary}
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: '0.15s ease' }}
          >
            <path d="M4.427 5.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 5H4.604a.25.25 0 00-.177.427z" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div style={styles.expandedContent} className="fade-in">
          <p style={styles.insight}>{metric.insight}</p>

          <div style={styles.breakdownTable}>
            <div style={styles.breakdownHeader}>
              <span style={{ flex: 2 }}>Question</span>
              <span>Score</span>
              <span>Weight</span>
              <span>Contribution</span>
            </div>
            {metric.breakdown.map((row, i) => (
              <div key={i} style={styles.breakdownRow}>
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: ds.space[2] }}>
                  <span style={styles.breakdownCode}>{row.code}</span>
                  <span style={styles.breakdownText}>{row.text}</span>
                </div>
                <span style={{ ...styles.breakdownScore, color: levelStyles[getScoreLevel(row.score)].color }}>
                  {row.score}
                </span>
                <span style={styles.breakdownWeight}>{row.weight}%</span>
                <span style={styles.breakdownContrib}>{row.contribution.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Questions View
function QuestionsView({ questions, expandedId, onToggle, onDimensionSelect }) {
  return (
    <div style={styles.content}>
      {questions.map((question, i) => (
        <QuestionCard
          key={question.id}
          question={question}
          isExpanded={expandedId === question.id}
          onToggle={() => onToggle(expandedId === question.id ? null : question.id)}
          onDimensionSelect={onDimensionSelect}
          index={i}
        />
      ))}
    </div>
  );
}

function QuestionCard({ question, isExpanded, onToggle, onDimensionSelect, index }) {
  const level = getScoreLevel(question.score);
  const style = levelStyles[level];

  return (
    <div style={{ ...styles.card, animationDelay: `${index * 40}ms` }} className="slide-up">
      <button onClick={onToggle} style={styles.cardHeader} className="focus-ring">
        <div style={styles.cardHeaderLeft}>
          <span style={styles.questionNumber}>{question.number}</span>
          <span style={styles.questionCode}>{question.code}</span>
          {question.flagged && (
            <span style={styles.flagIndicator}>Flagged</span>
          )}
        </div>
        <div style={styles.cardHeaderRight}>
          <span style={styles.qualityBadge}>{question.quality}</span>
          <span style={styles.confidenceBadge}>{question.confidence}</span>
          <span style={{ ...styles.questionScore, color: style.color }}>{question.score}</span>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill={ds.colors.textTertiary}
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: '0.15s ease' }}
          >
            <path d="M4.427 5.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 5H4.604a.25.25 0 00-.177.427z" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div style={styles.cardContent} className="fade-in">
          <div style={styles.questionSection}>
            <label style={styles.sectionLabel}>Question</label>
            <p style={styles.questionText}>{question.text}</p>
          </div>

          <div style={styles.responseSection}>
            <label style={styles.responseLabel}>Candidate Response</label>
            <p style={styles.responseText}>{question.response}</p>
          </div>

          <div style={styles.dimensionsSection}>
            <label style={styles.sectionLabel}>Dimension Scores</label>
            <div style={styles.dimensionList}>
              {question.dimensions.map((dim, i) => (
                <button
                  key={i}
                  style={styles.dimensionRow}
                  onClick={() => onDimensionSelect(dim)}
                  className="focus-ring"
                >
                  <span style={styles.dimensionName}>{dim.name}</span>
                  <div style={styles.dimensionRight}>
                    <div style={styles.dimensionPips}>
                      {[1,2,3,4,5].map(n => (
                        <div
                          key={n}
                          style={{
                            ...styles.pip,
                            backgroundColor: n <= dim.score
                              ? levelStyles[getScoreLevel(dim.score * 20)].color
                              : ds.colors.borderMuted,
                          }}
                        />
                      ))}
                    </div>
                    <span style={styles.dimensionScore}>{dim.score}/5</span>
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

// Flags View
function FlagsView({ flags }) {
  if (flags.length === 0) {
    return (
      <div style={styles.emptyState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={ds.colors.success} strokeWidth="1.5">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 style={styles.emptyTitle}>No flags identified</h3>
        <p style={styles.emptyText}>All responses passed quality validation checks.</p>
      </div>
    );
  }

  return (
    <div style={styles.content}>
      {flags.map((flag, i) => (
        <FlagCard key={flag.id} flag={flag} index={i} />
      ))}
    </div>
  );
}

function FlagCard({ flag, index }) {
  const severityStyles = {
    warning: { color: ds.colors.warning, bg: ds.colors.warningSubtle, border: '#DFC37B' },
    info: { color: ds.colors.neutral, bg: ds.colors.neutralSubtle, border: ds.colors.borderMuted },
    critical: { color: ds.colors.danger, bg: ds.colors.dangerSubtle, border: '#F5A8A8' },
  };
  const sev = severityStyles[flag.severity];

  return (
    <div
      style={{ ...styles.flagCard, borderLeftColor: sev.border, animationDelay: `${index * 50}ms` }}
      className="slide-up"
    >
      <div style={styles.flagHeader}>
        <span style={{ ...styles.severityBadge, color: sev.color, backgroundColor: sev.bg }}>
          {flag.severity}
        </span>
        <span style={styles.flagCategory}>{flag.category}</span>
        <span style={styles.flagImpact}>Impact: {flag.impact}</span>
      </div>

      <h3 style={styles.flagTitle}>{flag.title}</h3>
      <p style={styles.flagSummary}>{flag.summary}</p>

      <div style={styles.flagDetail}>
        <label style={styles.detailLabel}>Analysis</label>
        <p style={styles.detailText}>{flag.detail}</p>
      </div>

      <div style={styles.flagFooter}>
        <div style={styles.relatedQuestions}>
          <span style={styles.relatedLabel}>Related:</span>
          {flag.related.map(code => (
            <span key={code} style={styles.relatedCode}>{code}</span>
          ))}
        </div>
        <button style={styles.resolveButton} className="focus-ring">
          Mark Resolved
        </button>
      </div>
    </div>
  );
}

// Dimension Panel
function DimensionPanel({ dimension, onClose }) {
  const level = getScoreLevel(dimension.score * 20);
  const style = levelStyles[level];

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <aside style={styles.panel} className="fade-in">
        <header style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>{dimension.name}</h2>
          <button onClick={onClose} style={styles.closeButton} className="focus-ring">
            <svg width="16" height="16" viewBox="0 0 16 16" fill={ds.colors.textSecondary}>
              <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </header>

        <div style={styles.panelContent}>
          <div style={styles.panelSection}>
            <label style={styles.panelLabel}>Score</label>
            <div style={styles.panelScoreRow}>
              <span style={{ ...styles.panelScoreValue, color: style.color }}>
                {dimension.score}
              </span>
              <span style={styles.panelScoreMax}>/5</span>
              <div style={styles.panelPips}>
                {[1,2,3,4,5].map(n => (
                  <div
                    key={n}
                    style={{
                      ...styles.panelPip,
                      backgroundColor: n <= dimension.score ? style.color : ds.colors.borderMuted,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={styles.panelSection}>
            <label style={styles.panelLabel}>Reasoning</label>
            <p style={styles.panelReasoning}>{dimension.reasoning}</p>
          </div>

          <div style={styles.panelSection}>
            <label style={styles.panelLabel}>Scoring Rubric</label>
            <div style={styles.rubricList}>
              {[
                { score: 5, label: 'Exceptional', desc: 'Consistently exceeds all expectations' },
                { score: 4, label: 'Strong', desc: 'Clearly demonstrates competency' },
                { score: 3, label: 'Adequate', desc: 'Meets baseline requirements' },
                { score: 2, label: 'Developing', desc: 'Partial capability demonstrated' },
                { score: 1, label: 'Limited', desc: 'Significant development required' },
              ].map(item => (
                <div
                  key={item.score}
                  style={{
                    ...styles.rubricItem,
                    backgroundColor: item.score === dimension.score ? style.bg : 'transparent',
                    borderColor: item.score === dimension.score ? style.color : ds.colors.border,
                  }}
                >
                  <div style={styles.rubricHeader}>
                    <span style={styles.rubricScore}>{item.score}</span>
                    <span style={styles.rubricLabel}>{item.label}</span>
                    {item.score === dimension.score && (
                      <span style={{ ...styles.currentTag, color: style.color, backgroundColor: style.bg }}>
                        Current
                      </span>
                    )}
                  </div>
                  <span style={styles.rubricDesc}>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

// Styles
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: ds.colors.canvas,
  },

  // Header
  header: {
    borderBottom: `1px solid ${ds.colors.border}`,
    backgroundColor: ds.colors.surface,
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${ds.space[3]}px ${ds.space[6]}px`,
    borderBottom: `1px solid ${ds.colors.borderMuted}`,
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[2],
    fontSize: 14,
  },
  breadcrumbLink: {
    color: ds.colors.brand,
    textDecoration: 'none',
  },
  breadcrumbSep: {
    color: ds.colors.textTertiary,
  },
  breadcrumbCurrent: {
    color: ds.colors.text,
    fontWeight: 600,
  },
  headerActions: {
    display: 'flex',
    gap: ds.space[2],
  },
  primaryButton: {
    padding: `${ds.space[2]}px ${ds.space[4]}px`,
    backgroundColor: ds.colors.brand,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: ds.radius.md,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: `${ds.space[2]}px ${ds.space[4]}px`,
    backgroundColor: ds.colors.surface,
    color: ds.colors.text,
    border: `1px solid ${ds.colors.border}`,
    borderRadius: ds.radius.md,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  headerMain: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${ds.space[5]}px ${ds.space[6]}px`,
  },
  candidateInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[4],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: ds.radius.lg,
    backgroundColor: ds.colors.brandSubtle,
    color: ds.colors.brand,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 600,
  },
  candidateDetails: {},
  candidateName: {
    fontSize: 20,
    fontWeight: 600,
    color: ds.colors.text,
    marginBottom: ds.space[1],
  },
  candidateMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[2],
    fontSize: 14,
    color: ds.colors.textSecondary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: '50%',
    backgroundColor: ds.colors.borderStrong,
  },
  scorePanel: {
    textAlign: 'right',
  },
  scoreMain: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 2,
    marginBottom: ds.space[2],
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 600,
    fontFamily: ds.font.mono,
    lineHeight: 1,
  },
  scoreMax: {
    fontSize: 16,
    color: ds.colors.textTertiary,
    fontFamily: ds.font.mono,
  },
  scoreBar: {
    width: 120,
    height: 4,
    backgroundColor: ds.colors.borderMuted,
    borderRadius: 2,
    overflow: 'hidden',
    marginLeft: 'auto',
    marginBottom: ds.space[1],
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.4s ease',
  },
  scoreLabel: {
    fontSize: 12,
    color: ds.colors.textTertiary,
  },
  headerMeta: {
    display: 'flex',
    gap: ds.space[8],
    padding: `${ds.space[3]}px ${ds.space[6]}px`,
    borderTop: `1px solid ${ds.colors.borderMuted}`,
    backgroundColor: ds.colors.surfaceInset,
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: ds.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: 500,
    color: ds.colors.text,
  },

  // Navigation
  nav: {
    borderBottom: `1px solid ${ds.colors.border}`,
    backgroundColor: ds.colors.surface,
  },
  navInner: {
    display: 'flex',
    padding: `0 ${ds.space[6]}px`,
  },
  navTab: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[2],
    padding: `${ds.space[3]}px ${ds.space[4]}px`,
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: -1,
    fontSize: 14,
    fontWeight: 500,
    color: ds.colors.textSecondary,
    cursor: 'pointer',
    transition: 'color 0.15s ease, border-color 0.15s ease',
  },
  navTabActive: {
    color: ds.colors.text,
    borderBottomColor: ds.colors.brand,
  },
  navCount: {
    padding: `0 ${ds.space[2]}px`,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ds.colors.surfaceInset,
    color: ds.colors.textTertiary,
    fontSize: 12,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCountActive: {
    backgroundColor: ds.colors.brand,
    color: '#FFFFFF',
  },
  navCountAlert: {
    backgroundColor: ds.colors.warningSubtle,
    color: ds.colors.warning,
  },

  // Main
  main: {
    padding: ds.space[6],
    maxWidth: 1200,
    margin: '0 auto',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
  },

  // Table (Metrics)
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: `${ds.space[2]}px ${ds.space[4]}px`,
    backgroundColor: ds.colors.surfaceInset,
    borderRadius: `${ds.radius.md}px ${ds.radius.md}px 0 0`,
    border: `1px solid ${ds.colors.border}`,
    borderBottom: 'none',
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: 600,
    color: ds.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    backgroundColor: ds.colors.surface,
    borderLeft: `1px solid ${ds.colors.border}`,
    borderRight: `1px solid ${ds.colors.border}`,
    borderBottom: `1px solid ${ds.colors.border}`,
  },
  tableRowButton: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: `${ds.space[3]}px ${ds.space[4]}px`,
    backgroundColor: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
  },
  tableCell: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[3],
    fontSize: 14,
  },
  metricCode: {
    padding: `${ds.space[1]}px ${ds.space[2]}px`,
    backgroundColor: ds.colors.surfaceInset,
    borderRadius: ds.radius.sm,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: ds.font.mono,
    color: ds.colors.textSecondary,
  },
  metricNameGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  metricName: {
    fontSize: 14,
    fontWeight: 500,
    color: ds.colors.text,
  },
  metricAcademic: {
    fontSize: 12,
    color: ds.colors.textTertiary,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 600,
    fontFamily: ds.font.mono,
  },
  confidenceBadge: {
    padding: `2px ${ds.space[2]}px`,
    backgroundColor: ds.colors.surfaceInset,
    borderRadius: ds.radius.sm,
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
  weightText: {
    fontSize: 14,
    fontFamily: ds.font.mono,
    color: ds.colors.textSecondary,
  },
  expandedContent: {
    padding: ds.space[4],
    borderTop: `1px solid ${ds.colors.borderMuted}`,
    backgroundColor: ds.colors.surfaceInset,
  },
  insight: {
    fontSize: 14,
    lineHeight: 1.6,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[4],
  },
  breakdownTable: {
    border: `1px solid ${ds.colors.border}`,
    borderRadius: ds.radius.md,
    overflow: 'hidden',
  },
  breakdownHeader: {
    display: 'flex',
    padding: `${ds.space[2]}px ${ds.space[3]}px`,
    backgroundColor: ds.colors.surface,
    borderBottom: `1px solid ${ds.colors.border}`,
    fontSize: 11,
    fontWeight: 600,
    color: ds.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownRow: {
    display: 'flex',
    alignItems: 'center',
    padding: `${ds.space[2]}px ${ds.space[3]}px`,
    backgroundColor: ds.colors.surface,
    borderBottom: `1px solid ${ds.colors.borderMuted}`,
    fontSize: 13,
  },
  breakdownCode: {
    fontWeight: 600,
    fontFamily: ds.font.mono,
    color: ds.colors.brand,
  },
  breakdownText: {
    color: ds.colors.textSecondary,
  },
  breakdownScore: {
    flex: 1,
    fontWeight: 600,
    fontFamily: ds.font.mono,
  },
  breakdownWeight: {
    flex: 1,
    fontFamily: ds.font.mono,
    color: ds.colors.textSecondary,
  },
  breakdownContrib: {
    flex: 1,
    fontWeight: 500,
    fontFamily: ds.font.mono,
  },

  // Card (Questions)
  card: {
    backgroundColor: ds.colors.surface,
    border: `1px solid ${ds.colors.border}`,
    borderRadius: ds.radius.md,
    marginBottom: ds.space[3],
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: `${ds.space[3]}px ${ds.space[4]}px`,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[3],
  },
  cardHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[3],
  },
  questionNumber: {
    width: 24,
    height: 24,
    borderRadius: ds.radius.sm,
    backgroundColor: ds.colors.surfaceInset,
    color: ds.colors.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
  },
  questionCode: {
    fontSize: 14,
    fontWeight: 600,
    fontFamily: ds.font.mono,
    color: ds.colors.text,
  },
  flagIndicator: {
    padding: `2px ${ds.space[2]}px`,
    backgroundColor: ds.colors.warningSubtle,
    color: ds.colors.warning,
    borderRadius: ds.radius.sm,
    fontSize: 11,
    fontWeight: 600,
  },
  qualityBadge: {
    padding: `2px ${ds.space[2]}px`,
    backgroundColor: ds.colors.surfaceInset,
    borderRadius: ds.radius.sm,
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
  questionScore: {
    fontSize: 18,
    fontWeight: 600,
    fontFamily: ds.font.mono,
  },
  cardContent: {
    padding: ds.space[4],
    borderTop: `1px solid ${ds.colors.borderMuted}`,
  },
  questionSection: {
    marginBottom: ds.space[4],
  },
  sectionLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: ds.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ds.space[2],
  },
  questionText: {
    fontSize: 15,
    lineHeight: 1.6,
    color: ds.colors.text,
  },
  responseSection: {
    padding: ds.space[4],
    backgroundColor: ds.colors.surfaceInset,
    borderRadius: ds.radius.md,
    borderLeft: `3px solid ${ds.colors.brand}`,
    marginBottom: ds.space[4],
  },
  responseLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: ds.colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ds.space[2],
  },
  responseText: {
    fontSize: 14,
    lineHeight: 1.7,
    color: ds.colors.textSecondary,
  },
  dimensionsSection: {},
  dimensionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: ds.space[2],
  },
  dimensionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: `${ds.space[2]}px ${ds.space[3]}px`,
    backgroundColor: ds.colors.surface,
    border: `1px solid ${ds.colors.border}`,
    borderRadius: ds.radius.sm,
    cursor: 'pointer',
    textAlign: 'left',
  },
  dimensionName: {
    fontSize: 14,
    fontWeight: 500,
    color: ds.colors.text,
  },
  dimensionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[3],
  },
  dimensionPips: {
    display: 'flex',
    gap: 3,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  dimensionScore: {
    fontSize: 13,
    fontWeight: 500,
    fontFamily: ds.font.mono,
    color: ds.colors.textSecondary,
  },

  // Flags
  flagCard: {
    backgroundColor: ds.colors.surface,
    border: `1px solid ${ds.colors.border}`,
    borderLeft: '3px solid',
    borderRadius: ds.radius.md,
    padding: ds.space[4],
    marginBottom: ds.space[3],
  },
  flagHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[3],
    marginBottom: ds.space[3],
  },
  severityBadge: {
    padding: `2px ${ds.space[2]}px`,
    borderRadius: ds.radius.sm,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  flagCategory: {
    fontSize: 12,
    color: ds.colors.textSecondary,
  },
  flagImpact: {
    marginLeft: 'auto',
    fontSize: 12,
    color: ds.colors.textTertiary,
  },
  flagTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: ds.colors.text,
    marginBottom: ds.space[2],
  },
  flagSummary: {
    fontSize: 14,
    lineHeight: 1.6,
    color: ds.colors.textSecondary,
    marginBottom: ds.space[4],
  },
  flagDetail: {
    padding: ds.space[3],
    backgroundColor: ds.colors.surfaceInset,
    borderRadius: ds.radius.md,
    marginBottom: ds.space[4],
  },
  detailLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: ds.colors.textTertiary,
    marginBottom: ds.space[2],
  },
  detailText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: ds.colors.textSecondary,
  },
  flagFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relatedQuestions: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[2],
  },
  relatedLabel: {
    fontSize: 12,
    color: ds.colors.textTertiary,
  },
  relatedCode: {
    padding: `2px ${ds.space[2]}px`,
    backgroundColor: ds.colors.brandSubtle,
    color: ds.colors.brand,
    borderRadius: ds.radius.sm,
    fontSize: 12,
    fontWeight: 500,
    fontFamily: ds.font.mono,
  },
  resolveButton: {
    padding: `${ds.space[2]}px ${ds.space[3]}px`,
    backgroundColor: ds.colors.surface,
    border: `1px solid ${ds.colors.border}`,
    borderRadius: ds.radius.md,
    fontSize: 13,
    fontWeight: 500,
    color: ds.colors.text,
    cursor: 'pointer',
  },

  // Empty State
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ds.space[12],
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: ds.colors.text,
    marginTop: ds.space[4],
    marginBottom: ds.space[1],
  },
  emptyText: {
    fontSize: 14,
    color: ds.colors.textSecondary,
  },

  // Panel
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(36, 41, 47, 0.5)',
    zIndex: 100,
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 400,
    maxWidth: '100vw',
    height: '100vh',
    backgroundColor: ds.colors.surface,
    borderLeft: `1px solid ${ds.colors.border}`,
    boxShadow: ds.shadow.lg,
    zIndex: 101,
    display: 'flex',
    flexDirection: 'column',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ds.space[4],
    borderBottom: `1px solid ${ds.colors.border}`,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: ds.colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: `1px solid ${ds.colors.border}`,
    borderRadius: ds.radius.md,
    cursor: 'pointer',
  },
  panelContent: {
    flex: 1,
    overflow: 'auto',
    padding: ds.space[4],
  },
  panelSection: {
    marginBottom: ds.space[6],
  },
  panelLabel: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: ds.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ds.space[2],
  },
  panelScoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[3],
  },
  panelScoreValue: {
    fontSize: 32,
    fontWeight: 600,
    fontFamily: ds.font.mono,
  },
  panelScoreMax: {
    fontSize: 16,
    color: ds.colors.textTertiary,
    fontFamily: ds.font.mono,
  },
  panelPips: {
    display: 'flex',
    gap: ds.space[1],
    marginLeft: ds.space[3],
  },
  panelPip: {
    width: 24,
    height: 6,
    borderRadius: 3,
  },
  panelReasoning: {
    fontSize: 14,
    lineHeight: 1.6,
    color: ds.colors.textSecondary,
    padding: ds.space[3],
    backgroundColor: ds.colors.surfaceInset,
    borderRadius: ds.radius.md,
  },
  rubricList: {
    display: 'flex',
    flexDirection: 'column',
    gap: ds.space[2],
  },
  rubricItem: {
    padding: ds.space[3],
    borderRadius: ds.radius.md,
    border: '1px solid',
  },
  rubricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[2],
    marginBottom: ds.space[1],
  },
  rubricScore: {
    width: 20,
    height: 20,
    borderRadius: ds.radius.sm,
    backgroundColor: ds.colors.surfaceInset,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: ds.colors.textSecondary,
  },
  rubricLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: ds.colors.text,
  },
  currentTag: {
    marginLeft: 'auto',
    padding: `2px ${ds.space[2]}px`,
    borderRadius: ds.radius.sm,
    fontSize: 11,
    fontWeight: 600,
  },
  rubricDesc: {
    fontSize: 13,
    color: ds.colors.textTertiary,
    marginLeft: 28,
  },
};
