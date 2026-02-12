import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST - Promover usuário a embaixador
export async function POST(req: NextRequest) {
  try {
    const { fingerprint, assigned_by, notes } = await req.json()

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'fingerprint é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se já existe
    const { data: existing } = await supabase
      .from('ambassadors')
      .select('id, status')
      .eq('fingerprint', fingerprint)
      .single()

    if (existing) {
      // Se já existe mas está inativo, reativar
      if (existing.status === 'inactive') {
        const { data, error } = await supabase
          .from('ambassadors')
          .update({
            status: 'active',
            assigned_at: new Date().toISOString(),
            assigned_by: assigned_by || null,
            notes: notes || null
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          message: 'Embaixador reativado com sucesso',
          data
        })
      }

      return NextResponse.json(
        { error: 'Usuário já é embaixador' },
        { status: 400 }
      )
    }

    // Criar novo embaixador
    const { data, error } = await supabase
      .from('ambassadors')
      .insert({
        fingerprint,
        status: 'active',
        assigned_by: assigned_by || null,
        notes: notes || null
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Usuário promovido a embaixador com sucesso',
      data
    })
  } catch (error) {
    console.error('Error creating ambassador:', error)
    return NextResponse.json(
      { error: 'Erro ao promover embaixador' },
      { status: 500 }
    )
  }
}

// GET - Listar embaixadores
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'active'

    let query = supabase
      .from('ambassadors')
      .select('*')
      .order('created_at', { ascending: false })

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    console.error('Error fetching ambassadors:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar embaixadores' },
      { status: 500 }
    )
  }
}

// DELETE - Remover status de embaixador
export async function DELETE(req: NextRequest) {
  try {
    const { fingerprint } = await req.json()

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'fingerprint é obrigatório' },
        { status: 400 }
      )
    }

    // Marcar como inativo ao invés de deletar (manter histórico)
    const { data, error } = await supabase
      .from('ambassadors')
      .update({ status: 'inactive' })
      .eq('fingerprint', fingerprint)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Status de embaixador removido com sucesso',
      data
    })
  } catch (error) {
    console.error('Error removing ambassador:', error)
    return NextResponse.json(
      { error: 'Erro ao remover embaixador' },
      { status: 500 }
    )
  }
}
