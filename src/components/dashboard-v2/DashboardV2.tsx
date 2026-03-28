/**
 * Dashboard V2 — CABAS® Organisational Intelligence Platform
 * Matches Iva's HTML mockup: dark-first, data-dense, IBM Plex Mono + Outfit
 */

import { useState, useEffect } from 'react';
import { adminApi } from '../../services/adminApi';
import type {
  DashboardV2Props,
  DashboardTheme,
  EvaluationRunDetail,
  EvaluationScoresResponse,
  RefinedReport,
  CompanySize,
} from './types';
import {
  getAggregatedMetrics,
  sortMetricsByNumber,
  calcOperationalStrength,
  calcFutureReadiness,
  getQuadrant,
  getMetricScore,
  normalizeActions,
  normalizeIssues,
  normalizeStrengths,
  scoreColor,
  scoreLabel,
} from './utils';
import { Header } from './components/Header';
import { VitalSigns } from './components/VitalSigns';
import { QuadrantCard } from './components/QuadrantCard';
import { PathologyCard } from './components/PathologyCard';
import { OrgMirror } from './components/OrgMirror';
import { VRINCard } from './components/VRINCard';
import { RiskExposure } from './components/RiskExposure';
import { CriticalIssues } from './components/CriticalIssues';
import { MetricsGrid } from './components/MetricsGrid';
import { ActionsPanel } from './components/ActionsPanel';
import { CEOMirrorTab } from './components/CEOMirrorTab';
import { PremiumLock } from './components/PremiumLock';
import { ContradictionDetail } from './components/ContradictionDetail';
import { MetricTreemap } from './components/MetricTreemap';
import { MetricFullPage } from './components/MetricFullPage';
import { EuniceChatPanel } from '../chat/EuniceChatPanel';
import { SiriOrb } from '../interview/SiriOrb';
import './DashboardV2.css';

type TabId = 'eval' | 'ceo';

export function DashboardV2({ runId, businessName, onBack }: DashboardV2Props) {
  // Theme — reads from global app-theme (set by App.tsx), default light
  const [theme, setTheme] = useState<DashboardTheme>(() => {
    return (localStorage.getItem('app-theme') as DashboardTheme) || 'light';
  });

  // Sync with <html> data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('app-theme', next);
      return next;
    });
  };

  // Data
  const [run, setRun] = useState<EvaluationRunDetail | null>(null);
  const [scores, setScores] = useState<EvaluationScoresResponse | null>(null);
  const [refinedReport, setRefinedReport] = useState<RefinedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('eval');
  const [selectedCompanySize, setSelectedCompanySize] = useState<CompanySize>('medium');
  const [showGapStory, setShowGapStory] = useState(false);
  const [showMetricTreemap, setShowMetricTreemap] = useState(false);
  const [selectedMetricCode, setSelectedMetricCode] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Fetch all data
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [runData, scoresData] = await Promise.all([
          adminApi.getEvaluationRun(runId),
          adminApi.getEvaluationScores(runId),
        ]);
        if (cancelled) return;
        setRun(runData);
        setScores(scoresData);

        try {
          const reportData = await adminApi.getRefinedReport(runId);
          if (cancelled) return;
          if (reportData?.report) {
            setRefinedReport({
              metrics: reportData.report.metrics || [],
              executive_summary: reportData.report.executive_summary || '',
              key_actions: normalizeActions(reportData.report.key_actions || []),
              critical_issues: normalizeIssues(reportData.report.critical_issues || []),
              strengths: normalizeStrengths(reportData.report.strengths || []),
              pathologies: (reportData.report.pathologies || []).map(p => ({ ...p, is_core: p.is_core ?? true })),
              contradictions: reportData.report.contradictions || [],
              cross_metric_insights: reportData.report.cross_metric_insights || {},
              level_comparison: (reportData.report as Record<string, unknown>).level_comparison as RefinedReport['level_comparison'],
            });
          }
        } catch {
          // No refined report — fine
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [runId]);

  // Derived data
  const aggregatedMetrics = getAggregatedMetrics(scores?.metric_scores || []);
  const sortedMetrics = sortMetricsByNumber(aggregatedMetrics);
  const metricInsights = refinedReport?.metrics || [];
  const hasData = sortedMetrics.length > 0 || metricInsights.length > 0;

  const opStrength = hasData ? calcOperationalStrength(sortedMetrics, metricInsights) : 0;
  const futReady = hasData ? calcFutureReadiness(sortedMetrics, metricInsights) : 0;
  const overall = hasData ? Math.round((opStrength + futReady) / 2) : 0;
  const quadrant = getQuadrant(sortedMetrics, metricInsights);
  const m1Score = getMetricScore('M1', sortedMetrics, metricInsights);
  const m2Score = getMetricScore('M2', sortedMetrics, metricInsights);
  const gap = opStrength - futReady;
  const sourceCount = run?.sources?.length || 0;

  // Derive some extra sub-gauge scores for vitals
  const extraGauges = [
    { label: 'Cultural Health', score: hasData ? Math.round((getMetricScore('M10', sortedMetrics, metricInsights) + getMetricScore('M6', sortedMetrics, metricInsights)) / 2) : 0 },
    { label: 'Resource Capability', score: getMetricScore('M12', sortedMetrics, metricInsights) },
    { label: 'OODA Velocity', score: hasData ? Math.round((getMetricScore('M3', sortedMetrics, metricInsights) + getMetricScore('M4', sortedMetrics, metricInsights)) / 2) : 0 },
    { label: 'Resilience Index', score: hasData ? Math.round((getMetricScore('M13', sortedMetrics, metricInsights) + getMetricScore('M14', sortedMetrics, metricInsights)) / 2) : 0 },
  ];

  // Loading
  if (loading) {
    return (
      <div className="dashboard-v2" data-theme={theme}>
        <div className="dv2-loading">
          <div className="dv2-loading-dots">
            <div className="dv2-loading-dot" />
            <div className="dv2-loading-dot" />
            <div className="dv2-loading-dot" />
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--tm)', letterSpacing: '0.8px' }}>
            LOADING INTELLIGENCE DASHBOARD…
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error || !run) {
    return (
      <div className="dashboard-v2" data-theme={theme}>
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--r)', marginBottom: 12 }}>{error || 'Failed to load run data'}</div>
          <button className="dv2-back-btn" onClick={onBack}>← BACK TO RUNS</button>
        </div>
      </div>
    );
  }

  // Full gap analysis story view
  const contradictions = refinedReport?.contradictions || [];
  if (showGapStory && contradictions.length > 0) {
    return (
      <div className="dashboard-v2" data-theme={theme}>
        <ContradictionDetail
          contradictions={contradictions}
          metricInsights={metricInsights}
          sortedMetrics={sortedMetrics}
          onBack={() => setShowGapStory(false)}
        />
      </div>
    );
  }

  // Full metric detail page
  if (selectedMetricCode && metricInsights.length > 0) {
    return (
      <div className="dashboard-v2" data-theme={theme}>
        <MetricFullPage
          metricCode={selectedMetricCode}
          metricInsights={metricInsights}
          onBack={() => setSelectedMetricCode(null)}
        />
      </div>
    );
  }

  // Refresh refined report (after metric regeneration)
  const refreshReport = async () => {
    try {
      const reportData = await adminApi.getRefinedReport(runId);
      if (reportData?.report) {
        setRefinedReport({
          metrics: reportData.report.metrics || [],
          executive_summary: reportData.report.executive_summary || '',
          key_actions: normalizeActions(reportData.report.key_actions || []),
          critical_issues: normalizeIssues(reportData.report.critical_issues || []),
          strengths: normalizeStrengths(reportData.report.strengths || []),
          pathologies: (reportData.report.pathologies || []).map((p: { is_core?: boolean }) => ({ ...p, is_core: p.is_core ?? true })) as RefinedReport['pathologies'],
          contradictions: reportData.report.contradictions || [],
          cross_metric_insights: reportData.report.cross_metric_insights || {},
          level_comparison: (reportData.report as Record<string, unknown>).level_comparison as RefinedReport['level_comparison'],
        });
      }
    } catch { /* ignore */ }
  };

  // Full metric intelligence treemap view
  if (showMetricTreemap && metricInsights.length > 0) {
    return (
      <div className="dashboard-v2" data-theme={theme}>
        <MetricTreemap
          metricInsights={metricInsights}
          sortedMetrics={sortedMetrics}
          onBack={() => setShowMetricTreemap(false)}
          runId={runId}
          onMetricRegenerated={refreshReport}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-v2" data-theme={theme} style={{ position: 'relative' }}>
      {/* Header */}
      <Header
        run={run}
        businessName={businessName}
        quadrantName={quadrant.name}
        quadrantColor={quadrant.color}
        theme={theme}
        onToggleTheme={toggleTheme}
        onBack={onBack}
        sourceCount={sourceCount}
      />

      {/* Tabs */}
      <div className="dv2-tabs">
        <button className={`dv2-tab ${activeTab === 'eval' ? 'dv2-tab--active' : ''}`} onClick={() => setActiveTab('eval')}>
          Evaluation Report
        </button>
        <button className={`dv2-tab ${activeTab === 'ceo' ? 'dv2-tab--active' : ''}`} onClick={() => setActiveTab('ceo')}>
          CEO Mirror View
        </button>
      </div>

      {/* EVALUATION PANEL */}
      {activeTab === 'eval' && (
        <div className="dv2-content">
          {/* Vital Signs */}
          <VitalSigns
            overall={overall}
            operationalStrength={opStrength}
            futureReadiness={futReady}
            metricScores={extraGauges}
            onSelectMetric={setSelectedMetricCode}
          />

          {/* Executive Summary */}
          {refinedReport?.executive_summary && (
            <div className="dv2-exec-summary dv2-fi">
              <div className="dv2-exec-label">EXECUTIVE SUMMARY</div>
              <p className="dv2-exec-text">{refinedReport.executive_summary}</p>
            </div>
          )}

          {/* Main 3-column grid */}
          <div className="dv2-main-grid">
            {/* Column 1: Quadrant + Pathology */}
            <div className="dv2-col1">
              <QuadrantCard quadrant={quadrant} m1Score={m1Score} m2Score={m2Score} gap={gap} />
              <PathologyCard pathologies={refinedReport?.pathologies || []} />
            </div>

            {/* Column 2: Org Mirror — Perception Gap + Say-Do Gaps */}
            <OrgMirror
              contradictions={refinedReport?.contradictions || []}
              crossMetricInsights={refinedReport?.cross_metric_insights}
              metricInsights={metricInsights}
              sortedMetrics={sortedMetrics}
              sourceCount={sourceCount}
              onViewFullAnalysis={() => setShowGapStory(true)}
            />

            {/* Column 3: Risk + Issues */}
            <div className="dv2-col3">
              <RiskExposure m2Score={m2Score} selectedSize={selectedCompanySize} onSelectSize={setSelectedCompanySize} />
              {/* CriticalIssues hidden per Iva — kept in pipeline, not shown on UI */}
              {/* <CriticalIssues issues={refinedReport?.critical_issues || []} /> */}
            </div>
          </div>

          {/* 3-Level Preview (locked) */}
          {sourceCount <= 1 && (
            <PremiumLock
              locked={true}
              label="Unlock Cross-Level Intelligence"
              description="The three-column mirror reveals where leadership, management and frontline independently diverge — without coordination. This is where transformation fails."
            >
              <div className="dv2-preview-wrap" style={{ minHeight: 180 }}>
                <div className="dv2-preview-hdr">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--txt)' }}>
                        CEO Mirror View — Three-Level Triangulation
                      </span>
                      <span className="dv2-prem-badge">PREMIUM</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--tm)', marginTop: 3 }}>
                      How leadership, management and frontline independently describe the same organisation
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--tm)" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--tm)' }}>Requires 3+ respondents</span>
                  </div>
                </div>
              </div>
            </PremiumLock>
          )}

          {/* VRIN Strategic Asset Assessment */}
          <VRINCard metricInsights={metricInsights} />

          {/* 14 Metrics Grid */}
          <MetricsGrid sortedMetrics={sortedMetrics} metricInsights={metricInsights} onViewTreemap={() => setShowMetricTreemap(true)} onSelectMetric={setSelectedMetricCode} />

          {/* Actions */}
          <ActionsPanel actions={refinedReport?.key_actions || []} />
        </div>
      )}

      {/* CEO MIRROR PANEL */}
      {activeTab === 'ceo' && (
        <CEOMirrorTab levelComparison={refinedReport?.level_comparison} />
      )}

      {/* Footer */}
      <div className="dv2-footer">
        <div className="dv2-footer-l">ThinkForward CABAS® · CONFIDENTIAL</div>
        <div className="dv2-footer-r">
          <span className="dv2-footer-v">v2.1 · 14 metrics · {refinedReport?.pathologies?.length || 0} pathologies</span>
        </div>
      </div>

      {/* Ask Eunice — floating pill (bottom-right) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 18px 8px 8px',
            background: 'var(--bg-2)',
            border: '1px solid var(--border-h)',
            borderRadius: 24,
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-h)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.04)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          <SiriOrb size={28} isSpeaking={false} isListening={true} />
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--t2)',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            Ask Eunice
          </span>
        </button>
      )}

      {/* Eunice Chat — overlay panel */}
      {isChatOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsChatOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 60,
              background: 'rgba(6, 11, 24, 0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              animation: 'dv2FadeIn 0.2s ease-out',
            }}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '420px',
            zIndex: 70,
            animation: 'dv2SlideIn 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
            boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.4)',
          }}>
            <EuniceChatPanel
              isOpen={true}
              onClose={() => setIsChatOpen(false)}
              runId={runId}
              evaluationName={businessName}
              theme={theme}
            />
          </div>
        </>
      )}

      {/* Overlay animations */}
      <style>{`
        @keyframes dv2FadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dv2SlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
