import { useState, useRef, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';

interface DeviceCheckProps {
  onComplete: () => void;
  onUseTextMode: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

type TestStatus = 'idle' | 'testing' | 'passed' | 'failed';

export function DeviceCheck({ onComplete, onUseTextMode, onBack, onSkip }: DeviceCheckProps) {
  const [micStatus, setMicStatus] = useState<TestStatus>('idle');
  const [speakerStatus, setSpeakerStatus] = useState<TestStatus>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Audio level monitoring
  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalizedLevel = Math.min(100, (average / 128) * 100);
      setAudioLevel(normalizedLevel);
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  }, []);

  // Start microphone test
  const startMicTest = async () => {
    setError(null);
    setMicStatus('testing');
    setRecordedBlob(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start monitoring audio levels
      startAudioLevelMonitoring(stream);

      // Start recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setIsRecording(false);
        // Stop level monitoring
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setAudioLevel(0);
        // Stop stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 3000);

    } catch (err) {
      console.error('Mic test error:', err);
      setMicStatus('failed');
      setError('Could not access microphone. Please check permissions.');
    }
  };

  // Play back recorded audio
  const playRecording = () => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const audio = new Audio(url);
    audioRef.current = audio;
    setIsPlaying(true);

    audio.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(url);
    };

    audio.play();
  };

  // Confirm mic works
  const confirmMicWorks = () => {
    setMicStatus('passed');
  };

  // Mic doesn't work
  const micDoesNotWork = () => {
    setMicStatus('failed');
    setRecordedBlob(null);
  };

  // Speaker test
  const testSpeakers = () => {
    setSpeakerStatus('testing');
    setError(null);

    // Create a simple test tone
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 440; // A4 note
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();

    // Play a short melody
    setTimeout(() => oscillator.frequency.value = 523.25, 300); // C5
    setTimeout(() => oscillator.frequency.value = 659.25, 600); // E5
    setTimeout(() => oscillator.frequency.value = 783.99, 900); // G5

    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 1200);
  };

  const confirmSpeakerWorks = () => {
    setSpeakerStatus('passed');
  };

  const speakerDoesNotWork = () => {
    setSpeakerStatus('failed');
  };

  // Retry all tests
  const retryTests = () => {
    setMicStatus('idle');
    setSpeakerStatus('idle');
    setRecordedBlob(null);
    setError(null);
  };

  // Check if can proceed
  const canProceed = micStatus === 'passed' && speakerStatus === 'passed';
  const hasFailed = micStatus === 'failed' || speakerStatus === 'failed';

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
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <path d="M8 21h8" />
              <path d="M12 17v4" />
            </svg>
          </div>
          <h1 style={styles.title}>Device Check</h1>
          <p style={styles.subtitle}>
            Let's make sure your microphone and speakers are working properly before we begin.
          </p>
          {onSkip && (
            <button style={styles.skipLink} onClick={onSkip}>
              Skip this step
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div style={styles.errorBanner}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Tests */}
        <div style={styles.testsContainer}>
          {/* Microphone Test */}
          <div style={styles.testCard}>
            <div style={styles.testHeader}>
              <div style={{
                ...styles.testIcon,
                backgroundColor: micStatus === 'passed' ? '#10B981' : micStatus === 'failed' ? '#EF4444' : '#F4F4F5',
                color: micStatus === 'passed' || micStatus === 'failed' ? '#FFFFFF' : '#71717A',
              }}>
                {micStatus === 'passed' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : micStatus === 'failed' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                    <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  </svg>
                )}
              </div>
              <div style={styles.testInfo}>
                <h3 style={styles.testTitle}>Microphone</h3>
                <p style={styles.testDesc}>
                  {micStatus === 'idle' && 'Record a short clip to test'}
                  {micStatus === 'testing' && isRecording && 'Recording... speak now'}
                  {micStatus === 'testing' && !isRecording && recordedBlob && 'Play back to verify'}
                  {micStatus === 'passed' && 'Working correctly'}
                  {micStatus === 'failed' && 'Not working'}
                </p>
              </div>
            </div>

            {/* Audio level meter */}
            {isRecording && (
              <div style={styles.levelMeterContainer}>
                <div style={styles.levelMeterBg}>
                  <div style={{
                    ...styles.levelMeterFill,
                    width: `${audioLevel}%`,
                  }} />
                </div>
                <span style={styles.levelLabel}>
                  {audioLevel > 20 ? 'Good signal' : 'Speak louder'}
                </span>
              </div>
            )}

            {/* Test actions */}
            <div style={styles.testActions}>
              {micStatus === 'idle' && (
                <button style={styles.primaryButton} onClick={startMicTest}>
                  Start Recording
                </button>
              )}

              {micStatus === 'testing' && isRecording && (
                <div style={styles.recordingIndicator}>
                  <div style={styles.recordingDot} />
                  <span>Recording (3 seconds)</span>
                </div>
              )}

              {micStatus === 'testing' && !isRecording && recordedBlob && (
                <>
                  <button
                    style={styles.secondaryButton}
                    onClick={playRecording}
                    disabled={isPlaying}
                  >
                    {isPlaying ? 'Playing...' : 'Play Recording'}
                  </button>
                  <div style={styles.confirmButtons}>
                    <button style={styles.confirmYes} onClick={confirmMicWorks}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      I can hear it
                    </button>
                    <button style={styles.confirmNo} onClick={micDoesNotWork}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                      Can't hear
                    </button>
                  </div>
                </>
              )}

              {micStatus === 'failed' && (
                <button style={styles.retryButton} onClick={startMicTest}>
                  Try Again
                </button>
              )}
            </div>
          </div>

          {/* Speaker Test */}
          <div style={styles.testCard}>
            <div style={styles.testHeader}>
              <div style={{
                ...styles.testIcon,
                backgroundColor: speakerStatus === 'passed' ? '#10B981' : speakerStatus === 'failed' ? '#EF4444' : '#F4F4F5',
                color: speakerStatus === 'passed' || speakerStatus === 'failed' ? '#FFFFFF' : '#71717A',
              }}>
                {speakerStatus === 'passed' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : speakerStatus === 'failed' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                  </svg>
                )}
              </div>
              <div style={styles.testInfo}>
                <h3 style={styles.testTitle}>Speakers</h3>
                <p style={styles.testDesc}>
                  {speakerStatus === 'idle' && 'Play a test sound to verify'}
                  {speakerStatus === 'testing' && 'Did you hear the sound?'}
                  {speakerStatus === 'passed' && 'Working correctly'}
                  {speakerStatus === 'failed' && 'Not working'}
                </p>
              </div>
            </div>

            <div style={styles.testActions}>
              {speakerStatus === 'idle' && (
                <button style={styles.primaryButton} onClick={testSpeakers}>
                  Play Test Sound
                </button>
              )}

              {speakerStatus === 'testing' && (
                <div style={styles.confirmButtons}>
                  <button style={styles.confirmYes} onClick={confirmSpeakerWorks}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Yes, I heard it
                  </button>
                  <button style={styles.confirmNo} onClick={speakerDoesNotWork}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                    No sound
                  </button>
                </div>
              )}

              {speakerStatus === 'failed' && (
                <button style={styles.retryButton} onClick={testSpeakers}>
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div style={styles.bottomActions}>
          {canProceed && (
            <button style={styles.continueButton} onClick={onComplete}>
              Continue to Interview
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}

          {hasFailed && (
            <div style={styles.failedOptions}>
              <p style={styles.failedText}>
                Having trouble? You can try again or switch to text mode.
              </p>
              <div style={styles.failedButtons}>
                <button style={styles.retryAllButton} onClick={retryTests}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 4v6h6M23 20v-6h-6" />
                    <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                  </svg>
                  Retry Tests
                </button>
                <button style={styles.textModeButton} onClick={onUseTextMode}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  Use Text Mode
                </button>
              </div>
            </div>
          )}
        </div>
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
  skipLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '16px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6366F1',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    marginBottom: '24px',
    backgroundColor: '#FEF2F2',
    borderRadius: '10px',
    color: '#DC2626',
    fontSize: '14px',
  },
  testsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '32px',
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #E4E4E7',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  testHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    marginBottom: '16px',
  },
  testIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.3s ease',
  },
  testInfo: {
    flex: 1,
  },
  testTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#18181B',
    margin: '0 0 4px 0',
  },
  testDesc: {
    fontSize: '14px',
    color: '#71717A',
    margin: 0,
  },
  levelMeterContainer: {
    marginBottom: '16px',
  },
  levelMeterBg: {
    height: '8px',
    backgroundColor: '#F4F4F5',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '6px',
  },
  levelMeterFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: '4px',
    transition: 'width 0.05s ease-out',
  },
  levelLabel: {
    fontSize: '12px',
    color: '#71717A',
  },
  testActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  primaryButton: {
    width: '100%',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  secondaryButton: {
    width: '100%',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#18181B',
    backgroundColor: '#F4F4F5',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  retryButton: {
    width: '100%',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#71717A',
    backgroundColor: 'transparent',
    border: '1px solid #E4E4E7',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  recordingIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    color: '#EF4444',
    fontSize: '14px',
    fontWeight: '500',
  },
  recordingDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#EF4444',
    animation: 'pulse 1s ease-in-out infinite',
  },
  confirmButtons: {
    display: 'flex',
    gap: '10px',
  },
  confirmYes: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#10B981',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  confirmNo: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  bottomActions: {
    marginTop: '8px',
  },
  continueButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '16px 24px',
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
  failedOptions: {
    textAlign: 'center',
  },
  failedText: {
    fontSize: '14px',
    color: '#71717A',
    marginBottom: '16px',
  },
  failedButtons: {
    display: 'flex',
    gap: '12px',
  },
  retryAllButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#18181B',
    backgroundColor: '#F4F4F5',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
  textModeButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
  },
};

export default DeviceCheck;
