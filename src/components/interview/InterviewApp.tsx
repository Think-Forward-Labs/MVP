import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Question, InterviewMode } from '../../types/interview';

// Sample questions - will be loaded from API later
const questions: Question[] = [
  { id: 1, text: "What key achievements from the past quarter are you most proud of?", category: "Performance" },
  { id: 2, text: "How would you describe your leadership approach when facing uncertainty?", category: "Leadership" },
  { id: 3, text: "What strategic initiatives do you believe should be prioritized next year?", category: "Strategy" },
  { id: 4, text: "How do you foster innovation within your team?", category: "Culture" },
  { id: 5, text: "What challenges have you encountered in cross-functional collaboration?", category: "Collaboration" },
  { id: 6, text: "How do you measure success for your direct reports?", category: "Management" },
  { id: 7, text: "What market trends concern you most about the next 12 months?", category: "Market" },
  { id: 8, text: "How do you balance short-term results with long-term strategic goals?", category: "Strategy" },
  { id: 9, text: "What aspects of company culture would you like to see evolve?", category: "Culture" },
  { id: 10, text: "How do you approach difficult conversations with stakeholders?", category: "Communication" },
  { id: 11, text: "What resources or support would help you be more effective?", category: "Development" },
  { id: 12, text: "How do you stay informed about industry developments?", category: "Learning" },
  { id: 13, text: "What's your approach to building high-performing teams?", category: "Leadership" },
  { id: 14, text: "How do you handle competing priorities from different business units?", category: "Management" },
  { id: 15, text: "What legacy do you want to leave in your current role?", category: "Vision" },
  { id: 16, text: "Is there anything else you'd like to share that we haven't covered?", category: "Open" },
];

interface InterviewAppProps {
  initialMode?: InterviewMode;
  onExit?: () => void;
}

export function InterviewApp({ initialMode = 'select', onExit }: InterviewAppProps) {
  const [mode, setMode] = useState<InterviewMode>(initialMode);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const totalQuestions = questions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  useEffect(() => {
    if (mode === 'text' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode, currentQuestion]);

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (inputValue.trim() || answers[currentQuestion]) {
      setAnswers({ ...answers, [currentQuestion]: inputValue || answers[currentQuestion] });
      setShowTransition(true);
      setTimeout(() => {
        if (currentQuestion < totalQuestions - 1) {
          setCurrentQuestion(currentQuestion + 1);
          setInputValue('');
        }
        setShowTransition(false);
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setShowTransition(true);
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1);
        setInputValue(answers[currentQuestion - 1] || '');
        setShowTransition(false);
      }, 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleNext();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setAnswers({ ...answers, [currentQuestion]: `Voice recording (${formatTime(recordingTime)})` });
    } else {
      setIsRecording(true);
      setRecordingTime(0);
    }
  };

  // Mode Selection Screen
  if (mode === 'select') {
    return (
      <div style={styles.container}>
        <div style={styles.selectContainer}>
          <div style={styles.logoContainer}>
            <div style={styles.logo}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#18181B"/>
                <path d="M10 16L14 20L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={styles.logoText}>Think Forward</span>
          </div>

          <h1 style={styles.selectTitle}>How would you like to complete this interview?</h1>
          <p style={styles.selectSubtitle}>Choose the format that works best for you. You can take your time — there's no time limit.</p>

          <div style={styles.modeCards}>
            <button
              style={styles.modeCard}
              onClick={() => setMode('text')}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#18181B';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E4E4E7';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={styles.modeIconContainer}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 style={styles.modeCardTitle}>Text Response</h3>
              <p style={styles.modeCardDesc}>Type your answers at your own pace. Edit and refine before submitting.</p>
              <div style={styles.modeCardMeta}>
                <span style={styles.metaTag}>Keyboard friendly</span>
                <span style={styles.metaTag}>~25 min</span>
              </div>
            </button>

            <button
              style={styles.modeCard}
              onClick={() => setMode('voice')}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#18181B';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E4E4E7';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={styles.modeIconContainer}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
              </div>
              <h3 style={styles.modeCardTitle}>Voice Response</h3>
              <p style={styles.modeCardDesc}>Speak your answers naturally. Questions are read aloud to you.</p>
              <div style={styles.modeCardMeta}>
                <span style={styles.metaTag}>Hands-free</span>
                <span style={styles.metaTag}>~20 min</span>
              </div>
            </button>
          </div>

          <p style={styles.questionCount}>{totalQuestions} questions · Confidential assessment</p>
        </div>
      </div>
    );
  }

  // Text Mode
  if (mode === 'text') {
    return (
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button
              style={styles.backButton}
              onClick={() => onExit ? onExit() : setMode('select')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span style={styles.headerTitle}>Think Forward Assessment</span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.progressText}>{currentQuestion + 1} of {totalQuestions}</span>
          </div>
        </header>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={{...styles.progressBar, width: `${progress}%`}} />
        </div>

        {/* Main Content */}
        <main style={styles.main}>
          <div style={{
            ...styles.questionContainer,
            opacity: showTransition ? 0 : 1,
            transform: showTransition ? 'translateY(10px)' : 'translateY(0)',
          }}>
            <div style={styles.categoryBadge}>{questions[currentQuestion].category}</div>
            <h2 style={styles.questionText}>{questions[currentQuestion].text}</h2>

            <div style={styles.inputContainer}>
              <textarea
                ref={inputRef}
                style={styles.textInput}
                placeholder="Type your response here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={6}
              />
              <div style={styles.inputFooter}>
                <span style={styles.inputHint}>
                  <kbd style={styles.kbd}>⌘</kbd>
                  <kbd style={styles.kbd}>↵</kbd>
                  <span style={styles.hintText}>to continue</span>
                </span>
                <span style={styles.charCount}>{inputValue.length} characters</span>
              </div>
            </div>
          </div>
        </main>

        {/* Footer Navigation */}
        <footer style={styles.footer}>
          <button
            style={{...styles.navButton, ...styles.navButtonSecondary}}
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Previous
          </button>
          <button
            style={{
              ...styles.navButton,
              ...styles.navButtonPrimary,
              opacity: inputValue.trim() ? 1 : 0.5
            }}
            onClick={handleNext}
            disabled={!inputValue.trim()}
          >
            {currentQuestion === totalQuestions - 1 ? 'Complete' : 'Continue'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 12l4-4-4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </footer>
      </div>
    );
  }

  // Voice Mode
  if (mode === 'voice') {
    return (
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button
              style={styles.backButton}
              onClick={() => onExit ? onExit() : setMode('select')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span style={styles.headerTitle}>Think Forward Assessment</span>
            <span style={styles.voiceBadge}>
              <span style={styles.voiceDot} />
              Voice Mode
            </span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.progressText}>{currentQuestion + 1} of {totalQuestions}</span>
          </div>
        </header>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={{...styles.progressBar, width: `${progress}%`}} />
        </div>

        {/* Main Content */}
        <main style={styles.mainVoice}>
          <div style={{
            ...styles.voiceContainer,
            opacity: showTransition ? 0 : 1,
            transform: showTransition ? 'translateY(10px)' : 'translateY(0)',
          }}>
            <div style={styles.categoryBadge}>{questions[currentQuestion].category}</div>

            {/* Question with audio control */}
            <div style={styles.questionWithAudio}>
              <h2 style={styles.questionTextVoice}>{questions[currentQuestion].text}</h2>
              <button
                style={styles.playButton}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <rect x="5" y="4" width="3" height="12" rx="1"/>
                    <rect x="12" y="4" width="3" height="12" rx="1"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6 4l10 6-10 6V4z"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Recording Interface */}
            <div style={styles.recordingSection}>
              {isRecording ? (
                <div style={styles.recordingActive}>
                  <div style={styles.waveformContainer}>
                    {[...Array(24)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          ...styles.waveBar,
                          height: `${20 + Math.random() * 40}px`,
                          animationDelay: `${i * 0.05}s`
                        }}
                      />
                    ))}
                  </div>
                  <span style={styles.recordingTime}>{formatTime(recordingTime)}</span>
                </div>
              ) : (
                <div style={styles.recordingIdle}>
                  <div style={styles.micIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="1.5">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="22"/>
                    </svg>
                  </div>
                  <p style={styles.recordingPrompt}>Press the button below to start recording</p>
                </div>
              )}

              <button
                style={{
                  ...styles.recordButton,
                  backgroundColor: isRecording ? '#DC2626' : '#18181B',
                }}
                onClick={toggleRecording}
              >
                {isRecording ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <rect x="4" y="4" width="12" height="12" rx="2"/>
                    </svg>
                    Stop Recording
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="4" fill="currentColor"/>
                    </svg>
                    Start Recording
                  </>
                )}
              </button>
            </div>

            {answers[currentQuestion] && (
              <div style={styles.savedIndicator}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="2">
                  <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Response saved
              </div>
            )}
          </div>
        </main>

        {/* Footer Navigation */}
        <footer style={styles.footer}>
          <button
            style={{...styles.navButton, ...styles.navButtonSecondary}}
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Previous
          </button>
          <button
            style={{
              ...styles.navButton,
              ...styles.navButtonPrimary,
              opacity: answers[currentQuestion] ? 1 : 0.5
            }}
            onClick={handleNext}
            disabled={!answers[currentQuestion]}
          >
            {currentQuestion === totalQuestions - 1 ? 'Complete' : 'Continue'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 12l4-4-4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </footer>
      </div>
    );
  }

  return null;
}

// Styles
const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FAFAFA',
    display: 'flex',
    flexDirection: 'column',
    color: '#18181B',
  },

  // Mode Selection
  selectContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    maxWidth: '720px',
    margin: '0 auto',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '48px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#71717A',
    letterSpacing: '-0.01em',
  },
  selectTitle: {
    fontSize: '32px',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: '12px',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
  },
  selectSubtitle: {
    fontSize: '16px',
    color: '#71717A',
    textAlign: 'center',
    marginBottom: '48px',
    maxWidth: '480px',
    lineHeight: '1.5',
  },
  modeCards: {
    display: 'flex',
    gap: '20px',
    width: '100%',
    maxWidth: '600px',
  },
  modeCard: {
    flex: 1,
    padding: '28px 24px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '12px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  modeIconContainer: {
    width: '44px',
    height: '44px',
    backgroundColor: '#F4F4F5',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#18181B',
  },
  modeCardTitle: {
    fontSize: '17px',
    fontWeight: '600',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  modeCardDesc: {
    fontSize: '14px',
    color: '#71717A',
    margin: 0,
    lineHeight: '1.5',
  },
  modeCardMeta: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px',
  },
  metaTag: {
    fontSize: '12px',
    color: '#A1A1AA',
    backgroundColor: '#F4F4F5',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  questionCount: {
    marginTop: '40px',
    fontSize: '13px',
    color: '#A1A1AA',
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #F4F4F5',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid #E4E4E7',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#71717A',
    transition: 'all 0.15s ease',
  },
  headerTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#18181B',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
  },
  progressText: {
    fontSize: '13px',
    color: '#71717A',
    fontVariantNumeric: 'tabular-nums',
  },
  voiceBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    padding: '4px 10px',
    borderRadius: '100px',
    marginLeft: '8px',
  },
  voiceDot: {
    width: '6px',
    height: '6px',
    backgroundColor: '#059669',
    borderRadius: '50%',
  },

  // Progress
  progressContainer: {
    height: '2px',
    backgroundColor: '#F4F4F5',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#18181B',
    transition: 'width 0.3s ease',
  },

  // Main Content
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
  },
  mainVoice: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
  },
  questionContainer: {
    width: '100%',
    maxWidth: '640px',
    transition: 'all 0.3s ease',
  },
  voiceContainer: {
    width: '100%',
    maxWidth: '640px',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  categoryBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#71717A',
    backgroundColor: '#F4F4F5',
    padding: '6px 10px',
    borderRadius: '4px',
    marginBottom: '20px',
  },
  questionText: {
    fontSize: '24px',
    fontWeight: '500',
    lineHeight: '1.4',
    marginBottom: '32px',
    letterSpacing: '-0.01em',
  },
  questionTextVoice: {
    fontSize: '26px',
    fontWeight: '500',
    lineHeight: '1.4',
    letterSpacing: '-0.01em',
    textAlign: 'center',
    flex: 1,
  },
  questionWithAudio: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '48px',
    width: '100%',
    justifyContent: 'center',
  },
  playButton: {
    width: '44px',
    height: '44px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    color: '#18181B',
    transition: 'all 0.15s ease',
  },

  // Input
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E4E4E7',
    overflow: 'hidden',
  },
  textInput: {
    width: '100%',
    padding: '20px',
    fontSize: '16px',
    lineHeight: '1.6',
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit',
    backgroundColor: 'transparent',
    boxSizing: 'border-box',
  },
  inputFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: '#FAFAFA',
    borderTop: '1px solid #F4F4F5',
  },
  inputHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  kbd: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 6px',
    fontSize: '11px',
    fontWeight: '500',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '4px',
    color: '#71717A',
    fontFamily: 'inherit',
  },
  hintText: {
    fontSize: '12px',
    color: '#A1A1AA',
    marginLeft: '6px',
  },
  charCount: {
    fontSize: '12px',
    color: '#A1A1AA',
  },

  // Voice Recording
  recordingSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    width: '100%',
  },
  recordingActive: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '32px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E4E4E7',
    width: '100%',
    maxWidth: '400px',
  },
  waveformContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    height: '60px',
  },
  waveBar: {
    width: '3px',
    backgroundColor: '#DC2626',
    borderRadius: '2px',
    animation: 'wave 0.8s ease-in-out infinite',
  },
  recordingTime: {
    fontSize: '24px',
    fontWeight: '600',
    fontVariantNumeric: 'tabular-nums',
    color: '#18181B',
  },
  recordingIdle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '32px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E4E4E7',
    width: '100%',
    maxWidth: '400px',
  },
  micIcon: {
    width: '64px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: '50%',
  },
  recordingPrompt: {
    fontSize: '14px',
    color: '#71717A',
    margin: 0,
  },
  recordButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 28px',
    fontSize: '15px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  savedIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
    fontSize: '14px',
    color: '#059669',
  },

  // Footer
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #F4F4F5',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: 'none',
  },
  navButtonSecondary: {
    backgroundColor: '#FFFFFF',
    color: '#71717A',
    border: '1px solid #E4E4E7',
  },
  navButtonPrimary: {
    backgroundColor: '#18181B',
    color: '#FFFFFF',
  },
};

export default InterviewApp;
