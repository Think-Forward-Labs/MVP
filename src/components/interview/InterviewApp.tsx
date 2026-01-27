import { useState, useEffect, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import type { Question, InterviewMode, InterviewAppProps } from '../../types/interview';
import { DEMO_QUESTIONS } from '../../types/interview';
import { interviewApi, voiceApi, interviewResponsesApi, type ApiQuestionResponse, type InterviewResponseItem, type AllQuestionsQuestion } from '../../services/api';

// Question Input Components
import { TextInput } from './inputs/TextInput';
import { ScaleInput } from './inputs/ScaleInput';
import { SelectInput } from './inputs/SelectInput';
import { PercentageInput } from './inputs/PercentageInput';

// Review Response Card Component
function ReviewResponseCard({
  response,
  canEdit,
  onSave
}: {
  response: InterviewResponseItem;
  canEdit: boolean;
  onSave: (text: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(response.text);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editText === response.text) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    await onSave(editText);
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div style={reviewCardStyles.card}>
      <div style={reviewCardStyles.header}>
        <div style={reviewCardStyles.questionNumber}>Q{response.question_number}</div>
        <span style={reviewCardStyles.aspect}>{response.question_aspect}</span>
      </div>
      <p style={reviewCardStyles.questionText}>{response.question_text}</p>

      {isEditing ? (
        <div style={reviewCardStyles.editContainer}>
          <textarea
            style={reviewCardStyles.editTextarea}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
          />
          <div style={reviewCardStyles.editActions}>
            <button
              style={reviewCardStyles.cancelButton}
              onClick={() => {
                setEditText(response.text);
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
            <button
              style={{...reviewCardStyles.saveButton, opacity: isSaving ? 0.7 : 1}}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div style={reviewCardStyles.responseContainer}>
          <p style={reviewCardStyles.responseText}>{response.text}</p>
          {canEdit && (
            <button
              style={reviewCardStyles.editButton}
              onClick={() => setIsEditing(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const reviewCardStyles: Record<string, CSSProperties> = {
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #E4E4E7',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  questionNumber: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  aspect: {
    fontSize: '12px',
    color: '#71717A',
    fontWeight: '500',
  },
  questionText: {
    fontSize: '14px',
    color: '#18181B',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  responseContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  responseText: {
    flex: 1,
    fontSize: '14px',
    color: '#52525B',
    backgroundColor: '#FAFAFA',
    padding: '12px 16px',
    borderRadius: '8px',
    lineHeight: '1.6',
    margin: 0,
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#71717A',
    backgroundColor: 'transparent',
    border: '1px solid #E4E4E7',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  editContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  editTextarea: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #E4E4E7',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.6',
  },
  editActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  cancelButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#71717A',
    backgroundColor: 'transparent',
    border: '1px solid #E4E4E7',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#FFFFFF',
    backgroundColor: '#18181B',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

interface ChecklistResult {
  item_id: string;
  item_text: string;
  satisfied: boolean;
  extracted_value: string | null;
}

interface ChecklistItem {
  id: string;
  key: string;
  description: string;
}

interface InterviewState {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  interviewId: string | null;
  followupQuestion: string | null;
  isComplete: boolean;
  isSubmitted: boolean;
  showReviewMode: boolean;
  allResponses: InterviewResponseItem[];
  canEdit: boolean;
  // Checklist & merged response
  checklist: ChecklistItem[];
  checklistResults: ChecklistResult[];
  mergedResponse: string | null;
  showMergedApproval: boolean;
  // Pre-fetched questions
  allQuestions: AllQuestionsQuestion[];
  totalQuestions: number;
}

export function InterviewApp({
  initialMode = 'select',
  reviewId,
  participantId,
  onExit,
  onComplete,
}: InterviewAppProps) {
  const [mode, setMode] = useState<InterviewMode>(initialMode);
  const [state, setState] = useState<InterviewState>({
    questions: [],
    currentIndex: 0,
    answers: {},
    isLoading: false,
    error: null,
    interviewId: null,
    followupQuestion: null,
    isComplete: false,
    isSubmitted: false,
    showReviewMode: false,
    allResponses: [],
    canEdit: true,
    checklist: [],
    checklistResults: [],
    mergedResponse: null,
    showMergedApproval: false,
    allQuestions: [],
    totalQuestions: 0,
  });
  const [inputValue, setInputValue] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showTransition, setShowTransition] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [editableMergedResponse, setEditableMergedResponse] = useState<string>('');
  const [reviewingState, setReviewingState] = useState<'idle' | 'reviewing' | 'success' | 'followup'>('idle');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Use demo mode if no reviewId/participantId provided
  const isDemoMode = !reviewId || !participantId;

  // Load questions on mount
  useEffect(() => {
    if (isDemoMode) {
      // Use demo questions
      setState(prev => ({
        ...prev,
        questions: DEMO_QUESTIONS,
        isLoading: false,
      }));
    }
  }, [isDemoMode]);

  // Start interview when mode is selected (non-demo)
  const startInterview = useCallback(async (selectedMode: InterviewMode) => {
    if (isDemoMode || selectedMode === 'select') return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await interviewApi.start(
        reviewId!,
        participantId!,
        selectedMode === 'voice' ? 'voice' : 'text'
      );

      // Fetch all questions upfront
      const allQuestionsData = await interviewApi.getAllQuestions(response.id);

      // Convert to Question format and set initial state
      const questions: Question[] = allQuestionsData.questions.map(q => ({
        id: q.id,
        number: q.number,
        total: allQuestionsData.total_questions,
        aspect: q.aspect,
        aspect_code: q.aspect_code,
        text: q.text,
        type: q.type,
        options: q.options,
        scale: q.scale,
      }));

      // Start from the current question (in case of resume)
      const currentIdx = allQuestionsData.current_question - 1; // Convert 1-indexed to 0-indexed
      const currentQ = allQuestionsData.questions[currentIdx];

      setState(prev => ({
        ...prev,
        interviewId: response.id,
        isLoading: false,
        allQuestions: allQuestionsData.questions,
        totalQuestions: allQuestionsData.total_questions,
        questions,
        currentIndex: currentIdx,
        checklist: currentQ?.checklist || [],
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start interview',
      }));
    }
  }, [isDemoMode, reviewId, participantId]);

  // Fetch current question from API
  const fetchCurrentQuestion = async (interviewId: string) => {
    try {
      const response: ApiQuestionResponse = await interviewApi.getCurrentQuestion(interviewId);

      if (response.complete) {
        setState(prev => ({ ...prev, isComplete: true }));
        return;
      }

      if (response.question) {
        const question: Question = {
          id: response.question.id,
          number: response.question.number,
          total: response.question.total,
          aspect: response.question.aspect,
          aspect_code: response.question.aspect_code,
          text: response.question.text,
          type: response.question.type,
          options: response.question.options,
          scale: response.question.scale,
        };

        setState(prev => ({
          ...prev,
          questions: prev.questions.length === 0
            ? [question]
            : [...prev.questions.slice(0, prev.currentIndex), question, ...prev.questions.slice(prev.currentIndex + 1)],
          followupQuestion: response.followup || null,
          checklist: (response.question as { checklist?: ChecklistItem[] }).checklist || [],
          checklistResults: (response as { checklist_results?: ChecklistResult[] }).checklist_results || [],
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch question',
      }));
    }
  };

  // Recording timer
  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Focus input on question change
  useEffect(() => {
    if (mode === 'text' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode, state.currentIndex]);

  // Computed values
  const currentQuestion = state.questions[state.currentIndex];
  const totalQuestions = isDemoMode ? state.questions.length : (state.totalQuestions || state.questions.length);
  const progress = totalQuestions > 0 ? ((state.currentIndex + 1) / totalQuestions) * 100 : 0;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle answer submission
  const handleSubmit = async () => {
    if (!currentQuestion || !inputValue.trim()) return;

    setIsSubmitting(true);
    setReviewingState('reviewing');

    // Save answer locally
    const newAnswers = { ...state.answers, [currentQuestion.id]: inputValue };

    if (!isDemoMode && state.interviewId) {
      try {
        const result = await interviewApi.submitResponse(state.interviewId, {
          question_id: currentQuestion.id,
          text: inputValue,
          is_voice: mode === 'voice',
          is_followup: !!state.followupQuestion,
        });

        if (result.next_action === 'complete') {
          // Show success state
          setReviewingState('success');
          await new Promise(resolve => setTimeout(resolve, 800));
          setReviewingState('idle');
          setState(prev => ({ ...prev, isComplete: true, answers: newAnswers }));
          if (onComplete) onComplete(state.interviewId!);
          setIsSubmitting(false);
          return;
        }

        if (result.next_action === 'followup' && result.evaluation?.followup_question) {
          // Show brief success then transition to followup
          setReviewingState('followup');
          await new Promise(resolve => setTimeout(resolve, 600));
          setReviewingState('idle');
          setState(prev => ({
            ...prev,
            answers: newAnswers,
            followupQuestion: result.evaluation!.followup_question!,
            checklistResults: result.evaluation?.checklist_results || [],
          }));
          setInputValue('');
          setIsSubmitting(false);
          return;
        }

        // Check if we have a merged response to approve
        if (result.next_action === 'approve_merged' ||
            (result.evaluation?.merged_response && result.evaluation?.all_satisfied)) {
          // Show success then go to approval
          setReviewingState('success');
          await new Promise(resolve => setTimeout(resolve, 800));
          setReviewingState('idle');
          setState(prev => ({
            ...prev,
            answers: newAnswers,
            mergedResponse: result.evaluation!.merged_response!,
            checklistResults: result.evaluation?.checklist_results || [],
            showMergedApproval: true,
          }));
          setIsSubmitting(false);
          return;
        }

        // Move to next question (for next_question action or any unhandled case)
        // Show success state
        setReviewingState('success');
        await new Promise(resolve => setTimeout(resolve, 800));

        // Show transition animation
        setShowTransition(true);
        setReviewingState('idle');

        // Wait for transition out
        await new Promise(resolve => setTimeout(resolve, 300));

        // Use pre-fetched questions instead of fetching
        const nextIndex = state.currentIndex + 1;
        const nextQuestion = state.allQuestions[nextIndex];

        setState(prev => ({
          ...prev,
          currentIndex: nextIndex,
          answers: newAnswers,
          followupQuestion: null,
          checklist: nextQuestion?.checklist || [],
          checklistResults: [],
          mergedResponse: null,
          showMergedApproval: false,
        }));
        setInputValue('');

        // Wait a tick then show the new question with transition in
        setTimeout(() => setShowTransition(false), 50);
        setIsSubmitting(false);
        return;
      } catch (error) {
        console.error('Submit response error:', error);
        setReviewingState('idle');
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to submit response',
        }));
        setIsSubmitting(false);
        return;
      }
    } else {
      // Demo mode - just move to next question
      setShowTransition(true);
      setTimeout(() => {
        if (state.currentIndex < totalQuestions - 1) {
          setState(prev => ({
            ...prev,
            currentIndex: prev.currentIndex + 1,
            answers: newAnswers,
          }));
          setInputValue('');
        } else {
          setState(prev => ({ ...prev, isComplete: true, answers: newAnswers }));
        }
        setShowTransition(false);
      }, 300);
    }

    setIsSubmitting(false);
  };

  const handleNext = () => {
    handleSubmit();
  };

  const handlePrevious = () => {
    if (state.currentIndex > 0) {
      setShowTransition(true);
      setTimeout(() => {
        const prevIndex = state.currentIndex - 1;
        setState(prev => ({
          ...prev,
          currentIndex: prevIndex,
          followupQuestion: null,
        }));
        setInputValue(state.answers[state.questions[prevIndex]?.id] || '');
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
      setInputValue(`Voice recording (${formatTime(recordingTime)})`);
    } else {
      setIsRecording(true);
      setRecordingTime(0);
    }
  };

  const handleModeSelect = (selectedMode: InterviewMode) => {
    setMode(selectedMode);
    if (!isDemoMode) {
      startInterview(selectedMode);
    }
  };

  // Play question using TTS
  const playQuestion = async () => {
    if (!currentQuestion || isPlayingQuestion) return;

    const textToSpeak = state.followupQuestion || currentQuestion.text;

    setIsPlayingQuestion(true);

    try {
      const response = await voiceApi.textToSpeech(textToSpeak);

      // Create and play audio
      const audio = new Audio(`data:audio/${response.format};base64,${response.audio}`);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingQuestion(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlayingQuestion(false);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error('Failed to play question:', error);
      setIsPlayingQuestion(false);
    }
  };

  // Stop playing audio
  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingQuestion(false);
  };

  // Render question input based on type
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    const commonProps = {
      value: inputValue,
      onChange: setInputValue,
      onKeyDown: handleKeyDown,
      disabled: isSubmitting,
    };

    switch (currentQuestion.type) {
      case 'scale':
        return (
          <ScaleInput
            {...commonProps}
            scale={currentQuestion.scale!}
          />
        );
      case 'single_select':
        return (
          <SelectInput
            {...commonProps}
            options={currentQuestion.options || []}
            multiSelect={false}
          />
        );
      case 'multi_select':
        return (
          <SelectInput
            {...commonProps}
            options={currentQuestion.options || []}
            multiSelect={true}
            maxSelections={3}
          />
        );
      case 'percentage':
        return (
          <PercentageInput
            {...commonProps}
          />
        );
      case 'open':
      default:
        return (
          <TextInput
            ref={inputRef}
            {...commonProps}
            placeholder="Type your response here..."
          />
        );
    }
  };

  // Load responses for review mode
  const loadResponses = async () => {
    if (!state.interviewId) return;
    try {
      const data = await interviewResponsesApi.getResponses(state.interviewId);
      setState(prev => ({
        ...prev,
        allResponses: data.responses,
        canEdit: data.can_edit,
        isSubmitted: data.interview_status === 'submitted',
      }));
    } catch (error) {
      console.error('Failed to load responses:', error);
    }
  };

  // Submit interview to assessment pool
  const handleSubmitInterview = async () => {
    if (!state.interviewId) return;
    setIsSubmitting(true);
    try {
      await interviewResponsesApi.submitInterview(state.interviewId);
      setState(prev => ({ ...prev, isSubmitted: true }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to submit interview',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit a response
  const handleEditResponse = async (responseId: string, newText: string) => {
    if (!state.interviewId) return;
    try {
      await interviewResponsesApi.editResponse(state.interviewId, responseId, newText);
      // Reload responses
      await loadResponses();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update response',
      }));
    }
  };

  // Approve merged response and move to next question
  const handleApproveMerged = async () => {
    if (!state.interviewId || !currentQuestion) return;

    setIsSubmitting(true);
    try {
      const result = await interviewApi.approveMerged(
        state.interviewId,
        currentQuestion.id,
        editableMergedResponse || state.mergedResponse || ''
      );

      if (result.next_action === 'complete') {
        setState(prev => ({ ...prev, isComplete: true }));
        if (onComplete) onComplete(state.interviewId!);
      } else {
        // Show transition animation
        setShowTransition(true);

        // Wait for transition out
        await new Promise(resolve => setTimeout(resolve, 300));

        // Use pre-fetched questions instead of fetching
        const nextIndex = state.currentIndex + 1;
        const nextQuestion = state.allQuestions[nextIndex];

        setState(prev => ({
          ...prev,
          currentIndex: nextIndex,
          followupQuestion: null,
          checklist: nextQuestion?.checklist || [],
          checklistResults: [],
          mergedResponse: null,
          showMergedApproval: false,
        }));
        setInputValue('');
        setEditableMergedResponse('');

        // Wait a tick then show the new question with transition in
        setTimeout(() => setShowTransition(false), 50);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to approve response',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Merged Response Approval Screen
  if (state.showMergedApproval && state.mergedResponse && currentQuestion) {
    // Initialize editable merged response
    if (!editableMergedResponse && state.mergedResponse) {
      setEditableMergedResponse(state.mergedResponse);
    }

    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.headerTitle}>Review Your Answer</span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.progressText}>{state.currentIndex + 1} of {totalQuestions}</span>
          </div>
        </header>

        <div style={styles.progressContainer}>
          <div style={{...styles.progressBar, width: `${progress}%`}} />
        </div>

        <main style={styles.approvalMain}>
          <div style={styles.approvalContainer}>
            {/* Question context */}
            <div style={styles.approvalQuestionCard}>
              <div style={styles.categoryBadge}>
                {currentQuestion.aspect_code} · {currentQuestion.aspect}
              </div>
              <p style={styles.approvalQuestionText}>{currentQuestion.text}</p>
            </div>

            {/* Checklist results */}
            {state.checklistResults.length > 0 && (
              <div style={styles.checklistCard}>
                <h3 style={styles.checklistTitle}>Information Captured</h3>
                <div style={styles.checklistItems}>
                  {state.checklistResults.map((item) => (
                    <div key={item.item_id} style={styles.checklistItem}>
                      <div style={{
                        ...styles.checklistIcon,
                        backgroundColor: item.satisfied ? '#ECFDF5' : '#FEF2F2',
                        color: item.satisfied ? '#059669' : '#DC2626',
                      }}>
                        {item.satisfied ? (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                      <div style={styles.checklistItemContent}>
                        <span style={styles.checklistItemKey}>{item.item_text}</span>
                        {item.extracted_value && (
                          <span style={styles.checklistItemValue}>{item.extracted_value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compiled response */}
            <div style={styles.mergedResponseCard}>
              <h3 style={styles.mergedResponseTitle}>Your Compiled Answer</h3>
              <p style={styles.mergedResponseHint}>
                Review the answer below. You can edit it before approving.
              </p>
              <textarea
                style={styles.mergedResponseTextarea}
                value={editableMergedResponse || state.mergedResponse}
                onChange={(e) => setEditableMergedResponse(e.target.value)}
                rows={6}
              />
            </div>
          </div>
        </main>

        <footer style={styles.footer}>
          <button
            style={{...styles.navButton, ...styles.navButtonSecondary}}
            onClick={() => {
              setState(prev => ({ ...prev, showMergedApproval: false }));
              setEditableMergedResponse('');
            }}
          >
            Back to Question
          </button>
          <button
            style={{
              ...styles.navButton,
              ...styles.approveButton,
              opacity: isSubmitting ? 0.7 : 1,
            }}
            onClick={handleApproveMerged}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Approve & Continue'}
            {!isSubmitting && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </footer>
      </div>
    );
  }

  // Review Mode Screen
  if (state.showReviewMode && state.interviewId) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button
              style={styles.backButton}
              onClick={() => setState(prev => ({ ...prev, showReviewMode: false }))}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span style={styles.headerTitle}>Review Your Responses</span>
          </div>
        </header>

        <main style={styles.reviewMain}>
          <div style={styles.reviewContainer}>
            {state.allResponses.length === 0 ? (
              <div style={styles.emptyReview}>
                <p>Loading responses...</p>
              </div>
            ) : (
              state.allResponses.map((resp) => (
                <ReviewResponseCard
                  key={resp.id}
                  response={resp}
                  canEdit={state.canEdit && !state.isSubmitted}
                  onSave={(newText) => handleEditResponse(resp.id, newText)}
                />
              ))
            )}
          </div>
        </main>

        <footer style={styles.footer}>
          <button
            style={{...styles.navButton, ...styles.navButtonSecondary}}
            onClick={() => setState(prev => ({ ...prev, showReviewMode: false }))}
          >
            Back to Summary
          </button>
        </footer>
      </div>
    );
  }

  // Completion Screen
  if (state.isComplete) {
    return (
      <div style={styles.container}>
        <div style={styles.completionContainer}>
          {state.isSubmitted ? (
            <>
              <div style={styles.completionIcon}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="24" fill="#059669" fillOpacity="0.1"/>
                  <path d="M16 24L22 30L32 18" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 style={styles.completionTitle}>Interview Submitted</h1>
              <p style={styles.completionText}>
                Your interview has been submitted to the assessment pool. The assessment creator will be notified that your responses are ready for review.
              </p>
            </>
          ) : (
            <>
              <div style={styles.completionIcon}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="24" fill="#3B82F6" fillOpacity="0.1"/>
                  <path d="M16 24L22 30L32 18" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h1 style={styles.completionTitle}>All Questions Answered</h1>
              <p style={styles.completionText}>
                You've answered all questions. You can review and edit your responses before submitting, or submit now to finalize your interview.
              </p>
            </>
          )}

          <div style={styles.completionStats}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{Object.keys(state.answers).length || state.allResponses.length}</span>
              <span style={styles.statLabel}>Questions Answered</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{totalQuestions}</span>
              <span style={styles.statLabel}>Total Questions</span>
            </div>
          </div>

          {!state.isSubmitted && !isDemoMode && (
            <div style={styles.completionActions}>
              <button
                style={styles.reviewButton}
                onClick={() => {
                  loadResponses();
                  setState(prev => ({ ...prev, showReviewMode: true }));
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Review & Edit Responses
              </button>
              <button
                style={{...styles.submitButton, opacity: isSubmitting ? 0.7 : 1}}
                onClick={handleSubmitInterview}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Interview'}
              </button>
            </div>
          )}

          <button
            style={styles.completionButton}
            onClick={onExit}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Loading State
  if (state.isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading your assessment...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (state.error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#DC2626" fillOpacity="0.1"/>
              <path d="M24 16V26M24 32H24.01" stroke="#DC2626" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={styles.errorTitle}>Something went wrong</h2>
          <p style={styles.errorText}>{state.error}</p>
          <button
            style={styles.retryButton}
            onClick={() => {
              setState(prev => ({ ...prev, error: null }));
              if (mode !== 'select') startInterview(mode);
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Mode Selection Screen - Glass Effect UI
  if (mode === 'select') {
    return (
      <div style={styles.selectScreenContainer}>
        {/* Background Elements */}
        <div style={styles.selectBackground} />
        <div style={styles.selectOrb1} />
        <div style={styles.selectOrb2} />

        <div style={styles.selectContent}>
          {/* Back button */}
          <button style={styles.selectBackButton} onClick={onExit}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Back</span>
          </button>

          {/* Header with brand */}
          <header style={styles.selectHeader}>
            <div style={styles.brandMark}>
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="url(#brandGradient)" />
                <path
                  d="M11 18L15.5 22.5L25 13"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="brandGradient" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1D1D1F" />
                    <stop offset="1" stopColor="#3A3A3C" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </header>

          {/* Welcome Section */}
          <div style={styles.selectWelcome}>
            <h1 style={styles.selectTitle}>Start your assessment</h1>
            <p style={styles.selectSubtitle}>
              Choose how you'd like to complete this interview. Take your time — there's no time limit.
            </p>
          </div>

          {/* Primary Actions - Glass Cards */}
          <div style={styles.selectActions}>
            <button
              style={styles.primaryAction}
              onClick={() => handleModeSelect('text')}
            >
              <div style={styles.actionIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <div style={styles.actionContent}>
                <span style={styles.actionTitle}>Text Interview</span>
                <span style={styles.actionDesc}>Type your responses at your own pace</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <button
              style={styles.secondaryAction}
              onClick={() => handleModeSelect('voice')}
            >
              <div style={styles.secondaryActionIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </div>
              <div style={styles.actionContent}>
                <span style={styles.secondaryActionTitle}>Voice Interview</span>
                <span style={styles.secondaryActionDesc}>Speak naturally, we'll transcribe</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(60, 60, 67, 0.3)' }}>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Assessment Info - Glass Card */}
          <div style={styles.selectInfoCard}>
            <div style={styles.selectInfoHeader}>
              <div style={styles.selectInfoIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <span style={styles.selectInfoTitle}>About the assessment</span>
            </div>
            <p style={styles.selectInfoText}>
              CABAS® Discovery is a standardized {isDemoMode ? '5' : '28'}-question assessment designed to evaluate your
              business readiness, adaptive capabilities, and growth potential.
            </p>
            <div style={styles.selectInfoMetrics}>
              <div style={styles.selectInfoMetric}>
                <span style={styles.selectMetricValue}>{isDemoMode ? '5' : '28'}</span>
                <span style={styles.selectMetricLabel}>Questions</span>
              </div>
              <div style={styles.selectInfoMetric}>
                <span style={styles.selectMetricValue}>{isDemoMode ? '5-8' : '18-22'}</span>
                <span style={styles.selectMetricLabel}>Minutes</span>
              </div>
              <div style={styles.selectInfoMetric}>
                <span style={styles.selectMetricValue}>{isDemoMode ? '3' : '10'}</span>
                <span style={styles.selectMetricLabel}>Categories</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No questions loaded yet
  if (!currentQuestion) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Preparing questions...</p>
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
            <span style={styles.headerTitle}>CABAS® Discovery Assessment</span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.progressText}>{state.currentIndex + 1} of {totalQuestions}</span>
          </div>
        </header>

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={{...styles.progressBar, width: `${progress}%`}} />
        </div>

        {/* Main Content */}
        <main style={styles.main}>
          {/* Reviewing Animation */}
          {reviewingState !== 'idle' && (
            <div style={styles.reviewingContainer}>
              <div style={styles.reviewingContent}>
                {reviewingState === 'reviewing' && (
                  <>
                    <div style={styles.reviewingBars}>
                      <div style={{...styles.reviewingBar, animationDelay: '0ms'}} />
                      <div style={{...styles.reviewingBar, animationDelay: '150ms'}} />
                      <div style={{...styles.reviewingBar, animationDelay: '300ms'}} />
                      <div style={{...styles.reviewingBar, animationDelay: '450ms'}} />
                      <div style={{...styles.reviewingBar, animationDelay: '300ms'}} />
                    </div>
                    <p style={styles.reviewingText}>Reviewing your response...</p>
                  </>
                )}
                {reviewingState === 'success' && (
                  <>
                    <div style={styles.successIcon}>
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="#059669"/>
                        <path d="M10 16l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <p style={styles.reviewingText}>Response captured</p>
                  </>
                )}
                {reviewingState === 'followup' && (
                  <>
                    <div style={styles.followupIcon}>
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="16" fill="#3B82F6"/>
                        <path d="M16 10v6M16 20v2" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p style={styles.reviewingText}>One more question...</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Question Content */}
          <div style={{
            ...styles.questionContainer,
            opacity: showTransition || reviewingState !== 'idle' ? 0 : 1,
            transform: showTransition || reviewingState !== 'idle' ? 'translateY(10px)' : 'translateY(0)',
            pointerEvents: reviewingState !== 'idle' ? 'none' : 'auto',
            position: reviewingState !== 'idle' ? 'absolute' : 'relative',
          }}>
            <div style={styles.categoryBadge}>
              {currentQuestion.aspect_code} · {currentQuestion.aspect}
            </div>

            <div style={styles.questionWithPlay}>
              <div style={styles.questionTextContainer}>
                {state.followupQuestion ? (
                  <div style={styles.followupContainer}>
                    <p style={styles.followupLabel}>Follow-up question:</p>
                    <h2 style={styles.questionText}>{state.followupQuestion}</h2>
                  </div>
                ) : (
                  <h2 style={styles.questionText}>{currentQuestion.text}</h2>
                )}
              </div>
              <button
                style={{
                  ...styles.playButton,
                  backgroundColor: isPlayingQuestion ? '#18181B' : '#F4F4F5',
                  color: isPlayingQuestion ? '#FFFFFF' : '#18181B',
                }}
                onClick={isPlayingQuestion ? stopPlaying : playQuestion}
                title={isPlayingQuestion ? 'Stop' : 'Listen to question'}
              >
                {isPlayingQuestion ? (
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

            {/* Inline Checklist Display */}
            {state.checklist.length > 0 && (
              <div style={styles.inlineChecklist}>
                <div style={styles.inlineChecklistHeader}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#71717A" strokeWidth="1.5">
                    <path d="M13 4L6 11L3 8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Key information needed:</span>
                </div>
                <div style={styles.inlineChecklistItems}>
                  {state.checklist.map((item) => {
                    const result = state.checklistResults.find(r => r.item_id === item.id);
                    const isSatisfied = result?.satisfied || false;
                    return (
                      <div
                        key={item.id}
                        style={{
                          ...styles.inlineChecklistItem,
                          backgroundColor: isSatisfied ? '#ECFDF5' : '#F4F4F5',
                          borderColor: isSatisfied ? '#D1FAE5' : '#E4E4E7',
                        }}
                      >
                        <span style={{
                          ...styles.inlineChecklistIcon,
                          color: isSatisfied ? '#059669' : '#A1A1AA',
                        }}>
                          {isSatisfied ? (
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="8" cy="8" r="5"/>
                            </svg>
                          )}
                        </span>
                        <span style={{
                          ...styles.inlineChecklistText,
                          color: isSatisfied ? '#059669' : '#52525B',
                        }}>
                          {item.key}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={styles.inputContainer}>
              {renderQuestionInput()}
              <div style={styles.inputFooter}>
                <span style={styles.inputHint}>
                  <kbd style={styles.kbd}>⌘</kbd>
                  <kbd style={styles.kbd}>↵</kbd>
                  <span style={styles.hintText}>to continue</span>
                </span>
                {currentQuestion.type === 'open' && (
                  <span style={styles.charCount}>{inputValue.length} characters</span>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer Navigation */}
        <footer style={styles.footer}>
          <button
            style={{...styles.navButton, ...styles.navButtonSecondary}}
            onClick={handlePrevious}
            disabled={state.currentIndex === 0 || isSubmitting}
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
              opacity: inputValue.trim() && !isSubmitting ? 1 : 0.5
            }}
            onClick={handleNext}
            disabled={!inputValue.trim() || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (state.currentIndex === totalQuestions - 1 ? 'Complete' : 'Continue')}
            {!isSubmitting && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 12l4-4-4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
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
            <span style={styles.headerTitle}>CABAS® Discovery Assessment</span>
            <span style={styles.voiceBadge}>
              <span style={styles.voiceDot} />
              Voice Mode
            </span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.progressText}>{state.currentIndex + 1} of {totalQuestions}</span>
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
            <div style={styles.categoryBadge}>
              {currentQuestion.aspect_code} · {currentQuestion.aspect}
            </div>

            {/* Question with audio control */}
            <div style={styles.questionWithAudio}>
              <h2 style={styles.questionTextVoice}>
                {state.followupQuestion || currentQuestion.text}
              </h2>
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

            {inputValue && (
              <div style={styles.savedIndicator}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="2">
                  <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Response recorded
              </div>
            )}
          </div>
        </main>

        {/* Footer Navigation */}
        <footer style={styles.footer}>
          <button
            style={{...styles.navButton, ...styles.navButtonSecondary}}
            onClick={handlePrevious}
            disabled={state.currentIndex === 0}
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
              opacity: inputValue ? 1 : 0.5
            }}
            onClick={handleNext}
            disabled={!inputValue}
          >
            {state.currentIndex === totalQuestions - 1 ? 'Complete' : 'Continue'}
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

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #E4E4E7',
    borderTopColor: '#18181B',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#71717A',
  },
  errorContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '24px',
  },
  errorIcon: {
    marginBottom: '8px',
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
  },
  errorText: {
    fontSize: '14px',
    color: '#71717A',
    textAlign: 'center',
    maxWidth: '400px',
  },
  retryButton: {
    marginTop: '16px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#18181B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },

  // Completion Screen
  completionContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    maxWidth: '500px',
    margin: '0 auto',
    textAlign: 'center',
  },
  completionIcon: {
    marginBottom: '24px',
  },
  completionTitle: {
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '12px',
    letterSpacing: '-0.02em',
  },
  completionText: {
    fontSize: '15px',
    color: '#71717A',
    lineHeight: '1.6',
    marginBottom: '32px',
  },
  completionStats: {
    display: 'flex',
    gap: '48px',
    marginBottom: '32px',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '600',
  },
  statLabel: {
    fontSize: '13px',
    color: '#71717A',
  },
  completionButton: {
    padding: '14px 32px',
    fontSize: '15px',
    fontWeight: '500',
    backgroundColor: '#18181B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  completionActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    marginBottom: '16px',
  },
  reviewButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: '500',
    backgroundColor: '#FFFFFF',
    color: '#18181B',
    border: '1px solid #E4E4E7',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  submitButton: {
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: '500',
    backgroundColor: '#059669',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  reviewMain: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    backgroundColor: '#FAFAFA',
  },
  reviewContainer: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  emptyReview: {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#71717A',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    backgroundColor: 'transparent',
    border: '1px solid #E4E4E7',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#71717A',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#18181B',
  },

  // Mode Selection - Glass Effect UI
  selectScreenContainer: {
    minHeight: '100vh',
    backgroundColor: '#F5F5F7',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    padding: '48px 24px',
  },
  selectBackground: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #F5F5F7 0%, #E8E8ED 50%, #F5F5F7 100%)',
    zIndex: 0,
  },
  selectOrb1: {
    position: 'fixed',
    top: '-20%',
    right: '-10%',
    width: '60%',
    height: '60%',
    background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
  },
  selectOrb2: {
    position: 'fixed',
    bottom: '-30%',
    left: '-10%',
    width: '50%',
    height: '50%',
    background: 'radial-gradient(circle, rgba(88, 86, 214, 0.06) 0%, transparent 70%)',
    borderRadius: '50%',
    zIndex: 0,
    pointerEvents: 'none',
  },
  selectContent: {
    width: '100%',
    maxWidth: '480px',
    position: 'relative',
    zIndex: 1,
  },
  selectBackButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#71717A',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '32px',
  },
  selectHeader: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '40px',
  },
  brandMark: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectWelcome: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  selectTitle: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: '-0.02em',
    marginBottom: '12px',
    lineHeight: 1.2,
  },
  selectSubtitle: {
    fontSize: '15px',
    fontWeight: '400',
    color: 'rgba(60, 60, 67, 0.6)',
    lineHeight: 1.6,
    maxWidth: '380px',
    margin: '0 auto',
  },
  selectActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '32px',
  },
  primaryAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '18px 22px',
    background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
    border: 'none',
    borderRadius: '16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  secondaryAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '18px 22px',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    borderRadius: '16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  actionIcon: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    color: '#FFFFFF',
    flexShrink: 0,
  },
  actionContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  actionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: '-0.01em',
  },
  actionDesc: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  secondaryActionIcon: {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: '12px',
    color: '#1D1D1F',
    flexShrink: 0,
  },
  secondaryActionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: '-0.01em',
  },
  secondaryActionDesc: {
    fontSize: '13px',
    color: 'rgba(60, 60, 67, 0.6)',
  },
  selectInfoCard: {
    padding: '22px 24px',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
  selectInfoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
  },
  selectInfoIcon: {
    color: 'rgba(60, 60, 67, 0.6)',
  },
  selectInfoTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: '-0.01em',
  },
  selectInfoText: {
    fontSize: '13px',
    lineHeight: 1.6,
    color: 'rgba(60, 60, 67, 0.6)',
    marginBottom: '20px',
  },
  selectInfoMetrics: {
    display: 'flex',
    gap: '32px',
  },
  selectInfoMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  selectMetricValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: '-0.02em',
  },
  selectMetricLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
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
  followupContainer: {
    marginBottom: '0',
  },
  followupLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  questionText: {
    fontSize: '24px',
    fontWeight: '500',
    lineHeight: '1.4',
    marginBottom: '0',
    letterSpacing: '-0.01em',
  },
  questionWithPlay: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '32px',
    width: '100%',
  },
  questionTextContainer: {
    flex: 1,
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
    transition: 'all 0.15s ease',
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

  // Input
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E4E4E7',
    overflow: 'hidden',
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

  // Merged Response Approval Screen
  approvalMain: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    backgroundColor: '#FAFAFA',
  },
  approvalContainer: {
    maxWidth: '640px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  approvalQuestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #E4E4E7',
  },
  approvalQuestionText: {
    fontSize: '16px',
    color: '#18181B',
    lineHeight: '1.6',
    margin: 0,
    marginTop: '12px',
  },
  checklistCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #E4E4E7',
  },
  checklistTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#18181B',
    margin: 0,
    marginBottom: '16px',
  },
  checklistItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  checklistIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checklistItemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  checklistItemKey: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#18181B',
  },
  checklistItemValue: {
    fontSize: '13px',
    color: '#71717A',
    fontStyle: 'italic',
  },
  mergedResponseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #E4E4E7',
  },
  mergedResponseTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#18181B',
    margin: 0,
    marginBottom: '8px',
  },
  mergedResponseHint: {
    fontSize: '13px',
    color: '#71717A',
    margin: 0,
    marginBottom: '16px',
  },
  mergedResponseTextarea: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '14px',
    lineHeight: '1.6',
    borderRadius: '8px',
    border: '1px solid #E4E4E7',
    resize: 'vertical',
    fontFamily: 'inherit',
    minHeight: '120px',
  },
  approveButton: {
    backgroundColor: '#059669',
    color: '#FFFFFF',
  },

  // Inline Checklist in Question View
  inlineChecklist: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E4E4E7',
  },
  inlineChecklistHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#71717A',
    marginBottom: '12px',
  },
  inlineChecklistItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  inlineChecklistItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '100px',
    border: '1px solid #E4E4E7',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  inlineChecklistIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineChecklistText: {
    lineHeight: 1,
  },

  // Reviewing animation
  reviewingContainer: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    zIndex: 10,
  },
  reviewingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  reviewingBars: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    height: '48px',
  },
  reviewingBar: {
    width: '4px',
    height: '24px',
    backgroundColor: '#18181B',
    borderRadius: '2px',
    animation: 'reviewingPulse 1s ease-in-out infinite',
  },
  reviewingText: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#52525B',
    letterSpacing: '-0.01em',
  },
  successIcon: {
    animation: 'successPop 0.4s ease-out',
  },
  followupIcon: {
    animation: 'successPop 0.4s ease-out',
  },
};

// Add keyframes for animations
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes reviewingPulse {
      0%, 100% {
        height: 12px;
        opacity: 0.4;
      }
      50% {
        height: 32px;
        opacity: 1;
      }
    }
    @keyframes successPop {
      0% {
        transform: scale(0.5);
        opacity: 0;
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
  `;
  if (!document.head.querySelector('[data-interview-animations]')) {
    styleSheet.setAttribute('data-interview-animations', 'true');
    document.head.appendChild(styleSheet);
  }
}

export default InterviewApp;
