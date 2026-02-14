import { NextResponse } from 'next/server'

const ASAAS_API_URL = 'https://api.asaas.com/v3'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY

interface CreatePaymentRequest {
  customer: {
    name: string
    email: string
    cpfCnpj?: string
    phone?: string
  }
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  value: number
  description: string
  dueDate?: string
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

    // Validação básica
    if (!body.customer?.name || !body.customer?.email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    if (!body.value || body.value <= 0) {
      return NextResponse.json(
        { error: 'Valor inválido' },
        { status: 400 }
      )
    }

    console.log('[v0] Creating Asaas payment:', {
      billingType: body.billingType,
      value: body.value,
      customer: body.customer.email
    })

    // Criar ou buscar cliente
    const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify({
        name: body.customer.name,
        email: body.customer.email,
        cpfCnpj: body.customer.cpfCnpj,
        phone: body.customer.phone
      })
    })

    const customerData = await customerResponse.json()

    if (!customerResponse.ok) {
      console.error('[v0] Error creating customer:', customerData)
      return NextResponse.json(
        { error: 'Erro ao criar cliente', details: customerData },
        { status: customerResponse.status }
      )
    }

    const customerId = customerData.id

    // Criar cobrança
    const paymentData: any = {
      customer: customerId,
      billingType: body.billingType,
      value: body.value,
      description: body.description || 'Pagamento',
      dueDate: body.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
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
      console.error('[v0] Error creating payment:', paymentResult)
      return NextResponse.json(
        { error: 'Erro ao criar cobrança', details: paymentResult },
        { status: paymentResponse.status }
      )
    }

    console.log('[v0] Payment created successfully:', paymentResult.id)

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
      }
    })

  } catch (error) {
    console.error('[v0] Payment creation error:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar pagamento' },
      { status: 500 }
    )
  }
}
