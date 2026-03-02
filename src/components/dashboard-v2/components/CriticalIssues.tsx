import { useState } from 'react';
import type { CriticalIssueType } from '../types';

interface CriticalIssuesProps {
  issues: CriticalIssueType[];
}

export function CriticalIssues({ issues }: CriticalIssuesProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!issues.length) {
    return (
      <div className="dv2-issues-panel dv2-fi">
        <div className="dv2-card-lbl">CRITICAL ISSUES</div>
        <div style={{ fontSize: '11px', color: 'var(--tm)', textAlign: 'center', padding: '16px 0' }}>
          No critical issues identified
        </div>
      </div>
    );
  }

  return (
    <div className="dv2-issues-panel dv2-fi">
      <div className="dv2-card-lbl">CRITICAL ISSUES</div>
      {issues.map((issue, i) => {
        const isOpen = expandedIndex === i;
        return (
          <div
            key={i}
            className={`dv2-issue-card ${isOpen ? 'dv2-issue-card--open' : ''}`}
            onClick={() => setExpandedIndex(isOpen ? null : i)}
          >
            <div className="dv2-issue-top">
              <div className="dv2-issue-title">{issue.title}</div>
              {issue.avg_score !== undefined && (
                <span className="dv2-issue-score">{Math.round(issue.avg_score)}</span>
              )}
            </div>
            <div className="dv2-issue-tags">
              {issue.metrics?.map((m, j) => (
                <span key={j} className="dv2-issue-tag">{m}</span>
              ))}
            </div>

            {isOpen && (
              <div className="dv2-issue-detail">
                {issue.business_impact && (
                  <>
                    <div className="dv2-issue-detail-lbl" style={{ color: 'rgba(255,71,87,.5)' }}>BUSINESS IMPACT</div>
                    <div className="dv2-issue-impact">{issue.business_impact}</div>
                  </>
                )}
                {issue.description && (
                  <>
                    <div className="dv2-issue-detail-lbl" style={{ color: 'var(--tm)' }}>DESCRIPTION</div>
                    <div className="dv2-issue-action">{issue.description}</div>
                  </>
                )}
                {issue.root_causes?.length > 0 && (
                  <>
                    <div className="dv2-issue-detail-lbl" style={{ color: 'var(--tm)', marginTop: 7 }}>ROOT CAUSES</div>
                    {issue.root_causes.map((rc, j) => (
                      <div key={j} className="dv2-issue-action">• {rc}</div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
