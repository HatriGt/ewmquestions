import { createClient } from '@supabase/supabase-js'

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
  options: any[] // JSON field
  created_at?: string
  updated_at?: string
}

export interface QuestionModificationInsert extends Omit<QuestionModificationRow, 'id' | 'created_at' | 'updated_at'> {}
export interface QuestionModificationUpdate extends Partial<QuestionModificationInsert> {}