import { useState } from 'react';
import type { MetricInsight, StructuredObservation, StructuredRecommendation } from '../types';
import { METRIC_COLORS, scoreColor, scoreLabel, getMetricDisplayName } from '../utils';

function isStructuredObs(obs: string | StructuredObservation): obs is StructuredObservation {
  return typeof obs === 'object' && obs !== null && 'lens_id' in obs;
}

function isStructuredRec(rec: string | StructuredRecommendation): rec is StructuredRecommendation {
  return typeof rec === 'object' && rec !== null && 'action' in rec;
}

function severityBadge(score: number): { label: string; cls: string } {
  if (score >= 0.7) return { label: 'CRITICAL', cls: 'mfp-sev--critical' };
  if (score >= 0.5) return { label: 'HIGH', cls: 'mfp-sev--high' };
  if (score >= 0.3) return { label: 'MEDIUM', cls: 'mfp-sev--medium' };
  return { label: 'LOW', cls: 'mfp-sev--low' };
}

interface MetricFullPageProps {
  metricCode: string;
  metricInsights: MetricInsight[];
  onBack: () => void;
}

export function MetricFullPage({ metricCode, metricInsights, onBack }: MetricFullPageProps) {
  const insight = metricInsights.find(m => m.metric_code === metricCode);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  if (!insight) {
    return (
      <div className="cd-page" style={{ zIndex: 101 }}>
        <div className="cd-topbar">
          <div className="cd-topbar-inner">
            <button className="cd-back-btn" onClick={onBack}>← Back to Dashboard</button>
          </div>
        </div>
        <div style={{ padding: 64, textAlign: 'center', color: 'var(--t3)' }}>No data for {metricCode}</div>
      </div>
    );
  }

  const colors = METRIC_COLORS[metricCode] || { base: '#666', bg10: 'rgba(102,102,102,0.1)', bg06: 'rgba(102,102,102,0.06)' };
  const sc = scoreColor(insight.score);
  const displayName = getMetricDisplayName(metricCode, insight.metric_name);

  const structuredObs = (insight.observations || []).filter(isStructuredObs);
  const stringObs = (insight.observations || []).filter((o): o is string => typeof o === 'string');
  const allRecs = insight.recommendations || [];

  const allEvidence: Array<{ text: string; role: string; question_code?: string; sentiment?: string; lensName?: string }> = [];
  for (const obs of structuredObs) {
    for (const ev of obs.evidence || []) {
      allEvidence.push({
        text: ev.text,
        role: ev.role,
        question_code: ev.question_code,
        sentiment: obs.sentiment,
        lensName: obs.lens_name,
      });
    }
  }
  // Legacy evidence fallback
  if (allEvidence.length === 0 && insight.evidence?.length > 0) {
    for (const ev of insight.evidence) {
      allEvidence.push({
        text: ev.quote,
        role: ev.role,
        sentiment: ev.supports === 'strength' ? 'positive' : 'negative',
      });
    }
  }

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const gaps = structuredObs.filter(o => o.sentiment === 'negative');
  const strengths = structuredObs.filter(o => o.sentiment === 'positive');

  return (
    <div className="cd-page mfp-page" style={{ zIndex: 101 }}>
      <div className="cd-topbar">
        <div className="cd-topbar-inner">
          <button className="cd-back-btn" onClick={onBack}>← Back to Dashboard</button>
          <div className="cd-topbar-right">
            <span className="mfp-topbar-code" style={{ background: colors.base }}>{metricCode}</span>
          </div>
        </div>
      </div>

      <div className="mfp-scroll">
        <div className="mfp-content">

          {/* ═══ HERO — Metric identity ═══ */}
          <div className="mfp-hero">
            <div className="mfp-hero-badge" style={{ background: colors.base }}>{metricCode}</div>
            <h1 className="mfp-hero-title">{displayName}</h1>
            <div className="mfp-hero-score-row">
              <span className="mfp-hero-score" style={{ color: sc }}>{insight.score}</span>
              <span className="mfp-hero-label" style={{ color: sc }}>{scoreLabel(insight.score)}</span>
              <span className="mfp-hero-health">{insight.health_status?.replace('_', ' ').toUpperCase()}</span>
            </div>
            {insight.summary && (
              <p className="mfp-hero-summary">{insight.summary}</p>
            )}
          </div>

          {/* ═══ SYNTHESIZED IMPACT ═══ */}
          {insight.synthesized_impact && (
            <div className="mfp-impact-block">
              <div className="mfp-impact-line" style={{ background: colors.base }} />
              <p className="mfp-impact-text">{insight.synthesized_impact}</p>
            </div>
          )}

          {/* ═══ OBSERVATIONS ═══ */}
          {(structuredObs.length > 0 || stringObs.length > 0) && (
            <div className="mfp-section">
              <div className="mfp-section-label">
                KEY OBSERVATIONS
                {structuredObs.length > 0 && (
                  <span className="mfp-section-count">
                    {gaps.length} gap{gaps.length !== 1 ? 's' : ''} · {strengths.length} strength{strengths.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="mfp-obs-list">
                {structuredObs.map((obs, i) => {
                  const sev = severityBadge(obs.severity_score);
                  const isPos = obs.sentiment === 'positive';
                  return (
                    <div key={i} className={`mfp-obs-card mfp-obs-card--${obs.sentiment}`}>
                      <div className="mfp-obs-header">
                        <span className="mfp-obs-lens" style={{ color: colors.base, borderColor: colors.base }}>
                          {obs.lens_name}
                        </span>
                        <span className={`mfp-obs-sentiment mfp-obs-sentiment--${obs.sentiment}`}>
                          {isPos ? 'STRENGTH' : 'GAP'}
                        </span>
                        {obs.severity_score > 0 && (
                          <span className={`mfp-sev ${sev.cls}`}>{sev.label}</span>
                        )}
                        {obs.confidence && (
                          <span className="mfp-obs-conf">{obs.confidence.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="mfp-obs-text">{obs.text}</div>
                      {obs.business_impact && (
                        <div className="mfp-obs-impact">{obs.business_impact}</div>
                      )}
                      {obs.evidence?.length > 0 && (
                        <div className="mfp-obs-evidence">
                          {obs.evidence.map((ev, j) => (
                            <div key={j} className="mfp-obs-quote">
                              <span className="mfp-obs-quote-mark">"</span>
                              <span className="mfp-obs-quote-text">{ev.text}</span>
                              <span className="mfp-obs-quote-attr">— {ev.role}, Q: {ev.question_code}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Legacy string observations */}
                {stringObs.map((obs, i) => (
                  <div key={`s-${i}`} className="mfp-obs-card mfp-obs-card--negative">
                    <div className="mfp-obs-text">{obs}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ WHAT WE HEARD — all evidence ═══ */}
          {allEvidence.length > 0 && (
            <div className="mfp-section">
              <div className="mfp-section-label">WHAT WE HEARD</div>
              <div className="mfp-evidence-grid">
                {allEvidence.map((ev, i) => (
                  <div key={i} className="mfp-ev-card">
                    <div className="mfp-ev-mark">"</div>
                    <div className="mfp-ev-text">{ev.text}</div>
                    <div className="mfp-ev-footer">
                      <span className="mfp-ev-role">{ev.role}</span>
                      {ev.question_code && <span className="mfp-ev-q">Q: {ev.question_code}</span>}
                      {ev.lensName && <span className="mfp-ev-lens">{ev.lensName}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ THINGS TO CONSIDER — all recommendations ═══ */}
          {allRecs.length > 0 && (
            <div className="mfp-section">
              <div className="mfp-section-label">THINGS TO CONSIDER</div>
              <ol className="mfp-rec-list">
                {allRecs.map((rec, i) => (
                  <li key={i} className="mfp-rec-item">
                    <span className="mfp-rec-num" style={{ color: colors.base }}>{i + 1}</span>
                    <div className="mfp-rec-body">
                      {isStructuredRec(rec) ? (
                        <>
                          <div className="mfp-rec-action">{rec.action}</div>
                          {rec.first_step && <div className="mfp-rec-step">{rec.first_step}</div>}
                          {(rec.owner_role || rec.timeframe) && (
                            <div className="mfp-rec-tags">
                              {rec.owner_role && <span className="mfp-rec-tag">{rec.owner_role}</span>}
                              {rec.timeframe && <span className="mfp-rec-tag">{rec.timeframe}</span>}
                            </div>
                          )}
                          {rec.expected_outcome && (
                            <div className="mfp-rec-outcome">{rec.expected_outcome}</div>
                          )}
                        </>
                      ) : (
                        <div className="mfp-rec-action">{rec as string}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ═══ BENCHMARK ═══ */}
          {insight.benchmark_narrative && (
            <div className="mfp-section">
              <button className="mfp-toggle" onClick={() => toggleSection('benchmark')}>
                <span className="mfp-toggle-icon">{expandedSections.has('benchmark') ? '−' : '+'}</span>
                BENCHMARK CONTEXT
              </button>
              {expandedSections.has('benchmark') && (
                <div className="mfp-collapse-body">
                  <p className="mfp-body-text">{insight.benchmark_narrative}</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ AI REASONING ═══ */}
          {insight.ai_reasoning && (
            <div className="mfp-section">
              <button className="mfp-toggle" onClick={() => toggleSection('reasoning')}>
                <span className="mfp-toggle-icon">{expandedSections.has('reasoning') ? '−' : '+'}</span>
                AI REASONING
              </button>
              {expandedSections.has('reasoning') && (
                <div className="mfp-collapse-body">
                  <div className="mfp-reasoning-grid">
                    <div className="mfp-reasoning-row">
                      <span className="mfp-reasoning-label">METHODOLOGY</span>
                      <span className="mfp-body-text">{insight.ai_reasoning.methodology}</span>
                    </div>
                    <div className="mfp-reasoning-row">
                      <span className="mfp-reasoning-label">DATA POINTS</span>
                      <span className="mfp-body-text">{insight.ai_reasoning.data_points_analyzed}</span>
                    </div>
                    {insight.ai_reasoning.confidence_factors?.length > 0 && (
                      <div className="mfp-reasoning-row">
                        <span className="mfp-reasoning-label">CONFIDENCE</span>
                        <div className="mfp-chip-row">
                          {insight.ai_reasoning.confidence_factors.map((f, i) => (
                            <span key={i} className="mfp-chip">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {insight.ai_reasoning.key_signals?.length > 0 && (
                      <div className="mfp-reasoning-row">
                        <span className="mfp-reasoning-label">KEY SIGNALS</span>
                        <div className="mfp-chip-row">
                          {insight.ai_reasoning.key_signals.map((s, i) => (
                            <span key={i} className="mfp-chip">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {insight.ai_reasoning.limitations?.length > 0 && (
                      <div className="mfp-reasoning-row">
                        <span className="mfp-reasoning-label">LIMITATIONS</span>
                        <div className="mfp-chip-row">
                          {insight.ai_reasoning.limitations.map((l, i) => (
                            <span key={i} className="mfp-chip mfp-chip--warn">{l}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
