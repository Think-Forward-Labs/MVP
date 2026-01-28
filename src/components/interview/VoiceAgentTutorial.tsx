/**
 * VoiceAgentTutorial - Premium onboarding for voice agent mode
 *
 * Features:
 * - Static pre-generated audio files (no TTS API calls)
 * - Renders actual interview UI preview with highlights
 * - Siri-style animated orb
 * - Apple-inspired glass morphism design
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { brandColors, animationTiming } from '../../styles/brandColors';
import { SiriOrb } from './SiriOrb';

interface VoiceAgentTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

// Tutorial steps with highlight regions
type HighlightRegion = 'question' | 'conversation' | 'response' | 'nextButton' | null;

interface TutorialStep {
  id: string;
  narration: string;
  title: string;
  highlight: HighlightRegion;
  showOrb: boolean; // Show orb instead of UI preview
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    narration: "Hi, I'm Eunice. I'll guide you through this assessment. This is a private session — your responses are completely confidential. We'll take about 18 to 20 minutes.",
    title: 'Welcome',
    highlight: null,
    showOrb: true,
  },
  {
    id: 'question',
    narration: "Each question appears here at the top. Take a moment to read it before responding.",
    title: 'The Question',
    highlight: 'question',
    showOrb: false,
  },
  {
    id: 'conversation',
    narration: "This is where our conversation happens. I'll read the question, listen to your response, and ask follow-ups if I need more detail. Just speak naturally — no buttons needed.",
    title: 'Conversation',
    highlight: 'conversation',
    showOrb: false,
  },
  {
    id: 'response',
    narration: "When I've gathered everything, your response appears here. You can review and edit it before moving on.",
    title: 'Your Response',
    highlight: 'response',
    showOrb: false,
  },
  {
    id: 'next',
    narration: "Click Next when you're ready to proceed. You control the pace — I'll wait for you.",
    title: 'Navigation',
    highlight: 'nextButton',
    showOrb: false,
  },
  {
    id: 'ready',
    narration: "That's all you need to know. Let's begin your assessment.",
    title: 'Ready',
    highlight: null,
    showOrb: true,
  },
];

// Static audio file paths
const getAudioPath = (stepId: string) => `/audio/tutorial/${stepId}.mp3`;

// Dummy data for preview
const dummyQuestion = {
  aspect: 'Strategic Vision',
  aspectCode: 'SV',
  text: 'What are your primary goals for the coming year, and how do you plan to achieve them?',
};

const dummyConversation = [
  { role: 'agent', text: "What are your primary goals for the coming year?" },
  { role: 'user', text: "I want to expand our market reach and improve our product quality..." },
  { role: 'agent', text: "That's great. Can you tell me more about how you plan to achieve the market expansion?" },
];

export function VoiceAgentTutorial({ onComplete, onSkip }: VoiceAgentTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [, setAudioLoaded] = useState<Set<string>>(new Set());

  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Pre-load all audio files on mount
  useEffect(() => {
    let mounted = true;
    const loaded = new Set<string>();

    const preloadAudio = async () => {
      const loadPromises = tutorialSteps.map(async (tutorialStep) => {
        try {
          const audio = new Audio(getAudioPath(tutorialStep.id));

          await new Promise<void>((resolve, reject) => {
            audio.oncanplaythrough = () => resolve();
            audio.onerror = () => reject(new Error(`Failed to load ${tutorialStep.id}.mp3`));
            audio.load();
          });

          if (mounted) {
            audioRefs.current.set(tutorialStep.id, audio);
            loaded.add(tutorialStep.id);
          }
        } catch (error) {
          console.warn(`Could not load audio for ${tutorialStep.id}:`, error);
        }
      });

      await Promise.all(loadPromises);

      if (mounted) {
        setAudioLoaded(loaded);
        setIsLoading(false);
        // Auto-play first step after brief delay
        setTimeout(() => playStepAudio(0), 400);
      }
    };

    preloadAudio();

    return () => {
      mounted = false;
      audioRefs.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play audio for a specific step
  const playStepAudio = useCallback((stepIndex: number) => {
    const stepId = tutorialSteps[stepIndex]?.id;
    if (!stepId) return;

    const audio = audioRefs.current.get(stepId);
    if (!audio) {
      console.warn(`No audio loaded for step: ${stepId}`);
      return;
    }

    // Stop current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }

    currentAudioRef.current = audio;
    audio.currentTime = 0;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);

    audio.play().catch(console.error);
  }, []);

  // Stop current audio
  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  // Handle next step
  const handleNext = useCallback(() => {
    stopAudio();

    if (isLastStep) {
      onComplete();
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setTimeout(() => playStepAudio(nextStep), 150);
    }
  }, [currentStep, isLastStep, onComplete, playStepAudio, stopAudio]);

  // Handle previous step
  const handlePrev = useCallback(() => {
    if (isFirstStep) return;

    stopAudio();
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    setTimeout(() => playStepAudio(prevStep), 150);
  }, [currentStep, isFirstStep, playStepAudio, stopAudio]);

  // Handle skip
  const handleSkip = useCallback(() => {
    stopAudio();
    onSkip();
  }, [onSkip, stopAudio]);

  // Check if a region should be highlighted
  const isHighlighted = (region: HighlightRegion) => step.highlight === region;
  const hasHighlight = step.highlight !== null;

  // Loading state
  if (isLoading) {
    return (
      <div style={styles.container}>
        <style>{keyframeStyles}</style>
        <div style={styles.background} />
        <div style={styles.orb1} />
        <div style={styles.orb2} />

        <div style={styles.loadingContent}>
          <SiriOrb size={120} isSpeaking={false} isListening={true} />
          <div style={styles.loadingTextContainer}>
            <h2 style={styles.loadingTitle}>Preparing Eunice</h2>
            <p style={styles.loadingSubtitle}>Loading tutorial...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{keyframeStyles}</style>

      {/* Background */}
      <div style={styles.background} />
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      {/* Skip button */}
      <button style={styles.skipButton} onClick={handleSkip}>
        Skip
      </button>

      {/* Main content */}
      <div style={styles.content}>
        {step.showOrb ? (
          // Orb view (welcome/ready screens)
          <div style={styles.orbView}>
            <SiriOrb size={160} isSpeaking={isPlaying} isListening={!isPlaying} />
            <div style={styles.agentInfo}>
              <h1 style={styles.agentName}>Eunice</h1>
              <p style={styles.agentRole}>Your AI Interview Guide</p>
            </div>
          </div>
        ) : (
          // Interview UI preview with highlights
          <div style={styles.previewContainer}>
            {/* Blur overlay when highlighting */}
            {hasHighlight && <div style={styles.blurOverlay} />}

            {/* Mini interview preview */}
            <div style={styles.interviewPreview}>
              {/* Header */}
              <div style={styles.previewHeader}>
                <span style={styles.previewHeaderTitle}>CABAS® Discovery</span>
                <span style={styles.previewBadge}>Voice Agent</span>
                <span style={styles.previewProgress}>1 of 28</span>
              </div>

              {/* Progress bar */}
              <div style={styles.previewProgressBar}>
                <div style={styles.previewProgressFill} />
              </div>

              {/* Question area */}
              <div style={{
                ...styles.previewSection,
                ...(isHighlighted('question') ? styles.highlighted : (hasHighlight ? styles.dimmed : {})),
              }}>
                <div style={styles.previewCategoryBadge}>
                  {dummyQuestion.aspectCode} · {dummyQuestion.aspect}
                </div>
                <p style={styles.previewQuestionText}>{dummyQuestion.text}</p>
              </div>

              {/* Conversation area */}
              <div style={{
                ...styles.previewConversation,
                ...(isHighlighted('conversation') ? styles.highlighted : (hasHighlight ? styles.dimmed : {})),
              }}>
                {dummyConversation.map((turn, idx) => (
                  <div key={idx} style={styles.previewMessage}>
                    <div style={{
                      ...styles.previewAvatar,
                      background: turn.role === 'agent'
                        ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                        : '#18181B',
                    }}>
                      {turn.role === 'agent' ? 'E' : 'Y'}
                    </div>
                    <div style={styles.previewMessageContent}>
                      <span style={{
                        ...styles.previewMessageRole,
                        color: turn.role === 'agent' ? '#6366F1' : '#18181B',
                      }}>
                        {turn.role === 'agent' ? 'Eunice' : 'You'}
                      </span>
                      <span style={styles.previewMessageText}>{turn.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Response area (shown as ready state preview) */}
              <div style={{
                ...styles.previewResponse,
                ...(isHighlighted('response') ? styles.highlighted : (hasHighlight ? styles.dimmed : {})),
              }}>
                <div style={styles.previewResponseHeader}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span style={styles.previewResponseLabel}>Your Response</span>
                </div>
                <p style={styles.previewResponseText}>
                  I want to expand our market reach by entering two new regions and improve our product quality through enhanced QA processes...
                </p>
              </div>

              {/* Footer */}
              <div style={{
                ...styles.previewFooter,
                ...(isHighlighted('nextButton') ? styles.highlighted : (hasHighlight ? styles.dimmed : {})),
              }}>
                <div style={styles.previewStatus}>
                  <div style={styles.previewStatusDot} />
                  <span>Ready</span>
                </div>
                <div style={styles.previewNextButton}>
                  Next Question
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Narration card */}
        <div style={styles.narrationCard} key={step.id}>
          <div style={styles.narrationHeader}>
            <div style={styles.narrationSpeaker}>
              <div style={styles.smallOrb}>
                <div style={{
                  ...styles.smallOrbInner,
                  opacity: isPlaying ? 1 : 0.6,
                }} />
              </div>
              <span style={styles.speakerName}>Eunice</span>
            </div>
            {isPlaying && (
              <div style={styles.audioWave}>
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} style={{ ...styles.audioBar, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}
          </div>
          <p style={styles.narrationText}>{step.narration}</p>
        </div>

        {/* Progress dots */}
        <div style={styles.progressDots}>
          {tutorialSteps.map((_, idx) => (
            <div
              key={idx}
              style={{
                ...styles.dot,
                backgroundColor: idx === currentStep ? brandColors.accent.primary : 'rgba(0, 0, 0, 0.12)',
                transform: idx === currentStep ? 'scale(1.2)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* Navigation */}
        <div style={styles.navigation}>
          <button
            style={{
              ...styles.navButton,
              opacity: isFirstStep ? 0.3 : 1,
              cursor: isFirstStep ? 'default' : 'pointer',
            }}
            onClick={handlePrev}
            disabled={isFirstStep}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            style={isLastStep ? styles.startButton : styles.continueButton}
            onClick={handleNext}
          >
            {isLastStep ? 'Start Interview' : 'Continue'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div style={{ width: 44 }} />
        </div>
      </div>
    </div>
  );
}

// CSS Keyframe animations
const keyframeStyles = `
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse-subtle {
    0%, 100% { opacity: 0.06; }
    50% { opacity: 0.1; }
  }

  @keyframes pulse-ring {
    0%, 100% { transform: scale(0.95); opacity: 0.6; }
    50% { transform: scale(1.05); opacity: 1; }
  }

  @keyframes audio-wave {
    0%, 100% { transform: scaleY(0.4); }
    50% { transform: scaleY(1); }
  }
`;

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: brandColors.background.primary,
  },

  background: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: brandColors.background.gradient,
    backgroundSize: '200% 200%',
    animation: 'gradient-shift 15s ease infinite',
    zIndex: 0,
  },

  orb1: {
    position: 'fixed',
    top: '-20%',
    right: '-10%',
    width: '60%',
    height: '60%',
    background: `radial-gradient(circle, ${brandColors.orb.blue} 0%, transparent 70%)`,
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
    animation: 'pulse-subtle 8s ease-in-out infinite',
  },

  orb2: {
    position: 'fixed',
    bottom: '-30%',
    left: '-10%',
    width: '50%',
    height: '50%',
    background: `radial-gradient(circle, ${brandColors.orb.purple} 0%, transparent 70%)`,
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
    animation: 'pulse-subtle 10s ease-in-out infinite',
  },

  skipButton: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: brandColors.text.secondary,
    backgroundColor: brandColors.glass.background,
    backdropFilter: brandColors.glass.blur,
    border: `1px solid ${brandColors.glass.border}`,
    borderRadius: '10px',
    cursor: 'pointer',
    zIndex: 100,
    transition: `all ${animationTiming.standard}ms ${animationTiming.easeOut}`,
  },

  content: {
    width: '100%',
    maxWidth: '520px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
  },

  // Loading state
  loadingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    position: 'relative',
    zIndex: 10,
  },

  loadingTextContainer: {
    textAlign: 'center',
  },

  loadingTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: brandColors.text.primary,
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em',
  },

  loadingSubtitle: {
    fontSize: '15px',
    color: brandColors.text.secondary,
    margin: 0,
  },

  // Orb view (welcome/ready)
  orbView: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '24px',
  },

  agentInfo: {
    textAlign: 'center',
    marginTop: '20px',
  },

  agentName: {
    fontSize: '28px',
    fontWeight: '600',
    color: brandColors.text.primary,
    margin: '0 0 4px 0',
    letterSpacing: '-0.02em',
  },

  agentRole: {
    fontSize: '15px',
    color: brandColors.text.secondary,
    margin: 0,
  },

  // Preview container
  previewContainer: {
    width: '100%',
    marginBottom: '20px',
    position: 'relative',
  },

  blurOverlay: {
    position: 'absolute',
    inset: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: '20px',
    zIndex: 0,
  },

  interviewPreview: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E4E4E7',
    overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    position: 'relative',
    zIndex: 1,
  },

  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    borderBottom: '1px solid #F4F4F5',
    backgroundColor: '#FAFAFA',
  },

  previewHeaderTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#71717A',
    letterSpacing: '0.02em',
  },

  previewBadge: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#6366F1',
    padding: '3px 8px',
    borderRadius: '4px',
  },

  previewProgress: {
    marginLeft: 'auto',
    fontSize: '11px',
    color: '#A1A1AA',
  },

  previewProgressBar: {
    height: '2px',
    backgroundColor: '#F4F4F5',
  },

  previewProgressFill: {
    width: '3.5%',
    height: '100%',
    backgroundColor: '#18181B',
  },

  previewSection: {
    padding: '14px 16px',
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 1,
  },

  previewCategoryBadge: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#71717A',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },

  previewQuestionText: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#18181B',
    lineHeight: 1.5,
    margin: 0,
  },

  previewConversation: {
    padding: '12px 16px',
    backgroundColor: '#FAFAFA',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 1,
  },

  previewMessage: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },

  previewAvatar: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF',
    fontSize: '10px',
    fontWeight: '600',
    flexShrink: 0,
  },

  previewMessageContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  previewMessageRole: {
    fontSize: '9px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },

  previewMessageText: {
    fontSize: '11px',
    color: '#52525B',
    lineHeight: 1.4,
  },

  previewResponse: {
    margin: '0 12px 12px',
    padding: '12px',
    backgroundColor: '#F0FDF4',
    borderRadius: '8px',
    border: '1px solid #BBF7D0',
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 1,
  },

  previewResponseHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
  },

  previewResponseLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#22C55E',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },

  previewResponseText: {
    fontSize: '11px',
    color: '#166534',
    lineHeight: 1.5,
    margin: 0,
  },

  previewFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderTop: '1px solid #F4F4F5',
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 1,
  },

  previewStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#22C55E',
    fontWeight: '500',
  },

  previewStatusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#22C55E',
  },

  previewNextButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 14px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    borderRadius: '6px',
  },

  // Highlight states
  highlighted: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.4), 0 4px 12px rgba(99, 102, 241, 0.15)',
    borderRadius: '8px',
    zIndex: 10,
    animation: 'pulse-ring 2s ease-in-out infinite',
  },

  dimmed: {
    opacity: 0.4,
    filter: 'blur(1px)',
  },

  // Narration card
  narrationCard: {
    width: '100%',
    padding: '20px 24px',
    backgroundColor: brandColors.glass.backgroundSolid,
    backdropFilter: brandColors.glass.blur,
    borderRadius: '16px',
    border: `1px solid ${brandColors.glass.border}`,
    boxShadow: brandColors.glass.shadow,
    marginBottom: '24px',
    animation: `fade-in-up ${animationTiming.smooth}ms ${animationTiming.easeOut}`,
  },

  narrationHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },

  narrationSpeaker: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  smallOrb: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: brandColors.accent.gradient,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  smallOrbInner: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transition: 'opacity 0.3s ease',
  },

  speakerName: {
    fontSize: '14px',
    fontWeight: '600',
    color: brandColors.text.primary,
  },

  audioWave: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    height: '16px',
  },

  audioBar: {
    width: '3px',
    height: '100%',
    backgroundColor: brandColors.accent.primary,
    borderRadius: '2px',
    animation: 'audio-wave 0.6s ease-in-out infinite',
  },

  narrationText: {
    fontSize: '15px',
    fontWeight: '400',
    color: brandColors.text.primary,
    lineHeight: 1.6,
    margin: 0,
  },

  // Progress dots
  progressDots: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
  },

  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    transition: `all ${animationTiming.standard}ms ${animationTiming.easeOut}`,
  },

  // Navigation
  navigation: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    width: '100%',
  },

  navButton: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: brandColors.glass.background,
    backdropFilter: brandColors.glass.blur,
    border: `1px solid ${brandColors.glass.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: brandColors.text.secondary,
    transition: `all ${animationTiming.standard}ms ${animationTiming.easeOut}`,
  },

  continueButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    fontSize: '15px',
    fontWeight: '600',
    color: brandColors.button.primary.text,
    background: brandColors.button.primary.background,
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    boxShadow: brandColors.button.primary.shadow,
    transition: `all ${animationTiming.standard}ms ${animationTiming.easeOut}`,
  },

  startButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 32px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#FFFFFF',
    background: brandColors.accent.gradient,
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
    transition: `all ${animationTiming.standard}ms ${animationTiming.easeOut}`,
  },
};

export default VoiceAgentTutorial;
