import { useState, useEffect } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { Dashboard } from './components/dashboard/Dashboard';
import { InterviewApp } from './components/interview/InterviewApp';
import { CreateReviewModal } from './components/dashboard/CreateReviewModal';
import { ReviewDetailPanel } from './components/dashboard/ReviewDetailPanel';
import { BusinessOnboardingModal } from './components/onboarding/BusinessOnboardingModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { authApi, getAuthToken, clearAuthToken, reviewsApi } from './services/api';
import { adminApi, getAdminAuthToken, clearAdminAuthToken } from './services/adminApi';
import type { User, Business, AppView, DashboardSection, AuthMode, ReviewDetail } from './types/app';
import type { InterviewMode } from './types/interview';
import type { Admin } from './types/admin';

interface InterviewContext {
  mode: InterviewMode;
  reviewId?: string;
  participantId?: string;
  viewOnly?: boolean;
  editMode?: boolean;
  interviewId?: string;
}

function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [dashboardSection, setDashboardSection] = useState<DashboardSection>('overview');
  const [showAuthModal, setShowAuthModal] = useState<AuthMode | null>(null);
  const [interviewMode, setInterviewMode] = useState<InterviewContext | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<ReviewDetail | null>(null);
  const [showCreateReview, setShowCreateReview] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Admin portal state
  const [adminUser, setAdminUser] = useState<Admin | null>(null);

  // Session restoration on mount
  useEffect(() => {
    const restoreSession = async () => {
      // Check if we're on admin path
      if (window.location.pathname.startsWith('/admin')) {
        const adminToken = getAdminAuthToken();
        if (adminToken) {
          try {
            const admin = await adminApi.getMe();
            setAdminUser(admin);
            setCurrentView('admin-dashboard');
          } catch {
            clearAdminAuthToken();
            setCurrentView('admin-login');
          }
        } else {
          setCurrentView('admin-login');
        }
        setIsLoading(false);
        return;
      }

      // Regular business user session
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const meResponse = await authApi.getMe();
        setUser(meResponse.user as User);
        const userBusiness = meResponse.business as Business | null;
        setBusiness(userBusiness);
        setCurrentView('dashboard');

        // Check if business needs onboarding
        if (userBusiness && !userBusiness.onboarding_completed) {
          setShowOnboarding(true);
        }
      } catch (error) {
        // Token is invalid, clear it
        clearAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleLogin = (loggedInUser: User, userBusiness: Business | null) => {
    setUser(loggedInUser);
    setBusiness(userBusiness);
    setShowAuthModal(null);
    setCurrentView('dashboard');

    // Check if business needs onboarding
    if (userBusiness && !userBusiness.onboarding_completed) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = (updatedBusiness: Business) => {
    setBusiness(updatedBusiness);
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
    setBusiness(null);
    setSelectedReview(null);
    setCurrentView('landing');
    setDashboardSection('overview');
  };

  // Admin handlers
  const handleAdminLogin = (admin: Admin) => {
    setAdminUser(admin);
    setCurrentView('admin-dashboard');
    // Update URL to /admin without full page reload
    window.history.pushState({}, '', '/admin');
  };

  const handleAdminLogout = () => {
    adminApi.logout();
    setAdminUser(null);
    setCurrentView('admin-login');
    window.history.pushState({}, '', '/admin');
  };

  const handleStartInterview = (mode: InterviewMode, reviewId?: string, participantId?: string) => {
    setInterviewMode({ mode, reviewId, participantId });
  };

  const handleViewInterview = (reviewId: string, participantId: string, interviewId: string) => {
    setInterviewMode({ mode: 'text', reviewId, participantId, viewOnly: true, interviewId });
  };

  const handleEditInterview = (reviewId: string, participantId: string, interviewId: string) => {
    setInterviewMode({ mode: 'text', reviewId, participantId, editMode: true, interviewId });
  };

  const handleExitInterview = () => {
    setInterviewMode(null);
    // Refresh review detail if we were in one
    if (selectedReview) {
      handleSelectReview(selectedReview.id);
    }
  };

  const handleSelectReview = async (reviewId: string) => {
    try {
      const detail = await reviewsApi.getById(reviewId);
      setSelectedReview(detail as ReviewDetail);
      setCurrentView('review-detail');
    } catch (error) {
      console.error('Failed to fetch review detail:', error);
    }
  };

  const handleBackToDashboard = () => {
    setSelectedReview(null);
    setCurrentView('dashboard');
  };

  const handleCreateReviewSuccess = () => {
    setShowCreateReview(false);
    // Dashboard will refresh reviews on its own
  };

  // Loading spinner while checking session
  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  // Interview Flow (full screen)
  if (interviewMode) {
    return (
      <InterviewApp
        initialMode={interviewMode.mode}
        reviewId={interviewMode.reviewId}
        participantId={interviewMode.participantId}
        viewOnly={interviewMode.viewOnly}
        editMode={interviewMode.editMode}
        interviewId={interviewMode.interviewId}
        onExit={handleExitInterview}
        onComplete={(interviewId) => {
          console.log('Interview completed:', interviewId);
          // Don't exit immediately - let the completion screen show
          // User will click "Return to Dashboard" which calls onExit
        }}
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

  // Review Detail View
  if (currentView === 'review-detail' && selectedReview) {
    return (
      <ReviewDetailPanel
        review={selectedReview}
        user={user}
        onBack={handleBackToDashboard}
        onStartInterview={(reviewId, participantId) => handleStartInterview('select', reviewId, participantId)}
        onParticipantAdded={() => handleSelectReview(selectedReview.id)}
      />
    );
  }

  // Dashboard
  if (currentView === 'dashboard') {
    return (
      <>
        <Dashboard
          user={user}
          business={business}
          section={dashboardSection}
          setSection={setDashboardSection}
          onLogout={handleLogout}
          onStartInterview={(mode, reviewId, participantId) => handleStartInterview(mode, reviewId, participantId)}
          onViewInterview={handleViewInterview}
          onEditInterview={handleEditInterview}
          onSelectReview={handleSelectReview}
          onCreateReview={() => setShowCreateReview(true)}
        />
        {showCreateReview && user && (
          <CreateReviewModal
            user={user}
            onClose={() => setShowCreateReview(false)}
            onSuccess={handleCreateReviewSuccess}
          />
        )}
        {showOnboarding && business && (
          <BusinessOnboardingModal
            isOpen={showOnboarding}
            businessName={business.name}
            onComplete={handleOnboardingComplete}
            onClose={() => setShowOnboarding(false)}
          />
        )}
      </>
    );
  }

  // Admin Login Page
  if (currentView === 'admin-login') {
    return <AdminLogin onSuccess={handleAdminLogin} />;
  }

  // Admin Dashboard
  if (currentView === 'admin-dashboard' && adminUser) {
    return <AdminDashboard admin={adminUser} onLogout={handleAdminLogout} />;
  }

  return null;
}

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    backgroundColor: '#FAFAFA',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #E4E4E7',
    borderTopColor: '#18181B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#71717A',
  },
};

// Add keyframes to document
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default App;
