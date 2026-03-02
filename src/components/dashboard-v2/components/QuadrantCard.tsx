import { useRef, useEffect, useState } from 'react';
import type { QuadrantResult } from '../types';
import { scoreColor } from '../utils';

interface QuadrantCardProps {
  quadrant: QuadrantResult;
  m1Score: number;
  m2Score: number;
  gap: number;
}

export function QuadrantCard({ quadrant, m1Score, m2Score, gap }: QuadrantCardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 174, H = 155;

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

  useEffect(() => {
    if (!svgRef.current) return;
    const px = (m1Score / 100) * (W - 30) + 15;
    const py = H - ((m2Score / 100) * (H - 30) + 15);
    const c = quadrant.color;

    // Theme-aware quadrant fills
    const scattered = isDark ? '#1E1A0E' : '#FEF9EE';
    const adaptive  = isDark ? '#0C2118' : '#EEFBF3';
    const atRisk    = isDark ? '#22100E' : '#FEF0F0';
    const solid     = isDark ? '#0E1628' : '#EFF4FE';
    const gridLine  = isDark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)';

    // Labels — full solid colors, no alpha
    const scatteredLbl = isDark ? '#FBBF24' : '#B45309';
    const adaptiveLbl  = isDark ? '#4ADE80' : '#15803D';
    const atRiskLbl    = isDark ? '#F87171' : '#B91C1C';
    const solidLbl     = isDark ? '#60A5FA' : '#1D4ED8';

    svgRef.current.innerHTML = `
      <rect width="${W}" height="${H}" fill="var(--bg3)" rx="2"/>
      <rect x="0" y="0" width="${W / 2}" height="${H / 2}" fill="${scattered}"/>
      <rect x="${W / 2}" y="0" width="${W / 2}" height="${H / 2}" fill="${adaptive}"/>
      <rect x="0" y="${H / 2}" width="${W / 2}" height="${H / 2}" fill="${atRisk}"/>
      <rect x="${W / 2}" y="${H / 2}" width="${W / 2}" height="${H / 2}" fill="${solid}"/>
      <line x1="${W / 2}" y1="0" x2="${W / 2}" y2="${H}" stroke="${gridLine}" stroke-width="0.5"/>
      <line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" stroke="${gridLine}" stroke-width="0.5"/>
      <text x="${W * 0.25}" y="13" text-anchor="middle" style="font-family:var(--mono);font-size:9px;fill:${scatteredLbl};font-weight:700;letter-spacing:0.8px">SCATTERED</text>
      <text x="${W * 0.75}" y="13" text-anchor="middle" style="font-family:var(--mono);font-size:9px;fill:${adaptiveLbl};font-weight:700;letter-spacing:0.8px">ADAPTIVE</text>
      <text x="${W * 0.25}" y="${H - 5}" text-anchor="middle" style="font-family:var(--mono);font-size:9px;fill:${atRiskLbl};font-weight:700;letter-spacing:0.8px">AT-RISK</text>
      <text x="${W * 0.75}" y="${H - 5}" text-anchor="middle" style="font-family:var(--mono);font-size:9px;fill:${solidLbl};font-weight:700;letter-spacing:0.8px">SOLID</text>
      <circle cx="${px}" cy="${py}" r="18" fill="${c}12"/>
      <circle cx="${px}" cy="${py}" r="11" fill="${c}25"/>
      <circle cx="${px}" cy="${py}" r="5" fill="${c}"/>
      <line x1="${px - 12}" y1="${py}" x2="${px + 12}" y2="${py}" stroke="${c}55" stroke-width=".8" stroke-dasharray="2,2"/>
      <line x1="${px}" y1="${py - 12}" x2="${px}" y2="${py + 12}" stroke="${c}55" stroke-width=".8" stroke-dasharray="2,2"/>
    `;
  }, [m1Score, m2Score, quadrant.color, W, H, isDark]);

  return (
    <div className="dv2-card dv2-fi">
      <div className="dv2-card-lbl">Strategic Position</div>
      <svg ref={svgRef} width={W} height={H} style={{ borderRadius: '6px', overflow: 'hidden', display: 'block' }} />
      <div className="dv2-quad-nums">
        <div className="dv2-quad-num">
          <div className="dv2-quad-num-v" style={{ color: scoreColor(m1Score) }}>{m1Score}</div>
          <div className="dv2-quad-num-l">Op.Str</div>
        </div>
        <div className="dv2-quad-num">
          <div className="dv2-quad-num-v" style={{ color: scoreColor(m2Score) }}>{m2Score}</div>
          <div className="dv2-quad-num-l">FutRdy</div>
        </div>
        <div className="dv2-quad-num">
          <div className="dv2-quad-num-v" style={{ color: 'var(--tm)' }}>{gap > 0 ? '+' : ''}{gap}</div>
          <div className="dv2-quad-num-l">Gap</div>
        </div>
      </div>
    </div>
  );
}
