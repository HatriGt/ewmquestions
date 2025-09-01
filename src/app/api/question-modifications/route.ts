import { NextRequest, NextResponse } from 'next/server'
import { QuestionOption } from '@/types/questions'

// Temporary in-memory storage for development
// TODO: Replace with actual Supabase integration when credentials are configured
let mockStorage: Array<{
  id: number
  question_id: number
  correct_answers: string[]
  options: QuestionOption[]
  created_at: string
  updated_at: string
}> = []

let nextId = 1

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')
    
    if (questionId) {
      // Get specific question modification
      const modification = mockStorage.find(m => m.question_id === parseInt(questionId))
      
      if (!modification) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      return NextResponse.json(modification)
    } else {
      // Get all modifications
      return NextResponse.json(mockStorage)
    }
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch question modifications',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Find existing modification or create new one
    const existingIndex = mockStorage.findIndex(m => m.question_id === body.question_id)
    
    const modification = {
      id: existingIndex >= 0 ? mockStorage[existingIndex].id : nextId++,
      question_id: body.question_id,
      correct_answers: body.correct_answers,
      options: body.options,
      created_at: existingIndex >= 0 ? mockStorage[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (existingIndex >= 0) {
      mockStorage[existingIndex] = modification
    } else {
      mockStorage.push(modification)
    }

    return NextResponse.json({ 
      success: true, 
      data: modification,
      message: 'Question modification saved successfully (mock storage)'
    })
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save question modification',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')
    
    if (questionId) {
      // Delete specific modification
      const index = mockStorage.findIndex(m => m.question_id === parseInt(questionId))
      
      if (index >= 0) {
        mockStorage.splice(index, 1)
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Question modification deleted successfully (mock storage)'
      })
    } else {
      // Delete all modifications
      mockStorage = []
      nextId = 1

      return NextResponse.json({ 
        success: true, 
        message: 'All question modifications cleared successfully (mock storage)'
      })
    }
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete question modification',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}