import { useState, useMemo } from 'react';
import type { MetricScoreDetail, MetricInsight } from '../types';
import { METRIC_ORDER, getMetricDisplayName, getMetricScore } from '../utils';

interface OrgMirrorProps {
  sortedMetrics: MetricScoreDetail[];
  metricInsights: MetricInsight[];
}

interface GapData {
  label: string;
  metricTag: string;
  selfRated: number;
  aiDetected: number;
  rationale: string;
  quote: string;
}

// Metrics already shown in VitalSigns top gauges (Op Strength, Future Readiness, plus 4 derived)
// The derived gauges use: M10+M6 (Cultural Health), M12 (Resource Capability),
// M3+M4 (OODA Velocity), M13+M14 (Resilience Index)
// But M1 and M2 are the primary ones always shown. Skip those from the mirror.
const VITALS_METRICS = new Set(['M1', 'M2']);

const INITIAL_SHOW = 5;

export function OrgMirror({ sortedMetrics, metricInsights }: OrgMirrorProps) {
  const [expandedBar, setExpandedBar] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const gapBars: GapData[] = useMemo(() =>
    METRIC_ORDER
      .filter(def => !VITALS_METRICS.has(def.code))
      .map(def => {
        const score = getMetricScore(def.code, sortedMetrics, metricInsights);
        const insight = metricInsights.find(m => m.metric_code === def.code);
        const rationale = insight?.observations?.[0] || insight?.summary || '';
        const quote = insight?.evidence?.[0]?.quote || '';
        return {
          label: def.clientName,
          metricTag: def.code,
          selfRated: 0,
          aiDetected: score,
          rationale,
          quote,
        };
      }).filter(g => g.aiDetected > 0),
    [sortedMetrics, metricInsights]
  );

  const gapCount = gapBars.filter(g => g.selfRated > 0 && Math.abs(g.selfRated - g.aiDetected) >= 10).length;
  const visibleBars = showAll ? gapBars : gapBars.slice(0, INITIAL_SHOW);
  const hiddenCount = gapBars.length - INITIAL_SHOW;

  return (
    <div className="dv2-mirror-panel dv2-fi">
      <div className="dv2-mirror-head">
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--tm)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Organisational Mirror
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--txt)', marginTop: 3 }}>
            AI-detected scores across all dimensions
          </div>
        </div>
        {gapCount > 0 && <div className="dv2-mirror-badge">{gapCount} GAPS</div>}
      </div>

      <div className="dv2-mirror-legend">
        {gapBars.some(g => g.selfRated > 0) && (
          <div className="dv2-legend-item">
            <div className="dv2-legend-bar" style={{ width: 16, background: 'rgba(61,155,255,.6)' }} />
            <span className="dv2-legend-txt">SELF-RATED</span>
          </div>
        )}
        <div className="dv2-legend-item">
          <div className="dv2-legend-bar" style={{ width: 16, background: 'var(--a)' }} />
          <span className="dv2-legend-txt">AI DETECTED</span>
        </div>
      </div>

      {visibleBars.map((g, i) => {
        const isOpen = expandedBar === i;
        const gap = g.selfRated > 0 ? Math.abs(g.selfRated - g.aiDetected) : 0;
        const overestimate = g.selfRated > g.aiDetected;

        return (
          <div key={i} className="dv2-dbar">
            <div className="dv2-dbar-head">
              <div className="dv2-dbar-lbl-wrap">
                <span className="dv2-dbar-lbl">{g.label}</span>
                <span className="dv2-dbar-mt">{g.metricTag}</span>
              </div>
              {(gap > 0 || g.rationale) && (
                <button className="dv2-dbar-gap-btn" onClick={() => setExpandedBar(isOpen ? null : i)}>
                  {gap > 0 && <span className="dv2-dbar-gap">{overestimate ? '▼' : '▲'}{gap}pts</span>}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--tm)" strokeWidth="2"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              )}
            </div>

            {g.selfRated > 0 && (
              <div className="dv2-bar-row">
                <span className="dv2-bar-lbl">SELF-RATED</span>
                <div className="dv2-bar-track">
                  <div className="dv2-bar-fill" style={{ width: `${g.selfRated}%`, background: 'rgba(61,155,255,.6)' }} />
                </div>
                <span className="dv2-bar-val" style={{ color: 'rgba(61,155,255,.9)' }}>{g.selfRated}</span>
              </div>
            )}

            <div className="dv2-bar-row">
              <span className="dv2-bar-lbl">AI DETECTED</span>
              <div className="dv2-bar-track">
                <div className="dv2-bar-fill" style={{ width: `${g.aiDetected}%`, background: 'var(--a)' }} />
              </div>
              <span className="dv2-bar-val" style={{ color: 'var(--a)' }}>{g.aiDetected}</span>
            </div>

            {isOpen && g.rationale && (
              <div className="dv2-dbar-detail">
                <div className="dv2-dbar-detail-txt">{g.rationale}</div>
                {g.quote && <div className="dv2-dbar-detail-qt">"{g.quote}"</div>}
              </div>
            )}
          </div>
        );
      })}

      {/* Expand / Collapse button */}
      {hiddenCount > 0 && (
        <button
          className="dv2-mirror-expand-btn"
          onClick={() => { setShowAll(!showAll); setExpandedBar(null); }}
        >
          <span>{showAll ? 'Show less' : `Show ${hiddenCount} more metrics`}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      <div className="dv2-argyris-note">
        <div className="dv2-argyris-lbl">ARGYRIS MIRROR PRINCIPLE</div>
        <div className="dv2-argyris-txt">
          These scores represent the AI-detected operational reality based on narrative analysis.
          <strong> Cross-level triangulation</strong> with management and frontline respondents would confirm whether
          these are individual or systemic patterns.
        </div>
      </div>
    </div>
  );
}
