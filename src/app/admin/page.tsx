'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Home, 
  Settings, 
  Edit3, 
  Save, 
  X, 
  Search,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react'
import { Question, TopicInfo } from '@/types/questions'
import { questionStorage, applyQuestionModifications, saveQuestionModification, isQuestionModified } from '@/utils/questionStorage'

export default function AdminPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [topics, setTopics] = useState<TopicInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [modifications, setModifications] = useState<Set<number>>(new Set())
  const [isClient, setIsClient] = useState(false)
  
  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const questionsPerPage = 10

  // Load questions on mount
  useEffect(() => {
    if (!isClient) return // Wait for client-side hydration
    
    async function loadData() {
      try {
        const response = await fetch('/api/questions')
        const data = await response.json()
        
        // Apply any existing modifications from storage
        const rawQuestions = data.questions || []
        console.log('Loading admin data:', {
          rawCount: rawQuestions.length,
          hasSupabase: true
        })
        
        const modifiedQuestions = await applyQuestionModifications(rawQuestions)
        const stats = await questionStorage.getStatistics()
        
        console.log('After applying modifications:', {
          modifiedCount: modifiedQuestions.length,
          stats,
          sampleModified: modifiedQuestions.slice(0, 2).map(q => ({ 
            id: q.id, 
            correctAnswers: q.correctAnswers
          }))
        })
        
        setQuestions(modifiedQuestions)
        setTopics([{ name: 'all', questionCount: modifiedQuestions.length || 0 }, ...(data.topics || [])])
        
        // Track which questions have been modified
        const modifiedIds = new Set<number>()
        for (const q of rawQuestions) {
          const isModified = await isQuestionModified(q.id)
          if (isModified) {
            modifiedIds.add(q.id)
          }
        }
        setModifications(modifiedIds)
        
        console.log('Modified question IDs:', Array.from(modifiedIds))
        
      } catch (error) {
        console.error('Failed to load questions:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.log('Error details:', errorMessage)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [isClient])

  // Filter questions based on topic and search
  const filteredQuestions = questions.filter(q => {
    const matchesTopic = selectedTopic === 'all' || q.topic === selectedTopic
    const matchesSearch = searchTerm === '' || 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.options.some(opt => opt.text.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesTopic && matchesSearch
  })

  // Paginate questions
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage)
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage
  )

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion({ ...question })
  }

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return
    
    setSaving(true)
    try {
      console.log('Saving question:', {
        id: editingQuestion.id,
        correctAnswers: editingQuestion.correctAnswers,
        optionCount: editingQuestion.options.length
      })
      
      const response = await fetch('/api/questions/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingQuestion),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save question')
      }
      
      // Save to Supabase storage
      console.log('Before Supabase save')
      
      await saveQuestionModification(editingQuestion)
      
      const newStats = await questionStorage.getStatistics()
      const isModified = await isQuestionModified(editingQuestion.id)
      
      console.log('After Supabase save:', {
        newStats,
        isModified
      })
      
      // Update local state
      setQuestions(prev => 
        prev.map(q => q.id === editingQuestion.id ? editingQuestion : q)
      )
      
      // Track modification
      setModifications(prev => new Set(prev.add(editingQuestion.id)))
      
      setEditingQuestion(null)
      
      // Show success message
      console.log('Question updated successfully and saved via Edge Functions')
      alert('Question saved successfully! Changes are now persistent in the database via Edge Functions.')
    } catch (error) {
      console.error('Failed to save question:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert('Failed to save question: ' + errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingQuestion(null)
  }

  const toggleCorrectAnswer = (optionId: string) => {
    if (!editingQuestion) return
    
    setEditingQuestion(prev => {
      if (!prev) return null
      
      const updatedOptions = prev.options.map(opt => 
        opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
      )
      
      const correctAnswers = updatedOptions.filter(opt => opt.isCorrect).map(opt => opt.id)
      
      return {
        ...prev,
        options: updatedOptions,
        correctAnswers
      }
    })
  }

  const handleExportModifications = async () => {
    try {
      const exportData = await questionStorage.exportModifications()
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `question-modifications-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export modifications:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert('Failed to export modifications: ' + errorMessage)
    }
  }

  const handleImportModifications = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const success = await questionStorage.importModifications(text)
        
        if (success) {
          // Reload data with new modifications
          window.location.reload()
        } else {
          alert('Failed to import modifications. Please check the file format.')
        }
      } catch (error) {
        console.error('Failed to import modifications:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        alert('Failed to import modifications: ' + errorMessage)
      }
    }
    input.click()
  }

  const handleResetModifications = async () => {
    if (confirm('Are you sure you want to reset all modifications? This action cannot be undone.')) {
      await questionStorage.clearModifications()
      window.location.reload()
    }
  }

  // Debug function to test Edge Function
  const testEdgeFunction = async () => {
    try {
      console.log('Testing Edge Function connection...')
      
      // Test questionStorage
      const stats = await questionStorage.getStatistics()
      console.log('Edge Function stats:', stats)
      
      const modifications = await questionStorage.getModifications()
      console.log('Current modifications:', modifications)
      
      alert(`Edge Function connection successful! Storage type: ${stats.storageType}. Check console for details.`)
    } catch (error) {
      console.error('Edge Function test failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert('Edge Function test failed: ' + errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
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
                <Settings className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Admin Panel</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredQuestions.length} Questions
              </Badge>
              
              {modifications.size > 0 && (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                  {modifications.size} Modified
                </Badge>
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportModifications}
                  className="hover:bg-green-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImportModifications}
                  className="hover:bg-blue-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                
                {modifications.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetModifications}
                    className="hover:bg-red-50 text-red-600 border-red-300"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testEdgeFunction}
                  className="hover:bg-purple-50 text-purple-600 border-purple-300"
                >
                  Test Edge Function
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search questions or options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Topic Filter */}
            <div className="sm:w-64">
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {topics.map(topic => (
                  <option key={topic.name} value={topic.name}>
                    {topic.name === 'all' ? 'All Topics' : topic.name} ({topic.questionCount})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Debug Info Section (only show when there are modifications or in dev) */}
        {(modifications.size > 0 || process.env.NODE_ENV === 'development') && (
          <div className="mb-6">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <strong>Storage Status:</strong> Edge Functions (CORS-Free)
                  </div>
                  <div>
                    <strong>Modifications:</strong> {modifications.size}
                  </div>
                  <div>
                    <strong>Client Ready:</strong> {isClient ? 'Yes' : 'No'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-6">
          {paginatedQuestions.map((question) => (
            <Card key={question.id} className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="mb-2">
                      Question {question.questionNumber}
                    </Badge>
                    <Badge variant="secondary" className="ml-2">
                      {question.topic}
                    </Badge>
                    {modifications.has(question.id) && (
                      <Badge variant="default" className="ml-2 bg-orange-100 text-orange-800 border-orange-300">
                        Modified
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditQuestion(question)}
                    disabled={editingQuestion?.id === question.id}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Answers
                  </Button>
                </div>
                
                <CardTitle className="text-lg leading-relaxed">
                  {question.question}
                </CardTitle>
                
                {question.note && (
                  <Alert>
                    <AlertDescription className="font-medium">
                      {question.note}
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              
              <CardContent>
                {editingQuestion?.id === question.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {editingQuestion.options.map((option) => (
                        <div 
                          key={option.id}
                          className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                            option.isCorrect
                              ? 'border-green-500 bg-green-50 dark:bg-green-950'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Checkbox
                            id={option.id}
                            checked={option.isCorrect}
                            onCheckedChange={() => toggleCorrectAnswer(option.id)}
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
                          <div className="flex items-center">
                            {option.isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveQuestion}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="space-y-3">
                    {question.options.map((option) => (
                      <div 
                        key={option.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg border ${
                          option.isCorrect
                            ? 'border-green-500 bg-green-50 dark:bg-green-950'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">
                            {option.text}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {option.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? 'bg-blue-600 text-white' : ''}
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}