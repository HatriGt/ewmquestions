import { NextRequest, NextResponse } from 'next/server'
import { parseQuestionsFromMarkdown } from '@/utils/questionParser'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Read the markdown file
    const filePath = path.join(process.cwd(), 'EwmQuestions25a2a447de1180cf801fc1d16734c656.md')
    const markdownContent = fs.readFileSync(filePath, 'utf-8')
    
    // Parse the questions
    const { questions, topics } = parseQuestionsFromMarkdown(markdownContent)
    
    return NextResponse.json({
      questions,
      topics,
      totalQuestions: questions.length
    })
  } catch (error) {
    console.error('Error loading questions:', error)
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    )
  }
}