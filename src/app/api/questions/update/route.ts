import { NextRequest, NextResponse } from 'next/server'
import { Question } from '@/types/questions'

export async function PUT(request: NextRequest) {
  try {
    const question: Question = await request.json()
    
    // Validate question data
    if (!question.id || !question.options || !question.correctAnswers) {
      return NextResponse.json(
        { error: 'Invalid question data' },
        { status: 400 }
      )
    }
    
    console.log('Saving question:', question.id, question.correctAnswers)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Return success response with modification flag for client-side storage
    return NextResponse.json({
      success: true,
      message: 'Question updated successfully',
      questionId: question.id,
      useClientStorage: true, // Flag for client to save to localStorage
      modification: {
        questionId: question.id,
        correctAnswers: question.correctAnswers,
        options: question.options,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error saving question:', error)
    return NextResponse.json(
      { error: 'Failed to save question' },
      { status: 500 }
    )
  }
}