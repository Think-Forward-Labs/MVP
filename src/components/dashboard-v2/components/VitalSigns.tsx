import { useRef, useEffect, useState } from 'react';
import { scoreColor, scoreLabel } from '../utils';

interface VitalSignsProps {
  overall: number;
  operationalStrength: number;
  futureReadiness: number;
  metricScores: Array<{ label: string; score: number }>;
}

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
  const tickColor = isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.10)';
  const trackColor = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)';

  // Inner scale ticks — short lines pointing inward, no numbers
  let ticks = '';
  const tickCount = 20;
  for (let i = 0; i <= tickCount; i++) {
    const angle = S + (i / tickCount) * SWEEP;
    const isMajor = i % 5 === 0;
    const outerR = r - sw / 2 - 1;
    const innerR = outerR - (isMajor ? 5 : 3);
    const outer = polar(cx, cy, outerR, angle);
    const inner = polar(cx, cy, innerR, angle);
    ticks += `<line x1="${inner.x}" y1="${inner.y}" x2="${outer.x}" y2="${outer.y}"
      stroke="${tickColor}" stroke-width="${isMajor ? 1 : 0.6}"/>`;
  }

  const scoreFontSize = isMain ? size * 0.24 : size * 0.22;

  return `
    ${ticks}
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

function Gauge({ score, size, label, isMain }: { score: number; size: number; label: string; isMain?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const isDark = useIsDark();

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = drawGaugeContent(score, size, !!isMain, isDark);
    }
  }, [score, size, isMain, isDark]);

  const svgH = Math.round(size * 0.75);
  return (
    <div className={`dv2-gauge-wrap ${isMain ? 'dv2-gauge-wrap--main' : ''}`}>
      <div style={{ height: isMain ? undefined : 62, display: 'flex', alignItems: 'flex-start' }}>
        <svg ref={ref} width={size} height={svgH} />
      </div>
      <div className="dv2-gauge-lbl" style={{ marginTop: 6 }}>{label}</div>
      <div className="dv2-gauge-status" style={{ color: scoreColor(score) }}>
        {scoreLabel(score)}
      </div>
    </div>
  );
}

export function VitalSigns({ overall, operationalStrength, futureReadiness, metricScores }: VitalSignsProps) {
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
        {subGauges.map((g, i) => (
          <Gauge key={i} score={g.score} size={90} label={g.label} />
        ))}
      </div>
    </div>
  );
}
