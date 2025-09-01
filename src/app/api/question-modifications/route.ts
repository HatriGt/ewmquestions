import { NextRequest, NextResponse } from 'next/server'

const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_EDGE_FUNCTION_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function callEdgeFunction(endpoint: string, options: RequestInit = {}) {
  const url = `${EDGE_FUNCTION_URL}/question-modifications${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      ...options.headers,
    },
  })

  return response
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')
    
    let endpoint = ''
    if (questionId) {
      // Get specific question modification
      endpoint = `/${questionId}`
      
      const response = await callEdgeFunction(endpoint, {
        method: 'GET',
      })

      if (response.status === 404) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Edge function request failed')
      }

      return NextResponse.json(data, { status: response.status })
    } else {
      // Get all modifications
      const response = await callEdgeFunction('', {
        method: 'GET',
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Edge function request failed')
      }

      return NextResponse.json(data, { status: response.status })
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
    
    const response = await callEdgeFunction('', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Edge function request failed')
    }

    return NextResponse.json(data, { status: response.status })
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
    
    const endpoint = questionId ? `/${questionId}` : ''
    
    const response = await callEdgeFunction(endpoint, {
      method: 'DELETE',
    })

    if (response.status === 404) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Edge function request failed')
    }

    return NextResponse.json(data, { status: response.status })
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