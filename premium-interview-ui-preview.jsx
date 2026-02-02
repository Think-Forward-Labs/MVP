import React, { useState, useEffect } from 'react';

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    PREMIUM INTERVIEW DETAIL UI PROTOTYPE                      ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Design System:                                                               ║
 * ║  • Apple Human Interface Guidelines                                           ║
 * ║  • Material Design 3 elevation system                                         ║
 * ║  • Linear.app aesthetic principles                                            ║
 * ║  • 8px grid spacing system                                                    ║
 * ║                                                                               ║
 * ║  Key Improvements:                                                            ║
 * ║  ✓ Professional typography hierarchy with SF Pro/Inter                        ║
 * ║  ✓ Refined color palette (Apple-inspired neutrals + semantic colors)          ║
 * ║  ✓ Elevation system with 4 shadow levels                                      ║
 * ║  ✓ Micro-interactions (200ms transitions, hover lift, press scale)            ║
 * ║  ✓ Content-first design with purposeful whitespace                            ║
 * ║  ✓ Premium data visualization (score bars, dimension dots)                    ║
 * ║  ✓ Slide-in detail panels with backdrop blur                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
//                              DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

const theme = {
  // Color System
  colors: {
    // Surfaces
    bg: '#F5F5F7',
    surface: '#FFFFFF',
    surfaceHover: '#F5F5F7',
    surfaceActive: '#EBEBED',

    // Text
    text: '#1D1D1F',
    textSecondary: '#86868B',
    textTertiary: '#AEAEB2',

    // Borders
    border: '#D2D2D7',
    borderLight: '#E8E8ED',

    // Primary accent (Apple Blue)
    accent: '#0071E3',
    accentHover: '#0077ED',
    accentBg: 'rgba(0, 113, 227, 0.08)',

    // Semantic
    success: '#34C759',
    successBg: 'rgba(52, 199, 89, 0.1)',
    warning: '#FF9500',
    warningBg: 'rgba(255, 149, 0, 0.1)',
    error: '#FF3B30',
    errorBg: 'rgba(255, 59, 48, 0.1)',
    info: '#5856D6',
    infoBg: 'rgba(88, 86, 214, 0.1)',
  },

  // Spacing (8px grid)
  space: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 },

  // Border radius
  radius: { sm: 6, md: 10, lg: 14, xl: 20, full: 9999 },

  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04), 0 1px 1px rgba(0,0,0,0.02)',
    md: '0 4px 8px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02)',
    lg: '0 8px 24px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.03)',
    xl: '0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04)',
  },

  // Typography
  font: {
    sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
    mono: '"SF Mono", "Monaco", monospace',
  },
  size: { xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, '2xl': 28 },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
};

// Mock interview data
const interview = {
  name: 'Sarah Chen - Senior Product Manager',
  date: 'Jan 28, 2025',
  avgScore: 76,
  stats: { questions: 24, metrics: 14, flags: 2 },

  metrics: [
    { id: 1, code: 'M1', name: 'Operational Strength', term: 'Technical Fitness', score: 82, confidence: 'high',
      interpretation: 'Strong technical foundation with consistent execution patterns. Demonstrates robust capabilities across multiple domains.',
      questions: [{ code: 'Q1', score: 85, weight: 30 }, { code: 'Q4', score: 78, weight: 40 }, { code: 'Q9', score: 81, weight: 30 }]
    },
    { id: 2, code: 'M2', name: 'Future Readiness', term: 'Evolutionary Fitness', score: 68, confidence: 'medium',
      interpretation: 'Moderate adaptability with room for improvement in emerging technology adoption.',
      questions: [{ code: 'Q2', score: 72, weight: 35 }, { code: 'Q5', score: 65, weight: 35 }, { code: 'Q11', score: 67, weight: 30 }]
    },
    { id: 3, code: 'M9', name: 'Run/Transform Balance', term: 'Ambidexterity', score: 74, confidence: 'high',
      interpretation: 'Good balance between operations and innovation. Allocates resources effectively.',
      questions: [{ code: 'Q3', score: 76, weight: 50 }, { code: 'Q7', score: 72, weight: 50 }]
    },
    { id: 4, code: 'M5', name: 'Market Radar', term: 'Sensing', score: 85, confidence: 'high',
      interpretation: 'Excellent market awareness and competitive intelligence. Proactively identifies opportunities.',
      questions: [{ code: 'Q6', score: 88, weight: 60 }, { code: 'Q12', score: 80, weight: 40 }]
    },
    { id: 5, code: 'M3', name: 'Insight-to-Action', term: 'Learning Effectiveness', score: 71, confidence: 'medium',
      interpretation: 'Solid ability to translate insights into actionable strategies.',
      questions: [{ code: 'Q8', score: 74, weight: 45 }, { code: 'Q10', score: 68, weight: 55 }]
    },
  ],

  questions: [
    { id: 1, num: 1, code: 'Q1', score: 85, confidence: 'high', quality: 'comprehensive',
      text: 'Describe your approach to managing cross-functional teams during a complex product launch.',
      response: 'I establish clear communication channels early. For a recent launch, I set up dedicated Slack channels, bi-weekly syncs, and a shared Notion workspace. Each team had clear ownership with defined handoff points.',
      dimensions: [{ name: 'Communication', score: 5 }, { name: 'Process Design', score: 4 }, { name: 'Leadership', score: 4 }]
    },
    { id: 2, num: 2, code: 'Q2', score: 72, confidence: 'high', quality: 'detailed',
      text: 'How do you prioritize competing initiatives when resources are constrained?',
      response: 'I use a matrix weighing business value against implementation effort. Then I validate with stakeholders. For conflicts, I look at dependencies and quick wins that might unblock other initiatives.',
      dimensions: [{ name: 'Strategic Thinking', score: 4 }, { name: 'Stakeholder Management', score: 4 }, { name: 'Analytical Skills', score: 3 }]
    },
    { id: 3, num: 3, code: 'Q3', score: 62, confidence: 'medium', quality: 'adequate', needsReview: true,
      text: 'Tell me about a time when you had to pivot a product strategy based on market feedback.',
      response: 'At TechCorp, we launched a B2B feature that received negative feedback. Within 3 weeks, I led a rapid discovery phase including user interviews. We pivoted to a self-service model which increased adoption by 40%.',
      dimensions: [{ name: 'Adaptability', score: 3 }, { name: 'Customer Focus', score: 4 }, { name: 'Results Orientation', score: 3 }]
    },
  ],

  flags: [
    { id: 1, severity: 'warning', type: 'inconsistency', title: 'Timeline Inconsistency',
      description: 'Q3 and Q12 contain conflicting information about pivot duration.',
      ai: 'In Q3, candidate mentions "3 weeks" pivot. In Q12, same project referenced as "6-month transformation." May indicate separate initiatives being conflated.' },
    { id: 2, severity: 'info', type: 'missing_data', title: 'Incomplete Response - Q15',
      description: 'Response addressed only 2 of 4 expected components.',
      ai: 'Question asked about risk management, mitigation, contingency, and communication. Only risk identification and mitigation were addressed.' },
  ],
};

// Utility
const getScoreStyle = (score) => {
  if (score >= 80) return { color: theme.colors.success, bg: theme.colors.successBg };
  if (score >= 60) return { color: theme.colors.accent, bg: theme.colors.accentBg };
  if (score >= 40) return { color: theme.colors.warning, bg: theme.colors.warningBg };
  return { color: theme.colors.error, bg: theme.colors.errorBg };
};

// Animations CSS
const GlobalStyles = () => (
  <style>{`
    @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .fade-up { animation: fadeUp 0.3s ease forwards; }
    .slide-in { animation: slideIn 0.25s ease forwards; }
    .lift { transition: transform 0.2s, box-shadow 0.2s; }
    .lift:hover { transform: translateY(-2px); box-shadow: ${theme.shadow.lg}; }
    .press:active { transform: scale(0.98); }
    * { box-sizing: border-box; }
    body { margin: 0; background: ${theme.colors.bg}; }
  `}</style>
);

// ═══════════════════════════════════════════════════════════════════════════════
//                              MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function PremiumUI() {
  const [tab, setTab] = useState('metrics');
  const [expanded, setExpanded] = useState(null);
  const [panel, setPanel] = useState(null);
  const score = getScoreStyle(interview.avgScore);

  return (
    <div style={styles.container}>
      <GlobalStyles />

      {/* ═══════════ HEADER ═══════════ */}
      <header style={styles.header}>
        <button style={styles.backBtn} className="press">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Breakdown
        </button>

        <div style={styles.titleRow}>
          <h1 style={styles.title}>{interview.name}</h1>
          <span style={{ ...styles.scorePill, background: score.bg }}>
            <span style={{ color: score.color, fontWeight: 700, fontSize: 17 }}>{interview.avgScore}</span>
            <span style={{ color: theme.colors.textSecondary, fontSize: 13 }}>avg</span>
          </span>
        </div>

        <div style={styles.meta}>
          <span style={styles.metaItem}>📅 {interview.date}</span>
          <span style={styles.metaItem}>📝 {interview.stats.questions} questions</span>
          <span style={styles.metaItem}>📊 {interview.stats.metrics} metrics</span>
          <span style={{ ...styles.metaItem, color: interview.stats.flags > 0 ? theme.colors.warning : theme.colors.success }}>
            🚩 {interview.stats.flags} flags
          </span>
        </div>
      </header>

      {/* ═══════════ STATS GRID ═══════════ */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Questions', value: interview.stats.questions, icon: '📝' },
          { label: 'Metrics', value: interview.stats.metrics, icon: '📊' },
          { label: 'Flags', value: interview.stats.flags, icon: '🚩', color: interview.stats.flags > 0 ? theme.colors.error : theme.colors.success },
          { label: 'Avg Score', value: interview.avgScore, icon: '⭐', color: score.color },
        ].map((stat, i) => (
          <div key={i} style={styles.statCard} className="lift">
            <span style={{ fontSize: 24 }}>{stat.icon}</span>
            <span style={{ ...styles.statValue, color: stat.color }}>{stat.value}</span>
            <span style={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ═══════════ TABS ═══════════ */}
      <div style={styles.tabBar}>
        {['metrics', 'questions', 'flags'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
            className="press"
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span style={{ ...styles.tabBadge, ...(tab === t ? styles.tabBadgeActive : {}) }}>
              {t === 'metrics' ? interview.metrics.length : t === 'questions' ? interview.questions.length : interview.flags.length}
            </span>
          </button>
        ))}
      </div>

      {/* ═══════════ CONTENT ═══════════ */}
      <div style={styles.content}>
        {tab === 'metrics' && interview.metrics.map((m, i) => {
          const s = getScoreStyle(m.score);
          const isOpen = expanded === m.id;
          return (
            <div key={m.id} style={{ ...styles.card, animationDelay: `${i * 50}ms` }} className="fade-up lift">
              <button onClick={() => setExpanded(isOpen ? null : m.id)} style={styles.cardHeader}>
                <div style={styles.cardLeft}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textTertiary} strokeWidth="2"
                    style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  <span style={styles.metricCode}>{m.code}</span>
                  <div>
                    <div style={styles.metricName}>{m.name}</div>
                    <div style={styles.metricTerm}>{m.term}</div>
                  </div>
                </div>
                <div style={styles.cardRight}>
                  <div style={styles.scoreBar}>
                    <div style={{ ...styles.scoreBarFill, width: `${m.score}%`, background: s.color }} />
                  </div>
                  <span style={{ ...styles.scoreNum, color: s.color }}>{m.score}</span>
                  <span style={styles.confidence}>{m.confidence}</span>
                </div>
              </button>

              {isOpen && (
                <div style={styles.cardBody} className="fade-up">
                  <p style={styles.interpretation}>{m.interpretation}</p>
                  <div style={styles.tableSection}>
                    <h4 style={styles.sectionTitle}>Question Breakdown</h4>
                    <div style={styles.table}>
                      <div style={styles.tableHead}>
                        <span>Question</span>
                        <span style={{ textAlign: 'right' }}>Score</span>
                        <span style={{ textAlign: 'right' }}>Weight</span>
                        <span style={{ textAlign: 'right' }}>Contribution</span>
                      </div>
                      {m.questions.map((q, j) => (
                        <div key={j} style={styles.tableRow}>
                          <span style={{ color: theme.colors.accent, fontWeight: 600 }}>{q.code}</span>
                          <span style={{ textAlign: 'right', color: getScoreStyle(q.score).color }}>{q.score}</span>
                          <span style={{ textAlign: 'right' }}>{q.weight}%</span>
                          <span style={{ textAlign: 'right' }}>{((q.score * q.weight) / 100).toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {tab === 'questions' && interview.questions.map((q, i) => {
          const s = getScoreStyle(q.score);
          const isOpen = expanded === q.id;
          return (
            <div key={q.id} style={{ ...styles.card, animationDelay: `${i * 50}ms` }} className="fade-up lift">
              <button onClick={() => setExpanded(isOpen ? null : q.id)} style={styles.cardHeader}>
                <div style={styles.cardLeft}>
                  <span style={styles.qNum}>#{q.num}</span>
                  <span style={styles.qCode}>{q.code}</span>
                  {q.needsReview && <span style={styles.reviewBadge}>Needs Review</span>}
                </div>
                <div style={styles.cardRight}>
                  <span style={styles.confidence}>{q.confidence}</span>
                  <span style={{ ...styles.scoreNum, color: s.color, fontSize: 18 }}>{q.score}</span>
                </div>
              </button>

              {isOpen && (
                <div style={styles.cardBody} className="fade-up">
                  <div style={styles.qBox}>
                    <span style={styles.boxLabel}>QUESTION</span>
                    <p style={styles.boxText}>{q.text}</p>
                  </div>
                  <div style={styles.responseBox}>
                    <span style={styles.responseLabel}>PARTICIPANT RESPONSE</span>
                    <p style={styles.responseText}>{q.response}</p>
                  </div>
                  <div style={styles.tags}>
                    <span style={styles.tag}><span style={styles.tagLabel}>Quality</span> {q.quality}</span>
                    <span style={styles.tag}><span style={styles.tagLabel}>Confidence</span> {q.confidence}</span>
                  </div>
                  <div style={styles.dimensionSection}>
                    <h4 style={styles.sectionTitle}>Dimension Scores</h4>
                    {q.dimensions.map((d, j) => (
                      <button key={j} style={styles.dimensionRow} onClick={() => setPanel(d)} className="press">
                        <span style={styles.dimName}>{d.name}</span>
                        <div style={styles.dimScore}>
                          {[1,2,3,4,5].map(n => (
                            <div key={n} style={{ ...styles.dot, background: n <= d.score ? getScoreStyle(d.score * 20).color : theme.colors.border }} />
                          ))}
                          <span style={{ marginLeft: 8, color: getScoreStyle(d.score * 20).color, fontWeight: 600 }}>{d.score}/5</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {tab === 'flags' && (
          interview.flags.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>✓</div>
              <p style={styles.emptyTitle}>No flags to review</p>
              <span style={styles.emptyText}>All responses passed quality checks</span>
            </div>
          ) : (
            <>
              <div style={styles.flagsHeader}>
                <h3 style={styles.flagsTitle}>Open Issues</h3>
                <span style={styles.flagsCount}>{interview.flags.length} items</span>
              </div>
              {interview.flags.map((f, i) => {
                const sev = { warning: { icon: '🟡', color: theme.colors.warning, bg: theme.colors.warningBg },
                              info: { icon: '🔵', color: theme.colors.info, bg: theme.colors.infoBg },
                              critical: { icon: '🔴', color: theme.colors.error, bg: theme.colors.errorBg } }[f.severity];
                return (
                  <div key={f.id} style={{ ...styles.flagCard, animationDelay: `${i * 100}ms` }} className="fade-up">
                    <div style={styles.flagHeader}>
                      <span style={{ ...styles.severity, background: sev.bg, color: sev.color }}>{sev.icon} {f.severity}</span>
                      <span style={styles.flagType}>{f.type.replace('_', ' ')}</span>
                    </div>
                    <h4 style={styles.flagTitle}>{f.title}</h4>
                    <p style={styles.flagDesc}>{f.description}</p>
                    <div style={styles.aiBox}>
                      <div style={styles.aiHeader}>💡 AI Analysis</div>
                      <p style={styles.aiText}>{f.ai}</p>
                    </div>
                    <button style={styles.resolveBtn} className="press">Resolve Issue</button>
                  </div>
                );
              })}
            </>
          )
        )}
      </div>

      {/* ═══════════ DIMENSION PANEL ═══════════ */}
      {panel && (
        <>
          <div style={styles.overlay} onClick={() => setPanel(null)} />
          <div style={styles.panel} className="slide-in">
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>{panel.name}</h2>
              <button style={styles.closeBtn} onClick={() => setPanel(null)}>✕</button>
            </div>
            <div style={styles.panelContent}>
              <div style={styles.panelSection}>
                <span style={styles.panelLabel}>CURRENT SCORE</span>
                <div style={styles.panelScore}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: getScoreStyle(panel.score * 20).color }}>{panel.score}/5</span>
                  <div style={styles.panelDots}>
                    {[1,2,3,4,5].map(n => (
                      <div key={n} style={{ width: 32, height: 8, borderRadius: 4, background: n <= panel.score ? getScoreStyle(panel.score * 20).color : theme.colors.border }} />
                    ))}
                  </div>
                </div>
              </div>
              <div style={styles.panelSection}>
                <span style={styles.panelLabel}>SCORING SCALE</span>
                <div style={styles.scaleList}>
                  {[
                    { level: 5, name: 'Exceptional', desc: 'Exceeds all expectations' },
                    { level: 4, name: 'Strong', desc: 'Clearly demonstrates competency' },
                    { level: 3, name: 'Adequate', desc: 'Meets basic expectations' },
                    { level: 2, name: 'Developing', desc: 'Shows some capability' },
                    { level: 1, name: 'Limited', desc: 'Significant improvement needed' },
                  ].map(s => (
                    <div key={s.level} style={{
                      ...styles.scaleItem,
                      background: s.level === panel.score ? getScoreStyle(panel.score * 20).bg : 'transparent',
                      borderColor: s.level === panel.score ? getScoreStyle(panel.score * 20).color : theme.colors.border
                    }}>
                      <div style={styles.scaleRow}>
                        <span style={styles.scaleLevel}>{s.level}</span>
                        <span style={styles.scaleName}>{s.name}</span>
                        {s.level === panel.score && <span style={styles.currentBadge}>Current</span>}
                      </div>
                      <span style={styles.scaleDesc}>{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//                                 STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
  container: { fontFamily: theme.font.sans, background: theme.colors.bg, minHeight: '100vh', padding: 32, maxWidth: 1200, margin: '0 auto' },

  // Header
  header: { marginBottom: 32 },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'transparent', border: 'none', borderRadius: 6, color: theme.colors.accent, fontSize: 13, fontWeight: 500, cursor: 'pointer', marginBottom: 16 },
  titleRow: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: 700, color: theme.colors.text, margin: 0, letterSpacing: -0.5 },
  scorePill: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9999 },
  meta: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  metaItem: { fontSize: 13, color: theme.colors.textSecondary },

  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  statCard: { background: theme.colors.surface, borderRadius: 14, padding: 20, textAlign: 'center', boxShadow: theme.shadow.sm, border: `1px solid ${theme.colors.borderLight}` },
  statValue: { fontSize: 24, fontWeight: 700, display: 'block', margin: '8px 0 4px' },
  statLabel: { fontSize: 13, color: theme.colors.textSecondary },

  // Tabs
  tabBar: { display: 'flex', gap: 4, borderBottom: `1px solid ${theme.colors.border}`, marginBottom: 24 },
  tab: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'transparent', border: 'none', borderBottom: '2px solid transparent', marginBottom: -1, fontSize: 15, fontWeight: 500, color: theme.colors.textSecondary, cursor: 'pointer', transition: '0.2s' },
  tabActive: { color: theme.colors.accent, borderBottomColor: theme.colors.accent, background: theme.colors.accentBg },
  tabBadge: { padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: theme.colors.surfaceHover, color: theme.colors.textSecondary },
  tabBadgeActive: { background: 'rgba(0,113,227,0.15)', color: theme.colors.accent },

  // Content
  content: { display: 'flex', flexDirection: 'column', gap: 16 },

  // Cards
  card: { background: theme.colors.surface, borderRadius: 14, border: `1px solid ${theme.colors.border}`, overflow: 'hidden', boxShadow: theme.shadow.sm },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '16px 20px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' },
  cardLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  cardRight: { display: 'flex', alignItems: 'center', gap: 16 },
  cardBody: { padding: 20, borderTop: `1px solid ${theme.colors.borderLight}`, background: theme.colors.bg },

  // Metrics
  metricCode: { padding: '4px 8px', background: theme.colors.accentBg, color: theme.colors.accent, borderRadius: 6, fontSize: 11, fontWeight: 700 },
  metricName: { fontSize: 15, fontWeight: 500, color: theme.colors.text },
  metricTerm: { fontSize: 11, color: theme.colors.textTertiary },
  scoreBar: { width: 100, height: 6, background: theme.colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 3, transition: '0.4s' },
  scoreNum: { fontSize: 17, fontWeight: 700, minWidth: 32, textAlign: 'right' },
  confidence: { fontSize: 11, color: theme.colors.textTertiary, textTransform: 'capitalize', padding: '4px 8px', background: theme.colors.surfaceHover, borderRadius: 6 },
  interpretation: { fontSize: 15, color: theme.colors.textSecondary, lineHeight: 1.6, margin: 0, marginBottom: 20 },

  // Table
  tableSection: { marginTop: 0 },
  sectionTitle: { fontSize: 11, fontWeight: 600, color: theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' },
  table: { background: theme.colors.surface, borderRadius: 10, border: `1px solid ${theme.colors.border}`, overflow: 'hidden' },
  tableHead: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '8px 16px', background: theme.colors.surfaceHover, fontSize: 11, fontWeight: 600, color: theme.colors.textTertiary, textTransform: 'uppercase' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '12px 16px', borderTop: `1px solid ${theme.colors.borderLight}`, fontSize: 14 },

  // Questions
  qNum: { padding: '4px 8px', background: theme.colors.accentBg, color: theme.colors.accent, borderRadius: 6, fontSize: 11, fontWeight: 700 },
  qCode: { fontSize: 14, fontWeight: 600, color: theme.colors.text },
  reviewBadge: { padding: '2px 8px', background: theme.colors.warningBg, color: theme.colors.warning, borderRadius: 6, fontSize: 11, fontWeight: 600 },
  qBox: { padding: 16, background: theme.colors.surface, borderRadius: 10, marginBottom: 16, border: `1px solid ${theme.colors.borderLight}` },
  boxLabel: { display: 'block', fontSize: 11, fontWeight: 600, color: theme.colors.textTertiary, marginBottom: 8, letterSpacing: 0.5 },
  boxText: { fontSize: 15, color: theme.colors.text, lineHeight: 1.6, margin: 0 },
  responseBox: { padding: 16, background: theme.colors.successBg, borderRadius: 10, borderLeft: `3px solid ${theme.colors.success}`, marginBottom: 16 },
  responseLabel: { display: 'block', fontSize: 11, fontWeight: 600, color: theme.colors.success, marginBottom: 8, letterSpacing: 0.5 },
  responseText: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.7, margin: 0 },
  tags: { display: 'flex', gap: 8, marginBottom: 20 },
  tag: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: theme.colors.surfaceHover, borderRadius: 6, fontSize: 12, textTransform: 'capitalize' },
  tagLabel: { color: theme.colors.textTertiary },

  // Dimensions
  dimensionSection: {},
  dimensionRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: 12, background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 10, cursor: 'pointer', marginBottom: 8, textAlign: 'left', transition: '0.15s' },
  dimName: { fontSize: 14, fontWeight: 500, color: theme.colors.text },
  dimScore: { display: 'flex', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: '50%', transition: '0.15s' },

  // Flags
  flagsHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 16 },
  flagsTitle: { fontSize: 20, fontWeight: 600, margin: 0 },
  flagsCount: { fontSize: 13, color: theme.colors.textSecondary },
  flagCard: { background: theme.colors.surface, borderRadius: 14, border: `1px solid ${theme.colors.border}`, padding: 20, marginBottom: 16, boxShadow: theme.shadow.sm },
  flagHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  severity: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' },
  flagType: { fontSize: 11, color: theme.colors.textTertiary, textTransform: 'capitalize' },
  flagTitle: { fontSize: 15, fontWeight: 600, margin: '0 0 8px' },
  flagDesc: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.6, margin: '0 0 16px' },
  aiBox: { padding: 16, background: theme.colors.accentBg, borderRadius: 10, marginBottom: 16 },
  aiHeader: { fontSize: 12, fontWeight: 600, color: theme.colors.accent, marginBottom: 8 },
  aiText: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.6, margin: 0 },
  resolveBtn: { padding: '8px 16px', background: 'transparent', border: `1px solid ${theme.colors.border}`, borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: '0.15s' },

  // Empty
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 48, textAlign: 'center' },
  emptyIcon: { width: 64, height: 64, borderRadius: '50%', background: theme.colors.successBg, color: theme.colors.success, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 600, color: theme.colors.success, margin: 0 },
  emptyText: { fontSize: 14, color: theme.colors.textSecondary },

  // Panel
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 999 },
  panel: { position: 'fixed', top: 0, right: 0, width: 420, maxWidth: '90vw', height: '100vh', background: theme.colors.surface, boxShadow: theme.shadow.xl, zIndex: 1000, display: 'flex', flexDirection: 'column' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottom: `1px solid ${theme.colors.border}` },
  panelTitle: { fontSize: 20, fontWeight: 600, margin: 0 },
  closeBtn: { width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 6, fontSize: 18, color: theme.colors.textSecondary, cursor: 'pointer' },
  panelContent: { flex: 1, overflow: 'auto', padding: 20 },
  panelSection: { marginBottom: 24 },
  panelLabel: { display: 'block', fontSize: 11, fontWeight: 600, color: theme.colors.textTertiary, letterSpacing: 0.5, marginBottom: 8 },
  panelScore: { display: 'flex', alignItems: 'center', gap: 16 },
  panelDots: { display: 'flex', gap: 4 },
  scaleList: { display: 'flex', flexDirection: 'column', gap: 8 },
  scaleItem: { padding: 12, borderRadius: 10, border: '1px solid', transition: '0.15s' },
  scaleRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  scaleLevel: { width: 24, height: 24, borderRadius: '50%', background: theme.colors.surfaceHover, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  scaleName: { fontSize: 14, fontWeight: 600 },
  currentBadge: { marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: theme.colors.accent, background: theme.colors.accentBg, padding: '2px 8px', borderRadius: 6 },
  scaleDesc: { fontSize: 13, color: theme.colors.textSecondary, marginLeft: 32 },
};
