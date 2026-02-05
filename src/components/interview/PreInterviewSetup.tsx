/**
 * PreInterviewSetup - Premium glassmorphism mode selection
 *
 * Design principles:
 * - Dark glassmorphism with layered depth
 * - Indigo/purple accent palette (brandColors)
 * - Animated background orbs for premium feel
 * - Smooth micro-interactions
 * - Industry-standard glass effects
 */

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { brandColors, animationTiming } from '../../styles/brandColors';

export type VoiceInterviewMode = 'review' | 'handsfree';

interface PreInterviewSetupProps {
  onStart: (mode: VoiceInterviewMode) => void;
  onWatchTutorial: () => void;
  onBack: () => void;
  isFirstTime?: boolean;
}

export function PreInterviewSetup({
  onStart,
  onWatchTutorial,
  onBack,
  isFirstTime = false,
}: PreInterviewSetupProps) {
  const [selectedMode, setSelectedMode] = useState<VoiceInterviewMode>('review');
  const [hoveredMode, setHoveredMode] = useState<VoiceInterviewMode | null>(null);

  return (
    <div style={styles.container}>
      {/* Animated gradient background */}
      <div style={styles.background} />

      {/* Ambient orbs for depth */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />

      {/* Keyframe animations */}
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      <div style={styles.content}>
        {/* Back button - glass style */}
        <button
          style={styles.backButton}
          onClick={onBack}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = brandColors.glass.background;
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Header */}
        <div style={styles.header}>
          {/* Decorative accent */}
          <div style={styles.accentBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
            </svg>
            <span>Voice Mode</span>
          </div>
          <h1 style={styles.title}>Choose Your Style</h1>
          <p style={styles.subtitle}>
            How would you like to interact with Eunice?
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div style={styles.cardsContainer}>
          {/* Review Mode Card */}
          <button
            style={{
              ...styles.card,
              ...(selectedMode === 'review' ? styles.cardSelected : {}),
              ...(hoveredMode === 'review' && selectedMode !== 'review' ? styles.cardHovered : {}),
            }}
            onClick={() => setSelectedMode('review')}
            onMouseEnter={() => setHoveredMode('review')}
            onMouseLeave={() => setHoveredMode(null)}
          >
            <div style={styles.cardContent}>
              <div style={{
                ...styles.iconCircle,
                ...(selectedMode === 'review' ? styles.iconCircleSelected : {}),
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <div style={styles.cardText}>
                <h3 style={styles.cardTitle}>Review Mode</h3>
                <p style={styles.cardDescription}>
                  Review your response before proceeding to the next question
                </p>
              </div>
              <div style={{
                ...styles.checkCircle,
                ...(selectedMode === 'review' ? styles.checkCircleSelected : {}),
              }}>
                {selectedMode === 'review' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
          </button>

          {/* Hands-free Mode Card */}
          <button
            style={{
              ...styles.card,
              ...(selectedMode === 'handsfree' ? styles.cardSelected : {}),
              ...(hoveredMode === 'handsfree' && selectedMode !== 'handsfree' ? styles.cardHovered : {}),
            }}
            onClick={() => setSelectedMode('handsfree')}
            onMouseEnter={() => setHoveredMode('handsfree')}
            onMouseLeave={() => setHoveredMode(null)}
          >
            <div style={styles.cardContent}>
              <div style={{
                ...styles.iconCircle,
                ...(selectedMode === 'handsfree' ? styles.iconCircleSelected : {}),
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  <path d="M12 19v4M8 23h8" />
                </svg>
              </div>
              <div style={styles.cardText}>
                <h3 style={styles.cardTitle}>Hands-free</h3>
                <p style={styles.cardDescription}>
                  Say "next" to move between questions automatically
                </p>
              </div>
              <div style={{
                ...styles.checkCircle,
                ...(selectedMode === 'handsfree' ? styles.checkCircleSelected : {}),
              }}>
                {selectedMode === 'handsfree' && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Tutorial Link */}
        <button
          style={styles.tutorialButton}
          onClick={onWatchTutorial}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
          </svg>
          <span>Watch Tutorial</span>
          {isFirstTime && <span style={styles.badge}>New</span>}
        </button>

        {/* Start Button - Premium gradient */}
        <button
          style={styles.startButton}
          onClick={() => onStart(selectedMode)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.35)';
          }}
        >
          Continue
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Hint */}
        <p style={styles.hint}>
          You can switch modes anytime during the interview
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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

  // Ambient orbs for layered depth effect
  orb1: {
    position: 'fixed',
    top: '-15%',
    right: '-5%',
    width: '50%',
    height: '50%',
    background: `radial-gradient(circle, ${brandColors.orb.blue} 0%, transparent 70%)`,
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
    animation: 'pulse-subtle 8s ease-in-out infinite',
  },

  orb2: {
    position: 'fixed',
    bottom: '-20%',
    left: '-10%',
    width: '45%',
    height: '45%',
    background: `radial-gradient(circle, ${brandColors.orb.purple} 0%, transparent 70%)`,
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
    animation: 'pulse-subtle 10s ease-in-out infinite',
  },

  orb3: {
    position: 'fixed',
    top: '40%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '60%',
    height: '40%',
    background: `radial-gradient(ellipse, rgba(99, 102, 241, 0.04) 0%, transparent 60%)`,
    zIndex: 0,
    pointerEvents: 'none',
  },

  content: {
    width: '100%',
    maxWidth: '420px',
    position: 'relative',
    zIndex: 10,
    animation: `fade-in-up ${animationTiming.smooth}ms ${animationTiming.easeOut}`,
  },

  backButton: {
    position: 'absolute',
    top: '-56px',
    left: '0',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: brandColors.text.secondary,
    backgroundColor: brandColors.glass.background,
    backdropFilter: brandColors.glass.blur,
    WebkitBackdropFilter: brandColors.glass.blur,
    border: `1px solid ${brandColors.glass.border}`,
    borderRadius: '12px',
    cursor: 'pointer',
    transition: `all ${animationTiming.standard}ms ${animationTiming.easeOut}`,
  },

  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },

  accentBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    marginBottom: '16px',
    fontSize: '12px',
    fontWeight: '600',
    color: brandColors.accent.primary,
    backgroundColor: brandColors.accent.light,
    borderRadius: '20px',
    letterSpacing: '0.02em',
  },

  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: brandColors.text.primary,
    margin: '0 0 10px 0',
    letterSpacing: '-0.025em',
    lineHeight: 1.2,
  },

  subtitle: {
    fontSize: '16px',
    color: brandColors.text.secondary,
    margin: 0,
    lineHeight: 1.5,
  },

  cardsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },

  card: {
    width: '100%',
    padding: '18px 20px',
    backgroundColor: brandColors.glass.backgroundSolid,
    backdropFilter: brandColors.glass.blur,
    WebkitBackdropFilter: brandColors.glass.blur,
    border: `1px solid ${brandColors.glass.border}`,
    borderRadius: '16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: `all ${animationTiming.standard}ms ${animationTiming.easeOut}`,
    boxShadow: brandColors.glass.shadow,
  },

  cardHovered: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },

  cardSelected: {
    borderColor: brandColors.accent.primary,
    boxShadow: `0 0 0 1px ${brandColors.accent.primary}, 0 4px 20px rgba(99, 102, 241, 0.15)`,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },

  cardContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },

  iconCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    color: brandColors.text.muted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: `all ${animationTiming.standard}ms ${animationTiming.easeOut}`,
  },

  iconCircleSelected: {
    backgroundColor: brandColors.accent.light,
    color: brandColors.accent.primary,
  },

  cardText: {
    flex: 1,
    minWidth: 0,
  },

  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: brandColors.text.primary,
    margin: '0 0 3px 0',
    letterSpacing: '-0.01em',
  },

  cardDescription: {
    fontSize: '13px',
    color: brandColors.text.secondary,
    margin: 0,
    lineHeight: 1.45,
  },

  checkCircle: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: '2px solid rgba(0, 0, 0, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: `all ${animationTiming.standard}ms ${animationTiming.easeOut}`,
    color: '#FFFFFF',
  },

  checkCircleSelected: {
    backgroundColor: brandColors.accent.primary,
    borderColor: brandColors.accent.primary,
  },

  tutorialButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    marginBottom: '12px',
    fontSize: '14px',
    fontWeight: '500',
    color: brandColors.accent.primary,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: `all ${animationTiming.standard}ms ${animationTiming.easeOut}`,
  },

  badge: {
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: brandColors.status.error,
    borderRadius: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  startButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px 24px',
    marginBottom: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
    background: brandColors.accent.gradient,
    border: 'none',
    borderRadius: '14px',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
    transition: `all ${animationTiming.standard}ms ${animationTiming.easeOut}`,
  },

  hint: {
    textAlign: 'center',
    fontSize: '13px',
    color: brandColors.text.secondary,
    margin: 0,
  },
};

export default PreInterviewSetup;
