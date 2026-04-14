import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET não configurada')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('[Stripe Webhook] Erro de verificação:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('[Stripe Webhook] Checkout completo:', session.id)

        // Atualizar pagamento no banco
        const { error: updateError } = await supabase
          .from('vitrine_payments')
          .update({
            payment_status: 'paid',
            stripe_payment_intent: session.payment_intent as string,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', session.id)

        if (updateError) {
          console.error('[Stripe Webhook] Erro ao atualizar pagamento:', updateError)
        }

        // Criar o post automaticamente com os dados do metadata
        const postDataStr = session.metadata?.post_data
        const userPhone = session.metadata?.user_phone

        if (postDataStr && userPhone) {
          const postData = JSON.parse(postDataStr)

          const { data: newPost, error: postError } = await supabase
            .from('vitrine_posts')
            .insert({
              title: postData.title,
              description: postData.description || null,
              price: postData.price || null,
              category: postData.category,
              contact_name: postData.contact_name,
              contact_phone: postData.contact_phone,
              contact_email: postData.contact_email || null,
              image_url: postData.image_url || null,
              images: postData.images || [],
              video_url: postData.video_url || null,
              aspect_ratio: postData.aspect_ratio || 'square',
              status: 'pendente',
              is_paid: true,
              user_id: postData.user_id || null,
              stripe_payment_id: session.payment_intent as string,
              repost_count: 0,
              max_reposts: 999,
            })
            .select()
            .single()

          if (postError) {
            console.error('[Stripe Webhook] Erro ao criar post:', postError)
          } else {
            // Vincular post ao pagamento
            await supabase
              .from('vitrine_payments')
              .update({ post_id: newPost.id })
              .eq('stripe_session_id', session.id)

            console.log('[Stripe Webhook] Post criado:', newPost.id)
          }
        }

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session

        await supabase
          .from('vitrine_payments')
          .update({
            payment_status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_session_id', session.id)

        console.log('[Stripe Webhook] Sessão expirada:', session.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        await supabase
          .from('vitrine_payments')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent', paymentIntent.id)

        console.log('[Stripe Webhook] Pagamento falhou:', paymentIntent.id)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('[Stripe Webhook] Erro ao processar evento:', error)
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 })
  }
}
