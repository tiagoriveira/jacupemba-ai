import { NextResponse } from 'next/server'

// DEPRECATED: Asaas removido. Use /api/stripe/webhook
export async function POST() {
  return NextResponse.json(
    { error: 'Rota descontinuada. Use /api/stripe/webhook' },
    { status: 410 }
  )
}
