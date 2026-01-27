/**
 * Create Review Modal
 * Premium glass styling with elegant animations
 */

import { useState, useEffect } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { Icons } from '../common/Icons';
import { reviewsApi } from '../../services/api';
import type { User } from '../../types/app';

interface CreateReviewModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

// Fixed question set ID for CABAS Discovery v2.1
const QUESTION_SET_ID = 'qset_2a650788-f4a';

const FOCUS_AREAS = [
  'Leadership',
  'Communication',
  'Adaptability',
  'Innovation',
  'Team Dynamics',
  'Decision Making',
  'Strategic Thinking',
  'Change Management',
];

// Inject keyframe animations
const injectStyles = () => {
  if (document.getElementById('create-review-modal-animations')) return;

  const styleSheet = document.createElement('style');
  styleSheet.id = 'create-review-modal-animations';
  styleSheet.textContent = `
    @keyframes crModalFadeIn {
      from {
        opacity: 0;
        backdrop-filter: blur(0px);
      }
      to {
        opacity: 1;
        backdrop-filter: blur(20px);
      }
    }

    @keyframes crModalSlideIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes crStepFadeIn {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes crStepFadeOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(-20px);
      }
    }

    @keyframes crSpin {
      to {
        transform: rotate(360deg);
      }
    }

    .cr-focus-chip {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .cr-focus-chip:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .cr-focus-chip:active {
      transform: translateY(0);
    }

    .cr-btn {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .cr-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    .cr-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .cr-close-btn {
      transition: all 0.2s ease;
    }

    .cr-close-btn:hover {
      background-color: rgba(0, 0, 0, 0.05);
      transform: rotate(90deg);
    }

    .cr-textarea:focus {
      border-color: rgba(24, 24, 27, 0.3);
      box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.08);
    }
  `;
  document.head.appendChild(styleSheet);
};

export function CreateReviewModal({ user, onClose, onSuccess }: CreateReviewModalProps) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState('');
  const [includeSelf, setIncludeSelf] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const totalSteps = 2;

  useEffect(() => {
    injectStyles();
  }, []);

  const canProceed = () => {
    switch (step) {
      case 1:
        return goal.trim().length > 0;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step + 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canProceed()) return;

    setLoading(true);
    setError(null);

    try {
      // Create the review - name will be auto-generated from goal by LLM
      const review = await reviewsApi.create(QUESTION_SET_ID, goal, {
        focus_areas: focusAreas.length > 0 ? focusAreas : undefined,
        additional_context: additionalContext || undefined,
      });

      // If checkbox is checked, add current user as participant
      if (includeSelf) {
        await reviewsApi.addParticipant(review.id, user.email, user.name);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assessment');
      setLoading(false);
    }
  };

  const stepAnimation: CSSProperties = {
    animation: isAnimating
      ? `crStepFadeOut 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards`
      : `crStepFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
        <button style={styles.modalClose} onClick={onClose} className="cr-close-btn">
          <Icons.X />
        </button>

        <div style={styles.modalHeader}>
          <div style={styles.iconContainer}>
            <Icons.FileText />
          </div>
          <h2 style={styles.modalTitle}>Create New Assessment</h2>
          <p style={styles.modalSubtitle}>
            Set up a CABAS® Discovery assessment for your organization
          </p>
        </div>

        {/* Progress indicator */}
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            {[1, 2].map((s) => (
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

        {error && (
          <div style={styles.errorMessage}>
            <Icons.AlertCircle />
            <span>{error}</span>
          </div>
        )}

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={stepAnimation}>
            {/* Step 1: Goal & Focus Areas */}
            {step === 1 && (
              <div style={styles.stepContent}>
                <div style={styles.stepHeader}>
                  <h3 style={styles.stepTitle}>What's the goal of this assessment?</h3>
                  <p style={styles.stepDesc}>Define the primary objective you want to achieve</p>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Primary Goal *</label>
                  <textarea
                    className="cr-textarea"
                    style={styles.textarea}
                    placeholder="e.g., Understand how well our teams communicate and collaborate across departments"
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    rows={3}
                    autoFocus
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Focus Areas (optional)</label>
                  <p style={styles.inputHint}>Select areas you want to emphasize</p>
                  <div style={styles.focusGrid}>
                    {FOCUS_AREAS.map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleFocusArea(area)}
                        className="cr-focus-chip"
                        style={{
                          ...styles.focusChip,
                          backgroundColor: focusAreas.includes(area) ? '#18181B' : '#F4F4F5',
                          color: focusAreas.includes(area) ? '#FFFFFF' : '#18181B',
                          borderColor: focusAreas.includes(area) ? '#18181B' : '#E4E4E7',
                        }}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.infoCard}>
                  <div style={styles.infoIcon}>
                    <Icons.FileText />
                  </div>
                  <div style={styles.infoContent}>
                    <span style={styles.infoTitle}>CABAS® Discovery v2.1</span>
                    <span style={styles.infoDesc}>28 questions covering organizational readiness</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Additional Context & Participants */}
            {step === 2 && (
              <div style={styles.stepContent}>
                <div style={styles.stepHeader}>
                  <h3 style={styles.stepTitle}>Anything else we should know?</h3>
                  <p style={styles.stepDesc}>Share any context that might be helpful</p>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Additional Context (optional)</label>
                  <textarea
                    className="cr-textarea"
                    style={styles.textarea}
                    placeholder="e.g., We recently underwent a merger and want to understand how teams are adapting..."
                    value={additionalContext}
                    onChange={e => setAdditionalContext(e.target.value)}
                    rows={4}
                    autoFocus
                  />
                </div>

                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={includeSelf}
                    onChange={e => setIncludeSelf(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <span style={styles.checkboxText}>Include myself as a participant</span>
                </label>

                {/* Summary */}
                <div style={styles.summaryCard}>
                  <p style={styles.summaryLabel}>Goal</p>
                  <p style={styles.summaryValue}>{goal}</p>
                  {focusAreas.length > 0 && (
                    <>
                      <p style={styles.summaryLabel}>Focus Areas</p>
                      <p style={styles.summaryValue}>{focusAreas.join(', ')}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={styles.buttonGroup}>
            {step > 1 ? (
              <button
                type="button"
                style={styles.cancelButton}
                onClick={handleBack}
                disabled={loading}
                className="cr-btn"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                style={styles.cancelButton}
                onClick={onClose}
                disabled={loading}
                className="cr-btn"
              >
                Cancel
              </button>
            )}

            {step < totalSteps ? (
              <button
                type="button"
                style={{...styles.submitButton, opacity: !canProceed() ? 0.5 : 1}}
                onClick={handleNext}
                disabled={!canProceed()}
                className="cr-btn"
              >
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                style={{...styles.submitButton, opacity: loading ? 0.7 : 1}}
                disabled={loading}
                className="cr-btn"
              >
                {loading ? (
                  <>
                    <div style={styles.spinner} />
                    Creating...
                  </>
                ) : (
                  'Create Assessment'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '24px',
    animation: 'crModalFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },
  modalContent: {
    width: '100%',
    maxWidth: '520px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    padding: '32px',
    position: 'relative',
    maxHeight: '90vh',
    overflow: 'auto',
    animation: 'crModalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
  },
  modalClose: {
    position: 'absolute',
    top: '16px',
    right: '16px',
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
  modalHeader: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  iconContainer: {
    width: '56px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.06)',
    borderRadius: '16px',
    margin: '0 auto 16px',
    color: '#18181B',
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#18181B',
    letterSpacing: '-0.02em',
  },
  modalSubtitle: {
    fontSize: '14px',
    color: '#71717A',
  },
  progressContainer: {
    marginBottom: '24px',
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
    textAlign: 'center',
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  stepHeader: {
    marginBottom: '8px',
  },
  stepTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#18181B',
    marginBottom: '4px',
  },
  stepDesc: {
    fontSize: '14px',
    color: '#71717A',
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '12px',
    marginBottom: '20px',
    color: '#DC2626',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inputLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#18181B',
  },
  inputHint: {
    fontSize: '13px',
    color: '#71717A',
    marginBottom: '4px',
  },
  textarea: {
    padding: '14px 16px',
    fontSize: '14px',
    backgroundColor: '#FAFAFA',
    border: '1px solid #E4E4E7',
    borderRadius: '12px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  focusGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  focusChip: {
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '500',
    borderRadius: '24px',
    border: '1px solid',
    cursor: 'pointer',
  },
  infoCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 18px',
    backgroundColor: '#F4F4F5',
    borderRadius: '14px',
    border: '1px solid #E4E4E7',
  },
  infoIcon: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181B',
    borderRadius: '10px',
    color: '#FFFFFF',
    flexShrink: 0,
  },
  infoContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  infoTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#18181B',
  },
  infoDesc: {
    fontSize: '13px',
    color: '#71717A',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    padding: '12px 0',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    accentColor: '#18181B',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '14px',
    color: '#18181B',
    fontWeight: '500',
  },
  summaryCard: {
    padding: '16px 20px',
    backgroundColor: '#FAFAFA',
    borderRadius: '12px',
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#71717A',
    margin: '0 0 4px 0',
  },
  summaryValue: {
    fontSize: '14px',
    color: '#18181B',
    margin: '0 0 16px 0',
    lineHeight: '1.5',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  cancelButton: {
    flex: 1,
    padding: '14px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#FFFFFF',
    color: '#18181B',
    border: '1px solid #E4E4E7',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#18181B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
    animation: 'crSpin 0.8s linear infinite',
  },
};

export default CreateReviewModal;
