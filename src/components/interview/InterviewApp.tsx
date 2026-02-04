import { useState, useEffect, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import type { Question, InterviewMode, InterviewAppProps } from '../../types/interview';
import { DEMO_QUESTIONS } from '../../types/interview';
import { interviewApi, voiceApi, voiceAgentApi, interviewResponsesApi, authApi, type InterviewResponseItem, type AllQuestionsQuestion } from '../../services/api';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';

// Question Input Components
import { TextInput } from './inputs/TextInput';
import { ScaleInput } from './inputs/ScaleInput';
import { SelectInput } from './inputs/SelectInput';
import { PercentageInput } from './inputs/PercentageInput';

// Voice Agent Onboarding Components
import { DeviceCheck } from './DeviceCheck';
import { VoiceAgentTutorial } from './VoiceAgentTutorial';
import { PreInterviewSetup, type VoiceInterviewMode } from './PreInterviewSetup';
import { VoiceModeToggle } from './VoiceModeToggle';
import { QuestionSidebar } from './QuestionSidebar';

// Voice Agent Onboarding Flow Steps
type VoiceAgentOnboardingStep = 'device_check' | 'pre_interview_setup' | 'tutorial' | 'ready';

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
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSaveClick = () => {
    if (editText === response.text) {
      setIsEditing(false);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
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
            autoFocus
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
              onClick={handleSaveClick}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
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

      {/* Save Confirmation Dialog */}
      {showConfirm && (
        <div style={reviewCardStyles.confirmOverlay}>
          <div style={reviewCardStyles.confirmDialog}>
            <p style={reviewCardStyles.confirmText}>Save this response?</p>
            <div style={reviewCardStyles.confirmActions}>
              <button
                style={reviewCardStyles.confirmCancelBtn}
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                style={reviewCardStyles.confirmSaveBtn}
                onClick={handleConfirmSave}
              >
                Save
              </button>
            </div>
          </div>
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
  // Confirmation Dialog Styles
  confirmOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  confirmDialog: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '14px',
    padding: '20px 24px',
    minWidth: '260px',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
  },
  confirmText: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#1D1D1F',
    margin: '0 0 16px 0',
  },
  confirmActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  confirmCancelBtn: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1D1D1F',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  confirmSaveBtn: {
    flex: 1,
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#1D1D1F',
    border: 'none',
    borderRadius: '8px',
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
  // Welcome screen (after mode selection, for new assessments only)
  showWelcomeScreen: boolean;
  isNewAssessment: boolean;
  // Completion tracking
  startTime: Date | null;
}

export function InterviewApp({
  initialMode = 'select',
  reviewId,
  participantId,
  viewOnly = false,
  editMode = false,
  interviewId: providedInterviewId,
  onExit,
  onComplete,
}: InterviewAppProps) {
  const [mode, setMode] = useState<InterviewMode>(initialMode);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
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
    showWelcomeScreen: false,
    isNewAssessment: false,
    startTime: null,
  });
  const [inputValue, setInputValue] = useState<string>('');
  const [showTransition, setShowTransition] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [editableMergedResponse, setEditableMergedResponse] = useState<string>('');
  const [reviewingState, setReviewingState] = useState<'idle' | 'reviewing' | 'success' | 'followup'>('idle');
  const [, setSidebarOpen] = useState(false);
  const [furthestQuestionIndex, setFurthestQuestionIndex] = useState(0);
  const [savedResponses, setSavedResponses] = useState<Record<string, string>>({});
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Voice Agent Onboarding state
  const [voiceAgentOnboardingStep, setVoiceAgentOnboardingStep] = useState<VoiceAgentOnboardingStep | null>(null);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState<boolean | null>(null);
  const [showTutorialOption, setShowTutorialOption] = useState(false);
  const [voiceInterviewMode, setVoiceInterviewMode] = useState<VoiceInterviewMode>('review');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Voice recording hook
  const {
    isRecording,
    isConnecting: isVoiceConnecting,
    interimTranscript,
    recordingTime,
    error: voiceRecordingError,
    startRecording,
    stopRecording,
    clearTranscript,
    isSupported: isVoiceSupported,
  } = useVoiceRecording({
    onTranscriptUpdate: (text) => {
      // Update input value with transcript (including interim)
      if (mode === 'voice') {
        setInputValue(text);
      }
    },
    onError: (error) => {
      setVoiceError(error);
    },
    onRecordingStop: (finalTranscript) => {
      // Keep the final transcript in the input
      if (mode === 'voice' && finalTranscript) {
        setInputValue(finalTranscript);
      }
    },
  });

  // Voice Agent hook
  const [voiceAgentReady, setVoiceAgentReady] = useState(false);
  const [voiceAgentMergedText, setVoiceAgentMergedText] = useState('');
  const [voiceAgentSaving, setVoiceAgentSaving] = useState(false);
  const previousResponseForMergeRef = useRef<string>('');

  // Ref to hold the latest handleVoiceAgentNext for hands-free mode
  const handleVoiceAgentNextRef = useRef<(() => Promise<void>) | null>(null);

  const voiceAgent = useVoiceAgent({
    // Pass checklist items so the hook can track which items are satisfied
    // via Deepgram function calling
    checklistItems: state.checklist,
    onConversationUpdate: () => {
      // conversation updates are tracked via voiceAgent.conversationHistory
    },
    onAgentReady: (mergedTranscript) => {
      setVoiceAgentReady(true);
      // If revisiting, merge previous response with new conversation content.
      // Don't clear the ref here — onAgentReady can fire multiple times
      // as Deepgram sends chunked ConversationText messages.
      if (previousResponseForMergeRef.current) {
        const combined = previousResponseForMergeRef.current.trim() + '\n\n' + mergedTranscript.trim();
        setVoiceAgentMergedText(combined);
      } else {
        setVoiceAgentMergedText(mergedTranscript);
      }
    },
    onProceedToNext: (reason, mergedTranscript) => {
      // Hands-free mode: agent called proceed_to_next
      console.log('[VoiceAgent] Proceed to next:', { reason, mergedTranscript });
      // Update the merged text before saving
      if (mergedTranscript) {
        if (previousResponseForMergeRef.current) {
          const combined = previousResponseForMergeRef.current.trim() + '\n\n' + mergedTranscript.trim();
          setVoiceAgentMergedText(combined);
        } else {
          setVoiceAgentMergedText(mergedTranscript);
        }
      }
      // Trigger save and advance
      if (handleVoiceAgentNextRef.current) {
        handleVoiceAgentNextRef.current();
      }
    },
    onError: (err) => {
      setVoiceError(err);
    },
  });

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

  // Handle viewOnly mode - load responses directly without starting new interview
  useEffect(() => {
    if (viewOnly && providedInterviewId && !isDemoMode) {
      const loadViewOnlyResponses = async () => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
          // Load all responses for this interview
          const responsesData = await interviewResponsesApi.getResponses(providedInterviewId);

          // Also load questions if available
          const allQuestionsData = await interviewApi.getAllQuestions(providedInterviewId);
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

          setState(prev => ({
            ...prev,
            interviewId: providedInterviewId,
            questions,
            allQuestions: allQuestionsData.questions,
            totalQuestions: allQuestionsData.total_questions,
            allResponses: responsesData.responses,
            isLoading: false,
            showReviewMode: true, // Go directly to review mode
            canEdit: false, // View only, no editing
            isSubmitted: responsesData.interview_status === 'submitted',
          }));
        } catch (error) {
          console.error('Failed to load responses:', error);
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Failed to load responses',
          }));
        }
      };
      loadViewOnlyResponses();
    }
  }, [viewOnly, providedInterviewId, isDemoMode]);

  // Handle editMode - load existing interview with responses for editing (same UI as view but with edit capability)
  useEffect(() => {
    if (editMode && providedInterviewId && !isDemoMode) {
      const loadEditModeInterview = async () => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
          // Load all responses for this interview
          const responsesData = await interviewResponsesApi.getResponses(providedInterviewId);

          // Also load questions
          const allQuestionsData = await interviewApi.getAllQuestions(providedInterviewId);
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

          setState(prev => ({
            ...prev,
            interviewId: providedInterviewId,
            questions,
            allQuestions: allQuestionsData.questions,
            totalQuestions: allQuestionsData.total_questions,
            allResponses: responsesData.responses,
            isLoading: false,
            showReviewMode: true, // Show review UI (same as view mode)
            canEdit: true, // But allow editing
          }));

        } catch (error) {
          console.error('Failed to load interview for editing:', error);
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Failed to load interview',
          }));
        }
      };
      loadEditModeInterview();
    }
  }, [editMode, providedInterviewId, isDemoMode]);

  // Start interview when mode is selected (non-demo)
  const startInterview = useCallback(async (selectedMode: InterviewMode) => {
    if (isDemoMode || selectedMode === 'select') return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const backendMode = selectedMode === 'voice' ? 'voice' : selectedMode === 'voice_agent' ? 'voice_agent' : 'text';
      const response = await interviewApi.start(
        reviewId!,
        participantId!,
        backendMode as any
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

      // Fetch existing responses for resumed interviews
      let existingResponses: Record<string, string> = {};
      if (currentIdx > 0) {
        try {
          const responsesData = await interviewResponsesApi.getResponses(response.id);
          // Map responses by question_id
          responsesData.responses.forEach(r => {
            existingResponses[r.question_id] = r.text;
          });
        } catch (e) {
          console.warn('Could not fetch existing responses:', e);
        }
      }

      // Determine if this is a new assessment (not resumed)
      const isNewAssessment = currentIdx === 0;

      setState(prev => ({
        ...prev,
        interviewId: response.id,
        isLoading: false,
        allQuestions: allQuestionsData.questions,
        totalQuestions: allQuestionsData.total_questions,
        questions,
        currentIndex: currentIdx,
        checklist: currentQ?.checklist || [],
        startTime: prev.startTime || new Date(), // Track when interview started
        showWelcomeScreen: isNewAssessment, // Only show welcome for new assessments
        isNewAssessment,
      }));

      // Initialize saved responses with existing answers
      setSavedResponses(existingResponses);

      // Initialize furthest question index for resumed interviews
      // All questions before current are considered answered
      setFurthestQuestionIndex(currentIdx);

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start interview',
      }));
    }
  }, [isDemoMode, reviewId, participantId]);

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

        // Handle "stay" action - re-answered a previous question
        // Backend didn't advance progress, but we still navigate to next question in sequence
        if (result.next_action === 'stay') {
          setReviewingState('success');
          await new Promise(resolve => setTimeout(resolve, 800));

          // Show transition animation
          setShowTransition(true);
          setReviewingState('idle');

          // Wait for transition out
          await new Promise(resolve => setTimeout(resolve, 300));

          // Move to next question in sequence (but don't update furthestQuestionIndex)
          const nextIndex = state.currentIndex + 1;
          const nextQuestion = state.allQuestions[nextIndex];

          // Save the response for this question
          setSavedResponses(prev => ({ ...prev, [currentQuestion.id]: inputValue }));

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
          // Load saved response for next question if it exists
          setInputValue(savedResponses[nextQuestion?.id] || '');

          setTimeout(() => setShowTransition(false), 50);
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

        // Save the response for this question
        setSavedResponses(prev => ({ ...prev, [currentQuestion.id]: inputValue }));

        // Update furthest question index if we're moving forward
        if (nextIndex > furthestQuestionIndex) {
          setFurthestQuestionIndex(nextIndex);
        }

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
        // Load saved response for next question if it exists, otherwise clear
        setInputValue(savedResponses[nextQuestion?.id] || '');

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
      // Save response for current question
      if (currentQuestion) {
        setSavedResponses(prev => ({ ...prev, [currentQuestion.id]: inputValue }));
      }

      setShowTransition(true);
      setTimeout(() => {
        if (state.currentIndex < totalQuestions - 1) {
          const nextIndex = state.currentIndex + 1;
          const nextQuestion = state.questions[nextIndex];

          // Update furthest question index
          if (nextIndex > furthestQuestionIndex) {
            setFurthestQuestionIndex(nextIndex);
          }

          setState(prev => ({
            ...prev,
            currentIndex: nextIndex,
            answers: newAnswers,
          }));
          // Load saved response for next question if exists
          setInputValue(savedResponses[nextQuestion?.id] || '');
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
      // Save current response before navigating
      if (currentQuestion && inputValue.trim()) {
        setSavedResponses(prev => ({ ...prev, [currentQuestion.id]: inputValue }));
      }

      setShowTransition(true);
      setTimeout(() => {
        const prevIndex = state.currentIndex - 1;
        const questionsArray = state.allQuestions.length > 0 ? state.allQuestions : state.questions;
        const prevQuestion = questionsArray[prevIndex];
        const prevQuestionId = prevQuestion?.id;

        // Get checklist from allQuestions if available (non-demo mode)
        const checklist = state.allQuestions[prevIndex]?.checklist || [];

        setState(prev => ({
          ...prev,
          currentIndex: prevIndex,
          followupQuestion: null,
          checklist: checklist,
          checklistResults: [],
          mergedResponse: null,
          showMergedApproval: false,
        }));

        // Load saved response for the previous question
        setInputValue(savedResponses[prevQuestionId] || state.answers[prevQuestionId] || '');
        setShowTransition(false);
      }, 300);
    }
  };

  // Navigate to a specific question from sidebar
  const navigateToQuestion = (targetIndex: number) => {
    // Can only navigate to answered questions or current unanswered
    if (targetIndex > furthestQuestionIndex) return;
    if (targetIndex === state.currentIndex) return; // Already on this question

    // Save current response before navigating (text/voice modes)
    if (currentQuestion && inputValue.trim()) {
      setSavedResponses(prev => ({ ...prev, [currentQuestion.id]: inputValue }));
    }

    // Disconnect voice agent when navigating away in voice_agent mode
    if (mode === 'voice_agent') {
      voiceAgent.disconnect();
      setVoiceAgentReady(false);
      setVoiceAgentMergedText('');
      setVoiceError(null);
      previousResponseForMergeRef.current = '';
    }

    setSidebarOpen(false);
    setShowTransition(true);

    setTimeout(() => {
      const questionsArray = state.allQuestions.length > 0 ? state.allQuestions : state.questions;
      const targetQuestion = questionsArray[targetIndex];
      const targetQuestionId = targetQuestion?.id;

      // Get checklist from allQuestions if available (non-demo mode)
      const checklist = state.allQuestions[targetIndex]?.checklist || [];

      setState(prev => ({
        ...prev,
        currentIndex: targetIndex,
        followupQuestion: null,
        checklist: checklist,
        checklistResults: [],
        mergedResponse: null,
        showMergedApproval: false,
      }));

      // Load saved response for the target question
      setInputValue(savedResponses[targetQuestionId] || state.answers[targetQuestionId] || '');

      // In voice_agent mode, pre-fill the merged text for revisited questions
      if (mode === 'voice_agent') {
        const existingResponse = savedResponses[targetQuestionId] || state.answers[targetQuestionId] || '';
        setVoiceAgentMergedText(existingResponse);
        // Mark as "ready" if there's a saved response (revisiting)
        setVoiceAgentReady(!!existingResponse);
      }

      setShowTransition(false);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleNext();
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      // Clear previous transcript when starting new recording
      clearTranscript();
      setInputValue('');
      setVoiceError(null);
      await startRecording();
    }
  };

  const handleModeSelect = async (selectedMode: InterviewMode) => {
    // For voice_agent mode, go through device check and tutorial first
    if (selectedMode === 'voice_agent') {
      setMode(selectedMode);
      setVoiceAgentOnboardingStep('device_check');
      return;
    }

    setMode(selectedMode);
    if (!isDemoMode) {
      startInterview(selectedMode);
    }
  };

  // Handle device check completion (or skip)
  const handleDeviceCheckComplete = () => {
    console.log('Device check complete, isDemoMode:', isDemoMode);
    // Go to pre-interview setup for mode selection
    setVoiceAgentOnboardingStep('pre_interview_setup');

    // Fetch tutorial completion status if not already fetched
    if (hasCompletedTutorial === null && !isDemoMode) {
      authApi.getMe()
        .then((meResponse) => {
          const tutorialCompleted = meResponse.user.preferences?.voice_agent_tutorial_completed === true;
          setHasCompletedTutorial(tutorialCompleted);
        })
        .catch((err) => {
          console.error('Failed to fetch preferences:', err);
          setHasCompletedTutorial(false);
        });
    }
  };

  // Handle pre-interview setup: start interview with selected mode
  const handlePreInterviewStart = (selectedMode: VoiceInterviewMode) => {
    setVoiceInterviewMode(selectedMode);
    setVoiceAgentOnboardingStep('ready');
    setShowTutorialOption(false);
    if (!isDemoMode) {
      startInterview('voice_agent');
    }
  };

  // Handle pre-interview setup: watch tutorial
  const handlePreInterviewTutorial = () => {
    setVoiceAgentOnboardingStep('tutorial');
  };

  // Handle pre-interview setup: go back to device check
  const handlePreInterviewBack = () => {
    setVoiceAgentOnboardingStep('device_check');
  };

  // Handle switching to text mode from device check failure
  const handleUseTextMode = () => {
    setVoiceAgentOnboardingStep(null);
    setMode('text');
    if (!isDemoMode) {
      startInterview('text');
    }
  };

  // Handle going back from device check
  const handleDeviceCheckBack = () => {
    setVoiceAgentOnboardingStep(null);
    setMode('select');
  };

  // Handle tutorial completion - go back to pre-interview setup
  const handleTutorialComplete = async () => {
    // Mark tutorial as completed in user preferences
    try {
      await authApi.updatePreferences({ voice_agent_tutorial_completed: true });
      setHasCompletedTutorial(true);
    } catch (err) {
      console.warn('Could not save tutorial completion:', err);
    }

    // Go back to pre-interview setup (user still needs to click Start)
    setVoiceAgentOnboardingStep('pre_interview_setup');
  };

  // Handle tutorial skip - go back to pre-interview setup
  const handleTutorialSkip = async () => {
    // Mark as completed even if skipped
    try {
      await authApi.updatePreferences({ voice_agent_tutorial_completed: true });
      setHasCompletedTutorial(true);
    } catch (err) {
      console.warn('Could not save tutorial completion:', err);
    }

    // Go back to pre-interview setup
    setVoiceAgentOnboardingStep('pre_interview_setup');
  };

  // Connect voice agent for the current question
  const connectVoiceAgentForQuestion = useCallback(async (previousResponse?: string) => {
    if (!state.interviewId || !currentQuestion) return;

    setVoiceAgentReady(false);
    setVoiceAgentMergedText('');
    setVoiceError(null);

    try {
      const config = await voiceAgentApi.getConfig(
        state.interviewId,
        currentQuestion.id,
        previousResponse,
        voiceInterviewMode,
      );
      await voiceAgent.connect({
        websocket_url: config.websocket_url,
        api_key: config.api_key,
        settings_message: config.settings_message,
      });
    } catch (err) {
      console.error('Failed to connect voice agent:', err);
      setVoiceError(err instanceof Error ? err.message : 'Failed to connect voice agent');
    }
  }, [state.interviewId, currentQuestion, voiceAgent, voiceInterviewMode]);

  // Get the response text for the current question (open vs structured)
  const getVoiceAgentResponseText = useCallback((): string => {
    if (!currentQuestion) return '';
    const isStructured = currentQuestion.type !== 'open';
    return isStructured ? inputValue : voiceAgentMergedText;
  }, [currentQuestion, inputValue, voiceAgentMergedText]);

  // Handle "Save" in voice agent mode — saves response without advancing
  const handleVoiceAgentSave = useCallback(async () => {
    const responseText = getVoiceAgentResponseText();
    if (!state.interviewId || !currentQuestion || !responseText.trim()) return;

    setVoiceAgentSaving(true);

    try {
      // Disconnect current session if connected
      if (voiceAgent.isConnected) {
        voiceAgent.disconnect();
      }

      // Save the session
      await voiceAgentApi.saveSession(
        state.interviewId,
        currentQuestion.id,
        responseText,
        voiceAgent.conversationHistory,
      );

      // Track saved response locally
      setSavedResponses(prev => ({
        ...prev,
        [currentQuestion.id]: responseText,
      }));

      // Clear merge ref — saved response is now the new baseline
      previousResponseForMergeRef.current = '';

      // Update furthest index to allow navigating to the next question
      const nextIdx = state.currentIndex + 1;
      setFurthestQuestionIndex(prev => Math.max(prev, nextIdx));
    } catch (err) {
      console.error('Failed to save voice session:', err);
      setVoiceError(err instanceof Error ? err.message : 'Failed to save session');
    } finally {
      setVoiceAgentSaving(false);
    }
  }, [state.interviewId, state.currentIndex, currentQuestion, getVoiceAgentResponseText, voiceAgent]);

  // Handle "Next" in voice agent mode — saves response AND advances to next question
  const handleVoiceAgentNext = useCallback(async () => {
    const responseText = getVoiceAgentResponseText();
    if (!state.interviewId || !currentQuestion || !responseText.trim()) return;

    setVoiceAgentSaving(true);

    try {
      // Disconnect current session if connected
      if (voiceAgent.isConnected) {
        voiceAgent.disconnect();
      }

      // Save the session
      const result = await voiceAgentApi.saveSession(
        state.interviewId,
        currentQuestion.id,
        responseText,
        voiceAgent.conversationHistory,
      );

      // Track saved response locally
      setSavedResponses(prev => ({
        ...prev,
        [currentQuestion.id]: responseText,
      }));

      // Clear merge ref
      previousResponseForMergeRef.current = '';

      if (result.next_action === 'complete') {
        setState(prev => ({ ...prev, isComplete: true }));
      } else {
        // Advance to next question
        const nextIdx = state.currentIndex + 1;
        setState(prev => ({
          ...prev,
          currentIndex: nextIdx,
          checklist: prev.allQuestions[nextIdx]?.checklist || [],
          followupQuestion: null,
        }));
        setFurthestQuestionIndex(prev => Math.max(prev, nextIdx));

        // Reset voice agent state for new question
        setVoiceAgentReady(false);
        setVoiceAgentMergedText('');
        setInputValue('');
      }
    } catch (err) {
      console.error('Failed to save voice session:', err);
      setVoiceError(err instanceof Error ? err.message : 'Failed to save session');
    } finally {
      setVoiceAgentSaving(false);
    }
  }, [state.interviewId, state.currentIndex, currentQuestion, getVoiceAgentResponseText, voiceAgent]);

  // Keep ref updated for hands-free mode callback
  useEffect(() => {
    handleVoiceAgentNextRef.current = handleVoiceAgentNext;
  }, [handleVoiceAgentNext]);

  // Auto-connect voice agent when question changes in voice_agent mode
  // Skip auto-connect for already-answered questions (user revisiting via sidebar)
  useEffect(() => {
    if (mode === 'voice_agent' && state.interviewId && currentQuestion && !state.isLoading && !state.showWelcomeScreen) {
      const hasExistingResponse = !!(savedResponses[currentQuestion.id] || state.answers[currentQuestion.id]);
      if (!hasExistingResponse) {
        // New question — auto-connect
        connectVoiceAgentForQuestion();
      }
      // Answered question — don't auto-connect, show pre-filled response instead
    }
    // Only re-run when question or interview changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, state.interviewId, currentQuestion?.id, state.isLoading, state.showWelcomeScreen]);

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

  // Track what we've spoken to prevent duplicates
  const lastSpokenRef = useRef<string | null>(null);

  // Auto-play TTS when question or follow-up changes in voice mode
  useEffect(() => {
    if (mode !== 'voice' || !currentQuestion || state.isLoading || isPlayingQuestion) {
      return;
    }

    // Create a unique key for what needs to be spoken
    const speakKey = state.followupQuestion
      ? `followup-${currentQuestion.id}-${state.followupQuestion.substring(0, 20)}`
      : `question-${currentQuestion.id}`;

    // Don't speak the same thing twice
    if (lastSpokenRef.current === speakKey) {
      return;
    }

    // Stop any currently playing audio first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Small delay to let the UI settle
    const timer = setTimeout(() => {
      lastSpokenRef.current = speakKey;
      playQuestion();
    }, 600);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, currentQuestion?.id, state.followupQuestion, state.isLoading, isPlayingQuestion]);

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
      console.log('[APPROVE] Starting approval for question:', currentQuestion.id);
      console.log('[APPROVE] Current state.currentIndex:', state.currentIndex);
      console.log('[APPROVE] furthestQuestionIndex:', furthestQuestionIndex);

      const result = await interviewApi.approveMerged(
        state.interviewId,
        currentQuestion.id,
        editableMergedResponse || state.mergedResponse || ''
      );

      console.log('[APPROVE] API returned:', result);
      console.log('[APPROVE] next_action:', result.next_action);

      if (result.next_action === 'complete') {
        console.log('[APPROVE] Handling COMPLETE action');
        // Save the merged response as the final response for this question
        if (currentQuestion) {
          setSavedResponses(prev => ({
            ...prev,
            [currentQuestion.id]: editableMergedResponse || state.mergedResponse || ''
          }));
        }
        setState(prev => ({ ...prev, isComplete: true }));
        if (onComplete) onComplete(state.interviewId!);
      } else if (result.next_action === 'stay') {
        console.log('[APPROVE] Handling STAY action');
        // Approved a previous question (via sidebar) - navigate to next in sequence
        if (currentQuestion) {
          setSavedResponses(prev => ({
            ...prev,
            [currentQuestion.id]: editableMergedResponse || state.mergedResponse || ''
          }));
        }

        // Show transition animation
        setShowTransition(true);

        // Wait for transition out
        await new Promise(resolve => setTimeout(resolve, 300));

        // Move to next question in sequence (but don't update furthestQuestionIndex)
        const nextIndex = state.currentIndex + 1;
        const nextQuestion = state.allQuestions[nextIndex];

        console.log('[APPROVE STAY] state.currentIndex:', state.currentIndex);
        console.log('[APPROVE STAY] nextIndex:', nextIndex);
        console.log('[APPROVE STAY] nextQuestion:', nextQuestion?.id);

        setState(prev => {
          console.log('[APPROVE STAY] setState prev.currentIndex:', prev.currentIndex);
          console.log('[APPROVE STAY] Setting currentIndex to:', nextIndex);
          return {
            ...prev,
            currentIndex: nextIndex,
            followupQuestion: null,
            checklist: nextQuestion?.checklist || [],
            checklistResults: [],
            mergedResponse: null,
            showMergedApproval: false,
          };
        });
        // Load saved response for next question if it exists
        setInputValue(savedResponses[nextQuestion?.id] || '');
        setEditableMergedResponse('');

        console.log('[APPROVE STAY] Navigation complete');
        setTimeout(() => setShowTransition(false), 50);
      } else {
        console.log('[APPROVE] Handling NEXT_QUESTION action (else branch)');
        // next_question - Save and move to next
        if (currentQuestion) {
          setSavedResponses(prev => ({
            ...prev,
            [currentQuestion.id]: editableMergedResponse || state.mergedResponse || ''
          }));
        }

        // Show transition animation
        setShowTransition(true);

        // Wait for transition out
        await new Promise(resolve => setTimeout(resolve, 300));

        // Use pre-fetched questions instead of fetching
        const nextIndex = state.currentIndex + 1;
        const nextQuestion = state.allQuestions[nextIndex];

        console.log('[APPROVE NEXT] state.currentIndex:', state.currentIndex);
        console.log('[APPROVE NEXT] nextIndex:', nextIndex);
        console.log('[APPROVE NEXT] nextQuestion:', nextQuestion?.id);
        console.log('[APPROVE NEXT] furthestQuestionIndex:', furthestQuestionIndex);

        // Update furthest question index if we're moving forward
        if (nextIndex > furthestQuestionIndex) {
          console.log('[APPROVE NEXT] Updating furthestQuestionIndex to:', nextIndex);
          setFurthestQuestionIndex(nextIndex);
        }

        setState(prev => {
          console.log('[APPROVE NEXT] setState prev.currentIndex:', prev.currentIndex);
          console.log('[APPROVE NEXT] Setting currentIndex to:', nextIndex);
          return {
            ...prev,
            currentIndex: nextIndex,
            followupQuestion: null,
            checklist: nextQuestion?.checklist || [],
            checklistResults: [],
            mergedResponse: null,
            showMergedApproval: false,
          };
        });
        // Load saved response for next question if it exists, otherwise clear
        setInputValue(savedResponses[nextQuestion?.id] || '');
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
        <header style={{
          ...styles.header,
          justifyContent: 'space-between',
        }}>
          <div style={styles.headerLeft}>
            <button
              style={styles.backButton}
              onClick={() => {
                if (viewOnly || editMode) {
                  onExit?.();
                } else {
                  setState(prev => ({ ...prev, showReviewMode: false }));
                }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span style={styles.headerTitle}>{viewOnly ? 'Your Responses' : editMode ? 'Edit Responses' : 'Review Your Responses'}</span>
          </div>

          {/* Header Right - Submit Button or Submitted Status */}
          {viewOnly && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {!state.isSubmitted ? (
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #34C759 0%, #30B350 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                  }}
                  onClick={handleSubmitInterview}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Submit Interview
                    </>
                  )}
                </button>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  background: 'rgba(52, 199, 89, 0.1)',
                  borderRadius: '8px',
                  color: '#34C759',
                  fontSize: '14px',
                  fontWeight: 500,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Submitted</span>
                </div>
              )}
            </div>
          )}
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
            onClick={() => {
              if (viewOnly || editMode) {
                onExit?.();
              } else {
                setState(prev => ({ ...prev, showReviewMode: false }));
              }
            }}
          >
            {(viewOnly || editMode) ? 'Back to Dashboard' : 'Back to Summary'}
          </button>
        </footer>
      </div>
    );
  }

  // Completion Screen - Premium Apple HIG Style
  if (state.isComplete) {
    // Calculate duration
    const durationMinutes = state.startTime
      ? Math.round((new Date().getTime() - state.startTime.getTime()) / 60000)
      : 0;
    const durationDisplay = durationMinutes > 0
      ? `${Math.floor(durationMinutes / 60) > 0 ? Math.floor(durationMinutes / 60) + 'h ' : ''}${durationMinutes % 60}m`
      : '--';
    const questionsAnswered = Object.keys(state.answers).length || state.allResponses.length || totalQuestions;
    const completionPercent = Math.round((questionsAnswered / totalQuestions) * 100);

    // Confetti colors
    const confettiColors = ['#34C759', '#007AFF', '#5856D6', '#FF9500', '#FF2D55'];

    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F7',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Background Gradient */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #F5F5F7 0%, #E8E8ED 50%, #F5F5F7 100%)',
          zIndex: 0,
        }} />

        {/* Background Orbs */}
        <div style={{
          position: 'fixed',
          top: '-20%',
          right: '-10%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(52, 199, 89, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 0,
        }} />
        <div style={{
          position: 'fixed',
          bottom: '-30%',
          left: '-10%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(0, 122, 255, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          zIndex: 0,
        }} />

        {/* Confetti Particles */}
        {state.isSubmitted && [...Array(30)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'fixed',
              top: '-20px',
              left: `${Math.random() * 100}%`,
              width: `${6 + Math.random() * 8}px`,
              height: `${6 + Math.random() * 8}px`,
              backgroundColor: confettiColors[i % confettiColors.length],
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              opacity: 0.8,
              zIndex: 2,
              animation: `confettiFall ${2.5 + Math.random() * 1.5}s linear ${Math.random() * 0.5}s forwards`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}

        {/* Main Content */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '48px 24px',
          maxWidth: '480px',
          textAlign: 'center',
        }}>
          {state.isSubmitted ? (
            <>
              {/* Animated Success Checkmark */}
              <div style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #34C759 0%, #30D158 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(52, 199, 89, 0.3)',
                marginBottom: '32px',
                animation: 'successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path
                    d="M14 24L20 30L34 16"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: 50,
                      strokeDashoffset: 0,
                      animation: 'checkDraw 0.4s ease 0.2s backwards',
                    }}
                  />
                </svg>
              </div>

              {/* Thank You Message */}
              <h1 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#1D1D1F',
                letterSpacing: '-0.02em',
                marginBottom: '12px',
                animation: 'fadeInUp 0.4s ease 0.15s backwards',
              }}>
                Thank you!
              </h1>
              <p style={{
                fontSize: '16px',
                color: 'rgba(60, 60, 67, 0.6)',
                lineHeight: 1.6,
                marginBottom: '32px',
                animation: 'fadeInUp 0.4s ease 0.25s backwards',
              }}>
                Your responses have been submitted and will help shape meaningful insights for your organization.
              </p>
            </>
          ) : (
            <>
              {/* Blue Checkmark for All Answered */}
              <div style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0, 122, 255, 0.3)',
                marginBottom: '32px',
                animation: 'successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path
                    d="M14 24L20 30L34 16"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h1 style={{
                fontSize: '28px',
                fontWeight: '600',
                color: '#1D1D1F',
                letterSpacing: '-0.02em',
                marginBottom: '12px',
                animation: 'fadeInUp 0.4s ease 0.15s backwards',
              }}>
                All Questions Answered
              </h1>
              <p style={{
                fontSize: '16px',
                color: 'rgba(60, 60, 67, 0.6)',
                lineHeight: 1.6,
                marginBottom: '32px',
                animation: 'fadeInUp 0.4s ease 0.25s backwards',
              }}>
                You've completed the assessment. Review your responses or submit now to finalize.
              </p>
            </>
          )}

          {/* Stats Card */}
          <div style={{
            display: 'flex',
            gap: '1px',
            backgroundColor: 'rgba(0, 0, 0, 0.06)',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '32px',
            width: '100%',
            animation: 'fadeInUp 0.4s ease 0.35s backwards',
          }}>
            <div style={{
              flex: 1,
              padding: '20px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span style={{ fontSize: '28px', fontWeight: '600', color: '#1D1D1F' }}>{questionsAnswered}</span>
              <span style={{ fontSize: '12px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Questions</span>
            </div>
            <div style={{
              flex: 1,
              padding: '20px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span style={{ fontSize: '28px', fontWeight: '600', color: '#1D1D1F' }}>{durationDisplay}</span>
              <span style={{ fontSize: '12px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Duration</span>
            </div>
            <div style={{
              flex: 1,
              padding: '20px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}>
              <span style={{ fontSize: '28px', fontWeight: '600', color: state.isSubmitted ? '#34C759' : '#007AFF' }}>{completionPercent}%</span>
              <span style={{ fontSize: '12px', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Complete</span>
            </div>
          </div>

          {/* Actions */}
          {!state.isSubmitted && !isDemoMode && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              marginBottom: '16px',
              animation: 'fadeInUp 0.4s ease 0.45s backwards',
            }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '16px 24px',
                  fontSize: '15px',
                  fontWeight: '500',
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(20px)',
                  color: '#1D1D1F',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
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
                style={{
                  padding: '16px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #059669 0%, #34C759 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 16px rgba(5, 150, 105, 0.25)',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
                onClick={handleSubmitInterview}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Interview'}
              </button>
            </div>
          )}

          {/* Return to Dashboard */}
          <button
            style={{
              padding: '16px 32px',
              fontSize: '15px',
              fontWeight: '600',
              background: state.isSubmitted ? 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)' : 'transparent',
              color: state.isSubmitted ? '#FFFFFF' : '#71717A',
              border: state.isSubmitted ? 'none' : '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: state.isSubmitted ? '0 4px 16px rgba(0, 0, 0, 0.15)' : 'none',
              animation: 'fadeInUp 0.4s ease 0.55s backwards',
            }}
            onClick={onExit}
          >
            Return to Dashboard
          </button>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes successPop {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes checkDraw {
            0% { stroke-dashoffset: 50; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes confettiFall {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
        `}</style>
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

  // Voice Agent Onboarding: Device Check Screen
  if (mode === 'voice_agent' && voiceAgentOnboardingStep === 'device_check') {
    return (
      <DeviceCheck
        onComplete={handleDeviceCheckComplete}
        onUseTextMode={handleUseTextMode}
        onBack={handleDeviceCheckBack}
        onSkip={handleDeviceCheckComplete}
      />
    );
  }

  // Voice Agent Onboarding: Pre-Interview Setup (Mode Selection)
  if (mode === 'voice_agent' && voiceAgentOnboardingStep === 'pre_interview_setup') {
    return (
      <PreInterviewSetup
        onStart={handlePreInterviewStart}
        onWatchTutorial={handlePreInterviewTutorial}
        onBack={handlePreInterviewBack}
        isFirstTime={hasCompletedTutorial === false}
      />
    );
  }

  // Voice Agent Onboarding: Tutorial Option for Returning Users (LEGACY - now handled by PreInterviewSetup)
  if (mode === 'voice_agent' && showTutorialOption) {
    // Redirect to pre_interview_setup
    setShowTutorialOption(false);
    setVoiceAgentOnboardingStep('pre_interview_setup');
    return null;
  }

  // Keep the old tutorial option UI as fallback (should not normally render)
  if (false && mode === 'voice_agent' && showTutorialOption) {
    return (
      <div style={styles.selectScreenContainer}>
        <div style={styles.selectBackground} />
        <div style={styles.selectOrb1} />
        <div style={styles.selectOrb2} />

        <div style={{
          ...styles.selectContent,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minHeight: '60vh',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}>
            <span style={{ fontSize: '36px', fontWeight: '600', color: '#FFFFFF' }}>E</span>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#18181B', marginBottom: '12px' }}>
            Welcome Back!
          </h2>
          <p style={{ fontSize: '15px', color: '#71717A', maxWidth: '360px', marginBottom: '32px', lineHeight: 1.6 }}>
            You've completed the tutorial before. Would you like to view it again or start the interview?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '320px' }}>
            <button
              style={{
                padding: '16px 24px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
              onClick={handleSkipTutorialForReturning}
            >
              Start Interview
            </button>
            <button
              style={{
                padding: '14px 20px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#71717A',
                backgroundColor: '#F4F4F5',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
              }}
              onClick={handleViewTutorialAgain}
            >
              View Tutorial Again
            </button>
            <button
              style={{
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: '500',
                color: '#71717A',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                marginTop: '8px',
              }}
              onClick={handleDeviceCheckBack}
            >
              Back to Mode Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Voice Agent Onboarding: Tutorial Screen
  if (mode === 'voice_agent' && voiceAgentOnboardingStep === 'tutorial') {
    return (
      <VoiceAgentTutorial
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
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
              onClick={() => handleModeSelect('voice_agent')}
            >
              <div style={{
                ...styles.secondaryActionIcon,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  <circle cx="18" cy="5" r="3" fill="white" stroke="none"/>
                  <path d="M17 5h2M18 4v2" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={styles.actionContent}>
                <span style={styles.secondaryActionTitle}>Voice Agent Interview</span>
                <span style={styles.secondaryActionDesc}>Talk naturally with Eunice, your AI guide</span>
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

  // Helper to check if a question is answered
  const isQuestionAnswered = (index: number) => {
    const q = state.allQuestions[index] || state.questions[index];
    if (!q) return false;
    return !!(savedResponses[q.id] || state.answers[q.id]);
  };

  // Welcome Screen - Apple-inspired centered layout
  if (state.showWelcomeScreen && state.isNewAssessment) {
    const estimatedMinutes = Math.ceil(totalQuestions * 0.7);

    return (
      <div style={styles.selectScreenContainer as React.CSSProperties}>
        {/* Background - same as mode selection */}
        <div style={styles.selectBackground as React.CSSProperties} />
        <div style={styles.selectOrb1 as React.CSSProperties} />
        <div style={styles.selectOrb2 as React.CSSProperties} />

        {/* Content - centered, open layout */}
        <div style={{
          width: '100%',
          maxWidth: '580px',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingTop: '60px',
        }}>
          {/* Back link - subtle, top left */}
          <button
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 0',
              fontSize: '14px',
              fontWeight: '500',
              color: 'rgba(60, 60, 67, 0.6)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
            }}
            onClick={onExit}
            onMouseOver={(e) => { e.currentTarget.style.color = '#1D1D1F'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(60, 60, 67, 0.6)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {/* Large headline */}
          <h1 style={{
            fontSize: '44px',
            fontWeight: '600',
            color: '#1D1D1F',
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            margin: '0 0 16px 0',
          }}>
            Ready when you are.
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: '17px',
            fontWeight: '400',
            color: 'rgba(60, 60, 67, 0.6)',
            lineHeight: 1.5,
            margin: '0 0 40px 0',
            maxWidth: '420px',
          }}>
            Take your time. Answer honestly. Your responses shape insights that matter.
          </p>

          {/* Stats - clean inline text */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: '48px',
            fontSize: '15px',
            color: 'rgba(60, 60, 67, 0.6)',
          }}>
            <span><strong style={{ color: '#1D1D1F', fontWeight: '600' }}>{totalQuestions}</strong> questions</span>
            <span style={{ color: 'rgba(0,0,0,0.15)' }}>·</span>
            <span><strong style={{ color: '#1D1D1F', fontWeight: '600' }}>~{estimatedMinutes}</strong> min</span>
            <span style={{ color: 'rgba(0,0,0,0.15)' }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Private
            </span>
          </div>

          {/* Primary CTA - prominent */}
          <button
            style={{
              padding: '16px 32px',
              fontSize: '17px',
              fontWeight: '600',
              color: '#FFFFFF',
              background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
            onClick={() => {
              setState(prev => ({ ...prev, showWelcomeScreen: false }));
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
            }}
          >
            Begin Assessment
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          {/* Supporting info - simple text, no card */}
          <p style={{
            marginTop: '48px',
            fontSize: '13px',
            color: 'rgba(60, 60, 67, 0.45)',
            lineHeight: 1.6,
            maxWidth: '360px',
          }}>
            Your responses are confidential. You can pause anytime and pick up where you left off.
          </p>
        </div>
      </div>
    );
  }

  // Text Mode
  if (mode === 'text') {
    return (
      <div style={{ ...styles.container, paddingLeft: '52px' }}>
        {/* Question Navigation Sidebar */}
        <QuestionSidebar
          questions={(state.allQuestions.length > 0 ? state.allQuestions : state.questions).map(q => ({
            id: q.id,
            text: q.text,
            aspect: q.aspect,
            aspect_code: q.aspect_code,
          }))}
          currentIndex={state.currentIndex}
          furthestIndex={furthestQuestionIndex}
          isAnswered={isQuestionAnswered}
          onNavigate={navigateToQuestion}
        />

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
            <button
              style={styles.exitButton}
              onClick={() => setShowExitConfirm(true)}
              title="Exit assessment"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div style={styles.exitOverlay}>
            <div style={styles.exitDialog}>
              <div style={styles.exitIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="1.5">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <h3 style={styles.exitTitle}>Exit assessment?</h3>
              <p style={styles.exitMessage}>
                Your progress is saved automatically.
              </p>
              <div style={styles.exitActions}>
                <button
                  style={styles.exitCancelButton}
                  onClick={() => setShowExitConfirm(false)}
                >
                  Continue
                </button>
                <button
                  style={styles.exitConfirmButton}
                  onClick={() => {
                    setShowExitConfirm(false);
                    onExit?.();
                  }}
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}

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
      <div style={{ ...styles.container, paddingLeft: '52px' }}>
        {/* Question Navigation Sidebar */}
        <QuestionSidebar
          questions={(state.allQuestions.length > 0 ? state.allQuestions : state.questions).map(q => ({
            id: q.id,
            text: q.text,
            aspect: q.aspect,
            aspect_code: q.aspect_code,
          }))}
          currentIndex={state.currentIndex}
          furthestIndex={furthestQuestionIndex}
          isAnswered={isQuestionAnswered}
          onNavigate={navigateToQuestion}
        />

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
            <button
              style={styles.exitButton}
              onClick={() => setShowExitConfirm(true)}
              title="Exit assessment"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div style={styles.exitOverlay}>
            <div style={styles.exitDialog}>
              <div style={styles.exitIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="1.5">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <h3 style={styles.exitTitle}>Exit assessment?</h3>
              <p style={styles.exitMessage}>
                Your progress is saved automatically.
              </p>
              <div style={styles.exitActions}>
                <button
                  style={styles.exitCancelButton}
                  onClick={() => setShowExitConfirm(false)}
                >
                  Continue
                </button>
                <button
                  style={styles.exitConfirmButton}
                  onClick={() => {
                    setShowExitConfirm(false);
                    onExit?.();
                  }}
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}

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

            {/* Voice Error Display */}
            {(voiceError || voiceRecordingError) && (
              <div style={styles.voiceError}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {voiceError || voiceRecordingError}
              </div>
            )}

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
              ) : isVoiceConnecting ? (
                <div style={styles.recordingIdle}>
                  <div style={styles.connectingSpinner} />
                  <p style={styles.recordingPrompt}>Connecting to voice service...</p>
                </div>
              ) : isPlayingQuestion ? (
                <div style={styles.recordingIdle}>
                  <div style={styles.speakingIndicator}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.5">
                      <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                    </svg>
                  </div>
                  <p style={styles.recordingPrompt}>Agent is speaking...</p>
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
                  <p style={styles.recordingPrompt}>
                    {!isVoiceSupported
                      ? 'Voice recording is not supported in this browser'
                      : 'Press the button below to start recording'}
                  </p>
                </div>
              )}

              {/* Button area - changes based on state */}
              {isRecording ? (
                // Currently recording - show stop button
                <button
                  style={{
                    ...styles.recordButton,
                    backgroundColor: '#DC2626',
                  }}
                  onClick={toggleRecording}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <rect x="4" y="4" width="12" height="12" rx="2"/>
                  </svg>
                  Stop Recording
                </button>
              ) : inputValue && !isVoiceConnecting ? (
                // Has transcript - show Re-record and Submit buttons
                <div style={styles.voiceButtonGroup}>
                  <button
                    style={styles.reRecordButton}
                    onClick={() => {
                      clearTranscript();
                      setInputValue('');
                      startRecording();
                    }}
                    disabled={isPlayingQuestion}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="22"/>
                    </svg>
                    Re-record
                  </button>
                  <button
                    style={{
                      ...styles.submitVoiceButton,
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                    onClick={handleNext}
                    disabled={isSubmitting || isPlayingQuestion}
                  >
                    {isSubmitting ? (
                      <>
                        <div style={styles.buttonSpinner} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        {state.currentIndex === totalQuestions - 1 ? 'Complete' : 'Submit'}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                // No transcript - show start recording button
                <button
                  style={{
                    ...styles.recordButton,
                    backgroundColor: '#18181B',
                    opacity: (isVoiceConnecting || isPlayingQuestion || !isVoiceSupported) ? 0.5 : 1,
                  }}
                  onClick={toggleRecording}
                  disabled={isVoiceConnecting || isPlayingQuestion || !isVoiceSupported}
                >
                  {isVoiceConnecting ? (
                    <>
                      <div style={styles.buttonSpinner} />
                      Connecting...
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
              )}
            </div>

            {/* Transcript Display */}
            <div style={styles.transcriptSection}>
              <label style={styles.transcriptLabel}>Your Response</label>
              <textarea
                style={{
                  ...styles.transcriptInput,
                  borderColor: isRecording ? '#007AFF' : '#E4E4E7',
                }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isRecording ? 'Listening...' : 'Your transcribed response will appear here. You can also edit it before submitting.'}
                rows={4}
              />
              {interimTranscript && isRecording && (
                <p style={styles.interimText}>
                  <span style={styles.interimDot} />
                  {interimTranscript}
                </p>
              )}
            </div>
          </div>
        </main>

        {/* Footer Navigation - simplified for voice mode */}
        <footer style={styles.voiceFooter}>
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
          <span style={styles.voiceFooterHint}>
            {state.currentIndex + 1} of {totalQuestions}
          </span>
        </footer>

      </div>
    );
  }

  // Voice Agent Mode
  if (mode === 'voice_agent') {
    const agentStatusLabel = (): string => {
      switch (voiceAgent.status) {
        case 'connecting': return 'Connecting...';
        case 'connected': return 'Initializing...';
        case 'listening': return 'Listening...';
        case 'agent_speaking': return 'Eunice is speaking...';
        case 'processing': return 'Processing...';
        case 'ready': return 'Ready — review and save your response';
        case 'error': return 'Connection error';
        default: return 'Disconnected';
      }
    };

    const agentStatusColor = (): string => {
      switch (voiceAgent.status) {
        case 'listening': return '#22C55E';
        case 'agent_speaking': return '#6366F1';
        case 'ready': return '#22C55E';
        case 'error': return '#DC2626';
        case 'connecting':
        case 'connected':
        case 'processing':
          return '#F59E0B';
        default: return '#71717A';
      }
    };

    return (
      <div style={{ ...styles.container, paddingLeft: '52px' }}>
        {/* Question Navigation Sidebar */}
        <QuestionSidebar
          questions={(state.allQuestions.length > 0 ? state.allQuestions : state.questions).map(q => ({
            id: q.id,
            text: q.text,
            aspect: q.aspect,
            aspect_code: q.aspect_code,
          }))}
          currentIndex={state.currentIndex}
          furthestIndex={furthestQuestionIndex}
          isAnswered={isQuestionAnswered}
          onNavigate={navigateToQuestion}
        />

        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button
              style={styles.backButton}
              onClick={() => {
                voiceAgent.disconnect();
                onExit ? onExit() : setMode('select');
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span style={styles.headerTitle}>CABAS® Discovery Assessment</span>
            <span style={{
              ...styles.voiceBadge,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              color: '#FFFFFF',
            }}>
              <span style={{ ...styles.voiceDot, background: '#FFFFFF' }} />
              Voice Agent
            </span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.progressText}>{state.currentIndex + 1} of {totalQuestions}</span>
            <button
              style={styles.exitButton}
              onClick={() => setShowExitConfirm(true)}
              title="Exit assessment"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div style={styles.exitOverlay}>
            <div style={styles.exitDialog}>
              <div style={styles.exitIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="1.5">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <h3 style={styles.exitTitle}>Exit assessment?</h3>
              <p style={styles.exitMessage}>
                Your progress is saved automatically.
              </p>
              <div style={styles.exitActions}>
                <button
                  style={styles.exitCancelButton}
                  onClick={() => setShowExitConfirm(false)}
                >
                  Continue
                </button>
                <button
                  style={styles.exitConfirmButton}
                  onClick={() => {
                    voiceAgent.disconnect();
                    setShowExitConfirm(false);
                    onExit?.();
                  }}
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div style={styles.progressContainer}>
          <div style={{...styles.progressBar, width: `${progress}%`}} />
        </div>

        {/* Main Content */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 24px 0',
          maxWidth: '720px',
          margin: '0 auto',
          width: '100%',
        }}>
          {/* Question */}
          <div style={{
            opacity: showTransition ? 0 : 1,
            transform: showTransition ? 'translateY(10px)' : 'translateY(0)',
            transition: 'opacity 0.3s, transform 0.3s',
          }}>
            <div style={styles.categoryBadge}>
              {currentQuestion.aspect_code} · {currentQuestion.aspect}
            </div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              lineHeight: '1.5',
              margin: '0 0 20px',
              color: '#18181B',
            }}>
              {currentQuestion.text}
            </h2>
          </div>

          {/* Content Area — structured vs open question */}
          {currentQuestion.type !== 'open' ? (
            /* Structured question: input component + conversation */
            <>
              {/* Structured input */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E4E4E7',
                padding: '16px',
                marginBottom: '12px',
              }}>
                {currentQuestion.type === 'scale' ? (
                  <ScaleInput
                    value={inputValue}
                    onChange={setInputValue}
                    scale={currentQuestion.scale!}
                  />
                ) : currentQuestion.type === 'single_select' ? (
                  <SelectInput
                    value={inputValue}
                    onChange={setInputValue}
                    options={currentQuestion.options || []}
                    multiSelect={false}
                  />
                ) : currentQuestion.type === 'multi_select' ? (
                  <SelectInput
                    value={inputValue}
                    onChange={setInputValue}
                    options={currentQuestion.options || []}
                    multiSelect={true}
                    maxSelections={3}
                  />
                ) : currentQuestion.type === 'percentage' ? (
                  <PercentageInput
                    value={inputValue}
                    onChange={setInputValue}
                  />
                ) : null}
              </div>

              {/* Conversation area (supplementary for structured) */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E4E4E7',
                overflow: 'hidden',
                marginBottom: '16px',
                maxHeight: '200px',
              }}>
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}>
                  {voiceAgent.conversationHistory.length === 0 ? (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#A1A1AA',
                      gap: '8px',
                      padding: '12px',
                    }}>
                      {voiceAgent.status === 'connecting' || voiceAgent.status === 'connected' ? (
                        <>
                          <div style={styles.connectingSpinner} />
                          <span style={{ fontSize: '13px' }}>Connecting to Eunice...</span>
                        </>
                      ) : voiceAgent.status === 'error' ? (
                        <>
                          <span style={{ fontSize: '13px', color: '#DC2626' }}>{voiceAgent.error || 'Connection error'}</span>
                          <button
                            style={{ padding: '4px 12px', fontSize: '12px', fontWeight: '500', backgroundColor: '#18181B', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            onClick={() => connectVoiceAgentForQuestion()}
                          >
                            Retry
                          </button>
                        </>
                      ) : !voiceAgent.isConnected ? (
                        <span style={{ fontSize: '13px' }}>Eunice can help explain the options — click Ask Eunice below</span>
                      ) : (
                        <span style={{ fontSize: '13px' }}>Eunice is reading the question...</span>
                      )}
                    </div>
                  ) : (
                    voiceAgent.conversationHistory.map((turn, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          background: turn.role === 'agent' ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#18181B',
                          color: '#FFFFFF', fontSize: '10px', fontWeight: '600',
                        }}>
                          {turn.role === 'agent' ? 'E' : 'Y'}
                        </div>
                        <div style={{ flex: 1, fontSize: '13px', lineHeight: '1.4', color: turn.role === 'agent' ? '#52525B' : '#18181B' }}>
                          {turn.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Open-ended question: conversation ↔ merged response toggle */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E4E4E7',
              overflow: 'hidden',
              marginBottom: '16px',
            }}>
              {voiceAgentReady ? (
                /* Editable merged response */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#22C55E' }}>
                      Review your response — edit if needed, then save
                    </span>
                  </div>
                  <textarea
                    style={{
                      flex: 1, minHeight: '200px', padding: '12px', fontSize: '15px', lineHeight: '1.6',
                      color: '#18181B', backgroundColor: '#FAFAFA', border: '1px solid #E4E4E7',
                      borderRadius: '8px', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                    }}
                    value={voiceAgentMergedText}
                    onChange={(e) => setVoiceAgentMergedText(e.target.value)}
                  />
                </div>
              ) : (
                /* Conversation view */
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '250px' }}>
                  {voiceAgent.conversationHistory.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA', gap: '12px' }}>
                      {voiceAgent.status === 'connecting' || voiceAgent.status === 'connected' ? (
                        <>
                          <div style={styles.connectingSpinner} />
                          <span style={{ fontSize: '14px' }}>Connecting to Eunice...</span>
                        </>
                      ) : voiceAgent.status === 'error' ? (
                        <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <span style={{ fontSize: '14px', color: '#DC2626' }}>{voiceAgent.error || 'Connection error'}</span>
                          <button
                            style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '500', backgroundColor: '#18181B', color: '#FFFFFF', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                            onClick={() => connectVoiceAgentForQuestion()}
                          >
                            Retry
                          </button>
                        </>
                      ) : (
                        <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="1.5">
                            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                            <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                          </svg>
                          <span style={{ fontSize: '14px' }}>Waiting for conversation to begin...</span>
                        </>
                      )}
                    </div>
                  ) : (
                    voiceAgent.conversationHistory.map((turn, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          background: turn.role === 'agent' ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : '#18181B',
                          color: '#FFFFFF', fontSize: '12px', fontWeight: '600',
                        }}>
                          {turn.role === 'agent' ? 'E' : 'Y'}
                        </div>
                        <div style={{ flex: 1, fontSize: '14px', lineHeight: '1.5', color: turn.role === 'agent' ? '#52525B' : '#18181B', fontWeight: turn.role === 'user' ? '500' : '400' }}>
                          <span style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: turn.role === 'agent' ? '#6366F1' : '#18181B', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {turn.role === 'agent' ? 'Eunice' : 'You'}
                          </span>
                          {turn.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Voice Error */}
          {voiceError && (
            <div style={{ ...styles.voiceError, marginBottom: '12px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {voiceError}
            </div>
          )}
        </main>

        {/* Footer - Agent Status + Controls */}
        <footer style={{
          padding: '12px 24px 24px',
          maxWidth: '720px',
          margin: '0 auto',
          width: '100%',
        }}>
          {/* Agent Status Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {voiceAgent.isConnected || voiceAgent.status === 'connecting' || voiceAgent.status === 'error' ? (
                <>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: agentStatusColor(),
                    boxShadow: `0 0 6px ${agentStatusColor()}40`,
                  }} />
                  <span style={{
                    fontSize: '13px',
                    color: '#71717A',
                    fontWeight: '500',
                  }}>
                    {agentStatusLabel()}
                  </span>
                </>
              ) : voiceAgentReady && !!(savedResponses[currentQuestion.id] || state.answers[currentQuestion.id]) ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <span style={{
                    fontSize: '13px',
                    color: '#22C55E',
                    fontWeight: '500',
                  }}>
                    Response saved — use sidebar to navigate
                  </span>
                </>
              ) : voiceAgentReady ? (
                <>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#22C55E',
                    boxShadow: '0 0 6px #22C55E40',
                  }} />
                  <span style={{
                    fontSize: '13px',
                    color: '#71717A',
                    fontWeight: '500',
                  }}>
                    Ready — review and save your response
                  </span>
                </>
              ) : (
                <span style={{
                  fontSize: '13px',
                  color: '#A1A1AA',
                  fontWeight: '500',
                }}>
                  Waiting...
                </span>
              )}
            </div>

            {/* Right side controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Mode Toggle */}
              <VoiceModeToggle
                mode={voiceInterviewMode}
                onModeChange={(newMode) => {
                  setVoiceInterviewMode(newMode);
                  // Reconnect with new mode if currently connected
                  if (voiceAgent.isConnected) {
                    voiceAgent.disconnect();
                    setTimeout(() => {
                      const previousResponse = savedResponses[currentQuestion.id] || state.answers[currentQuestion.id] || '';
                      connectVoiceAgentForQuestion(previousResponse || undefined);
                    }, 100);
                  }
                }}
                disabled={voiceAgentSaving}
              />

              {/* Mute/Unmute button */}
              {voiceAgent.isConnected && (
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: voiceAgent.isMuted ? '#DC2626' : '#71717A',
                    backgroundColor: voiceAgent.isMuted ? '#FEE2E2' : '#F4F4F5',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                  onClick={voiceAgent.isMuted ? voiceAgent.unmute : voiceAgent.mute}
                >
                  {voiceAgent.isMuted ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="1" y1="1" x2="23" y2="23"/>
                        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.36 2.18"/>
                      </svg>
                      Muted
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      </svg>
                      Mic On
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons — Next for forward flow, Save+Ask Eunice for revisits */}
          {(() => {
            const isStructured = currentQuestion.type !== 'open';
            const isAnsweredQuestion = !!(savedResponses[currentQuestion.id] || state.answers[currentQuestion.id]);
            const responseText = isStructured ? inputValue : voiceAgentMergedText;
            const canProceed = isStructured
              ? !!inputValue.trim()
              : (voiceAgentReady && !!voiceAgentMergedText.trim());

            if (!isAnsweredQuestion) {
              // Forward flow — "Next" button (save + advance)
              return (
                <button
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    backgroundColor: canProceed && !voiceAgentSaving ? '#18181B' : '#A1A1AA',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: canProceed && !voiceAgentSaving ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: voiceAgentSaving ? 0.7 : 1,
                    transition: 'background-color 0.2s, opacity 0.2s',
                  }}
                  onClick={handleVoiceAgentNext}
                  disabled={!canProceed || voiceAgentSaving}
                >
                  {voiceAgentSaving ? (
                    <>
                      <div style={styles.buttonSpinner} />
                      Saving...
                    </>
                  ) : state.currentIndex === totalQuestions - 1 ? (
                    <>
                      Complete Assessment
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </>
                  ) : (
                    <>
                      Next Question
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              );
            }

            // Revisiting — "Ask Eunice" + "Save" buttons
            return (
              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Ask Eunice button — when agent is not connected */}
                {!voiceAgent.isConnected && (
                  <button
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#6366F1',
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #6366F1',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s',
                    }}
                    onClick={() => {
                      const previousResponse = savedResponses[currentQuestion.id] || state.answers[currentQuestion.id] || '';
                      previousResponseForMergeRef.current = previousResponse;
                      connectVoiceAgentForQuestion(previousResponse || undefined);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/>
                      <line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                    Ask Eunice
                  </button>
                )}

                {/* Save button */}
                <button
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    backgroundColor: responseText.trim() && !voiceAgentSaving ? '#18181B' : '#A1A1AA',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: responseText.trim() && !voiceAgentSaving ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: voiceAgentSaving ? 0.7 : 1,
                    transition: 'background-color 0.2s, opacity 0.2s',
                  }}
                  onClick={handleVoiceAgentSave}
                  disabled={!responseText.trim() || voiceAgentSaving}
                >
                  {voiceAgentSaving ? (
                    <>
                      <div style={styles.buttonSpinner} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                      Save
                    </>
                  )}
                </button>
              </div>
            );
          })()}
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
    gap: '12px',
  },
  progressText: {
    fontSize: '13px',
    color: '#71717A',
    fontVariantNumeric: 'tabular-nums',
  },
  exitButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#71717A',
    transition: 'all 0.15s ease',
  },

  // Exit Confirmation Dialog - Premium Glass UI
  exitOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 250, 250, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.15s ease',
  },
  exitDialog: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderRadius: '16px',
    padding: '28px 32px',
    maxWidth: '340px',
    width: '90%',
    textAlign: 'center',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    animation: 'scaleIn 0.2s ease',
  },
  exitIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  exitTitle: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#1D1D1F',
    margin: '0 0 6px 0',
    letterSpacing: '-0.01em',
  },
  exitMessage: {
    fontSize: '13px',
    color: '#71717A',
    lineHeight: '1.5',
    margin: '0 0 20px 0',
  },
  exitActions: {
    display: 'flex',
    gap: '8px',
  },
  exitCancelButton: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#1D1D1F',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  exitConfirmButton: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    color: '#71717A',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
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
  voiceButtonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  reRecordButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#71717A',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  submitVoiceButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    fontSize: '15px',
    fontWeight: '600',
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
    marginTop: '16px',
    fontSize: '14px',
    color: '#059669',
  },
  voiceError: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#DC2626',
    marginBottom: '16px',
    width: '100%',
    maxWidth: '400px',
  },
  connectingSpinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #E4E4E7',
    borderTopColor: '#007AFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  speakingIndicator: {
    width: '64px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: '50%',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  transcriptSection: {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  transcriptLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#71717A',
  },
  transcriptInput: {
    width: '100%',
    minHeight: '100px',
    padding: '14px 16px',
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#18181B',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E4E7',
    borderRadius: '12px',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.15s ease',
    fontFamily: 'inherit',
  },
  interimText: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#71717A',
    fontStyle: 'italic',
    margin: 0,
  },
  interimDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#007AFF',
    borderRadius: '50%',
    animation: 'pulse 1s ease-in-out infinite',
  },
  voiceFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: 'transparent',
    borderTop: '1px solid #F4F4F5',
  },
  voiceFooterHint: {
    fontSize: '13px',
    color: '#A1A1AA',
    fontWeight: '500',
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

  // Sidebar styles
  sidebarOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 100,
    opacity: 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none',
  },
  sidebarOverlayOpen: {
    opacity: 1,
    pointerEvents: 'auto',
  },
  sidebar: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '320px',
    backgroundColor: '#FFFFFF',
    zIndex: 101,
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)',
  },
  sidebarOpen: {
    transform: 'translateX(0)',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #F4F4F5',
  },
  sidebarTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#18181B',
    letterSpacing: '-0.01em',
  },
  sidebarCloseButton: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#71717A',
    transition: 'all 0.15s ease',
  },
  sidebarContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
  sidebarProgress: {
    padding: '0 8px 16px',
    borderBottom: '1px solid #F4F4F5',
    marginBottom: '16px',
  },
  sidebarProgressText: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#71717A',
    marginBottom: '8px',
  },
  sidebarProgressBar: {
    height: '4px',
    backgroundColor: '#F4F4F5',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  sidebarProgressFill: {
    height: '100%',
    backgroundColor: '#18181B',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  sidebarQuestionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sidebarQuestionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left',
  },
  sidebarQuestionItemActive: {
    backgroundColor: '#F4F4F5',
  },
  sidebarQuestionItemDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  sidebarQuestionNumber: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '8px',
    flexShrink: 0,
  },
  sidebarQuestionNumberAnswered: {
    backgroundColor: '#ECFDF5',
    color: '#059669',
  },
  sidebarQuestionNumberCurrent: {
    backgroundColor: '#18181B',
    color: '#FFFFFF',
  },
  sidebarQuestionNumberFuture: {
    backgroundColor: '#F4F4F5',
    color: '#A1A1AA',
  },
  sidebarQuestionInfo: {
    flex: 1,
    minWidth: 0,
  },
  sidebarQuestionAspect: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#18181B',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  sidebarQuestionAspectCode: {
    fontSize: '11px',
    color: '#A1A1AA',
    marginTop: '2px',
  },
  sidebarQuestionStatus: {
    flexShrink: 0,
  },
  menuButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: '1px solid #E4E4E7',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#52525B',
    transition: 'all 0.15s ease',
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
    @keyframes fadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes scaleIn {
      0% {
        transform: scale(0.9);
        opacity: 0;
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
