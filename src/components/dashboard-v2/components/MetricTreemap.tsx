import { useState, useMemo } from 'react';
import type { MetricInsight, MetricScoreDetail } from '../types';
import { METRIC_COLORS, METRIC_ORDER, scoreColor } from '../utils';
import { buildMetricGroups, squarifyNested } from '../treemapLayout';
import type { MetricGroupRect } from '../treemapLayout';
import { MetricDetailView } from './MetricDetailView';

interface MetricTreemapProps {
  metricInsights: MetricInsight[];
  sortedMetrics: MetricScoreDetail[];
  onBack: () => void;
}

interface SelectedFinding {
  metricCode: string;
  observationIndex: number;
}

function severityLabel(score: number): { label: string; cls: string } {
  if (score >= 0.7) return { label: 'CRITICAL', cls: 'tm-severity--critical' };
  if (score >= 0.5) return { label: 'HIGH', cls: 'tm-severity--high' };
  if (score >= 0.3) return { label: 'MEDIUM', cls: 'tm-severity--medium' };
  return { label: 'LOW', cls: 'tm-severity--low' };
}

export function MetricTreemap({ metricInsights, sortedMetrics, onBack }: MetricTreemapProps) {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [selectedFinding, setSelectedFinding] = useState<SelectedFinding | null>(null);

  const groups = useMemo(
    () => buildMetricGroups(metricInsights, activeFilters),
    [metricInsights, activeFilters]
  );

  const groupRects = useMemo(() => squarifyNested(groups, 100, 100), [groups]);

  const filteredGroupRects = useMemo(() => {
    if (sentimentFilter === 'all') return groupRects;
    return groupRects.map(gr => ({
      ...gr,
      childRects: gr.childRects.filter(cr => cr.item.sentiment === sentimentFilter),
    })).filter(gr => gr.childRects.length > 0);
  }, [groupRects, sentimentFilter]);

  const totalObs = filteredGroupRects.reduce((s, gr) => s + gr.childRects.length, 0);

  const toggleFilter = (code: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const clearFilters = () => { setActiveFilters(new Set()); setSentimentFilter('all'); };

  const handleBlockClick = (metricCode: string, obsId: string) => {
    const index = parseInt(obsId.split('-')[2], 10);
    setSelectedFinding({ metricCode, observationIndex: index });
  };

  if (selectedFinding) {
    return (
      <>
        <div className="cd-page" style={{ zIndex: 100 }} />
        <MetricDetailView
          metricCode={selectedFinding.metricCode}
          observationIndex={selectedFinding.observationIndex}
          metricInsights={metricInsights}
          sortedMetrics={sortedMetrics}
          onBack={() => setSelectedFinding(null)}
        />
      </>
    );
  }

  const availableCodes = new Set(metricInsights.map(m => m.metric_code));

  return (
    <div className="cd-page" style={{ zIndex: 100 }}>
      <div className="cd-topbar">
        <div className="cd-topbar-inner">
          <button className="cd-back-btn" onClick={onBack}>← Back to Dashboard</button>
          <div className="cd-topbar-right">
            <span className="cd-topbar-label">CABAS® INTELLIGENCE MAP</span>
            <span className="cd-topbar-idx">{totalObs} OBSERVATIONS</span>
          </div>
        </div>
      </div>

      <div className="tm-filter-bar">
        <button
          className={`tm-chip ${activeFilters.size === 0 && sentimentFilter === 'all' ? 'tm-chip--active' : ''}`}
          onClick={clearFilters}
        >ALL</button>

        <button
          className={`tm-chip ${sentimentFilter === 'positive' ? 'tm-chip--active' : ''}`}
          onClick={() => setSentimentFilter(p => p === 'positive' ? 'all' : 'positive')}
          style={sentimentFilter === 'positive' ? { borderColor: 'var(--positive)', background: 'rgba(34,197,94,0.08)' } : undefined}
        >
          <span className="tm-chip-dot" style={{ background: 'var(--positive)' }} />
          STRENGTHS
        </button>
        <button
          className={`tm-chip ${sentimentFilter === 'negative' ? 'tm-chip--active' : ''}`}
          onClick={() => setSentimentFilter(p => p === 'negative' ? 'all' : 'negative')}
          style={sentimentFilter === 'negative' ? { borderColor: 'var(--negative)', background: 'rgba(239,68,68,0.08)' } : undefined}
        >
          <span className="tm-chip-dot" style={{ background: 'var(--negative)' }} />
          GAPS
        </button>

        <span style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} />

        {METRIC_ORDER.map(def => {
          if (!availableCodes.has(def.code)) return null;
          const colors = METRIC_COLORS[def.code];
          const isActive = activeFilters.has(def.code);
          return (
            <button
              key={def.code}
              className={`tm-chip ${isActive ? 'tm-chip--active' : ''}`}
              onClick={() => toggleFilter(def.code)}
              style={isActive ? { borderColor: colors?.base, background: colors?.bg10 } : undefined}
            >
              <span className="tm-chip-dot" style={{ background: colors?.base }} />
              {def.code} {def.clientName}
            </button>
          );
        })}
      </div>

      {/* Treemap */}
      <div className="tm-container">
        {filteredGroupRects.length === 0 && (
          <div className="tm-empty">No findings match the selected filters.</div>
        )}

        {filteredGroupRects.map((gr: MetricGroupRect) => {
          const colors = METRIC_COLORS[gr.group.metricCode] || { base: '#666', bg10: 'rgba(102,102,102,0.1)', bg06: 'rgba(102,102,102,0.06)' };
          const sc = scoreColor(gr.group.metricScore);
          const groupArea = gr.w * gr.h;
          // Hide label bar entirely for very tiny groups
          const hideLabel = groupArea < 60;
          const showName = groupArea >= 300;
          // Scale label bar height with group size
          const labelH = groupArea >= 2000 ? 28 : groupArea >= 800 ? 22 : 18;
          const codeFontSize = groupArea >= 2000 ? 10 : 8;
          const nameFontSize = groupArea >= 2000 ? 12 : 9;
          const scoreFontSize = groupArea >= 2000 ? 14 : groupArea >= 800 ? 12 : 11;

          return (
            <div
              key={gr.group.metricCode}
              className="tm-group"
              style={{
                left: `${gr.x}%`,
                top: `${gr.y}%`,
                width: `${gr.w}%`,
                height: `${gr.h}%`,
                borderColor: colors.base,
              }}
            >
              <div
                className={`tm-group-label${hideLabel ? ' tm-group-label--hidden' : ''}`}
                style={!hideLabel ? { height: labelH } : undefined}
              >
                <span className="tm-group-code" style={{ background: colors.base, fontSize: codeFontSize }}>
                  {gr.group.metricCode}
                </span>
                {showName && (
                  <span className="tm-group-name" style={{ fontSize: nameFontSize }}>{gr.group.metricName}</span>
                )}
                <span className="tm-group-score" style={{ color: sc, fontSize: scoreFontSize }}>
                  {gr.group.metricScore}
                </span>
              </div>

              <div
                className={`tm-group-content${hideLabel ? ' tm-group-content--full' : ''}`}
                style={!hideLabel ? { top: labelH + 1 } : undefined}
              >
                {gr.childRects.map(rect => {
                  const isPositive = rect.item.sentiment === 'positive';
                  const sentimentBg = isPositive ? 'rgba(34,197,94,0.13)' : 'rgba(239,68,68,0.13)';
                  const sev = severityLabel(rect.item.severity);

                  // Effective area combines child size with parent group size.
                  // Use sqrt for a smooth curve — prevents extremes in both directions.
                  // childArea is 0-10000 (child coords), groupArea is 0-10000 (container coords).
                  const rawEffective = (rect.w * rect.h * groupArea) / 10000;
                  const ea = Math.sqrt(rawEffective) * 3; // smooth scale factor 0-300
                  const showLens = ea >= 30;
                  const showSev = ea >= 18;
                  // Smooth font: 7px → 22px
                  const textSize = Math.min(22, Math.max(7, Math.round(7 + ea * 0.15)));
                  const obsPad = ea >= 60 ? '6px 8px'
                    : ea >= 30 ? '4px 6px'
                    : '2px 3px';

                  return (
                    <div
                      key={rect.item.id}
                      className="tm-obs"
                      style={{
                        left: `calc(${rect.x}% + 1px)`,
                        top: `calc(${rect.y}% + 1px)`,
                        width: `calc(${rect.w}% - 2px)`,
                        height: `calc(${rect.h}% - 2px)`,
                        background: sentimentBg,
                        padding: obsPad,
                      }}
                      onClick={() => handleBlockClick(rect.item.metricCode, rect.item.id)}
                    >
                      {showLens && (
                        <div className="tm-obs-top" style={ea >= 60 ? { height: 18, gap: 6 } : undefined}>
                          {rect.item.severity > 0 && (
                            <span className={`tm-severity ${sev.cls}`} style={ea >= 60 ? { fontSize: 9 } : undefined}>{sev.label}</span>
                          )}
                          {rect.item.lensName && (
                            <span className="tm-obs-lens" style={{ fontSize: ea >= 60 ? 9 : 7 }}>{rect.item.lensName}</span>
                          )}
                        </div>
                      )}
                      {!showLens && showSev && rect.item.severity > 0 && (
                        <span className={`tm-severity ${sev.cls}`} style={{ fontSize: 6 }}>{sev.label}</span>
                      )}
                      <span
                        className="tm-obs-text"
                        style={{ fontSize: textSize, lineHeight: textSize >= 16 ? 1.4 : 1.3 }}
                      >
                        {rect.item.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
