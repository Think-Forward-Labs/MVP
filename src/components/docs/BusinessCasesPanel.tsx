import { useState, useEffect, useRef } from 'react';

const DOCS_API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface BusinessCase {
  name: string;
  respondent?: string;
  responses: Record<string, string>;
}

interface CaseResult {
  case_name: string;
  overall_score: number;
  original_score?: number;
  ceiling_applied?: boolean;
  ceiling_reason?: string;
  confidence?: string;
  dimension_scores?: any[];
  scoring_reasoning?: string;
  error?: string;
}

interface Props {
  questionCode: string;
  questionType: string;
  rubricOverride: any;
  rubricDirty: boolean;
}

export function BusinessCasesPanel({ questionCode, questionType, rubricOverride, rubricDirty }: Props) {
  const [cases, setCases] = useState<BusinessCase[]>([]);
  const [results, setResults] = useState<CaseResult[]>([]);
  const [scoring, setScoring] = useState(false);
  const [expandedCase, setExpandedCase] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load saved cases on mount
  useEffect(() => {
    fetch(`${DOCS_API}/admin/docs/playground/cases`)
      .then(r => r.json())
      .then(d => setCases(d.cases || []))
      .catch(() => {});
  }, []);

  // Clear results when question changes
  useEffect(() => { setResults([]); setExpandedCase(null); }, [questionCode]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const uploaded = data.cases || data;
        const caseList = Array.isArray(uploaded) ? uploaded.slice(0, 10) : [];
        setCases(caseList);
        setResults([]);
        // Save to backend
        await fetch(`${DOCS_API}/admin/docs/playground/cases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cases: caseList }),
        });
      } catch { alert('Invalid JSON file'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadTemplate = () => {
    const template = {
      _instructions: "Fill in responses for each business case. Up to 10 cases. For scale questions (M4, C3, S3a, S5, I4, X4, R3, P4) use a number 1-5. For percentage questions (X3a, X3b) use a number 0-100. For single-select (B6) use the full option text. For multi-select (B5) separate options with |||. For open-ended questions, provide the respondent's narrative answer.",
      cases: [
        {
          name: "Example Company 1",
          respondent: "Managing Director",
          responses: {
            B1: "I'm the managing director, been here 8 years...",
            B2: "We provide engineering services to oil and gas operators...",
            B5: "Reliability/Dependability|||Technical Quality|||Speed/Responsiveness",
            B6: "Fast - Significant disruption underway",
            M1: "We meet weekly with the senior team to discuss...",
            M4: "3",
            S1: "I notice regulatory changes through industry briefings...",
            S3A: "2",
            S5: "3",
            I1: "One example: new emissions reporting rules came in...",
            I2: "What helps is having a clear mandate from leadership...",
            I4: "3",
            X3A: "85",
            X3B: "15",
            X4: "3",
            C1: "When a mistake happens, there was some finger pointing...",
            C2: "Leaders encourage training and share lessons...",
            C3: "3",
            C4: "Different teams respond differently to mistakes...",
            R1: "Our main platform helps streamline orders but can create friction...",
            R2: "We did a pilot with an external vendor last year...",
            R3: "3",
            P2: "Time, budget constraints, unclear priorities",
            P4: "3",
            RA1: "We bid on an offshore wind project last year...",
            RA2: "Generally leadership is fair, people aren't punished...",
            OL1: "Usually it lingers till leadership assigns an owner...",
            OL2: "It usually takes days, sometimes longer for complex issues...",
          }
        },
        {
          name: "Example Company 2",
          respondent: "Operations Director",
          responses: {
            B1: "",
            B2: "",
            B5: "",
            B6: "",
            M1: "",
            M4: "",
            S1: "",
            S3A: "",
            S5: "",
            I1: "",
            I2: "",
            I4: "",
            X3A: "",
            X3B: "",
            X4: "",
            C1: "",
            C2: "",
            C3: "",
            C4: "",
            R1: "",
            R2: "",
            R3: "",
            P2: "",
            P4: "",
            RA1: "",
            RA2: "",
            OL1: "",
            OL2: "",
          }
        }
      ]
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cabas-business-cases-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const scoreAll = async () => {
    if (!cases.length || !questionCode) return;
    setScoring(true);
    setResults([]);
    setExpandedCase(null);

    const responses = cases.map(c => ({
      case_name: c.name,
      response_text: c.responses?.[questionCode] || '',
    }));

    try {
      const r = await fetch(`${DOCS_API}/admin/docs/playground/score-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_code: questionCode,
          question_type: questionType,
          responses,
          ...(rubricDirty && rubricOverride ? { rubric_override: rubricOverride } : {}),
        }),
      });
      if (r.ok) {
        const d = await r.json();
        setResults(d.results || []);
      }
    } catch {}
    setScoring(false);
  };

  const scoreColor = (s: number) => s >= 70 ? 'var(--green)' : s >= 40 ? 'var(--amber)' : 'var(--red)';

  return (
    <>
    {/* Toggle button — always visible */}
    {!panelOpen && (
      <button className="bcp-toggle" onClick={() => setPanelOpen(true)}>
        📊 Business Cases {cases.length > 0 ? `(${cases.length})` : ''}
      </button>
    )}

    {/* Slide-over panel */}
    <div className={`bcp ${panelOpen ? '' : 'bcp--closed'}`}>
      <div className="bcp-inner">
      <button className="bcp-close" onClick={() => setPanelOpen(false)}>×</button>

      <input ref={fileRef} type="file" accept=".json" onChange={handleUpload} style={{ display: 'none' }} />

      {!cases.length ? (
        <>
        <div className="bcp-header">
          <h4>Business Cases</h4>
        </div>
        <div className="bcp-empty">
          <p>Upload a JSON file with up to 10 business cases to score them all at once.</p>
          <button className="bcp-upload-btn" onClick={() => fileRef.current?.click()}>
            📁 Upload Cases JSON
          </button>
          <button className="bcp-template-btn" onClick={downloadTemplate}>
            📥 Download Template
          </button>
        </div>
        </>
      ) : (
        <>
      <div className="bcp-header">
        <h4>Business Cases ({cases.length})</h4>
        <div className="bcp-header-actions">
          <button className="bcp-btn bcp-btn--ghost" onClick={() => fileRef.current?.click()}>Replace</button>
          <button className="bcp-btn bcp-btn--ghost" onClick={() => { setCases([]); setResults([]); }}>Clear</button>
        </div>
      </div>

      {rubricDirty && (
        <div className="bcp-override-note">⚙️ Using modified rubric</div>
      )}

      {/* Case list */}
      <div className="bcp-cases">
        {cases.map((c, i) => {
          const answer = c.responses?.[questionCode] || '';
          const result = results[i];
          const isExpanded = expandedCase === i;

          return (
            <div key={i} className={`bcp-case ${isExpanded ? 'bcp-case--expanded' : ''}`}>
              <div className="bcp-case-header" onClick={() => setExpandedCase(isExpanded ? null : i)}>
                <div className="bcp-case-name">{c.name}</div>
                {result && !result.error && (
                  <div className="bcp-case-score" style={{ color: scoreColor(result.overall_score) }}>
                    {Math.round(result.overall_score)}
                  </div>
                )}
                {result?.error && <div className="bcp-case-error">err</div>}
                {!result && <div className="bcp-case-pending">—</div>}
              </div>

              {/* Collapsed preview */}
              {!isExpanded && (
                <div className="bcp-case-preview">
                  {answer ? answer.slice(0, 80) + (answer.length > 80 ? '...' : '') : <em>No answer for {questionCode}</em>}
                </div>
              )}

              {/* Expanded view — always shows full answer, plus score details if scored */}
              {isExpanded && (
                <div className="bcp-case-detail">
                  {/* Full answer (always visible when expanded) */}
                  <div className="bcp-detail-section">
                    <div className="bcp-detail-section-label">Response</div>
                    <div className="bcp-detail-answer">{answer || <em>No answer for {questionCode}</em>}</div>
                  </div>

                  {/* Score details (only after scoring) */}
                  {result && !result.error && (
                    <>
                      <div className="bcp-detail-section">
                        <div className="bcp-detail-section-label">Score</div>
                        <div className="bcp-detail-score">
                          <span className="bcp-detail-big" style={{ color: scoreColor(result.overall_score) }}>
                            {Math.round(result.overall_score)}/100
                          </span>
                          <span className="bcp-detail-conf">{result.confidence}</span>
                          {result.ceiling_applied && (
                            <span className="bcp-detail-ceiling">⚠ {result.original_score} → {Math.round(result.overall_score)}</span>
                          )}
                        </div>
                      </div>

                      {/* Dimensions */}
                      {result.dimension_scores?.length > 0 && (
                        <div className="bcp-detail-section">
                          <div className="bcp-detail-section-label">Dimensions</div>
                          <div className="bcp-detail-dims">
                            {result.dimension_scores.map((ds: any, di: number) => (
                              <div key={di} className="bcp-detail-dim">
                                <span className="bcp-dim-name">{ds.dimension_name}</span>
                                <span className={`bcp-dim-score bcp-dim-score--${ds.score}`}>{ds.score}/5</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reasoning */}
                      {result.scoring_reasoning && (
                        <div className="bcp-detail-section">
                          <div className="bcp-detail-section-label">AI Reasoning</div>
                          <div className="bcp-detail-reasoning">{result.scoring_reasoning}</div>
                        </div>
                      )}
                    </>
                  )}

                  {result?.error && (
                    <div className="bcp-detail-error">{result.error}</div>
                  )}

                  {!result && (
                    <div className="bcp-detail-not-scored">Not scored yet — click "Score All" above</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Score All button */}
      <button className="bcp-score-all" onClick={scoreAll} disabled={scoring}>
        {scoring ? `Scoring ${cases.length} cases...` : `⚡ Score All ${cases.length} Cases`}
      </button>
      </>
      )}
      </div>
    </div>
    </>
  );
}
