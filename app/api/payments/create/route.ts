import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const ASAAS_API_URL = 'https://api.asaas.com/v3'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

// Preços por categoria
const CATEGORY_PRICES = {
  produto: 15.00,
  servico: 15.00,
  comunicado: 20.00,
} as const

interface CreatePaymentRequest {
  user_id: string
  user_email: string
  user_name: string
  category: 'produto' | 'servico' | 'comunicado'
  post_data?: any
  post_id?: string
  is_repost?: boolean
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
}

export async function POST(req: Request) {
  try {
    if (!ASAAS_API_KEY) {
      return NextResponse.json(
        { error: 'Asaas API key não configurada' },
        { status: 500 }
      )
    }

    const body: CreatePaymentRequest = await req.json()

    // Validações
    if (!body.user_id || !body.user_email || !body.user_name) {
      return NextResponse.json(
        { error: 'Dados do usuário incompletos' },
        { status: 400 }
      )
    }

    if (!body.category || !CATEGORY_PRICES[body.category]) {
      return NextResponse.json(
        { error: 'Categoria inválida' },
        { status: 400 }
      )
    }

    const value = CATEGORY_PRICES[body.category]
    const description = body.is_repost 
      ? `Republicação de post - ${body.category}` 
      : `Post na Vitrine - ${body.category}`

    console.log('[Asaas] Criando pagamento:', {
      billingType: body.billingType,
      value,
      category: body.category,
      is_repost: body.is_repost
    })

    // Criar ou buscar cliente no Asaas
    const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify({
        name: body.user_name,
        email: body.user_email
      })
    })

    const customerData = await customerResponse.json()

    if (!customerResponse.ok) {
      console.error('[Asaas] Erro ao criar cliente:', customerData)
      return NextResponse.json(
        { error: 'Erro ao processar cliente', details: customerData },
        { status: customerResponse.status }
      )
    }

    const customerId = customerData.id

    // Criar cobrança
    const paymentData = {
      customer: customerId,
      billingType: body.billingType,
      value,
      description,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      externalReference: body.post_id || 'new_post'
    }

    const paymentResponse = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify(paymentData)
    })

    const paymentResult = await paymentResponse.json()

    if (!paymentResponse.ok) {
      console.error('[Asaas] Erro ao criar cobrança:', paymentResult)
      return NextResponse.json(
        { error: 'Erro ao criar cobrança', details: paymentResult },
        { status: paymentResponse.status }
      )
    }

    console.log('[Asaas] Pagamento criado:', paymentResult.id)

    // Se for republicação, salvar referência do pagamento no post
    if (body.is_repost && body.post_id) {
      await supabase
        .from('vitrine_posts')
        .update({ payment_id: paymentResult.id })
        .eq('id', body.post_id)
    }

    // Retornar dados formatados
    return NextResponse.json({
      success: true,
      payment: {
        id: paymentResult.id,
        status: paymentResult.status,
        value: paymentResult.value,
        dueDate: paymentResult.dueDate,
        billingType: paymentResult.billingType,
        invoiceUrl: paymentResult.invoiceUrl,
        bankSlipUrl: paymentResult.bankSlipUrl,
        pixCode: paymentResult.pixCode,
        pixQrCodeUrl: paymentResult.pixQrCodeUrl
      },
      post_data: body.post_data
    })

  } catch (error) {
    console.error('[Asaas] Erro ao processar pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar pagamento' },
      { status: 500 }
    )
  }
}
