import type { PathologyType } from '../types';

interface PathologySummaryProps {
  pathologies: PathologyType[];
  onViewDetails: () => void;
}

const severityColor: Record<string, string> = {
  critical: '#ef4444',
  moderate: '#f59e0b',
  informational: '#3b82f6',
};

export function PathologySummary({ pathologies, onViewDetails }: PathologySummaryProps) {
  if (!pathologies.length) {
    return (
      <div className="dv2-panel dv2-fi">
        <div className="dv2-panel-header">
          <span className="dv2-panel-label">DETECTED PATHOLOGIES</span>
        </div>
        <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--ts)', fontSize: 12 }}>
          No organisational pathologies detected.
        </div>
      </div>
    );
  }

  return (
    <div className="dv2-panel dv2-fi">
      <div className="dv2-panel-header">
        <span className="dv2-panel-label">DETECTED PATHOLOGIES</span>
        <span style={{ fontSize: 10, color: 'var(--ts)', fontFamily: 'var(--mono)' }}>
          {pathologies.length} found
        </span>
      </div>
      <div className="dv2-pathology-list">
        {pathologies.slice(0, 5).map((p, i) => (
          <div key={i} className="dv2-pathology-row">
            <div
              className="dv2-pathology-dot"
              style={{ background: severityColor[p.severity] || '#f59e0b' }}
            />
            <div className="dv2-pathology-info">
              <span className="dv2-pathology-title">{p.client_title}</span>
              <span className="dv2-pathology-severity">{p.severity}</span>
            </div>
          </div>
        ))}
        {pathologies.length > 5 && (
          <div style={{ fontSize: 10, color: 'var(--ts)', padding: '4px 0 0 18px' }}>
            +{pathologies.length - 5} more
          </div>
        )}
      </div>
      <button className="dv2-view-details-btn" onClick={onViewDetails}>
        View Full Details
      </button>
    </div>
  );
}
