import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'phone é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar por contact_phone usando LIKE para match parcial (com ou sem DDD formatado)
    const digits = phone.replace(/\D/g, '')

    const { data: posts, error } = await supabase
      .from('vitrine_posts')
      .select('*')
      .like('contact_phone', `%${digits.slice(-9)}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar posts:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar posts' },
        { status: 500 }
      )
    }

    // Enriquecer posts com informações de status
    const now = new Date()
    const enrichedPosts = posts.map(post => {
      const expiresAt = new Date(post.expires_at)
      const isExpired = expiresAt < now
      const isActive = post.status === 'aprovado' && !isExpired
      const hoursRemaining = isExpired ? 0 : Math.max(0, Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))
      
      const canRepost = isExpired && (
        post.is_paid || // Posts pagos sempre podem republicar (com pagamento)
        post.repost_count < post.max_reposts // Posts grátis: verificar limite
      )

      return {
        ...post,
        is_expired: isExpired,
        is_active: isActive,
        hours_remaining: hoursRemaining,
        can_repost: canRepost,
        repost_limit_reached: !post.is_paid && post.repost_count >= post.max_reposts
      }
    })

    return NextResponse.json({
      success: true,
      posts: enrichedPosts,
      total: enrichedPosts.length
    })
  } catch (error) {
    console.error('Erro ao processar requisição:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
