import { useState, useEffect } from 'react';
import './DocsPage.css';

// ─── TYPES ───
interface NavItem {
  id: string;
  label: string;
  children?: NavItem[];
}

// ─── NAV STRUCTURE ───
const NAV: NavItem[] = [
  { id: 'overview', label: 'Pipeline Overview' },
  { id: 'questions', label: 'Question Bank', children: [
    { id: 'questions-open', label: 'Open-Ended (15)' },
    { id: 'questions-scale', label: 'Scale 1-5 (8)' },
    { id: 'questions-pct', label: 'Percentage (2)' },
    { id: 'questions-select', label: 'Select (3)' },
  ]},
  { id: 'scoring', label: 'Scoring Engine', children: [
    { id: 'scoring-dimensions', label: 'Dimension Rubrics' },
    { id: 'scoring-ceilings', label: 'Hard Score Ceilings' },
    { id: 'scoring-formula', label: 'Score Calculation' },
  ]},
  { id: 'metrics', label: 'Metric Definitions', children: [
    { id: 'metrics-core', label: 'Core Metrics (M1-M14)' },
    { id: 'metrics-derived', label: 'Derived (D1, D2)' },
    { id: 'metrics-weights', label: 'Question Weights' },
  ]},
  { id: 'interdependency', label: 'Interdependency Map', children: [
    { id: 'interdependency-pathology', label: 'Pathology Links' },
    { id: 'interdependency-contradiction', label: 'Contradiction Links' },
    { id: 'interdependency-validation', label: 'Validation Links' },
  ]},
  { id: 'pathology', label: 'Pathology Detection', children: [
    { id: 'pathology-logic', label: 'Detection Logic (7)' },
    { id: 'pathology-indicators', label: 'Partial Indicators' },
    { id: 'pathology-roadmaps', label: 'Recovery Roadmaps' },
  ]},
  { id: 'saydo', label: 'Say-Do Checks', children: [
    { id: 'saydo-pattern', label: 'Pattern Checks (10)' },
    { id: 'saydo-crossq', label: 'Cross-Question (6)' },
    { id: 'saydo-n1', label: 'Single-Respondent Rules' },
  ]},
  { id: 'quadrant', label: 'Quadrant Classification' },
  { id: 'training', label: 'Training Data Bank', children: [
    { id: 'training-cases', label: 'Historical Cases' },
    { id: 'training-signals', label: 'Scoring Signals' },
    { id: 'training-calibration', label: 'Calibration Examples' },
    { id: 'training-sector', label: 'Sector Norms' },
    { id: 'training-exec', label: 'Exec Summary Examples' },
    { id: 'training-saydo', label: 'Say-Do Examples' },
    { id: 'training-recs', label: 'Recommendation Examples' },
    { id: 'training-roadmaps', label: 'Pathology Roadmaps' },
    { id: 'training-labels', label: 'Label Translations' },
  ]},
  { id: 'refinement', label: 'Refinement Pipeline', children: [
    { id: 'refinement-narratives', label: 'Metric Narratives' },
    { id: 'refinement-observations', label: 'Observation Mining' },
    { id: 'refinement-summary', label: 'Executive Summary' },
    { id: 'refinement-actions', label: 'Recommendations' },
  ]},
  { id: 'quality', label: 'Quality Gate', children: [
    { id: 'quality-reviewers', label: 'Parallel Reviewers' },
    { id: 'quality-rules', label: 'Rules Checker' },
    { id: 'quality-fixer', label: 'Fix Loop' },
  ]},
  { id: 'terminology', label: 'Terminology Map' },
];

// ─── MAIN COMPONENT ───
export function DocsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('docs-theme') as 'light' | 'dark') || 'light'
  );
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedNav, setExpandedNav] = useState<Set<string>>(new Set(['overview']));

  useEffect(() => {
    document.documentElement.setAttribute('data-docs-theme', theme);
    localStorage.setItem('docs-theme', theme);
  }, [theme]);

  const toggleNav = (id: string) => {
    setExpandedNav(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="docs" data-theme={theme}>
      {/* Header */}
      <header className="docs-header">
        <div className="docs-header-left">
          <button className="docs-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="docs-logo">
            <span className="docs-logo-mark">C</span>
            <span className="docs-logo-text">CABAS<sup>®</sup> Technical Documentation</span>
          </div>
        </div>
        <div className="docs-header-right">
          <span className="docs-version">v2.2</span>
          <button className="docs-theme-btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            )}
          </button>
        </div>
      </header>

      <div className="docs-body">
        {/* Sidebar */}
        <nav className={`docs-sidebar ${sidebarOpen ? 'docs-sidebar--open' : ''}`}>
          {NAV.map(item => (
            <div key={item.id} className="docs-nav-group">
              <button
                className={`docs-nav-item ${activeSection === item.id ? 'docs-nav-item--active' : ''}`}
                onClick={() => { scrollTo(item.id); if (item.children) toggleNav(item.id); }}
              >
                <span>{item.label}</span>
                {item.children && (
                  <svg className={`docs-nav-chevron ${expandedNav.has(item.id) ? 'docs-nav-chevron--open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                )}
              </button>
              {item.children && expandedNav.has(item.id) && (
                <div className="docs-nav-children">
                  {item.children.map(child => (
                    <button
                      key={child.id}
                      className={`docs-nav-child ${activeSection === child.id ? 'docs-nav-child--active' : ''}`}
                      onClick={() => scrollTo(child.id)}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Content */}
        <main className="docs-content">
          <PipelineOverview />
          <QuestionBank />
          <ScoringEngine />
          <MetricDefinitions />
          <InterdependencyMap />
          <PathologyDetection />
          <SayDoChecks />
          <QuadrantClassification />
          <TrainingDataBank />
          <RefinementPipeline />
          <QualityGate />
          <TerminologyMap />
        </main>
      </div>
    </div>
  );
}

// ─── SECTION COMPONENTS ───

function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="docs-section">
      <div className="docs-section-header">
        <h2 className="docs-section-title">{title}</h2>
        {subtitle && <p className="docs-section-subtitle">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function SubSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="docs-subsection">
      <h3 className="docs-subsection-title">{title}</h3>
      {children}
    </div>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return <div className="docs-formula">{children}</div>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="docs-table-wrap">
      <table className="docs-table">
        <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function CodeBlock({ title, children }: { title?: string; children: string }) {
  return (
    <div className="docs-code">
      {title && <div className="docs-code-title">{title}</div>}
      <pre><code>{children}</code></pre>
    </div>
  );
}

function Callout({ type = 'info', children }: { type?: 'info' | 'warning' | 'critical'; children: React.ReactNode }) {
  const icons = { info: 'i', warning: '!', critical: '!!' };
  return (
    <div className={`docs-callout docs-callout--${type}`}>
      <span className="docs-callout-icon">{icons[type]}</span>
      <div>{children}</div>
    </div>
  );
}

// ─── PIPELINE OVERVIEW ───
function PipelineOverview() {
  return (
    <Section id="overview" title="Pipeline Overview" subtitle="5-stage evaluation pipeline from raw responses to client-ready report">
      <div className="docs-pipeline">
        {[
          { stage: '1', name: 'Question Scoring', desc: 'LLM scores each open-ended question against dimension rubrics. Scale/percentage questions use direct conversion. Hard ceilings applied post-scoring.', time: '~15s' },
          { stage: '2', name: 'Interdependency Checks', desc: 'Cross-question checks for pathologies, contradictions, validation, and context. 10 SAYDO pattern checks + 6 cross-question consistency checks.', time: '~2s' },
          { stage: '3', name: 'Metric Calculation', desc: 'Weighted aggregation of question scores into 14 core metrics + 2 derived metrics. Per-metric dimension weights applied.', time: '~1s' },
          { stage: '4', name: 'Refinement', desc: '14 metrics x 2 LLM calls (observation mining + reasoning). Plus executive summary, VRIN assessment, pathology descriptions, and recommendations.', time: '~60-80s' },
          { stage: '5', name: 'Quality Gate', desc: 'Parallel reviewers check writing quality against Iva\'s standards. Rules-based terminology check + LLM reviewers for tone, structure, specificity.', time: '~30-60s' },
        ].map((s, i) => (
          <div key={i} className="docs-pipeline-stage">
            <div className="docs-pipeline-num">{s.stage}</div>
            <div className="docs-pipeline-body">
              <div className="docs-pipeline-name">{s.name}</div>
              <div className="docs-pipeline-desc">{s.desc}</div>
              <div className="docs-pipeline-time">{s.time}</div>
            </div>
            {i < 4 && <div className="docs-pipeline-arrow">&#8594;</div>}
          </div>
        ))}
      </div>

      <CodeBlock title="Score Band Definitions">
{`Leading Strength  85-100  Genuine differentiators
Strong            70-84   Solid performance, maintain
Adequate          55-69   Functional but not competitive
Watch Area        40-54   Below transformation readiness
Critical Gap       0-39   Below functioning threshold`}
      </CodeBlock>

      <Callout type="info">
        All scores are integers in client-facing output. Scale questions: 1=20, 2=40, 3=60, 4=80, 5=100. No decimals.
      </Callout>
    </Section>
  );
}

// ─── QUESTION BANK ───
function QuestionBank() {
  const questions = [
    ['B1', 'Open', 'Role, level, tenure', 'Triangulation'],
    ['B2', 'Open', 'Team description, special skills', 'Defensible Strengths'],
    ['B5', 'Multi-select', 'What customers value most', 'Op. Strength'],
    ['B6', 'Single-select', 'Market change speed', 'Future Readiness'],
    ['M1', 'Open', 'How you discuss/interpret info', 'Insight-to-Action'],
    ['M4', 'Scale 1-5', 'Cross-team conversation effectiveness', 'Structure Fitness'],
    ['S1', 'Open', 'Signals noticed and sources', 'Market Radar'],
    ['S3a', 'Scale 1-5', 'Ease of raising bad news/risks', 'Change Readiness'],
    ['S5', 'Scale 1-5', 'Organisation spots changes early', 'Future Readiness'],
    ['I1', 'Open', 'Example: learning to change', '5 Metrics'],
    ['I2', 'Open', 'Enablers and barriers', 'Impl. Speed'],
    ['I4', 'Scale 1-5', 'Changes implemented and stay', 'Op. Strength'],
    ['X3a', 'Percentage', '% time exploitation', 'Run/Transform'],
    ['X3b', 'Percentage', '% time exploration', 'Run/Transform'],
    ['X4', 'Scale 1-5', 'Ability to change direction', 'Impl. Speed'],
    ['C1', 'Open', 'Response to mistakes (example)', 'Change Readiness'],
    ['C2', 'Open', 'What leaders do for learning', 'Insight-to-Action'],
    ['C3', 'Scale 1-5', 'Feel safe to speak up', 'Change Readiness'],
    ['C4', 'Open', 'Teams respond differently?', 'Structure Fitness'],
    ['R1', 'Open', 'Tools help or create friction', 'Capacity & Tools'],
    ['R2', 'Open', 'Experiments/pilots with partners', 'Future Readiness'],
    ['R3', 'Scale 1-5', 'Tech supports learning', 'Capacity & Tools'],
    ['P2', 'Open', 'Biggest barriers (list 3)', 'Synthesis'],
    ['P4', 'Scale 1-5', 'Overall readiness for change', 'Meta-check'],
    ['RA1', 'Open', 'Last significant risk taken', 'Risk Tolerance'],
    ['RA2', 'Open', 'Response to failed risks', 'Risk Tolerance'],
    ['OL1', 'Open', 'Orphan problem handling', 'Accountability Speed'],
    ['OL2', 'Open', 'Time to ownership', 'Accountability Speed'],
  ];

  return (
    <Section id="questions" title="Question Bank" subtitle="28 questions across 4 types. v2.1 base + PB1/FC1 planned for v2.2.">
      <Table
        headers={['Code', 'Type', 'Summary', 'Primary Metric']}
        rows={questions}
      />
      <SubSection id="questions-open" title="Open-Ended Questions (15)">
        <p className="docs-text">Scored by LLM against multi-dimension rubrics. Each dimension has 5-level BARS anchors. Score = weighted average of dimension scores. Hard ceilings may cap the overall score.</p>
      </SubSection>
      <SubSection id="questions-scale" title="Scale Questions (8)">
        <Formula>Score = Scale Value × 20 &nbsp;&nbsp;|&nbsp;&nbsp; 1→20, 2→40, 3→60, 4→80, 5→100</Formula>
        <p className="docs-text">Direct mathematical conversion. No AI interpretation. No variation.</p>
      </SubSection>
      <SubSection id="questions-pct" title="Percentage Questions (2)">
        <p className="docs-text">X3a (exploitation %) and X3b (exploration %). Scored using distance-from-ideal formula with B6 market dynamism context.</p>
        <Formula>Ideal: 70% exploitation / 30% exploration. X3b 20-40% = 100. X3b &lt;10% = 20-59. X3b &gt;60% = 20-59.</Formula>
      </SubSection>
      <SubSection id="questions-select" title="Select Questions (3)">
        <p className="docs-text">B5 (multi-select: what customers value), B6 (single-select: market speed). Scored based on selection categories.</p>
      </SubSection>
    </Section>
  );
}

// ─── SCORING ENGINE ───
function ScoringEngine() {
  const ceilings = [
    ['S1', '≤60', 'Fewer than 4 of 5 signal types mentioned', 'Market Radar'],
    ['I1', '≤65', 'Change compliance-driven/reactive, timeline >3 months', '5 Metrics'],
    ['R1', '≤55', 'Workarounds, friction, or manual processes described', 'Capacity & Tools'],
    ['C2', '≤55', 'Under 4 sentences, no specific examples', 'Change Readiness'],
    ['OL1', '≤45', 'Ownership delay >2 weeks in example', 'Accountability Speed'],
    ['I2', '≤55', 'Barriers >> enablers, approvals/bureaucracy cited', 'Impl. Speed'],
    ['C1', '≤60', 'Any blame/finger-pointing, even if learning followed', 'Change Readiness'],
  ];

  return (
    <Section id="scoring" title="Scoring Engine" subtitle="Stage 1: How each response becomes a 0-100 score">
      <SubSection id="scoring-dimensions" title="Dimension Rubrics">
        <p className="docs-text">Each open-ended question has 3-5 scoring dimensions. Each dimension has a weight and 5-level Behaviourally Anchored Rating Scale (BARS). The LLM scores each dimension 1-5, then the overall score is computed as a weighted average converted to 0-100.</p>
        <Formula>Overall Score = Σ (dimension_score × dimension_weight) / Σ weights × 20</Formula>
        <Callout type="critical">
          <strong>Principle:</strong> Score what the organisation DOES, not how well the respondent describes it. A clearly articulated failure is still a failure.
        </Callout>
      </SubSection>

      <SubSection id="scoring-ceilings" title="Hard Score Ceilings">
        <p className="docs-text">Applied post-scoring, before metric calculation. If a ceiling condition is met, the overall score is capped regardless of how high the LLM scored the dimensions.</p>
        <Table
          headers={['Question', 'Ceiling', 'Condition', 'Affected Metric']}
          rows={ceilings}
        />
        <Callout type="warning">
          Ceilings never raise scores. If the LLM already scored below the ceiling, no change is made. Dimension scores are preserved — only overall_score is capped.
        </Callout>
      </SubSection>

      <SubSection id="scoring-formula" title="Score Calculation Flow">
        <CodeBlock title="Per-Question Scoring Flow">
{`1. Response text → LLM with dimension rubric + BARS anchors
2. LLM returns: dimension_id, score (1-5), confidence, reasoning
3. Overall = weighted average of dimensions × 20 → 0-100 scale
4. Apply hard ceiling if condition met → cap overall_score
5. Store: overall_score, dimension_scores[], raw_response, reasoning`}
        </CodeBlock>
      </SubSection>
    </Section>
  );
}

// ─── METRIC DEFINITIONS ───
function MetricDefinitions() {
  const coreMetrics = [
    ['M1', 'Operational Strength', 'Current execution capability', 'I1(25%) + I4(30%) + X3a(20%) + R1(10%) + B5(15%CL)'],
    ['M2', 'Future Readiness', 'Preparedness for disruption', 'S5(25%) + I1(15%) + X4(15%) + B6(10%) + X3b(10%) + R2(10%) + S3a(10%)'],
    ['M3', 'Insight-to-Action', 'Converting insights into decisions', 'M1(30%) + I1(25%) + C2(25%) + S1(20%)'],
    ['M4', 'Implementation Speed', 'How fast changes get executed', 'M4(50%) + I2(30%) + X4(20%)'],
    ['M5', 'Market Radar', 'External signal detection', 'S1(50%) + S5(30%) + B6(20%)'],
    ['M6', 'Decision Flow', 'Information flow quality', 'M1(35%) + M4(50%) + R1(15%)'],
    ['M7', 'Knowledge Leverage', 'Integration and reuse of knowledge', 'I1(100%) with per-metric dimension weights'],
    ['M8', 'Accountability Speed', 'How fast ownership is established', 'OL1(40%) + OL2(40%) + I2(10%) + M4(10%)'],
    ['M9', 'Run/Transform Balance', 'Exploitation vs exploration split', 'X3a + X3b (distance-from-ideal)'],
    ['M10', 'Change Readiness', 'Organisational readiness for change', 'C3(20%) + C1(20%) + S3a(15%) + I1(15%) + C2(15%) + I4(15%)'],
    ['M11', 'Structure Fitness', 'How well structure supports strategy', 'M4(30%) + C4(25%) + I4(20%) + I2(15%) + B5(10%CL)'],
    ['M12', 'Capacity & Tools', 'Resource adequacy and tool fitness', 'R1(60%) + R2(25%) + R3(15%)'],
    ['M13', 'Defensible Strengths', 'VRIN competitive advantage', 'B2(20%) + B5(30%) + I1(25%) + R2(10%) + C1(15%)'],
    ['M14', 'Risk Tolerance', 'Willingness to take calculated risks', 'RA1(50%) + RA2(30%) + C3(20%)'],
  ];

  return (
    <Section id="metrics" title="Metric Definitions" subtitle="14 core metrics + 2 derived metrics measuring organisational health">
      <SubSection id="metrics-core" title="Core Metrics (M1-M14)">
        <Table
          headers={['Code', 'Client Name', 'Measures', 'Formula (Question Weights)']}
          rows={coreMetrics}
        />
        <Callout type="info">
          <strong>CL</strong> = Cross-Level contribution. Requires multi-respondent data. Skipped for N=1 with weight redistributed.
        </Callout>
      </SubSection>

      <SubSection id="metrics-derived" title="Derived Metrics (D1, D2)">
        <Formula>D1 OODA Velocity = (M5 + M6 + M8 + M4) ÷ 4</Formula>
        <Formula>D2 Resilience Index = (M12 + M10 + M3) ÷ 3</Formula>
        <p className="docs-text">Derived metrics are simple averages of their source metrics. No LLM calls — calculated directly from core metric scores.</p>
      </SubSection>

      <SubSection id="metrics-weights" title="Dimension Weight Override">
        <p className="docs-text">When a question feeds multiple metrics, each metric applies its own dimension weights to extract the most relevant signal. For example, I1 feeds 5 metrics — M1 emphasises <code>sustainability</code> while M7 emphasises <code>organizational_reach</code>.</p>
      </SubSection>
    </Section>
  );
}

// ─── INTERDEPENDENCY MAP ───
function InterdependencyMap() {
  return (
    <Section id="interdependency" title="Interdependency Map" subtitle="Cross-question connections that drive pathology detection, contradiction flagging, and validation">
      <SubSection id="interdependency-pathology" title="Pathology Links">
        <p className="docs-text">Questions linked with <code>type: "pathology"</code> feed into pathology detection logic. When conditions across linked questions are met, a pathology flag is raised.</p>
      </SubSection>
      <SubSection id="interdependency-contradiction" title="Contradiction Links">
        <p className="docs-text">Questions linked with <code>type: "contradiction"</code> are checked for say-do gaps. A scale rating that contradicts a narrative response triggers a contradiction flag.</p>
        <Table
          headers={['Primary', 'Linked', 'Flag Condition']}
          rows={[
            ['C3 (safety rating)', 'C1 (mistake response)', 'C3≥80 but C1 shows blame/hiding'],
            ['S3a (escalation ease)', 'C1 (mistake response)', 'S3a≥80 but C1 shows blame'],
            ['M4 (cross-team)', 'M1 (info discussion)', 'M4≥80 but M1 describes isolation'],
            ['I4 (changes stick)', 'I1 (change example)', 'I4≥80 but I1 shows failure/stalled'],
            ['R3 (tech supports)', 'R1 (tool friction)', 'R3≥80 but R1 describes workarounds'],
            ['RA2 (risk response)', 'C1 (mistake response)', 'C1 shows blame but RA2 denies punishment'],
            ['OL1 (orphan handling)', 'OL2 (ownership speed)', 'OL1 shows long delay but OL2 claims fast'],
            ['X3b (exploration %)', 'R2 (external pilots)', 'X3b >20% but R2 shows limited engagement'],
            ['S3a (escalation)', 'C3 (safety)', 'Gap >20 points — escalation masks safety'],
          ]}
        />
      </SubSection>
      <SubSection id="interdependency-validation" title="Validation Links">
        <p className="docs-text">Questions linked with <code>type: "validation"</code> cross-check claims against evidence. Used for confidence scoring, not flag generation.</p>
      </SubSection>
    </Section>
  );
}

// ─── PATHOLOGY DETECTION ───
function PathologyDetection() {
  const pathologies = [
    ['1', 'Safety Crisis', 'CRITICAL', 'C1=BLAME AND C3<3 AND S3a<3', 'C1, C3, S3a'],
    ['2', 'Power Block', 'CRITICAL', 'PB1=repeated informal veto AND C3<4 AND I4<3', 'PB1, C3, I4'],
    ['3', 'Implementation Gap', 'CRITICAL', 'Leadership-frontline gap >1.5 on C3 OR I4', 'B1, C3, I4'],
    ['4', 'Risk Paralysis', 'HIGH', 'RA1<30 AND RA2=punish AND I2="approvals" AND C3<4', 'RA1, RA2, I2, C3'],
    ['5', 'Accountability Vacuum', 'HIGH', 'OL1="falls through" AND OL2>1wk AND I2="unclear ownership"', 'OL1, OL2, I2'],
    ['6', 'Optimization Lock', 'HIGH', 'X3a>80% AND X3b<10% AND B6≥Fast', 'X3a, X3b, B6'],
    ['7', 'Activity Without Impact', 'HIGH', 'X3b>20% AND I4<3', 'X3b, I4'],
  ];

  return (
    <Section id="pathology" title="Pathology Detection" subtitle="7 organisational pathologies with precise detection logic">
      <SubSection id="pathology-logic" title="Detection Logic">
        <Callout type="critical">
          All conditions must be met (AND logic). Condition matching: FULL = all conditions met = pathology triggered. PARTIAL = 2 of 3 = "Indicator" (planned).
        </Callout>
        <Table
          headers={['#', 'Client Name', 'Risk', 'Detection (ALL must met)', 'Questions']}
          rows={pathologies}
        />
      </SubSection>

      <SubSection id="pathology-indicators" title="Partial Indicators">
        <p className="docs-text">When a pathology meets 2 of 3 (or 3 of 4) conditions but does not fully trigger, it is displayed as an "Indicator" rather than a confirmed pathology. This adds diagnostic value without overclaiming.</p>
      </SubSection>

      <SubSection id="pathology-roadmaps" title="Recovery Roadmaps">
        <p className="docs-text">Each pathology has a phased 1/2/3 month recovery roadmap with specific actions. Stored in <code>data/training/pathology_roadmaps.json</code>. Injected into both the refinement prompt (for narrative generation) and the pathology detail page on the dashboard.</p>
      </SubSection>
    </Section>
  );
}

// ─── SAY-DO CHECKS ───
function SayDoChecks() {
  const patternChecks = [
    ['SAYDO-01', 'C3≥4 + C1=BLAME', 'Safety Crisis', 'YES'],
    ['SAYDO-02', 'S3a≥4 + C1=BLAME', 'Overconfidence', 'YES'],
    ['SAYDO-03', 'M4≥4 + M1=isolated', 'Frozen Middle', 'YES'],
    ['SAYDO-04', 'I4≥4 + I1=stalled', 'Activity w/o Impact', 'YES'],
    ['SAYDO-05', 'X4≥4 + I1/I2=slow', 'Execution Barrier', 'YES'],
    ['SAYDO-06', 'R3≥4 + R1=friction', 'Resource Gap', 'YES'],
    ['SAYDO-07', 'P4>FR by >1.5', 'Overconfidence', 'YES'],
    ['SAYDO-08', 'C3 level gap >1.5', 'Impl. Gap', 'NO (N>1)'],
    ['SAYDO-09', 'I4 level gap >1.5', 'Frozen Middle', 'NO (N>1)'],
    ['SAYDO-10', 'RA1<30 + RA2=punitive', 'Risk Paralysis', 'YES'],
  ];

  const crossChecks = [
    ['S3a vs C3', 'Both measure psychological safety', 'Difference >1 point'],
    ['C1 vs RA2', 'Both about response to failure', 'C1 "learning" but RA2 "punished"'],
    ['X3b vs R2', 'Both about exploration activity', 'X3b >20% but R2 no engagement'],
    ['M1 vs M4', 'Process vs effectiveness', 'M1 isolated but M4 ≥4'],
    ['I2 vs P2', 'Barriers should overlap', 'Completely different barriers cited'],
    ['OL1 vs OL2', 'Orphan handling vs speed', 'OL1 positive but OL2 "weeks"'],
  ];

  return (
    <Section id="saydo" title="Say-Do Contradiction Checks" subtitle="Detecting gaps between what people say and what the data shows">
      <SubSection id="saydo-pattern" title="Pattern Checks (SAYDO-01 to SAYDO-10)">
        <p className="docs-text">Each check compares a scale rating against narrative content. A high self-rating that contradicts the qualitative evidence is flagged.</p>
        <Table
          headers={['Flag', 'Trigger', 'Pathology', 'Active N=1?']}
          rows={patternChecks}
        />
      </SubSection>

      <SubSection id="saydo-crossq" title="Cross-Question Consistency Checks (6)">
        <p className="docs-text">All active for N=1. These compare two related questions that should align.</p>
        <Table
          headers={['Pair', 'Expected Alignment', 'Flag If']}
          rows={crossChecks}
        />
      </SubSection>

      <SubSection id="saydo-n1" title="Single-Respondent Rules">
        <Callout type="warning">
          For N=1: SAYDO-01 through SAYDO-07 and SAYDO-10 are ACTIVE. All cross-question checks are ACTIVE. Only SAYDO-08 and SAYDO-09 (level-based triangulation) are suppressed.
        </Callout>
        <p className="docs-text">Dashboard shows: "Level-based triangulation requires responses from more than one organisational level. Within-respondent contradiction checks are active below."</p>
      </SubSection>
    </Section>
  );
}

// ─── QUADRANT CLASSIFICATION ───
function QuadrantClassification() {
  return (
    <Section id="quadrant" title="Quadrant Classification" subtitle="2×2 matrix based on Operational Strength (M1) and Future Readiness (M2)">
      <Formula>Threshold: M1 and M2 compared against configurable cutoff (currently ≥65)</Formula>
      <Table
        headers={['Quadrant', 'Condition', 'Tone']}
        rows={[
          ['Adaptive Leader', 'M1 ≥ threshold AND M2 ≥ threshold', 'Respectful, nuanced — surface tensions beneath strength'],
          ['Solid Performer', 'M1 ≥ threshold AND M2 < threshold', 'Direct, urgent — validate achievement then pivot to risk'],
          ['Scattered Experimenter', 'M1 < threshold AND M2 ≥ threshold', 'Validating but grounding — show execution gap'],
          ['At-Risk', 'M1 < threshold AND M2 < threshold', 'Compassionate, unflinching — focus on actionable starting point'],
        ]}
      />
      <Callout type="info">
        Borderline detection: when either score falls within ±5 of the threshold, the report acknowledges classification ambiguity.
      </Callout>
    </Section>
  );
}

// ─── TRAINING DATA BANK ───
function TrainingDataBank() {
  const files = [
    ['historical_cases.json', '10 cases', 'Real-world pathology examples (IBM, Nokia, Kodak, Challenger, etc.)'],
    ['scoring_signals.json', '15 questions', 'Per-dimension keywords and signal phrases for each scoring level'],
    ['calibration_examples.json', '15 questions', 'Good/bad scoring examples for AI calibration'],
    ['sector_norms.json', '6 industries', 'Industry-specific Run/Transform norms, pathology patterns, risk framing'],
    ['executive_summary_examples.json', '8 examples', 'Per-quadrant narrative examples + 10 golden rules + 8 pathology templates'],
    ['say_do_gap_examples.json', '4 examples', 'Good/bad say-do gap narrative examples with "why it fails"'],
    ['recommendation_examples.json', '4 quadrants', 'Monday Morning Test good/bad examples per quadrant'],
    ['pathology_roadmaps.json', '8 roadmaps', 'Phased 1/2/3 month recovery plans per pathology'],
    ['label_translations.json', '45 mappings', 'Academic term → client-facing plain language equivalents'],
    ['score_ceilings.json', '7 rules', 'Hard score ceiling conditions and values'],
  ];

  return (
    <Section id="training" title="Training Data Bank" subtitle="Structured reference data for AI calibration — all stored in data/training/">
      <Table
        headers={['File', 'Content', 'Description']}
        rows={files}
      />
      <SubSection id="training-cases" title="Historical Cases">
        <p className="docs-text">10 real-world cases mapped to CABAS pathologies. Used as anchor statements in pathology descriptions and AI calibration.</p>
        <Table
          headers={['Case', 'Pathology', 'Key Lesson']}
          rows={[
            ['IBM pre-1990s', 'Optimization Lock', 'Competence became the source of blindness'],
            ['DEC', 'Accountability Vacuum', 'Strong culture ≠ readiness. Independence prevented coordination'],
            ['Argyris Military Team', 'Safety Crisis', 'Espoused theory vs theory-in-use — the invisible gap'],
            ['AutoCo (Car Launch)', 'Activity Without Impact', 'Concealment was culturally logical, not dishonest'],
            ['Nokia 2007', 'Implementation Gap', 'Middle management filtered signals before they reached the top'],
            ['Kodak 1975-2012', 'Optimization Lock', 'Success made reallocation feel irrational at every decision point'],
            ['Challenger 1986', 'Safety Crisis', 'Information was present, structure made it impossible to act'],
            ['Columbia 2003', 'Activity Without Impact', 'More processes ≠ better decisions'],
            ['Bay of Pigs 1961', 'Risk Paralysis', 'Unanimous support for a plan nobody privately believed would work'],
            ['Titanic 1912', 'Accountability Vacuum', '6 warnings received, 0 converted to action — no owner in the chain'],
          ]}
        />
      </SubSection>
      <SubSection id="training-signals" title="Scoring Signals"><p className="docs-text">Per-dimension signal phrases for each scoring level. Loaded into the scoring prompt to help the LLM calibrate.</p></SubSection>
      <SubSection id="training-calibration" title="Calibration Examples"><p className="docs-text">Per-question scoring examples showing how to apply the rubric. Includes dimension breakdown and reasoning.</p></SubSection>
      <SubSection id="training-sector" title="Sector Norms"><p className="docs-text">Industry-specific context: typical Run/Transform ratios, common pathology patterns, risk framing, and regulatory pressures.</p></SubSection>
      <SubSection id="training-exec" title="Executive Summary Examples"><p className="docs-text">8 examples (2 per quadrant) demonstrating Iva's expected tone, structure, and specificity. Plus 10 golden rules and 8 pathology statement templates.</p></SubSection>
      <SubSection id="training-saydo" title="Say-Do Gap Examples"><p className="docs-text">Good and bad examples of say-do gap narratives with explanations of why bad examples fail.</p></SubSection>
      <SubSection id="training-recs" title="Recommendation Examples"><p className="docs-text">Per-quadrant Monday Morning Test examples showing good (actionable) vs bad (vague/enterprise) recommendations.</p></SubSection>
      <SubSection id="training-roadmaps" title="Pathology Roadmaps"><p className="docs-text">Phased 1/2/3 month recovery plans for each of the 8 pathologies.</p></SubSection>
      <SubSection id="training-labels" title="Label Translations"><p className="docs-text">45 academic-to-plain-language mappings. No academic term may appear in client-facing output.</p></SubSection>
    </Section>
  );
}

// ─── REFINEMENT PIPELINE ───
function RefinementPipeline() {
  return (
    <Section id="refinement" title="Refinement Pipeline" subtitle="Stage 4: LLM-generated narratives, observations, and recommendations">
      <SubSection id="refinement-narratives" title="Metric Narratives">
        <p className="docs-text">14 metrics × 2 LLM calls each = 28 calls. Phase 1: Observation Mining (extract structured findings with verbatim quotes). Phase 2: Reasoning & Recommendations (business impact, recommendations, synthesised summary).</p>
      </SubSection>
      <SubSection id="refinement-observations" title="Observation Mining (Phase 1)">
        <p className="docs-text">Each metric is analysed through analytical lenses. For each lens, produce ONE structured observation with verbatim evidence quotes, sentiment, and severity assessment.</p>
        <Callout type="warning">Every quote must be copied EXACTLY from interview responses. Never paraphrase. Never cite procedural/navigation text.</Callout>
      </SubSection>
      <SubSection id="refinement-summary" title="Executive Summary (Call #15)">
        <p className="docs-text">Single LLM call synthesising all metric insights into a 150-250 word executive summary following the 10 Golden Rules.</p>
        <CodeBlock title="10 Golden Rules">
{`1. Lead with single most important finding + concrete number
2. Name the quadrant + explain in plain business language
3. State gap between strongest and weakest metric
4. Name pathologies immediately (or say "none detected")
5. End with commercial consequence of action vs inaction
6. SME role titles only (MD, Operations Manager — never COO/CIO)
7. Single-respondent caveat when N=1
8. Differentiate metric statuses (never same colour)
9. Every quote must be real respondent answer
10. 150-250 words — every word earns its place`}
        </CodeBlock>
      </SubSection>
      <SubSection id="refinement-actions" title="Recommendations">
        <p className="docs-text">3-5 prioritised actions. Every recommendation must pass the Monday Morning Test: could an SME leader start acting on it next Monday?</p>
      </SubSection>
    </Section>
  );
}

// ─── QUALITY GATE ───
function QualityGate() {
  return (
    <Section id="quality" title="Quality Gate" subtitle="Stage 5: Automated writing quality review — checks tone, not substance">
      <Callout type="critical">
        Quality reviewers NEVER change scores, pathology detections, metric values, or analytical findings. They only fix writing quality — tone, structure, terminology, specificity.
      </Callout>
      <SubSection id="quality-reviewers" title="Parallel Reviewers (5)">
        <Table
          headers={['Reviewer', 'Checks', 'Reference Data']}
          rows={[
            ['Executive Summary', '10 golden rules, quadrant tone, structure', 'executive_summary_examples.json'],
            ['Metric Narratives', 'Lead with insight, cite evidence, no filler', 'Rules-based (MN-1 to MN-5)'],
            ['Pathology Descriptions', 'Template compliance, data fill, evidence', 'Pathology statement templates'],
            ['Recommendations', 'Monday Morning Test, SME titles, actionability', 'recommendation_examples.json'],
            ['Say-Do Narratives', 'Quote quality, score connection, consequence', 'say_do_gap_examples.json'],
          ]}
        />
      </SubSection>
      <SubSection id="quality-rules" title="Rules Checker (Instant)">
        <p className="docs-text">Regex/string-based checks run before LLM reviewers. Zero latency, deterministic.</p>
        <Table
          headers={['Check', 'What it catches']}
          rows={[
            ['Banned terminology', '15+ academic terms that must never appear in output'],
            ['C-suite titles', 'COO, CIO, CLO, VP — must be SME titles'],
            ['Unfilled placeholders', '[X], [Y], [Z] template variables not replaced'],
            ['Voice artifacts', 'Transcription phrases cited as quotes'],
            ['Filler phrases', '"dynamic landscape", "it is important to note"'],
            ['Word count', 'Executive summary 150-250 words'],
            ['Single-respondent caveat', 'Missing N=1 disclosure'],
          ]}
        />
      </SubSection>
      <SubSection id="quality-fixer" title="Fix Loop">
        <p className="docs-text">When a reviewer returns NEEDS_FIX, a fixer agent rewrites only the failing section while preserving all analytical content. Max 2 iterations. Pre/post snapshots saved for comparison.</p>
      </SubSection>
    </Section>
  );
}

// ─── TERMINOLOGY MAP ───
function TerminologyMap() {
  const terms = [
    ['Technical Fitness', 'Operational Strength', 'Helfat & Peteraf'],
    ['Evolutionary Fitness', 'Future Readiness', 'Helfat & Peteraf'],
    ['Ambidexterity Balance', 'Run/Transform Balance', 'March (1991)'],
    ['Sensing', 'Market Radar', 'Teece (2007)'],
    ['Learning Effectiveness', 'Insight-to-Action', 'Argyris & Senge'],
    ['VRIN Competitive Advantage', 'Defensible Strengths', 'Barney RBV'],
    ['Execution Agility', 'Implementation Speed', 'Generic'],
    ['Information Flow Quality', 'Decision Flow', 'Generic'],
    ['Integration & Reuse', 'Knowledge Leverage', 'Generic'],
    ['Ownership Latency', 'Accountability Speed', 'Generic'],
    ['Organizational Readiness', 'Change Readiness', 'Generic'],
    ['Organizational Design', 'Structure Fitness', 'Generic'],
    ['Resource Availability', 'Capacity & Tools', 'Generic'],
    ['Risk Appetite', 'Risk Tolerance', 'Mission Command'],
    ['MIATM', '[Never mention]', 'Internal framework'],
  ];

  return (
    <Section id="terminology" title="Terminology Map" subtitle="No academic term may appear in ANY client-facing output">
      <Callout type="critical">
        This is a hard rule. The quality gate checks for banned terms automatically. Any violation is flagged as critical.
      </Callout>
      <Table
        headers={['Prohibited (Academic)', 'Use This (Client-Facing)', 'Source Theory']}
        rows={terms}
      />
    </Section>
  );
}
