export interface QuestionOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface Question {
  id: number
  questionNumber: number
  topic: string
  question: string
  note?: string
  options: QuestionOption[]
  correctAnswers: string[]
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard'
    estimatedTime: number // seconds
    tags: string[]
  }
}

export interface UserAnswer {
  questionId: number
  selectedAnswers: string[]
  isCorrect: boolean
  timeSpent: number
  attempts: number
}

export interface PracticeSession {
  id: string
  startTime: Date
  endTime?: Date
  mode: 'practice' | 'exam' | 'review'
  configuration: SessionConfiguration
  progress: SessionProgress
  results?: SessionResults
  timer: {
    totalTimeAllowed: number // seconds
    timeRemaining: number // seconds
    isActive: boolean
    questionStartTime: Date
  }
}

export interface SessionConfiguration {
  selectedTopics: string[]
  shuffleEnabled: boolean
  shuffleOptions: boolean
  timeLimit?: number
  autoAdvance: boolean
  showFeedback: boolean
  timerEnabled: boolean
  minutesPerQuestion: number // Default 2.25 minutes
}

export interface SessionProgress {
  currentQuestionIndex: number
  answeredQuestions: number
  correctAnswers: number
  timeSpent: number
  questionResults: QuestionResult[]
}

export interface QuestionResult {
  questionId: number
  selectedAnswers: string[]
  correctAnswers: string[]
  isCorrect: boolean
  timeSpent: number
  attempts: number
}

export interface SessionResults {
  totalQuestions: number
  correctAnswers: number
  score: number // percentage
  timeSpent: number
  topicResults: TopicResult[]
  questionResults: QuestionResult[]
}

export interface TopicResult {
  topic: string
  totalQuestions: number
  correctAnswers: number
  score: number
}

export interface PracticeContextState {
  // Session Management
  session: PracticeSession | null
  
  // Question Flow
  questions: {
    original: Question[]
    current: Question[]
    currentIndex: number
    totalCount: number
  }
  
  // User Interaction
  answers: {
    submitted: UserAnswer[]
    current: string[]
    isSubmitted: boolean
  }
  
  // UI State
  ui: {
    showResults: boolean
    isLoading: boolean
    theme: 'light' | 'dark'
  }
  
  // Available Topics
  topics: TopicInfo[]
}

export interface TopicInfo {
  name: string
  questionCount: number
  description?: string
}

export interface ExamHistory {
  sessionId: string
  date: Date
  configuration: SessionConfiguration
  results: SessionResults
  questions: Question[]
  userAnswers: UserAnswer[]
  duration: number // seconds
  mode: 'practice' | 'exam' | 'review'
}

// Action types for the context reducer
export type PracticeAction =
  | { type: 'START_SESSION'; payload: { configuration: SessionConfiguration; questions: Question[] } }
  | { type: 'ANSWER_QUESTION'; payload: { answers: string[] } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'SUBMIT_ANSWER' }
  | { type: 'FINISH_SESSION' }
  | { type: 'RESET_SESSION' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SHOW_RESULTS'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'UPDATE_TIMER'; payload: { timeRemaining: number } }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESUME_TIMER' }
  | { type: 'END_EXAM_EARLY' }