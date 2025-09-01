import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface QuestionModification {
  question_id: number
  correct_answers: string[]
  options: Record<string, unknown>[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for server-side operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const method = req.method

    // GET /question-modifications - Get all modifications
    if (method === 'GET' && url.pathname === '/question-modifications') {
      const { data, error } = await supabaseClient
        .from('question_modifications')
        .select('*')

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // GET /question-modifications/:id - Get specific modification
    if (method === 'GET' && url.pathname.startsWith('/question-modifications/')) {
      const questionId = parseInt(url.pathname.split('/')[2])
      
      const { data, error } = await supabaseClient
        .from('question_modifications')
        .select('*')
        .eq('question_id', questionId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return new Response(
            JSON.stringify({ success: true, data: null }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        }
        throw error
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // POST /question-modifications - Create or update modification
    if (method === 'POST' && url.pathname === '/question-modifications') {
      const body: QuestionModification = await req.json()

      const { data, error } = await supabaseClient
        .from('question_modifications')
        .upsert({
          question_id: body.question_id,
          correct_answers: body.correct_answers,
          options: body.options,
        }, {
          onConflict: 'question_id',
        })
        .select()

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: data[0],
          message: 'Question modification saved successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // DELETE /question-modifications/:id - Delete specific modification
    if (method === 'DELETE' && url.pathname.startsWith('/question-modifications/')) {
      const questionId = parseInt(url.pathname.split('/')[2])
      
      const { error } = await supabaseClient
        .from('question_modifications')
        .delete()
        .eq('question_id', questionId)

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Question modification deleted successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // DELETE /question-modifications - Delete all modifications
    if (method === 'DELETE' && url.pathname === '/question-modifications') {
      const { error } = await supabaseClient
        .from('question_modifications')
        .delete()
        .neq('id', 0) // Delete all rows

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All question modifications cleared successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // GET /question-modifications/stats - Get statistics
    if (method === 'GET' && url.pathname === '/question-modifications/stats') {
      const { data, error } = await supabaseClient
        .from('question_modifications')
        .select('updated_at, created_at')

      if (error) {
        throw error
      }

      const totalModifications = data?.length || 0
      let lastModified: string | null = null
      
      data?.forEach(row => {
        const modDate = row.updated_at || row.created_at
        if (!lastModified || modDate > lastModified) {
          lastModified = modDate
        }
      })

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            totalModifications,
            lastModified,
            storageType: 'Supabase Edge Functions'
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})