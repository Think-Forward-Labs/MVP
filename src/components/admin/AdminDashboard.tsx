/**
 * Admin Dashboard Layout
 * Premium glass-morphism design with light theme
 */

import { useState } from 'react';
import type { Admin, AdminSection } from '../../types/admin';
import { AdminSidebar } from './AdminSidebar';
import { BusinessesSection } from './sections/BusinessesSection';
import { QuestionSetsSection } from './sections/QuestionSetsSection';
import { AdminsSection } from './sections/AdminsSection';
import { MetricsSection } from './sections/MetricsSection';
import { ReviewsSection } from './sections/ReviewsSection';
import { EvaluationsSection } from './sections/EvaluationsSection';

interface AdminDashboardProps {
  admin: Admin;
  onLogout: () => void;
}

export function AdminDashboard({ admin, onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('businesses');

  const [error, setError] = useState<string | null>(null);

  const handleError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'businesses':
        return <BusinessesSection />;
      case 'question-sets':
        return <QuestionSetsSection />;
      case 'metrics':
        return <MetricsSection onError={handleError} />;
      case 'reviews':
        return <ReviewsSection onError={handleError} />;
      case 'evaluations':
        return <EvaluationsSection onError={handleError} />;
      case 'admins':
        return admin.role === 'super_admin' ? <AdminsSection /> : null;
      default:
        return <BusinessesSection />;
    }
  };

  return (
    <div style={styles.container}>
      {/* Background gradient */}
      <div style={styles.backgroundGradient} />

      {/* Background orbs for depth - matching business dashboard */}
      <div style={styles.backgroundOrb1} />
      <div style={styles.backgroundOrb2} />
      <div style={styles.backgroundOrb3} />

      {/* Error Toast */}
      {error && (
        <div style={styles.errorToast}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </div>
      )}

      {/* Main layout */}
      <div style={styles.layout}>
        <AdminSidebar
          admin={admin}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={onLogout}
        />
        <main style={styles.main}>
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#F5F5F7',
  },
  backgroundGradient: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #F5F5F7 0%, #E8E8ED 50%, #F5F5F7 100%)',
    zIndex: 0,
  },
  backgroundOrb1: {
    position: 'fixed',
    top: '-20%',
    right: '-10%',
    width: '60%',
    height: '60%',
    background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
  },
  backgroundOrb2: {
    position: 'fixed',
    bottom: '-30%',
    left: '-10%',
    width: '50%',
    height: '50%',
    background: 'radial-gradient(circle, rgba(88, 86, 214, 0.06) 0%, transparent 70%)',
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
  },
  backgroundOrb3: {
    position: 'fixed',
    top: '40%',
    right: '20%',
    width: '30%',
    height: '30%',
    background: 'radial-gradient(circle, rgba(52, 199, 89, 0.05) 0%, transparent 70%)',
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
  },
  layout: {
    position: 'relative',
    display: 'flex',
    height: '100%',
    zIndex: 1,
  },
  main: {
    flex: 1,
    overflow: 'auto',
    position: 'relative',
    zIndex: 1,
  },
  errorToast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 20px',
    background: 'rgba(220, 38, 38, 0.95)',
    color: 'white',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 4px 20px rgba(220, 38, 38, 0.3)',
    zIndex: 1000,
    animation: 'slideIn 0.3s ease',
  },
};

export default AdminDashboard;
