import type { CompanySize } from '../types';
import { calcRiskExposure, SPEND_BY_SIZE } from '../utils';

interface RiskExposureProps {
  m2Score: number;
  selectedSize: CompanySize;
  onSelectSize: (size: CompanySize) => void;
}

const SIZE_OPTIONS: CompanySize[] = ['micro', 'small', 'medium', 'large', 'other'];

export function RiskExposure({ m2Score, selectedSize, onSelectSize }: RiskExposureProps) {
  const risk = calcRiskExposure(m2Score, selectedSize);
  const spend = SPEND_BY_SIZE[selectedSize].spend;
  const riskPct = Math.round(risk.band.midpoint * 100);

  return (
    <div className="dv2-risk-panel dv2-fi">
      <div className="dv2-card-lbl">TRANSFORMATION RISK EXPOSURE</div>
      <div className="dv2-risk-num">{risk.formatted}</div>
      <div className="dv2-risk-sub">estimated annual change budget at risk</div>

      <div className="dv2-risk-calc">
        <div className="dv2-risk-box" style={{ background: 'var(--bg4)' }}>
          <div className="dv2-risk-box-n" style={{ color: 'var(--txt)' }}>£{(spend / 1000).toFixed(0)}k</div>
          <div className="dv2-risk-box-l">EST. SPEND</div>
        </div>
        <div className="dv2-risk-mult">×</div>
        <div className="dv2-risk-box" style={{ background: 'rgba(255,71,87,.1)' }}>
          <div className="dv2-risk-box-n" style={{ color: 'var(--r)' }}>{riskPct}%</div>
          <div className="dv2-risk-box-l">RISK MULT.</div>
        </div>
      </div>

      <div className="dv2-risk-note">{risk.band.sources}</div>

      <div className="dv2-risk-size-row">
        {SIZE_OPTIONS.map(size => (
          <button
            key={size}
            className={`dv2-risk-size-btn ${selectedSize === size ? 'dv2-risk-size-btn--active' : ''}`}
            onClick={() => onSelectSize(size)}
          >
            {SPEND_BY_SIZE[size].label}
          </button>
        ))}
      </div>
    </div>
  );
}
