import { useState } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { Dashboard } from './components/dashboard/Dashboard';
import { InterviewApp } from './components/interview/InterviewApp';
import type { User, AppView, DashboardSection, AuthMode } from './types/app';
import type { InterviewMode } from './types/interview';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [dashboardSection, setDashboardSection] = useState<DashboardSection>('overview');
  const [showAuthModal, setShowAuthModal] = useState<AuthMode | null>(null);
  const [interviewMode, setInterviewMode] = useState<InterviewMode | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (email: string) => {
    const name = email.split('@')[0];
    setUser({ email, name });
    setShowAuthModal(null);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('landing');
    setDashboardSection('overview');
  };

  const handleStartInterview = (mode: InterviewMode) => {
    setInterviewMode(mode);
  };

  const handleExitInterview = () => {
    setInterviewMode(null);
  };

  // Interview Flow (full screen)
  if (interviewMode) {
    return (
      <InterviewApp
        initialMode={interviewMode}
        onExit={handleExitInterview}
      />
    );
  }

  // Landing Page
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onLogin={() => setShowAuthModal('login')}
          onSignup={() => setShowAuthModal('signup')}
        />
        {showAuthModal && (
          <AuthModal
            mode={showAuthModal}
            onClose={() => setShowAuthModal(null)}
            onSwitchMode={(mode) => setShowAuthModal(mode)}
            onSuccess={handleLogin}
          />
        )}
      </>
    );
  }

  // Dashboard
  if (currentView === 'dashboard') {
    return (
      <Dashboard
        user={user}
        section={dashboardSection}
        setSection={setDashboardSection}
        onLogout={handleLogout}
        onStartInterview={handleStartInterview}
      />
    );
  }

  return null;
}

export default App;
