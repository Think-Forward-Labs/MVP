import { useState } from 'react';
import type { PathologyType } from '../types';

interface PathologyListPageProps {
  pathologies: PathologyType[];
  onBack: () => void;
}

const severityColor: Record<string, string> = {
  critical: '#ef4444',
  moderate: '#f59e0b',
  informational: '#3b82f6',
};

const severityBg: Record<string, string> = {
  critical: 'rgba(239,68,68,.06)',
  moderate: 'rgba(245,158,11,.06)',
  informational: 'rgba(59,130,246,.06)',
};

export function PathologyListPage({ pathologies, onBack }: PathologyListPageProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="plp-container">
      {/* Top bar */}
      <div className="plp-topbar">
        <button className="plp-back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </button>
        <span className="plp-title">Detected Pathologies</span>
        <span className="plp-count">{pathologies.length} found</span>
      </div>

      {/* Pathology cards */}
      <div className="plp-list">
        {pathologies.map((p, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <div
              key={i}
              className={`plp-card ${isExpanded ? 'plp-card--expanded' : ''}`}
              style={{ borderLeftColor: severityColor[p.severity] || '#f59e0b' }}
            >
              <div className="plp-card-header" onClick={() => setExpandedIndex(isExpanded ? null : i)}>
                <div className="plp-card-title-row">
                  <div
                    className="plp-severity-dot"
                    style={{ background: severityColor[p.severity] || '#f59e0b' }}
                  />
                  <span className="plp-card-title">{p.client_title}</span>
                  <span
                    className="plp-severity-badge"
                    style={{
                      color: severityColor[p.severity],
                      background: severityBg[p.severity],
                    }}
                  >
                    {p.severity.toUpperCase()}
                  </span>
                </div>
                <p className="plp-card-desc">{p.client_description}</p>
                <svg
                  className="plp-chevron"
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ts)" strokeWidth="2"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {isExpanded && (
                <div className="plp-card-body">
                  {/* Evidence */}
                  {p.evidence?.length > 0 && (
                    <div className="plp-section">
                      <div className="plp-section-label">EVIDENCE</div>
                      {p.evidence.map((e, j) => (
                        <div key={j} className="plp-evidence">
                          <span className="plp-quote">"{e.quote}"</span>
                          {e.role && <span className="plp-role">— {e.role}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Historical Anchor */}
                  {p.client_anchor && (
                    <div className="plp-section plp-section--anchor">
                      <div className="plp-section-label">RESEARCH CONTEXT</div>
                      <p className="plp-anchor-text">{p.client_anchor}</p>
                    </div>
                  )}

                  {/* Coaching Question */}
                  {p.coaching_question && (
                    <div className="plp-section plp-section--coaching">
                      <div className="plp-section-label">COACHING QUESTION</div>
                      <p className="plp-coaching-text">{p.coaching_question}</p>
                    </div>
                  )}

                  {/* Phased Roadmap */}
                  {p.roadmap && (
                    <div className="plp-section">
                      <div className="plp-section-label">RECOVERY ROADMAP</div>
                      <div className="plp-roadmap">
                        {(['month_1', 'month_2', 'month_3'] as const).map((monthKey, mi) => {
                          const month = p.roadmap?.[monthKey];
                          if (!month) return null;
                          return (
                            <div key={monthKey} className="plp-roadmap-phase">
                              <div className="plp-roadmap-marker">
                                <div className="plp-roadmap-num">{mi + 1}</div>
                                {mi < 2 && <div className="plp-roadmap-line" />}
                              </div>
                              <div className="plp-roadmap-content">
                                <div className="plp-roadmap-month">{month.theme || `Month ${mi + 1}`}</div>
                                {month.actions?.map((action, ai) => (
                                  <div key={ai} className="plp-roadmap-action">{action}</div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Related Metrics */}
                  {p.related_metrics?.length > 0 && (
                    <div className="plp-metrics-tags">
                      {p.related_metrics.map((m, j) => (
                        <span key={j} className="plp-metric-tag">{m}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
