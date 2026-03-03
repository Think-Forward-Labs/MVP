import { useEffect, useRef, useState, useCallback } from 'react';
import type { RefinedReport, MetricInsight, MetricScoreDetail } from '../types';
import { getMetricScore, getMetricDisplayName, scoreColor, scoreLabel } from '../utils';

interface ContradictionDetailProps {
  contradictions: RefinedReport['contradictions'];
  metricInsights: MetricInsight[];
  sortedMetrics: MetricScoreDetail[];
  onBack: () => void;
}

/** Scroll-triggered reveal using IntersectionObserver */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll('.cd-reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('cd-revealed');
          obs.unobserve(e.target);
        }
      }),
      { threshold: 0.12 }
    );
    items.forEach((i) => obs.observe(i));
    return () => obs.disconnect();
  }, []);
  return ref;
}

function enrichMetrics(
  codes: string[],
  metricInsights: MetricInsight[],
  sortedMetrics: MetricScoreDetail[],
) {
  return codes
    .map((code) => {
      const insight = metricInsights.find((m) => m.metric_code === code);
      const score = getMetricScore(code, sortedMetrics, metricInsights);
      if (!insight && score <= 0) return null;
      return {
        code, score,
        name: getMetricDisplayName(code, insight?.metric_name),
        summary: insight?.summary || '',
        health: insight?.health_status || 'at_risk',
      };
    })
    .filter(Boolean) as Array<{ code: string; score: number; name: string; summary: string; health: string }>;
}

export function ContradictionDetail({
  contradictions,
  metricInsights,
  sortedMetrics,
  onBack,
}: ContradictionDetailProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRef = useScrollReveal();

  const highCount = contradictions.filter(c => c.severity === 'high').length;
  const modCount = contradictions.length - highCount;

  // Collect all unique related metric codes
  const allMetricCodes = [...new Set(contradictions.flatMap(c => c.related_metrics || []))];
  const allMetrics = enrichMetrics(allMetricCodes, metricInsights, sortedMetrics);

  // Scroll progress
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pct = el.scrollHeight - el.clientHeight;
    setScrollProgress(pct > 0 ? Math.min((el.scrollTop / pct) * 100, 100) : 0);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="cd-page" ref={pageRef}>
      {/* ── Fixed nav ── */}
      <div className="cd-topbar">
        <div className="cd-topbar-inner">
          <button className="cd-back-btn" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            Back to Dashboard
          </button>
          <div className="cd-topbar-right">
            <span className="cd-topbar-label">CABAS® ORGANISATIONAL MIRROR</span>
            <span className="cd-topbar-idx">{contradictions.length} GAPS</span>
          </div>
        </div>
        <div className="cd-progress"><div className="cd-progress-fill" style={{ width: `${scrollProgress}%` }} /></div>
      </div>

      {/* ── Scrollable narrative ── */}
      <div className="cd-scroll" ref={scrollRef}>

        {/* ═══ HERO ═══ */}
        <section className="cd-section cd-section--primary">
          <div className="cd-inner">
            <div className="cd-reveal">
              <div className="cd-section-lbl">
                <span className="cd-dot cd-dot--accent" />Organisational Mirror — Full Analysis
              </div>
            </div>
            <div className="cd-reveal" style={{ transitionDelay: '0.1s' }}>
              <h1 className="cd-hero-callout">The gaps between what this organisation says — and what the data reveals.</h1>
            </div>
            <div className="cd-reveal" style={{ transitionDelay: '0.2s' }}>
              <p className="cd-hero-title">
                Every organisation tells itself a story. These {contradictions.length} say-do gaps show where that story diverges from reality — where stated intentions fail to match observed behaviour.
              </p>
            </div>
            <div className="cd-reveal" style={{ transitionDelay: '0.3s' }}>
              <div className="cd-hero-stats">
                <div className="cd-hero-stat">
                  <span className="cd-hero-stat-val">{contradictions.length}</span>
                  <span className="cd-hero-stat-lbl">Say-Do Gaps</span>
                </div>
                <div className="cd-hero-stat-sep" />
                <div className="cd-hero-stat">
                  <span className="cd-hero-stat-val" style={{ color: 'var(--r)' }}>{highCount}</span>
                  <span className="cd-hero-stat-lbl">High Severity</span>
                </div>
                <div className="cd-hero-stat-sep" />
                <div className="cd-hero-stat">
                  <span className="cd-hero-stat-val" style={{ color: 'var(--a)' }}>{modCount}</span>
                  <span className="cd-hero-stat-lbl">Moderate</span>
                </div>
                <div className="cd-hero-stat-sep" />
                <div className="cd-hero-stat">
                  <span className="cd-hero-stat-val">{allMetrics.length}</span>
                  <span className="cd-hero-stat-lbl">Metrics Affected</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ EACH GAP AS A STORY CHAPTER ═══ */}
        {contradictions.map((c, gapIdx) => {
          const isHigh = c.severity === 'high';
          const relatedMetrics = enrichMetrics(c.related_metrics || [], metricInsights, sortedMetrics);
          const isEven = gapIdx % 2 === 0;

          return (
            <section
              key={c.contradiction_id || gapIdx}
              className={`cd-section ${isEven ? 'cd-section--elevated' : 'cd-section--primary'}`}
            >
              <div className="cd-inner">
                {/* Chapter header */}
                <div className="cd-reveal">
                  <div className="cd-chapter-head">
                    <span className="cd-chapter-num">GAP {gapIdx + 1}</span>
                    <span className="cd-sev-badge" data-severity={c.severity}>{c.severity.toUpperCase()}</span>
                    <span className="cd-hero-codes">{c.primary_question_code} × {c.linked_question_code}</span>
                  </div>
                </div>

                <div className="cd-reveal" style={{ transitionDelay: '0.1s' }}>
                  <h2 className="cd-section-title">{c.client_title}</h2>
                </div>

                <div className="cd-reveal" style={{ transitionDelay: '0.15s' }}>
                  <p className="cd-chapter-callout">"{c.client_callout}"</p>
                </div>

                {/* The narrative */}
                <div className="cd-reveal" style={{ transitionDelay: '0.2s' }}>
                  <p className="cd-narrative">{c.client_description}</p>
                </div>

                {/* Evidence */}
                {c.evidence && c.evidence.length > 0 && (
                  <div className="cd-reveal" style={{ transitionDelay: '0.25s' }}>
                    <div className="cd-card-label" style={{ marginBottom: 10 }}>EVIDENCE · {c.evidence.length} DATA POINTS</div>
                    <div className="cd-ev-grid">
                      {c.evidence.map((ev, idx) => (
                        <div key={idx} className="cd-ev-card cd-reveal" style={{ transitionDelay: `${0.28 + 0.06 * idx}s` }}>
                          <div className="cd-ev-quote">"{ev.quote}"</div>
                          <div className="cd-ev-role">{ev.role}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gap comparison + metrics */}
                {relatedMetrics.length > 0 && (
                  <div className="cd-reveal" style={{ transitionDelay: '0.35s' }}>
                    <div className="cd-impact-panel">
                      <div className="cd-impact-header">
                        <div className="cd-impact-header-left">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                          <span className="cd-impact-title">Impact on Metrics</span>
                        </div>
                        <span className="cd-impact-count">{relatedMetrics.length} AFFECTED</span>
                      </div>
                      <div className="cd-impact-grid">
                        {relatedMetrics.map((m) => (
                          <div key={m.code} className="cd-impact-card">
                            <div className="cd-impact-card-top">
                              <span className="cd-impact-card-code">{m.code}</span>
                              <span className="cd-impact-card-label" style={{ color: scoreColor(m.score) }}>{scoreLabel(m.score)}</span>
                            </div>
                            <div className="cd-impact-card-score" style={{ color: scoreColor(m.score) }}>{m.score}</div>
                            <div className="cd-impact-card-name">{m.name}</div>
                            <div className="cd-impact-card-track">
                              <div className="cd-impact-card-fill" style={{ width: `${m.score}%`, background: scoreColor(m.score) }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Coaching question */}
                {c.coaching_question && (
                  <div className="cd-reveal" style={{ transitionDelay: '0.4s' }}>
                    <div className="cd-coaching-card">
                      <div className="cd-coaching-card-accent" />
                      <div className="cd-coaching-card-content">
                        <div className="cd-coaching-card-header">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <span className="cd-coaching-card-label">Coaching Question</span>
                        </div>
                        <p className="cd-coaching-card-text">{c.coaching_question}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {/* ═══ CONNECTED DIMENSIONS — All metrics overview ═══ */}
        {allMetrics.length > 0 && (
          <section className="cd-section cd-section--elevated">
            <div className="cd-inner">
              <div className="cd-reveal">
                <div className="cd-section-lbl">
                  <span className="cd-dot" />How these gaps ripple across the organisation
                </div>
                <h3 className="cd-section-title">Connected Dimensions</h3>
              </div>
              <div className="cd-dim-grid">
                {allMetrics.map((m, idx) => (
                  <div key={m.code} className="cd-dim-card cd-reveal" style={{ transitionDelay: `${0.08 * (idx + 1)}s` }}>
                    <div className="cd-dim-hd">
                      <span className="cd-dim-code">{m.code}</span>
                      <span className="cd-dim-score" style={{ color: scoreColor(m.score) }}>{m.score}</span>
                    </div>
                    <div className="cd-dim-name">{m.name}</div>
                    <div className="cd-dim-status" style={{ color: scoreColor(m.score) }}>{scoreLabel(m.score)}</div>
                    {m.summary && <div className="cd-dim-summary">{m.summary}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ CLOSING ═══ */}
        <section className="cd-section cd-section--primary cd-section--question">
          <div className="cd-inner cd-inner--narrow">
            <div className="cd-reveal">
              <p className="cd-coaching-q">These gaps are not failures — they are signals. The question is whether the organisation can hear them.</p>
            </div>
            <div className="cd-reveal" style={{ transitionDelay: '0.1s' }}>
              <p className="cd-coaching-sub">Based on the Argyris Mirror Principle: the disconnect between espoused theory and theory-in-use is where organisational learning begins.</p>
            </div>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <div className="cd-footer">
          <div />
          <button className="cd-footer-btn cd-footer-btn--back" onClick={onBack}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            BACK TO DASHBOARD
          </button>
          <div />
        </div>
      </div>
    </div>
  );
}
