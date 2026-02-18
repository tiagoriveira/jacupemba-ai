import { NextResponse } from 'next/server'

// DEPRECATED: Moderação feita diretamente via painel admin
export async function POST() {
  return NextResponse.json(
    { error: 'Rota descontinuada. Use o painel admin /admin' },
    { status: 410 }
  )
}
