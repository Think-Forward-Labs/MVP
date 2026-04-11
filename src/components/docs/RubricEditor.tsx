import { useState, useEffect, useRef } from 'react';

const DOCS_API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface Anchor { level: number; score_range: string; behavior: string; }
interface Dimension { id: string; name: string; description?: string; weight: number; anchors: Anchor[]; }
interface Rubric { dimensions: Dimension[]; critical_flags?: Record<string, any>; scoring_type?: string; scoring_formula?: any; question_code?: string; question_id?: string; question_text?: string; }
interface CeilingRule { question_code: string; ceiling: number; condition: string; }

interface Props {
  questionCode: string;
  onRubricChange: (rubric: Rubric | null, isDirty: boolean) => void;
}

export function RubricEditor({ questionCode, onRubricChange }: Props) {
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [ceilingRule, setCeilingRule] = useState<CeilingRule | null>(null);
  const [source, setSource] = useState<'live' | 'playground'>('live');
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const saveTimer = useRef<any>(null);
  const historyTimer = useRef<any>(null);

  // Load playground state (or live as fallback) when question changes
  useEffect(() => {
    if (!questionCode) return;
    fetch(`${DOCS_API}/admin/docs/playground/state/${questionCode}`)
      .then(r => r.json())
      .then(d => {
        setRubric(d.rubric || {});
        setCeilingRule(d.ceiling_rule || null);
        setSource(d.source || 'live');
        if (d.source === 'playground') {
          onRubricChange(d.rubric, true);
        } else {
          onRubricChange(null, false);
        }
      })
      .catch(() => {});

    // Load history
    fetch(`${DOCS_API}/admin/docs/playground/history/${questionCode}`)
      .then(r => r.json())
      .then(d => setHistory(d.entries || []))
      .catch(() => setHistory([]));
  }, [questionCode]);

  if (!rubric || !rubric.dimensions?.length) {
    return <div className="re-empty">No rubric data available for this question type.</div>;
  }

  const totalWeight = rubric.dimensions.reduce((s, d) => s + (d.weight || 0), 0);
  const weightValid = Math.abs(totalWeight - 100) <= 1;

  // Auto-save to playground state after each change (debounced)
  const autoSave = (updatedRubric: Rubric, updatedCeiling?: CeilingRule | null) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload = { rubric: updatedRubric, ceiling_rule: updatedCeiling ?? ceilingRule };
      // Save state
      fetch(`${DOCS_API}/admin/docs/playground/state/${questionCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(() => setSource('playground')).catch(() => {});

      // Append to history (debounced longer to avoid flooding)
      if (historyTimer.current) clearTimeout(historyTimer.current);
      historyTimer.current = setTimeout(() => {
        fetch(`${DOCS_API}/admin/docs/playground/history/${questionCode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).then(r => r.json()).then(() => {
          // Refresh history list
          fetch(`${DOCS_API}/admin/docs/playground/history/${questionCode}`)
            .then(r => r.json())
            .then(d => setHistory(d.entries || []))
            .catch(() => {});
        }).catch(() => {});
      }, 2000);
    }, 500);
  };

  const updateRubric = (updated: Rubric) => {
    setRubric(updated);
    onRubricChange(updated, true);
    autoSave(updated);
  };

  const updateDimension = (idx: number, field: string, value: any) => {
    const updated = JSON.parse(JSON.stringify(rubric));
    (updated.dimensions[idx] as any)[field] = value;
    updateRubric(updated);
  };

  const updateAnchor = (dimIdx: number, anchorIdx: number, field: string, value: string) => {
    const updated = JSON.parse(JSON.stringify(rubric));
    (updated.dimensions[dimIdx].anchors[anchorIdx] as any)[field] = value;
    updateRubric(updated);
  };

  const removeDimension = (idx: number) => {
    const updated = JSON.parse(JSON.stringify(rubric));
    updated.dimensions.splice(idx, 1);
    updateRubric(updated);
  };

  const addDimension = () => {
    const updated = JSON.parse(JSON.stringify(rubric));
    updated.dimensions.push({
      id: `new_dimension_${Date.now()}`,
      name: 'New Dimension',
      description: '',
      weight: 0,
      anchors: [5,4,3,2,1].map(l => ({ level: l, score_range: `${(l-1)*20}-${l*20}`, behavior: '' })),
    });
    updateRubric(updated);
  };

  const updateCriticalFlag = (flagId: string, field: string, value: any) => {
    const updated = JSON.parse(JSON.stringify(rubric));
    if (!updated.critical_flags) updated.critical_flags = {};
    if (!updated.critical_flags[flagId]) updated.critical_flags[flagId] = { condition: '' };
    updated.critical_flags[flagId][field] = value;
    updateRubric(updated);
  };

  const removeCriticalFlag = (flagId: string) => {
    const updated = JSON.parse(JSON.stringify(rubric));
    if (updated.critical_flags) delete updated.critical_flags[flagId];
    updateRubric(updated);
  };

  const addCriticalFlag = () => {
    const updated = JSON.parse(JSON.stringify(rubric));
    if (!updated.critical_flags) updated.critical_flags = {};
    updated.critical_flags[`flag_${Date.now()}`] = { condition: 'New flag condition', signals: [], action: '', max_score: null };
    updateRubric(updated);
  };

  const updateCeiling = (field: string, value: any) => {
    const updated = { ...ceilingRule, [field]: value } as CeilingRule;
    setCeilingRule(updated);
    autoSave(rubric, updated);
  };

  const resetToLive = async () => {
    try {
      await fetch(`${DOCS_API}/admin/docs/playground/state/${questionCode}`, { method: 'DELETE' });
      const r = await fetch(`${DOCS_API}/admin/docs/playground/state/${questionCode}`);
      const d = await r.json();
      setRubric(d.rubric || {});
      setCeilingRule(d.ceiling_rule || null);
      setSource('live');
      onRubricChange(null, false);
      setMessage('Reset to live rubric');
      setTimeout(() => setMessage(''), 2000);
    } catch {}
  };

  const publishToLive = async () => {
    setPublishing(true);
    try {
      // First save current state
      await fetch(`${DOCS_API}/admin/docs/playground/state/${questionCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rubric, ceiling_rule: ceilingRule }),
      });

      // Then publish — overwrite live rubric
      const question_id = `q_cabas_${questionCode.toLowerCase()}`;
      const r = await fetch(`${DOCS_API}/admin/docs/playground/publish/${questionCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rubric }),
      });

      if (r.ok) {
        setMessage('Published to live ✓');
        setSource('live');
        onRubricChange(null, false);
        // Delete playground state since it now matches live
        await fetch(`${DOCS_API}/admin/docs/playground/state/${questionCode}`, { method: 'DELETE' });
      } else {
        const err = await r.json();
        setMessage(`Error: ${err.detail}`);
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
    setPublishing(false);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="re">
      {/* Header */}
      <div className="re-header">
        <h3>Advanced Settings — {questionCode}</h3>
        <div className="re-header-actions">
          <span className={`re-source-badge re-source-badge--${source}`}>
            {source === 'playground' ? '⚙️ Playground' : '🟢 Live'}
          </span>
          <button className="re-btn re-btn--ghost" onClick={resetToLive}>Reset to Live</button>
        </div>
      </div>

      {message && <div className="re-message">{message}</div>}

      {source === 'playground' && (
        <div className="re-auto-save-note">Changes auto-saved to playground. Production not affected.</div>
      )}

      {/* Weight indicator */}
      <div className={`re-weight-bar ${weightValid ? 're-weight-bar--valid' : 're-weight-bar--invalid'}`}>
        <span>Total Weight: {totalWeight}%</span>
        <span>{weightValid ? '✓ Valid' : '✗ Must equal 100%'}</span>
      </div>

      {/* Dimensions */}
      {rubric.dimensions.map((dim, di) => (
        <div key={dim.id} className="re-dim">
          <div className="re-dim-header">
            <input className="re-input re-input--name" value={dim.name}
              onChange={e => updateDimension(di, 'name', e.target.value)} placeholder="Dimension name" />
            <div className="re-dim-weight">
              <input className="re-input re-input--weight" type="number" min={0} max={100}
                value={dim.weight} onChange={e => updateDimension(di, 'weight', parseInt(e.target.value) || 0)} />
              <span>%</span>
            </div>
            <button className="re-btn re-btn--danger-sm" onClick={() => removeDimension(di)} title="Remove">×</button>
          </div>
          <input className="re-input re-input--id" value={dim.id}
            onChange={e => updateDimension(di, 'id', e.target.value)} placeholder="dimension_id (snake_case)" />
          {dim.description !== undefined && (
            <textarea className="re-input re-input--desc" value={dim.description || ''}
              onChange={e => updateDimension(di, 'description', e.target.value)} placeholder="Description (optional)" rows={2} />
          )}
          <div className="re-anchors">
            <div className="re-anchors-label">BARS Anchors</div>
            {dim.anchors.map((a, ai) => (
              <div key={a.level} className="re-anchor">
                <div className={`re-anchor-level re-anchor-level--${a.level}`}>{a.level}</div>
                <input className="re-input re-input--range" value={a.score_range}
                  onChange={e => updateAnchor(di, ai, 'score_range', e.target.value)} placeholder="0-20" />
                <textarea className="re-input re-input--behavior" value={a.behavior}
                  onChange={e => updateAnchor(di, ai, 'behavior', e.target.value)} placeholder="Behavioral anchor description" rows={2} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button className="re-btn re-btn--add" onClick={addDimension}>+ Add Dimension</button>

      {/* Ceiling rule (editable) */}
      {ceilingRule && (
        <div className="re-ceiling">
          <div className="re-ceiling-label">Score Ceiling</div>
          <div className="re-ceiling-edit">
            <span className="re-ceiling-prefix">≤</span>
            <input className="re-input re-input--ceiling-val" type="number" min={0} max={100}
              value={ceilingRule.ceiling} onChange={e => updateCeiling('ceiling', parseInt(e.target.value) || 0)} />
          </div>
          <textarea className="re-input re-input--ceiling-cond" value={ceilingRule.condition}
            onChange={e => updateCeiling('condition', e.target.value)} rows={2} placeholder="Ceiling condition" />
        </div>
      )}

      {/* Critical Flags (editable) */}
      <div className="re-flags">
        <div className="re-flags-header">
          <div className="re-flags-label">Critical Flags</div>
          <button className="re-btn re-btn--ghost" onClick={addCriticalFlag}>+ Add Flag</button>
        </div>
        {rubric.critical_flags && typeof rubric.critical_flags === 'object' &&
          Object.entries(rubric.critical_flags).map(([id, flag]: [string, any]) => {
            const flagObj = typeof flag === 'string' ? { condition: flag } : flag;
            return (
              <div key={id} className="re-flag-card">
                <div className="re-flag-card-header">
                  <input className="re-input re-input--flag-id" value={id} readOnly />
                  <button className="re-btn re-btn--danger-sm" onClick={() => removeCriticalFlag(id)} title="Remove">×</button>
                </div>
                <textarea className="re-input re-input--flag-cond" value={flagObj.condition || ''}
                  onChange={e => updateCriticalFlag(id, 'condition', e.target.value)} placeholder="Condition" rows={2} />
                <div className="re-flag-row">
                  <div className="re-flag-field">
                    <label>Max Score</label>
                    <input className="re-input re-input--flag-max" type="number" min={0} max={100}
                      value={flagObj.max_score || ''} onChange={e => updateCriticalFlag(id, 'max_score', e.target.value ? parseInt(e.target.value) : null)} placeholder="—" />
                  </div>
                  <div className="re-flag-field">
                    <label>Action</label>
                    <input className="re-input" value={flagObj.action || ''}
                      onChange={e => updateCriticalFlag(id, 'action', e.target.value)} placeholder="What happens when triggered" />
                  </div>
                </div>
              </div>
            );
          })
        }
        {(!rubric.critical_flags || Object.keys(rubric.critical_flags).length === 0) && (
          <div className="re-empty">No critical flags defined.</div>
        )}
      </div>

      {/* Publish */}
      <div className="re-actions">
        <button className="re-btn re-btn--publish" onClick={publishToLive} disabled={publishing || !weightValid || source === 'live'}>
          {publishing ? 'Publishing...' : 'Publish to Live'}
        </button>
        <button className="re-btn re-btn--ghost" onClick={() => setShowHistory(!showHistory)}>
          🕐 History ({history.length})
        </button>
        {source === 'live' && <span className="re-publish-note">No changes to publish — matches live.</span>}
      </div>

      {/* Change History */}
      {showHistory && (
        <div className="re-history">
          <div className="re-history-label">Change History (last 20)</div>
          {history.length === 0 && <div className="re-empty">No changes recorded yet.</div>}
          {history.slice().reverse().map((entry, idx) => {
            const prevEntry = history[history.length - 1 - idx - 1];
            const changes = computeDiff(prevEntry?.rubric, entry.rubric, prevEntry?.ceiling_rule, entry.ceiling_rule);
            const ts = new Date(entry.timestamp);
            return (
              <div key={idx} className="re-history-entry">
                <div className="re-history-header">
                  <span className="re-history-time">{ts.toLocaleDateString()} {ts.toLocaleTimeString()}</span>
                  <button className="re-btn re-btn--ghost" onClick={() => {
                    setRubric(JSON.parse(JSON.stringify(entry.rubric)));
                    if (entry.ceiling_rule) setCeilingRule(entry.ceiling_rule);
                    onRubricChange(entry.rubric, true);
                    autoSave(entry.rubric, entry.ceiling_rule);
                    setMessage(`Restored to ${ts.toLocaleTimeString()}`);
                    setTimeout(() => setMessage(''), 2000);
                  }}>Restore</button>
                </div>
                <div className="re-history-changes">
                  {changes.length === 0 && <span className="re-history-initial">Initial snapshot</span>}
                  {changes.map((c, ci) => (
                    <div key={ci} className={`re-history-change re-history-change--${c.type}`}>
                      {c.text}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── DIFF COMPUTATION ───
function computeDiff(prevRubric: any, currRubric: any, prevCeiling: any, currCeiling: any): { type: 'modified' | 'added' | 'removed'; text: string }[] {
  if (!prevRubric || !currRubric) return [];
  const changes: { type: 'modified' | 'added' | 'removed'; text: string }[] = [];

  const prevDims = prevRubric.dimensions || [];
  const currDims = currRubric.dimensions || [];
  const prevIds = new Set(prevDims.map((d: any) => d.id));
  const currIds = new Set(currDims.map((d: any) => d.id));

  // Added dimensions
  for (const d of currDims) {
    if (!prevIds.has(d.id)) {
      changes.push({ type: 'added', text: `Added dimension: ${d.name}` });
    }
  }

  // Removed dimensions
  for (const d of prevDims) {
    if (!currIds.has(d.id)) {
      changes.push({ type: 'removed', text: `Removed dimension: ${d.name}` });
    }
  }

  // Modified dimensions
  for (const curr of currDims) {
    const prev = prevDims.find((d: any) => d.id === curr.id);
    if (!prev) continue;

    if (prev.weight !== curr.weight) {
      changes.push({ type: 'modified', text: `${curr.name} weight: ${prev.weight}% → ${curr.weight}%` });
    }
    if (prev.name !== curr.name) {
      changes.push({ type: 'modified', text: `Renamed: ${prev.name} → ${curr.name}` });
    }

    // Check anchors
    for (let i = 0; i < (curr.anchors || []).length; i++) {
      const ca = curr.anchors?.[i];
      const pa = prev.anchors?.[i];
      if (ca && pa && ca.behavior !== pa.behavior) {
        changes.push({ type: 'modified', text: `${curr.name} Level ${ca.level} anchor edited` });
      }
    }
  }

  // Critical flags
  const prevFlags = Object.keys(prevRubric.critical_flags || {});
  const currFlags = Object.keys(currRubric.critical_flags || {});
  for (const f of currFlags) {
    if (!prevFlags.includes(f)) changes.push({ type: 'added', text: `Added flag: ${f}` });
  }
  for (const f of prevFlags) {
    if (!currFlags.includes(f)) changes.push({ type: 'removed', text: `Removed flag: ${f}` });
  }
  for (const f of currFlags) {
    if (prevFlags.includes(f)) {
      const pf = prevRubric.critical_flags[f];
      const cf = currRubric.critical_flags[f];
      if (JSON.stringify(pf) !== JSON.stringify(cf)) {
        changes.push({ type: 'modified', text: `Modified flag: ${f}` });
      }
    }
  }

  // Ceiling
  if (prevCeiling && currCeiling) {
    if (prevCeiling.ceiling !== currCeiling.ceiling) {
      changes.push({ type: 'modified', text: `Ceiling: ${prevCeiling.ceiling} → ${currCeiling.ceiling}` });
    }
    if (prevCeiling.condition !== currCeiling.condition) {
      changes.push({ type: 'modified', text: `Ceiling condition edited` });
    }
  }

  return changes;
}
