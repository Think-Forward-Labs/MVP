import { useState } from 'react';
import type { PathologyType } from '../types';

interface PathologyCardProps {
  pathologies: PathologyType[];
}

export function PathologyCard({ pathologies }: PathologyCardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!pathologies.length) return null;

  return (
    <>
      {pathologies.map((p, i) => (
        <div key={i} className="dv2-path-card dv2-fi" onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}>
          <div className="dv2-path-head">
            <div className="dv2-pulse-dot" style={{ background: 'var(--r)', width: 6, height: 6 }} />
            <span className="dv2-path-lbl">PATHOLOGY DETECTED</span>
          </div>
          <div className="dv2-path-name">{p.client_title}</div>
          <div className="dv2-path-desc">{p.client_description}</div>

          {p.evidence?.length > 0 && (
            <div className="dv2-path-ev">
              <div className="dv2-path-ev-lbl">EVIDENCE</div>
              <div className="dv2-path-ev-txt">"{p.evidence[0].quote}"</div>
            </div>
          )}

          {p.related_metrics?.length > 0 && (
            <div className="dv2-path-qs">
              {p.related_metrics.map((m, j) => (
                <span key={j} className="dv2-q-tag">{m}</span>
              ))}
            </div>
          )}

          {expandedIndex === i && (p as any).client_anchor && (
            <div style={{ marginTop: 9, padding: '8px 10px', background: 'rgba(59,130,246,.05)', borderRadius: 5, borderLeft: '2px solid rgba(59,130,246,.3)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--b)', letterSpacing: '0.8px', marginBottom: 3 }}>RESEARCH CONTEXT</div>
              <div style={{ fontSize: '11px', color: 'var(--td)', lineHeight: 1.6, fontStyle: 'italic' }}>{(p as any).client_anchor}</div>
            </div>
          )}

          {expandedIndex === i && p.coaching_question && (
            <div style={{ marginTop: 9, padding: '8px 10px', background: 'rgba(0,197,160,.05)', borderRadius: 5, borderLeft: '2px solid rgba(0,197,160,.3)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '8px', color: 'var(--t)', letterSpacing: '0.8px', marginBottom: 3 }}>COACHING QUESTION</div>
              <div style={{ fontSize: '11px', color: 'var(--td)', lineHeight: 1.6 }}>{p.coaching_question}</div>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
