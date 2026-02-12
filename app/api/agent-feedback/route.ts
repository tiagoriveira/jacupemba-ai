import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST - Criar feedback do agente
export async function POST(req: NextRequest) {
  try {
    const { message_id, rating, comment, user_fingerprint } = await req.json()

    // Validação
    if (!message_id || !rating) {
      return NextResponse.json(
        { error: 'message_id e rating são obrigatórios' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating deve estar entre 1 e 5' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('agent_feedback')
      .insert({
        message_id,
        rating,
        comment: comment || null,
        user_id: user_fingerprint || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Feedback registrado com sucesso',
      data
    })
  } catch (error) {
    console.error('Error saving agent feedback:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar feedback' },
      { status: 500 }
    )
  }
}

// GET - Buscar estatísticas de feedback do agente
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '7')

    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data, error } = await supabase
      .from('agent_feedback')
      .select('rating, created_at')
      .gte('created_at', since.toISOString())

    if (error) throw error

    // Calcular estatísticas
    const totalFeedback = data.length
    const avgRating = totalFeedback > 0
      ? data.reduce((acc, f) => acc + f.rating, 0) / totalFeedback
      : 0

    const ratingDistribution = {
      1: data.filter(f => f.rating === 1).length,
      2: data.filter(f => f.rating === 2).length,
      3: data.filter(f => f.rating === 3).length,
      4: data.filter(f => f.rating === 4).length,
      5: data.filter(f => f.rating === 5).length
    }

    return NextResponse.json({
      success: true,
      data: {
        totalFeedback,
        avgRating: Math.round(avgRating * 100) / 100,
        ratingDistribution,
        period: `${days} days`
      }
    })
  } catch (error) {
    console.error('Error fetching agent feedback:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar feedback' },
      { status: 500 }
    )
  }
}
