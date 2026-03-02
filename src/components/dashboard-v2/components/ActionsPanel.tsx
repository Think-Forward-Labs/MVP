import { useState } from 'react';
import type { KeyActionType } from '../types';
import { priorityOrder } from '../utils';

interface ActionsPanelProps {
  actions: KeyActionType[];
}

const PRI_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: '#EF4444', bg: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.12)' },
  high: { color: '#F59E0B', bg: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.12)' },
  medium: { color: '#3B82F6', bg: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.12)' },
};

// Estimate day target from timeline string
function estimateDay(timeline: string): string {
  if (!timeline) return 'D90';
  const match = timeline.match(/(\d+)/);
  if (match) return `D${match[1]}`;
  if (/immediate|urgent|asap/i.test(timeline)) return 'D30';
  if (/quarter|90/i.test(timeline)) return 'D90';
  return 'D60';
}

// Timeline progress percentage
function timelineProgress(priority: string): number {
  switch (priority) {
    case 'critical': return 33;
    case 'high': return 50;
    default: return 67;
  }
}

export function ActionsPanel({ actions }: ActionsPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const sorted = [...actions].sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));

  if (!sorted.length) {
    return (
      <div className="dv2-actions-wrap dv2-fi">
        <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--tm)', letterSpacing: '0.8px', marginBottom: 13 }}>
          PRIORITY ACTIONS · 90-DAY ROADMAP
        </div>
        <div style={{ fontSize: '11px', color: 'var(--tm)', textAlign: 'center', padding: '16px 0' }}>
          No actions recommended
        </div>
      </div>
    );
  }

  return (
    <div className="dv2-actions-wrap dv2-fi">
      <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--tm)', letterSpacing: '0.8px', marginBottom: 13 }}>
        PRIORITY ACTIONS · 90-DAY ROADMAP
      </div>

      {sorted.map((action, i) => {
        const isOpen = expandedIndex === i;
        const pri = PRI_STYLES[action.priority] || PRI_STYLES.medium;
        const day = estimateDay(action.timeline);
        const progress = timelineProgress(action.priority);

        return (
          <div
            key={i}
            className="dv2-action-row"
            onClick={() => setExpandedIndex(isOpen ? null : i)}
          >
            {/* Col 1: Action info */}
            <div>
              <div className="dv2-act-head">
                <span className="dv2-act-pri" style={{ color: pri.color, background: pri.bg, border: pri.border }}>
                  {action.priority.toUpperCase()}
                </span>
                <span className="dv2-act-title">{action.title}</span>
              </div>
              {isOpen && action.description && (
                <div className="dv2-act-detail">{action.description}</div>
              )}
              {action.owner && <div className="dv2-act-owner">Owner: {action.owner}</div>}
            </div>

            {/* Col 2: Day target */}
            <div>
              <div className="dv2-act-day-num">{day}</div>
              <div className="dv2-act-day-lbl">TARGET</div>
            </div>

            {/* Col 3: Timeline bar */}
            <div>
              <div className="dv2-act-timeline-nums">
                <span className="dv2-act-tnum" style={{ color: pri.color, fontWeight: 700 }}>Now</span>
                <span className="dv2-act-tnum" style={{ color: progress >= 33 ? pri.color : 'var(--tm)', fontWeight: progress >= 33 ? 700 : 400 }}>30</span>
                <span className="dv2-act-tnum" style={{ color: progress >= 50 ? pri.color : 'var(--tm)', fontWeight: progress >= 50 ? 700 : 400 }}>60</span>
                <span className="dv2-act-tnum" style={{ color: progress >= 67 ? pri.color : 'var(--tm)', fontWeight: progress >= 67 ? 700 : 400 }}>90</span>
              </div>
              <div className="dv2-act-tbar-track">
                <div className="dv2-act-tbar-fill" style={{ width: `${progress}%`, background: pri.color }} />
              </div>
              <div className="dv2-act-tbar-lbl">DELIVERY HORIZON</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
