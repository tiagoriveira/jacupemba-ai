import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const VALID_CATEGORIES = ['produto', 'servico', 'comunicado', 'vaga', 'informativo']
const POST_PRICE = 30.00

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

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: 'Categoria inválida' },
        { status: 400 }
      )
    }

    // Verificar quantos posts o usuário já criou (por telefone)
    const phoneDigits = contact_phone.replace(/\D/g, '')
    const { count } = await supabase
      .from('vitrine_posts')
      .select('*', { count: 'exact', head: true })
      .eq('contact_phone', phoneDigits)

    const isFirstPost = (count ?? 0) === 0

    // Se NÃO é primeiro post e NÃO tem stripe_payment_id → exigir pagamento
    if (!isFirstPost && !body.stripe_payment_id) {
      return NextResponse.json({
        success: false,
        requires_payment: true,
        is_first_post: false,
        price: POST_PRICE,
        message: `Primeiro anúncio grátis. Próximos: R$ ${POST_PRICE.toFixed(2).replace('.', ',')}`,
        post_data: body,
      })
    }

    // Criar post (grátis se primeiro, ou pago com stripe_payment_id)
    const { data: newPost, error } = await supabase
      .from('vitrine_posts')
      .insert({
        title,
        description: description || null,
        price: price || null,
        category,
        contact_name,
        contact_phone: phoneDigits,
        image_url: image_url || null,
        images: images || [],
        video_url: video_url || null,
        aspect_ratio: aspect_ratio || 'square',
        status: 'pendente',
        is_paid: !isFirstPost,
        stripe_payment_id: body.stripe_payment_id || null,
        repost_count: 0,
        max_reposts: isFirstPost ? 3 : 999,
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
      is_first_post: isFirstPost,
      message: isFirstPost
        ? 'Primeiro anúncio grátis! Enviado para aprovação.'
        : 'Post criado e aguardando aprovação do administrador',
      post: newPost,
    })
  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
