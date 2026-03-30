import { useState, useEffect, useCallback } from 'react';
import './DocsPage.css';

// ─── API BASE ───
const DOCS_API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// ─── DATA HOOKS ───
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

// ─── PAGE DEFINITIONS ───
interface DocPage {
  id: string;
  label: string;
  group: string;
  content: () => JSX.Element;
}

const GROUPS = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'scoring', label: 'Scoring' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'output', label: 'Output' },
  { id: 'reference', label: 'Reference' },
];

// ─── REUSABLE COMPONENTS ───
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`dc-card ${className}`}>{children}</div>;
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'green' | 'amber' | 'red' | 'blue' }) {
  return <span className={`dc-badge dc-badge--${variant}`}>{children}</span>;
}

function InfoBlock({ type = 'note', title, children }: { type?: 'note' | 'warning' | 'danger' | 'tip'; title?: string; children: React.ReactNode }) {
  const icons = { note: '💡', warning: '⚠️', danger: '🚨', tip: '✨' };
  return (
    <div className={`dc-info dc-info--${type}`}>
      <div className="dc-info-header">
        <span className="dc-info-icon">{icons[type]}</span>
        <span className="dc-info-title">{title || type.charAt(0).toUpperCase() + type.slice(1)}</span>
      </div>
      <div className="dc-info-body">{children}</div>
    </div>
  );
}

function DataTable({ headers, rows, compact = false }: { headers: string[]; rows: (string | JSX.Element)[][]; compact?: boolean }) {
  return (
    <div className="dc-table-wrap">
      <table className={`dc-table ${compact ? 'dc-table--compact' : ''}`}>
        <thead><tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function CodeBlock({ title, lang, children }: { title?: string; lang?: string; children: string }) {
  return (
    <div className="dc-code">
      {(title || lang) && (
        <div className="dc-code-header">
          {title && <span className="dc-code-title">{title}</span>}
          {lang && <span className="dc-code-lang">{lang}</span>}
        </div>
      )}
      <pre><code>{children}</code></pre>
    </div>
  );
}

function FormulaBlock({ label, children }: { label?: string; children: string }) {
  return (
    <div className="dc-formula">
      {label && <div className="dc-formula-label">{label}</div>}
      <div className="dc-formula-expr">{children}</div>
    </div>
  );
}

function StepList({ steps }: { steps: { title: string; desc: string }[] }) {
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

// ─── PAGE: PIPELINE OVERVIEW ───
function PageOverview() {
  return (
    <div className="dc-page">
      <div className="dc-page-hero">
        <Badge variant="blue">Architecture</Badge>
        <h1>Pipeline Overview</h1>
        <p>CABAS® evaluates organisational health through a 5-stage pipeline. Each stage builds on the previous, transforming raw interview responses into a comprehensive diagnostic report.</p>
      </div>

      <StepList steps={[
        { title: 'Question Scoring', desc: 'LLM scores each of 15 open-ended questions against multi-dimension rubrics (BARS anchors). 8 scale questions use direct conversion (1→20, 2→40, 3→60, 4→80, 5→100). Hard ceilings are applied post-scoring to prevent inflation.' },
        { title: 'Interdependency Checks', desc: '10 SAYDO pattern checks + 6 cross-question consistency checks detect contradictions between what people say and what the data shows. Pathology conditions are evaluated across linked questions.' },
        { title: 'Metric Calculation', desc: '14 core metrics (M1-M14) computed as weighted aggregations of question scores. 2 derived metrics (D1, D2) computed as averages of core metrics. Per-metric dimension weights extract specific signals.' },
        { title: 'Refinement', desc: '14 metrics × 2 LLM calls each: observation mining (structured findings with verbatim quotes) and reasoning (business impact + recommendations). Plus executive summary synthesis.' },
        { title: 'Quality Gate', desc: '5 parallel reviewers check writing quality against Iva\'s standards. Rules-based terminology check (instant) + LLM reviewers for tone and structure. Fix loop with max 2 iterations.' },
      ]} />

      <Card>
        <h3>Score Bands</h3>
        <p className="dc-text-muted">All metric scores fall into one of 5 tiers. These determine the health status label and colour coding throughout the platform.</p>
        <DataTable
          headers={['Band', 'Range', 'Meaning']}
          rows={[
            [<Badge variant="green">Leading Strength</Badge>, '85–100', 'Genuine differentiator. Top 1-2 metrics only.'],
            [<Badge variant="green">Strong</Badge>, '70–84', 'Solid performance. Maintain investment.'],
            [<Badge variant="amber">Adequate</Badge>, '55–69', 'Functional but not competitive. Could bottleneck.'],
            [<Badge variant="amber">Watch Area</Badge>, '40–54', 'Below transformation readiness. Needs attention.'],
            [<Badge variant="red">Critical Gap</Badge>, '0–39', 'Below functioning threshold. Will undermine initiatives.'],
          ]}
        />
      </Card>

      <InfoBlock type="note" title="Timing">
        Without refinement: ~20s. With refinement: ~100s. With quality gate: ~200s. Scale questions are instant (mathematical conversion).
      </InfoBlock>
    </div>
  );
}

// ─── PAGE: QUESTION BANK ───
function PageQuestions() {
  return (
    <div className="dc-page">
      <div className="dc-page-hero">
        <Badge variant="blue">Foundation</Badge>
        <h1>Question Bank</h1>
        <p>28 questions across 4 types form the input to the evaluation pipeline. Each question is precisely mapped to one or more metrics with defined contribution weights.</p>
      </div>

      <Card>
        <h3>Question Types</h3>
        <div className="dc-stat-grid">
          <div className="dc-stat"><div className="dc-stat-num">15</div><div className="dc-stat-label">Open-Ended</div><div className="dc-stat-desc">Scored by LLM with dimension rubrics</div></div>
          <div className="dc-stat"><div className="dc-stat-num">8</div><div className="dc-stat-label">Scale 1–5</div><div className="dc-stat-desc">Direct conversion: score = value × 20</div></div>
          <div className="dc-stat"><div className="dc-stat-num">2</div><div className="dc-stat-label">Percentage</div><div className="dc-stat-desc">X3a/X3b with distance-from-ideal</div></div>
          <div className="dc-stat"><div className="dc-stat-num">3</div><div className="dc-stat-label">Select</div><div className="dc-stat-desc">B5 multi-select, B6 single-select, B1 open</div></div>
        </div>
      </Card>

      <Card>
        <h3>Complete Question List</h3>
        <DataTable
          compact
          headers={['Code', 'Type', 'Summary', 'Primary Metric']}
          rows={[
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
          ]}
        />
      </Card>

      <InfoBlock type="tip" title="Scale Conversion">
        All 1-5 scale questions use the same formula: <strong>Score = Scale × 20</strong>. No AI interpretation. 1→20, 2→40, 3→60, 4→80, 5→100.
      </InfoBlock>
    </div>
  );
}

// ─── PAGE: SCORING RUBRICS ───
function PageRubrics() {
  const { data: rubrics, loading } = useDocsData<Record<string, any>>('scoring-rubrics');
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const questionOrder = ['I1','R1','I2','M1','S1','C1','C2','C4','R2','B2','P2','RA1','RA2','OL1','OL2'];

  return (
    <div className="dc-page">
      <div className="dc-page-hero">
        <Badge>Scoring</Badge>
        <h1>Dimension Rubrics &amp; Ceilings</h1>
        <p>Each open-ended question is scored against 3-5 dimensions using Behaviourally Anchored Rating Scales (BARS). Hard ceilings cap scores when specific conditions are detected.</p>
      </div>

      {/* Scoring Architecture */}
      <Card>
        <h3>Scoring Architecture</h3>
        <p className="dc-text-muted">The LLM receives the respondent's text alongside the full rubric for that question — dimensions, BARS anchors, and critical flags. It scores each dimension independently, then the platform computes the weighted overall.</p>
        <StepList steps={[
          { title: 'Load rubric for question', desc: 'Each of the 15 open-ended questions has a unique rubric in scoring_rubrics.json with 3-5 dimensions, each with 5 BARS anchor levels.' },
          { title: 'LLM scores each dimension 1-5', desc: 'The LLM matches the response to the closest BARS anchor for each dimension. Returns score, confidence (high/medium/low), and reasoning.' },
          { title: 'Compute weighted average', desc: 'Overall = Σ(dimension_score × dimension_weight) ÷ Σ(weights). Level 1-5 maps to 20-100.' },
          { title: 'Apply hard ceiling', desc: 'If a ceiling condition is met (e.g., blame detected in C1), the overall score is capped. Dimension scores are preserved for metric-level weighting.' },
        ]} />
        <FormulaBlock label="Overall Score Formula">
          {'Overall = Σ (dimension_level × dimension_weight%) ÷ 100 × 20  →  0-100 scale'}
        </FormulaBlock>
      </Card>

      {/* Live Rubrics */}
      <Card>
        <h3>Question Rubrics</h3>
        <p className="dc-text-muted">
          {loading ? 'Loading rubrics from backend...' : `${Object.keys(rubrics || {}).length} rubrics loaded live from scoring_rubrics.json. Click any question to view its full dimension rubric.`}
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
              const totalWeight = dims.reduce((s: number, d: any) => s + (d.weight || 0), 0);

              return (
                <div key={qCode} className={`dc-rubric ${isOpen ? 'dc-rubric--open' : ''}`}>
                  <button className="dc-rubric-header" onClick={() => setExpandedQ(isOpen ? null : qCode)}>
                    <div className="dc-rubric-code">{qCode}</div>
                    <div className="dc-rubric-meta">
                      <span className="dc-rubric-dims">{dims.length} dimensions</span>
                      <span className="dc-rubric-type">{r.scoring_type || 'dimensional'}</span>
                    </div>
                    <svg className={`dc-rubric-chevron ${isOpen ? 'dc-rubric-chevron--open' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="dc-rubric-body">
                      {/* Formula */}
                      <div className="dc-rubric-formula">
                        <span className="dc-rubric-formula-label">Formula</span>
                        <span className="dc-rubric-formula-text">
                          {dims.map((d: any) => `${d.id}(${d.weight}%)`).join(' + ')}
                          {totalWeight !== 100 && ` — normalised from ${totalWeight}%`}
                        </span>
                      </div>

                      {/* Critical Flags */}
                      {r.critical_flags && typeof r.critical_flags === 'object' && !Array.isArray(r.critical_flags) && Object.keys(r.critical_flags).length > 0 && (
                        <div className="dc-rubric-flags">
                          <div className="dc-rubric-flags-label">Critical Flags</div>
                          {Object.entries(r.critical_flags).map(([flagId, flag]: [string, any]) => (
                            <div key={flagId} className="dc-rubric-flag">
                              <Badge variant="red">{flagId}</Badge>
                              <span>{flag.condition || flag}</span>
                              {flag.max_score && <Badge variant="amber">max: {flag.max_score}</Badge>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Dimensions */}
                      {dims.map((dim: any) => (
                        <div key={dim.id} className="dc-dimension">
                          <div className="dc-dimension-header">
                            <div className="dc-dimension-name">{dim.name}</div>
                            <Badge variant="blue">{dim.weight}%</Badge>
                          </div>
                          {dim.description && (
                            <p className="dc-dimension-desc">{dim.description}</p>
                          )}
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

      {/* Hard Score Ceilings */}
      <Card>
        <h3>Hard Score Ceilings</h3>
        <p className="dc-text-muted">7 rules from the Master Brief. Applied post-scoring, before metric calculation. Principle: score what the org DOES, not how well the respondent describes it.</p>
        <DataTable
          headers={['Q', 'Ceiling', 'Condition', 'Metric Affected']}
          rows={[
            ['S1', '≤ 60', 'Fewer than 4 of 5 signal types mentioned', 'Market Radar'],
            ['I1', '≤ 65', 'Change compliance-driven/reactive, timeline >3 months', '5 metrics'],
            ['R1', '≤ 55', 'Workarounds, friction, or manual processes described', 'Capacity & Tools'],
            ['C2', '≤ 55', 'Under 4 sentences, no specific examples', 'Change Readiness'],
            ['OL1', '≤ 45', 'Ownership delay >2 weeks in example', 'Accountability Speed'],
            ['I2', '≤ 55', 'Barriers >> enablers, approvals/bureaucracy cited', 'Impl. Speed'],
            ['C1', '≤ 60', 'Any blame/finger-pointing, even if learning followed', 'Change Readiness'],
          ]}
        />
      </Card>

      <InfoBlock type="danger" title="Critical Principle">
        A respondent who clearly explains why their organisation fails at something scores LOW on that capability, even if the explanation is detailed and insightful. Eloquence ≠ capability.
      </InfoBlock>
    </div>
  );
}

// ─── PAGE: METRICS ───
function PageMetrics() {
  return (
    <div className="dc-page">
      <div className="dc-page-hero">
        <Badge>Scoring</Badge>
        <h1>Metric Definitions</h1>
        <p>14 core metrics + 2 derived metrics. Each metric is a weighted aggregation of specific question scores, measuring a distinct dimension of organisational health.</p>
      </div>

      <Card>
        <h3>Core Metrics (M1–M14)</h3>
        <DataTable
          headers={['Code', 'Client Name', 'Formula (Question Weights)']}
          rows={[
            ['M1', 'Operational Strength', 'I1(25%) + I4(30%) + X3a(20%) + R1(10%) + B5(15%CL)'],
            ['M2', 'Future Readiness', 'S5(25%) + I1(15%) + X4(15%) + B6(10%) + X3b(10%) + R2(10%) + S3a(10%)'],
            ['M3', 'Insight-to-Action', 'M1(30%) + I1(25%) + C2(25%) + S1(20%)'],
            ['M4', 'Implementation Speed', 'M4scale(50%) + I2(30%) + X4(20%)'],
            ['M5', 'Market Radar', 'S1(50%) + S5(30%) + B6(20%)'],
            ['M6', 'Decision Flow', 'M1(35%) + M4scale(50%) + R1(15%)'],
            ['M7', 'Knowledge Leverage', 'I1(100%) with per-metric dimension weights'],
            ['M8', 'Accountability Speed', 'OL1(40%) + OL2(40%) + I2(10%) + M4(10%)'],
            ['M9', 'Run/Transform Balance', 'X3a + X3b (distance-from-ideal with B6 context)'],
            ['M10', 'Change Readiness', 'C3(20%) + C1(20%) + S3a(15%) + I1(15%) + C2(15%) + I4(15%)'],
            ['M11', 'Structure Fitness', 'M4(30%) + C4(25%) + I4(20%) + I2(15%) + B5(10%CL)'],
            ['M12', 'Capacity & Tools', 'R1(60%) + R2(25%) + R3(15%)'],
            ['M13', 'Defensible Strengths', 'B2(20%) + B5(30%) + I1(25%) + R2(10%) + C1(15%)'],
            ['M14', 'Risk Tolerance', 'RA1(50%) + RA2(30%) + C3(20%)'],
          ]}
        />
      </Card>

      <Card>
        <h3>Derived Metrics</h3>
        <FormulaBlock label="D1 — OODA Velocity">{'(M5 Market Radar + M6 Decision Flow + M8 Accountability Speed + M4 Implementation Speed) ÷ 4'}</FormulaBlock>
        <FormulaBlock label="D2 — Resilience Index">{'(M12 Capacity & Tools + M10 Change Readiness + M3 Insight-to-Action) ÷ 3'}</FormulaBlock>
        <p className="dc-text-muted">Derived metrics are simple averages. No LLM calls — calculated directly from core metric scores.</p>
      </Card>

      <InfoBlock type="note" title="CL = Cross-Level">
        Questions marked CL require multi-respondent data. For N=1, the weight is redistributed to other contributing questions.
      </InfoBlock>
    </div>
  );
}

// ─── PAGE: PATHOLOGY DETECTION ───
function PagePathologies() {
  return (
    <div className="dc-page">
      <div className="dc-page-hero">
        <Badge variant="red">Analysis</Badge>
        <h1>Pathology Detection</h1>
        <p>7 organisational pathologies with precise detection logic. Each requires ALL conditions to be met (AND logic). Partial matches (2 of 3) display as "Indicators".</p>
      </div>

      <Card>
        <h3>Detection Logic</h3>
        <DataTable
          headers={['#', 'Pathology', 'Risk', 'Conditions (ALL must met)', 'Questions']}
          rows={[
            ['1', 'Safety Crisis', <Badge variant="red">CRITICAL</Badge>, 'C1=BLAME AND C3<3 AND S3a<3', 'C1, C3, S3a'],
            ['2', 'Power Block', <Badge variant="red">CRITICAL</Badge>, 'PB1=repeated veto AND C3<4 AND I4<3', 'PB1, C3, I4'],
            ['3', 'Implementation Gap', <Badge variant="red">CRITICAL</Badge>, 'Leader-frontline gap >1.5 on C3 OR I4', 'B1, C3, I4'],
            ['4', 'Risk Paralysis', <Badge variant="amber">HIGH</Badge>, 'RA1<30 AND RA2=punish AND I2=approvals AND C3<4', 'RA1, RA2, I2, C3'],
            ['5', 'Accountability Vacuum', <Badge variant="amber">HIGH</Badge>, 'OL1=falls through AND OL2>1wk AND I2=unclear ownership', 'OL1, OL2, I2'],
            ['6', 'Optimization Lock', <Badge variant="amber">HIGH</Badge>, 'X3a>80% AND X3b<10% AND B6≥Fast', 'X3a, X3b, B6'],
            ['7', 'Activity Without Impact', <Badge variant="amber">HIGH</Badge>, 'X3b>20% AND I4<3', 'X3b, I4'],
          ]}
        />
      </Card>

      <Card>
        <h3>Historical Case Anchors</h3>
        <p className="dc-text-muted">Each pathology is anchored to a recognisable real-world case for calibration and client communication.</p>
        <DataTable
          compact
          headers={['Case', 'Year', 'Pathology', 'Key Lesson']}
          rows={[
            ['Challenger', '1986', 'Safety Crisis', 'Information present, structure made it impossible to act'],
            ['Nokia', '2007', 'Implementation Gap', 'Middle management filtered signals before reaching the top'],
            ['Kodak', '1975–2012', 'Optimization Lock', 'Success made reallocation feel irrational'],
            ['Columbia', '2003', 'Activity Without Impact', 'More safety processes ≠ better decisions'],
            ['Bay of Pigs', '1961', 'Risk Paralysis', 'Unanimous support for a plan nobody believed would work'],
            ['Titanic', '1912', 'Accountability Vacuum', '6 warnings received, 0 converted to action'],
            ['Enron', '2001', 'Power Block', 'Formal governance existed but couldn\'t override informal power'],
          ]}
        />
      </Card>
    </div>
  );
}

// ─── PAGE: SAY-DO CHECKS ───
function PageSayDo() {
  return (
    <div className="dc-page">
      <div className="dc-page-hero">
        <Badge variant="amber">Analysis</Badge>
        <h1>Say-Do Contradiction Checks</h1>
        <p>Detecting gaps between what people say (scale ratings) and what the data shows (narrative evidence). The core differentiator that justifies CABAS's diagnostic value.</p>
      </div>

      <Card>
        <h3>Pattern Checks (SAYDO-01 to SAYDO-10)</h3>
        <p className="dc-text-muted">Each check compares a scale rating ≥4 against narrative content that contradicts it.</p>
        <DataTable
          headers={['Flag', 'Trigger', 'Pathology Link', 'N=1?']}
          rows={[
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
          ]}
        />
      </Card>

      <Card>
        <h3>Cross-Question Consistency Checks</h3>
        <p className="dc-text-muted">6 checks comparing related questions. All active for single-respondent assessments.</p>
        <DataTable
          headers={['Pair', 'Expected Alignment', 'Flag Condition']}
          rows={[
            ['S3a vs C3', 'Both measure psychological safety', 'Difference > 1 point (>20 on 0-100)'],
            ['C1 vs RA2', 'Both about response to failure', 'C1 shows blame but RA2 denies punishment'],
            ['X3b vs R2', 'Both about exploration activity', 'X3b >20% but R2 shows limited pilots'],
            ['M1 vs M4', 'Process vs effectiveness', 'M1 isolated but M4 ≥4'],
            ['I2 vs P2', 'Barriers should overlap', 'Completely different barriers cited'],
            ['OL1 vs OL2', 'Orphan handling vs speed', 'OL1 shows long delay, OL2 claims fast'],
          ]}
        />
      </Card>

      <InfoBlock type="warning" title="Single-Respondent Rule">
        Only SAYDO-08 and SAYDO-09 (level-based triangulation) are suppressed for N=1. Everything else fires normally.
      </InfoBlock>
    </div>
  );
}

// ─── PAGE: QUADRANT ───
function PageQuadrant() {
  return (
    <div className="dc-page">
      <div className="dc-page-hero">
        <Badge variant="green">Analysis</Badge>
        <h1>Quadrant Classification</h1>
        <p>A 2×2 matrix based on Operational Strength (M1) and Future Readiness (M2) determines the organisation's strategic position and the report's tone.</p>
      </div>

      <Card>
        <h3>Classification Grid</h3>
        <div className="dc-quadrant-grid">
          <div className="dc-quadrant dc-quadrant--tl">
            <div className="dc-quadrant-label">Scattered Experimenter</div>
            <div className="dc-quadrant-cond">Low OS + High FR</div>
            <div className="dc-quadrant-tone">Validating but grounding</div>
          </div>
          <div className="dc-quadrant dc-quadrant--tr">
            <div className="dc-quadrant-label">Adaptive Leader</div>
            <div className="dc-quadrant-cond">High OS + High FR</div>
            <div className="dc-quadrant-tone">Respectful, nuanced</div>
          </div>
          <div className="dc-quadrant dc-quadrant--bl">
            <div className="dc-quadrant-label">At-Risk</div>
            <div className="dc-quadrant-cond">Low OS + Low FR</div>
            <div className="dc-quadrant-tone">Compassionate, unflinching</div>
          </div>
          <div className="dc-quadrant dc-quadrant--br">
            <div className="dc-quadrant-label">Solid Performer</div>
            <div className="dc-quadrant-cond">High OS + Low FR</div>
            <div className="dc-quadrant-tone">Direct, urgent</div>
          </div>
        </div>
        <FormulaBlock label="Threshold">{'High ≥ configurable threshold | Low < threshold'}</FormulaBlock>
      </Card>
    </div>
  );
}

// ─── PAGE: TRAINING DATA ───
function PageTrainingData() {
  return (
    <div className="dc-page">
      <div className="dc-page-hero">
        <Badge>Reference</Badge>
        <h1>Training Data Bank</h1>
        <p>10 structured JSON files provide reference data for AI calibration. All stored in <code>data/training/</code> and cached after first load.</p>
      </div>

      <Card>
        <h3>File Inventory</h3>
        <DataTable
          headers={['File', 'Content', 'Used By']}
          rows={[
            ['historical_cases.json', '10 real-world pathology cases', 'Pathology checker + refinement prompt'],
            ['scoring_signals.json', 'Per-dimension keywords per level', 'Question scoring prompt'],
            ['calibration_examples.json', 'Good/bad scoring examples', 'Question scoring prompt'],
            ['sector_norms.json', '6 industry profiles', 'Refinement context injection'],
            ['executive_summary_examples.json', '8 quadrant examples + 10 golden rules + 8 pathology templates', 'Report summary prompt'],
            ['say_do_gap_examples.json', 'Good/bad contradiction narratives', 'Quality gate reviewer'],
            ['recommendation_examples.json', 'Monday Morning Test per quadrant', 'Quality gate reviewer'],
            ['pathology_roadmaps.json', '8 phased 1/2/3 month plans', 'Refinement + dashboard UI'],
            ['label_translations.json', '45 academic → plain-language', 'All output generation'],
            ['score_ceilings.json', '7 hard ceiling rules', 'Post-scoring enforcement'],
          ]}
        />
      </Card>
    </div>
  );
}

// ─── PAGE: REFINEMENT ───
function PageRefinement() {
  return (
    <div className="dc-page">
      <div className="dc-page-hero">
        <Badge variant="blue">Output</Badge>
        <h1>Refinement Pipeline</h1>
        <p>Stage 4 generates all client-facing narrative text. 28 LLM calls for metrics + 1 for executive summary + 1 for VRIN assessment.</p>
      </div>

      <Card>
        <h3>Per-Metric Generation (×14)</h3>
        <StepList steps={[
          { title: 'Phase 1: Observation Mining', desc: 'Extract structured findings through analytical lenses. Each observation has verbatim evidence quotes, sentiment, and severity. Every quote must be copied EXACTLY from responses.' },
          { title: 'Phase 2: Reasoning & Recommendations', desc: 'Business impact analysis, 1-3 concrete recommendations per metric, synthesised summary. Every recommendation must pass the Monday Morning Test.' },
        ]} />
      </Card>

      <Card>
        <h3>Executive Summary — 10 Golden Rules</h3>
        <CodeBlock title="Rules">
{`1. Lead with single most important finding + concrete number
2. Name the quadrant + explain in plain business language
3. State gap between strongest and weakest metric
4. Name pathologies immediately (or say "none detected")
5. End with commercial consequence of action vs inaction
6. SME role titles only (MD, Operations Manager — never COO/CIO)
7. Single-respondent caveat when N=1
8. Differentiate metric statuses (never paint all same colour)
9. Every quote must be real respondent answer
10. 150-250 words — every word earns its place`}
        </CodeBlock>
      </Card>
    </div>
  );
}

// ─── PAGE: QUALITY GATE ───
function PageQualityGate() {
  return (
    <div className="dc-page">
      <div className="dc-page-hero">
        <Badge variant="blue">Output</Badge>
        <h1>Quality Gate</h1>
        <p>Stage 5 validates all LLM-generated text against writing quality standards. Reviewers NEVER change scores or findings — only writing quality.</p>
      </div>

      <Card>
        <h3>5 Parallel Reviewers</h3>
        <DataTable
          headers={['Reviewer', 'Checks Against', 'Reference Data']}
          rows={[
            ['Executive Summary', '10 golden rules + quadrant tone', 'executive_summary_examples.json'],
            ['Metric Narratives', 'Lead with insight, cite evidence, no filler', 'Rules MN-1 to MN-5'],
            ['Pathology Descriptions', 'Template compliance, data fill', 'Pathology statement templates'],
            ['Recommendations', 'Monday Morning Test, SME titles', 'recommendation_examples.json'],
            ['Say-Do Narratives', 'Quote quality, score connection', 'say_do_gap_examples.json'],
          ]}
        />
      </Card>

      <Card>
        <h3>Rules Checker (Instant)</h3>
        <p className="dc-text-muted">Deterministic checks. No LLM needed.</p>
        <DataTable
          compact
          headers={['Check', 'Catches']}
          rows={[
            ['Banned terminology', '15+ academic terms (VRIN, Ambidexterity, etc.)'],
            ['C-suite titles', 'COO, CIO, CLO, VP → must be SME titles'],
            ['Unfilled placeholders', '[X], [Y], [Z] not replaced with data'],
            ['Voice artifacts', 'Transcription phrases cited as quotes'],
            ['Filler phrases', '"dynamic landscape", "it is important to note"'],
            ['Word count', 'Executive summary 150-250 words'],
            ['N=1 caveat', 'Missing single-respondent disclosure'],
          ]}
        />
      </Card>
    </div>
  );
}

// ─── PAGE: TERMINOLOGY ───
function PageTerminology() {
  return (
    <div className="dc-page">
      <div className="dc-page-hero">
        <Badge variant="red">Reference</Badge>
        <h1>Terminology Map</h1>
        <p>No academic term may appear in ANY client-facing output. The quality gate enforces this automatically.</p>
      </div>

      <Card>
        <DataTable
          headers={['Prohibited (Academic)', 'Use This (Client-Facing)', 'Source']}
          rows={[
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
          ]}
        />
      </Card>
    </div>
  );
}

// ─── PAGES REGISTRY ───
const PAGES: DocPage[] = [
  { id: 'overview', label: 'Pipeline Overview', group: 'getting-started', content: PageOverview },
  { id: 'questions', label: 'Question Bank', group: 'getting-started', content: PageQuestions },
  { id: 'rubrics', label: 'Rubrics & Ceilings', group: 'scoring', content: PageRubrics },
  { id: 'metrics', label: 'Metric Definitions', group: 'scoring', content: PageMetrics },
  { id: 'pathologies', label: 'Pathology Detection', group: 'analysis', content: PagePathologies },
  { id: 'saydo', label: 'Say-Do Checks', group: 'analysis', content: PageSayDo },
  { id: 'quadrant', label: 'Quadrant Classification', group: 'analysis', content: PageQuadrant },
  { id: 'training', label: 'Training Data Bank', group: 'reference', content: PageTrainingData },
  { id: 'refinement', label: 'Refinement Pipeline', group: 'output', content: PageRefinement },
  { id: 'quality', label: 'Quality Gate', group: 'output', content: PageQualityGate },
  { id: 'terminology', label: 'Terminology Map', group: 'reference', content: PageTerminology },
];

// ─── MAIN DOCS COMPONENT ───
export function DocsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('docs-theme') as 'light' | 'dark') || 'light'
  );
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem('docs-theme', theme);
  }, [theme]);

  const currentIndex = PAGES.findIndex(p => p.id === activePage);
  const prevPage = currentIndex > 0 ? PAGES[currentIndex - 1] : null;
  const nextPage = currentIndex < PAGES.length - 1 ? PAGES[currentIndex + 1] : null;
  const CurrentContent = PAGES[currentIndex]?.content || PageOverview;

  const navigate = (id: string) => {
    setActivePage(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`dc ${theme}`} data-theme={theme}>
      {/* ─── Header ─── */}
      <header className="dc-header">
        <div className="dc-header-left">
          <button className="dc-icon-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
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
          <span className="dc-badge dc-badge--default">v2.2</span>
          <button className="dc-icon-btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <div className="dc-layout">
        {/* ─── Sidebar ─── */}
        <aside className={`dc-sidebar ${sidebarOpen ? '' : 'dc-sidebar--closed'}`}>
          <nav>
            {GROUPS.map(group => (
              <div key={group.id} className="dc-nav-group">
                <div className="dc-nav-group-label">{group.label}</div>
                {PAGES.filter(p => p.group === group.id).map(page => (
                  <button
                    key={page.id}
                    className={`dc-nav-link ${activePage === page.id ? 'dc-nav-link--active' : ''}`}
                    onClick={() => navigate(page.id)}
                  >
                    {page.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {/* ─── Main Content ─── */}
        <main className={`dc-main ${sidebarOpen ? '' : 'dc-main--full'}`}>
          <CurrentContent />

          {/* ─── Prev / Next Navigation ─── */}
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
