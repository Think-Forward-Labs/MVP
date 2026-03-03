import { useState } from 'react';
import type { MetricInsight, MetricScoreDetail } from '../types';
import { METRIC_COLORS, scoreColor, scoreLabel, getMetricDisplayName } from '../utils';

interface MetricDetailViewProps {
  metricCode: string;
  highlightType: 'observation' | 'recommendation';
  highlightIndex: number;
  metricInsights: MetricInsight[];
  sortedMetrics: MetricScoreDetail[];
  onBack: () => void;
}

export function MetricDetailView({
  metricCode,
  highlightType,
  highlightIndex,
  metricInsights,
  onBack,
}: MetricDetailViewProps) {
  const insight = metricInsights.find(m => m.metric_code === metricCode);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  if (!insight) {
    return (
      <div className="cd-page" style={{ zIndex: 101 }}>
        <div className="cd-topbar">
          <div className="cd-topbar-inner">
            <button className="cd-back-btn" onClick={onBack}>← Back to Map</button>
          </div>
        </div>
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--t3)' }}>No data for {metricCode}</div>
      </div>
    );
  }

  const colors = METRIC_COLORS[metricCode] || { base: '#666', bg10: 'rgba(102,102,102,0.1)', bg06: 'rgba(102,102,102,0.06)' };
  const sc = scoreColor(insight.score);
  const sl = scoreLabel(insight.score);
  const displayName = getMetricDisplayName(metricCode, insight.metric_name);

  const highlightedText = highlightType === 'observation'
    ? insight.observations?.[highlightIndex]
    : insight.recommendations?.[highlightIndex];

  const otherObservations = insight.observations?.filter((_, i) => !(highlightType === 'observation' && i === highlightIndex)) || [];
  const otherRecommendations = insight.recommendations?.filter((_, i) => !(highlightType === 'recommendation' && i === highlightIndex)) || [];

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // Find supporting evidence for the highlighted finding
  const relevantEvidence = insight.evidence?.filter(e => e.supports === 'gap' || e.supports === 'strength') || [];

  return (
    <div className="cd-page" style={{ zIndex: 101 }}>
      <div className="cd-topbar">
        <div className="cd-topbar-inner">
          <button className="cd-back-btn" onClick={onBack}>← Back to Map</button>
          <div className="cd-topbar-right">
            <span className="cd-topbar-label">METRIC DETAIL</span>
            <span className="cd-topbar-idx" style={{ background: colors.bg10, color: colors.base }}>{metricCode}</span>
          </div>
        </div>
      </div>

      <div className="cd-scroll">
        <div className="md-content">
          {/* Metric Header */}
          <div className="md-header">
            <div className="md-header-badge" style={{ background: colors.bg10, color: colors.base }}>
              {metricCode}
            </div>
            <h1 className="md-header-name">{displayName}</h1>
            <div className="md-header-score-row">
              <span className="md-header-score" style={{ color: sc }}>{insight.score}</span>
              <span className="md-header-status" style={{ color: sc, background: `${sc}10` }}>{sl}</span>
              <span className="md-header-health" style={{ color: colors.base }}>{insight.health_status?.toUpperCase()}</span>
            </div>
            {insight.summary && (
              <p className="md-header-summary">{insight.summary}</p>
            )}
          </div>

          {/* Highlighted Finding */}
          {highlightedText && (
            <div className="md-highlight" style={{ borderLeftColor: colors.base }}>
              <div className="md-highlight-type" style={{ color: colors.base }}>
                {highlightType === 'observation' ? 'OBSERVATION' : 'RECOMMENDATION'}
              </div>
              <div className="md-highlight-text">{highlightedText}</div>

              {/* Evidence quotes */}
              {relevantEvidence.length > 0 && (
                <div className="md-evidence-grid">
                  <div className="md-evidence-label">SUPPORTING EVIDENCE</div>
                  {relevantEvidence.slice(0, 4).map((ev, i) => (
                    <div key={i} className="md-evidence-card">
                      <div className="md-evidence-quote">"{ev.quote}"</div>
                      <div className="md-evidence-meta">
                        <span className="md-evidence-role">{ev.role}</span>
                        <span className={`md-evidence-tag md-evidence-tag--${ev.supports}`}>
                          {ev.supports}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Other Findings */}
          {(otherObservations.length > 0 || otherRecommendations.length > 0) && (
            <div className="md-other-findings">
              <button
                className="md-section-toggle"
                onClick={() => toggleSection('other')}
              >
                <span className="md-section-toggle-icon">{expandedSections.has('other') ? '−' : '+'}</span>
                <span>OTHER FINDINGS ({otherObservations.length + otherRecommendations.length})</span>
              </button>
              {expandedSections.has('other') && (
                <div className="md-findings-list">
                  {otherObservations.map((obs, i) => (
                    <div key={`obs-${i}`} className="md-finding-item">
                      <span className="md-finding-type md-finding-type--obs">OBS</span>
                      <span className="md-finding-text">{obs}</span>
                    </div>
                  ))}
                  {otherRecommendations.map((rec, i) => (
                    <div key={`rec-${i}`} className="md-finding-item">
                      <span className="md-finding-type md-finding-type--rec">REC</span>
                      <span className="md-finding-text">{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Reasoning */}
          {insight.ai_reasoning && (
            <div className="md-reasoning">
              <button
                className="md-section-toggle"
                onClick={() => toggleSection('reasoning')}
              >
                <span className="md-section-toggle-icon">{expandedSections.has('reasoning') ? '−' : '+'}</span>
                <span>AI REASONING</span>
              </button>
              {expandedSections.has('reasoning') && (
                <div className="md-reasoning-content">
                  <div className="md-reasoning-row">
                    <span className="md-reasoning-label">METHODOLOGY</span>
                    <span className="md-reasoning-value">{insight.ai_reasoning.methodology}</span>
                  </div>
                  <div className="md-reasoning-row">
                    <span className="md-reasoning-label">DATA POINTS</span>
                    <span className="md-reasoning-value">{insight.ai_reasoning.data_points_analyzed}</span>
                  </div>
                  {insight.ai_reasoning.confidence_factors?.length > 0 && (
                    <div className="md-reasoning-row">
                      <span className="md-reasoning-label">CONFIDENCE</span>
                      <div className="md-reasoning-list">
                        {insight.ai_reasoning.confidence_factors.map((f, i) => (
                          <span key={i} className="md-reasoning-chip">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {insight.ai_reasoning.key_signals?.length > 0 && (
                    <div className="md-reasoning-row">
                      <span className="md-reasoning-label">KEY SIGNALS</span>
                      <div className="md-reasoning-list">
                        {insight.ai_reasoning.key_signals.map((s, i) => (
                          <span key={i} className="md-reasoning-chip">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {insight.ai_reasoning.limitations?.length > 0 && (
                    <div className="md-reasoning-row">
                      <span className="md-reasoning-label">LIMITATIONS</span>
                      <div className="md-reasoning-list">
                        {insight.ai_reasoning.limitations.map((l, i) => (
                          <span key={i} className="md-reasoning-chip md-reasoning-chip--warn">{l}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Benchmark Narrative */}
          {insight.benchmark_narrative && (
            <div className="md-benchmark">
              <button
                className="md-section-toggle"
                onClick={() => toggleSection('benchmark')}
              >
                <span className="md-section-toggle-icon">{expandedSections.has('benchmark') ? '−' : '+'}</span>
                <span>BENCHMARK CONTEXT</span>
              </button>
              {expandedSections.has('benchmark') && (
                <div className="md-benchmark-content">
                  <p className="md-benchmark-text">{insight.benchmark_narrative}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
