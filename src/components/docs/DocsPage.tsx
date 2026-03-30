import { useState, useEffect } from 'react';
import './DocsPage.css';

// ─── API ───
const DOCS_API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

function useDocsData<T>(endpoint: string): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${DOCS_API}/admin/docs/${endpoint}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [endpoint]);
  return { data, loading };
}

// ─── NAV STRUCTURE ───
const GROUPS = [
  { id: 'intro', label: 'Introduction' },
  { id: 'questions', label: 'Questions' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'refinement', label: 'Refinement' },
  { id: 'quality-gate', label: 'Quality Gate' },
  { id: 'reference', label: 'Reference' },
];

interface PageDef {
  id: string;
  label: string;
  group: string;
}

const PAGES: PageDef[] = [
  { id: 'welcome', label: 'Welcome', group: 'intro' },
  { id: 'architecture', label: 'Pipeline & Architecture', group: 'intro' },
  { id: 'q-data', label: 'Question Data', group: 'questions' },
  { id: 'q-scoring', label: 'Scoring', group: 'questions' },
  { id: 'q-ceilings', label: 'Ceilings', group: 'questions' },
  { id: 'q-saydo', label: 'Say-Do Checks', group: 'questions' },
  { id: 'q-pathologies', label: 'Pathology Detection', group: 'questions' },
  { id: 'q-validation', label: 'Validation & Context', group: 'questions' },
  { id: 'm-formulas', label: 'Data & Formulas', group: 'metrics' },
  { id: 'm-observations', label: 'Observations', group: 'metrics' },
  { id: 'm-narratives', label: 'Narratives', group: 'metrics' },
  { id: 'r-summary', label: 'Executive Summary', group: 'refinement' },
  { id: 'r-quadrant', label: 'Quadrant Classification', group: 'refinement' },
  { id: 'r-actions', label: 'Recommendations', group: 'refinement' },
  { id: 'qg-reviewers', label: 'Reviewers', group: 'quality-gate' },
  { id: 'qg-rules', label: 'Rules Checker', group: 'quality-gate' },
  { id: 'qg-fixer', label: 'Fix Loop', group: 'quality-gate' },
  { id: 'ref-training', label: 'Training Data', group: 'reference' },
  { id: 'ref-terminology', label: 'Terminology Map', group: 'reference' },
];

// ═══════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`dc-card ${className}`}>{children}</div>;
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'green' | 'amber' | 'red' | 'blue' }) {
  return <span className={`dc-badge dc-badge--${variant}`}>{children}</span>;
}

function Info({ type = 'note', title, children }: { type?: 'note' | 'warning' | 'danger' | 'tip'; title?: string; children: React.ReactNode }) {
  const icons: Record<string, string> = { note: '💡', warning: '⚠️', danger: '🚨', tip: '✨' };
  return (
    <div className={`dc-info dc-info--${type}`}>
      <div className="dc-info-header"><span>{icons[type]}</span><span className="dc-info-title">{title || type.charAt(0).toUpperCase() + type.slice(1)}</span></div>
      <div className="dc-info-body">{children}</div>
    </div>
  );
}

function Table({ headers, rows, compact }: { headers: string[]; rows: (string | JSX.Element)[][]; compact?: boolean }) {
  return (
    <div className="dc-table-wrap">
      <table className={`dc-table ${compact ? 'dc-table--compact' : ''}`}>
        <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Code({ title, children }: { title?: string; children: string }) {
  return (
    <div className="dc-code">
      {title && <div className="dc-code-header"><span className="dc-code-title">{title}</span></div>}
      <pre><code>{children}</code></pre>
    </div>
  );
}

function Formula({ label, children }: { label?: string; children: string }) {
  return (
    <div className="dc-formula">
      {label && <div className="dc-formula-label">{label}</div>}
      <div className="dc-formula-expr">{children}</div>
    </div>
  );
}

function Steps({ steps }: { steps: { title: string; desc: string }[] }) {
  return (
    <div className="dc-steps">
      {steps.map((s, i) => (
        <div key={i} className="dc-step">
          <div className="dc-step-num">{i + 1}</div>
          <div className="dc-step-body">
            <div className="dc-step-title">{s.title}</div>
            <div className="dc-step-desc">{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Hero({ badge, badgeVariant, title, subtitle }: { badge: string; badgeVariant?: 'default' | 'green' | 'amber' | 'red' | 'blue'; title: string; subtitle: string }) {
  return (
    <div className="dc-page-hero">
      <Badge variant={badgeVariant}>{badge}</Badge>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: WELCOME
// ═══════════════════════════════════════════════════════════
function PageWelcome() {
  return (
    <div className="dc-page">
      <div className="dc-welcome">
        <div className="dc-welcome-badge">Technical Documentation</div>
        <h1 className="dc-welcome-title">Welcome to the<br /><span>Engine Room</span></h1>
        <p className="dc-welcome-subtitle">
          This is the complete technical reference for the CABAS® organisational assessment platform.
          Every formula, every weight, every rubric, every interdependency — documented from first principles.
        </p>
        <div className="dc-welcome-gif">
          <img src="/engine-room.gif" alt="Engine Room" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      </div>

      <div className="dc-welcome-grid">
        <Card>
          <div className="dc-welcome-card-icon">📋</div>
          <h3>Questions</h3>
          <p className="dc-text-muted">28 questions, 4 types. How each is scored, ceiling rules, and every cross-question interdependency.</p>
        </Card>
        <Card>
          <div className="dc-welcome-card-icon">📊</div>
          <h3>Metrics</h3>
          <p className="dc-text-muted">14 core + 2 derived metrics. Exact formulas, question weights, observations, and narratives.</p>
        </Card>
        <Card>
          <div className="dc-welcome-card-icon">✍️</div>
          <h3>Refinement</h3>
          <p className="dc-text-muted">Executive summary, quadrant classification, recommendations — how the platform generates client-ready text.</p>
        </Card>
        <Card>
          <div className="dc-welcome-card-icon">🛡️</div>
          <h3>Quality Gate</h3>
          <p className="dc-text-muted">5 parallel reviewers, rules-based checks, and fix loops that ensure every report meets Iva's standards.</p>
        </Card>
      </div>

      <Info type="note" title="Single Source of Truth">
        Rubrics and training data shown in these docs are loaded live from the backend. What you see here is exactly what the AI uses.
      </Info>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: PIPELINE & ARCHITECTURE
// ═══════════════════════════════════════════════════════════
function PageArchitecture() {
  return (
    <div className="dc-page">
      <Hero badge="Architecture" badgeVariant="blue" title="Pipeline & Architecture" subtitle="5-stage evaluation pipeline transforms raw interview responses into a comprehensive diagnostic report." />

      <Card>
        <h3>System Flow</h3>
        <div className="dc-arch-flow">
          {[
            { icon: '🎤', label: 'Interview', desc: '28 questions answered' },
            { icon: '→', label: '', desc: '' },
            { icon: '🧠', label: 'Stage 1: Score', desc: 'AI scores open-ended\nDirect convert scale\nApply ceilings' },
            { icon: '→', label: '', desc: '' },
            { icon: '🔗', label: 'Stage 2: Check', desc: 'Say-Do contradictions\nPathology detection\nValidation checks' },
            { icon: '→', label: '', desc: '' },
            { icon: '📊', label: 'Stage 3: Calculate', desc: '14 core metrics\n2 derived metrics\nQuadrant classification' },
            { icon: '→', label: '', desc: '' },
            { icon: '✍️', label: 'Stage 4: Refine', desc: 'Observations per metric\nExec summary\nRecommendations' },
            { icon: '→', label: '', desc: '' },
            { icon: '🛡️', label: 'Stage 5: QA', desc: '5 parallel reviewers\nTerminology check\nFix loop (max 2)' },
          ].map((n, i) => (
            n.label === '' ? <div key={i} className="dc-arch-arrow">{n.icon}</div> :
            <div key={i} className="dc-arch-node">
              <div className="dc-arch-icon">{n.icon}</div>
              <div className="dc-arch-label">{n.label}</div>
              <div className="dc-arch-desc">{n.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3>Score Bands</h3>
        <p className="dc-text-muted">Every metric score maps to one of 5 health status tiers.</p>
        <Table headers={['Band', 'Range', 'Meaning']} rows={[
          [<Badge variant="green">Leading Strength</Badge>, '85–100', 'Genuine differentiator. Top 1-2 metrics only.'],
          [<Badge variant="green">Strong</Badge>, '70–84', 'Solid performance. Maintain investment.'],
          [<Badge variant="amber">Adequate</Badge>, '55–69', 'Functional but not competitive.'],
          [<Badge variant="amber">Watch Area</Badge>, '40–54', 'Below transformation readiness.'],
          [<Badge variant="red">Critical Gap</Badge>, '0–39', 'Below functioning threshold.'],
        ]} />
      </Card>

      <Card>
        <h3>Timing</h3>
        <Table compact headers={['Stage', 'Duration', 'LLM Calls']} rows={[
          ['Stage 1: Scoring', '~15s', '15 (open-ended only)'],
          ['Stage 2: Checks', '~2s', '0'],
          ['Stage 3: Metrics', '~1s', '0'],
          ['Stage 4: Refinement', '~60-80s', '29 (14×2 + 1 summary)'],
          ['Stage 5: Quality Gate', '~30-60s', '5 reviewers + fixers'],
        ]} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: QUESTION DATA
// ═══════════════════════════════════════════════════════════
function PageQuestionData() {
  return (
    <div className="dc-page">
      <Hero badge="Questions" badgeVariant="blue" title="Question Data" subtitle="28 questions across 4 types form the input to the evaluation pipeline." />

      <Card>
        <h3>Question Types</h3>
        <div className="dc-stat-grid">
          <div className="dc-stat"><div className="dc-stat-num">15</div><div className="dc-stat-label">Open-Ended</div><div className="dc-stat-desc">AI-scored with rubrics</div></div>
          <div className="dc-stat"><div className="dc-stat-num">8</div><div className="dc-stat-label">Scale 1–5</div><div className="dc-stat-desc">Direct: value × 20</div></div>
          <div className="dc-stat"><div className="dc-stat-num">2</div><div className="dc-stat-label">Percentage</div><div className="dc-stat-desc">Distance-from-ideal</div></div>
          <div className="dc-stat"><div className="dc-stat-num">3</div><div className="dc-stat-label">Select</div><div className="dc-stat-desc">Category-based</div></div>
        </div>
      </Card>

      <Card>
        <h3>Complete Question List</h3>
        <Table compact headers={['Code', 'Type', 'Summary', 'Primary Metric']} rows={[
          ['B1', 'Open', 'Role, level, tenure', 'Triangulation'],
          ['B2', 'Open', 'Team description, special skills', 'Defensible Strengths'],
          ['B5', 'Multi-select', 'What customers value most', 'Op. Strength'],
          ['B6', 'Single-select', 'Market change speed', 'Future Readiness'],
          ['M1', 'Open', 'How you discuss/interpret info', 'Insight-to-Action'],
          ['M4', 'Scale 1-5', 'Cross-team conversation effectiveness', 'Structure Fitness'],
          ['S1', 'Open', 'Signals noticed and sources', 'Market Radar'],
          ['S3a', 'Scale 1-5', 'Ease of raising bad news/risks', 'Change Readiness'],
          ['S5', 'Scale 1-5', 'Organisation spots changes early', 'Future Readiness'],
          ['I1', 'Open', 'Example: learning → change', '5 Metrics'],
          ['I2', 'Open', 'Enablers and barriers', 'Impl. Speed'],
          ['I4', 'Scale 1-5', 'Changes implemented and stay', 'Op. Strength'],
          ['X3a', 'Percentage', '% time exploitation (run)', 'Run/Transform'],
          ['X3b', 'Percentage', '% time exploration (transform)', 'Run/Transform'],
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
        ]} />
      </Card>

      <Info type="tip" title="Scale Conversion">
        All 1-5 scale questions: <strong>Score = Scale × 20</strong>. No AI. 1→20, 2→40, 3→60, 4→80, 5→100.
      </Info>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: SCORING
// ═══════════════════════════════════════════════════════════
function PageScoring() {
  const { data: rubrics, loading } = useDocsData<Record<string, any>>('scoring-rubrics');
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const questionOrder = ['I1','R1','I2','M1','S1','C1','C2','C4','R2','B2','P2','RA1','RA2','OL1','OL2'];

  return (
    <div className="dc-page">
      <Hero badge="Questions" title="Scoring" subtitle="How each open-ended question is scored using AI with multi-dimension rubrics and BARS anchors." />

      <Card>
        <h3>Scoring Architecture</h3>
        <Steps steps={[
          { title: 'Load rubric', desc: 'Each of the 15 open-ended questions has a unique rubric with 3-5 scoring dimensions.' },
          { title: 'AI scores each dimension 1-5', desc: 'The LLM matches the response to the closest BARS anchor per dimension. Returns score, confidence, and reasoning.' },
          { title: 'Compute weighted average', desc: 'Overall = Σ(dimension_score × weight) ÷ Σ(weights). Levels 1-5 map to 20-100.' },
          { title: 'Apply ceiling if triggered', desc: 'Post-scoring: if a hard ceiling condition is met, the overall is capped. Dimension scores preserved.' },
        ]} />
        <Formula label="Overall Score">{'Σ (dimension_level × dimension_weight%) ÷ 100 × 20  →  0-100'}</Formula>
      </Card>

      <Card>
        <h3>Question Rubrics</h3>
        <p className="dc-text-muted">
          {loading ? 'Loading from backend...' : `${Object.keys(rubrics || {}).length} rubrics loaded. Click to expand.`}
        </p>
        {!loading && rubrics && (
          <div className="dc-rubric-list">
            {questionOrder.map(code => {
              const key = `q_cabas_${code.toLowerCase()}`;
              const r = rubrics[key];
              if (!r) return null;
              const qCode = r.question_code || code;
              const dims = r.dimensions || [];
              const isOpen = expandedQ === qCode;

              return (
                <div key={qCode} className={`dc-rubric ${isOpen ? 'dc-rubric--open' : ''}`}>
                  <button className="dc-rubric-header" onClick={() => setExpandedQ(isOpen ? null : qCode)}>
                    <div className="dc-rubric-code">{qCode}</div>
                    <div className="dc-rubric-meta">
                      <span className="dc-rubric-dims">{dims.length} dimensions</span>
                      <span className="dc-rubric-type">{r.scoring_type || 'dimensional'}</span>
                    </div>
                    <svg className={`dc-rubric-chevron ${isOpen ? 'dc-rubric-chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {isOpen && (
                    <div className="dc-rubric-body">
                      <div className="dc-rubric-formula">
                        <span className="dc-rubric-formula-label">Formula</span>
                        <span className="dc-rubric-formula-text">{dims.map((d: any) => `${d.id}(${d.weight}%)`).join(' + ')}</span>
                      </div>
                      {r.critical_flags && typeof r.critical_flags === 'object' && !Array.isArray(r.critical_flags) && Object.keys(r.critical_flags).length > 0 && (
                        <div className="dc-rubric-flags">
                          <div className="dc-rubric-flags-label">Critical Flags</div>
                          {Object.entries(r.critical_flags).map(([fid, f]: [string, any]) => (
                            <div key={fid} className="dc-rubric-flag">
                              <Badge variant="red">{fid}</Badge>
                              <span>{f.condition || String(f)}</span>
                              {f.max_score && <Badge variant="amber">max: {f.max_score}</Badge>}
                            </div>
                          ))}
                        </div>
                      )}
                      {dims.map((dim: any) => (
                        <div key={dim.id} className="dc-dimension">
                          <div className="dc-dimension-header">
                            <div className="dc-dimension-name">{dim.name}</div>
                            <Badge variant="blue">{dim.weight}%</Badge>
                          </div>
                          {dim.description && <p className="dc-dimension-desc">{dim.description}</p>}
                          <div className="dc-anchors">
                            {(dim.anchors || []).map((a: any) => (
                              <div key={a.level} className="dc-anchor">
                                <div className={`dc-anchor-level dc-anchor-level--${a.level}`}>{a.level}</div>
                                <div className="dc-anchor-range">{a.score_range}</div>
                                <div className="dc-anchor-behavior">{a.behavior}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Info type="danger" title="Critical Principle">
        Score what the organisation DOES, not how well the respondent describes it. Eloquence ≠ capability.
      </Info>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: CEILINGS
// ═══════════════════════════════════════════════════════════
function PageCeilings() {
  return (
    <div className="dc-page">
      <Hero badge="Questions" badgeVariant="amber" title="Hard Score Ceilings" subtitle="7 rules that cap inflated scores. Applied post-scoring, before metric calculation." />
      <Card>
        <h3>Ceiling Rules</h3>
        <p className="dc-text-muted">From the Master Brief Section 3. If a condition is met, the overall score is capped regardless of how high the AI scored the dimensions.</p>
        <Table headers={['Q', 'Ceiling', 'Condition', 'Metric']} rows={[
          ['S1', '≤ 60', 'Fewer than 4 of 5 signal types mentioned', 'Market Radar'],
          ['I1', '≤ 65', 'Compliance-driven/reactive, timeline >3 months', '5 metrics'],
          ['R1', '≤ 55', 'Workarounds, friction, or manual processes', 'Capacity & Tools'],
          ['C2', '≤ 55', 'Under 4 sentences, no specific examples', 'Change Readiness'],
          ['OL1', '≤ 45', 'Ownership delay >2 weeks in example', 'Accountability Speed'],
          ['I2', '≤ 55', 'Barriers >> enablers, approvals/bureaucracy', 'Impl. Speed'],
          ['C1', '≤ 60', 'Any blame/finger-pointing, even if learning followed', 'Change Readiness'],
        ]} />
      </Card>
      <Info type="warning" title="Ceilings Never Raise Scores">
        If the AI already scored below the ceiling, nothing changes. Dimension scores are preserved — only overall_score is capped.
      </Info>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: SAY-DO CHECKS
// ═══════════════════════════════════════════════════════════
function PageSayDo() {
  return (
    <div className="dc-page">
      <Hero badge="Questions" badgeVariant="amber" title="Say-Do Contradiction Checks" subtitle="Detecting gaps between what people say (ratings) and what the data shows (narrative evidence)." />
      <Card>
        <h3>Pattern Checks (SAYDO-01 to SAYDO-10)</h3>
        <Table headers={['Flag', 'Trigger', 'Link', 'N=1?']} rows={[
          ['SAYDO-01', 'C3≥4 + C1=BLAME', 'Safety Crisis', <Badge variant="green">YES</Badge>],
          ['SAYDO-02', 'S3a≥4 + C1=BLAME', 'Overconfidence', <Badge variant="green">YES</Badge>],
          ['SAYDO-03', 'M4≥4 + M1=isolated', 'Frozen Middle', <Badge variant="green">YES</Badge>],
          ['SAYDO-04', 'I4≥4 + I1=stalled', 'Activity w/o Impact', <Badge variant="green">YES</Badge>],
          ['SAYDO-05', 'X4≥4 + I1/I2=slow', 'Execution Barrier', <Badge variant="green">YES</Badge>],
          ['SAYDO-06', 'R3≥4 + R1=friction', 'Resource Gap', <Badge variant="green">YES</Badge>],
          ['SAYDO-07', 'P4 > FR by >1.5', 'Overconfidence', <Badge variant="green">YES</Badge>],
          ['SAYDO-08', 'C3 level gap >1.5', 'Impl. Gap', <Badge variant="red">NO (N&gt;1)</Badge>],
          ['SAYDO-09', 'I4 level gap >1.5', 'Frozen Middle', <Badge variant="red">NO (N&gt;1)</Badge>],
          ['SAYDO-10', 'RA1<30 + RA2=punitive', 'Risk Paralysis', <Badge variant="green">YES</Badge>],
        ]} />
      </Card>
      <Card>
        <h3>Cross-Question Consistency (6)</h3>
        <p className="dc-text-muted">All active for N=1.</p>
        <Table headers={['Pair', 'Alignment', 'Flag If']} rows={[
          ['S3a vs C3', 'Both measure safety', 'Gap > 1 point (>20 on 0-100)'],
          ['C1 vs RA2', 'Response to failure', 'C1 shows blame, RA2 denies punishment'],
          ['X3b vs R2', 'Exploration activity', 'X3b >20% but R2 limited pilots'],
          ['M1 vs M4', 'Process vs effectiveness', 'M1 isolated but M4 ≥4'],
          ['I2 vs P2', 'Barriers overlap', 'Completely different barriers'],
          ['OL1 vs OL2', 'Handling vs speed', 'OL1 long delay, OL2 claims fast'],
        ]} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: PATHOLOGY DETECTION
// ═══════════════════════════════════════════════════════════
function PagePathologies() {
  return (
    <div className="dc-page">
      <Hero badge="Questions" badgeVariant="red" title="Pathology Detection" subtitle="7 organisational pathologies with precise detection logic. All conditions must be met (AND)." />
      <Card>
        <h3>Detection Logic</h3>
        <Table headers={['#', 'Pathology', 'Risk', 'Conditions', 'Questions']} rows={[
          ['1', 'Safety Crisis', <Badge variant="red">CRITICAL</Badge>, 'C1=BLAME AND C3<3 AND S3a<3', 'C1, C3, S3a'],
          ['2', 'Power Block', <Badge variant="red">CRITICAL</Badge>, 'PB1=veto AND C3<4 AND I4<3', 'PB1, C3, I4'],
          ['3', 'Implementation Gap', <Badge variant="red">CRITICAL</Badge>, 'Leader-frontline gap >1.5 on C3 OR I4', 'B1, C3, I4'],
          ['4', 'Risk Paralysis', <Badge variant="amber">HIGH</Badge>, 'RA1<30 AND RA2=punish AND I2=approvals AND C3<4', 'RA1, RA2, I2, C3'],
          ['5', 'Accountability Vacuum', <Badge variant="amber">HIGH</Badge>, 'OL1=falls through AND OL2>1wk AND I2=unclear', 'OL1, OL2, I2'],
          ['6', 'Optimization Lock', <Badge variant="amber">HIGH</Badge>, 'X3a>80% AND X3b<10% AND B6≥Fast', 'X3a, X3b, B6'],
          ['7', 'Activity Without Impact', <Badge variant="amber">HIGH</Badge>, 'X3b>20% AND I4<3', 'X3b, I4'],
        ]} />
      </Card>
      <Card>
        <h3>Historical Anchors</h3>
        <Table compact headers={['Case', 'Year', 'Pathology', 'Lesson']} rows={[
          ['Challenger', '1986', 'Safety Crisis', 'Information present, structure blocked action'],
          ['Nokia', '2007', 'Implementation Gap', 'Middle management filtered signals'],
          ['Kodak', '1975-2012', 'Optimization Lock', 'Success made reallocation feel irrational'],
          ['Columbia', '2003', 'Activity Without Impact', 'More processes ≠ better decisions'],
          ['Bay of Pigs', '1961', 'Risk Paralysis', 'Unanimous support, nobody believed it would work'],
          ['Titanic', '1912', 'Accountability Vacuum', '6 warnings, 0 converted to action'],
          ['Enron', '2001', 'Power Block', 'Formal governance couldn\'t override informal power'],
        ]} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: VALIDATION & CONTEXT
// ═══════════════════════════════════════════════════════════
function PageValidation() {
  return (
    <div className="dc-page">
      <Hero badge="Questions" title="Validation & Context Links" subtitle="Cross-question links that validate claims and provide scoring context." />
      <Card>
        <h3>Validation Links</h3>
        <p className="dc-text-muted">Questions linked with type "validation" cross-check claims against evidence. Used for confidence scoring.</p>
        <Table headers={['Primary', 'Linked', 'Purpose']} rows={[
          ['C3', 'C1', 'C3 perception validated by C1 behaviour evidence'],
          ['R3', 'R1', 'R3 tech rating validated by R1 actual tool experience'],
          ['X4', 'I1', 'X4 agility claim validated by I1 change example'],
          ['B2', 'R2', 'B2 capability claims validated by R2 external engagement'],
        ]} />
      </Card>
      <Card>
        <h3>Context Links</h3>
        <p className="dc-text-muted">Questions linked with type "context" provide interpretive context for scoring another question.</p>
        <Table headers={['Primary', 'Linked', 'Context Provided']} rows={[
          ['B6', 'X3a/X3b', 'Market speed determines ideal Run/Transform ratio'],
          ['C4', 'C1', 'Cultural fragmentation contextualises blame patterns'],
          ['OL1', 'I4', 'Orphan problem patterns explain why changes don\'t stick'],
        ]} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: METRIC FORMULAS
// ═══════════════════════════════════════════════════════════
function PageMetricFormulas() {
  return (
    <div className="dc-page">
      <Hero badge="Metrics" badgeVariant="blue" title="Data & Formulas" subtitle="14 core + 2 derived metrics. Each is a weighted aggregation of question scores." />
      <Card>
        <h3>Core Metrics (M1–M14)</h3>
        <Table headers={['Code', 'Name', 'Formula']} rows={[
          ['M1', 'Operational Strength', 'I1(25%) + I4(30%) + X3a(20%) + R1(10%) + B5(15%CL)'],
          ['M2', 'Future Readiness', 'S5(25%) + I1(15%) + X4(15%) + B6(10%) + X3b(10%) + R2(10%) + S3a(10%)'],
          ['M3', 'Insight-to-Action', 'M1open(30%) + I1(25%) + C2(25%) + S1(20%)'],
          ['M4', 'Implementation Speed', 'M4scale(50%) + I2(30%) + X4(20%)'],
          ['M5', 'Market Radar', 'S1(50%) + S5(30%) + B6(20%)'],
          ['M6', 'Decision Flow', 'M1open(35%) + M4scale(50%) + R1(15%)'],
          ['M7', 'Knowledge Leverage', 'I1(100%) with per-metric dimension weights'],
          ['M8', 'Accountability Speed', 'OL1(40%) + OL2(40%) + I2(10%) + M4(10%)'],
          ['M9', 'Run/Transform Balance', 'X3a + X3b (distance-from-ideal with B6)'],
          ['M10', 'Change Readiness', 'C3(20%) + C1(20%) + S3a(15%) + I1(15%) + C2(15%) + I4(15%)'],
          ['M11', 'Structure Fitness', 'M4(30%) + C4(25%) + I4(20%) + I2(15%) + B5(10%CL)'],
          ['M12', 'Capacity & Tools', 'R1(60%) + R2(25%) + R3(15%)'],
          ['M13', 'Defensible Strengths', 'B2(20%) + B5(30%) + I1(25%) + R2(10%) + C1(15%)'],
          ['M14', 'Risk Tolerance', 'RA1(50%) + RA2(30%) + C3(20%)'],
        ]} />
      </Card>
      <Card>
        <h3>Derived Metrics</h3>
        <Formula label="D1 — OODA Velocity">{'(M5 + M6 + M8 + M4) ÷ 4'}</Formula>
        <Formula label="D2 — Resilience Index">{'(M12 + M10 + M3) ÷ 3'}</Formula>
        <p className="dc-text-muted">Simple averages. No LLM — calculated directly from core metric scores.</p>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: OBSERVATIONS
// ═══════════════════════════════════════════════════════════
function PageObservations() {
  return (
    <div className="dc-page">
      <Hero badge="Metrics" badgeVariant="green" title="Observations" subtitle="Phase 1 of per-metric refinement: structured findings mined from assessment data." />
      <Card>
        <h3>Observation Mining</h3>
        <p className="dc-text-muted">For each of the 14 core metrics, the AI analyses the data through analytical lenses and produces structured observations.</p>
        <Steps steps={[
          { title: 'Assign analytical lenses', desc: 'Each metric has 3-5 lenses (e.g., for M1: execution reliability, change implementation, process/tool enablement).' },
          { title: 'Mine one observation per lens', desc: 'Each observation includes: text finding, sentiment (positive/negative), severity scope, and severity urgency.' },
          { title: 'Attach verbatim evidence', desc: 'Every observation must include 1-3 EXACT quotes from interview responses. Never paraphrased.' },
        ]} />
      </Card>
      <Info type="danger" title="Quote Rule">
        Every quote must be copied EXACTLY from the interview. Never cite procedural text ("I'm ready", "go ahead"). Minimum 20 characters.
      </Info>
      <Card>
        <h3>Observation Structure</h3>
        <Code title="Observation Object">{`{
  lens_id: "execution_reliability",
  text: "Initial evidence points to...",
  sentiment: "negative",
  severity_scope: "org_wide",
  severity_urgency: "near_term_risk",
  evidence: [
    { quote: "verbatim respondent text", role: "Senior Manager", question_code: "I1" }
  ]
}`}</Code>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: NARRATIVES
// ═══════════════════════════════════════════════════════════
function PageNarratives() {
  return (
    <div className="dc-page">
      <Hero badge="Metrics" badgeVariant="green" title="Metric Narratives" subtitle="Phase 2: business impact analysis, recommendations, and synthesised summary per metric." />
      <Card>
        <h3>Reasoning & Recommendations</h3>
        <p className="dc-text-muted">After observations are mined (Phase 1), Phase 2 interprets them:</p>
        <Steps steps={[
          { title: 'Business impact per observation', desc: 'One sentence explaining what this means for the business. Confidence rating (high/medium/low).' },
          { title: '1-3 recommendations per metric', desc: 'Concrete actions that pass the Monday Morning Test. With evidence anchors and linked observation lens IDs.' },
          { title: 'Synthesised impact paragraph', desc: 'Connects all observations into a coherent narrative about root causes and systemic patterns.' },
          { title: 'Summary (1-2 sentences)', desc: 'Executive-level takeaway for this metric. Leads with insight, not context.' },
        ]} />
      </Card>
      <Card>
        <h3>Writing Rules</h3>
        <Table compact headers={['Rule', 'Description']} rows={[
          ['MN-1', 'Lead with insight, not business context — reader knows their industry'],
          ['MN-2', 'Cite specific scores, question codes, and evidence'],
          ['MN-3', 'No generic filler ("dynamic landscape", "it is important to note")'],
          ['MN-4', 'Root causes and systemic patterns, not surface symptoms'],
          ['MN-5', 'Second-person language: "Your teams", "Your organisation"'],
        ]} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: EXECUTIVE SUMMARY
// ═══════════════════════════════════════════════════════════
function PageExecSummary() {
  return (
    <div className="dc-page">
      <Hero badge="Refinement" badgeVariant="blue" title="Executive Summary" subtitle="The single most important output. 150-250 words synthesising the entire assessment." />
      <Card>
        <h3>10 Golden Rules</h3>
        <Code title="Executive Summary Rules">{`1. Lead with single most important finding + concrete number
2. Name the quadrant + explain in plain business language
3. State gap between strongest and weakest metric
4. Name pathologies immediately (or say "none detected")
5. End with commercial consequence of action vs inaction
6. SME role titles only (MD, Operations Manager — never COO/CIO)
7. Single-respondent caveat when N=1
8. Differentiate metric statuses (never paint all same colour)
9. Every quote must be real respondent answer
10. 150-250 words — every word earns its place`}</Code>
      </Card>
      <Card>
        <h3>Quadrant-Specific Tone</h3>
        <Table headers={['Quadrant', 'Tone Guidance']} rows={[
          ['Adaptive Leader', 'Respectful, nuanced — surface tensions beneath strength. Never complacent.'],
          ['Solid Performer', 'Direct, urgent — validate achievement then pivot hard to the risk.'],
          ['Scattered Experimenter', 'Validating but grounding — show execution gap without dismissing innovation.'],
          ['At-Risk', 'Compassionate, unflinching — never hopeless. Focus on actionable starting point.'],
        ]} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: QUADRANT
// ═══════════════════════════════════════════════════════════
function PageQuadrant() {
  return (
    <div className="dc-page">
      <Hero badge="Refinement" badgeVariant="green" title="Quadrant Classification" subtitle="2×2 matrix based on Operational Strength (M1) and Future Readiness (M2)." />
      <Card>
        <div className="dc-quadrant-grid">
          <div className="dc-quadrant dc-quadrant--tl"><div className="dc-quadrant-label">Scattered Experimenter</div><div className="dc-quadrant-cond">Low OS + High FR</div><div className="dc-quadrant-tone">Vision exists. Operational infrastructure missing.</div></div>
          <div className="dc-quadrant dc-quadrant--tr"><div className="dc-quadrant-label">Adaptive Leader</div><div className="dc-quadrant-cond">High OS + High FR</div><div className="dc-quadrant-tone">Formalise what works before you scale.</div></div>
          <div className="dc-quadrant dc-quadrant--bl"><div className="dc-quadrant-label">At-Risk</div><div className="dc-quadrant-cond">Low OS + Low FR</div><div className="dc-quadrant-tone">Both gaps present. Investment at serious risk.</div></div>
          <div className="dc-quadrant dc-quadrant--br"><div className="dc-quadrant-label">Solid Performer</div><div className="dc-quadrant-cond">High OS + Low FR</div><div className="dc-quadrant-tone">Current success may be masking vulnerability.</div></div>
        </div>
        <Formula label="Threshold">{'High ≥ configurable threshold | Low < threshold'}</Formula>
      </Card>
      <Info type="note">Borderline: when either score falls within ±5 of threshold, the report acknowledges classification ambiguity.</Info>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════
function PageRecommendations() {
  return (
    <div className="dc-page">
      <Hero badge="Refinement" badgeVariant="amber" title="Recommendations" subtitle="3-5 prioritised actions. Every one must pass the Monday Morning Test." />
      <Card>
        <h3>The Monday Morning Test</h3>
        <p className="dc-text-muted">Could an SME leader (MD, Operations Manager) start acting on this NEXT MONDAY? If not, it's too vague.</p>
        <Table headers={['', 'Good', 'Bad']} rows={[
          ['Example', '"This week, ask each direct report: What stops you doing your best work? Write down the answers."', '"Conduct comprehensive organizational capability audit. Owner: Chief Transformation Officer. Timeline: 120 days."'],
          ['Why', 'Specific, first step is clear, owner is SME role', 'Abstract, no Monday action, enterprise title, too long'],
        ]} />
      </Card>
      <Card>
        <h3>Required Fields</h3>
        <Table compact headers={['Field', 'Description']} rows={[
          ['title', 'Verb-led, specific, scoped to org size'],
          ['why_this_action', 'One sentence linking to specific metric/pathology'],
          ['owner', 'SME title (MD, Operations Manager — never COO)'],
          ['success_signal', 'Measurable indicator within timeframe'],
          ['evidence', 'Respondent quote supporting this action'],
        ]} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: QG REVIEWERS
// ═══════════════════════════════════════════════════════════
function PageQGReviewers() {
  return (
    <div className="dc-page">
      <Hero badge="Quality Gate" badgeVariant="red" title="Parallel Reviewers" subtitle="5 reviewers check writing quality. They NEVER change scores or findings — only writing." />
      <Card>
        <Table headers={['Reviewer', 'Checks', 'Reference Data']} rows={[
          ['Executive Summary', '10 golden rules + quadrant tone', 'executive_summary_examples.json'],
          ['Metric Narratives', 'Insight-led, evidence-cited, no filler', 'Rules MN-1 to MN-5'],
          ['Pathology Descriptions', 'Template compliance, data fill', 'Pathology statement templates'],
          ['Recommendations', 'Monday Morning Test, SME titles', 'recommendation_examples.json'],
          ['Say-Do Narratives', 'Quote quality, score connection', 'say_do_gap_examples.json'],
        ]} />
      </Card>
      <Info type="danger" title="Substance is Read-Only">
        Reviewers NEVER suggest changing scores, pathology detections, metric values, or analytical conclusions. They only fix tone, structure, terminology, specificity.
      </Info>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: QG RULES
// ═══════════════════════════════════════════════════════════
function PageQGRules() {
  return (
    <div className="dc-page">
      <Hero badge="Quality Gate" title="Rules Checker" subtitle="Instant, deterministic checks. No LLM needed. Runs before reviewers." />
      <Card>
        <Table headers={['Check', 'Catches']} rows={[
          ['Banned terminology', '15+ academic terms (VRIN, Ambidexterity, etc.)'],
          ['C-suite titles', 'COO, CIO, CLO, VP → must be SME titles'],
          ['Unfilled placeholders', '[X], [Y], [Z] not replaced with data'],
          ['Voice artifacts', 'Transcription phrases cited as quotes'],
          ['Filler phrases', '"dynamic landscape", "it is important to note"'],
          ['Word count', 'Executive summary 150-250 words'],
          ['N=1 caveat', 'Missing single-respondent disclosure'],
        ]} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: QG FIX LOOP
// ═══════════════════════════════════════════════════════════
function PageQGFixer() {
  return (
    <div className="dc-page">
      <Hero badge="Quality Gate" title="Fix Loop" subtitle="When a reviewer flags issues, a fixer rewrites only the failing section." />
      <Card>
        <Steps steps={[
          { title: 'Reviewer returns NEEDS_FIX', desc: 'With specific violations: rule_id, what\'s wrong, suggested fix.' },
          { title: 'Fixer rewrites section', desc: 'Preserves ALL analytical content. Only changes writing quality.' },
          { title: 'Re-review', desc: 'Fixed section goes back through the reviewer.' },
          { title: 'Max 2 iterations', desc: 'If still failing after 2 fixes, flag for human review but release report.' },
        ]} />
      </Card>
      <Card>
        <h3>Pre/Post Snapshots</h3>
        <p className="dc-text-muted">Both the original text (pre-quality) and the fixed text (post-quality) are saved. This lets you compare what the quality gate changed and identify upstream prompt improvements needed.</p>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: TRAINING DATA
// ═══════════════════════════════════════════════════════════
function PageTrainingData() {
  return (
    <div className="dc-page">
      <Hero badge="Reference" title="Training Data Bank" subtitle="10 JSON files in data/training/ provide structured reference data for AI calibration." />
      <Card>
        <Table headers={['File', 'Content', 'Used By']} rows={[
          ['historical_cases.json', '10 pathology cases', 'Pathology checker + refinement'],
          ['scoring_signals.json', 'Per-dimension keywords', 'Question scoring prompt'],
          ['calibration_examples.json', 'Good/bad scoring examples', 'Question scoring prompt'],
          ['sector_norms.json', '6 industry profiles', 'Refinement context'],
          ['executive_summary_examples.json', '8 examples + 10 rules + 8 templates', 'Report summary'],
          ['say_do_gap_examples.json', 'Good/bad contradiction narratives', 'Quality gate'],
          ['recommendation_examples.json', 'Monday Morning Test per quadrant', 'Quality gate'],
          ['pathology_roadmaps.json', '8 phased 1/2/3 month plans', 'Refinement + dashboard'],
          ['label_translations.json', '45 term translations', 'All output'],
          ['score_ceilings.json', '7 ceiling rules', 'Post-scoring'],
        ]} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: TERMINOLOGY
// ═══════════════════════════════════════════════════════════
function PageTerminology() {
  return (
    <div className="dc-page">
      <Hero badge="Reference" badgeVariant="red" title="Terminology Map" subtitle="No academic term may appear in ANY client-facing output." />
      <Card>
        <Table headers={['Prohibited', 'Use This', 'Source']} rows={[
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
          ['MIATM', '[Never mention]', 'Internal only'],
        ]} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE REGISTRY
// ═══════════════════════════════════════════════════════════
const PAGE_COMPONENTS: Record<string, () => JSX.Element> = {
  'welcome': PageWelcome,
  'architecture': PageArchitecture,
  'q-data': PageQuestionData,
  'q-scoring': PageScoring,
  'q-ceilings': PageCeilings,
  'q-saydo': PageSayDo,
  'q-pathologies': PagePathologies,
  'q-validation': PageValidation,
  'm-formulas': PageMetricFormulas,
  'm-observations': PageObservations,
  'm-narratives': PageNarratives,
  'r-summary': PageExecSummary,
  'r-quadrant': PageQuadrant,
  'r-actions': PageRecommendations,
  'qg-reviewers': PageQGReviewers,
  'qg-rules': PageQGRules,
  'qg-fixer': PageQGFixer,
  'ref-training': PageTrainingData,
  'ref-terminology': PageTerminology,
};

// ═══════════════════════════════════════════════════════════
// MAIN DOCS COMPONENT
// ═══════════════════════════════════════════════════════════
export function DocsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('docs-theme') as 'light' | 'dark') || 'light'
  );
  const [activePage, setActivePage] = useState('welcome');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => { localStorage.setItem('docs-theme', theme); }, [theme]);

  const currentIndex = PAGES.findIndex(p => p.id === activePage);
  const prevPage = currentIndex > 0 ? PAGES[currentIndex - 1] : null;
  const nextPage = currentIndex < PAGES.length - 1 ? PAGES[currentIndex + 1] : null;
  const Content = PAGE_COMPONENTS[activePage] || PageWelcome;

  const navigate = (id: string) => {
    setActivePage(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`dc ${theme}`} data-theme={theme}>
      <header className="dc-header">
        <div className="dc-header-left">
          <button className="dc-icon-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="dc-brand">
            <span className="dc-brand-mark">C</span>
            <span className="dc-brand-text">CABAS<sup>®</sup></span>
            <span className="dc-brand-sep">/</span>
            <span className="dc-brand-sub">Docs</span>
          </div>
        </div>
        <div className="dc-header-right">
          <Badge>v2.2</Badge>
          <button className="dc-icon-btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <div className="dc-layout">
        <aside className={`dc-sidebar ${sidebarOpen ? '' : 'dc-sidebar--closed'}`}>
          <nav>
            {GROUPS.map(g => (
              <div key={g.id} className="dc-nav-group">
                <div className="dc-nav-group-label">{g.label}</div>
                {PAGES.filter(p => p.group === g.id).map(p => (
                  <button key={p.id} className={`dc-nav-link ${activePage === p.id ? 'dc-nav-link--active' : ''}`} onClick={() => navigate(p.id)}>
                    {p.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className={`dc-main ${sidebarOpen ? '' : 'dc-main--full'}`}>
          <Content />
          <div className="dc-page-nav">
            {prevPage ? (
              <button className="dc-page-nav-btn dc-page-nav-btn--prev" onClick={() => navigate(prevPage.id)}>
                <span className="dc-page-nav-dir">← Previous</span>
                <span className="dc-page-nav-label">{prevPage.label}</span>
              </button>
            ) : <div />}
            {nextPage ? (
              <button className="dc-page-nav-btn dc-page-nav-btn--next" onClick={() => navigate(nextPage.id)}>
                <span className="dc-page-nav-dir">Next →</span>
                <span className="dc-page-nav-label">{nextPage.label}</span>
              </button>
            ) : <div />}
          </div>
        </main>
      </div>
    </div>
  );
}
