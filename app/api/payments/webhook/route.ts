import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const ASAAS_WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET

export async function POST(req: Request) {
  try {
    // Validar token do webhook (segurança)
    const token = req.headers.get('asaas-access-token')
    
    if (ASAAS_WEBHOOK_SECRET && token !== ASAAS_WEBHOOK_SECRET) {
      console.error('[Asaas Webhook] Token inválido')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await req.json()
    
    console.log('[Asaas Webhook] Evento recebido:', {
      event: payload.event,
      paymentId: payload.payment?.id,
      status: payload.payment?.status
    })

    const event = payload.event
    const payment = payload.payment

    // Processar pagamentos confirmados
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      console.log('[Asaas Webhook] Pagamento confirmado:', payment.id)
      
      const externalReference = payment.externalReference
      
      if (externalReference === 'new_post') {
        // Novo post pago - precisa ser criado após pagamento
        // O frontend deve ter salvado os dados do post em algum lugar
        console.log('[Asaas Webhook] Novo post pago confirmado')
      } else {
        // Republicação de post existente
        const postId = externalReference
        
        // Buscar post
        const { data: post, error: fetchError } = await supabase
          .from('vitrine_posts')
          .select('*')
          .eq('id', postId)
          .single()

        if (!fetchError && post) {
          // Republicar: resetar expires_at e incrementar contador
          const newExpiresAt = new Date()
          newExpiresAt.setHours(newExpiresAt.getHours() + 48)

          const { error: updateError } = await supabase
            .from('vitrine_posts')
            .update({
              repost_count: post.repost_count + 1,
              expires_at: newExpiresAt.toISOString(),
              status: 'aprovado',
              payment_id: payment.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', postId)

          if (updateError) {
            console.error('[Asaas Webhook] Erro ao republicar post:', updateError)
          } else {
            console.log('[Asaas Webhook] Post republicado:', postId)
          }
        }
      }
    }

    // Processar outros eventos
    switch (event) {
      case 'PAYMENT_OVERDUE':
        console.log('[Asaas Webhook] Pagamento vencido:', payment.id)
        break

      case 'PAYMENT_DELETED':
        console.log('[Asaas Webhook] Pagamento deletado:', payment.id)
        break

      default:
        console.log('[Asaas Webhook] Evento não processado:', event)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('[Asaas Webhook] Erro ao processar:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}
