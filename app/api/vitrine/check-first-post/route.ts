import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 })
    }

    const phoneDigits = phone.replace(/\D/g, '')

    const { count } = await supabase
      .from('vitrine_posts')
      .select('*', { count: 'exact', head: true })
      .eq('contact_phone', phoneDigits)

    return NextResponse.json({
      is_first_post: (count ?? 0) === 0,
      total_posts: count ?? 0,
      price: 30.00,
    })
  } catch (error) {
    console.error('Erro ao verificar primeiro post:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
