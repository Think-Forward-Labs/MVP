/**
 * QuestionSidebar - Minimal collapsed/expanded question navigation
 *
 * Collapsed: Thin strip of numbered circles (black=answered, purple=current, grey=unanswered)
 * Expanded (on hover): Shows number + truncated question text
 */

import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { brandColors, animationTiming } from '../../styles/brandColors';

interface QuestionSidebarProps {
  questions: Array<{
    id: string;
    text: string;
    aspect?: string;
    aspect_code?: string;
  }>;
  currentIndex: number;
  furthestIndex: number;
  isAnswered: (index: number) => boolean;
  onNavigate: (index: number) => void;
}

export function QuestionSidebar({
  questions,
  currentIndex,
  furthestIndex,
  isAnswered,
  onNavigate,
}: QuestionSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll active question into view
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIndex]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setIsExpanded(true), 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setIsExpanded(false), 300);
  };

  const handleClick = (index: number) => {
    // Can only navigate to answered questions or current
    if (index <= furthestIndex) {
      onNavigate(index);
    }
  };

  const getCircleStyle = (index: number): CSSProperties => {
    const isCurrent = index === currentIndex;
    const answered = isAnswered(index);
    const reachable = index <= furthestIndex;

    if (isCurrent) {
      return {
        ...styles.circle,
        backgroundColor: brandColors.accent.primary,
        color: '#FFFFFF',
        boxShadow: `0 0 0 3px ${brandColors.accent.primary}30`,
      };
    }
    if (answered) {
      return {
        ...styles.circle,
        backgroundColor: '#18181B',
        color: '#FFFFFF',
        cursor: 'pointer',
      };
    }
    if (reachable) {
      return {
        ...styles.circle,
        backgroundColor: '#D4D4D8',
        color: '#71717A',
        cursor: 'pointer',
      };
    }
    return {
      ...styles.circle,
      backgroundColor: '#F4F4F5',
      color: '#A1A1AA',
      cursor: 'default',
    };
  };

  const truncate = (text: string, maxLen: number) =>
    text.length > maxLen ? text.substring(0, maxLen) + '...' : text;

  return (
    <div
      ref={sidebarRef}
      style={{
        ...styles.container,
        width: isExpanded ? '240px' : '52px',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={styles.inner}>
        {questions.map((question, index) => {
          const isCurrent = index === currentIndex;
          const answered = isAnswered(index);
          const reachable = index <= furthestIndex;

          return (
            <div
              key={question.id}
              ref={isCurrent ? activeRef : undefined}
              style={{
                ...styles.item,
                ...(isCurrent ? styles.itemActive : {}),
                ...(reachable ? { cursor: 'pointer' } : { cursor: 'default' }),
              }}
              onClick={() => handleClick(index)}
              title={!isExpanded ? `Q${index + 1}: ${truncate(question.text, 60)}` : undefined}
            >
              {/* Number circle */}
              <div style={getCircleStyle(index)}>
                {answered && !isCurrent ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span style={styles.circleNumber}>{index + 1}</span>
                )}
              </div>

              {/* Expanded text */}
              {isExpanded && (
                <div style={styles.textContainer}>
                  <span style={{
                    ...styles.questionLabel,
                    color: isCurrent ? brandColors.accent.primary : answered ? '#18181B' : '#A1A1AA',
                    fontWeight: isCurrent ? '600' : '400',
                  }}>
                    {question.aspect_code
                      ? `${question.aspect_code}`
                      : `Q${index + 1}`}
                  </span>
                  <span style={{
                    ...styles.questionText,
                    color: isCurrent ? '#18181B' : reachable ? '#52525B' : '#A1A1AA',
                  }}>
                    {truncate(question.text, 40)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRight: '1px solid rgba(0, 0, 0, 0.06)',
    transition: `width ${animationTiming.standard}ms ${animationTiming.easeOut}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },

  inner: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingTop: '64px', // Below header
    paddingBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    // Hide scrollbar
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },

  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '6px 10px',
    minHeight: '40px',
    flexShrink: 0,
    borderRadius: '0 8px 8px 0',
    transition: `background-color ${animationTiming.micro}ms ${animationTiming.easeOut}`,
  },

  itemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },

  circle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: `all ${animationTiming.standard}ms ${animationTiming.easeOut}`,
    fontSize: '12px',
    fontWeight: '600',
  },

  circleNumber: {
    fontSize: '12px',
    fontWeight: '600',
    lineHeight: 1,
  },

  textContainer: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    opacity: 1,
    transition: `opacity ${animationTiming.standard}ms ${animationTiming.easeOut}`,
  },

  questionLabel: {
    fontSize: '10px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  },

  questionText: {
    fontSize: '12px',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

export default QuestionSidebar;
