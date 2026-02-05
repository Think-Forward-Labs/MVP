import React, { useState } from 'react';

/**
 * Premium Interview Detail UI - Enterprise Edition
 *
 * Design Philosophy:
 * - Restraint and sophistication over decoration
 * - Content hierarchy through typography, not icons
 * - Generous whitespace as a design element
 * - Subtle depth through refined shadows
 * - Muted, professional color palette
 */

// Design System
const ds = {
  colors: {
    // Refined neutrals
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceSubtle: '#F7F7F8',

    // Text hierarchy
    text: '#18181B',
    textMuted: '#52525B',
    textSubtle: '#A1A1AA',

    // Borders
    border: '#E4E4E7',
    borderSubtle: '#F4F4F5',

    // Accent - sophisticated blue-gray
    accent: '#3F3F46',
    accentSubtle: '#F4F4F5',

    // Semantic - muted versions
    positive: '#22C55E',
    positiveMuted: 'rgba(34, 197, 94, 0.08)',
    caution: '#EAB308',
    cautionMuted: 'rgba(234, 179, 8, 0.08)',
    negative: '#EF4444',
    negativeMuted: 'rgba(239, 68, 68, 0.08)',
  },

  space: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96],

  radius: { sm: 4, md: 8, lg: 12 },

  shadow: {
    subtle: '0 1px 2px rgba(0, 0, 0, 0.03)',
    soft: '0 2px 8px rgba(0, 0, 0, 0.04)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.06)',
  },

  font: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", monospace',
  },

  text: {
    xs: { size: 11, height: 16, spacing: 0.2 },
    sm: { size: 13, height: 20, spacing: 0 },
    base: { size: 14, height: 22, spacing: 0 },
    md: { size: 15, height: 24, spacing: -0.1 },
    lg: { size: 18, height: 28, spacing: -0.3 },
    xl: { size: 24, height: 32, spacing: -0.5 },
  },
};

// Interview Data
const data = {
  name: 'Sarah Chen',
  role: 'Senior Product Manager',
  date: 'January 28, 2025',
  score: 76,

  summary: {
    questions: 24,
    metrics: 14,
    flags: 2,
  },

  metrics: [
    {
      id: 1,
      code: 'M1',
      name: 'Operational Strength',
      descriptor: 'Technical Fitness',
      score: 82,
      confidence: 'High',
      interpretation: 'Demonstrates strong technical foundation with consistent execution patterns across multiple operational domains. Evidence of systematic approach to process optimization.',
      breakdown: [
        { question: 'Q1', score: 85, weight: 30 },
        { question: 'Q4', score: 78, weight: 40 },
        { question: 'Q9', score: 81, weight: 30 },
      ],
    },
    {
      id: 2,
      code: 'M2',
      name: 'Future Readiness',
      descriptor: 'Evolutionary Fitness',
      score: 68,
      confidence: 'Medium',
      interpretation: 'Shows moderate adaptability with opportunity for growth in emerging technology adoption and forward-looking strategic planning.',
      breakdown: [
        { question: 'Q2', score: 72, weight: 35 },
        { question: 'Q5', score: 65, weight: 35 },
        { question: 'Q11', score: 67, weight: 30 },
      ],
    },
    {
      id: 3,
      code: 'M9',
      name: 'Run/Transform Balance',
      descriptor: 'Ambidexterity',
      score: 74,
      confidence: 'High',
      interpretation: 'Maintains effective equilibrium between operational excellence and innovation initiatives. Resource allocation decisions reflect strategic priorities.',
      breakdown: [
        { question: 'Q3', score: 76, weight: 50 },
        { question: 'Q7', score: 72, weight: 50 },
      ],
    },
    {
      id: 4,
      code: 'M5',
      name: 'Market Radar',
      descriptor: 'Sensing',
      score: 85,
      confidence: 'High',
      interpretation: 'Exceptional market awareness with proactive identification of opportunities and competitive dynamics. Strong evidence of systematic environmental scanning.',
      breakdown: [
        { question: 'Q6', score: 88, weight: 60 },
        { question: 'Q12', score: 80, weight: 40 },
      ],
    },
    {
      id: 5,
      code: 'M3',
      name: 'Insight-to-Action',
      descriptor: 'Learning Effectiveness',
      score: 71,
      confidence: 'Medium',
      interpretation: 'Demonstrates capability to translate analytical insights into executable strategies, with potential to accelerate implementation velocity.',
      breakdown: [
        { question: 'Q8', score: 74, weight: 45 },
        { question: 'Q10', score: 68, weight: 55 },
      ],
    },
  ],

  questions: [
    {
      id: 1,
      number: 1,
      code: 'Q1',
      score: 85,
      confidence: 'High',
      quality: 'Comprehensive',
      text: 'Describe your approach to managing cross-functional teams during a complex product launch. What systems and processes do you implement?',
      response: 'I establish clear communication channels early in the process. For a recent product launch, I implemented a dedicated collaboration workspace, bi-weekly synchronization meetings with all stakeholders, and created comprehensive documentation. Each team maintained clear ownership areas with defined handoff protocols. We utilized a RACI framework to ensure accountability.',
      dimensions: [
        { name: 'Communication', score: 5, reasoning: 'Exceptional clarity in articulating communication structures and protocols.' },
        { name: 'Process Design', score: 4, reasoning: 'Strong systematic approach to cross-functional coordination.' },
        { name: 'Leadership', score: 4, reasoning: 'Clear evidence of effective team orchestration capabilities.' },
      ],
    },
    {
      id: 2,
      number: 2,
      code: 'Q2',
      score: 72,
      confidence: 'High',
      quality: 'Detailed',
      text: 'How do you approach prioritization when facing competing initiatives with constrained resources?',
      response: 'I employ a structured framework combining impact analysis with urgency assessment. First, I develop a matrix weighing business value against implementation effort. Then I validate priorities through stakeholder alignment sessions. For conflicting high-priority items, I analyze dependencies and identify quick wins that may unblock subsequent initiatives.',
      dimensions: [
        { name: 'Strategic Thinking', score: 4, reasoning: 'Well-articulated prioritization framework with clear methodology.' },
        { name: 'Stakeholder Management', score: 4, reasoning: 'Demonstrates effective alignment and communication practices.' },
        { name: 'Analytical Skills', score: 3, reasoning: 'Solid framework with opportunity for more data-driven elements.' },
      ],
    },
    {
      id: 3,
      number: 3,
      code: 'Q3',
      score: 62,
      confidence: 'Medium',
      quality: 'Adequate',
      requiresReview: true,
      text: 'Describe a situation where you needed to pivot product strategy based on market feedback. What was your approach and outcome?',
      response: 'At my previous company, we launched a B2B feature that received negative market feedback. Within three weeks, I led a rapid discovery phase including customer interviews and competitive analysis. We pivoted to a self-service model which increased adoption by 40%.',
      dimensions: [
        { name: 'Adaptability', score: 3, reasoning: 'Demonstrates willingness to adjust but limited process detail.' },
        { name: 'Customer Focus', score: 4, reasoning: 'Good responsiveness to market signals.' },
        { name: 'Results Orientation', score: 3, reasoning: 'Outcome mentioned but timeline consistency noted for review.' },
      ],
    },
  ],

  flags: [
    {
      id: 1,
      severity: 'warning',
      type: 'Inconsistency',
      title: 'Timeline Discrepancy Identified',
      description: 'Responses to Q3 and Q12 contain potentially conflicting information regarding the duration of the product pivot initiative.',
      analysis: 'In Q3, the candidate references completing a pivot within three weeks. However, in Q12, the same project is described as a six-month transformation journey. This discrepancy may indicate either timeline confusion or conflation of separate initiatives.',
      relatedQuestions: ['Q3', 'Q12'],
    },
    {
      id: 2,
      severity: 'info',
      type: 'Incomplete Response',
      title: 'Partial Response Coverage',
      description: 'The response to Q15 addressed two of four expected components for comprehensive coverage.',
      analysis: 'The question requested coverage of risk identification, mitigation strategies, contingency planning, and stakeholder communication. The response addressed risk identification and mitigation but omitted contingency planning and communication protocols.',
      relatedQuestions: ['Q15'],
    },
  ],
};

// Utilities
const getScoreLevel = (score) => {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
};

const scoreColors = {
  high: ds.colors.positive,
  medium: ds.colors.text,
  low: ds.colors.negative,
};

// Styles
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: ${ds.font.sans};
      background: ${ds.colors.bg};
      color: ${ds.colors.text};
      -webkit-font-smoothing: antialiased;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .fade-in { animation: fadeIn 0.25s ease-out forwards; }
    .slide-in { animation: slideIn 0.2s ease-out forwards; }

    .interactive {
      transition: background-color 0.15s ease;
    }
    .interactive:hover {
      background-color: ${ds.colors.surfaceSubtle};
    }
  `}</style>
);

// Main Component
export default function InterviewDetail() {
  const [activeTab, setActiveTab] = useState('metrics');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedDimension, setSelectedDimension] = useState(null);

  return (
    <div style={styles.container}>
      <GlobalStyles />

      {/* Header */}
      <header style={styles.header}>
        <button style={styles.backLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Breakdown</span>
        </button>

        <div style={styles.titleSection}>
          <div style={styles.titleRow}>
            <div>
              <h1 style={styles.title}>{data.name}</h1>
              <p style={styles.subtitle}>{data.role}</p>
            </div>
            <div style={styles.scoreDisplay}>
              <span style={styles.scoreValue}>{data.score}</span>
              <span style={styles.scoreLabel}>Overall Score</span>
            </div>
          </div>

          <div style={styles.meta}>
            <span style={styles.metaItem}>{data.date}</span>
            <span style={styles.metaDivider} />
            <span style={styles.metaItem}>{data.summary.questions} questions</span>
            <span style={styles.metaDivider} />
            <span style={styles.metaItem}>{data.summary.metrics} metrics</span>
            <span style={styles.metaDivider} />
            <span style={{
              ...styles.metaItem,
              color: data.summary.flags > 0 ? ds.colors.caution : ds.colors.positive
            }}>
              {data.summary.flags} {data.summary.flags === 1 ? 'flag' : 'flags'}
            </span>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <SummaryCard label="Questions Scored" value={data.summary.questions} />
        <SummaryCard label="Metrics Calculated" value={data.summary.metrics} />
        <SummaryCard
          label="Flags for Review"
          value={data.summary.flags}
          highlight={data.summary.flags > 0}
        />
        <SummaryCard
          label="Average Score"
          value={data.score}
          level={getScoreLevel(data.score)}
        />
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          {[
            { id: 'metrics', label: 'Metrics', count: data.metrics.length },
            { id: 'questions', label: 'Questions', count: data.questions.length },
            { id: 'flags', label: 'Flags', count: data.flags.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setExpandedId(null); }}
              style={{
                ...styles.navItem,
                ...(activeTab === tab.id ? styles.navItemActive : {}),
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                ...styles.navCount,
                ...(activeTab === tab.id ? styles.navCountActive : {}),
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
          <MetricsList
            metrics={data.metrics}
            expandedId={expandedId}
            onToggle={setExpandedId}
          />
        )}

        {activeTab === 'questions' && (
          <QuestionsList
            questions={data.questions}
            expandedId={expandedId}
            onToggle={setExpandedId}
            onDimensionSelect={setSelectedDimension}
          />
        )}

        {activeTab === 'flags' && (
          <FlagsList flags={data.flags} />
        )}
      </main>

      {/* Dimension Panel */}
      {selectedDimension && (
        <DimensionPanel
          dimension={selectedDimension}
          onClose={() => setSelectedDimension(null)}
        />
      )}
    </div>
  );
}

// Summary Card
function SummaryCard({ label, value, level, highlight }) {
  return (
    <div style={styles.summaryCard}>
      <span style={{
        ...styles.summaryValue,
        color: level ? scoreColors[level] : highlight ? ds.colors.caution : ds.colors.text,
      }}>
        {value}
      </span>
      <span style={styles.summaryLabel}>{label}</span>
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
          delay={i * 30}
        />
      ))}
    </div>
  );
}

function MetricCard({ metric, isExpanded, onToggle, delay }) {
  const level = getScoreLevel(metric.score);

  return (
    <div
      style={{ ...styles.card, animationDelay: `${delay}ms` }}
      className="fade-in"
    >
      <button onClick={onToggle} style={styles.cardHeader} className="interactive">
        <div style={styles.cardHeaderLeft}>
          <span style={styles.metricCode}>{metric.code}</span>
          <div style={styles.metricInfo}>
            <span style={styles.metricName}>{metric.name}</span>
            <span style={styles.metricDescriptor}>{metric.descriptor}</span>
          </div>
        </div>

        <div style={styles.cardHeaderRight}>
          <div style={styles.scoreBarContainer}>
            <div style={styles.scoreBarTrack}>
              <div
                style={{
                  ...styles.scoreBarFill,
                  width: `${metric.score}%`,
                  backgroundColor: scoreColors[level],
                }}
              />
            </div>
          </div>
          <span style={{ ...styles.metricScore, color: scoreColors[level] }}>
            {metric.score}
          </span>
          <span style={styles.confidence}>{metric.confidence}</span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={ds.colors.textSubtle} strokeWidth="2"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div style={styles.cardContent} className="fade-in">
          <p style={styles.interpretation}>{metric.interpretation}</p>

          <div style={styles.breakdownSection}>
            <h4 style={styles.sectionLabel}>Question Contributions</h4>
            <div style={styles.breakdownTable}>
              <div style={styles.breakdownHeader}>
                <span>Question</span>
                <span>Score</span>
                <span>Weight</span>
                <span>Contribution</span>
              </div>
              {metric.breakdown.map((item, i) => (
                <div key={i} style={styles.breakdownRow}>
                  <span style={styles.breakdownQuestion}>{item.question}</span>
                  <span style={{ color: scoreColors[getScoreLevel(item.score)] }}>
                    {item.score}
                  </span>
                  <span>{item.weight}%</span>
                  <span>{((item.score * item.weight) / 100).toFixed(1)}</span>
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
          delay={i * 30}
        />
      ))}
    </div>
  );
}

function QuestionCard({ question, isExpanded, onToggle, onDimensionSelect, delay }) {
  const level = getScoreLevel(question.score);

  return (
    <div
      style={{ ...styles.card, animationDelay: `${delay}ms` }}
      className="fade-in"
    >
      <button onClick={onToggle} style={styles.cardHeader} className="interactive">
        <div style={styles.cardHeaderLeft}>
          <span style={styles.questionNumber}>{question.number}</span>
          <span style={styles.questionCode}>{question.code}</span>
          {question.requiresReview && (
            <span style={styles.reviewIndicator}>Review Required</span>
          )}
        </div>

        <div style={styles.cardHeaderRight}>
          <span style={styles.confidence}>{question.confidence}</span>
          <span style={{ ...styles.questionScore, color: scoreColors[level] }}>
            {question.score}
          </span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={ds.colors.textSubtle} strokeWidth="2"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div style={styles.cardContent} className="fade-in">
          <div style={styles.questionSection}>
            <span style={styles.sectionLabel}>Question</span>
            <p style={styles.questionText}>{question.text}</p>
          </div>

          <div style={styles.responseSection}>
            <span style={styles.sectionLabel}>Response</span>
            <p style={styles.responseText}>{question.response}</p>
          </div>

          <div style={styles.qualityRow}>
            <div style={styles.qualityItem}>
              <span style={styles.qualityLabel}>Quality</span>
              <span style={styles.qualityValue}>{question.quality}</span>
            </div>
            <div style={styles.qualityItem}>
              <span style={styles.qualityLabel}>Confidence</span>
              <span style={styles.qualityValue}>{question.confidence}</span>
            </div>
          </div>

          <div style={styles.dimensionsSection}>
            <span style={styles.sectionLabel}>Dimension Scores</span>
            <div style={styles.dimensionsList}>
              {question.dimensions.map((dim, i) => (
                <button
                  key={i}
                  style={styles.dimensionRow}
                  onClick={() => onDimensionSelect(dim)}
                  className="interactive"
                >
                  <span style={styles.dimensionName}>{dim.name}</span>
                  <div style={styles.dimensionScoreGroup}>
                    <div style={styles.scoreDots}>
                      {[1,2,3,4,5].map(n => (
                        <div
                          key={n}
                          style={{
                            ...styles.scoreDot,
                            backgroundColor: n <= dim.score
                              ? scoreColors[getScoreLevel(dim.score * 20)]
                              : ds.colors.border,
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
      <div style={styles.emptyState}>
        <p style={styles.emptyTitle}>No flags to review</p>
        <p style={styles.emptyText}>All responses passed quality validation</p>
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
        <FlagCard key={flag.id} flag={flag} delay={i * 50} />
      ))}
    </div>
  );
}

function FlagCard({ flag, delay }) {
  const severityStyles = {
    warning: { color: ds.colors.caution, bg: ds.colors.cautionMuted },
    info: { color: ds.colors.textMuted, bg: ds.colors.surfaceSubtle },
    critical: { color: ds.colors.negative, bg: ds.colors.negativeMuted },
  };

  const sev = severityStyles[flag.severity];

  return (
    <div
      style={{ ...styles.flagCard, animationDelay: `${delay}ms` }}
      className="fade-in"
    >
      <div style={styles.flagHeader}>
        <span style={{ ...styles.flagSeverity, color: sev.color, backgroundColor: sev.bg }}>
          {flag.severity}
        </span>
        <span style={styles.flagType}>{flag.type}</span>
      </div>

      <h3 style={styles.flagTitle}>{flag.title}</h3>
      <p style={styles.flagDescription}>{flag.description}</p>

      <div style={styles.analysisSection}>
        <span style={styles.analysisLabel}>Analysis</span>
        <p style={styles.analysisText}>{flag.analysis}</p>
      </div>

      <div style={styles.relatedSection}>
        <span style={styles.relatedLabel}>Related Questions</span>
        <span style={styles.relatedQuestions}>{flag.relatedQuestions.join(', ')}</span>
      </div>

      <button style={styles.resolveButton}>Mark as Resolved</button>
    </div>
  );
}

// Dimension Panel
function DimensionPanel({ dimension, onClose }) {
  const level = getScoreLevel(dimension.score * 20);

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
            <div style={styles.panelScoreRow}>
              <span style={{ ...styles.panelScoreValue, color: scoreColors[level] }}>
                {dimension.score}/5
              </span>
              <div style={styles.panelScoreDots}>
                {[1,2,3,4,5].map(n => (
                  <div
                    key={n}
                    style={{
                      ...styles.panelScoreDot,
                      backgroundColor: n <= dimension.score
                        ? scoreColors[level]
                        : ds.colors.border,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={styles.panelSection}>
            <span style={styles.panelLabel}>Reasoning</span>
            <p style={styles.panelReasoning}>{dimension.reasoning}</p>
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
                    backgroundColor: scale.level === dimension.score ? ds.colors.surfaceSubtle : 'transparent',
                    borderColor: scale.level === dimension.score ? ds.colors.text : ds.colors.border,
                  }}
                >
                  <div style={styles.scaleHeader}>
                    <span style={styles.scaleLevel}>{scale.level}</span>
                    <span style={styles.scaleName}>{scale.name}</span>
                    {scale.level === dimension.score && (
                      <span style={styles.currentIndicator}>Current</span>
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
    maxWidth: 1120,
    margin: '0 auto',
    padding: `${ds.space[8]}px ${ds.space[6]}px`,
  },

  // Header
  header: {
    marginBottom: ds.space[8],
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: ds.space[2],
    padding: `${ds.space[2]}px 0`,
    background: 'none',
    border: 'none',
    color: ds.colors.textMuted,
    fontSize: ds.text.sm.size,
    cursor: 'pointer',
    marginBottom: ds.space[6],
  },
  titleSection: {
    borderBottom: `1px solid ${ds.colors.border}`,
    paddingBottom: ds.space[6],
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ds.space[4],
  },
  title: {
    fontSize: ds.text.xl.size,
    fontWeight: 600,
    letterSpacing: ds.text.xl.spacing,
    color: ds.colors.text,
    marginBottom: ds.space[1],
  },
  subtitle: {
    fontSize: ds.text.base.size,
    color: ds.colors.textMuted,
  },
  scoreDisplay: {
    textAlign: 'right',
  },
  scoreValue: {
    display: 'block',
    fontSize: 36,
    fontWeight: 600,
    color: ds.colors.text,
    letterSpacing: -1,
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: ds.text.xs.size,
    color: ds.colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[3],
  },
  metaItem: {
    fontSize: ds.text.sm.size,
    color: ds.colors.textMuted,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: '50%',
    backgroundColor: ds.colors.border,
  },

  // Summary Grid
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: ds.space[4],
    marginBottom: ds.space[8],
  },
  summaryCard: {
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.lg,
    padding: ds.space[5],
    textAlign: 'center',
    border: `1px solid ${ds.colors.border}`,
  },
  summaryValue: {
    display: 'block',
    fontSize: 28,
    fontWeight: 600,
    letterSpacing: -0.5,
    marginBottom: ds.space[1],
  },
  summaryLabel: {
    fontSize: ds.text.xs.size,
    color: ds.colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Navigation
  nav: {
    marginBottom: ds.space[6],
    borderBottom: `1px solid ${ds.colors.border}`,
  },
  navInner: {
    display: 'flex',
    gap: ds.space[1],
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[2],
    padding: `${ds.space[3]}px ${ds.space[4]}px`,
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: -1,
    fontSize: ds.text.sm.size,
    fontWeight: 500,
    color: ds.colors.textMuted,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  navItemActive: {
    color: ds.colors.text,
    borderBottomColor: ds.colors.text,
  },
  navCount: {
    padding: `2px ${ds.space[2]}px`,
    borderRadius: ds.radius.sm,
    fontSize: ds.text.xs.size,
    fontWeight: 500,
    backgroundColor: ds.colors.surfaceSubtle,
    color: ds.colors.textSubtle,
  },
  navCountActive: {
    backgroundColor: ds.colors.text,
    color: ds.colors.surface,
  },

  // Main
  main: {
    minHeight: 400,
  },

  // List
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: ds.space[3],
  },

  // Card
  card: {
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.lg,
    border: `1px solid ${ds.colors.border}`,
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: `${ds.space[4]}px ${ds.space[5]}px`,
    background: 'none',
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
    gap: ds.space[4],
  },
  cardContent: {
    padding: `${ds.space[5]}px`,
    borderTop: `1px solid ${ds.colors.borderSubtle}`,
    backgroundColor: ds.colors.surfaceSubtle,
  },

  // Metric Card
  metricCode: {
    padding: `${ds.space[1]}px ${ds.space[2]}px`,
    backgroundColor: ds.colors.surfaceSubtle,
    borderRadius: ds.radius.sm,
    fontSize: ds.text.xs.size,
    fontWeight: 600,
    color: ds.colors.textMuted,
    fontFamily: ds.font.mono,
  },
  metricInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  metricName: {
    fontSize: ds.text.base.size,
    fontWeight: 500,
    color: ds.colors.text,
  },
  metricDescriptor: {
    fontSize: ds.text.xs.size,
    color: ds.colors.textSubtle,
  },
  scoreBarContainer: {
    width: 120,
  },
  scoreBarTrack: {
    height: 4,
    backgroundColor: ds.colors.borderSubtle,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  metricScore: {
    fontSize: ds.text.md.size,
    fontWeight: 600,
    minWidth: 28,
    textAlign: 'right',
    fontFamily: ds.font.mono,
  },
  confidence: {
    fontSize: ds.text.xs.size,
    color: ds.colors.textSubtle,
    minWidth: 50,
  },
  interpretation: {
    fontSize: ds.text.base.size,
    color: ds.colors.textMuted,
    lineHeight: 1.6,
    marginBottom: ds.space[5],
  },

  // Breakdown
  breakdownSection: {},
  sectionLabel: {
    display: 'block',
    fontSize: ds.text.xs.size,
    fontWeight: 600,
    color: ds.colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ds.space[3],
  },
  breakdownTable: {
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.md,
    border: `1px solid ${ds.colors.border}`,
    overflow: 'hidden',
  },
  breakdownHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    padding: `${ds.space[2]}px ${ds.space[4]}px`,
    backgroundColor: ds.colors.surfaceSubtle,
    fontSize: ds.text.xs.size,
    fontWeight: 500,
    color: ds.colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  breakdownRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    padding: `${ds.space[3]}px ${ds.space[4]}px`,
    borderTop: `1px solid ${ds.colors.borderSubtle}`,
    fontSize: ds.text.sm.size,
    color: ds.colors.text,
  },
  breakdownQuestion: {
    fontWeight: 500,
    fontFamily: ds.font.mono,
  },

  // Question Card
  questionNumber: {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.surfaceSubtle,
    borderRadius: ds.radius.sm,
    fontSize: ds.text.xs.size,
    fontWeight: 600,
    color: ds.colors.textMuted,
  },
  questionCode: {
    fontSize: ds.text.sm.size,
    fontWeight: 500,
    color: ds.colors.text,
    fontFamily: ds.font.mono,
  },
  reviewIndicator: {
    padding: `2px ${ds.space[2]}px`,
    backgroundColor: ds.colors.cautionMuted,
    borderRadius: ds.radius.sm,
    fontSize: ds.text.xs.size,
    fontWeight: 500,
    color: ds.colors.caution,
  },
  questionScore: {
    fontSize: ds.text.md.size,
    fontWeight: 600,
    fontFamily: ds.font.mono,
  },
  questionSection: {
    marginBottom: ds.space[5],
  },
  questionText: {
    fontSize: ds.text.base.size,
    color: ds.colors.text,
    lineHeight: 1.6,
    margin: 0,
  },
  responseSection: {
    padding: ds.space[4],
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.md,
    borderLeft: `2px solid ${ds.colors.positive}`,
    marginBottom: ds.space[5],
  },
  responseText: {
    fontSize: ds.text.sm.size,
    color: ds.colors.textMuted,
    lineHeight: 1.7,
    margin: 0,
  },
  qualityRow: {
    display: 'flex',
    gap: ds.space[6],
    marginBottom: ds.space[5],
  },
  qualityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[2],
  },
  qualityLabel: {
    fontSize: ds.text.xs.size,
    color: ds.colors.textSubtle,
  },
  qualityValue: {
    fontSize: ds.text.sm.size,
    color: ds.colors.text,
    fontWeight: 500,
  },

  // Dimensions
  dimensionsSection: {},
  dimensionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: ds.space[2],
  },
  dimensionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: ds.space[3],
    backgroundColor: ds.colors.surface,
    border: `1px solid ${ds.colors.border}`,
    borderRadius: ds.radius.md,
    cursor: 'pointer',
    textAlign: 'left',
  },
  dimensionName: {
    fontSize: ds.text.sm.size,
    fontWeight: 500,
    color: ds.colors.text,
  },
  dimensionScoreGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[3],
  },
  scoreDots: {
    display: 'flex',
    gap: ds.space[1],
  },
  scoreDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
  },
  dimensionScoreText: {
    fontSize: ds.text.xs.size,
    color: ds.colors.textMuted,
    fontFamily: ds.font.mono,
  },

  // Flags
  flagsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ds.space[4],
  },
  flagsTitle: {
    fontSize: ds.text.sm.size,
    fontWeight: 500,
    color: ds.colors.text,
  },
  flagsCount: {
    fontSize: ds.text.xs.size,
    color: ds.colors.textSubtle,
  },
  flagCard: {
    backgroundColor: ds.colors.surface,
    borderRadius: ds.radius.lg,
    border: `1px solid ${ds.colors.border}`,
    padding: ds.space[5],
  },
  flagHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[2],
    marginBottom: ds.space[3],
  },
  flagSeverity: {
    padding: `2px ${ds.space[2]}px`,
    borderRadius: ds.radius.sm,
    fontSize: ds.text.xs.size,
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  flagType: {
    fontSize: ds.text.xs.size,
    color: ds.colors.textSubtle,
  },
  flagTitle: {
    fontSize: ds.text.base.size,
    fontWeight: 500,
    color: ds.colors.text,
    marginBottom: ds.space[2],
  },
  flagDescription: {
    fontSize: ds.text.sm.size,
    color: ds.colors.textMuted,
    lineHeight: 1.6,
    marginBottom: ds.space[4],
  },
  analysisSection: {
    padding: ds.space[4],
    backgroundColor: ds.colors.surfaceSubtle,
    borderRadius: ds.radius.md,
    marginBottom: ds.space[4],
  },
  analysisLabel: {
    display: 'block',
    fontSize: ds.text.xs.size,
    fontWeight: 500,
    color: ds.colors.textSubtle,
    marginBottom: ds.space[2],
  },
  analysisText: {
    fontSize: ds.text.sm.size,
    color: ds.colors.textMuted,
    lineHeight: 1.6,
    margin: 0,
  },
  relatedSection: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[2],
    marginBottom: ds.space[4],
  },
  relatedLabel: {
    fontSize: ds.text.xs.size,
    color: ds.colors.textSubtle,
  },
  relatedQuestions: {
    fontSize: ds.text.sm.size,
    fontWeight: 500,
    fontFamily: ds.font.mono,
  },
  resolveButton: {
    padding: `${ds.space[2]}px ${ds.space[4]}px`,
    backgroundColor: 'transparent',
    border: `1px solid ${ds.colors.border}`,
    borderRadius: ds.radius.md,
    fontSize: ds.text.sm.size,
    fontWeight: 500,
    color: ds.colors.text,
    cursor: 'pointer',
  },

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: ds.space[10],
  },
  emptyTitle: {
    fontSize: ds.text.base.size,
    fontWeight: 500,
    color: ds.colors.text,
    marginBottom: ds.space[1],
  },
  emptyText: {
    fontSize: ds.text.sm.size,
    color: ds.colors.textSubtle,
  },

  // Panel
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 100,
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 400,
    maxWidth: '90vw',
    height: '100vh',
    backgroundColor: ds.colors.surface,
    boxShadow: ds.shadow.medium,
    zIndex: 101,
    display: 'flex',
    flexDirection: 'column',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ds.space[5],
    borderBottom: `1px solid ${ds.colors.border}`,
  },
  panelTitle: {
    fontSize: ds.text.lg.size,
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
    border: 'none',
    borderRadius: ds.radius.sm,
    color: ds.colors.textMuted,
    cursor: 'pointer',
  },
  panelContent: {
    flex: 1,
    overflow: 'auto',
    padding: ds.space[5],
  },
  panelSection: {
    marginBottom: ds.space[6],
  },
  panelLabel: {
    display: 'block',
    fontSize: ds.text.xs.size,
    fontWeight: 500,
    color: ds.colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ds.space[2],
  },
  panelScoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[4],
  },
  panelScoreValue: {
    fontSize: 24,
    fontWeight: 600,
  },
  panelScoreDots: {
    display: 'flex',
    gap: ds.space[1],
  },
  panelScoreDot: {
    width: 24,
    height: 6,
    borderRadius: 3,
  },
  panelReasoning: {
    fontSize: ds.text.sm.size,
    color: ds.colors.textMuted,
    lineHeight: 1.6,
    margin: 0,
    padding: ds.space[4],
    backgroundColor: ds.colors.surfaceSubtle,
    borderRadius: ds.radius.md,
  },
  scaleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: ds.space[2],
  },
  scaleItem: {
    padding: ds.space[3],
    borderRadius: ds.radius.md,
    border: '1px solid',
  },
  scaleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: ds.space[2],
    marginBottom: ds.space[1],
  },
  scaleLevel: {
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.colors.surfaceSubtle,
    borderRadius: ds.radius.sm,
    fontSize: ds.text.xs.size,
    fontWeight: 600,
    color: ds.colors.textMuted,
  },
  scaleName: {
    fontSize: ds.text.sm.size,
    fontWeight: 500,
    color: ds.colors.text,
  },
  currentIndicator: {
    marginLeft: 'auto',
    fontSize: ds.text.xs.size,
    fontWeight: 500,
    color: ds.colors.textSubtle,
  },
  scaleDesc: {
    fontSize: ds.text.xs.size,
    color: ds.colors.textSubtle,
    marginLeft: 28,
  },
};
