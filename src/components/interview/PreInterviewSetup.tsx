/**
 * PreInterviewSetup - Mode selection page before starting voice interview
 *
 * Features:
 * - Elegant mode selection (Review Mode vs Hands-free Mode)
 * - Watch Tutorial link (subtle for returning users)
 * - Start Interview button
 * - Premium UI consistent with DeviceCheck
 */

import { useState } from 'react';
import type { CSSProperties } from 'react';

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

  return (
    <div style={styles.container}>
      {/* Background */}
      <div style={styles.background} />
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={styles.content}>
        {/* Back button */}
        <button style={styles.backButton} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Back</span>
        </button>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </div>
          <h1 style={styles.title}>Choose Your Experience</h1>
          <p style={styles.subtitle}>
            Select how you'd like to interact with Eunice during the interview.
          </p>
        </div>

        {/* Mode Selection */}
        <div style={styles.modeContainer}>
          {/* Review Mode */}
          <button
            style={{
              ...styles.modeCard,
              ...(selectedMode === 'review' ? styles.modeCardSelected : {}),
            }}
            onClick={() => setSelectedMode('review')}
          >
            <div style={styles.modeIconContainer}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div style={styles.modeContent}>
              <div style={styles.modeHeader}>
                <h3 style={styles.modeTitle}>Review Mode</h3>
                {selectedMode === 'review' && (
                  <div style={styles.selectedBadge}>Selected</div>
                )}
              </div>
              <p style={styles.modeDescription}>
                Review your transcript after each question before moving on. Click to proceed when ready.
              </p>
              <div style={styles.modeFeatures}>
                <span style={styles.modeFeature}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Edit responses
                </span>
                <span style={styles.modeFeature}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Control pace
                </span>
              </div>
            </div>
            <div style={{
              ...styles.radioOuter,
              ...(selectedMode === 'review' ? styles.radioOuterSelected : {}),
            }}>
              {selectedMode === 'review' && <div style={styles.radioInner} />}
            </div>
          </button>

          {/* Hands-free Mode */}
          <button
            style={{
              ...styles.modeCard,
              ...(selectedMode === 'handsfree' ? styles.modeCardSelected : {}),
            }}
            onClick={() => setSelectedMode('handsfree')}
          >
            <div style={styles.modeIconContainer}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <path d="M12 19v4M8 23h8" />
              </svg>
            </div>
            <div style={styles.modeContent}>
              <div style={styles.modeHeader}>
                <h3 style={styles.modeTitle}>Hands-free Mode</h3>
                {selectedMode === 'handsfree' && (
                  <div style={styles.selectedBadge}>Selected</div>
                )}
              </div>
              <p style={styles.modeDescription}>
                Fully voice-driven. Say "next" or "I'm ready" to move between questions automatically.
              </p>
              <div style={styles.modeFeatures}>
                <span style={styles.modeFeature}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  No clicking
                </span>
                <span style={styles.modeFeature}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Faster flow
                </span>
              </div>
            </div>
            <div style={{
              ...styles.radioOuter,
              ...(selectedMode === 'handsfree' ? styles.radioOuterSelected : {}),
            }}>
              {selectedMode === 'handsfree' && <div style={styles.radioInner} />}
            </div>
          </button>
        </div>

        {/* Tutorial Link */}
        <button style={styles.tutorialLink} onClick={onWatchTutorial}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
          </svg>
          <span>Watch Tutorial</span>
          {isFirstTime && <span style={styles.recommendedBadge}>Recommended</span>}
        </button>

        {/* Start Button */}
        <button style={styles.startButton} onClick={() => onStart(selectedMode)}>
          Start Interview
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        {/* Mode tip */}
        <p style={styles.tip}>
          You can switch modes during the interview if you change your mind.
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
    backgroundColor: '#FAFAFA',
  },
  background: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F5 50%, #E8E8F0 100%)',
  },
  orb1: {
    position: 'absolute',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
    top: '-200px',
    right: '-100px',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
    bottom: '-150px',
    left: '-100px',
    pointerEvents: 'none',
  },
  content: {
    width: '100%',
    maxWidth: '520px',
    position: 'relative',
    zIndex: 1,
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    marginBottom: '32px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#71717A',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    color: '#6366F1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#18181B',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '15px',
    color: '#71717A',
    margin: 0,
    lineHeight: 1.5,
  },
  modeContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  modeCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#FFFFFF',
    border: '2px solid #E4E4E7',
    borderRadius: '16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    width: '100%',
  },
  modeCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.02)',
    boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.1)',
  },
  modeIconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#F4F4F5',
    color: '#71717A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modeContent: {
    flex: 1,
  },
  modeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  modeTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#18181B',
    margin: 0,
  },
  selectedBadge: {
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  modeDescription: {
    fontSize: '14px',
    color: '#71717A',
    margin: '0 0 10px 0',
    lineHeight: 1.4,
  },
  modeFeatures: {
    display: 'flex',
    gap: '12px',
  },
  modeFeature: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#52525B',
  },
  radioOuter: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: '2px solid #D4D4D8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
    transition: 'all 0.2s ease',
  },
  radioOuterSelected: {
    borderColor: '#6366F1',
  },
  radioInner: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#6366F1',
  },
  tutorialLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '14px 20px',
    marginBottom: '16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#52525B',
    backgroundColor: '#F4F4F5',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  recommendedBadge: {
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#10B981',
    borderRadius: '4px',
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
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
    transition: 'all 0.2s ease',
  },
  tip: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#A1A1AA',
    margin: 0,
  },
};

export default PreInterviewSetup;
