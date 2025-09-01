'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePractice, formatTime } from '@/contexts/PracticeContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Clock,
  BookOpen,
  Home,
  RotateCcw,
  AlertTriangle,
  Timer,
  History as HistoryIcon
} from 'lucide-react'

export default function PracticePage() {
  const { state, answerQuestion, submitAnswer, nextQuestion, previousQuestion, finishSession, resetSession, endExamEarly } = usePractice()
  const router = useRouter()

  // Redirect if no session
  useEffect(() => {
    if (!state.session && !state.ui.isLoading) {
      router.push('/')
    }
  }, [state.session, state.ui.isLoading, router])

  if (state.ui.isLoading || !state.session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading practice session...</p>
        </div>
      </div>
    )
  }

  // Show results if session is complete
  if (state.ui.showResults) {
    return <ResultsView />
  }

  const currentQuestion = state.questions.current[state.questions.currentIndex]
  const progress = ((state.questions.currentIndex + 1) / state.questions.totalCount) * 100
  const isMultiSelect = currentQuestion?.correctAnswers.length > 1

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No question available</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  const handleAnswerChange = (answerId: string, isSelected: boolean) => {
    if (isMultiSelect) {
      // Multi-select: add/remove from current answers
      const currentAnswers = state.answers.current
      const newAnswers = isSelected
        ? [...currentAnswers, answerId]
        : currentAnswers.filter(id => id !== answerId)
      answerQuestion(newAnswers)
    } else {
      // Single select: replace current answer
      answerQuestion(isSelected ? [answerId] : [])
    }
  }

  const handleSubmit = () => {
    if (state.answers.current.length === 0) return
    submitAnswer()
  }

  const handleNext = () => {
    if (state.questions.currentIndex === state.questions.totalCount - 1) {
      finishSession()
    } else {
      nextQuestion()
    }
  }

  const isAnswered = state.answers.isSubmitted
  const hasAnswer = state.answers.current.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/')}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span className="font-medium">SAP EWM Practice</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Timer Display */}
              {state.session?.timer.isActive && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Timer className="h-4 w-4 text-blue-600" />
                  <span className={`text-sm font-mono ${
                    state.session.timer.timeRemaining < 300 ? 'text-red-600 font-bold' : 'text-blue-600'
                  }`}>
                    {formatTime(state.session.timer.timeRemaining)}
                  </span>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                Question {state.questions.currentIndex + 1} of {state.questions.totalCount}
              </div>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
              
              {/* End Exam Early Button */}
              {state.session?.timer.isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to end the exam early? This will show your results immediately.')) {
                      endExamEarly()
                    }
                  }}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  End Early
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Question Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline">
                  Question {currentQuestion.questionNumber}
                </Badge>
                <Badge variant="secondary">
                  {currentQuestion.topic}
                </Badge>
              </div>
              
              <CardTitle className="text-xl leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
              
              {currentQuestion.note && (
                <Alert>
                  <AlertDescription className="font-medium">
                    {currentQuestion.note}
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {isMultiSelect ? (
                  // Multi-select with checkboxes
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = state.answers.current.includes(option.id)
                      const isCorrect = option.isCorrect
                      const showFeedback = isAnswered && state.session?.configuration.showFeedback
                      
                      return (
                        <div 
                          key={option.id}
                          className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
                            showFeedback
                              ? isCorrect
                                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                : isSelected && !isCorrect
                                ? 'border-red-500 bg-red-50 dark:bg-red-950'
                                : 'border-slate-200 dark:border-slate-700'
                              : isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Checkbox
                            id={option.id}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleAnswerChange(option.id, checked as boolean)}
                            disabled={isAnswered}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <Label 
                              htmlFor={option.id} 
                              className="cursor-pointer text-sm leading-relaxed"
                            >
                              {option.text}
                            </Label>
                          </div>
                          {showFeedback && (
                            <div className="flex items-center">
                              {isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : isSelected ? (
                                <XCircle className="h-5 w-5 text-red-600" />
                              ) : null}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  // Single select with radio group
                  <RadioGroup
                    value={state.answers.current[0] || ''}
                    onValueChange={(value) => handleAnswerChange(value, true)}
                    disabled={isAnswered}
                  >
                    {currentQuestion.options.map((option) => {
                      const isSelected = state.answers.current.includes(option.id)
                      const isCorrect = option.isCorrect
                      const showFeedback = isAnswered && state.session?.configuration.showFeedback
                      
                      return (
                        <div 
                          key={option.id}
                          className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
                            showFeedback
                              ? isCorrect
                                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                : isSelected && !isCorrect
                                ? 'border-red-500 bg-red-50 dark:bg-red-950'
                                : 'border-slate-200 dark:border-slate-700'
                              : isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                          <div className="flex-1">
                            <Label 
                              htmlFor={option.id} 
                              className="cursor-pointer text-sm leading-relaxed"
                            >
                              {option.text}
                            </Label>
                          </div>
                          {showFeedback && (
                            <div className="flex items-center">
                              {isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : isSelected ? (
                                <XCircle className="h-5 w-5 text-red-600" />
                              ) : null}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </RadioGroup>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={state.questions.currentIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-3">
              {!isAnswered ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!hasAnswer}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {state.questions.currentIndex === state.questions.totalCount - 1 ? (
                    'Finish'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Results View Component
function ResultsView() {
  const { state, resetSession } = usePractice()
  const router = useRouter()

  if (!state.session?.results) {
    return null
  }

  const { results } = state.session
  const passed = results.score >= 70 // 70% passing score

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            passed ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'
          }`}>
            {passed ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {passed ? 'Congratulations!' : 'Keep Practicing!'}
          </CardTitle>
          <p className="text-muted-foreground">
            You scored {results.score}% ({results.correctAnswers}/{results.totalQuestions} correct)
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{results.score}%</div>
            <Progress value={results.score} className="h-3" />
          </div>

          {/* Topic Breakdown */}
          <div>
            <h3 className="font-semibold mb-3">Topic Breakdown</h3>
            <div className="space-y-3">
              {results.topicResults.map((topic) => (
                <div key={topic.topic} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{topic.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {topic.correctAnswers}/{topic.totalQuestions} correct
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={topic.score >= 70 ? 'default' : 'destructive'}>
                      {topic.score}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => {
                resetSession()
                router.push('/')
              }}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Practice Again
            </Button>
            <Button
              onClick={() => router.push('/history')}
              variant="outline"
              className="flex-1"
            >
              <HistoryIcon className="h-4 w-4 mr-2" />
              View History
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}