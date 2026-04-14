import { NextRequest, NextResponse } from 'next/server'
import { stripe, getStripePriceForCategory } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_phone, post_data, category } = body

    if (!user_phone || !post_data) {
      return NextResponse.json(
        { error: 'Dados incompletos: user_phone e post_data são obrigatórios' },
        { status: 400 }
      )
    }

    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Obter preço baseado na categoria
    const priceConfig = getStripePriceForCategory(category || post_data.category || 'produto')

    // Criar Stripe Checkout Session (Embedded Mode)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Anúncio Jacupemba - ${category || 'Produto'}`,
              description: post_data.title || 'Publicação na vitrine digital',
            },
            unit_amount: priceConfig.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      ui_mode: 'embedded',
      return_url: `${baseUrl}/vitrine/criar?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        user_phone,
        post_data: JSON.stringify(post_data),
        category: category || post_data.category || 'produto',
      },
      payment_intent_data: {
        metadata: {
          user_phone,
          type: 'vitrine_post',
          category: category || post_data.category || 'produto',
        },
      },
    })

    // Registrar pagamento pendente no banco
    await supabase.from('vitrine_payments').insert({
      user_phone,
      stripe_session_id: session.id,
      payment_status: 'pending',
      amount: priceConfig.amount / 100,
    })

    return NextResponse.json({
      success: true,
      client_secret: session.client_secret,
      session_id: session.id,
    })
  } catch (error: any) {
    console.error('[Stripe] Erro ao criar checkout:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar sessão de pagamento' },
      { status: 500 }
    )
  }
}
