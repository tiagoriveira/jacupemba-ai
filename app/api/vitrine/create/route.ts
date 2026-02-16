import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Categorias e seus preços
const CATEGORY_CONFIG = {
  produto: { price: 15.00, is_paid: true },
  servico: { price: 15.00, is_paid: true },
  comunicado: { price: 20.00, is_paid: true },
  vaga: { price: 0.00, is_paid: false },
  informativo: { price: 0.00, is_paid: false },
} as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      price,
      category,
      contact_name,
      contact_phone,
      image_url,
      images,
      video_url,
      aspect_ratio,
    } = body

    // Validações básicas
    if (!title || !category || !contact_name || !contact_phone) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: title, category, contact_name, contact_phone' },
        { status: 400 }
      )
    }

    if (!CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]) {
      return NextResponse.json(
        { error: 'Categoria inválida' },
        { status: 400 }
      )
    }

    const categoryConfig = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]

    // Calcular data de expiração (48 horas)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48)

    // Se for categoria paga, retornar necessidade de pagamento
    if (categoryConfig.is_paid) {
      return NextResponse.json({
        success: false,
        requires_payment: true,
        message: 'Esta categoria requer pagamento',
        category_price: categoryConfig.price,
        category,
        post_data: body // Retornar dados para criar após pagamento
      })
    }

    // Categoria grátis: criar post pendente de aprovação
    const { data: newPost, error } = await supabase
      .from('vitrine_posts')
      .insert({
        title,
        description: description || null,
        price: price || null,
        category,
        contact_name,
        contact_phone,
        image_url: image_url || null,
        images: images || [],
        video_url: video_url || null,
        aspect_ratio: aspect_ratio || 'square',
        expires_at: expiresAt.toISOString(),
        status: 'pendente',
        is_paid: false,
        repost_count: 0,
        max_reposts: 3
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar post:', error)
      return NextResponse.json(
        { error: 'Erro ao criar post' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Post criado e aguardando aprovação do administrador',
      post: newPost
    })
  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
