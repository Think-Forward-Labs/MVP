import React, { useState } from 'react';

/**
 * Premium Interview Detail UI Prototype
 * Design Principles Applied:
 * - Apple HIG: Typography hierarchy, spacing rhythm, restraint
 * - Material Design 3: Elevation system, surface tinting, state layers
 * - Linear.app: Minimal chrome, focused content, subtle animations
 * - 8px grid system for all spacing
 * - Inter font family for professional appearance
 */

// Mock data to demonstrate the UI
const mockData = {
  interviewName: "Sarah Chen - Product Lead Interview",
  avgScore: 76,
  questionCount: 24,
  metricCount: 14,
  flagCount: 3,
  metrics: [
    { id: '1', code: 'M1', name: 'Operational Strength (Technical Fitness)', score: 82, confidence: 'high', interpretation: 'Strong technical foundation with consistent execution patterns. The candidate demonstrates robust operational capabilities across multiple domains.' },
    { id: '2', code: 'M2', name: 'Future Readiness (Evolutionary Fitness)', score: 71, confidence: 'medium', interpretation: 'Moderate adaptability with room for improvement in emerging technology adoption.' },
    { id: '3', code: 'M9', name: 'Run/Transform Balance (Ambidexterity)', score: 68, confidence: 'high', interpretation: 'Good balance between maintaining current operations and driving innovation initiatives.' },
    { id: '4', code: 'M5', name: 'Market Radar (Sensing)', score: 85, confidence: 'high', interpretation: 'Excellent market awareness and competitive intelligence capabilities.' },
    { id: '5', code: 'M3', name: 'Insight-to-Action (Learning Effectiveness)', score: 74, confidence: 'medium', interpretation: 'Solid ability to translate insights into actionable strategies.' },
  ],
  questions: [
    { id: '1', code: 'Q1', number: 1, text: 'Describe your approach to managing cross-functional teams during a product launch.', response: 'I typically establish clear communication channels early on, set up regular sync meetings, and ensure each team understands their role in the larger picture. I use tools like Slack for daily updates and Notion for documentation.', score: 78, confidence: 'high', quality: 'comprehensive' },
    { id: '2', code: 'Q2', number: 2, text: 'How do you prioritize competing initiatives when resources are limited?', response: 'I use a combination of impact analysis and urgency assessment. I create a matrix that weighs business value against effort required, then validate priorities with stakeholders.', score: 85, confidence: 'high', quality: 'detailed' },
    { id: '3', code: 'Q3', number: 3, text: 'Tell me about a time you had to pivot a product strategy based on market feedback.', response: 'During my time at TechCorp, we received strong negative feedback on our initial approach. I led a rapid discovery phase and we pivoted within 3 weeks.', score: 62, confidence: 'medium', quality: 'adequate', needsReview: true },
  ],
  flags: [
    { id: '1', severity: 'warning', type: 'inconsistency', title: 'Response inconsistency detected', description: 'Answers to Q3 and Q12 show conflicting timelines regarding the product pivot duration.', aiExplanation: 'Q3 mentions a 3-week pivot while Q12 references a 6-month transformation for the same project.' },
    { id: '2', severity: 'info', type: 'missing_data', title: 'Incomplete response', description: 'Question Q15 received a partial response that may affect scoring accuracy.', aiExplanation: 'The response addressed only 2 of the 4 expected components for a complete answer.' },
  ],
  dimensions: [
    { name: 'Strategic Thinking', score: 4, reasoning: 'Demonstrates clear ability to connect tactical decisions to long-term strategy.' },
    { name: 'Communication', score: 5, reasoning: 'Exceptionally clear and structured responses throughout the interview.' },
    { name: 'Technical Depth', score: 3, reasoning: 'Adequate technical understanding but lacks specificity in implementation details.' },
  ]
};

// Design tokens
const tokens = {
  colors: {
    // Neutrals
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceHover: '#F5F5F7',
    surfaceActive: '#F0F0F2',
    border: '#E5E5E7',
    borderSubtle: '#F0F0F2',

    // Text
    textPrimary: '#1D1D1F',
    textSecondary: '#6E6E73',
    textTertiary: '#98989D',

    // Accent
    accent: '#0071E3',
    accentLight: 'rgba(0, 113, 227, 0.08)',
    accentMedium: 'rgba(0, 113, 227, 0.12)',

    // Semantic
    success: '#34C759',
    successLight: 'rgba(52, 199, 89, 0.1)',
    warning: '#FF9500',
    warningLight: 'rgba(255, 149, 0, 0.1)',
    error: '#FF3B30',
    errorLight: 'rgba(255, 59, 48, 0.1)',
    info: '#5856D6',
    infoLight: 'rgba(88, 86, 214, 0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
    md: '0 2px 8px rgba(0, 0, 0, 0.06)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.08)',
    xl: '0 16px 48px rgba(0, 0, 0, 0.12)',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", sans-serif',
    sizes: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 22,
      xxl: 28,
      display: 34,
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

// Score color helper
const getScoreColor = (score) => {
  if (score >= 80) return { main: '#34C759', bg: 'rgba(52, 199, 89, 0.1)' };
  if (score >= 60) return { main: '#0071E3', bg: 'rgba(0, 113, 227, 0.1)' };
  if (score >= 40) return { main: '#FF9500', bg: 'rgba(255, 149, 0, 0.1)' };
  return { main: '#FF3B30', bg: 'rgba(255, 59, 48, 0.1)' };
};

// Animation keyframes as CSS
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  .hover-lift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
  .tab-indicator {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

// Main Component
export default function PremiumInterviewDetail() {
  const [activeTab, setActiveTab] = useState('metrics');
  const [expandedMetric, setExpandedMetric] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [selectedDimension, setSelectedDimension] = useState(null);

  const data = mockData;
  const scoreColor = getScoreColor(data.avgScore);

  return (
    <div style={styles.container}>
      <style>{animationStyles}</style>

      {/* Premium Header */}
      <header style={styles.header}>
        <button style={styles.backButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Breakdown</span>
        </button>

        <div style={styles.headerContent}>
          <div style={styles.headerMain}>
            <h1 style={styles.title}>{data.interviewName}</h1>
            <div style={{ ...styles.scorePill, backgroundColor: scoreColor.bg }}>
              <span style={{ ...styles.scorePillValue, color: scoreColor.main }}>{data.avgScore}</span>
              <span style={styles.scorePillLabel}>avg score</span>
            </div>
          </div>
          <div style={styles.headerMeta}>
            <span style={styles.metaItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {data.questionCount} questions
            </span>
            <span style={styles.metaDivider}>•</span>
            <span style={styles.metaItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {data.metricCount} metrics
            </span>
            <span style={styles.metaDivider}>•</span>
            <span style={{ ...styles.metaItem, color: data.flagCount > 0 ? tokens.colors.warning : tokens.colors.success }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              {data.flagCount} flags
            </span>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Questions', value: data.questionCount, icon: '📝' },
          { label: 'Metrics', value: data.metricCount, icon: '📊' },
          { label: 'Flags', value: data.flagCount, color: data.flagCount > 0 ? tokens.colors.error : tokens.colors.success, icon: '🚩' },
          { label: 'Avg Score', value: data.avgScore, color: scoreColor.main, icon: '⭐' },
        ].map((stat, i) => (
          <div key={i} style={styles.statCard} className="hover-lift">
            <span style={styles.statIcon}>{stat.icon}</span>
            <span style={{ ...styles.statValue, color: stat.color || tokens.colors.textPrimary }}>
              {stat.value}
            </span>
            <span style={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Premium Tabs */}
      <div style={styles.tabContainer}>
        <div style={styles.tabList}>
          {[
            { id: 'metrics', label: 'Metrics', count: data.metrics.length },
            { id: 'questions', label: 'Questions', count: data.questions.length },
            { id: 'flags', label: 'Flags', count: data.flags.length, alert: data.flags.length > 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {}),
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                ...styles.tabBadge,
                ...(activeTab === tab.id ? styles.tabBadgeActive : {}),
                ...(tab.alert && activeTab !== tab.id ? styles.tabBadgeAlert : {}),
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div style={styles.tabIndicator} className="tab-indicator" />
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === 'metrics' && (
          <MetricsTab
            metrics={data.metrics}
            expandedMetric={expandedMetric}
            setExpandedMetric={setExpandedMetric}
            dimensions={data.dimensions}
            selectedDimension={selectedDimension}
            setSelectedDimension={setSelectedDimension}
          />
        )}
        {activeTab === 'questions' && (
          <QuestionsTab
            questions={data.questions}
            expandedQuestion={expandedQuestion}
            setExpandedQuestion={setExpandedQuestion}
          />
        )}
        {activeTab === 'flags' && (
          <FlagsTab flags={data.flags} />
        )}
      </div>

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

// Metrics Tab Component
function MetricsTab({ metrics, expandedMetric, setExpandedMetric, dimensions, selectedDimension, setSelectedDimension }) {
  return (
    <div style={styles.metricsContainer}>
      {metrics.map((metric, index) => {
        const isExpanded = expandedMetric === metric.id;
        const scoreColor = getScoreColor(metric.score);

        return (
          <div
            key={metric.id}
            style={{
              ...styles.metricCard,
              animation: `fadeIn 0.3s ease ${index * 0.05}s both`,
            }}
            className="hover-lift"
          >
            <button
              onClick={() => setExpandedMetric(isExpanded ? null : metric.id)}
              style={styles.metricHeader}
            >
              <div style={styles.metricLeft}>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={tokens.colors.textTertiary} strokeWidth="2"
                  style={{
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
                <span style={styles.metricCode}>{metric.code}</span>
                <span style={styles.metricName}>{metric.name}</span>
              </div>

              <div style={styles.metricRight}>
                <div style={styles.metricScoreBar}>
                  <div style={{
                    ...styles.metricScoreBarFill,
                    width: `${metric.score}%`,
                    backgroundColor: scoreColor.main,
                  }} />
                </div>
                <span style={{ ...styles.metricScoreValue, color: scoreColor.main }}>
                  {metric.score}
                </span>
                <span style={styles.metricConfidence}>{metric.confidence}</span>
              </div>
            </button>

            {isExpanded && (
              <div style={styles.metricContent}>
                <p style={styles.metricInterpretation}>{metric.interpretation}</p>

                {/* Sample Question Breakdown */}
                <div style={styles.breakdownSection}>
                  <h4 style={styles.breakdownTitle}>Question Breakdown</h4>
                  <div style={styles.breakdownTable}>
                    <div style={styles.breakdownHeader}>
                      <span>Question</span>
                      <span style={{ textAlign: 'right' }}>Score</span>
                      <span style={{ textAlign: 'right' }}>Weight</span>
                      <span style={{ textAlign: 'right' }}>Contribution</span>
                    </div>
                    {[
                      { code: 'Q1', score: 78, weight: 25, contribution: 19.5 },
                      { code: 'Q4', score: 82, weight: 35, contribution: 28.7 },
                      { code: 'Q7', score: 71, weight: 40, contribution: 28.4 },
                    ].map((q) => (
                      <div key={q.code} style={styles.breakdownRow}>
                        <span style={styles.breakdownCode}>{q.code}</span>
                        <span style={{ ...styles.breakdownValue, color: getScoreColor(q.score).main }}>
                          {q.score}
                        </span>
                        <span style={styles.breakdownValue}>{q.weight}%</span>
                        <span style={styles.breakdownValue}>{q.contribution}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dimension Scores */}
                <div style={styles.dimensionsSection}>
                  <h4 style={styles.breakdownTitle}>Dimension Scores</h4>
                  <div style={styles.dimensionsList}>
                    {dimensions.map((dim, i) => (
                      <button
                        key={i}
                        style={styles.dimensionItem}
                        onClick={() => setSelectedDimension(dim)}
                      >
                        <div style={styles.dimensionInfo}>
                          <span style={styles.dimensionName}>{dim.name}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.colors.accent} strokeWidth="2" style={{ marginLeft: 4, opacity: 0.6 }}>
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4M12 8h.01" />
                          </svg>
                        </div>
                        <div style={styles.dimensionScore}>
                          {[1,2,3,4,5].map((level) => (
                            <div
                              key={level}
                              style={{
                                ...styles.dimensionDot,
                                backgroundColor: level <= dim.score
                                  ? getScoreColor(dim.score * 20).main
                                  : tokens.colors.border,
                              }}
                            />
                          ))}
                          <span style={{ marginLeft: 8, color: getScoreColor(dim.score * 20).main, fontWeight: 600 }}>
                            {dim.score}/5
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Questions Tab Component
function QuestionsTab({ questions, expandedQuestion, setExpandedQuestion }) {
  return (
    <div style={styles.questionsContainer}>
      {questions.map((question, index) => {
        const isExpanded = expandedQuestion === question.id;
        const scoreColor = getScoreColor(question.score);

        return (
          <div
            key={question.id}
            style={{
              ...styles.questionCard,
              animation: `fadeIn 0.3s ease ${index * 0.05}s both`,
            }}
            className="hover-lift"
          >
            <button
              onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
              style={styles.questionHeader}
            >
              <div style={styles.questionLeft}>
                <span style={styles.questionNumber}>#{question.number}</span>
                <span style={styles.questionCode}>{question.code}</span>
                {question.needsReview && (
                  <span style={styles.reviewBadge}>Needs Review</span>
                )}
              </div>
              <div style={styles.questionRight}>
                <span style={styles.questionConfidence}>{question.confidence}</span>
                <span style={{ ...styles.questionScore, color: scoreColor.main }}>
                  {question.score}
                </span>
              </div>
            </button>

            {isExpanded && (
              <div style={styles.questionContent}>
                {/* Question Text */}
                <div style={styles.questionTextBox}>
                  <span style={styles.questionTextLabel}>QUESTION</span>
                  <p style={styles.questionText}>{question.text}</p>
                </div>

                {/* Response */}
                <div style={styles.responseBox}>
                  <span style={styles.responseLabel}>PARTICIPANT RESPONSE</span>
                  <p style={styles.responseText}>{question.response}</p>
                </div>

                {/* Meta Info */}
                <div style={styles.questionMeta}>
                  <div style={styles.metaTag}>
                    <span style={styles.metaTagLabel}>Quality</span>
                    <span style={styles.metaTagValue}>{question.quality}</span>
                  </div>
                  <div style={styles.metaTag}>
                    <span style={styles.metaTagLabel}>Confidence</span>
                    <span style={styles.metaTagValue}>{question.confidence}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Flags Tab Component
function FlagsTab({ flags }) {
  const [resolvingId, setResolvingId] = useState(null);

  if (flags.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>✓</div>
        <p style={styles.emptyText}>No flags to review</p>
        <span style={styles.emptySubtext}>All responses passed quality checks</span>
      </div>
    );
  }

  return (
    <div style={styles.flagsContainer}>
      <div style={styles.flagsHeader}>
        <h3 style={styles.flagsTitle}>Open Issues</h3>
        <span style={styles.flagsCount}>{flags.length} items</span>
      </div>

      {flags.map((flag, index) => {
        const severityStyles = {
          critical: { bg: tokens.colors.errorLight, color: tokens.colors.error, icon: '🔴' },
          warning: { bg: tokens.colors.warningLight, color: tokens.colors.warning, icon: '🟡' },
          info: { bg: tokens.colors.infoLight, color: tokens.colors.info, icon: '🔵' },
        }[flag.severity] || { bg: tokens.colors.border, color: tokens.colors.textSecondary, icon: '⚪' };

        return (
          <div
            key={flag.id}
            style={{
              ...styles.flagCard,
              animation: `fadeIn 0.3s ease ${index * 0.1}s both`,
            }}
          >
            <div style={styles.flagHeader}>
              <span style={{ ...styles.severityBadge, backgroundColor: severityStyles.bg, color: severityStyles.color }}>
                {severityStyles.icon} {flag.severity}
              </span>
              <span style={styles.flagType}>{flag.type.replace('_', ' ')}</span>
            </div>

            <h4 style={styles.flagTitle}>{flag.title}</h4>
            <p style={styles.flagDescription}>{flag.description}</p>

            <div style={styles.aiInsight}>
              <div style={styles.aiInsightHeader}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.colors.accent} strokeWidth="2">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>AI Analysis</span>
              </div>
              <p style={styles.aiInsightText}>{flag.aiExplanation}</p>
            </div>

            {resolvingId === flag.id ? (
              <div style={styles.resolveForm}>
                <textarea
                  placeholder="Add resolution notes..."
                  style={styles.resolveTextarea}
                  rows={3}
                />
                <div style={styles.resolveActions}>
                  <button
                    style={styles.cancelButton}
                    onClick={() => setResolvingId(null)}
                  >
                    Cancel
                  </button>
                  <button style={styles.confirmButton}>
                    Mark as Resolved
                  </button>
                </div>
              </div>
            ) : (
              <button
                style={styles.resolveButton}
                onClick={() => setResolvingId(flag.id)}
              >
                Resolve Issue
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Dimension Panel Component
function DimensionPanel({ dimension, onClose }) {
  return (
    <>
      <div style={styles.panelOverlay} onClick={onClose} />
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>{dimension.name}</h2>
          <button style={styles.panelClose} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={styles.panelContent}>
          <div style={styles.panelSection}>
            <span style={styles.panelLabel}>CURRENT SCORE</span>
            <div style={styles.panelScoreDisplay}>
              <span style={{ ...styles.panelScoreValue, color: getScoreColor(dimension.score * 20).main }}>
                {dimension.score}/5
              </span>
              <div style={styles.panelScoreBar}>
                {[1,2,3,4,5].map((level) => (
                  <div
                    key={level}
                    style={{
                      ...styles.panelScoreSegment,
                      backgroundColor: level <= dimension.score
                        ? getScoreColor(dimension.score * 20).main
                        : tokens.colors.border,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div style={styles.panelSection}>
            <span style={styles.panelLabel}>AI REASONING</span>
            <p style={styles.panelReasoning}>{dimension.reasoning}</p>
          </div>

          <div style={styles.panelSection}>
            <span style={styles.panelLabel}>SCORING SCALE</span>
            <div style={styles.scaleList}>
              {[
                { level: 5, label: 'Exceptional', desc: 'Exceeds all expectations consistently' },
                { level: 4, label: 'Strong', desc: 'Clearly demonstrates competency' },
                { level: 3, label: 'Adequate', desc: 'Meets basic expectations' },
                { level: 2, label: 'Developing', desc: 'Shows some capability with gaps' },
                { level: 1, label: 'Limited', desc: 'Significant improvement needed' },
              ].map((scale) => (
                <div
                  key={scale.level}
                  style={{
                    ...styles.scaleItem,
                    backgroundColor: scale.level === dimension.score ? getScoreColor(dimension.score * 20).bg : 'transparent',
                    borderColor: scale.level === dimension.score ? getScoreColor(dimension.score * 20).main : tokens.colors.border,
                  }}
                >
                  <div style={styles.scaleHeader}>
                    <span style={styles.scaleLevel}>{scale.level}</span>
                    <span style={styles.scaleLabel}>{scale.label}</span>
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
    fontFamily: tokens.typography.fontFamily,
    backgroundColor: tokens.colors.background,
    minHeight: '100vh',
    padding: `${tokens.spacing.xl}px`,
    color: tokens.colors.textPrimary,
    maxWidth: 1200,
    margin: '0 auto',
  },

  // Header
  header: {
    marginBottom: tokens.spacing.xl,
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: tokens.radius.sm,
    color: tokens.colors.accent,
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
    cursor: 'pointer',
    marginBottom: tokens.spacing.lg,
    transition: 'background-color 0.15s ease',
  },
  headerContent: {},
  headerMain: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.lg,
    marginBottom: tokens.spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: tokens.typography.sizes.xxl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.textPrimary,
    margin: 0,
    letterSpacing: '-0.5px',
  },
  scorePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    borderRadius: tokens.radius.xl,
  },
  scorePillValue: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
  },
  scorePillLabel: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
  },
  metaDivider: {
    color: tokens.colors.textTertiary,
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  statCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    textAlign: 'center',
    boxShadow: tokens.shadows.sm,
    border: `1px solid ${tokens.colors.borderSubtle}`,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: tokens.spacing.sm,
    display: 'block',
  },
  statValue: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    display: 'block',
    marginBottom: tokens.spacing.xs,
  },
  statLabel: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
  },

  // Tabs
  tabContainer: {
    marginBottom: tokens.spacing.lg,
    borderBottom: `1px solid ${tokens.colors.border}`,
    position: 'relative',
  },
  tabList: {
    display: 'flex',
    gap: tokens.spacing.xs,
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: `${tokens.radius.sm}px ${tokens.radius.sm}px 0 0`,
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderBottom: '2px solid transparent',
    marginBottom: -1,
  },
  tabActive: {
    color: tokens.colors.accent,
    borderBottomColor: tokens.colors.accent,
    backgroundColor: tokens.colors.accentLight,
  },
  tabBadge: {
    padding: `2px ${tokens.spacing.sm}px`,
    borderRadius: tokens.radius.sm,
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    backgroundColor: tokens.colors.surfaceHover,
    color: tokens.colors.textSecondary,
  },
  tabBadgeActive: {
    backgroundColor: tokens.colors.accentMedium,
    color: tokens.colors.accent,
  },
  tabBadgeAlert: {
    backgroundColor: tokens.colors.warningLight,
    color: tokens.colors.warning,
  },
  tabContent: {
    minHeight: 400,
  },

  // Metrics
  metricsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  metricCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    border: `1px solid ${tokens.colors.border}`,
    overflow: 'hidden',
    boxShadow: tokens.shadows.sm,
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  metricLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.md,
    flex: 1,
  },
  metricCode: {
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    backgroundColor: tokens.colors.accentLight,
    color: tokens.colors.accent,
    borderRadius: tokens.radius.sm,
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.bold,
  },
  metricName: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.textPrimary,
  },
  metricRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  metricScoreBar: {
    width: 100,
    height: 6,
    backgroundColor: tokens.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricScoreBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.4s ease-out',
  },
  metricScoreValue: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    minWidth: 36,
    textAlign: 'right',
  },
  metricConfidence: {
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.textTertiary,
    textTransform: 'capitalize',
    minWidth: 50,
  },
  metricContent: {
    padding: tokens.spacing.lg,
    borderTop: `1px solid ${tokens.colors.borderSubtle}`,
    backgroundColor: tokens.colors.background,
  },
  metricInterpretation: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
    marginBottom: tokens.spacing.lg,
  },

  // Breakdown
  breakdownSection: {
    marginBottom: tokens.spacing.lg,
  },
  breakdownTitle: {
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: 0,
    marginBottom: tokens.spacing.md,
  },
  breakdownTable: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.md,
    border: `1px solid ${tokens.colors.border}`,
    overflow: 'hidden',
  },
  breakdownHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    backgroundColor: tokens.colors.surfaceHover,
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  breakdownRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    borderTop: `1px solid ${tokens.colors.borderSubtle}`,
    transition: 'background-color 0.15s ease',
  },
  breakdownCode: {
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.accent,
  },
  breakdownValue: {
    fontSize: tokens.typography.sizes.sm,
    textAlign: 'right',
  },

  // Dimensions
  dimensionsSection: {
    marginTop: tokens.spacing.lg,
  },
  dimensionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
  },
  dimensionItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacing.md}px`,
    backgroundColor: tokens.colors.surface,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.md,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  dimensionInfo: {
    display: 'flex',
    alignItems: 'center',
  },
  dimensionName: {
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.textPrimary,
  },
  dimensionScore: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  dimensionDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    transition: 'background-color 0.2s ease',
  },

  // Questions
  questionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  questionCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    border: `1px solid ${tokens.colors.border}`,
    overflow: 'hidden',
    boxShadow: tokens.shadows.sm,
  },
  questionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  questionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  questionNumber: {
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    backgroundColor: tokens.colors.accentLight,
    color: tokens.colors.accent,
    borderRadius: tokens.radius.sm,
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.bold,
  },
  questionCode: {
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textPrimary,
  },
  reviewBadge: {
    padding: `2px ${tokens.spacing.sm}px`,
    backgroundColor: tokens.colors.warningLight,
    color: tokens.colors.warning,
    borderRadius: tokens.radius.sm,
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
  },
  questionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  questionConfidence: {
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.textTertiary,
    textTransform: 'capitalize',
  },
  questionScore: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
  },
  questionContent: {
    padding: tokens.spacing.lg,
    borderTop: `1px solid ${tokens.colors.borderSubtle}`,
    backgroundColor: tokens.colors.background,
  },
  questionTextBox: {
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing.md,
  },
  questionTextLabel: {
    display: 'block',
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textTertiary,
    marginBottom: tokens.spacing.sm,
    letterSpacing: '0.5px',
  },
  questionText: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.textPrimary,
    lineHeight: 1.6,
    margin: 0,
  },
  responseBox: {
    padding: tokens.spacing.md,
    backgroundColor: 'rgba(52, 199, 89, 0.04)',
    borderRadius: tokens.radius.md,
    borderLeft: `3px solid ${tokens.colors.success}`,
    marginBottom: tokens.spacing.md,
  },
  responseLabel: {
    display: 'block',
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.success,
    marginBottom: tokens.spacing.sm,
    letterSpacing: '0.5px',
  },
  responseText: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
    lineHeight: 1.7,
    margin: 0,
  },
  questionMeta: {
    display: 'flex',
    gap: tokens.spacing.sm,
  },
  metaTag: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    backgroundColor: tokens.colors.surfaceHover,
    borderRadius: tokens.radius.sm,
  },
  metaTagLabel: {
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.textTertiary,
  },
  metaTagValue: {
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.textPrimary,
    textTransform: 'capitalize',
  },

  // Flags
  flagsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  flagsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
  },
  flagsTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textPrimary,
    margin: 0,
  },
  flagsCount: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
  },
  flagCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    border: `1px solid ${tokens.colors.border}`,
    padding: tokens.spacing.lg,
    boxShadow: tokens.shadows.sm,
  },
  flagHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  severityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    borderRadius: tokens.radius.sm,
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    textTransform: 'uppercase',
  },
  flagType: {
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.textTertiary,
    textTransform: 'capitalize',
  },
  flagTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textPrimary,
    margin: 0,
    marginBottom: tokens.spacing.sm,
  },
  flagDescription: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
    marginBottom: tokens.spacing.md,
  },
  aiInsight: {
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.accentLight,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing.md,
  },
  aiInsightHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.accent,
    marginBottom: tokens.spacing.sm,
  },
  aiInsightText: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
    lineHeight: 1.6,
    margin: 0,
  },
  resolveButton: {
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    backgroundColor: 'transparent',
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.sm,
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.textPrimary,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  resolveForm: {
    marginTop: tokens.spacing.md,
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radius.md,
  },
  resolveTextarea: {
    width: '100%',
    padding: tokens.spacing.md,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.md,
    fontSize: tokens.typography.sizes.sm,
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: tokens.spacing.md,
    boxSizing: 'border-box',
  },
  resolveActions: {
    display: 'flex',
    gap: tokens.spacing.sm,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    backgroundColor: 'transparent',
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.sm,
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.textSecondary,
    cursor: 'pointer',
  },
  confirmButton: {
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    backgroundColor: tokens.colors.success,
    border: 'none',
    borderRadius: tokens.radius.sm,
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.semibold,
    color: 'white',
    cursor: 'pointer',
  },

  // Empty State
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing.xxl,
    textAlign: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    backgroundColor: tokens.colors.successLight,
    color: tokens.colors.success,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    marginBottom: tokens.spacing.lg,
  },
  emptyText: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.success,
    margin: 0,
    marginBottom: tokens.spacing.xs,
  },
  emptySubtext: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
  },

  // Panel
  panelOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(4px)',
    zIndex: 999,
    animation: 'fadeIn 0.2s ease',
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 420,
    maxWidth: '90vw',
    height: '100vh',
    backgroundColor: tokens.colors.surface,
    boxShadow: tokens.shadows.xl,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing.lg,
    borderBottom: `1px solid ${tokens.colors.border}`,
  },
  panelTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textPrimary,
    margin: 0,
  },
  panelClose: {
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: tokens.radius.sm,
    color: tokens.colors.textSecondary,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  panelContent: {
    flex: 1,
    overflow: 'auto',
    padding: tokens.spacing.lg,
  },
  panelSection: {
    marginBottom: tokens.spacing.xl,
  },
  panelLabel: {
    display: 'block',
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textTertiary,
    letterSpacing: '0.5px',
    marginBottom: tokens.spacing.sm,
  },
  panelScoreDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.lg,
  },
  panelScoreValue: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
  },
  panelScoreBar: {
    display: 'flex',
    gap: tokens.spacing.xs,
  },
  panelScoreSegment: {
    width: 32,
    height: 8,
    borderRadius: 4,
    transition: 'background-color 0.2s ease',
  },
  panelReasoning: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.colors.textSecondary,
    lineHeight: 1.7,
    margin: 0,
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radius.md,
    fontStyle: 'italic',
  },
  scaleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
  },
  scaleItem: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    border: '1px solid',
    transition: 'all 0.15s ease',
  },
  scaleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
  },
  scaleLevel: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: tokens.colors.surfaceHover,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.textPrimary,
  },
  scaleLabel: {
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textPrimary,
  },
  scaleDesc: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
    marginLeft: 32,
  },
};
