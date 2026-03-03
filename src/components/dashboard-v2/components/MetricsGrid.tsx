import type { MetricScoreDetail, MetricInsight } from '../types';
import { METRIC_ORDER, getMetricScore, scoreColor, scoreLabel } from '../utils';

interface MetricsGridProps {
  sortedMetrics: MetricScoreDetail[];
  metricInsights: MetricInsight[];
  onViewTreemap?: () => void;
  onSelectMetric?: (metricCode: string) => void;
}

export function MetricsGrid({ sortedMetrics, metricInsights, onViewTreemap, onSelectMetric }: MetricsGridProps) {
  return (
    <div className="dv2-metrics-wrap dv2-fi">
      <div className="dv2-metrics-hdr">
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--tm)', letterSpacing: '0.8px' }}>
            14 DIMENSIONS ANALYSED · RESEARCH-GROUNDED SCORING FRAMEWORK
          </div>
          <div style={{ fontSize: '11px', color: 'var(--td)', marginTop: 3 }}>
            Click any dimension for detailed interpretation
          </div>
        </div>
        <div className="dv2-metrics-hdr-right">
          <div className="dv2-metrics-legend">
            <div className="dv2-m-legend-item"><div className="dv2-m-legend-dot" style={{ background: '#EF4444' }} /><span className="dv2-m-legend-txt">CRITICAL</span></div>
            <div className="dv2-m-legend-item"><div className="dv2-m-legend-dot" style={{ background: '#F59E0B' }} /><span className="dv2-m-legend-txt">WATCH</span></div>
            <div className="dv2-m-legend-item"><div className="dv2-m-legend-dot" style={{ background: '#3B82F6' }} /><span className="dv2-m-legend-txt">ADEQUATE</span></div>
            <div className="dv2-m-legend-item"><div className="dv2-m-legend-dot" style={{ background: '#22C55E' }} /><span className="dv2-m-legend-txt">STRONG</span></div>
          </div>
          {onViewTreemap && (
            <button className="dv2-view-analysis-btn--compact" onClick={(e) => { e.stopPropagation(); onViewTreemap(); }}>
              SEE DETAILS
            </button>
          )}
        </div>
      </div>

      <div className="dv2-metrics-grid">
        {METRIC_ORDER.map((def) => {
          const score = getMetricScore(def.code, sortedMetrics, metricInsights);
          const c = scoreColor(score);
          const lb = scoreLabel(score);

          return (
            <div
              key={def.code}
              className="dv2-m-tile"
              onClick={() => onSelectMetric?.(def.code)}
            >
              <div className="dv2-m-top">
                <span className="dv2-m-name">{def.clientName}</span>
                <span className="dv2-m-score" style={{ color: c }}>{score || '—'}</span>
              </div>
              <div className="dv2-m-bar-track">
                <div className="dv2-m-bar-fill" style={{ width: `${score}%`, background: c }} />
              </div>
              <div className="dv2-m-status" style={{ color: c }}>{score ? lb : ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
