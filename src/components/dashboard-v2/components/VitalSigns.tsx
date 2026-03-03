import { useRef, useEffect, useState } from 'react';
import { scoreColor, scoreLabel } from '../utils';

interface VitalSignsProps {
  overall: number;
  operationalStrength: number;
  futureReadiness: number;
  metricScores: Array<{ label: string; score: number }>;
  onSelectMetric?: (metricCode: string) => void;
}

// Map gauge labels to their primary metric code for navigation
const GAUGE_METRIC_MAP: Record<string, string> = {
  'Operational Strength': 'M1',
  'Future Readiness': 'M2',
  'Cultural Health': 'M10',
  'Resource Capability': 'M12',
  'OODA Velocity': 'M3',
  'Resilience Index': 'M13',
};

// Icon + tooltip metadata for each gauge
const GAUGE_META: Record<string, { icon: string; tooltip: string }> = {
  'Operational Strength': {
    icon: '⚙',
    tooltip: 'Current execution capability. Measures how well the organisation delivers today across leadership, processes, and alignment.',
  },
  'Future Readiness': {
    icon: '🔭',
    tooltip: 'Preparedness for disruption and change. Assesses strategic adaptability, innovation capacity, and forward-looking orientation.',
  },
  'Cultural Health': {
    icon: '🤝',
    tooltip: 'Strength of shared values, psychological safety, and team cohesion. Reflects how well people collaborate and trust each other.',
  },
  'Resource Capability': {
    icon: '🏗',
    tooltip: 'Adequacy and allocation of talent, technology, and capital resources. Indicates whether the organisation has what it needs to execute.',
  },
  'OODA Velocity': {
    icon: '⚡',
    tooltip: 'Speed of the Observe-Orient-Decide-Act loop. Measures how fast the organisation senses market shifts and responds effectively.',
  },
  'Resilience Index': {
    icon: '🛡',
    tooltip: 'Capacity to absorb shocks, recover from setbacks, and sustain strategic assets over time.',
  },
};

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, r: number, s: number, e: number) {
  const a = polar(cx, cy, r, s);
  const b = polar(cx, cy, r, Math.min(e, s + 359.99));
  return `M${a.x},${a.y}A${r},${r},0,${e - s > 180 ? 1 : 0},1,${b.x},${b.y}`;
}

function drawGaugeContent(score: number, size: number, isMain: boolean, isDark: boolean): string {
  const cx = size / 2;
  const cy = size * 0.44;
  const r = size * 0.40;
  const sw = isMain ? size * 0.055 : size * 0.06;

  const S = 215;
  const SWEEP = 290;
  const E = S + SWEEP;

  const clamped = Math.max(0.5, Math.min(100, score));
  const fillEnd = S + (clamped / 100) * SWEEP;
  const c = scoreColor(score);

  // Theme-aware colors
  const trackColor = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)';
  const borderColor = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)';

  const scoreFontSize = isMain ? size * 0.24 : size * 0.22;

  const outerBorderR = r + sw / 2 + 2;
  const innerBorderR = r - sw / 2 - 2;

  return `
    <path d="${arcPath(cx, cy, outerBorderR, S, E)}" fill="none" stroke="${borderColor}" stroke-width="0.8" stroke-linecap="round"/>
    <path d="${arcPath(cx, cy, innerBorderR, S, E)}" fill="none" stroke="${borderColor}" stroke-width="0.8" stroke-linecap="round"/>
    <path d="${arcPath(cx, cy, r, S, E)}" fill="none" stroke="${trackColor}" stroke-width="${sw}" stroke-linecap="round"/>
    <path d="${arcPath(cx, cy, r, S, fillEnd)}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" style="filter:drop-shadow(0 0 4px ${c}40)"/>
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" style="font-family:var(--mono);font-size:${scoreFontSize}px;font-weight:700;fill:${c};font-variant-numeric:tabular-nums;letter-spacing:-0.03em">${score}</text>
  `;
}

function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.getAttribute('data-theme') !== 'light'
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

function Gauge({ score, size, label, isMain, onClick }: { score: number; size: number; label: string; isMain?: boolean; onClick?: () => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const isDark = useIsDark();

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = drawGaugeContent(score, size, !!isMain, isDark);
    }
  }, [score, size, isMain, isDark]);

  const svgH = Math.round(size * 0.75);
  const meta = GAUGE_META[label];
  const clickable = !!onClick;

  return (
    <div
      className={`dv2-gauge-wrap ${isMain ? 'dv2-gauge-wrap--main' : ''} ${clickable ? 'dv2-gauge-wrap--clickable' : ''}`}
      onClick={onClick}
    >
      <div style={{ height: isMain ? undefined : 62, display: 'flex', alignItems: 'flex-start' }}>
        <svg ref={ref} width={size} height={svgH} />
      </div>
      {meta && (
        <div className="dv2-gauge-icon-row">
          <span className="dv2-gauge-icon">{meta.icon}</span>
          <div className="dv2-gauge-tooltip">
            <div className="dv2-gauge-tooltip-title">{label}</div>
            <div className="dv2-gauge-tooltip-text">{meta.tooltip}</div>
          </div>
        </div>
      )}
      <div className="dv2-gauge-lbl" style={{ marginTop: meta ? 2 : 6 }}>{label}</div>
      <div className="dv2-gauge-status" style={{ color: scoreColor(score) }}>
        {scoreLabel(score)}
      </div>
    </div>
  );
}

export function VitalSigns({ overall, operationalStrength, futureReadiness, metricScores, onSelectMetric }: VitalSignsProps) {
  const subGauges = [
    { label: 'Operational Strength', score: operationalStrength },
    { label: 'Future Readiness', score: futureReadiness },
    ...metricScores.slice(0, 4),
  ];

  return (
    <div className="dv2-vitals dv2-fi">
      <div className="dv2-vitals-overall">
        <div className="dv2-vitals-overall-label">ORGANISATION SCORE</div>
        <Gauge score={overall} size={150} label="Overall Health" isMain />
      </div>
      <div className="dv2-vitals-rest">
        {subGauges.map((g, i) => {
          const metricCode = GAUGE_METRIC_MAP[g.label];
          return (
            <Gauge
              key={i}
              score={g.score}
              size={90}
              label={g.label}
              onClick={metricCode && onSelectMetric ? () => onSelectMetric(metricCode) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
