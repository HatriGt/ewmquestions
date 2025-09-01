import { Question, QuestionOption, TopicInfo } from '@/types/questions'
import fs from 'fs'
import path from 'path'

// Parse the markdown questions file and extract structured data
export function parseQuestionsFromMarkdown(markdownContent: string): { questions: Question[], topics: TopicInfo[] } {
  const questions: Question[] = []
  const topicCounts: Record<string, number> = {}
  
  // Split content by topics first
  const topicSections = markdownContent.split(/## 📘 \*\*(.*?)\*\*/)
  
  let currentTopic = 'General'
  
  for (let i = 1; i < topicSections.length; i += 2) {
    currentTopic = topicSections[i]
    const topicContent = topicSections[i + 1] || ''
    
    // Find all questions in this topic
    const questionMatches = topicContent.matchAll(/### \*\*Question No\.:\*\* (\d+) of \d+\s*\*\*Question:\*\*\s*(.*?)(?=---)/gs)
    
    for (const match of questionMatches) {
      try {
        const questionNumber = parseInt(match[1])
        const questionContent = match[2]
        
        // Extract question text
        const questionTextMatch = questionContent.match(/^(.*?)(?=\*Note:|\*\*Options:|$)/s)
        const questionText = questionTextMatch ? questionTextMatch[1].trim() : ''
        
        // Extract note if present
        const noteMatch = questionContent.match(/\*Note:\s*(.*?)(?=\*\*Options:|$)/s)
        const note = noteMatch ? noteMatch[1].trim() : undefined
        
        // Extract options
        const optionsMatch = questionContent.match(/\*\*Options:\*\*\s*(.*?)(?=\*\*Selected Answer|$)/s)
        const options: QuestionOption[] = []
        
        if (optionsMatch) {
          const optionLines = optionsMatch[1].split('\n').filter(line => line.trim().startsWith('-'))
          
          optionLines.forEach((line, optIndex) => {
            const isCorrect = line.includes('✅')
            const text = line.replace(/^-\s*(✅|⬜)\s*/, '').trim()
            
            if (text) {
              options.push({
                id: `q${questionNumber}_option_${optIndex}`,
                text,
                isCorrect
              })
            }
          })
        }
        
        // Extract correct answers
        const correctAnswers = options.filter(opt => opt.isCorrect).map(opt => opt.id)
        
        // Determine difficulty based on number of correct answers and note content
        let difficulty: 'easy' | 'medium' | 'hard' = 'medium'
        if (correctAnswers.length === 1 && options.length <= 4) {
          difficulty = 'easy'
        } else if (correctAnswers.length > 2 || (note && note.includes('3 correct answers'))) {
          difficulty = 'hard'
        }
        
        // Create question object
        const question: Question = {
          id: questionNumber,
          questionNumber,
          topic: currentTopic,
          question: questionText,
          note: note?.replace(/\*Note:\s*/, ''),
          options,
          correctAnswers,
          metadata: {
            difficulty,
            estimatedTime: difficulty === 'easy' ? 60 : difficulty === 'medium' ? 90 : 120,
            tags: [currentTopic.toLowerCase().replace(/[^a-z0-9]/g, '-')]
          }
        }
        
        questions.push(question)
        topicCounts[currentTopic] = (topicCounts[currentTopic] || 0) + 1
        
      } catch (error) {
        console.warn(`Error parsing question in topic ${currentTopic}:`, error)
      }
    }
  }
  
  // Sort questions by question number
  questions.sort((a, b) => a.questionNumber - b.questionNumber)
  
  // Create topics array
  const topics: TopicInfo[] = Object.entries(topicCounts).map(([name, count]) => ({
    name,
    questionCount: count,
    description: getTopicDescription(name)
  }))
  
  return { questions, topics }
}

function getTopicDescription(topicName: string): string {
  const descriptions: Record<string, string> = {
    'Cross Topics (Labor Management, Exception Handling, Batches, Serial Numbers)': 'Labor management, exception codes, batch handling, and serial number management',
    'Inbound Processes (Value Added Services, Cross-docking, Quality Management)': 'Goods receipt, value-added services, cross-docking, and quality inspections',
    'Internal Processing (Physical Inventory, Replenishment)': 'Physical inventory procedures and replenishment strategies',
    'Managing Clean Core': 'SAP S/4HANA Cloud clean core principles and data management',
    'Outbound Processes (Wave Management, Production Integration)': 'Picking, packing, wave management, and production integration',
    'Process and Layout Oriented Storage Control': 'Storage processes, layout control, and process-oriented storage management',
    'Shipping and Receiving': 'Transportation planning, yard management, and shipping processes',
    'System Integration, Master Data and Delivery Document Customizing': 'System integration, master data setup, and document configuration',
    'Warehouse Management (Monitor - Cockpit)': 'Warehouse monitoring, cockpit functionality, and measurement services',
    'Warehouse Processing, Warehouse Task and Order Creation, Strategies': 'Warehouse task creation, order processing, and putaway/removal strategies',
    'Warehouse Structure, Resource Management and SAP EWM Master Data': 'Warehouse structure, resource management, and master data configuration'
  }
  
  return descriptions[topicName] || 'SAP EWM certification topic'
}

// Load questions from file system (Next.js API route will handle this)
export async function loadQuestionsFromFile(): Promise<{ questions: Question[], topics: TopicInfo[] }> {
  try {
    const response = await fetch('/api/questions')
    if (!response.ok) {
      throw new Error('Failed to load questions')
    }
    return await response.json()
  } catch (error) {
    console.error('Error loading questions:', error)
    return { questions: sampleQuestions, topics: [] }
  }
}

// Static questions data extracted from the markdown file
export const sampleQuestions: Question[] = [
  {
    id: 3,
    questionNumber: 3,
    topic: 'Cross Topics (Labor Management, Exception Handling, Batches, Serial Numbers)',
    question: 'Your customer wants to implement the material flow system (MFS) to control conveyors and the automated high rack storage area.\n\nWhich standard options do you have to communicate with the programmable logic controllers (PLC)?',
    note: 'There are 2 correct answers to this question.',
    options: [
      { id: 'q3_option_0', text: 'Use an RFC adaptor (e.g. SAP Plant Connectivity)', isCorrect: true },
      { id: 'q3_option_1', text: 'Use the ALE interface to send an IDoc to a 3rd party software', isCorrect: true },
      { id: 'q3_option_2', text: 'Directly integrate to the PLC using ABAP Push Channels', isCorrect: false },
      { id: 'q3_option_3', text: 'Send an IDoc through a Post Processing Framework action to the PLC', isCorrect: false }
    ],
    correctAnswers: ['q3_option_0', 'q3_option_1'],
    metadata: {
      difficulty: 'medium',
      estimatedTime: 90,
      tags: ['cross-topics']
    }
  }
  // More questions will be loaded dynamically
]