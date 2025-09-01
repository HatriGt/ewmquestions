'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { 
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Target,
  Trophy,
  Search,
  BookOpen,
  Award,
  TrendingUp,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
  Share,
  Bookmark
} from 'lucide-react'
import { ExamHistory, formatTime, getExamHistory } from '@/contexts/PracticeContext'

export default function ExamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string
  
  const [examHistory, setExamHistory] = useState<ExamHistory | null>(null)
  const [allExamHistory, setAllExamHistory] = useState<ExamHistory[]>([])
  const [currentExamIndex, setCurrentExamIndex] = useState(-1)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [selectedResult, setSelectedResult] = useState('all')
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true)


  useEffect(() => {
    const history = getExamHistory()
    const examIndex = history.findIndex(h => h.sessionId === sessionId)
    const exam = history[examIndex]
    
    if (!exam || examIndex === -1) {
      router.push('/history')
      return
    }
    
    setAllExamHistory(history)
    setCurrentExamIndex(examIndex)
    setExamHistory(exam)
    setLoading(false)
  }, [sessionId, router])

  const filteredQuestions = useMemo(() => {
    if (!examHistory) return []
    
    return examHistory.questions.filter(question => {
      const userAnswer = examHistory.userAnswers.find(ua => ua.questionId === question.id)
      const isCorrect = userAnswer?.isCorrect || false
      
      const matchesSearch = searchTerm === '' || 
        question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.options.some(opt => opt.text.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesTopic = selectedTopic === 'all' || question.topic === selectedTopic
      
      const matchesResult = selectedResult === 'all' || 
        (selectedResult === 'correct' && isCorrect) ||
        (selectedResult === 'incorrect' && !isCorrect) ||
        (selectedResult === 'unanswered' && !userAnswer)
      
      return matchesSearch && matchesTopic && matchesResult
    })
  }, [examHistory, searchTerm, selectedTopic, selectedResult])

  const uniqueTopics = useMemo(() => {
    if (!examHistory) return []
    return Array.from(new Set(examHistory.questions.map(q => q.topic)))
  }, [examHistory])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100 dark:bg-green-950'
    if (score >= 80) return 'text-blue-600 bg-blue-100 dark:bg-blue-950'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950'
    return 'text-red-600 bg-red-100 dark:bg-red-950'
  }

  const getGradeText = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Pass'
    return 'Fail'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading exam details...</p>
        </div>
      </div>
    )
  }

  if (!examHistory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-600 dark:text-slate-400 mb-2">
            Exam Not Found
          </h2>
          <p className="text-slate-500 mb-6">
            The requested exam session could not be found.
          </p>
          <Button onClick={() => router.push('/history')} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to History
          </Button>
        </div>
      </div>
    )
  }

  const passed = examHistory.results.score >= 70
  const hasPreviousExam = currentExamIndex < allExamHistory.length - 1
  const hasNextExam = currentExamIndex > 0
  
  const navigateToPreviousExam = () => {
    if (hasPreviousExam) {
      const previousExam = allExamHistory[currentExamIndex + 1]
      router.push(`/history/${previousExam.sessionId}`)
    }
  }
  
  const navigateToNextExam = () => {
    if (hasNextExam) {
      const nextExam = allExamHistory[currentExamIndex - 1]
      router.push(`/history/${nextExam.sessionId}`)
    }
  }

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
                onClick={() => router.push('/history')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to History
              </Button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Exam Details</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Previous/Next Exam Navigation */}
              {(hasPreviousExam || hasNextExam) && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateToPreviousExam}
                    disabled={!hasPreviousExam}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous Exam
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateToNextExam}
                    disabled={!hasNextExam}
                    className="flex items-center gap-2"
                  >
                    Next Exam
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <div className="h-6 w-px bg-slate-300 mx-2"></div>
                </>
              )}
              
              <Badge className={getGradeColor(examHistory.results.score)}>
                {examHistory.results.score}% - {getGradeText(examHistory.results.score)}
              </Badge>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Breadcrumb Navigation */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => router.push('/')} className="cursor-pointer hover:text-blue-600">
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => router.push('/history')} className="cursor-pointer hover:text-blue-600">
                  Exam History
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {examHistory.mode === 'exam' ? 'Timed Exam' : 'Practice Session'} - {formatDate(examHistory.date)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {/* Exam Summary Header */}
          <Card className="glass-card">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    {examHistory.mode === 'exam' ? 'Timed Exam' : 'Practice Session'}
                  </CardTitle>
                  <div className="flex items-center gap-6 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(examHistory.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Duration: {formatTime(examHistory.duration)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>{examHistory.results.totalQuestions} Questions</span>
                    </div>
                  </div>
                </div>
                
                <div className={`p-6 rounded-xl ${ 
                  passed ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'
                }`}>
                  {passed ? (
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  ) : (
                    <XCircle className="h-12 w-12 text-red-600" />
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {examHistory.results.score}%
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                  <Progress value={examHistory.results.score} className="mt-2 h-2" />
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {examHistory.results.correctAnswers}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct Answers</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {examHistory.results.totalQuestions - examHistory.results.correctAnswers}
                  </div>
                  <div className="text-sm text-muted-foreground">Incorrect Answers</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {Math.round((examHistory.results.correctAnswers / examHistory.results.totalQuestions) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Topic Performance Overview */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Topic Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {examHistory.results.topicResults.map((topic) => (
                  <Card key={topic.topic} className="border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-sm">{topic.topic}</h4>
                        <Badge variant={topic.score >= 70 ? 'default' : 'destructive'}>
                          {topic.score}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <Progress value={topic.score} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {topic.correctAnswers}/{topic.totalQuestions} questions correct
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters and Controls */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions or answers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {uniqueTopics.map(topic => (
                      <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedResult} onValueChange={setSelectedResult}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="correct">Correct Only</SelectItem>
                    <SelectItem value="incorrect">Incorrect Only</SelectItem>
                    <SelectItem value="unanswered">Unanswered</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
                  className="flex items-center gap-2"
                >
                  {showCorrectAnswers ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Hide Answers
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Show Answers
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing {filteredQuestions.length} of {examHistory.questions.length} questions</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    Correct ({examHistory.results.correctAnswers})
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    Incorrect ({examHistory.results.totalQuestions - examHistory.results.correctAnswers})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          <div className="space-y-6">
            {filteredQuestions.map((question, index) => {
              const userAnswer = examHistory.userAnswers.find(ua => ua.questionId === question.id)
              const isCorrect = userAnswer?.isCorrect || false
              const selectedAnswers = userAnswer?.selectedAnswers || []
              
              return (
                <Card key={question.id} className={`glass-card transition-all duration-200 hover:shadow-lg border-l-4 ${
                  isCorrect ? 'border-l-green-500' : 'border-l-red-500'
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="outline">
                            Question {question.questionNumber || index + 1}
                          </Badge>
                          <Badge variant="secondary">
                            {question.topic}
                          </Badge>
                          <div className={`p-1 rounded-full ${
                            isCorrect ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'
                          }`}>
                            {isCorrect ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </div>
                        
                        <CardTitle className="text-lg leading-relaxed mb-3">
                          {question.question}
                        </CardTitle>
                        
                        {question.note && (
                          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="font-medium text-blue-800 dark:text-blue-200">
                              {question.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {question.options.map((option) => {
                        const isSelected = selectedAnswers.includes(option.id)
                        const isCorrectOption = option.isCorrect
                        
                        let optionStyle = 'border-slate-200 dark:border-slate-700'
                        let iconElement = null
                        
                        if (showCorrectAnswers) {
                          if (isCorrectOption && isSelected) {
                            // Correct answer and selected
                            optionStyle = 'border-green-500 bg-green-50 dark:bg-green-950'
                            iconElement = <CheckCircle className="h-5 w-5 text-green-600" />
                          } else if (isCorrectOption && !isSelected) {
                            // Correct answer but not selected
                            optionStyle = 'border-green-300 bg-green-25 dark:bg-green-950/50'
                            iconElement = <CheckCircle className="h-5 w-5 text-green-500" />
                          } else if (!isCorrectOption && isSelected) {
                            // Wrong answer but selected
                            optionStyle = 'border-red-500 bg-red-50 dark:bg-red-950'
                            iconElement = <XCircle className="h-5 w-5 text-red-600" />
                          }
                        } else if (isSelected) {
                          optionStyle = 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          iconElement = <Bookmark className="h-5 w-5 text-blue-600" />
                        }
                        
                        return (
                          <div 
                            key={option.id}
                            className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${optionStyle}`}
                          >
                            <div className="flex-1">
                              <p className="text-sm leading-relaxed">
                                {option.text}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isSelected && (
                                <Badge variant="outline" className="text-xs">
                                  Selected
                                </Badge>
                              )}
                              {showCorrectAnswers && isCorrectOption && !isSelected && (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  Correct
                                </Badge>
                              )}
                              {iconElement}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {!showCorrectAnswers && (
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCorrectAnswers(true)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Reveal Correct Answers
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredQuestions.length === 0 && (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <Search className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  No questions match your filters
                </h3>
                <p className="text-slate-500 mb-6">
                  Try adjusting your search terms or filter criteria.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedTopic('all')
                    setSelectedResult('all')
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => router.push('/history')}
                  variant="outline"
                  className="flex-1 max-w-xs"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to History
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  className="flex-1 max-w-xs bg-blue-600 hover:bg-blue-700"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Practice Again
                </Button>
                <Button
                  onClick={() => router.push('/admin')}
                  variant="outline"
                  className="flex-1 max-w-xs"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Review Questions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}