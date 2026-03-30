import { useMemo } from 'react';
import type { MetricScoreDetail, MetricInsight, RefinedReport } from '../types';
import { getMetricScore } from '../utils';

interface SayDoGapsSummaryProps {
  contradictions: RefinedReport['contradictions'];
  crossMetricInsights?: Record<string, string>;
  metricInsights: MetricInsight[];
  sortedMetrics: MetricScoreDetail[];
  sourceCount?: number;
  onViewDetails: () => void;
}

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

const MAX_VISIBLE = 3;

export function SayDoGapsSummary({ contradictions, crossMetricInsights, metricInsights, sortedMetrics, sourceCount, onViewDetails }: SayDoGapsSummaryProps) {
  const isSingleRespondent = sourceCount !== undefined && sourceCount <= 1;

  // Perception Gap
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
    return { p4Score, m2Score, gap, isOver, label: isOver ? `OVERCONFIDENCE +${Math.abs(gap)}pts` : `UNDERCONFIDENCE ${gap}pts` };
  }, [crossMetricInsights, sortedMetrics, metricInsights]);

  const contradictionBars = useMemo(() =>
    contradictions.map(c => ({
      ...c,
      score: getContradictionScore(c, sortedMetrics, metricInsights),
    })),
    [contradictions, sortedMetrics, metricInsights]
  );

  const gapCount = contradictions.filter(c => c.severity === 'high').length;
  const hasContent = perceptionGap || contradictions.length > 0;
  const visibleBars = contradictionBars.slice(0, MAX_VISIBLE);
  const hiddenCount = contradictionBars.length - MAX_VISIBLE;

  return (
    <div className="dv2-panel dv2-panel--saydo dv2-fi">
      <div className="dv2-panel-header">
        <span className="dv2-panel-label dv2-panel-label--saydo">ORGANISATIONAL MIRROR</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(gapCount > 0 || perceptionGap) && (
            <span className="dv2-mirror-badge">
              {gapCount + (perceptionGap ? 1 : 0)} GAP{(gapCount + (perceptionGap ? 1 : 0)) !== 1 ? 'S' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="dv2-saydo-content">
        {/* Perception Gap */}
        {perceptionGap && (
          <div className="dv2-saydo-item">
            <div className="dv2-saydo-item-head">
              <span className="dv2-saydo-item-title">Perception Gap</span>
              <span className="dv2-saydo-item-tag" data-type={perceptionGap.isOver ? 'over' : 'under'}>
                {perceptionGap.label}
              </span>
            </div>
            <div className="dv2-bar-row">
              <span className="dv2-bar-lbl">SELF</span>
              <div className="dv2-bar-track">
                <div className="dv2-bar-fill" style={{ width: `${perceptionGap.p4Score}%`, background: 'rgba(61,155,255,.6)' }} />
              </div>
              <span className="dv2-bar-val" style={{ color: 'rgba(61,155,255,.9)' }}>{perceptionGap.p4Score}</span>
            </div>
            <div className="dv2-bar-row">
              <span className="dv2-bar-lbl">ACTUAL</span>
              <div className="dv2-bar-track">
                <div className="dv2-bar-fill" style={{ width: `${perceptionGap.m2Score}%`, background: 'var(--a)' }} />
              </div>
              <span className="dv2-bar-val" style={{ color: 'var(--a)' }}>{perceptionGap.m2Score}</span>
            </div>
          </div>
        )}

        {/* Say-Do Gaps */}
        {visibleBars.map((c, i) => {
          const barColor = c.severity === 'high' ? 'var(--r)' : 'var(--a)';
          return (
            <div key={c.contradiction_id || i} className="dv2-saydo-item">
              <div className="dv2-saydo-item-head">
                <span className="dv2-saydo-item-title">{c.client_title}</span>
                <span className="dv2-saydo-item-severity" style={{
                  color: c.severity === 'high' ? 'var(--r)' : 'var(--a)',
                  background: c.severity === 'high' ? 'rgba(239,68,68,.08)' : 'rgba(245,158,11,.08)',
                }}>
                  {c.severity.toUpperCase()}
                </span>
              </div>
              <div className="dv2-bar-row">
                <span className="dv2-bar-lbl">AFFECTED</span>
                <div className="dv2-bar-track">
                  <div className="dv2-bar-fill" style={{ width: `${c.score}%`, background: barColor }} />
                </div>
                <span className="dv2-bar-val" style={{ color: barColor }}>{c.score}</span>
              </div>
            </div>
          );
        })}

        {hiddenCount > 0 && (
          <div style={{ fontSize: 10, color: 'var(--ts)', textAlign: 'center', padding: '4px 0' }}>
            +{hiddenCount} more contradiction{hiddenCount !== 1 ? 's' : ''}
          </div>
        )}

        {!hasContent && !isSingleRespondent && (
          <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--ts)', fontSize: 12 }}>
            No contradictions detected across {sourceCount || 0} respondents.
          </div>
        )}

        {!hasContent && isSingleRespondent && (
          <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--ts)', fontSize: 12 }}>
            No within-respondent contradictions detected.
          </div>
        )}
      </div>

      {isSingleRespondent && (
        <div style={{ padding: '6px 10px', fontSize: 10, color: '#92700E', background: 'rgba(217,175,60,.08)', borderRadius: 4, marginBottom: 8 }}>
          Cross-level gap analysis requires 2+ organisational levels. Within-respondent contradictions are shown above.
        </div>
      )}

      {hasContent && (
        <button className="dv2-view-details-btn dv2-view-details-btn--saydo" onClick={onViewDetails}>
          View Details
        </button>
      )}
    </div>
  );
}
