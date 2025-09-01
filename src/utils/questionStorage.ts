import { Question, QuestionOption } from '@/types/questions'
import { QuestionModificationRow, QuestionModificationInsert } from '@/lib/supabase'

// API base URL - using local API routes that proxy to Edge Functions
const API_BASE_URL = '/api/question-modifications'

interface QuestionModification {
  questionId: number
  correctAnswers: string[]
  options: QuestionOption[]
  lastModified: Date
}

/**
 * API proxy-based storage manager for question modifications
 * Uses Next.js API routes that proxy to Supabase Edge Functions
 * Provides persistent storage across sessions and devices without CORS issues
 */
export class QuestionStorageManager {
  /**
   * Save a question modification via API proxy
   */
  async saveModification(questionId: number, correctAnswers: string[], options: QuestionOption[]): Promise<void> {
    try {
      const modificationData: QuestionModificationInsert = {
        question_id: questionId,
        correct_answers: correctAnswers,
        options: options
      }

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modificationData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      console.log(`Saved modification for question ${questionId} via API proxy`)
    } catch (error) {
      console.error('Error saving modification via API proxy:', error)
      throw new Error('Failed to save question modification')
    }
  }

  /**
   * Get all stored modifications via API proxy
   */
  async getModifications(): Promise<Record<number, QuestionModification>> {
    try {
      const response = await fetch(API_BASE_URL)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data: QuestionModificationRow[] = await response.json()
      const modifications: Record<number, QuestionModification> = {}
      
      data?.forEach((row: QuestionModificationRow) => {
        modifications[row.question_id] = {
          questionId: row.question_id,
          correctAnswers: row.correct_answers,
          options: row.options as QuestionOption[],
          lastModified: new Date(row.updated_at || row.created_at || '')
        }
      })

      return modifications
    } catch (error) {
      console.error('Error reading modifications via API proxy:', error)
      return {}
    }
  }

  /**
   * Get modification for a specific question via API proxy
   */
  async getModification(questionId: number): Promise<QuestionModification | null> {
    try {
      const response = await fetch(`${API_BASE_URL}?questionId=${questionId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data: QuestionModificationRow = await response.json()
      
      if (!data) return null

      return {
        questionId: data.question_id,
        correctAnswers: data.correct_answers,
        options: data.options as QuestionOption[],
        lastModified: new Date(data.updated_at || data.created_at || '')
      }
    } catch (error) {
      console.error('Error getting modification via API proxy:', error)
      return null
    }
  }

  /**
   * Check if a question has been modified
   */
  async isModified(questionId: number): Promise<boolean> {
    const modification = await this.getModification(questionId)
    return modification !== null
  }

  /**
   * Remove a specific modification via API proxy
   */
  async removeModification(questionId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}?questionId=${questionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`No modification found for question ${questionId}`)
          return
        }
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      console.log(`Removed modification for question ${questionId} via API proxy`)
    } catch (error) {
      console.error('Error removing modification via API proxy:', error)
      throw error
    }
  }

  /**
   * Clear all modifications via API proxy
   */
  async clearModifications(): Promise<void> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      console.log('Cleared all modifications via API proxy')
    } catch (error) {
      console.error('Error clearing modifications via API proxy:', error)
      throw error
    }
  }

  /**
   * Apply modifications to a list of questions
   */
  async applyModifications(questions: Question[]): Promise<Question[]> {
    const modifications = await this.getModifications()
    
    return questions.map(question => {
      const modification = modifications[question.id]
      
      if (!modification) {
        return question
      }

      // Apply the modification
      return {
        ...question,
        correctAnswers: [...modification.correctAnswers],
        options: modification.options.map(opt => ({
          ...opt,
          isCorrect: modification.correctAnswers.includes(opt.id)
        }))
      }
    })
  }

  /**
   * Export modifications as JSON
   */
  async exportModifications(): Promise<string> {
    const modifications = await this.getModifications()
    
    const exportData = {
      version: '3.0.0', // Updated version for API proxy architecture
      modifications,
      lastSync: new Date(),
      source: 'api-proxy-edge-functions'
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Import modifications from JSON
   */
  async importModifications(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData)
      
      // Validate structure
      if (!data.modifications) {
        throw new Error('Invalid data structure: missing modifications')
      }

      // Import each modification
      const modifications = Object.values(data.modifications) as QuestionModification[]
      
      for (const mod of modifications) {
        await this.saveModification(
          mod.questionId,
          mod.correctAnswers,
          mod.options
        )
      }

      console.log(`Imported ${modifications.length} modifications via API proxy`)
      return true
    } catch (error) {
      console.error('Error importing modifications via API proxy:', error)
      return false
    }
  }

  /**
   * Get statistics about modifications via API proxy
   */
  async getStatistics(): Promise<{
    totalModifications: number
    lastModified: Date | null
    storageType: string
  }> {
    try {
      const data = await this.getModifications()
      const modificationCount = Object.keys(data).length
      
      let lastModified: Date | null = null
      Object.values(data).forEach(mod => {
        if (!lastModified || mod.lastModified > lastModified) {
          lastModified = mod.lastModified
        }
      })

      return {
        totalModifications: modificationCount,
        lastModified,
        storageType: 'API Proxy to Edge Functions'
      }
    } catch (error) {
      console.error('Error getting statistics via API proxy:', error)
      return {
        totalModifications: 0,
        lastModified: null,
        storageType: 'API Proxy (Error)'
      }
    }
  }
}

// Export singleton instance
export const questionStorage = new QuestionStorageManager()

// Export utility functions
export const applyQuestionModifications = async (questions: Question[]): Promise<Question[]> => {
  return await questionStorage.applyModifications(questions)
}

export const saveQuestionModification = async (question: Question): Promise<void> => {
  await questionStorage.saveModification(
    question.id,
    question.correctAnswers,
    question.options
  )
}

export const isQuestionModified = async (questionId: number): Promise<boolean> => {
  return await questionStorage.isModified(questionId)
}