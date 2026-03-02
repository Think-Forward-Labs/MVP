import { useState, useMemo } from 'react';
import type { MetricScoreDetail, MetricInsight, RefinedReport } from '../types';
import { getMetricScore } from '../utils';

interface OrgMirrorProps {
  contradictions: RefinedReport['contradictions'];
  crossMetricInsights?: Record<string, string>;
  metricInsights: MetricInsight[];
  sortedMetrics: MetricScoreDetail[];
}

const INITIAL_SHOW = 5;

/** Derive a 0-100 "gap severity" score for a contradiction based on its related metrics */
function getContradictionScore(
  c: RefinedReport['contradictions'][number],
  sortedMetrics: MetricScoreDetail[],
  metricInsights: MetricInsight[],
): number {
  if (!c.related_metrics?.length) return c.severity === 'high' ? 35 : 55;
  const scores = c.related_metrics
    .map(code => getMetricScore(code, sortedMetrics, metricInsights))
    .filter(s => s > 0);
  if (scores.length === 0) return c.severity === 'high' ? 35 : 55;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function OrgMirror({ contradictions, crossMetricInsights, metricInsights, sortedMetrics }: OrgMirrorProps) {
  const [expandedBar, setExpandedBar] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [percGapExpanded, setPercGapExpanded] = useState(false);

  // --- Perception Gap ---
  const perceptionGap = useMemo(() => {
    const overKey = 'perception_gap_overconfidence';
    const underKey = 'perception_gap_underconfidence';
    const key = crossMetricInsights?.[overKey] ? overKey : crossMetricInsights?.[underKey] ? underKey : null;
    if (!key) return null;

    const insightText = crossMetricInsights![key];
    const isOver = key === overKey;
    const m2Score = getMetricScore('M2', sortedMetrics, metricInsights);

    let p4Score = 0;
    const p4Match = insightText.match(/(?:P4[:\s]+|self[- ]assessed[:\s]+|self[- ]rating[:\s]+)(\d{1,3})/i);
    if (p4Match) {
      p4Score = parseInt(p4Match[1], 10);
    } else {
      const p4Insight = metricInsights.find(m => m.metric_code === 'P4');
      if (p4Insight) p4Score = p4Insight.score;
    }
    if (!p4Score && m2Score) {
      const gapMatch = insightText.match(/([+-]?\d{1,3})\s*(?:pts?|points?)/i);
      if (gapMatch) {
        const gapVal = parseInt(gapMatch[1], 10);
        p4Score = isOver ? m2Score + Math.abs(gapVal) : m2Score - Math.abs(gapVal);
      }
    }

    const gap = p4Score - m2Score;
    return { p4Score, m2Score, gap, isOver, label: isOver ? `OVERCONFIDENCE +${Math.abs(gap)}pts` : `UNDERCONFIDENCE ${gap}pts`, insightText };
  }, [crossMetricInsights, sortedMetrics, metricInsights]);

  // --- Say-Do Gaps with scores ---
  const contradictionBars = useMemo(() =>
    contradictions.map(c => ({
      ...c,
      score: getContradictionScore(c, sortedMetrics, metricInsights),
    })),
    [contradictions, sortedMetrics, metricInsights]
  );

  const visibleBars = showAll ? contradictionBars : contradictionBars.slice(0, INITIAL_SHOW);
  const hiddenCount = contradictionBars.length - INITIAL_SHOW;
  const hasContent = perceptionGap || contradictions.length > 0;
  const gapCount = contradictions.filter(c => c.severity === 'high').length;

  return (
    <div className="dv2-mirror-panel dv2-fi">
      <div className="dv2-mirror-head">
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--tm)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Organisational Mirror
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt)', marginTop: 3 }}>
            Perception gaps &amp; contradictions
          </div>
        </div>
        {(gapCount > 0 || (perceptionGap && perceptionGap.isOver)) && (
          <div className="dv2-mirror-badge">
            {gapCount + (perceptionGap ? 1 : 0)} GAP{(gapCount + (perceptionGap ? 1 : 0)) !== 1 ? 'S' : ''}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="dv2-mirror-legend">
        {perceptionGap && (
          <div className="dv2-legend-item">
            <div className="dv2-legend-bar" style={{ width: 16, background: 'rgba(61,155,255,.6)' }} />
            <span className="dv2-legend-txt">SELF-ASSESSED</span>
          </div>
        )}
        <div className="dv2-legend-item">
          <div className="dv2-legend-bar" style={{ width: 16, background: 'var(--a)' }} />
          <span className="dv2-legend-txt">AI DETECTED</span>
        </div>
      </div>

      {/* ── Section A: Perception Gap — as bar row ── */}
      {perceptionGap && (
        <div className="dv2-dbar">
          <div className="dv2-dbar-head">
            <div className="dv2-dbar-lbl-wrap">
              <span className="dv2-dbar-lbl">Perception Gap</span>
              <span className="dv2-dbar-mt">P4 vs M2</span>
            </div>
            <button className="dv2-dbar-gap-btn" onClick={() => setPercGapExpanded(!percGapExpanded)}>
              <span className="dv2-dbar-gap" style={{ color: perceptionGap.isOver ? 'var(--r)' : 'var(--b)' }}>
                {perceptionGap.isOver ? '▼' : '▲'}{Math.abs(perceptionGap.gap)}pts
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--tm)" strokeWidth="2"
                style={{ transform: percGapExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          <div className="dv2-bar-row">
            <span className="dv2-bar-lbl">SELF-RATED</span>
            <div className="dv2-bar-track">
              <div className="dv2-bar-fill" style={{ width: `${perceptionGap.p4Score}%`, background: 'rgba(61,155,255,.6)' }} />
            </div>
            <span className="dv2-bar-val" style={{ color: 'rgba(61,155,255,.9)' }}>{perceptionGap.p4Score}</span>
          </div>
          <div className="dv2-bar-row">
            <span className="dv2-bar-lbl">AI DETECTED</span>
            <div className="dv2-bar-track">
              <div className="dv2-bar-fill" style={{ width: `${perceptionGap.m2Score}%`, background: 'var(--a)' }} />
            </div>
            <span className="dv2-bar-val" style={{ color: 'var(--a)' }}>{perceptionGap.m2Score}</span>
          </div>

          {percGapExpanded && (
            <div className="dv2-dbar-detail" style={{ borderLeftColor: perceptionGap.isOver ? 'var(--r)' : 'var(--b)' }}>
              <div className="dv2-percgap-badge" data-type={perceptionGap.isOver ? 'over' : 'under'} style={{ marginBottom: 8 }}>
                {perceptionGap.label}
              </div>
              <div className="dv2-dbar-detail-txt">{perceptionGap.insightText}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Section B: Say-Do Gaps — as bar rows ── */}
      {visibleBars.map((c, i) => {
        const isOpen = expandedBar === i;
        const accentColor = c.severity === 'high' ? 'var(--r)' : 'var(--a)';
        const barColor = c.severity === 'high' ? 'var(--r)' : 'var(--a)';

        return (
          <div key={c.contradiction_id || i} className="dv2-dbar">
            <div className="dv2-dbar-head">
              <div className="dv2-dbar-lbl-wrap">
                <span className="dv2-dbar-lbl">{c.client_title}</span>
                <span className="dv2-dbar-mt" style={{
                  color: c.severity === 'high' ? 'var(--r)' : 'var(--a)',
                  background: c.severity === 'high' ? 'rgba(239,68,68,.08)' : 'rgba(245,158,11,.08)',
                }}>
                  {c.severity.toUpperCase()}
                </span>
              </div>
              <button className="dv2-dbar-gap-btn" onClick={() => setExpandedBar(isOpen ? null : i)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--tm)" strokeWidth="2"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            <div className="dv2-bar-row">
              <span className="dv2-bar-lbl">AFFECTED</span>
              <div className="dv2-bar-track">
                <div className="dv2-bar-fill" style={{ width: `${c.score}%`, background: barColor }} />
              </div>
              <span className="dv2-bar-val" style={{ color: barColor }}>{c.score}</span>
            </div>

            {isOpen && (
              <div className="dv2-dbar-detail" style={{ borderLeftColor: accentColor }}>
                <div className="dv2-dbar-detail-qt" style={{ marginBottom: 6 }}>"{c.client_callout}"</div>
                <div className="dv2-dbar-detail-txt">{c.client_description}</div>

                {c.evidence?.[0]?.quote && (
                  <div style={{
                    fontSize: '11px', color: 'var(--tm)', fontStyle: 'italic', lineHeight: 1.55,
                    borderLeft: '2px solid var(--bg4)', paddingLeft: 10, margin: '8px 0',
                  }}>
                    "{c.evidence[0].quote}"
                  </div>
                )}

                {c.coaching_question && (
                  <div style={{
                    fontSize: '12px', color: 'var(--accent)', lineHeight: 1.55,
                    background: 'var(--accent-06)', padding: '6px 10px', borderRadius: 'var(--rad)',
                    margin: '8px 0',
                  }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', letterSpacing: '0.1em', display: 'block', marginBottom: 3, opacity: 0.7 }}>
                      COACHING QUESTION
                    </span>
                    {c.coaching_question}
                  </div>
                )}

                {c.related_metrics?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    {c.related_metrics.map(m => (
                      <span key={m} className="dv2-q-tag">{m}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Expand / Collapse */}
      {hiddenCount > 0 && (
        <button
          className="dv2-mirror-expand-btn"
          onClick={() => { setShowAll(!showAll); setExpandedBar(null); }}
        >
          <span>{showAll ? 'Show less' : `Show ${hiddenCount} more`}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {/* ── Fallback ── */}
      {!hasContent && (
        <div className="dv2-argyris-note">
          <div className="dv2-argyris-txt">
            No perception gaps detected in this evaluation.
          </div>
        </div>
      )}

      {/* ── Argyris note ── */}
      {hasContent && (
        <div className="dv2-argyris-note">
          <div className="dv2-argyris-lbl">ARGYRIS MIRROR PRINCIPLE</div>
          <div className="dv2-argyris-txt">
            These gaps represent disconnects between <strong>stated intent</strong> and <strong>observed behaviour</strong> — the "say-do" gap that undermines organisational trust and execution.
          </div>
        </div>
      )}
    </div>
  );
}
