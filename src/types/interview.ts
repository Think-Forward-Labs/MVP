export interface Question {
  id: number;
  text: string;
  category: string;
}

export type InterviewMode = 'select' | 'text' | 'voice';

export interface InterviewState {
  mode: InterviewMode;
  currentQuestion: number;
  answers: Record<number, string>;
  inputValue: string;
  isRecording: boolean;
  isPlaying: boolean;
  recordingTime: number;
  showTransition: boolean;
}
