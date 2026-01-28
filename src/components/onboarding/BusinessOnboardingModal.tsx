/**
 * Business Onboarding Modal
 * Multi-step flow for collecting business information after registration
 * Premium glass styling with elegant animations
 */

import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { authApi } from '../../services/api';
import type { Business } from '../../types/app';

interface BusinessOnboardingModalProps {
  isOpen: boolean;
  businessName: string;
  onComplete: (business: Business) => void;
  onClose: () => void;
}

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Professional Services',
  'Government',
  'Non-Profit',
  'Other',
];

const SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

// Inject keyframe animations
const injectStyles = () => {
  if (document.getElementById('onboarding-modal-animations')) return;

  const styleSheet = document.createElement('style');
  styleSheet.id = 'onboarding-modal-animations';
  styleSheet.textContent = `
    @keyframes modalFadeIn {
      from {
        opacity: 0;
        backdrop-filter: blur(0px);
      }
      to {
        opacity: 1;
        backdrop-filter: blur(20px);
      }
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes stepFadeIn {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes stepFadeOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(-20px);
      }
    }

    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .onboarding-option-btn {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .onboarding-option-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .onboarding-option-btn:active {
      transform: translateY(0);
    }

    .onboarding-nav-btn {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .onboarding-nav-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .onboarding-nav-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .onboarding-close-btn {
      transition: all 0.2s ease;
    }

    .onboarding-close-btn:hover {
      background-color: rgba(0, 0, 0, 0.05);
      transform: rotate(90deg);
    }
  `;
  document.head.appendChild(styleSheet);
};

export function BusinessOnboardingModal({
  isOpen,
  businessName,
  onComplete,
  onClose,
}: BusinessOnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [, setAnimationDirection] = useState<'forward' | 'backward'>('forward');

  const totalSteps = 3;

  useEffect(() => {
    injectStyles();
  }, []);

  const canProceed = () => {
    switch (step) {
      case 1:
        return industry !== '';
      case 2:
        return size !== '';
      case 3:
        return description.trim().length >= 10;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setAnimationDirection('forward');
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step + 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setAnimationDirection('backward');
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.completeOnboarding(industry, size, description);
      onComplete({
        id: response.business.id,
        name: response.business.name,
        description: response.business.description,
        industry: response.business.industry,
        size: response.business.size,
        status: response.business.status,
        onboarding_completed: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const stepAnimation: CSSProperties = {
    animation: isAnimating
      ? `stepFadeOut 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards`
      : `stepFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h2 style={styles.title}>Welcome to ThinkForward</h2>
            <p style={styles.subtitle}>Let's set up {businessName}</p>
          </div>
          <button onClick={onClose} style={styles.closeButton} className="onboarding-close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  ...styles.progressStep,
                  backgroundColor: s <= step ? '#18181B' : '#E4E4E7',
                  transform: s === step ? 'scaleY(1.2)' : 'scaleY(1)',
                }}
              />
            ))}
          </div>
          <p style={styles.progressText}>Step {step} of {totalSteps}</p>
        </div>

        {/* Content */}
        <div style={styles.content}>
          <div style={stepAnimation}>
            {step === 1 && (
              <div>
                <div style={styles.stepHeader}>
                  <div style={styles.stepIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M5 21V10.87M19 21V10.87" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={styles.stepTitle}>What industry are you in?</h3>
                    <p style={styles.stepDesc}>This helps us tailor the experience</p>
                  </div>
                </div>

                <div style={styles.optionsGrid}>
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => setIndustry(ind)}
                      className="onboarding-option-btn"
                      style={{
                        ...styles.optionButton,
                        backgroundColor: industry === ind ? '#18181B' : '#FAFAFA',
                        borderColor: industry === ind ? '#18181B' : '#E4E4E7',
                        color: industry === ind ? '#FFFFFF' : '#18181B',
                      }}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div style={styles.stepHeader}>
                  <div style={{...styles.stepIcon, backgroundColor: 'rgba(139, 92, 246, 0.1)'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={styles.stepTitle}>How large is your organization?</h3>
                    <p style={styles.stepDesc}>Select your team size</p>
                  </div>
                </div>

                <div style={styles.optionsList}>
                  {SIZES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSize(s.value)}
                      className="onboarding-option-btn"
                      style={{
                        ...styles.optionButtonFull,
                        backgroundColor: size === s.value ? '#18181B' : '#FAFAFA',
                        borderColor: size === s.value ? '#18181B' : '#E4E4E7',
                        color: size === s.value ? '#FFFFFF' : '#18181B',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div style={styles.stepHeader}>
                  <div style={{...styles.stepIcon, backgroundColor: 'rgba(34, 197, 94, 0.1)'}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <h3 style={styles.stepTitle}>Tell us about your organization</h3>
                    <p style={styles.stepDesc}>Brief description of what you do</p>
                  </div>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., We are a software company that builds enterprise solutions for healthcare providers..."
                  style={styles.textarea}
                />
                <p style={styles.hint}>
                  {description.length < 10 ? `${10 - description.length} more characters needed` : 'Looks good!'}
                </p>
              </div>
            )}
          </div>

          {error && (
            <p style={styles.error}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="onboarding-nav-btn"
            style={{
              ...styles.backButton,
              opacity: step === 1 ? 0.4 : 1,
              cursor: step === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="onboarding-nav-btn"
              style={{
                ...styles.nextButton,
                opacity: canProceed() ? 1 : 0.5,
                cursor: canProceed() ? 'pointer' : 'not-allowed',
              }}
            >
              Continue
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isLoading}
              className="onboarding-nav-btn"
              style={{
                ...styles.submitButton,
                opacity: canProceed() && !isLoading ? 1 : 0.5,
                cursor: canProceed() && !isLoading ? 'pointer' : 'not-allowed',
              }}
            >
              {isLoading ? (
                <>
                  <div style={styles.spinner} />
                  Saving...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Complete Setup
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
    animation: 'modalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },
  modal: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    animation: 'modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
  },
  header: {
    padding: '28px 28px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {},
  title: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#18181B',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#71717A',
    margin: '6px 0 0',
  },
  closeButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#71717A',
    cursor: 'pointer',
    borderRadius: '10px',
  },
  progressContainer: {
    padding: '0 28px 20px',
  },
  progressBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
  },
  progressStep: {
    flex: 1,
    height: '4px',
    borderRadius: '2px',
    transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  progressText: {
    fontSize: '12px',
    color: '#A1A1AA',
    margin: 0,
  },
  content: {
    padding: '8px 28px 28px',
    minHeight: '300px',
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    marginBottom: '24px',
  },
  stepIcon: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.06)',
    borderRadius: '12px',
    color: '#18181B',
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#18181B',
    margin: 0,
  },
  stepDesc: {
    fontSize: '14px',
    color: '#71717A',
    margin: '4px 0 0',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  optionButton: {
    padding: '14px 16px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    borderRadius: '12px',
    border: '1px solid',
    cursor: 'pointer',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  optionButtonFull: {
    width: '100%',
    padding: '16px 18px',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    borderRadius: '12px',
    border: '1px solid',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    height: '140px',
    padding: '16px',
    fontSize: '14px',
    backgroundColor: '#FAFAFA',
    border: '1px solid #E4E4E7',
    borderRadius: '12px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  hint: {
    fontSize: '13px',
    color: '#A1A1AA',
    margin: '10px 0 0',
  },
  error: {
    color: '#DC2626',
    fontSize: '14px',
    marginTop: '16px',
    padding: '12px 16px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '10px',
  },
  footer: {
    padding: '20px 28px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #E4E4E7',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '12px 18px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#71717A',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  nextButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#22C55E',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
