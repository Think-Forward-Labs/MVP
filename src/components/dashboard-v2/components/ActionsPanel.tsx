import { useState } from 'react';
import type { KeyActionType } from '../types';
import { priorityOrder, getMetricDisplayName } from '../utils';

interface ActionsPanelProps {
  actions: KeyActionType[];
}

const PRI_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  critical: { bar: 'var(--r)', bg: 'rgba(239,68,68,.08)', text: 'var(--r)' },
  high: { bar: 'var(--a)', bg: 'rgba(245,158,11,.08)', text: 'var(--a)' },
  medium: { bar: 'var(--b)', bg: 'rgba(59,130,246,.08)', text: 'var(--b)' },
  low: { bar: 'var(--g)', bg: 'rgba(34,197,94,.08)', text: 'var(--g)' },
};

const PRI_RAW: Record<string, { bar: string; barAlpha: string }> = {
  critical: { bar: '#EF4444', barAlpha: 'rgba(239,68,68,' },
  high: { bar: '#F59E0B', barAlpha: 'rgba(245,158,11,' },
  medium: { bar: '#3B82F6', barAlpha: 'rgba(59,130,246,' },
  low: { bar: '#22C55E', barAlpha: 'rgba(34,197,94,' },
};

function parseDays(timeline: string): number {
  const t = (timeline || '').toLowerCase().replace(/\s+/g, '');
  const num = parseInt(t.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(num) && num > 0) return Math.min(num, 120);
  if (t.includes('immediate') || t.includes('week')) return 14;
  return 90;
}

const MAX_DAYS = 90;
const MILESTONES = [0, 30, 60, 90];

export function ActionsPanel({ actions }: ActionsPanelProps) {
  const [drawerIndex, setDrawerIndex] = useState<number | null>(null);

  const sorted = [...actions].sort((a, b) => {
    const pw = priorityOrder(a.priority) - priorityOrder(b.priority);
    if (pw !== 0) return pw;
    return parseDays(a.timeline) - parseDays(b.timeline);
  });

  if (!sorted.length) {
    return (
      <div className="dv2-actions-wrap dv2-fi">
        <div className="dv2-act-section-lbl">PRIORITY ACTIONS · 90-DAY ROADMAP</div>
        <div style={{ fontSize: '13px', color: 'var(--tm)', textAlign: 'center', padding: '20px 0' }}>
          No actions recommended
        </div>
      </div>
    );
  }

  const drawerAction = drawerIndex !== null ? sorted[drawerIndex] : null;
  const drawerPri = drawerAction ? (PRI_COLORS[drawerAction.priority] || PRI_COLORS.medium) : null;

  return (
    <>
      <div className="dv2-actions-wrap dv2-fi">
        {/* Header */}
        <div className="dv2-act-header">
          <div>
            <div className="dv2-act-section-lbl">PRIORITY ACTIONS · 90-DAY ROADMAP</div>
            <div style={{ fontSize: '13px', color: 'var(--td)', marginTop: 3 }}>
              Prioritised action plan — all actions begin immediately with different delivery horizons
            </div>
          </div>
          <div className="dv2-act-legend">
            {['critical', 'high', 'medium'].map(p => (
              <div key={p} className="dv2-act-legend-item">
                <div className="dv2-act-legend-dot" style={{ background: PRI_COLORS[p].bar }} />
                <span style={{ textTransform: 'capitalize' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline header */}
        <div className="dv2-gantt-header">
          <div className="dv2-gantt-action-col">Action</div>
          <div className="dv2-gantt-bar-col">
            <div style={{ position: 'relative', height: 16 }}>
              {MILESTONES.map(day => {
                const pos: React.CSSProperties = day === 0
                  ? { left: '0%', transform: 'none' }
                  : day === MAX_DAYS
                    ? { left: '100%', transform: 'translateX(-100%)' }
                    : { left: `${(day / MAX_DAYS) * 100}%`, transform: 'translateX(-50%)' };
                return (
                  <span key={day} className="dv2-gantt-milestone" style={pos}>
                    {day === 0 ? 'Now' : `Day ${day}`}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action rows */}
        {sorted.map((action, idx) => {
          const days = parseDays(action.timeline);
          const barWidth = Math.max((days / MAX_DAYS) * 100, 10);
          const pri = PRI_RAW[action.priority] || PRI_RAW.medium;
          const priStyle = PRI_COLORS[action.priority] || PRI_COLORS.medium;
          const isLast = idx === sorted.length - 1;

          return (
            <div
              key={idx}
              className="dv2-gantt-row"
              style={{ borderBottom: isLast ? 'none' : undefined }}
              onClick={() => setDrawerIndex(idx)}
            >
              {/* Left: action info */}
              <div className="dv2-gantt-action-col dv2-gantt-action-info">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: priStyle.bar, marginTop: 5, flexShrink: 0,
                  }} />
                  <span className="dv2-gantt-action-title">{action.title}</span>
                </div>
                <div className="dv2-gantt-action-meta">
                  <span className="dv2-gantt-pri-badge" style={{ color: priStyle.text, background: priStyle.bg }}>
                    {action.priority.toUpperCase()}
                  </span>
                  {action.owner && <span className="dv2-gantt-owner">{action.owner}</span>}
                  <span className="dv2-gantt-view-link">
                    View details
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Right: Gantt bar */}
              <div className="dv2-gantt-bar-col" style={{ padding: '14px 24px 14px 0' }}>
                <div style={{ position: 'relative', height: 28, overflow: 'visible' }}>
                  {/* Gridlines */}
                  {MILESTONES.map(day => (
                    <div
                      key={`gl-${day}`}
                      className="dv2-gantt-gridline"
                      style={{
                        left: `${(day / MAX_DAYS) * 100}%`,
                        opacity: day === 0 ? 0.3 : 0.12,
                      }}
                    />
                  ))}
                  {/* Bar */}
                  <div
                    className="dv2-gantt-bar"
                    style={{
                      width: `${barWidth}%`,
                      background: `linear-gradient(90deg, ${pri.barAlpha}0.08) 0%, ${pri.barAlpha}0.18) 100%)`,
                      border: `1px solid ${pri.barAlpha}0.22)`,
                      borderRadius: days > MAX_DAYS ? '2px 0 0 2px' : '2px',
                      borderRight: days > MAX_DAYS ? 'none' : undefined,
                    }}
                  >
                    <span style={{ color: pri.bar, fontSize: '11px', fontWeight: 700, fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
                      {days}d{days > MAX_DAYS ? '+' : ''}
                    </span>
                    {action.impact === 'high' && barWidth > 35 && (
                      <span style={{ color: pri.bar, fontSize: '10px', opacity: 0.5, whiteSpace: 'nowrap' }}>High impact</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div className="dv2-gantt-footer">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--tm)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>
            All actions begin immediately. Bars show expected delivery horizon.
            Click any action for full details, evidence, and related metrics.
          </span>
        </div>
      </div>

      {/* ── Side Drawer ── */}
      {drawerAction && drawerPri && (
        <>
          <div className="dv2-drawer-backdrop" onClick={() => setDrawerIndex(null)} />
          <div className="dv2-drawer">
            {/* Drawer header */}
            <div className="dv2-drawer-header">
              <span className="dv2-drawer-pri-badge" style={{ color: drawerPri.text, background: drawerPri.bg }}>
                {drawerAction.priority.charAt(0).toUpperCase() + drawerAction.priority.slice(1)} Priority
              </span>
              <button className="dv2-drawer-close" onClick={() => setDrawerIndex(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer content */}
            <div className="dv2-drawer-body">
              <h3 className="dv2-drawer-title">{drawerAction.title}</h3>

              {drawerAction.description && (
                <div className="dv2-drawer-section">
                  <div className="dv2-drawer-label">Strategic Rationale</div>
                  <p className="dv2-drawer-text">{drawerAction.description}</p>
                </div>
              )}

              {/* Details grid */}
              <div className="dv2-drawer-grid">
                {drawerAction.owner && (
                  <div>
                    <div className="dv2-drawer-label">Owner</div>
                    <div className="dv2-drawer-val">{drawerAction.owner}</div>
                  </div>
                )}
                {drawerAction.timeline && (
                  <div>
                    <div className="dv2-drawer-label">Timeline</div>
                    <div className="dv2-drawer-val">{drawerAction.timeline}</div>
                  </div>
                )}
                <div>
                  <div className="dv2-drawer-label">Impact</div>
                  <div className="dv2-drawer-val" style={{ textTransform: 'capitalize' }}>{drawerAction.impact}</div>
                </div>
                <div>
                  <div className="dv2-drawer-label">Effort</div>
                  <div className="dv2-drawer-val" style={{ textTransform: 'capitalize' }}>{drawerAction.effort}</div>
                </div>
              </div>

              {/* Evidence */}
              {drawerAction.evidence && drawerAction.evidence.length > 0 && (
                <div className="dv2-drawer-section">
                  <div className="dv2-drawer-label">Supporting Evidence</div>
                  {drawerAction.evidence.map((ev, i) => (
                    <div key={i} className="dv2-drawer-evidence" style={{ borderLeftColor: `${drawerPri.bar}` }}>
                      <p className="dv2-drawer-quote">"{ev.quote}"</p>
                      <span className="dv2-drawer-role">— {ev.role}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Related issues */}
              {drawerAction.related_issues && drawerAction.related_issues.length > 0 && (
                <div className="dv2-drawer-section">
                  <div className="dv2-drawer-label">Addresses</div>
                  <div className="dv2-drawer-tags">
                    {drawerAction.related_issues.map((issue, i) => (
                      <span key={i} className="dv2-drawer-tag dv2-drawer-tag--issue">{issue}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related metrics */}
              {drawerAction.metrics && drawerAction.metrics.length > 0 && (
                <div className="dv2-drawer-section">
                  <div className="dv2-drawer-label">Related Metrics</div>
                  <div className="dv2-drawer-tags">
                    {drawerAction.metrics.map((m, i) => (
                      <span key={i} className="dv2-drawer-tag dv2-drawer-tag--metric">{getMetricDisplayName(m)}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div className="dv2-drawer-footer">
              <button className="dv2-drawer-btn dv2-drawer-btn--primary">Mark as Started</button>
              <button className="dv2-drawer-btn dv2-drawer-btn--secondary" onClick={() => setDrawerIndex(null)}>Dismiss</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
