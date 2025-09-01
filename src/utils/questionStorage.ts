import { Question, QuestionOption } from '@/types/questions'
import { QuestionModificationRow, QuestionModificationInsert } from '@/lib/supabase'

// Edge Function base URL
const EDGE_FUNCTION_BASE_URL = 'https://tftiznxajayvfripufdy.supabase.co/functions/v1/-question-modifications-proxy'

interface QuestionModification {
  questionId: number
  correctAnswers: string[]
  options: QuestionOption[]
  lastModified: Date
}

/**
 * Edge Function-based storage manager for question modifications
 * Provides persistent storage across sessions and devices without CORS issues
 */
export class QuestionStorageManager {
  /**
   * Save a question modification via Edge Function
   */
  async saveModification(questionId: number, correctAnswers: string[], options: QuestionOption[]): Promise<void> {
    try {
      const modificationData: QuestionModificationInsert = {
        question_id: questionId,
        correct_answers: correctAnswers,
        options: options
      }

      const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/question-modifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modificationData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      console.log(`Saved modification for question ${questionId} via Edge Function`)
    } catch (error) {
      console.error('Error saving modification via Edge Function:', error)
      throw new Error('Failed to save question modification')
    }
  }

  /**
   * Get all stored modifications via Edge Function
   */
  async getModifications(): Promise<Record<number, QuestionModification>> {
    try {
      const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/question-modifications`)
      
      if (!response.ok) {
        const errorData = await response.json()
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
      console.error('Error reading modifications via Edge Function:', error)
      return {}
    }
  }

  /**
   * Get modification for a specific question via Edge Function
   */
  async getModification(questionId: number): Promise<QuestionModification | null> {
    try {
      const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/question-modifications/question/${questionId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        const errorData = await response.json()
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
      console.error('Error getting modification via Edge Function:', error)
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
   * Remove a specific modification via Edge Function
   */
  async removeModification(questionId: number): Promise<void> {
    try {
      // First get the modification to find its ID
      const modification = await this.getModification(questionId)
      if (!modification) {
        console.log(`No modification found for question ${questionId}`)
        return
      }

      // Get all modifications to find the one with this question_id
      const allMods = await this.getModifications()
      const modRow = Object.values(allMods).find(mod => mod.questionId === questionId)
      
      if (!modRow) {
        console.log(`No modification row found for question ${questionId}`)
        return
      }

      // For now, we'll use a workaround since the Edge Function expects ID-based deletion
      // We'll clear and recreate the data without this modification
      const { [questionId]: removed, ...remainingMods } = allMods
      
      // Clear all and recreate remaining ones
      await this.clearModifications()
      
      // Recreate remaining modifications
      for (const mod of Object.values(remainingMods)) {
        await this.saveModification(mod.questionId, mod.correctAnswers, mod.options)
      }

      console.log(`Removed modification for question ${questionId} via Edge Function`)
    } catch (error) {
      console.error('Error removing modification via Edge Function:', error)
    }
  }

  /**
   * Clear all modifications via Edge Function
   */
  async clearModifications(): Promise<void> {
    try {
      // Get all modifications first
      const allMods = await this.getModifications()
      
      // Delete each modification individually since we don't have a bulk delete endpoint
      for (const questionId of Object.keys(allMods)) {
        await this.removeModification(parseInt(questionId))
      }

      console.log('Cleared all modifications via Edge Function')
    } catch (error) {
      console.error('Error clearing modifications via Edge Function:', error)
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
      version: '2.0.0', // Increment version for Edge Function
      modifications,
      lastSync: new Date(),
      source: 'edge-function'
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

      console.log(`Imported ${modifications.length} modifications via Edge Function`)
      return true
    } catch (error) {
      console.error('Error importing modifications via Edge Function:', error)
      return false
    }
  }

  /**
   * Get statistics about modifications via Edge Function
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
        storageType: 'Edge Function (CORS-Free)'
      }
    } catch (error) {
      console.error('Error getting statistics via Edge Function:', error)
      return {
        totalModifications: 0,
        lastModified: null,
        storageType: 'Edge Function (Error)'
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