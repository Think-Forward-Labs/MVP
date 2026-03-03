import { useState } from 'react';
import type { MetricScoreDetail, MetricInsight } from '../types';
import { METRIC_ORDER, getMetricScore, scoreColor, scoreLabel } from '../utils';

interface MetricsGridProps {
  sortedMetrics: MetricScoreDetail[];
  metricInsights: MetricInsight[];
  onViewTreemap?: () => void;
}

export function MetricsGrid({ sortedMetrics, metricInsights, onViewTreemap }: MetricsGridProps) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

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
        {onViewTreemap && (
          <button className="dv2-view-analysis-btn--compact" onClick={(e) => { e.stopPropagation(); onViewTreemap(); }}>
            SEE DETAILS
          </button>
        )}
        <div className="dv2-metrics-legend">
          <div className="dv2-m-legend-item"><div className="dv2-m-legend-dot" style={{ background: '#EF4444' }} /><span className="dv2-m-legend-txt">CRITICAL</span></div>
          <div className="dv2-m-legend-item"><div className="dv2-m-legend-dot" style={{ background: '#F59E0B' }} /><span className="dv2-m-legend-txt">WATCH</span></div>
          <div className="dv2-m-legend-item"><div className="dv2-m-legend-dot" style={{ background: '#3B82F6' }} /><span className="dv2-m-legend-txt">ADEQUATE</span></div>
          <div className="dv2-m-legend-item"><div className="dv2-m-legend-dot" style={{ background: '#22C55E' }} /><span className="dv2-m-legend-txt">STRONG</span></div>
        </div>
      </div>

      <div className="dv2-metrics-grid">
        {METRIC_ORDER.map((def) => {
          const score = getMetricScore(def.code, sortedMetrics, metricInsights);
          const insight = metricInsights.find(m => m.metric_code === def.code);
          const c = scoreColor(score);
          const lb = scoreLabel(score);
          const isOpen = expandedCode === def.code;

          return (
            <div
              key={def.code}
              className={`dv2-m-tile ${isOpen ? 'dv2-m-tile--open' : ''}`}
              style={isOpen ? { borderColor: `${c}30` } : undefined}
              onClick={() => setExpandedCode(isOpen ? null : def.code)}
            >
              <div className="dv2-m-top">
                <span className="dv2-m-name">{def.clientName}</span>
                <span className="dv2-m-score" style={{ color: c }}>{score || '—'}</span>
              </div>
              <div className="dv2-m-bar-track">
                <div className="dv2-m-bar-fill" style={{ width: `${score}%`, background: c }} />
              </div>
              <div className="dv2-m-status" style={{ color: c }}>{score ? lb : ''}</div>
              {isOpen && (insight?.summary || insight?.observations?.length) && (
                <div className="dv2-m-desc">
                  {insight?.summary}
                  {insight?.observations?.length ? (
                    <ul style={{ margin: '6px 0 0 0', paddingLeft: 14 }}>
                      {insight.observations.slice(0, 3).map((obs, j) => (
                        <li key={j} style={{ fontSize: '10px', color: 'var(--td)', lineHeight: 1.5, marginBottom: 3 }}>{obs}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
