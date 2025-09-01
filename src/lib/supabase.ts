import { createClient } from '@supabase/supabase-js'
import { QuestionOption } from '@/types/questions'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for question modifications
export interface QuestionModificationRow {
  id?: number
  question_id: number
  correct_answers: string[]
  options: QuestionOption[] // Properly typed JSON field
  created_at?: string
  updated_at?: string
}

export interface QuestionModificationInsert {
  question_id: number
  correct_answers: string[]
  options: QuestionOption[]
}

export interface QuestionModificationUpdate {
  question_id?: number
  correct_answers?: string[]
  options?: QuestionOption[]
}