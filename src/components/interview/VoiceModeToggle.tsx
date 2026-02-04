/**
 * VoiceModeToggle - In-interview mode switcher
 *
 * Features:
 * - Two icons representing Review Mode and Hands-free Mode
 * - Hover tooltip showing description
 * - Click to switch modes
 * - Compact, premium UI
 */

import { useState } from 'react';
import type { CSSProperties } from 'react';

export type VoiceInterviewMode = 'review' | 'handsfree';

interface VoiceModeToggleProps {
  mode: VoiceInterviewMode;
  onModeChange: (mode: VoiceInterviewMode) => void;
  disabled?: boolean;
}

export function VoiceModeToggle({ mode, onModeChange, disabled = false }: VoiceModeToggleProps) {
  const [hoveredMode, setHoveredMode] = useState<VoiceInterviewMode | null>(null);

  const tooltipText = {
    review: 'Review Mode: Review transcript before proceeding',
    handsfree: 'Hands-free Mode: Say "next" to auto-proceed',
  };

  return (
    <div style={styles.container}>
      {/* Tooltip */}
      {hoveredMode && (
        <div style={styles.tooltip}>
          {tooltipText[hoveredMode]}
        </div>
      )}

      {/* Toggle buttons */}
      <div style={styles.toggleContainer}>
        {/* Review Mode */}
        <button
          style={{
            ...styles.toggleButton,
            ...(mode === 'review' ? styles.toggleButtonActive : {}),
            ...(disabled ? styles.toggleButtonDisabled : {}),
          }}
          onClick={() => !disabled && onModeChange('review')}
          onMouseEnter={() => setHoveredMode('review')}
          onMouseLeave={() => setHoveredMode(null)}
          disabled={disabled}
          title="Review Mode"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Hands-free Mode */}
        <button
          style={{
            ...styles.toggleButton,
            ...(mode === 'handsfree' ? styles.toggleButtonActive : {}),
            ...(disabled ? styles.toggleButtonDisabled : {}),
          }}
          onClick={() => !disabled && onModeChange('handsfree')}
          onMouseEnter={() => setHoveredMode('handsfree')}
          onMouseLeave={() => setHoveredMode(null)}
          disabled={disabled}
          title="Hands-free Mode"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <path d="M12 19v4M8 23h8" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    borderRadius: '8px',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 100,
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    border: '1px solid #E4E4E7',
  },
  toggleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    padding: 0,
    color: '#A1A1AA',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  toggleButtonActive: {
    color: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  toggleButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  divider: {
    width: '1px',
    height: '20px',
    backgroundColor: '#E4E4E7',
    margin: '0 2px',
  },
};

export default VoiceModeToggle;
