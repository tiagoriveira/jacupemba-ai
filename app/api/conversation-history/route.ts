import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST - Salvar conversa no histórico
export async function POST(req: NextRequest) {
  try {
    const { user_fingerprint, query, response_summary } = await req.json()

    if (!user_fingerprint || !query) {
      return NextResponse.json(
        { error: 'user_fingerprint e query são obrigatórios' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('user_query_history')
      .insert({
        user_id: user_fingerprint,
        query,
        query_type: 'chat',
        response_summary: response_summary || null,
        metadata: {}
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error saving conversation:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar conversa' },
      { status: 500 }
    )
  }
}

// GET - Buscar histórico de conversas
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_fingerprint = searchParams.get('user_fingerprint')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!user_fingerprint) {
      return NextResponse.json(
        { error: 'user_fingerprint é obrigatório' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('user_query_history')
      .select('*')
      .eq('user_id', user_fingerprint)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Error fetching conversation history:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar histórico' },
      { status: 500 }
    )
  }
}

// DELETE - Limpar histórico de conversas
export async function DELETE(req: NextRequest) {
  try {
    const { user_fingerprint } = await req.json()

    if (!user_fingerprint) {
      return NextResponse.json(
        { error: 'user_fingerprint é obrigatório' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_query_history')
      .delete()
      .eq('user_id', user_fingerprint)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Histórico limpo com sucesso'
    })
  } catch (error) {
    console.error('Error deleting conversation history:', error)
    return NextResponse.json(
      { error: 'Erro ao limpar histórico' },
      { status: 500 }
    )
  }
}
