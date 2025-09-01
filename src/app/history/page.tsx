'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Home, 
  History as HistoryIcon, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Target,
  Eye,
  TrendingUp,
  Award,
  Activity
} from 'lucide-react'
import { ExamHistory, formatTime, getExamHistory } from '@/contexts/PracticeContext'

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<ExamHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  useEffect(() => {
    setHistory(getExamHistory())
    setLoading(false)
  }, [])

  const toggleSessionExpanded = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
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
          <p className="text-muted-foreground">Loading exam history...</p>
        </div>
      </div>
    )
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
                onClick={() => router.push('/')}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <div className="h-6 w-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <HistoryIcon className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Exam History</span>
              </div>
            </div>
            
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {history.length} Attempts
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {history.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-600 dark:text-slate-400 mb-2">
              No Exam History Yet
            </h2>
            <p className="text-slate-500 mb-6">
              Complete your first timed exam to see your results here.
            </p>
            <Button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700">
              <BookOpen className="h-4 w-4 mr-2" />
              Start Practice
            </Button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="group hover:shadow-lg transition-all duration-300 glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl group-hover:scale-110 transition-transform">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {history.length}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">Total Attempts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-lg transition-all duration-300 glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(history.reduce((sum, h) => sum + h.results.score, 0) / history.length)}%
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">Average Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-lg transition-all duration-300 glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl group-hover:scale-110 transition-transform">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.max(...history.map(h => h.results.score))}%
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">Best Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="group hover:shadow-lg transition-all duration-300 glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-xl group-hover:scale-110 transition-transform">
                      <Trophy className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {history.filter(h => h.results.score >= 70).length}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">Passed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* History List */}
            <div className="space-y-4">
              {history.map((session) => {
                const isExpanded = expandedSessions.has(session.sessionId)
                const passed = session.results.score >= 70
                
                return (
                  <Card key={session.sessionId} className="glass-card hover:shadow-xl transition-all duration-300 group">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${
                            passed ? 'bg-green-100 dark:bg-green-950' : 'bg-red-100 dark:bg-red-950'
                          }`}>
                            {passed ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : (
                              <XCircle className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">
                                {session.mode === 'exam' ? 'Timed Exam' : 'Practice Session'}
                              </h3>
                              <Badge className={`${getGradeColor(session.results.score)} font-semibold`}>
                                {session.results.score}% - {getGradeText(session.results.score)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(session.date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{formatTime(session.duration)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                <span>{session.results.correctAnswers}/{session.results.totalQuestions} correct</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-3xl font-bold mb-1">{session.results.score}%</div>
                            <Progress value={session.results.score} className="w-24 h-3" />
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/history/${session.sessionId}`)
                              }}
                              className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSessionExpanded(session.sessionId)}
                              className="hover:bg-muted"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-2" />
                                  Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-2" />
                                  More
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent>
                        {/* Topic Breakdown */}
                        <div className="mb-6">
                          <h4 className="font-semibold mb-3">Topic Performance</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {session.results.topicResults.map((topic) => (
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
                        
                        {/* Question Details */}
                        <div>
                          <h4 className="font-semibold mb-3">Question Breakdown</h4>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {session.questions.map((question, index) => {
                              const userAnswer = session.userAnswers.find(ua => ua.questionId === question.id)
                              const isCorrect = userAnswer?.isCorrect || false
                              
                              return (
                                <div key={question.id} className={`p-3 rounded-lg border ${
                                  isCorrect ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:bg-red-950'
                                }`}>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="text-xs">
                                          Q{index + 1}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                          {question.topic}
                                        </Badge>
                                        {isCorrect ? (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-red-600" />
                                        )}
                                      </div>
                                      
                                      <p className="text-sm mb-2 line-clamp-2">{question.question}</p>
                                      
                                      <div className="text-xs text-muted-foreground">
                                        <div>Your answer: {
                                          userAnswer?.selectedAnswers.map(id => 
                                            question.options.find(opt => opt.id === id)?.text
                                          ).join(', ') || 'No answer'
                                        }</div>
                                        {!isCorrect && (
                                          <div className="text-green-600 dark:text-green-400">
                                            Correct: {question.options.filter(opt => opt.isCorrect).map(opt => opt.text).join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}