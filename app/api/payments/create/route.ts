import { NextResponse } from 'next/server'

// DEPRECATED: Asaas removido. Use /api/stripe/create-checkout
export async function POST() {
  return NextResponse.json(
    { error: 'Rota descontinuada. Use /api/stripe/create-checkout' },
    { status: 410 }
  )
}
