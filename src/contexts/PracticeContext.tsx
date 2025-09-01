'use client'

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { 
  Question, 
  PracticeContextState, 
  PracticeAction, 
  SessionConfiguration,
  PracticeSession,
  TopicInfo,
  QuestionResult,
  SessionResults,
  ExamHistory
} from '@/types/questions'
import { loadQuestionsFromFile } from '@/utils/questionParser'

// Initial state
const initialState: PracticeContextState = {
  session: null,
  questions: {
    original: [],
    current: [],
    currentIndex: 0,
    totalCount: 0
  },
  answers: {
    submitted: [],
    current: [],
    isSubmitted: false
  },
  ui: {
    showResults: false,
    isLoading: false,
    theme: 'light'
  },
  topics: []
}

// Reducer function
function practiceReducer(state: PracticeContextState, action: PracticeAction): PracticeContextState {
  switch (action.type) {
    case 'START_SESSION': {
      const { configuration, questions } = action.payload
      const sessionId = generateSessionId()
      
      // Filter questions by selected topics
      let filteredQuestions = questions
      if (configuration.selectedTopics.length > 0) {
        filteredQuestions = questions.filter(q => 
          configuration.selectedTopics.includes(q.topic)
        )
      }
      
      // Shuffle questions if enabled
      const currentQuestions = configuration.shuffleEnabled 
        ? shuffleArray([...filteredQuestions])
        : [...filteredQuestions]
      
      // Shuffle options if enabled
      if (configuration.shuffleOptions) {
        currentQuestions.forEach(question => {
          question.options = shuffleArray([...question.options])
        })
      }
      
      // Calculate timer settings
      const totalTimeAllowed = configuration.timerEnabled 
        ? Math.ceil(currentQuestions.length * configuration.minutesPerQuestion * 60) // Convert to seconds
        : 0
      
      const session: PracticeSession = {
        id: sessionId,
        startTime: new Date(),
        mode: configuration.timerEnabled ? 'exam' : 'practice',
        configuration,
        progress: {
          currentQuestionIndex: 0,
          answeredQuestions: 0,
          correctAnswers: 0,
          timeSpent: 0,
          questionResults: []
        },
        timer: {
          totalTimeAllowed,
          timeRemaining: totalTimeAllowed,
          isActive: configuration.timerEnabled,
          questionStartTime: new Date()
        }
      }
      
      return {
        ...state,
        session,
        questions: {
          original: questions,
          current: currentQuestions,
          currentIndex: 0,
          totalCount: currentQuestions.length
        },
        answers: {
          submitted: [],
          current: [],
          isSubmitted: false
        },
        ui: {
          ...state.ui,
          showResults: false,
          isLoading: false
        }
      }
    }
    
    case 'ANSWER_QUESTION': {
      return {
        ...state,
        answers: {
          ...state.answers,
          current: action.payload.answers
        }
      }
    }
    
    case 'SUBMIT_ANSWER': {
      if (!state.session || state.answers.isSubmitted) return state
      
      const currentQuestion = state.questions.current[state.questions.currentIndex]
      if (!currentQuestion) return state
      
      const isCorrect = arraysEqual(
        state.answers.current.sort(),
        currentQuestion.correctAnswers.sort()
      )
      
      const questionResult: QuestionResult = {
        questionId: currentQuestion.id,
        selectedAnswers: [...state.answers.current],
        correctAnswers: [...currentQuestion.correctAnswers],
        isCorrect,
        timeSpent: 60, // TODO: implement actual time tracking
        attempts: 1
      }
      
      const updatedProgress = {
        ...state.session.progress,
        answeredQuestions: state.session.progress.answeredQuestions + 1,
        correctAnswers: state.session.progress.correctAnswers + (isCorrect ? 1 : 0),
        questionResults: [...state.session.progress.questionResults, questionResult]
      }
      
      return {
        ...state,
        session: {
          ...state.session,
          progress: updatedProgress
        },
        answers: {
          ...state.answers,
          isSubmitted: true
        }
      }
    }
    
    case 'NEXT_QUESTION': {
      const nextIndex = state.questions.currentIndex + 1
      const isLastQuestion = nextIndex >= state.questions.totalCount
      
      if (isLastQuestion) {
        return {
          ...state,
          ui: {
            ...state.ui,
            showResults: true
          }
        }
      }
      
      return {
        ...state,
        questions: {
          ...state.questions,
          currentIndex: nextIndex
        },
        answers: {
          submitted: state.answers.submitted,
          current: [],
          isSubmitted: false
        }
      }
    }
    
    case 'PREVIOUS_QUESTION': {
      const prevIndex = Math.max(0, state.questions.currentIndex - 1)
      
      return {
        ...state,
        questions: {
          ...state.questions,
          currentIndex: prevIndex
        },
        answers: {
          submitted: state.answers.submitted,
          current: [],
          isSubmitted: false
        }
      }
    }
    
    case 'FINISH_SESSION': {
      if (!state.session) return state
      
      const results: SessionResults = calculateResults(
        state.session.progress.questionResults,
        state.questions.current
      )
      
      return {
        ...state,
        session: {
          ...state.session,
          endTime: new Date(),
          results
        },
        ui: {
          ...state.ui,
          showResults: true
        }
      }
    }
    
    case 'RESET_SESSION': {
      return {
        ...initialState,
        topics: state.topics
      }
    }
    
    case 'SET_LOADING': {
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoading: action.payload
        }
      }
    }
    
    case 'SHOW_RESULTS': {
      return {
        ...state,
        ui: {
          ...state.ui,
          showResults: action.payload
        }
      }
    }
    
    case 'SET_THEME': {
      return {
        ...state,
        ui: {
          ...state.ui,
          theme: action.payload
        }
      }
    }
    
    case 'UPDATE_TIMER': {
      if (!state.session) return state
      
      const timeRemaining = action.payload.timeRemaining
      
      // Auto-finish when timer runs out
      if (timeRemaining <= 0) {
        const results: SessionResults = calculateResults(
          state.session.progress.questionResults,
          state.questions.current
        )
        
        return {
          ...state,
          session: {
            ...state.session,
            endTime: new Date(),
            results,
            timer: {
              ...state.session.timer,
              timeRemaining: 0,
              isActive: false
            }
          },
          ui: {
            ...state.ui,
            showResults: true
          }
        }
      }
      
      return {
        ...state,
        session: {
          ...state.session,
          timer: {
            ...state.session.timer,
            timeRemaining
          }
        }
      }
    }
    
    case 'PAUSE_TIMER': {
      if (!state.session) return state
      
      return {
        ...state,
        session: {
          ...state.session,
          timer: {
            ...state.session.timer,
            isActive: false
          }
        }
      }
    }
    
    case 'RESUME_TIMER': {
      if (!state.session) return state
      
      return {
        ...state,
        session: {
          ...state.session,
          timer: {
            ...state.session.timer,
            isActive: true
          }
        }
      }
    }
    
    case 'END_EXAM_EARLY': {
      if (!state.session) return state
      
      const results: SessionResults = calculateResults(
        state.session.progress.questionResults,
        state.questions.current
      )
      
      return {
        ...state,
        session: {
          ...state.session,
          endTime: new Date(),
          results,
          timer: {
            ...state.session.timer,
            isActive: false
          }
        },
        ui: {
          ...state.ui,
          showResults: true
        }
      }
    }
    
    default:
      return state
  }
}

// Utility functions
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every(item => b.includes(item))
}

function calculateResults(questionResults: QuestionResult[], questions: Question[]): SessionResults {
  const totalQuestions = questionResults.length
  const correctAnswers = questionResults.filter(r => r.isCorrect).length
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
  const timeSpent = questionResults.reduce((total, r) => total + r.timeSpent, 0)
  
  // Calculate topic-wise results
  const topicResults = questions.reduce((acc, question) => {
    const result = questionResults.find(r => r.questionId === question.id)
    if (!result) return acc
    
    const topicName = question.topic
    if (!acc[topicName]) {
      acc[topicName] = { topic: topicName, totalQuestions: 0, correctAnswers: 0, score: 0 }
    }
    
    acc[topicName].totalQuestions++
    if (result.isCorrect) {
      acc[topicName].correctAnswers++
    }
    acc[topicName].score = Math.round((acc[topicName].correctAnswers / acc[topicName].totalQuestions) * 100)
    
    return acc
  }, {} as Record<string, any>)
  
  return {
    totalQuestions,
    correctAnswers,
    score,
    timeSpent,
    topicResults: Object.values(topicResults),
    questionResults
  }
}

// Exam history management
function saveExamHistory(history: ExamHistory) {
  try {
    const existingHistory = localStorage.getItem('examHistory')
    const historyArray: ExamHistory[] = existingHistory ? JSON.parse(existingHistory) : []
    
    // Add new history entry
    historyArray.unshift(history) // Add to beginning
    
    // Keep only last 50 attempts
    if (historyArray.length > 50) {
      historyArray.splice(50)
    }
    
    localStorage.setItem('examHistory', JSON.stringify(historyArray))
  } catch (error) {
    console.error('Failed to save exam history:', error)
  }
}

export function getExamHistory(): ExamHistory[] {
  try {
    const history = localStorage.getItem('examHistory')
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error('Failed to load exam history:', error)
    return []
  }
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

// Context
const PracticeContext = createContext<{
  state: PracticeContextState
  dispatch: React.Dispatch<PracticeAction>
  // Helper functions
  startSession: (config: SessionConfiguration) => void
  answerQuestion: (answers: string[]) => void
  submitAnswer: () => void
  nextQuestion: () => void
  previousQuestion: () => void
  finishSession: () => void
  resetSession: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  endExamEarly: () => void
} | null>(null)

// Provider component
export function PracticeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(practiceReducer, initialState)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Timer management
  useEffect(() => {
    if (state.session?.timer.isActive && state.session.timer.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        dispatch({ 
          type: 'UPDATE_TIMER', 
          payload: { timeRemaining: state.session!.timer.timeRemaining - 1 } 
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [state.session?.timer.isActive, state.session?.timer.timeRemaining])
  
  // Save exam history when session completes
  useEffect(() => {
    if (state.session?.results && state.session.mode === 'exam') {
      saveExamHistory({
        sessionId: state.session.id,
        date: state.session.endTime || new Date(),
        configuration: state.session.configuration,
        results: state.session.results,
        questions: state.questions.current,
        userAnswers: state.answers.submitted,
        duration: Math.floor((new Date().getTime() - state.session.startTime.getTime()) / 1000),
        mode: state.session.mode
      })
    }
  }, [state.session?.results])
  
  // Load questions on mount
  useEffect(() => {
    async function loadQuestions() {
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const { questions, topics } = await loadQuestionsFromFile()
        // Update state with loaded topics
        dispatch({ 
          type: 'RESET_SESSION' // This will be updated to handle topics
        })
        // TODO: Add action to set topics
      } catch (error) {
        console.error('Failed to load questions:', error)
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }
    
    loadQuestions()
  }, [])
  
  // Helper functions
  const startSession = async (configuration: SessionConfiguration) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const { questions } = await loadQuestionsFromFile()
      dispatch({ 
        type: 'START_SESSION', 
        payload: { configuration, questions } 
      })
    } catch (error) {
      console.error('Failed to start session:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }
  
  const answerQuestion = (answers: string[]) => {
    dispatch({ type: 'ANSWER_QUESTION', payload: { answers } })
  }
  
  const submitAnswer = () => {
    dispatch({ type: 'SUBMIT_ANSWER' })
  }
  
  const nextQuestion = () => {
    dispatch({ type: 'NEXT_QUESTION' })
  }
  
  const previousQuestion = () => {
    dispatch({ type: 'PREVIOUS_QUESTION' })
  }
  
  const finishSession = () => {
    dispatch({ type: 'FINISH_SESSION' })
  }
  
  const resetSession = () => {
    dispatch({ type: 'RESET_SESSION' })
  }
  
  const pauseTimer = () => {
    dispatch({ type: 'PAUSE_TIMER' })
  }
  
  const resumeTimer = () => {
    dispatch({ type: 'RESUME_TIMER' })
  }
  
  const endExamEarly = () => {
    dispatch({ type: 'END_EXAM_EARLY' })
  }
  
  const value = {
    state,
    dispatch,
    startSession,
    answerQuestion,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    finishSession,
    resetSession,
    pauseTimer,
    resumeTimer,
    endExamEarly
  }
  
  return (
    <PracticeContext.Provider value={value}>
      {children}
    </PracticeContext.Provider>
  )
}

// Hook to use the context
export function usePractice() {
  const context = useContext(PracticeContext)
  if (!context) {
    throw new Error('usePractice must be used within a PracticeProvider')
  }
  return context
}