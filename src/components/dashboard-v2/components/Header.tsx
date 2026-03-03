import type { EvaluationRunDetail, DashboardTheme } from '../types';
import { formatDate } from '../utils';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  run: EvaluationRunDetail;
  businessName?: string;
  quadrantName: string;
  quadrantColor: string;
  theme: DashboardTheme;
  onToggleTheme: () => void;
  onBack: () => void;
  sourceCount: number;
}

export function Header({ run, quadrantName, quadrantColor, theme, onToggleTheme, onBack, sourceCount }: HeaderProps) {
  return (
    <>
      <div className="dv2-hdr dv2-fi">
        <div className="dv2-hdr-scan" />
        <div className="dv2-hdr-logo">
          <button className="dv2-back-btn" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            BACK
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
          <div className="dv2-logo-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
            </svg>
          </div>
          <div>
            <div className="dv2-hdr-brand">
              CABAS<sup style={{ fontSize: '8px', color: 'var(--accent)', verticalAlign: 'super' }}>®</sup>
            </div>
            <div className="dv2-hdr-sub">INTELLIGENCE REPORT</div>
          </div>
        </div>
        <div className="dv2-hdr-meta">
          <div className="dv2-meta-item">
            <div className="dv2-meta-k">DATE</div>
            <div className="dv2-meta-v">{formatDate(run.started_at || run.created_at)}</div>
          </div>
          <div className="dv2-status-badge" style={{
            background: `${quadrantColor}12`,
            border: `1px solid ${quadrantColor}30`,
          }}>
            <div className="dv2-pulse-dot" style={{ background: quadrantColor, width: 5, height: 5 }} />
            <span className="dv2-status-txt" style={{ color: quadrantColor }}>{quadrantName.toUpperCase()}</span>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      {/* Single-respondent banner */}
      {sourceCount <= 1 && (
        <div className="dv2-banner dv2-fi">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="dv2-banner-txt">
              <strong>Single-respondent evaluation.</strong> Results are directional. Cross-level triangulation requires 3+ respondents.
            </span>
          </div>
          <button className="dv2-inv-btn">Invite Team →</button>
        </div>
      )}
    </>
  );
}
