import React, { useState, useEffect } from 'react';

/**
 * PREMIUM INTERVIEW DETAIL UI PROTOTYPE
 * =====================================
 * Design System Applied:
 *
 * 1. APPLE HIG PRINCIPLES
 *    - Typography: SF Pro hierarchy with -apple-system fallback
 *    - Spacing: 8px grid system
 *    - Restraint: Minimal decoration, content-first
 *    - Depth: Subtle shadows for hierarchy
 *
 * 2. MATERIAL DESIGN 3
 *    - Elevation system: sm/md/lg/xl shadows
 *    - Surface tinting for states
 *    - State layers for interaction feedback
 *
 * 3. LINEAR.APP AESTHETICS
 *    - Monochromatic with strategic accent
 *    - Smooth 200-300ms transitions
 *    - Calm, confident visual language
 *
 * 4. PREMIUM B2B DASHBOARD PATTERNS
 *    - Data density with visual breathing room
 *    - Clear information hierarchy
 *    - Professional color restraint
 */

// ==================== DESIGN TOKENS ====================
const tokens = {
  colors: {
    // Core Neutrals (Apple-inspired)
    background: '#F5F5F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceHover: '#F5F5F7',
    surfacePressed: '#EBEBED',

    // Borders
    border: '#D2D2D7',
    borderSubtle: '#E8E8ED',
    borderFocus: '#0071E3',

    // Text Hierarchy
    textPrimary: '#1D1D1F',
    textSecondary: '#86868B',
    textTertiary: '#AEAEB2',
    textInverse: '#FFFFFF',

    // Accent (Apple Blue)
    accent: '#0071E3',
    accentHover: '#0077ED',
    accentLight: 'rgba(0, 113, 227, 0.1)',

    // Semantic Colors
    success: '#34C759',
    successLight: 'rgba(52, 199, 89, 0.12)',
    warning: '#FF9500',
    warningLight: 'rgba(255, 149, 0, 0.12)',
    error: '#FF3B30',
    errorLight: 'rgba(255, 59, 48, 0.12)',
    info: '#5856D6',
    infoLight: 'rgba(88, 86, 214, 0.12)',
  },

  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },

  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.02)',
    md: '0 4px 8px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.03)',
    xl: '0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)',
  },

  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", "Segoe UI", sans-serif',
    fontMono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace',

    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 17,
      lg: 20,
      xl: 24,
      '2xl': 28,
      '3xl': 34,
    },

    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
  },

  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// ==================== MOCK DATA ====================
const mockInterviewData = {
  id: 'int_01',
  name: 'Sarah Chen - Senior Product Manager',
  createdAt: '2025-01-28T14:30:00Z',
  avgScore: 76,
  status: 'completed',

  stats: {
    questions: 24,
    metrics: 14,
    flags: 2,
    dimensions: 8,
  },

  metrics: [
    {
      id: 'm1',
      code: 'M1',
      name: 'Operational Strength',
      academicTerm: 'Technical Fitness',
      score: 82,
      confidence: 'high',
      interpretation: 'Demonstrates strong technical foundation with consistent execution patterns across multiple domains. The candidate shows robust operational capabilities with clear evidence of process optimization and quality management.',
      contributions: [
        { code: 'Q1', score: 85, weight: 30, contribution: 25.5 },
        { code: 'Q4', score: 78, weight: 40, contribution: 31.2 },
        { code: 'Q9', score: 81, weight: 30, contribution: 24.3 },
      ],
    },
    {
      id: 'm2',
      code: 'M2',
      name: 'Future Readiness',
      academicTerm: 'Evolutionary Fitness',
      score: 68,
      confidence: 'medium',
      interpretation: 'Shows moderate adaptability with room for improvement in emerging technology adoption and change management practices.',
      contributions: [
        { code: 'Q2', score: 72, weight: 35, contribution: 25.2 },
        { code: 'Q5', score: 65, weight: 35, contribution: 22.75 },
        { code: 'Q11', score: 67, weight: 30, contribution: 20.1 },
      ],
    },
    {
      id: 'm3',
      code: 'M9',
      name: 'Run/Transform Balance',
      academicTerm: 'Ambidexterity',
      score: 74,
      confidence: 'high',
      interpretation: 'Good balance between maintaining current operations and driving innovation initiatives. Demonstrates ability to allocate resources effectively between BAU and transformation.',
      contributions: [
        { code: 'Q3', score: 76, weight: 50, contribution: 38 },
        { code: 'Q7', score: 72, weight: 50, contribution: 36 },
      ],
    },
    {
      id: 'm4',
      code: 'M5',
      name: 'Market Radar',
      academicTerm: 'Sensing',
      score: 85,
      confidence: 'high',
      interpretation: 'Excellent market awareness and competitive intelligence capabilities. Proactively identifies opportunities and threats in the competitive landscape.',
      contributions: [
        { code: 'Q6', score: 88, weight: 60, contribution: 52.8 },
        { code: 'Q12', score: 80, weight: 40, contribution: 32 },
      ],
    },
    {
      id: 'm5',
      code: 'M3',
      name: 'Insight-to-Action',
      academicTerm: 'Learning Effectiveness',
      score: 71,
      confidence: 'medium',
      interpretation: 'Solid ability to translate insights into actionable strategies, though execution speed could be improved.',
      contributions: [
        { code: 'Q8', score: 74, weight: 45, contribution: 33.3 },
        { code: 'Q10', score: 68, weight: 55, contribution: 37.4 },
      ],
    },
  ],

  questions: [
    {
      id: 'q1',
      number: 1,
      code: 'Q1',
      text: 'Describe your approach to managing cross-functional teams during a complex product launch. What systems and processes do you put in place?',
      response: 'I typically establish clear communication channels early in the process. For a recent product launch, I set up a dedicated Slack channel, bi-weekly sync meetings with all stakeholders, and created a shared Notion workspace for documentation. Each team had clear ownership areas with defined handoff points. We used a RACI matrix to ensure accountability.',
      score: 85,
      confidence: 'high',
      quality: 'comprehensive',
      needsReview: false,
      dimensions: [
        { name: 'Communication', score: 5, reasoning: 'Exceptional clarity in describing communication structures' },
        { name: 'Process Design', score: 4, reasoning: 'Strong systematic approach to process management' },
        { name: 'Leadership', score: 4, reasoning: 'Clear evidence of team leadership capabilities' },
      ],
    },
    {
      id: 'q2',
      number: 2,
      code: 'Q2',
      text: 'How do you prioritize competing initiatives when resources are constrained? Walk me through your decision-making framework.',
      response: 'I use a combination of impact analysis and urgency assessment. First, I create a matrix weighing business value against implementation effort. Then I validate priorities with key stakeholders to ensure alignment. For conflicting high-priority items, I look at dependencies and quick wins that might unblock other initiatives.',
      score: 72,
      confidence: 'high',
      quality: 'detailed',
      needsReview: false,
      dimensions: [
        { name: 'Strategic Thinking', score: 4, reasoning: 'Good framework for prioritization decisions' },
        { name: 'Stakeholder Management', score: 4, reasoning: 'Demonstrates strong stakeholder alignment practices' },
        { name: 'Analytical Skills', score: 3, reasoning: 'Framework is solid but could be more data-driven' },
      ],
    },
    {
      id: 'q3',
      number: 3,
      code: 'Q3',
      text: 'Tell me about a time when you had to pivot a product strategy based on market feedback. What was the outcome?',
      response: 'At TechCorp, we launched a B2B feature that received negative feedback. Within 3 weeks, I led a rapid discovery phase including user interviews and competitive analysis. We pivoted to a self-service model which increased adoption by 40%.',
      score: 62,
      confidence: 'medium',
      quality: 'adequate',
      needsReview: true,
      dimensions: [
        { name: 'Adaptability', score: 3, reasoning: 'Shows willingness to change but limited detail on process' },
        { name: 'Customer Focus', score: 4, reasoning: 'Good responsiveness to user feedback' },
        { name: 'Results Orientation', score: 3, reasoning: 'Outcome mentioned but timing seems inconsistent' },
      ],
    },
  ],

  flags: [
    {
      id: 'f1',
      severity: 'warning',
      type: 'inconsistency',
      title: 'Timeline Inconsistency Detected',
      description: 'Answers to Q3 and Q12 contain conflicting information about the product pivot duration.',
      aiExplanation: 'In Q3, the candidate mentions completing a pivot "within 3 weeks." However, in Q12, when discussing the same project, they reference a "6-month transformation journey." This inconsistency may indicate either confusion about the timeline or separate initiatives being conflated.',
      questionIds: ['Q3', 'Q12'],
      isResolved: false,
    },
    {
      id: 'f2',
      severity: 'info',
      type: 'missing_data',
      title: 'Incomplete Response - Q15',
      description: 'The response to Q15 addressed only 2 of the 4 expected components for a complete answer.',
      aiExplanation: 'The question asked about risk management, mitigation strategies, contingency planning, and stakeholder communication. The candidate only addressed risk identification and mitigation, leaving contingency and communication aspects unaddressed.',
      questionIds: ['Q15'],
      isResolved: false,
    },
  ],
};

// ==================== UTILITY FUNCTIONS ====================
const getScoreColor = (score) => {
  if (score >= 80) return { main: tokens.colors.success, bg: tokens.colors.successLight };
  if (score >= 60) return { main: tokens.colors.accent, bg: tokens.colors.accentLight };
  if (score >= 40) return { main: tokens.colors.warning, bg: tokens.colors.warningLight };
  return { main: tokens.colors.error, bg: tokens.colors.errorLight };
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ==================== ANIMATION STYLES ====================
const AnimationStyles = () => (
  <style>{`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(100%); }
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

    .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
    .animate-slideIn { animation: slideInRight 0.25s ease forwards; }
    .animate-scaleIn { animation: scaleIn 0.2s ease forwards; }

    .hover-lift {
      transition: transform 200ms ease, box-shadow 200ms ease;
    }
    .hover-lift:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }

    .hover-highlight {
      transition: background-color 150ms ease;
    }
    .hover-highlight:hover {
      background-color: ${tokens.colors.surfaceHover};
    }

    .press-scale:active {
      transform: scale(0.98);
    }

    /* Premium scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: ${tokens.colors.border};
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: ${tokens.colors.textTertiary};
    }
  `}</style>
);

// ==================== MAIN COMPONENT ====================
export default function PremiumInterviewDetail() {
  const [activeTab, setActiveTab] = useState('metrics');
  const [expandedMetric, setExpandedMetric] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const data = mockInterviewData;
  const scoreColor = getScoreColor(data.avgScore);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.container}>
      <AnimationStyles />

      {/* Header Section */}
      <header style={{
        ...styles.header,
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.4s ease',
      }}>
        {/* Back Button */}
        <button style={styles.backButton} className="hover-highlight press-scale">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Breakdown</span>
        </button>

        {/* Title Row */}
        <div style={styles.headerMain}>
          <div style={styles.headerTitleGroup}>
            <h1 style={styles.title}>{data.name}</h1>
            <div style={{ ...styles.scoreBadge, backgroundColor: scoreColor.bg }}>
              <span style={{ ...styles.scoreBadgeValue, color: scoreColor.main }}>{data.avgScore}</span>
              <span style={styles.scoreBadgeLabel}>avg</span>
            </div>
          </div>

          {/* Status Pill */}
          <div style={styles.statusPill}>
            <span style={styles.statusDot} />
            Completed
          </div>
        </div>

        {/* Meta Info */}
        <div style={styles.headerMeta}>
          <MetaItem icon="calendar" value={formatDate(data.createdAt)} />
          <MetaItem icon="questions" value={`${data.stats.questions} questions`} />
          <MetaItem icon="metrics" value={`${data.stats.metrics} metrics`} />
          <MetaItem
            icon="flag"
            value={`${data.stats.flags} flags`}
            color={data.stats.flags > 0 ? tokens.colors.warning : tokens.colors.success}
          />
        </div>
      </header>

      {/* Stats Cards */}
      <div style={{
        ...styles.statsGrid,
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.4s ease 0.1s',
      }}>
        <StatCard label="Questions" value={data.stats.questions} icon="📝" delay={0} />
        <StatCard label="Metrics" value={data.stats.metrics} icon="📊" delay={1} />
        <StatCard
          label="Flags"
          value={data.stats.flags}
          icon="🚩"
          color={data.stats.flags > 0 ? tokens.colors.error : tokens.colors.success}
          delay={2}
        />
        <StatCard
          label="Avg Score"
          value={data.avgScore}
          icon="⭐"
          color={scoreColor.main}
          delay={3}
        />
      </div>

      {/* Tab Navigation */}
      <div style={{
        ...styles.tabContainer,
        opacity: isLoaded ? 1 : 0,
        transition: 'all 0.4s ease 0.15s',
      }}>
        <div style={styles.tabList} role="tablist">
          <TabButton
            id="metrics"
            label="Metrics"
            count={data.metrics.length}
            isActive={activeTab === 'metrics'}
            onClick={() => setActiveTab('metrics')}
          />
          <TabButton
            id="questions"
            label="Questions"
            count={data.questions.length}
            isActive={activeTab === 'questions'}
            onClick={() => setActiveTab('questions')}
          />
          <TabButton
            id="flags"
            label="Flags"
            count={data.flags.length}
            isActive={activeTab === 'flags'}
            onClick={() => setActiveTab('flags')}
            alert={data.flags.length > 0}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === 'metrics' && (
          <MetricsPanel
            metrics={data.metrics}
            expandedMetric={expandedMetric}
            setExpandedMetric={setExpandedMetric}
            onDimensionClick={setSelectedDimension}
          />
        )}

        {activeTab === 'questions' && (
          <QuestionsPanel
            questions={data.questions}
            expandedQuestion={expandedQuestion}
            setExpandedQuestion={setExpandedQuestion}
            onDimensionClick={setSelectedDimension}
          />
        )}

        {activeTab === 'flags' && (
          <FlagsPanel flags={data.flags} />
        )}
      </div>

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

// ==================== SUB-COMPONENTS ====================

function MetaItem({ icon, value, color }) {
  const icons = {
    calendar: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    questions: <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    metrics: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    flag: <path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />,
  };

  return (
    <span style={{ ...styles.metaItem, color: color || tokens.colors.textSecondary }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icons[icon]}
      </svg>
      {value}
    </span>
  );
}

function StatCard({ label, value, icon, color, delay = 0 }) {
  return (
    <div
      style={styles.statCard}
      className="hover-lift"
    >
      <span style={styles.statIcon}>{icon}</span>
      <span style={{ ...styles.statValue, color: color || tokens.colors.textPrimary }}>
        {value}
      </span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

function TabButton({ id, label, count, isActive, onClick, alert }) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      style={{
        ...styles.tab,
        ...(isActive ? styles.tabActive : {}),
      }}
      className="press-scale"
    >
      <span>{label}</span>
      <span style={{
        ...styles.tabBadge,
        ...(isActive ? styles.tabBadgeActive : {}),
        ...(alert && !isActive ? styles.tabBadgeAlert : {}),
      }}>
        {count}
      </span>
    </button>
  );
}

function MetricsPanel({ metrics, expandedMetric, setExpandedMetric, onDimensionClick }) {
  return (
    <div style={styles.panelContainer}>
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.id}
          metric={metric}
          isExpanded={expandedMetric === metric.id}
          onToggle={() => setExpandedMetric(expandedMetric === metric.id ? null : metric.id)}
          onDimensionClick={onDimensionClick}
          index={index}
        />
      ))}
    </div>
  );
}

function MetricCard({ metric, isExpanded, onToggle, onDimensionClick, index }) {
  const scoreColor = getScoreColor(metric.score);

  return (
    <div
      style={{
        ...styles.card,
        animationDelay: `${index * 50}ms`,
      }}
      className="animate-fadeIn hover-lift"
    >
      {/* Header */}
      <button onClick={onToggle} style={styles.cardHeader}>
        <div style={styles.cardHeaderLeft}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={tokens.colors.textTertiary} strokeWidth="2"
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: tokens.transitions.normal,
            }}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span style={styles.metricCode}>{metric.code}</span>
          <div style={styles.metricNameGroup}>
            <span style={styles.metricName}>{metric.name}</span>
            <span style={styles.metricAcademic}>{metric.academicTerm}</span>
          </div>
        </div>

        <div style={styles.cardHeaderRight}>
          <div style={styles.scoreBar}>
            <div
              style={{
                ...styles.scoreBarFill,
                width: `${metric.score}%`,
                backgroundColor: scoreColor.main,
              }}
            />
          </div>
          <span style={{ ...styles.scoreValue, color: scoreColor.main }}>
            {metric.score}
          </span>
          <span style={styles.confidenceBadge}>{metric.confidence}</span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={styles.cardContent} className="animate-fadeIn">
          <p style={styles.interpretation}>{metric.interpretation}</p>

          {/* Question Contributions */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Question Breakdown</h4>
            <div style={styles.contributionsTable}>
              <div style={styles.tableHeader}>
                <span>Question</span>
                <span style={{ textAlign: 'right' }}>Score</span>
                <span style={{ textAlign: 'right' }}>Weight</span>
                <span style={{ textAlign: 'right' }}>Contribution</span>
              </div>
              {metric.contributions.map((c, i) => (
                <div key={i} style={styles.tableRow} className="hover-highlight">
                  <span style={styles.questionCode}>{c.code}</span>
                  <span style={{ ...styles.tableValue, color: getScoreColor(c.score).main }}>
                    {c.score}
                  </span>
                  <span style={styles.tableValue}>{c.weight}%</span>
                  <span style={styles.tableValue}>{c.contribution.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionsPanel({ questions, expandedQuestion, setExpandedQuestion, onDimensionClick }) {
  return (
    <div style={styles.panelContainer}>
      {questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          question={question}
          isExpanded={expandedQuestion === question.id}
          onToggle={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
          onDimensionClick={onDimensionClick}
          index={index}
        />
      ))}
    </div>
  );
}

function QuestionCard({ question, isExpanded, onToggle, onDimensionClick, index }) {
  const scoreColor = getScoreColor(question.score);

  return (
    <div
      style={{
        ...styles.card,
        animationDelay: `${index * 50}ms`,
      }}
      className="animate-fadeIn hover-lift"
    >
      {/* Header */}
      <button onClick={onToggle} style={styles.cardHeader}>
        <div style={styles.cardHeaderLeft}>
          <span style={styles.questionNumber}>#{question.number}</span>
          <span style={styles.questionCodeBadge}>{question.code}</span>
          {question.needsReview && (
            <span style={styles.reviewBadge}>Needs Review</span>
          )}
        </div>

        <div style={styles.cardHeaderRight}>
          <span style={styles.confidenceBadge}>{question.confidence}</span>
          <span style={{ ...styles.scoreValue, color: scoreColor.main, fontSize: 18 }}>
            {question.score}
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={styles.cardContent} className="animate-fadeIn">
          {/* Question Text */}
          <div style={styles.questionBox}>
            <span style={styles.boxLabel}>QUESTION</span>
            <p style={styles.boxText}>{question.text}</p>
          </div>

          {/* Response */}
          <div style={styles.responseBox}>
            <span style={styles.responseLabel}>PARTICIPANT RESPONSE</span>
            <p style={styles.responseText}>{question.response}</p>
          </div>

          {/* Quality Meta */}
          <div style={styles.metaTags}>
            <div style={styles.metaTag}>
              <span style={styles.metaTagLabel}>Quality</span>
              <span style={styles.metaTagValue}>{question.quality}</span>
            </div>
            <div style={styles.metaTag}>
              <span style={styles.metaTagLabel}>Confidence</span>
              <span style={styles.metaTagValue}>{question.confidence}</span>
            </div>
          </div>

          {/* Dimension Scores */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Dimension Scores</h4>
            <div style={styles.dimensionsList}>
              {question.dimensions.map((dim, i) => (
                <button
                  key={i}
                  style={styles.dimensionRow}
                  className="hover-highlight press-scale"
                  onClick={() => onDimensionClick(dim)}
                >
                  <div style={styles.dimensionInfo}>
                    <span style={styles.dimensionName}>{dim.name}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tokens.colors.accent} strokeWidth="2" style={{ opacity: 0.5, marginLeft: 4 }}>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                  </div>
                  <div style={styles.dimensionScoreGroup}>
                    <div style={styles.scoreDots}>
                      {[1,2,3,4,5].map((level) => (
                        <div
                          key={level}
                          style={{
                            ...styles.scoreDot,
                            backgroundColor: level <= dim.score
                              ? getScoreColor(dim.score * 20).main
                              : tokens.colors.border,
                          }}
                        />
                      ))}
                    </div>
                    <span style={{
                      ...styles.dimensionScoreValue,
                      color: getScoreColor(dim.score * 20).main
                    }}>
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
}

function FlagsPanel({ flags }) {
  const [resolvingId, setResolvingId] = useState(null);

  if (flags.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>✓</div>
        <p style={styles.emptyTitle}>No flags to review</p>
        <span style={styles.emptySubtext}>All responses passed quality checks</span>
      </div>
    );
  }

  return (
    <div style={styles.panelContainer}>
      <div style={styles.flagsHeader}>
        <h3 style={styles.flagsTitle}>Open Issues</h3>
        <span style={styles.flagsCount}>{flags.length} items</span>
      </div>

      {flags.map((flag, index) => {
        const severityConfig = {
          critical: { color: tokens.colors.error, bg: tokens.colors.errorLight, icon: '🔴' },
          warning: { color: tokens.colors.warning, bg: tokens.colors.warningLight, icon: '🟡' },
          info: { color: tokens.colors.info, bg: tokens.colors.infoLight, icon: '🔵' },
        }[flag.severity];

        return (
          <div
            key={flag.id}
            style={{
              ...styles.flagCard,
              animationDelay: `${index * 100}ms`,
            }}
            className="animate-fadeIn"
          >
            <div style={styles.flagHeader}>
              <span style={{
                ...styles.severityBadge,
                backgroundColor: severityConfig.bg,
                color: severityConfig.color,
              }}>
                {severityConfig.icon} {flag.severity}
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

            <div style={styles.flagMeta}>
              <span style={styles.flagMetaItem}>
                Related: {flag.questionIds.join(', ')}
              </span>
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
                className="hover-highlight press-scale"
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

function DimensionPanel({ dimension, onClose }) {
  return (
    <>
      <div style={styles.panelOverlay} onClick={onClose} />
      <div style={styles.detailPanel} className="animate-slideIn">
        <div style={styles.detailPanelHeader}>
          <h2 style={styles.detailPanelTitle}>{dimension.name}</h2>
          <button style={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={styles.detailPanelContent}>
          {/* Score Display */}
          <div style={styles.panelSection}>
            <span style={styles.panelLabel}>CURRENT SCORE</span>
            <div style={styles.panelScoreDisplay}>
              <span style={{
                ...styles.panelScoreValue,
                color: getScoreColor(dimension.score * 20).main
              }}>
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

          {/* AI Reasoning */}
          <div style={styles.panelSection}>
            <span style={styles.panelLabel}>AI REASONING</span>
            <p style={styles.panelReasoning}>{dimension.reasoning}</p>
          </div>

          {/* Scoring Scale */}
          <div style={styles.panelSection}>
            <span style={styles.panelLabel}>SCORING SCALE</span>
            <div style={styles.scaleList}>
              {[
                { level: 5, label: 'Exceptional', desc: 'Exceeds all expectations consistently' },
                { level: 4, label: 'Strong', desc: 'Clearly demonstrates competency' },
                { level: 3, label: 'Adequate', desc: 'Meets basic expectations' },
                { level: 2, label: 'Developing', desc: 'Shows some capability with gaps' },
                { level: 1, label: 'Limited', desc: 'Significant improvement needed' },
              ].map((scale) => {
                const isActive = scale.level === dimension.score;
                return (
                  <div
                    key={scale.level}
                    style={{
                      ...styles.scaleItem,
                      backgroundColor: isActive ? getScoreColor(dimension.score * 20).bg : 'transparent',
                      borderColor: isActive ? getScoreColor(dimension.score * 20).main : tokens.colors.border,
                    }}
                  >
                    <div style={styles.scaleHeader}>
                      <span style={styles.scaleLevel}>{scale.level}</span>
                      <span style={styles.scaleLabel}>{scale.label}</span>
                      {isActive && <span style={styles.activeIndicator}>Current</span>}
                    </div>
                    <span style={styles.scaleDesc}>{scale.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ==================== STYLES ====================
const styles = {
  container: {
    fontFamily: tokens.typography.fontFamily,
    backgroundColor: tokens.colors.background,
    minHeight: '100vh',
    padding: tokens.spacing[8],
    maxWidth: 1200,
    margin: '0 auto',
  },

  // Header
  header: {
    marginBottom: tokens.spacing[8],
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: tokens.radius.sm,
    color: tokens.colors.accent,
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
    cursor: 'pointer',
    marginBottom: tokens.spacing[4],
  },
  headerMain: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacing[4],
    marginBottom: tokens.spacing[3],
    flexWrap: 'wrap',
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[4],
    flexWrap: 'wrap',
  },
  title: {
    fontSize: tokens.typography.sizes['2xl'],
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.textPrimary,
    margin: 0,
    letterSpacing: '-0.5px',
  },
  scoreBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
    borderRadius: tokens.radius.full,
  },
  scoreBadgeValue: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.bold,
  },
  scoreBadgeLabel: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: `${tokens.spacing[2]}px ${tokens.spacing[3]}px`,
    backgroundColor: tokens.colors.successLight,
    color: tokens.colors.success,
    borderRadius: tokens.radius.full,
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: tokens.colors.success,
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[4],
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing[1],
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: tokens.spacing[4],
    marginBottom: tokens.spacing[8],
  },
  statCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing[5],
    textAlign: 'center',
    boxShadow: tokens.shadows.sm,
    border: `1px solid ${tokens.colors.borderSubtle}`,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: tokens.spacing[2],
    display: 'block',
  },
  statValue: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    display: 'block',
    marginBottom: tokens.spacing[1],
  },
  statLabel: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
  },

  // Tabs
  tabContainer: {
    marginBottom: tokens.spacing[6],
    borderBottom: `1px solid ${tokens.colors.border}`,
  },
  tabList: {
    display: 'flex',
    gap: tokens.spacing[1],
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing[2],
    padding: `${tokens.spacing[3]}px ${tokens.spacing[5]}px`,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: `${tokens.radius.sm}px ${tokens.radius.sm}px 0 0`,
    fontSize: tokens.typography.sizes.base,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.textSecondary,
    cursor: 'pointer',
    transition: tokens.transitions.normal,
    borderBottom: '2px solid transparent',
    marginBottom: -1,
  },
  tabActive: {
    color: tokens.colors.accent,
    borderBottomColor: tokens.colors.accent,
    backgroundColor: tokens.colors.accentLight,
  },
  tabBadge: {
    padding: `2px ${tokens.spacing[2]}px`,
    borderRadius: tokens.radius.sm,
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    backgroundColor: tokens.colors.surfaceHover,
    color: tokens.colors.textSecondary,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(0, 113, 227, 0.15)',
    color: tokens.colors.accent,
  },
  tabBadgeAlert: {
    backgroundColor: tokens.colors.warningLight,
    color: tokens.colors.warning,
  },
  tabContent: {
    minHeight: 400,
  },

  // Panel Container
  panelContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing[4],
  },

  // Cards
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.lg,
    border: `1px solid ${tokens.colors.border}`,
    overflow: 'hidden',
    boxShadow: tokens.shadows.sm,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: `${tokens.spacing[4]}px ${tokens.spacing[5]}px`,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[3],
    flex: 1,
    minWidth: 0,
  },
  cardHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[4],
    flexShrink: 0,
  },
  cardContent: {
    padding: tokens.spacing[5],
    borderTop: `1px solid ${tokens.colors.borderSubtle}`,
    backgroundColor: tokens.colors.background,
  },

  // Metric specific
  metricCode: {
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
    backgroundColor: tokens.colors.accentLight,
    color: tokens.colors.accent,
    borderRadius: tokens.radius.sm,
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.bold,
    flexShrink: 0,
  },
  metricNameGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 0,
  },
  metricName: {
    fontSize: tokens.typography.sizes.base,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.textPrimary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  metricAcademic: {
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.textTertiary,
  },
  scoreBar: {
    width: 100,
    height: 6,
    backgroundColor: tokens.colors.borderSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.4s ease',
  },
  scoreValue: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.bold,
    minWidth: 32,
    textAlign: 'right',
  },
  confidenceBadge: {
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.textTertiary,
    textTransform: 'capitalize',
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
    backgroundColor: tokens.colors.surfaceHover,
    borderRadius: tokens.radius.sm,
  },
  interpretation: {
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.textSecondary,
    lineHeight: tokens.typography.lineHeights.relaxed,
    margin: 0,
    marginBottom: tokens.spacing[5],
  },

  // Sections
  section: {
    marginTop: tokens.spacing[5],
  },
  sectionTitle: {
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: 0,
    marginBottom: tokens.spacing[3],
  },

  // Table
  contributionsTable: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.md,
    border: `1px solid ${tokens.colors.border}`,
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
    backgroundColor: tokens.colors.surfaceHover,
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    padding: `${tokens.spacing[3]}px ${tokens.spacing[4]}px`,
    borderTop: `1px solid ${tokens.colors.borderSubtle}`,
    alignItems: 'center',
  },
  questionCode: {
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.accent,
  },
  tableValue: {
    fontSize: tokens.typography.sizes.sm,
    textAlign: 'right',
    color: tokens.colors.textPrimary,
  },

  // Question specific
  questionNumber: {
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
    backgroundColor: tokens.colors.accentLight,
    color: tokens.colors.accent,
    borderRadius: tokens.radius.sm,
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.bold,
  },
  questionCodeBadge: {
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textPrimary,
  },
  reviewBadge: {
    padding: `2px ${tokens.spacing[2]}px`,
    backgroundColor: tokens.colors.warningLight,
    color: tokens.colors.warning,
    borderRadius: tokens.radius.sm,
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
  },
  questionBox: {
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing[4],
    border: `1px solid ${tokens.colors.borderSubtle}`,
  },
  boxLabel: {
    display: 'block',
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textTertiary,
    marginBottom: tokens.spacing[2],
    letterSpacing: '0.5px',
  },
  boxText: {
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.textPrimary,
    lineHeight: tokens.typography.lineHeights.relaxed,
    margin: 0,
  },
  responseBox: {
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.successLight,
    borderRadius: tokens.radius.md,
    borderLeft: `3px solid ${tokens.colors.success}`,
    marginBottom: tokens.spacing[4],
  },
  responseLabel: {
    display: 'block',
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.success,
    marginBottom: tokens.spacing[2],
    letterSpacing: '0.5px',
  },
  responseText: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
    lineHeight: tokens.typography.lineHeights.relaxed,
    margin: 0,
  },
  metaTags: {
    display: 'flex',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[4],
  },
  metaTag: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[1],
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
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

  // Dimensions
  dimensionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing[2],
  },
  dimensionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing[3],
    backgroundColor: tokens.colors.surface,
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.md,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    transition: tokens.transitions.fast,
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
  dimensionScoreGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  scoreDots: {
    display: 'flex',
    gap: tokens.spacing[1],
  },
  scoreDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    transition: tokens.transitions.fast,
  },
  dimensionScoreValue: {
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.semibold,
  },

  // Flags
  flagsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[4],
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
    padding: tokens.spacing[5],
    boxShadow: tokens.shadows.sm,
  },
  flagHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[3],
  },
  severityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing[1],
    padding: `${tokens.spacing[1]}px ${tokens.spacing[2]}px`,
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
    fontSize: tokens.typography.sizes.base,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textPrimary,
    margin: 0,
    marginBottom: tokens.spacing[2],
  },
  flagDescription: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
    lineHeight: tokens.typography.lineHeights.relaxed,
    margin: 0,
    marginBottom: tokens.spacing[4],
  },
  aiInsight: {
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.accentLight,
    borderRadius: tokens.radius.md,
    marginBottom: tokens.spacing[4],
  },
  aiInsightHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[1],
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.accent,
    marginBottom: tokens.spacing[2],
  },
  aiInsightText: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
    lineHeight: tokens.typography.lineHeights.relaxed,
    margin: 0,
  },
  flagMeta: {
    marginBottom: tokens.spacing[4],
  },
  flagMetaItem: {
    fontSize: tokens.typography.sizes.xs,
    color: tokens.colors.textTertiary,
  },
  resolveButton: {
    padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
    backgroundColor: 'transparent',
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.md,
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.textPrimary,
    cursor: 'pointer',
    transition: tokens.transitions.fast,
  },
  resolveForm: {
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radius.md,
    marginTop: tokens.spacing[4],
  },
  resolveTextarea: {
    width: '100%',
    padding: tokens.spacing[3],
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.md,
    fontSize: tokens.typography.sizes.sm,
    fontFamily: tokens.typography.fontFamily,
    resize: 'vertical',
    marginBottom: tokens.spacing[3],
    boxSizing: 'border-box',
  },
  resolveActions: {
    display: 'flex',
    gap: tokens.spacing[2],
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
    backgroundColor: 'transparent',
    border: `1px solid ${tokens.colors.border}`,
    borderRadius: tokens.radius.md,
    fontSize: tokens.typography.sizes.sm,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.textSecondary,
    cursor: 'pointer',
  },
  confirmButton: {
    padding: `${tokens.spacing[2]}px ${tokens.spacing[4]}px`,
    backgroundColor: tokens.colors.success,
    border: 'none',
    borderRadius: tokens.radius.md,
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
    padding: tokens.spacing[12],
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
    marginBottom: tokens.spacing[4],
  },
  emptyTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.success,
    margin: 0,
    marginBottom: tokens.spacing[1],
  },
  emptySubtext: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
  },

  // Detail Panel
  panelOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(4px)',
    zIndex: 999,
  },
  detailPanel: {
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
  },
  detailPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing[5],
    borderBottom: `1px solid ${tokens.colors.border}`,
    flexShrink: 0,
  },
  detailPanelTitle: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textPrimary,
    margin: 0,
  },
  closeButton: {
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
    transition: tokens.transitions.fast,
  },
  detailPanelContent: {
    flex: 1,
    overflow: 'auto',
    padding: tokens.spacing[5],
  },
  panelSection: {
    marginBottom: tokens.spacing[6],
  },
  panelLabel: {
    display: 'block',
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.textTertiary,
    letterSpacing: '0.5px',
    marginBottom: tokens.spacing[2],
  },
  panelScoreDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[4],
  },
  panelScoreValue: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
  },
  panelScoreBar: {
    display: 'flex',
    gap: tokens.spacing[1],
  },
  panelScoreSegment: {
    width: 32,
    height: 8,
    borderRadius: 4,
    transition: tokens.transitions.fast,
  },
  panelReasoning: {
    fontSize: tokens.typography.sizes.base,
    color: tokens.colors.textSecondary,
    lineHeight: tokens.typography.lineHeights.relaxed,
    margin: 0,
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radius.md,
    fontStyle: 'italic',
  },
  scaleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing[2],
  },
  scaleItem: {
    padding: tokens.spacing[3],
    borderRadius: tokens.radius.md,
    border: '1px solid',
    transition: tokens.transitions.fast,
  },
  scaleHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing[2],
    marginBottom: tokens.spacing[1],
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
  activeIndicator: {
    marginLeft: 'auto',
    fontSize: tokens.typography.sizes.xs,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.accent,
    backgroundColor: tokens.colors.accentLight,
    padding: `2px ${tokens.spacing[2]}px`,
    borderRadius: tokens.radius.sm,
  },
  scaleDesc: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.colors.textSecondary,
    marginLeft: 32,
  },
};
