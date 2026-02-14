import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN

export async function POST(req: Request) {
  try {
    // Validar token do webhook (segurança)
    const token = req.headers.get('asaas-access-token')
    
    if (ASAAS_WEBHOOK_TOKEN && token !== ASAAS_WEBHOOK_TOKEN) {
      console.error('[v0] Invalid webhook token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await req.json()
    
    console.log('[v0] Webhook received:', {
      event: payload.event,
      paymentId: payload.payment?.id,
      status: payload.payment?.status
    })

    // Processar evento
    const event = payload.event
    const payment = payload.payment

    // Registrar evento no Supabase para auditoria
    const supabase = createClient()
    
    const { error: logError } = await supabase
      .from('payment_events')
      .insert({
        event_type: event,
        payment_id: payment?.id,
        status: payment?.status,
        value: payment?.value,
        customer_id: payment?.customer,
        payload: payload
      })

    if (logError) {
      console.error('[v0] Error logging webhook:', logError)
    }

    // Processar eventos específicos
    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        console.log('[v0] Payment confirmed:', payment.id)
        // Aqui você pode liberar acesso, enviar email, etc.
        break

      case 'PAYMENT_OVERDUE':
        console.log('[v0] Payment overdue:', payment.id)
        // Enviar lembrete
        break

      case 'PAYMENT_DELETED':
        console.log('[v0] Payment deleted:', payment.id)
        break

      default:
        console.log('[v0] Unhandled event:', event)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('[v0] Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}
