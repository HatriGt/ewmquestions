'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePractice } from '@/contexts/PracticeContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookOpen, Settings, Play, Shuffle, Clock, Target, Shield, Timer, History } from 'lucide-react'
import { TopicInfo, SessionConfiguration } from '@/types/questions'

export default function HomePage() {
  const router = useRouter()
  const { state, startSession } = usePractice()
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [shuffleEnabled, setShuffleEnabled] = useState(true)
  const [shuffleOptions, setShuffleOptions] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [showFeedback, setShowFeedback] = useState(true)
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [minutesPerQuestion, setMinutesPerQuestion] = useState(2.25)
  const [topics, setTopics] = useState<TopicInfo[]>([])
  const [loading, setLoading] = useState(true)

  // Load topics on component mount
  useEffect(() => {
    async function loadTopics() {
      try {
        const response = await fetch('/api/questions')
        const data = await response.json()
        setTopics(data.topics || [])
      } catch (error) {
        console.error('Failed to load topics:', error)
      } finally {
        setLoading(false)
      }
    }
    loadTopics()
  }, [])
  
  // Redirect to practice page if session is active
  useEffect(() => {
    if (state.session && !state.ui.showResults) {
      router.push('/practice')
    }
  }, [state.session, state.ui.showResults, router])

  const handleTopicToggle = (topicName: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicName)
        ? prev.filter(t => t !== topicName)
        : [...prev, topicName]
    )
  }

  const handleSelectAll = () => {
    if (selectedTopics.length === topics.length) {
      setSelectedTopics([])
    } else {
      setSelectedTopics(topics.map(t => t.name))
    }
  }

  const handleStartPractice = async () => {
    const configuration: SessionConfiguration = {
      selectedTopics: selectedTopics.length > 0 ? selectedTopics : topics.map(t => t.name),
      shuffleEnabled,
      shuffleOptions,
      autoAdvance,
      showFeedback,
      timerEnabled,
      minutesPerQuestion
    }
    
    try {
      await startSession(configuration)
      // Navigate to practice page after successful session start
      router.push('/practice')
    } catch (error) {
      console.error('Failed to start practice session:', error)
    }
  }

  const totalSelectedQuestions = selectedTopics.length > 0 
    ? topics.filter(t => selectedTopics.includes(t.name)).reduce((sum, t) => sum + t.questionCount, 0)
    : topics.reduce((sum, t) => sum + t.questionCount, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  SAP EWM Exam Practice
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Master SAP Extended Warehouse Management certification
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/history')}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                History
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin Panel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Topic Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Select Topics
                    </CardTitle>
                    <CardDescription>
                      Choose topics to practice. Leave empty to practice all topics.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="ml-4"
                  >
                    {selectedTopics.length === topics.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topics.map((topic) => (
                    <div 
                      key={topic.name} 
                      className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      onClick={() => handleTopicToggle(topic.name)}
                    >
                      <Checkbox
                        id={topic.name}
                        checked={selectedTopics.includes(topic.name)}
                        onChange={() => handleTopicToggle(topic.name)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <Label 
                          htmlFor={topic.name} 
                          className="font-medium cursor-pointer text-sm leading-relaxed"
                        >
                          {topic.name}
                        </Label>
                        {topic.description && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {topic.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2 shrink-0">
                        {topic.questionCount} questions
                      </Badge>
                    </div>
                  ))}
                </div>
                
                {selectedTopics.length > 0 && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      Selected: {selectedTopics.length} topics ({totalSelectedQuestions} questions)
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Settings and Start */}
          <div className="space-y-6">
            {/* Practice Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Practice Settings
                </CardTitle>
                <CardDescription>
                  Customize your practice session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Shuffle className="h-4 w-4" />
                      Shuffle Questions
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Randomize question order
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={shuffleEnabled}
                    onChange={(e) => setShuffleEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Shuffle Options</Label>
                    <p className="text-xs text-muted-foreground">
                      Randomize answer choices
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Show Feedback</Label>
                    <p className="text-xs text-muted-foreground">
                      Immediate answer feedback
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showFeedback}
                    onChange={(e) => setShowFeedback(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Auto Advance
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically go to next question
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e) => setAutoAdvance(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      Enable Timer
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Timed exam mode with auto-finish
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={timerEnabled}
                    onChange={(e) => setTimerEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                
                {timerEnabled && (
                  <div className="space-y-2">
                    <Label>Minutes per Question</Label>
                    <input
                      type="number"
                      min="0.5"
                      max="10"
                      step="0.25"
                      value={minutesPerQuestion}
                      onChange={(e) => setMinutesPerQuestion(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Total time: {Math.ceil(totalSelectedQuestions * minutesPerQuestion)} minutes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Quick Start */}
            <Card>
              <CardHeader>
                <CardTitle>Ready to Practice?</CardTitle>
                <CardDescription>
                  {totalSelectedQuestions > 0 
                    ? `${totalSelectedQuestions} questions selected` 
                    : 'All topics will be included'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleStartPractice}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                  disabled={state.ui.isLoading}
                >
                  <Play className="h-5 w-5 mr-2" />
                  {state.ui.isLoading ? 'Starting...' : 'Start Practice'}
                </Button>
                
                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    {timerEnabled ? 
                      `Exam duration: ${Math.ceil(totalSelectedQuestions * minutesPerQuestion)} minutes` :
                      `Estimated time: ${Math.ceil(totalSelectedQuestions * 1.5)} minutes`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
