import { useState, useEffect } from 'react';

const DOCS_API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface Anchor { level: number; score_range: string; behavior: string; }
interface Dimension { id: string; name: string; description?: string; weight: number; anchors: Anchor[]; }
interface CriticalFlag { condition: string; signals?: string[]; action?: string; max_score?: number; }
interface Rubric { dimensions: Dimension[]; critical_flags?: Record<string, CriticalFlag>; scoring_type?: string; scoring_formula?: any; question_code?: string; question_id?: string; question_text?: string; }
interface CeilingRule { question_code: string; ceiling: number; condition: string; }
interface Draft { filename: string; question_code: string; notes: string; saved_at: string; }

interface Props {
  questionCode: string;
  onRubricChange: (rubric: Rubric | null, isDirty: boolean) => void;
}

export function RubricEditor({ questionCode, onRubricChange }: Props) {
  const [liveRubric, setLiveRubric] = useState<Rubric | null>(null);
  const [editedRubric, setEditedRubric] = useState<Rubric | null>(null);
  const [ceilingRule, setCeilingRule] = useState<CeilingRule | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');
  const [showDrafts, setShowDrafts] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [message, setMessage] = useState('');

  // Load rubric when question changes
  useEffect(() => {
    if (!questionCode) return;
    fetch(`${DOCS_API}/admin/docs/playground/rubric/${questionCode}`)
      .then(r => r.json())
      .then(d => {
        const r = d.rubric || {};
        setLiveRubric(JSON.parse(JSON.stringify(r)));
        setEditedRubric(JSON.parse(JSON.stringify(r)));
        setCeilingRule(d.ceiling_rule || null);
        setIsDirty(false);
        onRubricChange(null, false);
      })
      .catch(() => {});

    // Load drafts
    fetch(`${DOCS_API}/admin/docs/playground/rubric-drafts/${questionCode}`)
      .then(r => r.json())
      .then(d => setDrafts(Array.isArray(d) ? d : []))
      .catch(() => setDrafts([]));
  }, [questionCode]);

  if (!editedRubric || !editedRubric.dimensions?.length) {
    return <div className="re-empty">No rubric data available for this question type.</div>;
  }

  const totalWeight = editedRubric.dimensions.reduce((s, d) => s + (d.weight || 0), 0);
  const weightValid = Math.abs(totalWeight - 100) <= 1;

  const updateDimension = (idx: number, field: string, value: any) => {
    const updated = JSON.parse(JSON.stringify(editedRubric));
    (updated.dimensions[idx] as any)[field] = value;
    setEditedRubric(updated);
    setIsDirty(true);
    onRubricChange(updated, true);
  };

  const updateAnchor = (dimIdx: number, anchorIdx: number, field: string, value: string) => {
    const updated = JSON.parse(JSON.stringify(editedRubric));
    (updated.dimensions[dimIdx].anchors[anchorIdx] as any)[field] = value;
    setEditedRubric(updated);
    setIsDirty(true);
    onRubricChange(updated, true);
  };

  const removeDimension = (idx: number) => {
    const updated = JSON.parse(JSON.stringify(editedRubric));
    updated.dimensions.splice(idx, 1);
    setEditedRubric(updated);
    setIsDirty(true);
    onRubricChange(updated, true);
  };

  const addDimension = () => {
    const updated = JSON.parse(JSON.stringify(editedRubric));
    updated.dimensions.push({
      id: `new_dimension_${Date.now()}`,
      name: 'New Dimension',
      description: '',
      weight: 0,
      anchors: [5,4,3,2,1].map(l => ({ level: l, score_range: `${(l-1)*20}-${l*20}`, behavior: '' })),
    });
    setEditedRubric(updated);
    setIsDirty(true);
    onRubricChange(updated, true);
  };

  const resetToLive = () => {
    setEditedRubric(JSON.parse(JSON.stringify(liveRubric)));
    setIsDirty(false);
    onRubricChange(null, false);
    setMessage('Reset to live rubric');
    setTimeout(() => setMessage(''), 2000);
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${DOCS_API}/admin/docs/playground/rubric-drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_code: questionCode, rubric: editedRubric, notes: draftNotes }),
      });
      if (r.ok) {
        setMessage('Draft saved ✓');
        setDraftNotes('');
        // Refresh drafts list
        const dr = await fetch(`${DOCS_API}/admin/docs/playground/rubric-drafts/${questionCode}`);
        setDrafts(await dr.json());
      } else {
        const err = await r.json();
        setMessage(`Error: ${err.detail}`);
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const loadDraft = async (filename: string) => {
    try {
      // Find full draft from list or fetch latest
      const r = await fetch(`${DOCS_API}/admin/docs/playground/rubric-drafts/${questionCode}/latest`);
      if (r.ok) {
        const draft = await r.json();
        setEditedRubric(draft.rubric);
        setIsDirty(true);
        onRubricChange(draft.rubric, true);
        setShowDrafts(false);
        setMessage(`Loaded draft from ${draft.saved_at}`);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {}
  };

  const publishDraft = async () => {
    if (!drafts.length) { setMessage('Save a draft first'); return; }
    setPublishing(true);
    try {
      const r = await fetch(`${DOCS_API}/admin/docs/playground/rubric-drafts/${questionCode}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: drafts[0].filename }),
      });
      if (r.ok) {
        setMessage('Published to live ✓');
        setLiveRubric(JSON.parse(JSON.stringify(editedRubric)));
        setIsDirty(false);
        onRubricChange(null, false);
        setShowPublishConfirm(false);
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
          {isDirty && <span className="re-dirty-badge">Modified</span>}
          <button className="re-btn re-btn--ghost" onClick={resetToLive}>Reset to Live</button>
        </div>
      </div>

      {message && <div className="re-message">{message}</div>}

      {/* Weight indicator */}
      <div className={`re-weight-bar ${weightValid ? 're-weight-bar--valid' : 're-weight-bar--invalid'}`}>
        <span>Total Weight: {totalWeight}%</span>
        <span>{weightValid ? '✓ Valid' : '✗ Must equal 100%'}</span>
      </div>

      {/* Dimensions */}
      {editedRubric.dimensions.map((dim, di) => (
        <div key={dim.id} className="re-dim">
          <div className="re-dim-header">
            <input className="re-input re-input--name" value={dim.name}
              onChange={e => updateDimension(di, 'name', e.target.value)}
              placeholder="Dimension name" />
            <div className="re-dim-weight">
              <input className="re-input re-input--weight" type="number" min={0} max={100}
                value={dim.weight}
                onChange={e => updateDimension(di, 'weight', parseInt(e.target.value) || 0)} />
              <span>%</span>
            </div>
            <button className="re-btn re-btn--danger-sm" onClick={() => removeDimension(di)} title="Remove">×</button>
          </div>

          <input className="re-input re-input--id" value={dim.id}
            onChange={e => updateDimension(di, 'id', e.target.value)}
            placeholder="dimension_id (snake_case)" />

          {dim.description !== undefined && (
            <textarea className="re-input re-input--desc" value={dim.description || ''}
              onChange={e => updateDimension(di, 'description', e.target.value)}
              placeholder="Description (optional)" rows={2} />
          )}

          {/* BARS Anchors */}
          <div className="re-anchors">
            <div className="re-anchors-label">BARS Anchors</div>
            {dim.anchors.map((a, ai) => (
              <div key={a.level} className="re-anchor">
                <div className={`re-anchor-level re-anchor-level--${a.level}`}>{a.level}</div>
                <input className="re-input re-input--range" value={a.score_range}
                  onChange={e => updateAnchor(di, ai, 'score_range', e.target.value)}
                  placeholder="0-20" />
                <textarea className="re-input re-input--behavior" value={a.behavior}
                  onChange={e => updateAnchor(di, ai, 'behavior', e.target.value)}
                  placeholder="Behavioral anchor description" rows={2} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button className="re-btn re-btn--add" onClick={addDimension}>+ Add Dimension</button>

      {/* Ceiling rule (read-only) */}
      {ceilingRule && (
        <div className="re-ceiling">
          <div className="re-ceiling-label">Score Ceiling (read-only)</div>
          <div className="re-ceiling-value">≤ {ceilingRule.ceiling}</div>
          <div className="re-ceiling-condition">{ceilingRule.condition}</div>
        </div>
      )}

      {/* Critical Flags (read-only for now) */}
      {editedRubric.critical_flags && typeof editedRubric.critical_flags === 'object' && Object.keys(editedRubric.critical_flags).length > 0 && (
        <div className="re-flags">
          <div className="re-flags-label">Critical Flags</div>
          {Object.entries(editedRubric.critical_flags).map(([id, flag]: [string, any]) => (
            <div key={id} className="re-flag">
              <span className="re-flag-id">{id}</span>
              <span>{typeof flag === 'string' ? flag : flag.condition || JSON.stringify(flag)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Draft actions */}
      <div className="re-actions">
        <div className="re-draft-row">
          <input className="re-input re-input--notes" value={draftNotes}
            onChange={e => setDraftNotes(e.target.value)}
            placeholder="Draft notes (optional)" />
          <button className="re-btn re-btn--primary" onClick={saveDraft} disabled={saving || !weightValid}>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>

        <div className="re-draft-row">
          <button className="re-btn re-btn--ghost" onClick={() => setShowDrafts(!showDrafts)}>
            {showDrafts ? 'Hide' : 'Load'} Drafts ({drafts.length})
          </button>
          <button className="re-btn re-btn--publish" onClick={() => setShowPublishConfirm(true)}
            disabled={!drafts.length || publishing}>
            Publish to Live
          </button>
        </div>
      </div>

      {/* Drafts list */}
      {showDrafts && (
        <div className="re-drafts-list">
          {drafts.length === 0 && <div className="re-empty">No drafts saved yet.</div>}
          {drafts.map(d => (
            <button key={d.filename} className="re-draft-item" onClick={() => loadDraft(d.filename)}>
              <span className="re-draft-date">{new Date(d.saved_at).toLocaleString()}</span>
              <span className="re-draft-notes">{d.notes || 'No notes'}</span>
            </button>
          ))}
        </div>
      )}

      {/* Publish confirmation */}
      {showPublishConfirm && (
        <div className="re-confirm">
          <p>This will overwrite the <strong>live scoring rubric</strong> for {questionCode}. The latest saved draft will become production.</p>
          <div className="re-confirm-actions">
            <button className="re-btn re-btn--ghost" onClick={() => setShowPublishConfirm(false)}>Cancel</button>
            <button className="re-btn re-btn--publish" onClick={publishDraft} disabled={publishing}>
              {publishing ? 'Publishing...' : 'Confirm Publish'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
