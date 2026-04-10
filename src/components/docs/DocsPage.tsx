import { useState, useEffect } from 'react';
import './DocsPage.css';
import { RubricEditor } from './RubricEditor';
import './RubricEditor.css';
import { BusinessCasesPanel } from './BusinessCasesPanel';
import './BusinessCasesPanel.css';

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
  { id: 'q-signals', label: 'Scoring Signals', group: 'questions' },
  { id: 'q-calibration', label: 'Calibration Examples', group: 'questions' },
  { id: 'q-playground', label: '✨ Playground', group: 'questions' },
  { id: 'q-ceilings', label: 'Ceilings', group: 'questions' },
  { id: 'q-saydo', label: 'Say-Do Checks', group: 'questions' },
  { id: 'q-pathologies', label: 'Pathology Detection', group: 'questions' },
  { id: 'q-validation', label: 'Validation & Context', group: 'questions' },
  { id: 'm-formulas', label: 'Data & Formulas', group: 'metrics' },
  { id: 'm-detail', label: 'Metric Detail', group: 'metrics' },
  { id: 'm-lenses', label: 'Observation Lenses', group: 'metrics' },
  { id: 'm-observations', label: 'Observations', group: 'metrics' },
  { id: 'm-narratives', label: 'Narratives', group: 'metrics' },
  { id: 'r-summary', label: 'Executive Summary', group: 'refinement' },
  { id: 'r-quadrant', label: 'Quadrant Classification', group: 'refinement' },
  { id: 'r-actions', label: 'Recommendations', group: 'refinement' },
  { id: 'r-issues', label: 'Critical Issues & Strengths', group: 'refinement' },
  { id: 'r-crossmetric', label: 'Cross-Metric Insights', group: 'refinement' },
  { id: 'r-vrin', label: 'VRIN Assessment', group: 'refinement' },
  { id: 'r-sector', label: 'Sector Context', group: 'refinement' },
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

function Table({ headers, rows, compact }: { headers: string[]; rows: (string | React.ReactNode)[][]; compact?: boolean }) {
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
        <div className="dc-welcome-engine">
          <img src="/engineroom.gif" alt="Engine Room" />
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
  const { data: questions, loading } = useDocsData<any[]>('questions');
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const typeColor: Record<string, 'blue' | 'green' | 'amber' | 'red'> = {
    open: 'blue', scale: 'green', percentage: 'amber', single_select: 'red', multi_select: 'red',
  };

  return (
    <div className="dc-page">
      <Hero badge="Questions" badgeVariant="blue" title="Question Data" subtitle="28 questions across 4 types. Click any question to see the full text asked to respondents." />

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
        <h3>All Questions</h3>
        <p className="dc-text-muted">{loading ? 'Loading...' : `${questions?.length || 0} questions loaded. Click to view full text.`}</p>
        {!loading && questions && (
          <div className="dc-rubric-list">
            {questions.map((q: any) => {
              const isOpen = expandedQ === q.code;
              return (
                <div key={q.code} className={`dc-rubric ${isOpen ? 'dc-rubric--open' : ''}`}>
                  <button className="dc-rubric-header" onClick={() => setExpandedQ(isOpen ? null : q.code)}>
                    <div className="dc-rubric-code">{q.code}</div>
                    <div className="dc-rubric-meta">
                      <Badge variant={typeColor[q.type] || 'default'}>{q.type}</Badge>
                      <span className="dc-rubric-dims">{q.aspect || ''}</span>
                    </div>
                    <svg className={`dc-rubric-chevron ${isOpen ? 'dc-rubric-chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {isOpen && (
                    <div className="dc-rubric-body">
                      <div className="dc-question-text">{q.text}</div>
                      {q.options && q.options.length > 0 && (
                        <div className="dc-question-options">
                          <div className="dc-rubric-formula-label">Options</div>
                          {q.options.map((opt: any, i: number) => (
                            <div key={i} className="dc-question-option">
                              {typeof opt === 'string' ? opt : opt.label || opt.text || JSON.stringify(opt)}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.scale && Object.keys(q.scale).length > 0 && (
                        <div className="dc-question-options">
                          <div className="dc-rubric-formula-label">Scale</div>
                          {Object.entries(q.scale).map(([k, v]: [string, any]) => (
                            <div key={k} className="dc-question-option">{k}: {typeof v === 'string' ? v : JSON.stringify(v)}</div>
                          ))}
                        </div>
                      )}
                      {q.purpose && (
                        <div className="dc-question-purpose">
                          <div className="dc-rubric-formula-label">Purpose</div>
                          <div>{q.purpose}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: SCORING
// ═══════════════════════════════════════════════════════════
function PageScoring() {
  const { data: rubrics, loading } = useDocsData<Record<string, any>>('scoring-rubrics');
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const allQuestions = [
    { code: 'B1', type: 'open', label: 'Role, level, tenure' },
    { code: 'B2', type: 'open', label: 'Team description, special skills' },
    { code: 'B5', type: 'multi_select', label: 'What customers value most' },
    { code: 'B6', type: 'single_select', label: 'Market change speed' },
    { code: 'M1', type: 'open', label: 'How you discuss/interpret info' },
    { code: 'M4', type: 'scale', label: 'Cross-team effectiveness' },
    { code: 'S1', type: 'open', label: 'Signals noticed and sources' },
    { code: 'S3a', type: 'scale', label: 'Ease of raising bad news' },
    { code: 'S5', type: 'scale', label: 'Spots changes early' },
    { code: 'I1', type: 'open', label: 'Example: learning → change' },
    { code: 'I2', type: 'open', label: 'Enablers and barriers' },
    { code: 'I4', type: 'scale', label: 'Changes stick' },
    { code: 'X3a', type: 'percentage', label: '% exploitation (run)' },
    { code: 'X3b', type: 'percentage', label: '% exploration (transform)' },
    { code: 'X4', type: 'scale', label: 'Ability to pivot' },
    { code: 'C1', type: 'open', label: 'Response to mistakes' },
    { code: 'C2', type: 'open', label: 'What leaders do for learning' },
    { code: 'C3', type: 'scale', label: 'Safe to speak up' },
    { code: 'C4', type: 'open', label: 'Teams respond differently' },
    { code: 'R1', type: 'open', label: 'Tools help or friction' },
    { code: 'R2', type: 'open', label: 'Pilots with partners' },
    { code: 'R3', type: 'scale', label: 'Tech supports learning' },
    { code: 'P2', type: 'open', label: 'Biggest barriers (list 3)' },
    { code: 'P4', type: 'scale', label: 'Overall readiness' },
    { code: 'RA1', type: 'open', label: 'Last significant risk' },
    { code: 'RA2', type: 'open', label: 'Response to failed risks' },
    { code: 'OL1', type: 'open', label: 'Orphan problem handling' },
    { code: 'OL2', type: 'open', label: 'Time to ownership' },
  ];

  const typeColor: Record<string, 'blue' | 'green' | 'amber' | 'red'> = {
    open: 'blue', scale: 'green', percentage: 'amber', single_select: 'red', multi_select: 'red',
  };

  return (
    <div className="dc-page">
      <Hero badge="Questions" title="Scoring" subtitle="How each of the 28 questions is scored — from AI rubrics to direct conversion to distance-from-ideal." />

      <Card>
        <h3>Scoring Methods by Type</h3>
        <Table headers={['Type', 'Method', 'Formula']} rows={[
          [<Badge variant="blue">Open-Ended (15)</Badge>, 'AI scores 3-5 dimensions using BARS anchors', 'Σ(dim_score × weight) ÷ Σ(weights) × 20'],
          [<Badge variant="green">Scale 1-5 (8)</Badge>, 'Direct mathematical conversion', 'Score = Scale × 20 (1→20, 5→100)'],
          [<Badge variant="amber">Percentage (2)</Badge>, 'Distance-from-ideal with B6 context', 'X3b 20-40% = 100, <10% = 20-59'],
          [<Badge variant="red">Select (3)</Badge>, 'Category mapping', 'Based on selection category'],
        ]} />
      </Card>

      <Card>
        <h3>All 28 Questions — Scoring Detail</h3>
        <p className="dc-text-muted">
          {loading ? 'Loading rubrics...' : 'Click any question to see how it is scored. Open-ended questions show full AI rubric with dimensions and BARS anchors.'}
        </p>
        <div className="dc-rubric-list">
          {allQuestions.map(q => {
            const key = `q_cabas_${q.code.toLowerCase()}`;
            const r = rubrics?.[key];
            const dims = r?.dimensions || [];
            const isOpen = expandedQ === q.code;
            const hasRubric = dims.length > 0;

            return (
              <div key={q.code} className={`dc-rubric ${isOpen ? 'dc-rubric--open' : ''}`}>
                <button className="dc-rubric-header" onClick={() => setExpandedQ(isOpen ? null : q.code)}>
                  <div className="dc-rubric-code">{q.code}</div>
                  <div className="dc-rubric-meta">
                    <Badge variant={typeColor[q.type] || 'default'}>{q.type}</Badge>
                    <span className="dc-rubric-dims">{q.label}</span>
                  </div>
                  <svg className={`dc-rubric-chevron ${isOpen ? 'dc-rubric-chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {isOpen && (
                  <div className="dc-rubric-body">
                    {/* Scale questions */}
                    {q.type === 'scale' && (
                      <>
                        <div className="dc-rubric-formula">
                          <span className="dc-rubric-formula-label">Method</span>
                          <span className="dc-rubric-formula-text">Direct conversion — no AI interpretation</span>
                        </div>
                        <Formula label="Formula">{'Score = Scale Value × 20  |  1→20, 2→40, 3→60, 4→80, 5→100'}</Formula>
                        <Info type="tip">Mathematical conversion. Deterministic. No variation between runs.</Info>
                      </>
                    )}

                    {/* Percentage questions */}
                    {q.type === 'percentage' && (
                      <>
                        <div className="dc-rubric-formula">
                          <span className="dc-rubric-formula-label">Method</span>
                          <span className="dc-rubric-formula-text">Distance-from-ideal with B6 market context</span>
                        </div>
                        <Formula label="Ideal Range">{'70% exploitation / 30% exploration. X3b 20-40% = 100. X3b <10% = 20-59. X3b >60% = 20-59.'}</Formula>
                        <Info type="note">The ideal ratio adjusts based on B6 (market dynamism). Fast markets reward more exploration.</Info>
                      </>
                    )}

                    {/* Select questions */}
                    {(q.type === 'single_select' || q.type === 'multi_select') && (
                      <>
                        <div className="dc-rubric-formula">
                          <span className="dc-rubric-formula-label">Method</span>
                          <span className="dc-rubric-formula-text">{q.type === 'multi_select' ? 'Category-based scoring from selected options' : 'Direct mapping from selected option'}</span>
                        </div>
                        {q.code === 'B6' && (
                          <Table compact headers={['Selection', 'Score']} rows={[
                            ['Very Slow — Stable for years', '20'],
                            ['Slow — Gradual, predictable', '40'],
                            ['Moderate — Noticeable shifts', '60'],
                            ['Fast — Significant disruption', '80'],
                            ['Very Fast — Constant upheaval', '100'],
                          ]} />
                        )}
                        {q.code === 'B5' && (
                          <Info type="note">B5 scores on differentiation signal. All operational selections (Reliability, Quality, Speed, Price) = 60-65. Mix of operational + strategic (Innovation, Expertise) = 70-75. All strategic = 75-80.</Info>
                        )}
                      </>
                    )}

                    {/* Open-ended with AI rubric */}
                    {q.type === 'open' && hasRubric && (
                      <>
                        <div className="dc-rubric-formula">
                          <span className="dc-rubric-formula-label">Method</span>
                          <span className="dc-rubric-formula-text">AI-scored: {dims.map((d: any) => `${d.id}(${d.weight}%)`).join(' + ')}</span>
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
                      </>
                    )}

                    {/* Open-ended without rubric */}
                    {q.type === 'open' && !hasRubric && (
                      <Info type="note">This question uses the default scoring approach or is used for triangulation/context only.</Info>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Info type="danger" title="Critical Principle">
        Score what the organisation DOES, not how well the respondent describes it. Eloquence ≠ capability.
      </Info>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: SCORING SIGNALS
// ═══════════════════════════════════════════════════════════
function PageSignals() {
  const { data: signalsData, loading } = useDocsData<any>('training/scoring_signals.json');
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const signals = signalsData?.signals || {};
  const questionCodes = Object.keys(signals).sort();

  return (
    <div className="dc-page">
      <Hero badge="Questions" badgeVariant="green" title="Scoring Signals" subtitle="Per-dimension keyword signals for each scoring level. These tell the AI what to look for when scoring." />

      <Card>
        <h3>What are Scoring Signals?</h3>
        <p className="dc-text-muted">For each open-ended question, each dimension has level-specific signal keywords. When the AI scores a response, it looks for these signals to calibrate which BARS anchor to match. Signals are NOT deterministic — the AI uses them as guidance alongside the full response context.</p>
      </Card>

      <Card>
        <h3>Signals by Question</h3>
        <p className="dc-text-muted">{loading ? 'Loading...' : `${questionCodes.length} questions with signals.`}</p>
        {!loading && (
          <div className="dc-rubric-list">
            {questionCodes.map(code => {
              const isOpen = expandedQ === code;
              const dims = signals[code] || {};
              const dimKeys = Object.keys(dims);
              return (
                <div key={code} className={`dc-rubric ${isOpen ? 'dc-rubric--open' : ''}`}>
                  <button className="dc-rubric-header" onClick={() => setExpandedQ(isOpen ? null : code)}>
                    <div className="dc-rubric-code">{code}</div>
                    <div className="dc-rubric-meta">
                      <span className="dc-rubric-dims">{dimKeys.length} dimensions</span>
                    </div>
                    <svg className={`dc-rubric-chevron ${isOpen ? 'dc-rubric-chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {isOpen && (
                    <div className="dc-rubric-body">
                      {dimKeys.map(dimId => {
                        const levels = dims[dimId];
                        return (
                          <div key={dimId} className="dc-dimension">
                            <div className="dc-dimension-header">
                              <div className="dc-dimension-name">{dimId.replace(/_/g, ' ')}</div>
                            </div>
                            <div className="dc-anchors">
                              {['5','4','3','2','1'].map(lvl => {
                                const levelData = levels[lvl];
                                if (!levelData) return null;
                                const sigs = levelData.signals || [];
                                return (
                                  <div key={lvl} className="dc-anchor">
                                    <div className={`dc-anchor-level dc-anchor-level--${lvl}`}>{lvl}</div>
                                    <div className="dc-anchor-range">signals</div>
                                    <div className="dc-anchor-behavior">
                                      {sigs.length > 0 ? sigs.map((s: string, i: number) => (
                                        <span key={i} className="dc-signal-tag">{s}</span>
                                      )) : <span style={{color: 'var(--text-3)', fontStyle: 'italic'}}>No signals defined</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: CALIBRATION EXAMPLES
// ═══════════════════════════════════════════════════════════
function PageCalibration() {
  const { data: calData, loading } = useDocsData<any>('training/calibration_examples.json');
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const examples = calData?.examples || {};
  const questionCodes = Object.keys(examples).sort();

  return (
    <div className="dc-page">
      <Hero badge="Questions" badgeVariant="green" title="Calibration Examples" subtitle="Good, moderate, and poor scoring examples for AI calibration. These show the AI what correct scoring looks like." />

      <Card>
        <h3>How Calibration Works</h3>
        <p className="dc-text-muted">Each open-ended question has 2-3 example responses with pre-scored dimensions. These are injected into the scoring prompt so the AI can see concrete examples of how to apply the rubric before scoring the actual response.</p>
      </Card>

      <Card>
        <h3>Examples by Question</h3>
        <p className="dc-text-muted">{loading ? 'Loading...' : `${questionCodes.length} questions with calibration examples.`}</p>
        {!loading && (
          <div className="dc-rubric-list">
            {questionCodes.map(code => {
              const isOpen = expandedQ === code;
              const qExamples = examples[code] || [];
              return (
                <div key={code} className={`dc-rubric ${isOpen ? 'dc-rubric--open' : ''}`}>
                  <button className="dc-rubric-header" onClick={() => setExpandedQ(isOpen ? null : code)}>
                    <div className="dc-rubric-code">{code}</div>
                    <div className="dc-rubric-meta">
                      <span className="dc-rubric-dims">{qExamples.length} examples</span>
                    </div>
                    <svg className={`dc-rubric-chevron ${isOpen ? 'dc-rubric-chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {isOpen && (
                    <div className="dc-rubric-body">
                      {qExamples.map((ex: any, i: number) => (
                        <div key={i} className="dc-cal-example">
                          <div className="dc-cal-header">
                            <Badge variant={ex.overall_score >= 80 ? 'green' : ex.overall_score >= 50 ? 'amber' : 'red'}>
                              Score: {ex.overall_score}
                            </Badge>
                            <span className="dc-cal-id">{ex.id}</span>
                          </div>
                          <div className="dc-cal-response">"{ex.response}"</div>
                          <div className="dc-cal-scores">
                            {Object.entries(ex.dimension_scores || {}).map(([dim, score]: [string, any]) => (
                              <div key={dim} className="dc-cal-score">
                                <span className="dc-cal-dim">{dim.replace(/_/g, ' ')}</span>
                                <div className={`dc-anchor-level dc-anchor-level--${score}`} style={{width: 22, height: 22, fontSize: 11}}>{score}</div>
                              </div>
                            ))}
                          </div>
                          {ex.reasoning && <div className="dc-cal-reasoning">{ex.reasoning}</div>}
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
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: PLAYGROUND
// ═══════════════════════════════════════════════════════════
function PagePlayground() {
  const { data: questions } = useDocsData<any[]>('questions');
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [responseText, setResponseText] = useState('');
  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rubricOverride, setRubricOverride] = useState<any>(null);
  const [rubricDirty, setRubricDirty] = useState(false);

  const selectedQ = questions?.find((q: any) => q.code === selectedCode);

  const handleRubricChange = (rubric: any, isDirty: boolean) => {
    setRubricOverride(rubric);
    setRubricDirty(isDirty);
  };

  const handleScore = async () => {
    if (!selectedCode || !responseText) return;
    setScoring(true);
    setResult(null);
    try {
      const r = await fetch(`${DOCS_API}/admin/docs/playground/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_code: selectedCode,
          response_text: responseText,
          question_type: selectedQ?.type || 'open',
          ...(rubricDirty && rubricOverride ? { rubric_override: rubricOverride } : {}),
        }),
      });
      if (r.ok) setResult(await r.json());
      else setResult({ error: `Failed: ${r.status}` });
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setScoring(false);
  };

  return (
    <div className="dc-page dc-page--playground">
      <div className="pg-content">
      <Hero badge="✨ Interactive" badgeVariant="green" title="Scoring Playground" subtitle="Test the scoring engine live. Select a question, provide an answer, and see exactly how the pipeline scores it." />

      {/* Question selector */}
      <Card>
        <h3>Select a Question</h3>
        <div className="pg-question-scroll">
          {questions?.map((q: any) => (
            <button
              key={q.code}
              className={`pg-question-chip ${selectedCode === q.code ? 'pg-question-chip--active' : ''}`}
              onClick={() => { setSelectedCode(q.code); setResult(null); }}
            >
              <span className="pg-chip-code">{q.code}</span>
              <span className="pg-chip-type">{q.type}</span>
            </button>
          ))}
        </div>
        {selectedQ && (
          <div className="pg-selected-question">
            <div className="pg-selected-code">{selectedQ.code}</div>
            <div className="pg-selected-text">{selectedQ.text}</div>
            <Badge variant={selectedQ.type === 'open' ? 'blue' : selectedQ.type === 'scale' ? 'green' : 'amber'}>{selectedQ.type}</Badge>
          </div>
        )}
      </Card>

      {/* Response input */}
      {selectedCode && (
        <Card>
          <h3>Your Response</h3>
          {(selectedQ?.type === 'scale') ? (
            <div className="pg-scale-group">
              <div className="pg-scale-labels">
                <span className="pg-scale-label-min">{selectedQ.scale?.min_label || 'Low'}</span>
                <span className="pg-scale-label-max">{selectedQ.scale?.max_label || 'High'}</span>
              </div>
              <div className="pg-scale-input">
                {[1,2,3,4,5].map(v => (
                  <button key={v} className={`pg-scale-btn ${responseText === String(v) ? 'pg-scale-btn--active' : ''}`}
                    onClick={() => setResponseText(String(v))}>{v}</button>
                ))}
              </div>
            </div>
          ) : (selectedQ?.type === 'single_select') ? (
            <div className="pg-select-group">
              {(selectedQ.options || []).map((opt: string, i: number) => (
                <button key={i}
                  className={`pg-select-option ${responseText === opt ? 'pg-select-option--active' : ''}`}
                  onClick={() => setResponseText(opt)}>
                  <span className="pg-select-radio">{responseText === opt ? '●' : '○'}</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          ) : (selectedQ?.type === 'multi_select') ? (
            <div className="pg-select-group">
              <p className="pg-select-hint">Select all that apply:</p>
              {(selectedQ.options || []).map((opt: string, i: number) => {
                const selected = responseText.split('|||').filter(Boolean);
                const isSelected = selected.includes(opt);
                const toggle = () => {
                  const next = isSelected ? selected.filter(s => s !== opt) : [...selected, opt];
                  setResponseText(next.join('|||'));
                };
                return (
                  <button key={i}
                    className={`pg-select-option ${isSelected ? 'pg-select-option--active' : ''}`}
                    onClick={toggle}>
                    <span className="pg-select-check">{isSelected ? '☑' : '☐'}</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          ) : (selectedQ?.type === 'percentage') ? (
            <div className="pg-pct-input">
              <input type="number" min="0" max="100" placeholder="0-100%" value={responseText}
                onChange={e => setResponseText(e.target.value)} className="pg-input pg-input--short" />
              <span className="pg-pct-label">%</span>
            </div>
          ) : (
            <textarea className="pg-textarea" rows={5} placeholder="Type your response here..."
              value={responseText} onChange={e => setResponseText(e.target.value)} />
          )}
          {rubricDirty && (
            <div className="pg-override-badge">⚙️ Using modified rubric — changes are not saved to production</div>
          )}
          <button className="pg-score-btn" onClick={handleScore} disabled={scoring || !responseText}>
            {scoring ? 'Scoring...' : '⚡ Score This Response'}
          </button>

          {selectedQ?.type === 'open' && (
            <button className="pg-advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? '▲ Hide' : '▼ Show'} Advanced Settings — Tune Rubric
            </button>
          )}

          {showAdvanced && selectedQ?.type === 'open' && (
            <RubricEditor questionCode={selectedCode} onRubricChange={handleRubricChange} />
          )}
        </Card>
      )}

      {/* Results */}
      {result && !result.error && (
        <>
          {/* Multi-select / extraction-only questions */}
          {result.question_type === 'multi_select' && result.overall_score === 0 ? (
            <Card className="pg-result-card">
              <Info type="note" title="Data Extraction Question">
                B5 is a data extraction question — it does not produce a standalone 0-100 score. The selected options are stored and used for cross-level comparison at the metric level (M1 Operational Strength, M11 Structure Fitness, M13 Defensible Strengths).
              </Info>
              <div className="pg-reasoning">{result.scoring_reasoning}</div>
            </Card>
          ) : (
          <>
          {/* Overall Score */}
          <Card className="pg-result-card">
            <div className="pg-score-hero">
              <div className="pg-score-big">{Math.round(result.overall_score)}</div>
              <div className="pg-score-label">/100</div>
              <Badge variant={result.overall_score >= 70 ? 'green' : result.overall_score >= 40 ? 'amber' : 'red'}>
                {result.confidence}
              </Badge>
            </div>

            {/* Ceiling */}
            {result.ceiling_applied && (
              <div className="pg-ceiling">
                <Badge variant="amber">CEILING APPLIED</Badge>
                <span>Original: {Math.round(result.original_score_before_ceiling)} → Capped: {Math.round(result.overall_score)}</span>
                <p className="dc-text-muted">{result.ceiling_reason}</p>
              </div>
            )}
            {!result.ceiling_applied && result.original_score_before_ceiling !== result.overall_score && (
              <Info type="note">No ceiling condition detected. Score unchanged.</Info>
            )}
          </Card>

          {/* Dimension Breakdown */}
          {result.dimension_scores?.length > 0 && (
            <Card>
              <h3>Dimension Breakdown</h3>
              <p className="dc-text-muted">Each dimension scored 1-5 by the AI. Weighted average → overall score.</p>
              <div className="pg-dimensions">
                {result.dimension_scores.map((ds: any, i: number) => {
                  const rubricDim = result.rubric_used?.dimensions?.find((d: any) => d.id === ds.dimension_id);
                  const weight = rubricDim?.weight || ds.weight || 0;
                  return (
                    <div key={i} className="pg-dim">
                      <div className="pg-dim-header">
                        <div className="pg-dim-name">{ds.dimension_name}</div>
                        <div className="pg-dim-scores">
                          <div className={`dc-anchor-level dc-anchor-level--${ds.score}`}>{ds.score}</div>
                          <Badge variant="default">{weight}%</Badge>
                        </div>
                      </div>
                      {ds.reasoning && <div className="pg-dim-reasoning">{ds.reasoning}</div>}
                      {/* Show matched BARS anchor */}
                      {rubricDim?.anchors && (
                        <div className="pg-dim-anchor">
                          <span className="pg-dim-anchor-label">Matched Anchor:</span>
                          <span>{rubricDim.anchors.find((a: any) => a.level === ds.score)?.behavior || '—'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Formula */}
              <div className="pg-formula">
                <div className="dc-formula-label">Calculation</div>
                <div className="dc-formula-expr">
                  {result.dimension_scores.map((ds: any, i: number) => {
                    const rubricDim = result.rubric_used?.dimensions?.find((d: any) => d.id === ds.dimension_id);
                    const weight = rubricDim?.weight || ds.weight || 0;
                    return `${ds.score}×${weight}%`;
                  }).join(' + ')}
                  {' = '}{Math.round(result.original_score_before_ceiling)}
                </div>
              </div>
            </Card>
          )}

          {/* Critical Flags — active rules (config, not triggered indicators) */}
          {result.rubric_used?.critical_flags && Object.keys(result.rubric_used.critical_flags).length > 0 && (
            <Card>
              <h3>Active Flag Rules</h3>
              <p className="dc-text-muted" style={{ marginBottom: 12 }}>Defined rules the AI uses as scoring guidance. Not triggered indicators.</p>
              {Object.entries(result.rubric_used.critical_flags).map(([fid, f]: [string, any]) => (
                <div key={fid} className="dc-rubric-flag" style={{ marginBottom: 8 }}>
                  <Badge variant="red">{fid}</Badge>
                  <span>{f.condition || String(f)}</span>
                  {f.max_score && <Badge variant="amber">max: {f.max_score}</Badge>}
                </div>
              ))}
            </Card>
          )}

          {/* AI Reasoning */}
          {result.scoring_reasoning && (
            <Card>
              <h3>AI Reasoning</h3>
              <div className="pg-reasoning">{result.scoring_reasoning}</div>
            </Card>
          )}
          </>
          )}
        </>
      )}

      {result?.error && (
        <Card>
          <Info type="danger" title="Scoring Error">{result.error}</Info>
        </Card>
      )}
      </div>

      {/* Business Cases side panel (right) */}
      {selectedCode && (
        <BusinessCasesPanel
          questionCode={selectedCode}
          questionType={selectedQ?.type || 'open'}
          rubricOverride={rubricOverride}
          rubricDirty={rubricDirty}
        />
      )}
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
// PAGE: METRIC DETAIL
// ═══════════════════════════════════════════════════════════
function PageMetricDetail() {
  const { data: metricsData, loading } = useDocsData<Record<string, any>>('metrics');
  const [expandedM, setExpandedM] = useState<string | null>(null);

  const metricOrder = ['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12','M13','M14','D1','D2'];

  // Research benchmarks
  const benchmarks: Record<string, { target: number; critical: number; source: string }> = {
    M1: { target: 65, critical: 45, source: 'Helfat & Peteraf (2003)' },
    M2: { target: 60, critical: 40, source: 'Teece (2018)' },
    M3: { target: 65, critical: 45, source: 'Argyris & Schön' },
    M4: { target: 60, critical: 40, source: 'Generic' },
    M5: { target: 65, critical: 45, source: 'Teece (2007)' },
    M6: { target: 60, critical: 40, source: 'Generic' },
    M7: { target: 60, critical: 40, source: 'Generic' },
    M8: { target: 55, critical: 35, source: 'Generic' },
    M9: { target: 75, critical: 45, source: 'March (1991)' },
    M10: { target: 60, critical: 40, source: 'Generic' },
    M11: { target: 60, critical: 40, source: 'Generic' },
    M12: { target: 60, critical: 40, source: 'Generic' },
    M13: { target: 65, critical: 45, source: 'Barney RBV' },
    M14: { target: 55, critical: 35, source: 'Mission Command' },
  };

  return (
    <div className="dc-page">
      <Hero badge="Metrics" badgeVariant="blue" title="Metric Detail" subtitle="How every element of a metric detail page is computed — from raw scores to final output." />

      {/* ─── GENERAL: SCORE & HEALTH STATUS ─── */}
      <Card>
        <h3>1. Score &amp; Health Status</h3>
        <p className="dc-text-muted">Each metric's score is a weighted aggregation of contributing question scores. The health status is then derived from the score band.</p>
        <Steps steps={[
          { title: 'Collect question scores', desc: 'Each metric defines which questions contribute and at what weight (see per-metric detail below).' },
          { title: 'Apply dimension weight overrides', desc: 'For open-ended questions feeding multiple metrics, each metric can emphasise different dimensions. E.g., I1 feeds M1 (emphasises sustainability) and M7 (emphasises organizational_reach) differently.' },
          { title: 'Weighted aggregation', desc: 'Score = Σ(question_adjusted_score × question_weight) ÷ Σ(weights). If weights sum >100%, they are normalised proportionally.' },
          { title: 'Health status classification', desc: 'Score maps to band: ≥85 Leading Strength, ≥70 Strong, ≥55 Adequate, ≥40 Watch Area, <40 Critical Gap.' },
        ]} />
        <Formula label="Metric Score">{'Σ (adjusted_question_score × question_weight%) ÷ Σ(weights%)  →  0-100'}</Formula>
      </Card>

      {/* ─── GENERAL: DIMENSION WEIGHT OVERRIDES ─── */}
      <Card>
        <h3>2. Dimension Weight Overrides</h3>
        <p className="dc-text-muted">When the AI scores an open-ended question like I1, it produces dimension scores (e.g., change_orientation=3, innovation_quality=3, organizational_reach=4, sustainability=4). The rubric's default weights produce one overall score. But each metric that uses I1 can apply its OWN weights to extract what matters most for that metric.</p>

        <Code title="Worked Example: I1 dimension scores = change_orientation: 3, innovation_quality: 3, organizational_reach: 4, sustainability: 5">{`DEFAULT rubric weights (used for the raw question score):
  change_orientation(25%) + innovation_quality(25%) + organizational_reach(20%) + sustainability(30%)
  = (3×25 + 3×25 + 4×20 + 5×30) ÷ 100 = 3.8 → × 20 = 76

M1 (Op. Strength) OVERRIDE — cares most about sustainability:
  sustainability(40%) + innovation_quality(30%) + organizational_reach(20%) + change_orientation(10%)
  = (5×40 + 3×30 + 4×20 + 3×10) ÷ 100 = 4.0 → × 20 = 80

M7 (Knowledge Leverage) OVERRIDE — cares most about organizational_reach:
  organizational_reach(40%) + sustainability(30%) + innovation_quality(20%) + change_orientation(10%)
  = (4×40 + 5×30 + 3×20 + 3×10) ÷ 100 = 4.0 → × 20 = 80

M2 (Future Readiness) OVERRIDE — balanced:
  change_orientation(30%) + sustainability(30%) + innovation_quality(25%) + organizational_reach(15%)
  = (3×30 + 5×30 + 3×25 + 4×15) ÷ 100 = 3.75 → × 20 = 75

Same AI scores. Three different contributions to three different metrics.
If NO override is specified, the default rubric weights are used.`}</Code>

        <Formula label="Adjusted Score Formula">{'adjusted = Σ(dim_score × metric_dim_weight) ÷ Σ(metric_dim_weights) × 20'}</Formula>

        <Info type="note" title="Not all questions have overrides">
          Scale questions (M4, C3, S3a, etc.) have no dimensions — they contribute their raw score directly. Open-ended questions marked "default rubric weights" in the per-metric detail below use the rubric's own weights, not a metric-specific override.
        </Info>
      </Card>

      {/* ─── GENERAL: CROSS-LEVEL ─── */}
      <Card>
        <h3>3. Cross-Level Contributions</h3>
        <p className="dc-text-muted">Some question weights are marked as cross-level (CL). These compare scores across organisational levels (leadership vs frontline). For single-respondent assessments (N=1), cross-level contributions are skipped and their weight is redistributed to other questions.</p>
        <Table compact headers={['Scenario', 'Behaviour']} rows={[
          ['N=1 (single respondent)', 'CL weights skipped. Remaining weights normalised to 100%.'],
          ['N=2 (same level)', 'CL weights skipped. No level comparison possible.'],
          ['N≥3 (multiple levels)', 'CL weights active. Cross-level gap computed.'],
        ]} />
        <Info type="note">When CL weights are skipped, the metric confidence is lowered from HIGH to MEDIUM.</Info>
      </Card>

      {/* ─── GENERAL: WEIGHT NORMALISATION ─── */}
      <Card>
        <h3>4. Weight Normalisation</h3>
        <p className="dc-text-muted">Several metrics have question weights that sum to more than 100% (e.g., Implementation Speed = 125%, Change Readiness = 130%). The engine normalises automatically.</p>
        <Formula label="Normalisation">{'If total_weight ≠ 100: final_score = weighted_sum × 100 ÷ total_weight'}</Formula>
        <Table compact headers={['Metric', 'Raw Weight Sum', 'Normalised']} rows={[
          ['M4 Implementation Speed', '125%', 'Each weight ÷ 1.25'],
          ['M8 Accountability Speed', '100%', 'No normalisation needed'],
          ['M10 Change Readiness', '130%', 'Each weight ÷ 1.30'],
          ['M11 Structure Fitness', '100%', 'No normalisation needed'],
        ]} />
      </Card>

      {/* ─── GENERAL: CONFIDENCE ─── */}
      <Card>
        <h3>5. Confidence Badges</h3>
        <p className="dc-text-muted">Each observation gets a confidence rating during Phase 2 enrichment. This is displayed as LOW/MEDIUM/HIGH badges on the metric detail page.</p>
        <Table compact headers={['Level', 'Criteria']} rows={[
          [<Badge variant="green">HIGH</Badge>, 'All contributing questions have scores. Multiple evidence quotes. No cross-level skip.'],
          [<Badge variant="amber">MEDIUM</Badge>, 'Some questions missing or cross-level skipped. Single respondent with hedging applied.'],
          [<Badge variant="red">LOW</Badge>, 'Key contributing questions missing. Sparse evidence. Score based on partial data.'],
        ]} />
      </Card>

      {/* ─── GENERAL: STRENGTH vs GAP ─── */}
      <Card>
        <h3>6. STRENGTH vs GAP Labels</h3>
        <p className="dc-text-muted">Each observation on the metric detail page is labelled as STRENGTH or GAP. This is derived directly from the observation's sentiment field.</p>
        <Table compact headers={['Sentiment', 'Label', 'Meaning']} rows={[
          ['positive', <Badge variant="green">STRENGTH</Badge>, 'This aspect IS working well for the organisation'],
          ['negative', <Badge variant="red">GAP</Badge>, 'This aspect needs improvement'],
          ['neutral', <Badge>NEUTRAL</Badge>, 'Mixed evidence or insufficient data to classify'],
        ]} />
      </Card>

      {/* ─── GENERAL: WHAT WE HEARD ─── */}
      <Card>
        <h3>7. "What We Heard" Section</h3>
        <p className="dc-text-muted">The dashboard aggregates all verbatim evidence quotes from all observations for this metric into a single "What We Heard" section. This is a frontend aggregation — the backend returns quotes per observation, and the UI collects them.</p>
        <Code title="Frontend Aggregation Logic">{`for each observation in metric.observations:
  for each quote in observation.evidence:
    collect { quote.text, quote.role, quote.question_code, observation.lens_id }
display as cards with respondent role and source question`}</Code>
      </Card>

      {/* ─── GENERAL: PER-METRIC RECOMMENDATIONS ─── */}
      <Card>
        <h3>8. Per-Metric Recommendations</h3>
        <p className="dc-text-muted">Phase 2 generates 1-3 recommendations per metric. These are different from the report-level "Key Actions" — they are scoped to the specific metric's findings and observations.</p>
        <Table compact headers={['Field', 'Description']} rows={[
          ['Action title', 'Verb-led, specific to the metric findings'],
          ['First step', 'What to do THIS MONDAY (Monday Morning Test)'],
          ['Owner', 'SME role title (Operations Manager, not COO)'],
          ['Timeframe', 'Realistic for org size'],
          ['Evidence anchor', 'Quote or data point justifying this recommendation'],
          ['Linked lens IDs', 'Which observations this recommendation addresses'],
        ]} />
        <p className="dc-text-muted">These per-metric recommendations feed into the report-level Key Actions synthesis. See <strong>Refinement → Recommendations</strong> for the report-level process.</p>
      </Card>

      {/* ─── GENERAL: AI REASONING ─── */}
      <Card>
        <h3>9. AI Reasoning (Chain of Thought)</h3>
        <p className="dc-text-muted">The expandable "AI Reasoning" section on the metric detail page shows the AI's internal analysis. This is the Phase 2 <code>analysis</code> field — a chain-of-thought reasoning that is NOT shown to clients but available for internal review.</p>
        <Info type="warning" title="Internal Only">
          AI reasoning is for developer/admin review. It is never included in client-facing reports or PDFs.
        </Info>
      </Card>

      {/* ─── GENERAL: OBSERVATION LENSES ─── */}
      <Card>
        <h3>10. Observation Lenses</h3>
        <p className="dc-text-muted">Each metric's observations are structured around analytical lenses (e.g., M1 might have: Execution Reliability, Exploitation Load, Change Stickiness). The platform supports defined lenses via <code>data/observation_lenses.json</code>. Currently, lenses are AI-generated per run — the file has not yet been populated.</p>
        <p className="dc-text-muted">See <strong>Metrics → Observations</strong> for the full observation mining process.</p>
      </Card>

      {/* ─── PER-METRIC EXPANDABLES ─── */}
      <Card>
        <h3>Per-Metric Configuration</h3>
        <p className="dc-text-muted">{loading ? 'Loading metrics...' : 'Click any metric to see its exact configuration — question weights, dimension overrides, benchmarks.'}</p>
        {!loading && metricsData && (
          <div className="dc-rubric-list">
            {metricOrder.map(code => {
              const key = Object.keys(metricsData).find(k => metricsData[k]?.code === code);
              const m = key ? metricsData[key] : null;
              if (!m) return null;
              const isOpen = expandedM === code;
              const qw = m.question_weights || [];
              const sm = m.source_metrics || [];
              const isDerived = sm.length > 0 && qw.length === 0;
              const bm = benchmarks[code];

              return (
                <div key={code} className={`dc-rubric ${isOpen ? 'dc-rubric--open' : ''}`}>
                  <button className="dc-rubric-header" onClick={() => setExpandedM(isOpen ? null : code)}>
                    <div className="dc-rubric-code">{code}</div>
                    <div className="dc-rubric-meta">
                      <span className="dc-rubric-dims">{m.name}</span>
                      {isDerived && <Badge variant="amber">Derived</Badge>}
                      {bm && <span className="dc-rubric-type">Target: ≥{bm.target}</span>}
                    </div>
                    <svg className={`dc-rubric-chevron ${isOpen ? 'dc-rubric-chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {isOpen && (
                    <div className="dc-rubric-body">
                      {/* Description */}
                      {m.description && <p className="dc-dimension-desc">{m.description}</p>}

                      {/* Research benchmark */}
                      {bm && (
                        <div className="dc-rubric-formula">
                          <span className="dc-rubric-formula-label">Benchmark</span>
                          <span className="dc-rubric-formula-text">Target ≥{bm.target} | Critical &lt;{bm.critical} | Source: {bm.source}</span>
                        </div>
                      )}

                      {/* Derived metric formula */}
                      {isDerived && (
                        <>
                          <div className="dc-rubric-formula">
                            <span className="dc-rubric-formula-label">Derived From</span>
                            <span className="dc-rubric-formula-text">{sm.map((s: any) => `${s.metric_code}(${s.weight}%)`).join(' + ')}</span>
                          </div>
                          <Info type="note">Simple weighted average of source metrics. No LLM calls — computed directly.</Info>
                        </>
                      )}

                      {/* Question weights */}
                      {qw.length > 0 && (
                        <>
                          <div className="dc-rubric-formula">
                            <span className="dc-rubric-formula-label">Question Weights</span>
                            <span className="dc-rubric-formula-text">
                              {qw.map((q: any) => `${q.question_code}(${q.weight}%${q.contribution_type === 'cross_level' ? ' CL' : ''})`).join(' + ')}
                            </span>
                          </div>
                          <Table compact headers={['Question', 'Weight', 'Type', 'Dimension Weights']} rows={
                            qw.map((q: any) => [
                              q.question_code,
                              `${q.weight}%`,
                              q.contribution_type || 'direct',
                              q.dimension_weights
                                ? Object.entries(q.dimension_weights).map(([d, w]) => `${d}: ${w}%`).join(', ')
                                : '—'
                            ])
                          } />
                        </>
                      )}

                      {/* Interpretation guide */}
                      {m.interpretation_guide && (
                        <div style={{ marginTop: 12 }}>
                          <div className="dc-rubric-formula-label">Interpretation Guide</div>
                          <p className="dc-text-muted" style={{ marginTop: 4 }}>{m.interpretation_guide}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: OBSERVATION LENSES
// ═══════════════════════════════════════════════════════════
function PageLenses() {
  const { data: lensesData, loading } = useDocsData<Record<string, any>>('observation-lenses');
  const [expandedM, setExpandedM] = useState<string | null>(null);

  const metricNames: Record<string, string> = {
    M1: 'Operational Strength', M2: 'Future Readiness', M3: 'Insight-to-Action',
    M4: 'Implementation Speed', M5: 'Market Radar', M6: 'Decision Flow',
    M7: 'Knowledge Leverage', M8: 'Accountability Speed', M9: 'Run/Transform Balance',
    M10: 'Change Readiness', M11: 'Structure Fitness', M12: 'Capacity & Tools',
    M13: 'Defensible Strengths', M14: 'Risk Tolerance',
  };

  const metricOrder = ['M1','M2','M3','M4','M5','M6','M7','M8','M9','M10','M11','M12','M13','M14'];

  // Count totals
  let totalLenses = 0;
  if (lensesData) {
    for (const code of metricOrder) {
      totalLenses += (lensesData[code]?.lenses || []).length;
    }
  }

  return (
    <div className="dc-page">
      <Hero badge="Metrics" badgeVariant="green" title="Observation Lenses" subtitle="Analytical frameworks that structure how the AI mines observations from assessment data. Each metric has 3-5 defined lenses." />

      <Card>
        <h3>How Lenses Work</h3>
        <p className="dc-text-muted">When the AI generates observations for a metric, it analyses the data through each defined lens. Each lens produces exactly ONE structured observation with verbatim evidence. This ensures consistent, comparable findings across assessments.</p>
        <Steps steps={[
          { title: 'Lenses loaded from observation_lenses.json', desc: 'Each metric has 3-5 predefined lenses with specific guidance on what to look for and which questions to examine.' },
          { title: 'AI analyses data through each lens', desc: 'For each lens, the AI reads the relevant question responses and produces a structured finding with sentiment, severity, and evidence.' },
          { title: 'Cross-level lenses skipped for N=1', desc: 'Lenses that require multi-respondent data (e.g., cross-level capability alignment) are automatically filtered out for single-respondent assessments.' },
          { title: 'Emergent observations allowed', desc: 'Each metric allows 1 emergent observation for genuinely surprising findings not covered by the defined lenses.' },
        ]} />
      </Card>

      <Card>
        <h3>All Lenses by Metric</h3>
        <p className="dc-text-muted">{loading ? 'Loading...' : `${totalLenses} lenses across ${metricOrder.length} metrics. Click to expand.`}</p>
        {!loading && lensesData && (
          <div className="dc-rubric-list">
            {metricOrder.map(code => {
              const m = lensesData[code];
              if (!m) return null;
              const lenses = m.lenses || [];
              const isOpen = expandedM === code;

              return (
                <div key={code} className={`dc-rubric ${isOpen ? 'dc-rubric--open' : ''}`}>
                  <button className="dc-rubric-header" onClick={() => setExpandedM(isOpen ? null : code)}>
                    <div className="dc-rubric-code">{code}</div>
                    <div className="dc-rubric-meta">
                      <span className="dc-rubric-dims">{metricNames[code]}</span>
                      <Badge variant="blue">{lenses.length} lenses</Badge>
                    </div>
                    <svg className={`dc-rubric-chevron ${isOpen ? 'dc-rubric-chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {isOpen && (
                    <div className="dc-rubric-body">
                      {lenses.map((lens: any, i: number) => {
                        const isCrossLevel = (lens.key_questions || []).every((q: string) => ['B5', 'B1'].includes(q));
                        return (
                          <div key={lens.id} className="dc-lens">
                            <div className="dc-lens-header">
                              <div className="dc-lens-num">{i + 1}</div>
                              <div className="dc-lens-info">
                                <div className="dc-lens-name">{lens.name}</div>
                                <div className="dc-lens-id">{lens.id}</div>
                              </div>
                              <div className="dc-lens-tags">
                                {(lens.key_questions || []).map((q: string) => (
                                  <Badge key={q} variant="default">{q}</Badge>
                                ))}
                                {isCrossLevel && <Badge variant="amber">N&gt;1 only</Badge>}
                              </div>
                            </div>
                            <div className="dc-lens-guidance">{lens.guidance}</div>
                          </div>
                        );
                      })}
                      <div className="dc-lens-emergent">
                        <Badge variant="green">+{m.max_emergent || 1} emergent</Badge>
                        <span>The AI may add up to {m.max_emergent || 1} emergent observation for surprising findings not covered by the defined lenses.</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Info type="note" title="Single-Respondent Filtering">
        For N=1 assessments, lenses whose key questions are all cross-level (B5, B1) are automatically removed. Currently affects M1 (Capability Alignment Across Levels) and M13 (Capability Agreement Across Levels).
      </Info>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: OBSERVATIONS
// ═══════════════════════════════════════════════════════════
function PageObservations() {
  const { data: benchmarks, loading: loadingBench } = useDocsData<any>('training/score_ceilings.json');
  const { data: researchData } = useDocsData<any>('metrics');
  const [showTemplates, setShowTemplates] = useState(false);

  // Load research benchmarks directly
  const { data: benchmarkData } = useDocsData<any>('training/score_ceilings.json');

  return (
    <div className="dc-page">
      <Hero badge="Metrics" badgeVariant="green" title="Observations" subtitle="Phase 1 of per-metric refinement: structured findings mined from assessment data with verbatim evidence." />

      <Card>
        <h3>Observation Mining Process</h3>
        <p className="dc-text-muted">For each of the 14 core metrics, the AI receives all relevant question scores and responses, then produces structured observations through analytical lenses.</p>
        <Steps steps={[
          { title: 'Load metric context', desc: 'Score, health status, per-source breakdown, research benchmark, sector norms, and all contributing question responses.' },
          { title: 'Analyse through lenses', desc: 'Each metric is examined through 3-5 analytical lenses. The AI produces ONE observation per lens — a structured finding, not a score restatement.' },
          { title: 'Attach verbatim evidence', desc: 'Every observation must include 1-3 EXACT quotes from interview responses. Minimum 20 characters. Never paraphrased.' },
          { title: 'Classify sentiment & severity', desc: 'Sentiment: positive/negative/neutral. Scope: team/multi_function/org_wide. Urgency: long_term/near_term_risk/active_damage.' },
        ]} />
      </Card>

      <Card>
        <h3>Observation Schema</h3>
        <p className="dc-text-muted">Every observation returned by the AI must conform to this structure:</p>
        <Code title="Observation Object">{`{
  lens_id: "execution_reliability",       // Analytical lens ID
  text: "Initial evidence points to...",   // The finding itself
  sentiment: "negative",                   // positive | negative | neutral
  severity_scope: "org_wide",              // team | multi_function | org_wide
  severity_urgency: "near_term_risk",      // long_term | near_term_risk | active_damage
  data_shows: "...",                        // What the data shows (respondent language)
  context_means: "...",                     // What it means in context (B6 market)
  connects_to: "...",                       // Cross-reference to related metric
  evidence: [
    {
      quote: "exact respondent text...",    // Verbatim — NEVER paraphrased
      role: "Senior Manager",              // SME title
      question_code: "I1"                  // Source question
    }
  ]
}`}</Code>
      </Card>

      <Info type="danger" title="Verbatim Quote Rules">
        <strong>1.</strong> Every quote copied EXACTLY from the interview — no paraphrasing, no summarising.<br/>
        <strong>2.</strong> Minimum 20 characters — short fragments are not evidence.<br/>
        <strong>3.</strong> Never cite procedural text ("I'm ready to answer", "go ahead", "next question").<br/>
        <strong>4.</strong> 1-3 quotes per observation — select the most relevant.
      </Info>

      <Card>
        <h3>Assessment Statement Templates</h3>
        <p className="dc-text-muted">Deterministic templates for positioning each metric against research benchmarks. 4 score bands × 5 variants. No claims, no interpretation — facts only.</p>
        <Table headers={['Band', 'When', 'Example Template']} rows={[
          [<Badge variant="green">Above Target</Badge>, 'Score ≥ research target', '{metric_name} scores {score}/100 against a research benchmark of ≥{target} ({source}). {gap_pts} points above target.'],
          [<Badge variant="amber">Near Target</Badge>, 'Score within 10 of target', '{metric_name}: {score}/100 — {gap_pts} points below the ≥{target} research benchmark ({source}).'],
          [<Badge variant="amber">Below Target</Badge>, 'Score below target but above critical', '{metric_name} scores {score}/100, {gap_pts} points below benchmark of ≥{target} ({source}). Critical threshold: {critical}.'],
          [<Badge variant="red">Below Critical</Badge>, 'Score below critical threshold', '{metric_name} scores {score}/100, below the critical threshold of {critical} and {gap_pts} points below benchmark of ≥{target} ({source}).'],
        ]} />
      </Card>

      <Card>
        <h3>Research Benchmarks</h3>
        <p className="dc-text-muted">Each metric has a research-grounded target score and critical threshold from peer-reviewed dynamic capabilities literature.</p>
        <ResearchBenchmarksTable />
      </Card>

      <Card>
        <h3>Mining Rules</h3>
        <Table compact headers={['Rule', 'Description']} rows={[
          ['Sentiment must match reality', '"positive" means this IS working well; "negative" means it needs improvement'],
          ['Severity must be justified', '"org_wide" = evidence shows impact across org; "active_damage" = measurable harm NOW'],
          ['Single respondent hedging', 'When N=1: use "indicators suggest", "initial evidence points to", "preliminary"'],
          ['SME role titles', 'Use MD, Operations Manager, Senior Manager — never COO, CIO, VP'],
          ['No score restatement', 'Observations must be specific findings, not "M1 is low" restatements'],
        ]} />
      </Card>
    </div>
  );
}

function ResearchBenchmarksTable() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch(`${DOCS_API}/admin/docs/metrics`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {});
  }, []);

  // Also try research_benchmarks.json
  const [benchmarks, setBenchmarks] = useState<any>(null);
  useEffect(() => {
    fetch(`${DOCS_API.replace('/api/v1', '')}/api/v1/admin/docs/training/score_ceilings.json`)
      .catch(() => {});
    // Try direct file
    fetch(`${DOCS_API}/admin/docs/research-benchmarks`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setBenchmarks(d))
      .catch(() => {});
  }, []);

  // Hardcoded benchmarks from research_benchmarks.json since we know the data
  const benchmarkRows: (string | React.ReactNode)[][] = [
    ['M1', 'Operational Strength', '≥65', '45', 'Helfat & Peteraf (2003)'],
    ['M2', 'Future Readiness', '≥60', '40', 'Teece (2018)'],
    ['M3', 'Insight-to-Action', '≥65', '45', 'Argyris & Schön'],
    ['M4', 'Implementation Speed', '≥60', '40', 'Generic'],
    ['M5', 'Market Radar', '≥65', '45', 'Teece (2007)'],
    ['M6', 'Decision Flow', '≥60', '40', 'Generic'],
    ['M7', 'Knowledge Leverage', '≥60', '40', 'Generic'],
    ['M8', 'Accountability Speed', '≥55', '35', 'Generic'],
    ['M9', 'Run/Transform Balance', '≥75', '45', 'March (1991)'],
    ['M10', 'Change Readiness', '≥60', '40', 'Generic'],
    ['M11', 'Structure Fitness', '≥60', '40', 'Generic'],
    ['M12', 'Capacity & Tools', '≥60', '40', 'Generic'],
    ['M13', 'Defensible Strengths', '≥65', '45', 'Barney RBV'],
    ['M14', 'Risk Tolerance', '≥55', '35', 'Mission Command'],
  ];

  return (
    <Table headers={['Code', 'Metric', 'Target', 'Critical', 'Source']} rows={benchmarkRows} />
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: NARRATIVES
// ═══════════════════════════════════════════════════════════
function PageNarratives() {
  return (
    <div className="dc-page">
      <Hero badge="Metrics" badgeVariant="green" title="Metric Narratives" subtitle="Phase 2: the AI interprets observations and produces business-ready narrative text for each metric." />

      <Card>
        <h3>Phase 2 Output Structure</h3>
        <p className="dc-text-muted">For each of the 14 core metrics, Phase 2 receives the verified observations from Phase 1 and produces:</p>
        <Steps steps={[
          { title: 'Observation enrichments', desc: 'For each observation: a business_impact sentence (what this means commercially) and a confidence rating (high/medium/low). These become the impact text and confidence badges on the metric detail page.' },
          { title: 'Per-metric recommendations (1-3)', desc: 'Concrete actions scoped to this metric\'s findings. Each links to specific observation lens_ids and includes an evidence anchor quote. Must pass the Monday Morning Test.' },
          { title: 'Synthesised impact paragraph', desc: 'Connects all observations into a root-cause analysis. This is the long narrative paragraph on the metric detail page — NOT a restatement of scores but an explanation of systemic patterns and their commercial consequence.' },
          { title: 'Summary (1-2 sentences)', desc: 'Executive-level takeaway. Leads with insight, not context. This appears at the top of the metric detail page below the score.' },
        ]} />
      </Card>

      <Card>
        <h3>Summary vs Synthesised Impact</h3>
        <p className="dc-text-muted">These serve different purposes on the metric detail page:</p>
        <Table headers={['Field', 'Purpose', 'Length', 'Example']} rows={[
          ['summary', 'Quick takeaway — what to know at a glance', '1-2 sentences', '"Operational execution is a clear strength anchored by dependable delivery, but tool friction and moderate change stickiness erode improvement ROI."'],
          ['synthesized_impact', 'Root cause analysis — why it matters', '1-2 paragraphs', 'Connects observations into a causal chain: tool friction → manual rework → less capacity for improvement → rising cost-to-serve'],
        ]} />
      </Card>

      <Card>
        <h3>Evidence Selection</h3>
        <p className="dc-text-muted">Phase 2 selects the most relevant evidence from Phase 1 observations to support its analysis. Rules:</p>
        <Table compact headers={['Rule', 'Description']} rows={[
          ['Verbatim only', 'Every quote must be EXACTLY as the respondent said — never paraphrased'],
          ['Minimum 20 chars', 'Short fragments are not evidence'],
          ['No procedural text', 'Never cite "I\'m ready to answer", "go ahead", "next question"'],
          ['Source attribution', 'Every quote tagged with role (SME title) and question_code'],
          ['Linked to lens', 'Each evidence quote is attached to a specific observation lens_id'],
        ]} />
      </Card>

      <Card>
        <h3>Derived Metric Narratives (D1, D2)</h3>
        <p className="dc-text-muted">D1 (OODA Velocity) and D2 (Resilience Index) do NOT get LLM calls. Their narratives are generated by rule-based templates that summarise their source metrics. If source metrics show specific patterns (e.g., low Market Radar + high Decision Flow = "fast decisions based on limited information"), cross-metric insights are generated.</p>
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
// PAGE: CRITICAL ISSUES & STRENGTHS
// ═══════════════════════════════════════════════════════════
function PageIssuesStrengths() {
  return (
    <div className="dc-page">
      <Hero badge="Refinement" badgeVariant="amber" title="Critical Issues & Strengths" subtitle="Report-level synthesis identifying the most urgent problems and strongest assets." />

      <Card>
        <h3>Critical Issues (2-4)</h3>
        <p className="dc-text-muted">Synthesised from per-metric findings. These are the headlines a CEO needs to see first.</p>
        <Code title="Critical Issue Structure">{`{
  title: "The Invisible Innovation Gap",       // Short, impactful name
  severity: "critical" | "warning",            // Immediate vs important
  metrics: ["M2", "M5", "M8"],                 // Related metric codes
  avg_score: 42,                               // Average across those metrics
  description: "1-2 sentence explanation",
  evidence: [{ quote: "...", role: "..." }],   // Supporting interview quotes
  root_causes: ["Optimization Lock"],          // Linked pathologies
  business_impact: "What happens if not addressed"
}`}</Code>
      </Card>

      <Card>
        <h3>Strengths (2-4)</h3>
        <p className="dc-text-muted">What's working well that should be protected and leveraged to address weaknesses.</p>
        <Code title="Strength Structure">{`{
  title: "Strong Operational Execution",
  metrics: ["M1", "M4"],                       // Related metrics
  avg_score: 76,                               // Average score
  description: "1-2 sentence explanation",
  evidence: [{ quote: "...", role: "..." }],
  opportunity: "How to leverage this to fix weaknesses"
}`}</Code>
        <Info type="note">Even in the strongest quadrant (Adaptive Leader), the report must identify relative weaknesses. Even in At-Risk, it must identify strengths to build on.</Info>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: CROSS-METRIC INSIGHTS
// ═══════════════════════════════════════════════════════════
function PageCrossMetric() {
  return (
    <div className="dc-page">
      <Hero badge="Refinement" badgeVariant="blue" title="Cross-Metric Insights" subtitle="Strategic patterns that emerge when metrics are analysed together, not individually." />

      <Card>
        <h3>How Cross-Metric Insights Work</h3>
        <p className="dc-text-muted">After all 14 metrics are scored, the system checks for specific cross-metric patterns that reveal strategic issues invisible at the individual metric level.</p>
        <Steps steps={[
          { title: 'Perception gap detection', desc: 'Compares P4 (self-assessed readiness) against M2 (calculated Future Readiness). A gap >1.5 points flags overconfidence or underconfidence.' },
          { title: 'VRIN strategic connections', desc: 'When M13 (Defensible Strengths) shows depreciating assets AND M5 (Market Radar) is low, flags that competitive advantage is eroding without awareness.' },
          { title: 'Reinforcing pathology cycles', desc: 'When Optimization Lock + Resource Starvation co-occur, flags a reinforcing cycle where over-exploitation consumes all capacity.' },
          { title: 'Inject into report summary', desc: 'Cross-metric insights are passed to the executive summary prompt so the AI can weave systemic patterns into the narrative.' },
        ]} />
      </Card>

      <Card>
        <h3>Perception Gap</h3>
        <p className="dc-text-muted">The gap between how ready the respondent THINKS the organisation is (P4) vs how ready the data SHOWS it is (M2).</p>
        <Table headers={['Direction', 'Condition', 'Meaning']} rows={[
          ['Overconfidence', 'P4 > M2 by >1.5 points', 'Leadership believes readiness is higher than evidence supports. Transformation investments may be under-scoped.'],
          ['Underconfidence', 'P4 < M2 by >1.5 points', 'Leadership underestimates readiness. May be over-cautious or experiencing change fatigue.'],
          ['Aligned', 'Gap ≤1.5 points', 'Self-assessment matches data. No perception gap.'],
        ]} />
      </Card>

      <Card>
        <h3>Strategic Flag Patterns</h3>
        <Table headers={['Pattern', 'Metrics Involved', 'What It Means']} rows={[
          ['Depreciating VRIN + blind spot', 'M13 low + M5 low', 'Competitive advantages are eroding and the org isn\'t scanning for threats'],
          ['Innovation without execution', 'M2 high + M1 low', 'Good ideas but can\'t deliver them — Scattered Experimenter pattern'],
          ['Execution without direction', 'M1 high + M2 low', 'Delivering well but for a market that may be changing — Solid Performer trap'],
          ['Accountability + Optimization cycle', 'M8 low + M9 low', 'Nobody owns improvement AND all time goes to operations — compounding trap'],
        ]} />
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: VRIN ASSESSMENT
// ═══════════════════════════════════════════════════════════
function PageVRIN() {
  return (
    <div className="dc-page">
      <Hero badge="Refinement" badgeVariant="green" title="Defensible Strengths Assessment" subtitle="VRIN framework analysis of claimed competitive advantages — Valuable, Rare, Inimitable, Non-substitutable." />

      <Info type="warning" title="Client-Facing Name">
        Always use "Defensible Strengths" in client output. "VRIN" is an academic term — never shown to clients. Used internally only.
      </Info>

      <Card>
        <h3>How It Works</h3>
        <p className="dc-text-muted">A separate LLM call analyses responses from B2 (team capabilities), B5 (customer value), and R2 (external engagement) to test whether claimed competitive advantages are genuinely defensible.</p>
        <Steps steps={[
          { title: 'Extract claimed advantages', desc: 'From B2 and B5 responses, identify what the respondent claims as competitive strengths.' },
          { title: 'Test each against VRIN criteria', desc: 'Valuable (customers pay for it?), Rare (few competitors can do it?), Inimitable (hard to copy?), Non-substitutable (no easy alternative?).' },
          { title: 'Produce verdict per asset', desc: 'Each claimed advantage gets a structured assessment with scores on each VRIN dimension.' },
          { title: 'Inject into M13 context', desc: 'The VRIN assessment enriches the M13 (Defensible Strengths) metric context data, visible on the dashboard.' },
        ]} />
      </Card>

      <Card>
        <h3>Output Structure</h3>
        <Code title="VRIN Asset">{`{
  asset_name: "Subsea engineering expertise",
  valuable: true | false,
  rare: true | false,
  inimitable: true | false,
  non_substitutable: true | false,
  verdict: "Genuinely defensible" | "Partially defensible" | "Not defensible",
  reasoning: "Why this assessment"
}`}</Code>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PAGE: SECTOR CONTEXT
// ═══════════════════════════════════════════════════════════
function PageSectorContext() {
  return (
    <div className="dc-page">
      <Hero badge="Refinement" title="Sector Context" subtitle="Industry-specific norms injected into narrative generation so findings are contextualised, not generic." />

      <Card>
        <h3>How Sector Context Works</h3>
        <p className="dc-text-muted">When a business has an industry set (e.g., "Energy", "Construction"), the refinement pipeline loads sector-specific norms from <code>data/training/sector_norms.json</code> and injects them into the LLM prompt.</p>
        <Steps steps={[
          { title: 'Match industry to sector profile', desc: 'Fuzzy matching: "oil and gas" → Energy, "marine logistics" → Maritime. Each sector has aliases for flexible matching.' },
          { title: 'Load sector norms', desc: 'Typical Run/Transform ratios, common pathology patterns, risk framing, regulatory pressures for this industry.' },
          { title: 'Inject into metric narrative prompts', desc: 'The AI uses sector context to frame findings: "For an energy company, a 90/10 Run/Transform split is notably conservative" vs generic "your split is unbalanced."' },
        ]} />
      </Card>

      <Card>
        <h3>Available Sector Profiles</h3>
        <Table headers={['Sector', 'Key Context', 'Common Pathologies']} rows={[
          ['Energy / Oil & Gas', 'Net Zero transition, operator digitalisation, workforce aging', 'Optimization Lock, Risk Paralysis'],
          ['Construction', 'Project-based, subcontractor chains, safety-critical', 'Accountability Vacuum, Safety Crisis'],
          ['Professional Services', 'Knowledge-intensive, client relationships, talent competition', 'Implementation Gap, Activity Without Impact'],
          ['Manufacturing', 'Process efficiency, supply chain, automation pressure', 'Optimization Lock, Resource Starvation'],
          ['Technology', 'Fast-moving, talent wars, rapid obsolescence', 'Scattered Focus, Activity Without Impact'],
          ['Maritime', 'Regulatory complexity, operational safety, long asset cycles', 'Optimization Lock, Risk Paralysis'],
        ]} />
      </Card>

      <Info type="note" title="When No Sector Matches">
        If the business industry doesn't match any sector profile, no sector context is injected. The AI generates generic narratives without industry-specific framing.
      </Info>
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
const PAGE_COMPONENTS: Record<string, () => React.ReactElement> = {
  'welcome': PageWelcome,
  'architecture': PageArchitecture,
  'q-data': PageQuestionData,
  'q-scoring': PageScoring,
  'q-signals': PageSignals,
  'q-calibration': PageCalibration,
  'q-playground': PagePlayground,
  'q-ceilings': PageCeilings,
  'q-saydo': PageSayDo,
  'q-pathologies': PagePathologies,
  'q-validation': PageValidation,
  'm-formulas': PageMetricFormulas,
  'm-detail': PageMetricDetail,
  'm-lenses': PageLenses,
  'm-observations': PageObservations,
  'm-narratives': PageNarratives,
  'r-summary': PageExecSummary,
  'r-quadrant': PageQuadrant,
  'r-actions': PageRecommendations,
  'r-issues': PageIssuesStrengths,
  'r-crossmetric': PageCrossMetric,
  'r-vrin': PageVRIN,
  'r-sector': PageSectorContext,
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
    // Auto-close sidebar on playground, auto-open on other pages
    if (id === 'q-playground') setSidebarOpen(false);
    else if (activePage === 'q-playground') setSidebarOpen(true);
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
