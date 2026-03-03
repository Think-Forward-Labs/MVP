import type { LevelComparison } from '../types';

interface CEOMirrorTabProps {
  levelComparison: LevelComparison | undefined;
}

export function CEOMirrorTab({ levelComparison }: CEOMirrorTabProps) {
  const hasData = levelComparison && levelComparison.implementation_gaps?.length > 0;

  return (
    <div className="dv2-content">
      {/* Top bar */}
      <div className="dv2-ceo-topbar dv2-fi">
        <div className="dv2-ceo-notice">
          <div className="dv2-ceo-notice-title">
            ⚠ Narrative Mirror — {hasData ? 'Cross-Level Analysis' : 'Single-Respondent Mode (Argyris Two-Column)'}
          </div>
          <div className="dv2-ceo-notice-body">
            {hasData
              ? `Comparing scores across ${levelComparison.levels_present?.join(', ')} levels from ${levelComparison.source_count} respondents.`
              : 'Comparing self-ratings against narrative descriptions from the same respondent. The full three-level Cross-Mirror requires 3+ respondents across 2+ levels.'
            }
          </div>
        </div>
        {!hasData && (
          <button className="dv2-lock-btn" style={{ flexShrink: 0 }}>Unlock 3-Level Mirror</button>
        )}
      </div>

      {/* Table data if available */}
      {hasData && (
        <div className="dv2-mirror-table dv2-fi">
          <div className="dv2-mirror-thead">
            <div className="dv2-mirror-th">
              <div className="dv2-mirror-th-lbl" style={{ color: 'var(--tm)' }}>Metric</div>
              <div className="dv2-mirror-th-sub">Dimension assessed</div>
            </div>
            <div className="dv2-mirror-th">
              <div className="dv2-mirror-th-lbl" style={{ color: 'var(--t)' }}>Senior View</div>
              <div className="dv2-mirror-th-sub">Leadership scores</div>
            </div>
            <div className="dv2-mirror-th">
              <div className="dv2-mirror-th-lbl" style={{ color: 'var(--p)' }}>Frontline View</div>
              <div className="dv2-mirror-th-sub">Operational scores</div>
            </div>
          </div>
          {levelComparison.implementation_gaps
            .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
            .map((gap, i) => (
              <div key={i} className="dv2-mirror-row">
                <div className="dv2-m-cell">
                  <div className="dv2-m-cell-dim">
                    <div className="dv2-m-cell-bar" />
                    <div className="dv2-m-cell-dim-txt">{gap.metric_name || gap.metric_code}</div>
                  </div>
                </div>
                <div className="dv2-m-cell" style={{ color: 'var(--td)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <div style={{ flex: 1, height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${gap.senior_score}%`, background: 'var(--t)', borderRadius: 2, opacity: 0.7 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 700, color: 'var(--t)' }}>
                      {Math.round(gap.senior_score)}
                    </span>
                  </div>
                </div>
                <div className="dv2-m-cell" style={{ color: 'var(--td)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <div style={{ flex: 1, height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${gap.frontline_score}%`, background: 'var(--p)', borderRadius: 2, opacity: 0.7 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 700, color: 'var(--p)' }}>
                      {Math.round(gap.frontline_score)}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--a)', fontWeight: 700 }}>
                    GAP: {gap.gap > 0 ? '+' : ''}{Math.round(gap.gap)} ({gap.direction})
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Narrative */}
      {hasData && levelComparison.narrative && (
        <div className="dv2-argyris-note dv2-fi" style={{ marginBottom: 13 }}>
          <div className="dv2-argyris-lbl">CROSS-LEVEL ANALYSIS</div>
          <div className="dv2-argyris-txt">{levelComparison.narrative}</div>
        </div>
      )}

      {/* Upgrade CTA */}
      <div className="dv2-upgrade-cta dv2-fi">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 9 }}>
          <div className="dv2-pulse-dot dv2-pulse-dot--teal" />
          <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--t)', letterSpacing: '0.8px' }}>
            CROSS-LEVEL INTELLIGENCE {hasData ? 'ACTIVE' : 'AVAILABLE'}
          </span>
        </div>
        <div className="dv2-upgrade-title">
          {hasData
            ? 'Cross-level analysis reveals where leadership and frontline diverge.'
            : 'The gaps above are directional. The real finding is the gap between levels.'
          }
        </div>
        <div className="dv2-upgrade-desc">
          Leadership describes an open-door culture. Frontline describes learning what not to say.
          Management sits somewhere in between. The distance between those three accounts — measured independently,
          without coordination — is where transformation either succeeds or fails.
        </div>
        <div className="dv2-upgrade-steps">
          <div className="dv2-upgrade-step"><div className="dv2-upgrade-step-dot" style={{ background: 'var(--b)' }} /><span className="dv2-upgrade-step-txt">① Invite Management respondent</span></div>
          <div className="dv2-upgrade-step"><div className="dv2-upgrade-step-dot" style={{ background: 'var(--p)' }} /><span className="dv2-upgrade-step-txt">② Invite Frontline respondent</span></div>
          <div className="dv2-upgrade-step"><div className="dv2-upgrade-step-dot" style={{ background: 'var(--t)' }} /><span className="dv2-upgrade-step-txt">③ Mirror unlocks automatically</span></div>
        </div>
        {!hasData && <button className="dv2-lock-btn">Send Assessment Links Now</button>}
      </div>
    </div>
  );
}
