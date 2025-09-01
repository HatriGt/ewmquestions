import { Question, QuestionOption } from '@/types/questions'

const STORAGE_KEY = 'sap_ewm_question_modifications'
const STORAGE_VERSION = '1.0.0'

interface QuestionModification {
  questionId: number
  correctAnswers: string[]
  options: QuestionOption[]
  lastModified: Date
}

interface StorageData {
  version: string
  modifications: Record<number, QuestionModification>
  lastSync: Date
}

/**
 * Client-side storage manager for question modifications
 * Uses localStorage for persistence across browser sessions
 */
export class QuestionStorageManager {
  private storage: Storage | null = null

  constructor() {
    // Initialize storage only on client-side
    if (typeof window !== 'undefined') {
      this.storage = window.localStorage
    }
  }

  /**
   * Check if storage is available
   */
  private isStorageAvailable(): boolean {
    return this.storage !== null
  }

  /**
   * Get all stored modifications
   */
  getModifications(): Record<number, QuestionModification> {
    if (!this.isStorageAvailable()) {
      console.warn('Storage not available, returning empty modifications')
      return {}
    }

    try {
      const data = this.storage!.getItem(STORAGE_KEY)
      if (!data) return {}

      const parsed: StorageData = JSON.parse(data)
      
      // Check version compatibility
      if (parsed.version !== STORAGE_VERSION) {
        console.warn('Storage version mismatch, clearing modifications')
        this.clearModifications()
        return {}
      }

      return parsed.modifications || {}
    } catch (error) {
      console.error('Error reading modifications from storage:', error)
      return {}
    }
  }

  /**
   * Save a question modification
   */
  saveModification(questionId: number, correctAnswers: string[], options: QuestionOption[]): void {
    if (!this.isStorageAvailable()) {
      console.warn('Storage not available, modification not saved')
      return
    }

    try {
      const modifications = this.getModifications()
      
      modifications[questionId] = {
        questionId,
        correctAnswers: [...correctAnswers],
        options: options.map(opt => ({ ...opt })),
        lastModified: new Date()
      }

      const storageData: StorageData = {
        version: STORAGE_VERSION,
        modifications,
        lastSync: new Date()
      }

      this.storage!.setItem(STORAGE_KEY, JSON.stringify(storageData))
      console.log(`Saved modification for question ${questionId}`)
    } catch (error) {
      console.error('Error saving modification:', error)
      throw new Error('Failed to save question modification')
    }
  }

  /**
   * Get modification for a specific question
   */
  getModification(questionId: number): QuestionModification | null {
    const modifications = this.getModifications()
    return modifications[questionId] || null
  }

  /**
   * Check if a question has been modified
   */
  isModified(questionId: number): boolean {
    return this.getModification(questionId) !== null
  }

  /**
   * Remove a specific modification
   */
  removeModification(questionId: number): void {
    if (!this.isStorageAvailable()) return

    try {
      const modifications = this.getModifications()
      delete modifications[questionId]

      const storageData: StorageData = {
        version: STORAGE_VERSION,
        modifications,
        lastSync: new Date()
      }

      this.storage!.setItem(STORAGE_KEY, JSON.stringify(storageData))
      console.log(`Removed modification for question ${questionId}`)
    } catch (error) {
      console.error('Error removing modification:', error)
    }
  }

  /**
   * Clear all modifications
   */
  clearModifications(): void {
    if (!this.isStorageAvailable()) return

    try {
      this.storage!.removeItem(STORAGE_KEY)
      console.log('Cleared all modifications')
    } catch (error) {
      console.error('Error clearing modifications:', error)
    }
  }

  /**
   * Apply modifications to a list of questions
   */
  applyModifications(questions: Question[]): Question[] {
    const modifications = this.getModifications()
    
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
  exportModifications(): string {
    const storageData: StorageData = {
      version: STORAGE_VERSION,
      modifications: this.getModifications(),
      lastSync: new Date()
    }

    return JSON.stringify(storageData, null, 2)
  }

  /**
   * Import modifications from JSON
   */
  importModifications(jsonData: string): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('Storage not available, cannot import modifications')
      return false
    }

    try {
      const data: StorageData = JSON.parse(jsonData)
      
      // Validate structure
      if (!data.version || !data.modifications) {
        throw new Error('Invalid data structure')
      }

      // Check version compatibility
      if (data.version !== STORAGE_VERSION) {
        console.warn('Version mismatch during import, proceeding with caution')
      }

      this.storage!.setItem(STORAGE_KEY, JSON.stringify(data))
      console.log(`Imported ${Object.keys(data.modifications).length} modifications`)
      return true
    } catch (error) {
      console.error('Error importing modifications:', error)
      return false
    }
  }

  /**
   * Get statistics about modifications
   */
  getStatistics(): {
    totalModifications: number
    lastModified: Date | null
    storageSize: string
  } {
    const modifications = this.getModifications()
    const modificationCount = Object.keys(modifications).length
    
    let lastModified: Date | null = null
    Object.values(modifications).forEach(mod => {
      const modDate = new Date(mod.lastModified)
      if (!lastModified || modDate > lastModified) {
        lastModified = modDate
      }
    })

    let storageSize = '0 B'
    if (this.isStorageAvailable()) {
      try {
        const data = this.storage!.getItem(STORAGE_KEY)
        if (data) {
          const bytes = new Blob([data]).size
          storageSize = this.formatBytes(bytes)
        }
      } catch (error) {
        console.error('Error calculating storage size:', error)
      }
    }

    return {
      totalModifications: modificationCount,
      lastModified,
      storageSize
    }
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }
}

// Export singleton instance
export const questionStorage = new QuestionStorageManager()

// Export utility functions
export const applyQuestionModifications = (questions: Question[]): Question[] => {
  return questionStorage.applyModifications(questions)
}

export const saveQuestionModification = (question: Question): void => {
  questionStorage.saveModification(
    question.id,
    question.correctAnswers,
    question.options
  )
}

export const isQuestionModified = (questionId: number): boolean => {
  return questionStorage.isModified(questionId)
}