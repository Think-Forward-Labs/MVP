import { useState } from 'react';
import type { MetricInsight, MetricScoreDetail, StructuredObservation, StructuredRecommendation } from '../types';
import { METRIC_COLORS, scoreColor, scoreLabel, getMetricDisplayName } from '../utils';

function isStructuredObs(obs: string | StructuredObservation): obs is StructuredObservation {
  return typeof obs === 'object' && obs !== null && 'lens_id' in obs;
}

function isStructuredRec(rec: string | StructuredRecommendation): rec is StructuredRecommendation {
  return typeof rec === 'object' && rec !== null && 'action' in rec;
}

function severityBadge(score: number): { label: string; cls: string } {
  if (score >= 0.7) return { label: 'CRITICAL', cls: 'od-sev--critical' };
  if (score >= 0.5) return { label: 'HIGH', cls: 'od-sev--high' };
  if (score >= 0.3) return { label: 'MEDIUM', cls: 'od-sev--medium' };
  return { label: 'LOW', cls: 'od-sev--low' };
}

interface MetricDetailViewProps {
  metricCode: string;
  observationIndex: number;
  metricInsights: MetricInsight[];
  sortedMetrics: MetricScoreDetail[];
  onBack: () => void;
}

export function MetricDetailView({
  metricCode,
  observationIndex: initialIndex,
  metricInsights,
  onBack,
}: MetricDetailViewProps) {
  const insight = metricInsights.find(m => m.metric_code === metricCode);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  if (!insight) {
    return (
      <div className="cd-page" style={{ zIndex: 101 }}>
        <div className="cd-topbar">
          <div className="cd-topbar-inner">
            <button className="cd-back-btn" onClick={onBack}>← Back to Map</button>
          </div>
        </div>
        <div style={{ padding: 64, textAlign: 'center', color: 'var(--t3)' }}>No data for {metricCode}</div>
      </div>
    );
  }

  const colors = METRIC_COLORS[metricCode] || { base: '#666', bg10: 'rgba(102,102,102,0.1)', bg06: 'rgba(102,102,102,0.06)' };
  const sc = scoreColor(insight.score);
  const displayName = getMetricDisplayName(metricCode, insight.metric_name);
  const totalObs = insight.observations?.length || 0;

  const primaryObs = insight.observations?.[currentIndex];
  const isStructured = primaryObs && isStructuredObs(primaryObs);

  const linkedRecs: StructuredRecommendation[] = [];
  if (isStructured) {
    for (const rec of insight.recommendations || []) {
      if (isStructuredRec(rec) && rec.linked_observations?.includes(primaryObs.lens_id)) {
        linkedRecs.push(rec);
      }
    }
  }

  const otherObservations = (insight.observations || [])
    .map((obs, i) => ({ obs, realIndex: i }))
    .filter(item => item.realIndex !== currentIndex);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const navigateTo = (index: number) => {
    setCurrentIndex(index);
    setExpandedSections(new Set());
    const scrollEl = document.querySelector('.od-scroll');
    if (scrollEl) scrollEl.scrollTop = 0;
  };

  return (
    <div className="cd-page od-page" style={{ zIndex: 101 }}>
      {/* Thin top bar */}
      <div className="cd-topbar">
        <div className="cd-topbar-inner">
          <button className="cd-back-btn" onClick={onBack}>← Back to Map</button>
          <div className="cd-topbar-right">
            <span className="od-metric-tag" style={{ background: colors.base }}>{metricCode}</span>
            <span className="od-metric-name">{displayName}</span>
            <span className="od-metric-score" style={{ color: sc }}>{insight.score}</span>
          </div>
        </div>
      </div>

      <div className="od-scroll">
        <div className="od-content">

          {/* ═══ THE OBSERVATION — hero section ═══ */}
          {isStructured ? (
            <div className={`od-hero od-hero--${primaryObs.sentiment}`}>
              <div className="od-meta-line">
                <span className="od-lens-tag" style={{ color: colors.base, borderColor: colors.base }}>
                  {primaryObs.lens_name}
                </span>
                <span className={`od-sentiment od-sentiment--${primaryObs.sentiment}`}>
                  {primaryObs.sentiment === 'positive' ? 'STRENGTH' : 'GAP'}
                </span>
                {primaryObs.severity_score > 0 && (
                  <span className={`od-sev ${severityBadge(primaryObs.severity_score).cls}`}>
                    {severityBadge(primaryObs.severity_score).label}
                  </span>
                )}
                {primaryObs.confidence && (
                  <span className="od-confidence">{primaryObs.confidence.toUpperCase()}</span>
                )}
              </div>

              <div className="od-statement">
                {primaryObs.text}
              </div>

              {primaryObs.business_impact && (
                <p className="od-impact">{primaryObs.business_impact}</p>
              )}
            </div>
          ) : primaryObs ? (
            <div className="od-hero od-hero--negative">
              <div className="od-meta-line">
                <span className="od-lens-tag" style={{ color: colors.base, borderColor: colors.base }}>
                  OBSERVATION {currentIndex + 1} OF {totalObs}
                </span>
              </div>
              <div className="od-statement">
                {primaryObs as string}
              </div>
            </div>
          ) : null}

          {/* ═══ WHAT WE HEARD — quote wall ═══ */}
          {isStructured && primaryObs.evidence?.length > 0 && (
            <div className="od-section">
              <div className="od-section-label">WHAT WE HEARD</div>
              <div className="od-quotes">
                {primaryObs.evidence.map((ev, i) => (
                  <div key={i} className="od-quote-card">
                    <div className="od-quote-mark">"</div>
                    <div className="od-quote-text">{ev.text}</div>
                    <div className="od-quote-attr">
                      <span className="od-quote-role">{ev.role}</span>
                      <span className="od-quote-q">Q: {ev.question_code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legacy evidence */}
          {!isStructured && insight.evidence?.length > 0 && (
            <div className="od-section">
              <div className="od-section-label">WHAT WE HEARD</div>
              <div className="od-quotes">
                {insight.evidence.filter(e => e.supports === 'gap' || e.supports === 'strength').slice(0, 4).map((ev, i) => (
                  <div key={i} className="od-quote-card">
                    <div className="od-quote-mark">"</div>
                    <div className="od-quote-text">{ev.quote}</div>
                    <div className="od-quote-attr">
                      <span className="od-quote-role">{ev.role}</span>
                      <span className={`od-quote-tag od-quote-tag--${ev.supports}`}>{ev.supports}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ THINGS TO CONSIDER — recommendations ═══ */}
          {isStructured && linkedRecs.length > 0 && (
            <div className="od-section">
              <div className="od-section-label">THINGS TO CONSIDER</div>
              <ol className="od-rec-list">
                {linkedRecs.map((rec, i) => (
                  <li key={i} className="od-rec-item">
                    <span className="od-rec-num" style={{ color: colors.base }}>{i + 1}</span>
                    <div className="od-rec-body">
                      <div className="od-rec-action">{rec.action}</div>
                      {rec.first_step && (
                        <div className="od-rec-step">{rec.first_step}</div>
                      )}
                      {(rec.owner_role || rec.timeframe) && (
                        <div className="od-rec-tags">
                          {rec.owner_role && <span className="od-rec-tag">{rec.owner_role}</span>}
                          {rec.timeframe && <span className="od-rec-tag">{rec.timeframe}</span>}
                        </div>
                      )}
                      {rec.expected_outcome && (
                        <div className="od-rec-outcome">{rec.expected_outcome}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Legacy recommendations fallback */}
          {!isStructured && insight.recommendations?.length > 0 && (
            <div className="od-section">
              <div className="od-section-label">THINGS TO CONSIDER</div>
              <ol className="od-rec-list">
                {insight.recommendations.map((rec, i) => (
                  <li key={i} className="od-rec-item">
                    <span className="od-rec-num" style={{ color: colors.base }}>{i + 1}</span>
                    <div className="od-rec-body">
                      {isStructuredRec(rec) ? (
                        <>
                          <div className="od-rec-action">{rec.action}</div>
                          {rec.first_step && <div className="od-rec-step">{rec.first_step}</div>}
                          {(rec.owner_role || rec.timeframe) && (
                            <div className="od-rec-tags">
                              {rec.owner_role && <span className="od-rec-tag">{rec.owner_role}</span>}
                              {rec.timeframe && <span className="od-rec-tag">{rec.timeframe}</span>}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="od-rec-action">{rec as string}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ═══ OTHER OBSERVATIONS — navigable ═══ */}
          {otherObservations.length > 0 && (
            <div className="od-section">
              <button className="od-toggle" onClick={() => toggleSection('other')}>
                <span className="od-toggle-icon">{expandedSections.has('other') ? '−' : '+'}</span>
                OTHER OBSERVATIONS IN {metricCode} ({otherObservations.length})
              </button>
              {expandedSections.has('other') && (
                <div className="od-other-list">
                  {otherObservations.map(({ obs, realIndex }) => (
                    <div
                      key={realIndex}
                      className="od-other-item"
                      onClick={() => navigateTo(realIndex)}
                    >
                      {isStructuredObs(obs) ? (
                        <>
                          <span className={`od-other-dot od-other-dot--${obs.sentiment}`} />
                          <div className="od-other-body">
                            <span className="od-other-lens">{obs.lens_name}</span>
                            <span className="od-other-text">{obs.text}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="od-other-num">{realIndex + 1}</span>
                          <span className="od-other-text">{obs as string}</span>
                        </>
                      )}
                      <span className="od-other-arrow">→</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ COLLAPSIBLE CONTEXT SECTIONS ═══ */}
          {insight.summary && (
            <div className="od-section">
              <button className="od-toggle" onClick={() => toggleSection('context')}>
                <span className="od-toggle-icon">{expandedSections.has('context') ? '−' : '+'}</span>
                METRIC CONTEXT
              </button>
              {expandedSections.has('context') && (
                <div className="od-collapse-body">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700, color: sc }}>{insight.score}</span>
                    <span className="od-confidence" style={{ color: sc }}>{scoreLabel(insight.score)}</span>
                  </div>
                  <p className="od-body-text">{insight.summary}</p>
                </div>
              )}
            </div>
          )}

          {insight.synthesized_impact && (
            <div className="od-section">
              <button className="od-toggle" onClick={() => toggleSection('synthesis')}>
                <span className="od-toggle-icon">{expandedSections.has('synthesis') ? '−' : '+'}</span>
                METRIC SYNTHESIS
              </button>
              {expandedSections.has('synthesis') && (
                <div className="od-collapse-body">
                  <p className="od-body-text">{insight.synthesized_impact}</p>
                </div>
              )}
            </div>
          )}

          {insight.ai_reasoning && (
            <div className="od-section">
              <button className="od-toggle" onClick={() => toggleSection('reasoning')}>
                <span className="od-toggle-icon">{expandedSections.has('reasoning') ? '−' : '+'}</span>
                AI REASONING
              </button>
              {expandedSections.has('reasoning') && (
                <div className="od-collapse-body">
                  <div className="od-reasoning-grid">
                    <div className="od-reasoning-row">
                      <span className="od-rec-label">METHODOLOGY</span>
                      <span className="od-body-text">{insight.ai_reasoning.methodology}</span>
                    </div>
                    <div className="od-reasoning-row">
                      <span className="od-rec-label">DATA POINTS</span>
                      <span className="od-body-text">{insight.ai_reasoning.data_points_analyzed}</span>
                    </div>
                    {insight.ai_reasoning.confidence_factors?.length > 0 && (
                      <div className="od-reasoning-row">
                        <span className="od-rec-label">CONFIDENCE</span>
                        <div className="od-chip-row">
                          {insight.ai_reasoning.confidence_factors.map((f, i) => (
                            <span key={i} className="od-chip">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {insight.ai_reasoning.key_signals?.length > 0 && (
                      <div className="od-reasoning-row">
                        <span className="od-rec-label">KEY SIGNALS</span>
                        <div className="od-chip-row">
                          {insight.ai_reasoning.key_signals.map((s, i) => (
                            <span key={i} className="od-chip">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {insight.ai_reasoning.limitations?.length > 0 && (
                      <div className="od-reasoning-row">
                        <span className="od-rec-label">LIMITATIONS</span>
                        <div className="od-chip-row">
                          {insight.ai_reasoning.limitations.map((l, i) => (
                            <span key={i} className="od-chip od-chip--warn">{l}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {insight.benchmark_narrative && (
            <div className="od-section">
              <button className="od-toggle" onClick={() => toggleSection('benchmark')}>
                <span className="od-toggle-icon">{expandedSections.has('benchmark') ? '−' : '+'}</span>
                BENCHMARK CONTEXT
              </button>
              {expandedSections.has('benchmark') && (
                <div className="od-collapse-body">
                  <p className="od-body-text">{insight.benchmark_narrative}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
