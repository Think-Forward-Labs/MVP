import { useState } from 'react';
import type { MetricInsight, MetricScoreDetail, StructuredObservation, StructuredRecommendation } from '../types';
import { METRIC_COLORS, scoreColor, scoreLabel, getMetricDisplayName } from '../utils';

/** Type guard for structured observations */
function isStructuredObs(obs: string | StructuredObservation): obs is StructuredObservation {
  return typeof obs === 'object' && obs !== null && 'lens_id' in obs;
}

/** Type guard for structured recommendations */
function isStructuredRec(rec: string | StructuredRecommendation): rec is StructuredRecommendation {
  return typeof rec === 'object' && rec !== null && 'action' in rec;
}

/** Severity label from score */
function severityBadge(score: number): { label: string; cls: string } {
  if (score >= 0.7) return { label: 'CRITICAL', cls: 'md-sev--critical' };
  if (score >= 0.5) return { label: 'HIGH', cls: 'md-sev--high' };
  if (score >= 0.3) return { label: 'MEDIUM', cls: 'md-sev--medium' };
  return { label: 'LOW', cls: 'md-sev--low' };
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
  observationIndex,
  metricInsights,
  onBack,
}: MetricDetailViewProps) {
  const insight = metricInsights.find(m => m.metric_code === metricCode);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  if (!insight) {
    return (
      <div className="cd-page" style={{ zIndex: 101 }}>
        <div className="cd-topbar">
          <div className="cd-topbar-inner">
            <button className="cd-back-btn" onClick={onBack}>← Back to Map</button>
          </div>
        </div>
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)' }}>No data for {metricCode}</div>
      </div>
    );
  }

  const colors = METRIC_COLORS[metricCode] || { base: '#666', bg10: 'rgba(102,102,102,0.1)', bg06: 'rgba(102,102,102,0.06)' };
  const sc = scoreColor(insight.score);
  const sl = scoreLabel(insight.score);
  const displayName = getMetricDisplayName(metricCode, insight.metric_name);

  const primaryObs = insight.observations?.[observationIndex];
  const isStructured = primaryObs && isStructuredObs(primaryObs);

  // Get linked recommendations for the primary observation
  const linkedRecs: StructuredRecommendation[] = [];
  if (isStructured) {
    for (const rec of insight.recommendations || []) {
      if (isStructuredRec(rec) && rec.linked_observations?.includes(primaryObs.lens_id)) {
        linkedRecs.push(rec);
      }
    }
  }

  // Other observations (not the primary one)
  const otherObservations = insight.observations?.filter((_, i) => i !== observationIndex) || [];

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="cd-page" style={{ zIndex: 101 }}>
      <div className="cd-topbar">
        <div className="cd-topbar-inner">
          <button className="cd-back-btn" onClick={onBack}>← Back to Map</button>
          <div className="cd-topbar-right">
            <span className="cd-topbar-label">METRIC DETAIL</span>
            <span className="cd-topbar-idx" style={{ background: colors.bg10, color: colors.base }}>{metricCode}</span>
          </div>
        </div>
      </div>

      <div className="cd-scroll">
        <div className="md-content">
          {/* ── Header ── */}
          <div className="md-header">
            <div className="md-header-badge" style={{ background: colors.bg10, color: colors.base }}>
              {metricCode}
            </div>
            <h1 className="md-header-name">{displayName}</h1>
            <div className="md-header-score-row">
              <span className="md-header-score" style={{ color: sc }}>{insight.score}</span>
              <span className="md-header-status" style={{ color: sc, background: `${sc}10` }}>{sl}</span>
              <span className="md-header-health" style={{ color: colors.base }}>{insight.health_status?.toUpperCase()}</span>
            </div>
            {insight.summary && (
              <p className="md-header-summary">{insight.summary}</p>
            )}
          </div>

          {/* ── Primary Observation ── */}
          {isStructured ? (
            <>
              {/* Lens Label */}
              <div className="md-lens-label" style={{ color: colors.base }}>
                {primaryObs.lens_name.toUpperCase()}
              </div>

              <div className="md-highlight" style={{
                borderLeftColor: primaryObs.sentiment === 'positive' ? 'var(--positive)' : 'var(--negative)',
              }}>
                {/* Sentiment + Severity */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <span className={`md-sentiment md-sentiment--${primaryObs.sentiment}`}>
                    {primaryObs.sentiment === 'positive' ? 'STRENGTH' : 'GAP'}
                  </span>
                  {primaryObs.severity_score > 0 && (
                    <span className={`md-sev ${severityBadge(primaryObs.severity_score).cls}`}>
                      {severityBadge(primaryObs.severity_score).label}
                    </span>
                  )}
                  {primaryObs.confidence && (
                    <span className="md-confidence">{primaryObs.confidence.toUpperCase()} CONFIDENCE</span>
                  )}
                </div>

                {/* Observation text */}
                <div className="md-highlight-text">{primaryObs.text}</div>

                {/* Business impact */}
                {primaryObs.business_impact && (
                  <div className="md-business-impact">{primaryObs.business_impact}</div>
                )}
              </div>

              {/* ── Evidence (verbatim quotes) ── */}
              {primaryObs.evidence?.length > 0 && (
                <div className="md-evidence-grid">
                  <div className="md-evidence-label">EVIDENCE</div>
                  {primaryObs.evidence.map((ev, i) => (
                    <div key={i} className="md-evidence-card">
                      <div className="md-evidence-quote">"{ev.text}"</div>
                      <div className="md-evidence-meta">
                        <span className="md-evidence-role">{ev.role}</span>
                        <span className="md-evidence-tag md-evidence-tag--context">Q: {ev.question_code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Linked Recommendations ── */}
              {linkedRecs.length > 0 && (
                <div className="md-rec-section">
                  <div className="md-evidence-label" style={{ marginTop: 20, marginBottom: 12 }}>RECOMMENDATIONS</div>
                  {linkedRecs.map((rec, i) => (
                    <div key={i} className="md-rec-card">
                      <div className="md-rec-action">{rec.action}</div>
                      <div className="md-rec-first-step">
                        <span className="md-rec-label">FIRST STEP</span>
                        {rec.first_step}
                      </div>
                      <div className="md-rec-meta">
                        {rec.owner_role && (
                          <span className="md-rec-owner">
                            <span className="md-rec-label">OWNER</span> {rec.owner_role}
                          </span>
                        )}
                        {rec.timeframe && (
                          <span className="md-rec-timeframe">
                            <span className="md-rec-label">TIMEFRAME</span> {rec.timeframe}
                          </span>
                        )}
                      </div>
                      {rec.expected_outcome && (
                        <div className="md-rec-outcome">
                          <span className="md-rec-label">EXPECTED OUTCOME</span> {rec.expected_outcome}
                        </div>
                      )}
                      {rec.evidence_anchor && (
                        <div className="md-rec-anchor">"{rec.evidence_anchor}"</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : primaryObs ? (
            /* Legacy string observation */
            <div className="md-highlight" style={{ borderLeftColor: colors.base }}>
              <div className="md-highlight-type" style={{ color: colors.base }}>OBSERVATION</div>
              <div className="md-highlight-text">{primaryObs as string}</div>
              {/* Legacy evidence */}
              {insight.evidence?.length > 0 && (
                <div className="md-evidence-grid">
                  <div className="md-evidence-label">SUPPORTING EVIDENCE</div>
                  {insight.evidence.filter(e => e.supports === 'gap' || e.supports === 'strength').slice(0, 4).map((ev, i) => (
                    <div key={i} className="md-evidence-card">
                      <div className="md-evidence-quote">"{ev.quote}"</div>
                      <div className="md-evidence-meta">
                        <span className="md-evidence-role">{ev.role}</span>
                        <span className={`md-evidence-tag md-evidence-tag--${ev.supports}`}>{ev.supports}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* ── Other Observations (collapsed) ── */}
          {otherObservations.length > 0 && (
            <div className="md-other-findings">
              <button className="md-section-toggle" onClick={() => toggleSection('other')}>
                <span className="md-section-toggle-icon">{expandedSections.has('other') ? '−' : '+'}</span>
                <span>OTHER OBSERVATIONS ({otherObservations.length})</span>
              </button>
              {expandedSections.has('other') && (
                <div className="md-findings-list">
                  {otherObservations.map((obs, i) => (
                    <div key={i} className="md-finding-item">
                      {isStructuredObs(obs) ? (
                        <>
                          <span className={`md-finding-type ${obs.sentiment === 'positive' ? 'md-finding-type--rec' : 'md-finding-type--obs'}`}>
                            {obs.sentiment === 'positive' ? '+' : '-'}
                          </span>
                          <div>
                            <div className="md-finding-lens">{obs.lens_name}</div>
                            <span className="md-finding-text">{obs.text}</span>
                            {obs.severity_score > 0 && (
                              <span className={`md-sev md-sev--inline ${severityBadge(obs.severity_score).cls}`}>
                                {severityBadge(obs.severity_score).label}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="md-finding-type md-finding-type--obs">OBS</span>
                          <span className="md-finding-text">{obs as string}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Metric Synthesis ── */}
          {insight.synthesized_impact && (
            <div className="md-synthesis">
              <button className="md-section-toggle" onClick={() => toggleSection('synthesis')}>
                <span className="md-section-toggle-icon">{expandedSections.has('synthesis') ? '−' : '+'}</span>
                <span>METRIC SYNTHESIS</span>
              </button>
              {expandedSections.has('synthesis') && (
                <div className="md-synthesis-content">
                  <p className="md-synthesis-text">{insight.synthesized_impact}</p>
                </div>
              )}
            </div>
          )}

          {/* ── AI Reasoning ── */}
          {insight.ai_reasoning && (
            <div className="md-reasoning">
              <button className="md-section-toggle" onClick={() => toggleSection('reasoning')}>
                <span className="md-section-toggle-icon">{expandedSections.has('reasoning') ? '−' : '+'}</span>
                <span>AI REASONING</span>
              </button>
              {expandedSections.has('reasoning') && (
                <div className="md-reasoning-content">
                  <div className="md-reasoning-row">
                    <span className="md-reasoning-label">METHODOLOGY</span>
                    <span className="md-reasoning-value">{insight.ai_reasoning.methodology}</span>
                  </div>
                  <div className="md-reasoning-row">
                    <span className="md-reasoning-label">DATA POINTS</span>
                    <span className="md-reasoning-value">{insight.ai_reasoning.data_points_analyzed}</span>
                  </div>
                  {insight.ai_reasoning.confidence_factors?.length > 0 && (
                    <div className="md-reasoning-row">
                      <span className="md-reasoning-label">CONFIDENCE</span>
                      <div className="md-reasoning-list">
                        {insight.ai_reasoning.confidence_factors.map((f, i) => (
                          <span key={i} className="md-reasoning-chip">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {insight.ai_reasoning.key_signals?.length > 0 && (
                    <div className="md-reasoning-row">
                      <span className="md-reasoning-label">KEY SIGNALS</span>
                      <div className="md-reasoning-list">
                        {insight.ai_reasoning.key_signals.map((s, i) => (
                          <span key={i} className="md-reasoning-chip">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {insight.ai_reasoning.limitations?.length > 0 && (
                    <div className="md-reasoning-row">
                      <span className="md-reasoning-label">LIMITATIONS</span>
                      <div className="md-reasoning-list">
                        {insight.ai_reasoning.limitations.map((l, i) => (
                          <span key={i} className="md-reasoning-chip md-reasoning-chip--warn">{l}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Benchmark ── */}
          {insight.benchmark_narrative && (
            <div className="md-benchmark">
              <button className="md-section-toggle" onClick={() => toggleSection('benchmark')}>
                <span className="md-section-toggle-icon">{expandedSections.has('benchmark') ? '−' : '+'}</span>
                <span>BENCHMARK CONTEXT</span>
              </button>
              {expandedSections.has('benchmark') && (
                <div className="md-benchmark-content">
                  <p className="md-benchmark-text">{insight.benchmark_narrative}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
