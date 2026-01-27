/**
 * Interview Types for ThinkForward MVP
 * Aligned with CABAS Discovery v2.1 question schema
 */

// Question types matching backend schema
export type QuestionType = 'open' | 'scale' | 'percentage' | 'single_select' | 'multi_select';

export interface ScaleConfig {
  min: number;
  max: number;
  min_label: string;
  max_label: string;
}

export interface Question {
  id: string;
  number: number;
  total: number;
  aspect: string;
  aspect_code: string;
  text: string;
  type: QuestionType;
  options?: string[];
  scale?: ScaleConfig;
}

// Interview modes
export type InterviewMode = 'select' | 'text' | 'voice';

// Interview status from backend
export type InterviewStatus = 'pending' | 'in_progress' | 'completed' | 'abandoned';

// Progress tracking
export interface InterviewProgress {
  current: number;
  total: number;
  percentage: number;
}

// Response types
export interface ResponseAnswer {
  questionId: string;
  text: string;
  isVoice: boolean;
  voiceData?: VoiceData;
  timestamp: Date;
}

export interface VoiceData {
  audioUrl: string;
  durationSeconds: number;
  transcription?: string;
}

// Interview state for the component
export interface InterviewState {
  mode: InterviewMode;
  interviewId: string | null;
  currentQuestion: Question | null;
  progress: InterviewProgress;
  answers: Map<string, ResponseAnswer>;
  isLoading: boolean;
  error: string | null;
  followupQuestion: string | null;
  isFollowup: boolean;
}

// Initial state factory
export const createInitialInterviewState = (): InterviewState => ({
  mode: 'select',
  interviewId: null,
  currentQuestion: null,
  progress: { current: 0, total: 0, percentage: 0 },
  answers: new Map(),
  isLoading: false,
  error: null,
  followupQuestion: null,
  isFollowup: false,
});

// Props for InterviewApp component
export interface InterviewAppProps {
  initialMode?: InterviewMode;
  reviewId?: string;
  participantId?: string;
  onExit?: () => void;
  onComplete?: (interviewId: string) => void;
}

// Demo/offline mode questions (subset of CABAS questions for testing)
export const DEMO_QUESTIONS: Question[] = [
  {
    id: 'q_demo_1',
    number: 1,
    total: 5,
    aspect: 'Background & Context',
    aspect_code: 'B1',
    text: 'What is your current role, and how long have you been in this organisation? Please include your level (senior leader, middle manager, operational/frontline) and area of responsibility.',
    type: 'open',
  },
  {
    id: 'q_demo_2',
    number: 2,
    total: 5,
    aspect: 'Sense-Making',
    aspect_code: 'M4',
    text: 'How effective are cross-team conversations at helping you agree what information means and what to do next?',
    type: 'scale',
    scale: {
      min: 1,
      max: 5,
      min_label: 'Very ineffective - cross-team conversations are frustrating and unproductive',
      max_label: 'Highly effective - we quickly align on meaning and next steps',
    },
  },
  {
    id: 'q_demo_3',
    number: 3,
    total: 5,
    aspect: 'Culture & Leadership',
    aspect_code: 'C3',
    text: 'How safe do you feel to speak up about problems, risks or ideas for change, even when these challenge current plans or senior views?',
    type: 'scale',
    scale: {
      min: 1,
      max: 5,
      min_label: 'Unsafe - I keep concerns to myself',
      max_label: 'Completely safe - I can challenge anyone on anything constructively',
    },
  },
  {
    id: 'q_demo_4',
    number: 4,
    total: 5,
    aspect: 'Background & Context',
    aspect_code: 'B5',
    text: 'From your experience, what do customers or partners value most about this organisation? Please select up to three.',
    type: 'multi_select',
    options: [
      'Reliability/Dependability',
      'Technical Quality',
      'Speed/Responsiveness',
      'Competitive Pricing',
      'Specialist Expertise',
      'Long-term Relationships',
      'Safety Record',
      'Innovation/New Solutions',
      'Flexibility/Adaptability',
    ],
  },
  {
    id: 'q_demo_5',
    number: 5,
    total: 5,
    aspect: 'Exploration/Exploitation',
    aspect_code: 'X3a',
    text: 'Roughly what percentage of your working time goes into keeping existing processes running (exploitation)?',
    type: 'percentage',
  },
];
