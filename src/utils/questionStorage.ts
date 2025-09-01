import { Question, QuestionOption } from '@/types/questions'
import { supabase, QuestionModificationRow, QuestionModificationInsert } from '@/lib/supabase'

interface QuestionModification {
  questionId: number
  correctAnswers: string[]
  options: QuestionOption[]
  lastModified: Date
}

/**
 * Supabase-based storage manager for question modifications
 * Provides persistent storage across sessions and devices
 */
export class QuestionStorageManager {
  /**
   * Save a question modification to Supabase
   */
  async saveModification(questionId: number, correctAnswers: string[], options: QuestionOption[]): Promise<void> {
    try {
      const modificationData: QuestionModificationInsert = {
        question_id: questionId,
        correct_answers: correctAnswers,
        options: options
      }

      const { error } = await supabase
        .from('question_modifications')
        .upsert(modificationData, {
          onConflict: 'question_id',
          ignoreDuplicates: false
        })

      if (error) {
        throw error
      }

      console.log(`Saved modification for question ${questionId} to Supabase`)
    } catch (error) {
      console.error('Error saving modification to Supabase:', error)
      throw new Error('Failed to save question modification')
    }
  }

  /**
   * Get all stored modifications from Supabase
   */
  async getModifications(): Promise<Record<number, QuestionModification>> {
    try {
      const { data, error } = await supabase
        .from('question_modifications')
        .select('*')

      if (error) {
        throw error
      }

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
      console.error('Error reading modifications from Supabase:', error)
      return {}
    }
  }

  /**
   * Get modification for a specific question
   */
  async getModification(questionId: number): Promise<QuestionModification | null> {
    try {
      const { data, error } = await supabase
        .from('question_modifications')
        .select('*')
        .eq('question_id', questionId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null
        }
        throw error
      }

      return {
        questionId: data.question_id,
        correctAnswers: data.correct_answers,
        options: data.options as QuestionOption[],
        lastModified: new Date(data.updated_at || data.created_at || '')
      }
    } catch (error) {
      console.error('Error getting modification from Supabase:', error)
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
   * Remove a specific modification
   */
  async removeModification(questionId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('question_modifications')
        .delete()
        .eq('question_id', questionId)

      if (error) {
        throw error
      }

      console.log(`Removed modification for question ${questionId} from Supabase`)
    } catch (error) {
      console.error('Error removing modification from Supabase:', error)
    }
  }

  /**
   * Clear all modifications
   */
  async clearModifications(): Promise<void> {
    try {
      const { error } = await supabase
        .from('question_modifications')
        .delete()
        .neq('id', 0) // Delete all rows

      if (error) {
        throw error
      }

      console.log('Cleared all modifications from Supabase')
    } catch (error) {
      console.error('Error clearing modifications from Supabase:', error)
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
      version: '2.0.0', // Increment version for Supabase
      modifications,
      lastSync: new Date(),
      source: 'supabase'
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

      console.log(`Imported ${modifications.length} modifications to Supabase`)
      return true
    } catch (error) {
      console.error('Error importing modifications to Supabase:', error)
      return false
    }
  }

  /**
   * Get statistics about modifications
   */
  async getStatistics(): Promise<{
    totalModifications: number
    lastModified: Date | null
    storageType: string
  }> {
    try {
      const { data, error } = await supabase
        .from('question_modifications')
        .select('updated_at, created_at')

      if (error) {
        throw error
      }

      const modificationCount = data?.length || 0
      
      let lastModified: Date | null = null
      data?.forEach(row => {
        const modDate = new Date(row.updated_at || row.created_at)
        if (!lastModified || modDate > lastModified) {
          lastModified = modDate
        }
      })

      return {
        totalModifications: modificationCount,
        lastModified,
        storageType: 'Supabase Database'
      }
    } catch (error) {
      console.error('Error getting statistics from Supabase:', error)
      return {
        totalModifications: 0,
        lastModified: null,
        storageType: 'Supabase Database (Error)'
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