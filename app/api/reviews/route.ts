import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST - Criar nova avaliação de comércio
export async function POST(req: NextRequest) {
  try {
    const { business_id, rating, comment, user_fingerprint } = await req.json()

    // Validação
    if (!business_id || !rating || !user_fingerprint) {
      return NextResponse.json(
        { error: 'business_id, rating e user_fingerprint são obrigatórios' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating deve estar entre 1 e 5' },
        { status: 400 }
      )
    }

    // Verificar se usuário já avaliou este comércio
    const { data: existingReview } = await supabase
      .from('business_reviews')
      .select('id')
      .eq('business_id', business_id)
      .eq('user_id', user_fingerprint)
      .single()

    if (existingReview) {
      // Atualizar avaliação existente
      const { data, error } = await supabase
        .from('business_reviews')
        .update({
          rating,
          comment: comment || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReview.id)
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: 'Avaliação atualizada com sucesso',
        data
      })
    }

    // Criar nova avaliação
    const { data, error } = await supabase
      .from('business_reviews')
      .insert({
        business_id,
        user_id: user_fingerprint,
        rating,
        comment: comment || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Avaliação criada com sucesso',
      data
    })
  } catch (error) {
    console.error('Error saving review:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar avaliação' },
      { status: 500 }
    )
  }
}

// GET - Buscar avaliações de um comércio
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const business_id = searchParams.get('business_id')

    if (!business_id) {
      return NextResponse.json(
        { error: 'business_id é obrigatório' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('business_reviews')
      .select('*')
      .eq('business_id', business_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calcular média
    const avgRating = data.length > 0
      ? data.reduce((acc, review) => acc + review.rating, 0) / data.length
      : 0

    return NextResponse.json({
      success: true,
      data: {
        reviews: data,
        count: data.length,
        avgRating: Math.round(avgRating * 10) / 10
      }
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar avaliações' },
      { status: 500 }
    )
  }
}
