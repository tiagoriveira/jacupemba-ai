import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { post_id, user_id } = await request.json()

    if (!post_id || !user_id) {
      return NextResponse.json(
        { error: 'post_id e user_id são obrigatórios' },
        { status: 400 }
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

    // Verificar se o post pertence ao usuário
    if (post.user_id !== user_id) {
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

    // Lógica de republicação baseada na categoria
    const isPaidCategory = ['produto', 'servico', 'comunicado'].includes(post.category)
    
    if (isPaidCategory) {
      // Posts pagos: exigem novo pagamento
      return NextResponse.json({
        success: false,
        requires_payment: true,
        message: 'Este post requer pagamento para republicação',
        category: post.category,
        post_id: post.id
      })
    } else {
      // Posts grátis: verificar limite de republicações
      if (post.repost_count >= post.max_reposts) {
        return NextResponse.json({
          success: false,
          error: 'Limite de republicações atingido. Crie um novo post.',
          repost_count: post.repost_count,
          max_reposts: post.max_reposts
        }, { status: 400 })
      }

      // Republicar post grátis
      const newExpiresAt = new Date()
      newExpiresAt.setHours(newExpiresAt.getHours() + 48)

      const { data: updatedPost, error: updateError } = await supabase
        .from('vitrine_posts')
        .update({
          repost_count: post.repost_count + 1,
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
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
        message: 'Post republicado com sucesso!',
        post: updatedPost,
        repost_count: updatedPost.repost_count,
        max_reposts: updatedPost.max_reposts,
        expires_at: updatedPost.expires_at
      })
    }
  } catch (error) {
    console.error('Erro ao republicar post:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
