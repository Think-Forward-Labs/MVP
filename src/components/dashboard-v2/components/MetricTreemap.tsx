import { useState, useMemo } from 'react';
import type { MetricInsight, MetricScoreDetail } from '../types';
import { METRIC_COLORS, METRIC_ORDER } from '../utils';
import { buildTreemapItems, squarify } from '../treemapLayout';
import { MetricDetailView } from './MetricDetailView';

interface MetricTreemapProps {
  metricInsights: MetricInsight[];
  sortedMetrics: MetricScoreDetail[];
  onBack: () => void;
}

interface SelectedFinding {
  metricCode: string;
  type: 'observation' | 'recommendation';
  index: number;
}

export function MetricTreemap({ metricInsights, sortedMetrics, onBack }: MetricTreemapProps) {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [selectedFinding, setSelectedFinding] = useState<SelectedFinding | null>(null);

  const items = useMemo(
    () => buildTreemapItems(metricInsights, activeFilters),
    [metricInsights, activeFilters]
  );

  const rects = useMemo(() => squarify(items, 100, 100), [items]);

  const toggleFilter = (code: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const clearFilters = () => setActiveFilters(new Set());

  // Determine block size class from area
  const sizeClass = (w: number, h: number): string => {
    const area = w * h;
    if (area >= 400) return 'tm-block--lg';
    if (area >= 100) return 'tm-block--md';
    return 'tm-block--sm';
  };

  const handleBlockClick = (rect: (typeof rects)[0]) => {
    // Parse the id to get type and index: "M1-obs-0"
    const parts = rect.item.id.split('-');
    const type = parts[1] === 'obs' ? 'observation' : 'recommendation' as const;
    const index = parseInt(parts[2], 10);
    setSelectedFinding({ metricCode: rect.item.metricCode, type, index });
  };

  // If a finding is selected, show the detail view on top
  if (selectedFinding) {
    return (
      <>
        <div className="cd-page" style={{ zIndex: 100 }}>
          {/* Treemap stays in background */}
        </div>
        <MetricDetailView
          metricCode={selectedFinding.metricCode}
          highlightType={selectedFinding.type}
          highlightIndex={selectedFinding.index}
          metricInsights={metricInsights}
          sortedMetrics={sortedMetrics}
          onBack={() => setSelectedFinding(null)}
        />
      </>
    );
  }

  // Available metric codes that actually have findings
  const availableCodes = new Set(metricInsights.map(m => m.metric_code));

  return (
    <div className="cd-page" style={{ zIndex: 100 }}>
      <div className="cd-topbar">
        <div className="cd-topbar-inner">
          <button className="cd-back-btn" onClick={onBack}>← Back to Dashboard</button>
          <div className="cd-topbar-right">
            <span className="cd-topbar-label">CABAS® METRIC INTELLIGENCE MAP</span>
            <span className="cd-topbar-idx">{items.length} FINDINGS</span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="tm-filter-bar">
        <button
          className={`tm-chip ${activeFilters.size === 0 ? 'tm-chip--active' : ''}`}
          onClick={clearFilters}
        >
          ALL
        </button>
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
              {def.code}
            </button>
          );
        })}
      </div>

      {/* Treemap container */}
      <div className="tm-container">
        {rects.length === 0 && (
          <div className="tm-empty">No findings match the selected filters.</div>
        )}
        {rects.map(rect => {
          const colors = METRIC_COLORS[rect.item.metricCode] || { base: '#666', bg10: 'rgba(102,102,102,0.1)' };
          const cls = sizeClass(rect.w, rect.h);
          return (
            <button
              key={rect.item.id}
              className={`tm-block ${cls}`}
              style={{
                left: `${rect.x}%`,
                top: `${rect.y}%`,
                width: `${rect.w}%`,
                height: `${rect.h}%`,
                background: colors.bg10,
                borderColor: `${colors.base}30`,
              }}
              onClick={() => handleBlockClick(rect)}
            >
              <span className="tm-block-code" style={{ background: colors.base }}>
                {rect.item.metricCode}
              </span>
              {cls !== 'tm-block--sm' && (
                <>
                  <span className="tm-block-type">
                    {rect.item.type === 'observation' ? 'OBS' : 'REC'}
                  </span>
                  <span className="tm-block-text">{rect.item.text}</span>
                </>
              )}
              <span className="tm-block-score" style={{ color: colors.base }}>
                {rect.item.metricScore}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
