interface PremiumLockProps {
  children: React.ReactNode;
  locked?: boolean;
  label?: string;
  description?: string;
}

export function PremiumLock({ children, locked = false, label = 'Unlock Cross-Level Intelligence', description }: PremiumLockProps) {
  if (!locked) return <>{children}</>;

  return (
    <div style={{ position: 'relative' }}>
      {children}
      <div className="dv2-lock-overlay">
        <div className="dv2-lock-inner">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--tm)" strokeWidth="2" style={{ marginBottom: 11 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div className="dv2-lock-title">{label}</div>
          {description && <div className="dv2-lock-desc">{description}</div>}
          <div className="dv2-lock-levels">
            <div className="dv2-lock-level"><div className="dv2-lock-dot" style={{ background: 'var(--t)' }} /><span className="dv2-lock-lbl">Leadership</span></div>
            <div className="dv2-lock-level"><div className="dv2-lock-dot" style={{ background: 'var(--b)' }} /><span className="dv2-lock-lbl">Management</span></div>
            <div className="dv2-lock-level"><div className="dv2-lock-dot" style={{ background: 'var(--p)' }} /><span className="dv2-lock-lbl">Frontline</span></div>
          </div>
          <button className="dv2-lock-btn">Invite Team Members →</button>
        </div>
      </div>
    </div>
  );
}
