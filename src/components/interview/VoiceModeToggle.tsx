/**
 * VoiceModeToggle - Premium glassmorphism segmented control
 *
 * Design principles:
 * - Glass morphism with backdrop blur
 * - Indigo/purple accent colors (brandColors)
 * - Smooth sliding selection indicator
 * - Subtle depth and shadows
 * - Clean iconography
 */

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { brandColors, animationTiming } from '../../styles/brandColors';

export type VoiceInterviewMode = 'review' | 'handsfree';

interface VoiceModeToggleProps {
  mode: VoiceInterviewMode;
  onModeChange: (mode: VoiceInterviewMode) => void;
  disabled?: boolean;
}

export function VoiceModeToggle({ mode, onModeChange, disabled = false }: VoiceModeToggleProps) {
  const [hoveredMode, setHoveredMode] = useState<VoiceInterviewMode | null>(null);

  const tooltipText = {
    review: 'Review before proceeding',
    handsfree: 'Voice-driven flow',
  };

  return (
    <div style={styles.wrapper}>
      {/* Tooltip */}
      {hoveredMode && !disabled && (
        <div style={styles.tooltip}>
          <span style={styles.tooltipText}>{tooltipText[hoveredMode]}</span>
          <div style={styles.tooltipArrow} />
        </div>
      )}

      {/* Segmented Control */}
      <div style={{
        ...styles.container,
        ...(disabled ? styles.containerDisabled : {}),
      }}>
        {/* Sliding background indicator */}
        <div style={{
          ...styles.slider,
          transform: mode === 'handsfree' ? 'translateX(100%)' : 'translateX(0)',
        }} />

        {/* Review Mode Button */}
        <button
          style={{
            ...styles.button,
            ...(mode === 'review' ? styles.buttonActive : {}),
            ...(hoveredMode === 'review' && mode !== 'review' ? styles.buttonHovered : {}),
          }}
          onClick={() => !disabled && onModeChange('review')}
          onMouseEnter={() => setHoveredMode('review')}
          onMouseLeave={() => setHoveredMode(null)}
          disabled={disabled}
          aria-label="Review Mode"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        {/* Hands-free Mode Button */}
        <button
          style={{
            ...styles.button,
            ...(mode === 'handsfree' ? styles.buttonActive : {}),
            ...(hoveredMode === 'handsfree' && mode !== 'handsfree' ? styles.buttonHovered : {}),
          }}
          onClick={() => !disabled && onModeChange('handsfree')}
          onMouseEnter={() => setHoveredMode('handsfree')}
          onMouseLeave={() => setHoveredMode(null)}
          disabled={disabled}
          aria-label="Hands-free Mode"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  tooltip: {
    position: 'absolute',
    bottom: 'calc(100% + 10px)',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 12px',
    backgroundColor: 'rgba(29, 29, 31, 0.9)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '10px',
    whiteSpace: 'nowrap',
    zIndex: 100,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
  },

  tooltipText: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: '0.01em',
  },

  tooltipArrow: {
    position: 'absolute',
    bottom: '-5px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '10px',
    height: '10px',
    backgroundColor: 'rgba(29, 29, 31, 0.9)',
    borderRadius: '2px',
    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
  },

  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '3px',
    backgroundColor: brandColors.glass.background,
    backdropFilter: brandColors.glass.blur,
    WebkitBackdropFilter: brandColors.glass.blur,
    border: `1px solid ${brandColors.glass.border}`,
    borderRadius: '12px',
    boxShadow: brandColors.glass.shadow,
    transition: `all ${animationTiming.standard}ms ${animationTiming.easeOut}`,
  },

  containerDisabled: {
    opacity: 0.5,
    pointerEvents: 'none',
  },

  slider: {
    position: 'absolute',
    top: '3px',
    left: '3px',
    width: 'calc(50% - 3px)',
    height: 'calc(100% - 6px)',
    background: brandColors.accent.gradient,
    borderRadius: '9px',
    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
    transition: `transform ${animationTiming.standard}ms ${animationTiming.spring}`,
  },

  button: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '30px',
    padding: 0,
    color: brandColors.text.muted,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '9px',
    cursor: 'pointer',
    transition: `all ${animationTiming.micro}ms ${animationTiming.easeOut}`,
    zIndex: 1,
  },

  buttonHovered: {
    color: brandColors.text.secondary,
  },

  buttonActive: {
    color: '#FFFFFF',
  },
};

export default VoiceModeToggle;
