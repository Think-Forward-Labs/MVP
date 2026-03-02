import { useState, useMemo } from 'react';
import type { MetricInsight } from '../types';

interface VRINCardProps {
  metricInsights: MetricInsight[];
}

interface VRINAsset {
  asset_name: string;
  valuable: boolean;
  rare: boolean;
  inimitable: string; // "yes" | "partial" | "no"
  non_substitutable: boolean;
  verdict: string;    // "DEFENSIBLE" | "POTENTIAL" | "PARITY" | "COMMODITY"
  reasoning: string;
  trajectory: string; // "appreciating" | "stable" | "depreciating"
}

const VERDICT_COLORS: Record<string, string> = {
  DEFENSIBLE: 'var(--g)',
  'DEFENSIBLE ADVANTAGE': 'var(--g)',
  POTENTIAL: 'var(--b)',
  'POTENTIAL ADVANTAGE': 'var(--b)',
  PARITY: 'var(--a)',
  'COMPETITIVE PARITY': 'var(--a)',
  COMMODITY: 'var(--r)',
  'COMMODITY RISK': 'var(--r)',
};

const TREND_DISPLAY: Record<string, { arrow: string; color: string }> = {
  appreciating: { arrow: '↑', color: 'var(--g)' },
  stable: { arrow: '→', color: 'var(--tm)' },
  depreciating: { arrow: '↓', color: 'var(--r)' },
};

function CheckIcon() {
  return (
    <svg className="dv2-vrin-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg className="dv2-vrin-cross" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--r)" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PartialIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--a)" strokeWidth="2.5" style={{ opacity: 0.85 }}>
      <path d="M4 12 C8 8, 16 16, 20 12" />
    </svg>
  );
}

export function VRINCard({ metricInsights }: VRINCardProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const { assets, summary } = useMemo(() => {
    const m13 = metricInsights.find(m => m.metric_code === 'M13');
    if (!m13?.context_data) return { assets: [], summary: '' };

    const vrinAssets = m13.context_data.vrin_assets as VRINAsset[] | undefined;
    const vrinSummary = (m13.context_data.vrin_summary as string) || '';

    return {
      assets: vrinAssets || [],
      summary: vrinSummary,
    };
  }, [metricInsights]);

  if (assets.length === 0) return null;

  return (
    <div className="dv2-vrin-wrap dv2-fi">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--tm)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
            Strategic Asset Assessment
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', letterSpacing: '0.08em' }}>
            VRIN FRAMEWORK · M13
          </div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--tm)', letterSpacing: '0.06em' }}>
          {assets.length} ASSET{assets.length !== 1 ? 'S' : ''} EVALUATED
        </div>
      </div>

      {summary && (
        <div style={{ fontSize: '12px', color: 'var(--td)', lineHeight: 1.6, marginBottom: 14 }}>
          {summary}
        </div>
      )}

      {/* Table header */}
      <div className="dv2-vrin-table">
        <div className="dv2-vrin-row dv2-vrin-row--header">
          <div className="dv2-vrin-cell dv2-vrin-cell--asset">Asset</div>
          <div className="dv2-vrin-cell dv2-vrin-cell--indicator">V</div>
          <div className="dv2-vrin-cell dv2-vrin-cell--indicator">R</div>
          <div className="dv2-vrin-cell dv2-vrin-cell--indicator">I</div>
          <div className="dv2-vrin-cell dv2-vrin-cell--indicator">N</div>
          <div className="dv2-vrin-cell dv2-vrin-cell--verdict">Verdict</div>
          <div className="dv2-vrin-cell dv2-vrin-cell--trend">Trend</div>
        </div>

        {assets.map((asset, i) => {
          const isOpen = expandedRow === i;
          const verdictColor = VERDICT_COLORS[asset.verdict?.toUpperCase()] || 'var(--tm)';
          const trend = TREND_DISPLAY[asset.trajectory] || TREND_DISPLAY.stable;

          return (
            <div key={i}>
              <div
                className={`dv2-vrin-row ${isOpen ? 'dv2-vrin-row--open' : ''}`}
                onClick={() => setExpandedRow(isOpen ? null : i)}
                style={{ cursor: 'pointer' }}
              >
                <div className="dv2-vrin-cell dv2-vrin-cell--asset">
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txt)' }}>{asset.asset_name}</span>
                </div>
                <div className="dv2-vrin-cell dv2-vrin-cell--indicator">{asset.valuable ? <CheckIcon /> : <CrossIcon />}</div>
                <div className="dv2-vrin-cell dv2-vrin-cell--indicator">{asset.rare ? <CheckIcon /> : <CrossIcon />}</div>
                <div className="dv2-vrin-cell dv2-vrin-cell--indicator">
                  {asset.inimitable === 'yes' ? <CheckIcon /> : asset.inimitable === 'partial' ? <PartialIcon /> : <CrossIcon />}
                </div>
                <div className="dv2-vrin-cell dv2-vrin-cell--indicator">{asset.non_substitutable ? <CheckIcon /> : <CrossIcon />}</div>
                <div className="dv2-vrin-cell dv2-vrin-cell--verdict">
                  <span className="dv2-vrin-verdict" style={{ color: verdictColor, borderColor: verdictColor }}>
                    {asset.verdict?.toUpperCase()}
                  </span>
                </div>
                <div className="dv2-vrin-cell dv2-vrin-cell--trend">
                  <span className="dv2-vrin-trend" style={{ color: trend.color }}>{trend.arrow}</span>
                </div>
              </div>

              {isOpen && asset.reasoning && (
                <div className="dv2-vrin-reasoning">
                  <div className="dv2-vrin-reasoning-inner">
                    <div className="dv2-vrin-reasoning-header">
                      <span className="dv2-vrin-reasoning-asset">{asset.asset_name}</span>
                      <span className="dv2-vrin-verdict" style={{ color: verdictColor, borderColor: verdictColor }}>
                        {asset.verdict?.toUpperCase()}
                      </span>
                    </div>
                    <div className="dv2-vrin-reasoning-body">
                      {asset.reasoning}
                    </div>
                    <div className="dv2-vrin-reasoning-footer">
                      <div className="dv2-vrin-reasoning-tags">
                        {asset.valuable && <span className="dv2-vrin-rtag dv2-vrin-rtag--on">Valuable</span>}
                        {!asset.valuable && <span className="dv2-vrin-rtag dv2-vrin-rtag--off">Not Valuable</span>}
                        {asset.rare && <span className="dv2-vrin-rtag dv2-vrin-rtag--on">Rare</span>}
                        {!asset.rare && <span className="dv2-vrin-rtag dv2-vrin-rtag--off">Not Rare</span>}
                        {asset.inimitable === 'yes' && <span className="dv2-vrin-rtag dv2-vrin-rtag--on">Inimitable</span>}
                        {asset.inimitable === 'partial' && <span className="dv2-vrin-rtag dv2-vrin-rtag--partial">Partially Inimitable</span>}
                        {asset.inimitable === 'no' && <span className="dv2-vrin-rtag dv2-vrin-rtag--off">Not Inimitable</span>}
                        {asset.non_substitutable && <span className="dv2-vrin-rtag dv2-vrin-rtag--on">Non-Substitutable</span>}
                        {!asset.non_substitutable && <span className="dv2-vrin-rtag dv2-vrin-rtag--off">Substitutable</span>}
                      </div>
                      <div className="dv2-vrin-reasoning-trend" style={{ color: trend.color }}>
                        <span>{trend.arrow}</span>
                        <span style={{ fontSize: '10px', textTransform: 'capitalize' }}>{asset.trajectory}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
