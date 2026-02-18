import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Preços por categoria
const CATEGORY_PRICES: Record<string, number> = {
  produto: 15.00,
  servico: 15.00,
  comunicado: 20.00,
  vaga: 0,
  informativo: 0,
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const category = searchParams.get('category')

    if (!phone) {
      return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 })
    }

    const phoneDigits = phone.replace(/\D/g, '')

    const { count } = await supabase
      .from('vitrine_posts')
      .select('*', { count: 'exact', head: true })
      .eq('contact_phone', phoneDigits)

    const isFirstPost = (count ?? 0) === 0
    const categoryPrice = category ? (CATEGORY_PRICES[category] || 15.00) : 15.00

    return NextResponse.json({
      is_first_post: isFirstPost,
      total_posts: count ?? 0,
      price: categoryPrice,
      is_free: isFirstPost || categoryPrice === 0,
      prices: CATEGORY_PRICES,
    })
  } catch (error) {
    console.error('Erro ao verificar primeiro post:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
