import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { post_id } = await request.json()

    if (!post_id) {
      return NextResponse.json(
        { error: 'post_id é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Sessão inválida ou expirada' },
        { status: 401 }
      )
    }

    // Buscar o post existente
    const { data: post, error: fetchError } = await supabase
      .from('vitrine_posts')
      .select('*')
      .eq('id', post_id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o post pertence ao usuário autenticado (por email ou user_id)
    const isOwner = post.user_id === user.id || 
                    (post.contact_email === user.email) ||
                    (!post.user_id && post.contact_phone && request.headers.get('x-user-phone') === post.contact_phone)
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Você não tem permissão para republicar este post' },
        { status: 403 }
      )
    }

    // Verificar se o post está expirado
    const now = new Date()
    const expiresAt = new Date(post.expires_at)
    if (expiresAt > now) {
      return NextResponse.json(
        { error: 'Post ainda não expirou. Não é possível republicar.' },
        { status: 400 }
      )
    }

    // Posts pagos (is_paid=true): sempre exigem novo pagamento via Stripe
    // Preço baseado na categoria
    const categoryPrices: Record<string, number> = {
      produto: 15.00,
      servico: 15.00,
      comunicado: 20.00,
      vaga: 0,
      informativo: 0,
    }
    const repostPrice = categoryPrices[post.category] || 15.00
    
    if (post.is_paid && repostPrice > 0) {
      return NextResponse.json({
        success: false,
        requires_payment: true,
        price: repostPrice,
        message: `Republicação requer pagamento de R$ ${repostPrice.toFixed(2).replace('.', ',')}`,
        post_id: post.id,
      })
    }

    // Posts grátis (primeiro post ou categoria gratuita): verificar limite de republicações
    if (!post.is_paid && post.repost_count >= post.max_reposts) {
      return NextResponse.json({
        success: false,
        error: `Limite de republicações atingido. Crie um novo post${repostPrice > 0 ? ` (R$ ${repostPrice.toFixed(2).replace('.', ',')})` : ''}.`,
        repost_count: post.repost_count,
        max_reposts: post.max_reposts,
      }, { status: 400 })
    }

    // Republicar post grátis (status volta para pendente, admin aprova e define expires_at)
    const { data: updatedPost, error: updateError } = await supabase
      .from('vitrine_posts')
      .update({
        repost_count: post.repost_count + 1,
        status: 'pendente',
        updated_at: new Date().toISOString(),
      })
      .eq('id', post_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao republicar post' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Post republicado e enviado para aprovação!',
      post: updatedPost,
      repost_count: updatedPost.repost_count,
      max_reposts: updatedPost.max_reposts,
    })
  } catch (error) {
    console.error('Erro ao republicar post:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
