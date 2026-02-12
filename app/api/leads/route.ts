import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// POST - Registrar novo lead
export async function POST(req: NextRequest) {
  try {
    const { user_fingerprint, business_id, service_requested } = await req.json()

    // Validação
    if (!user_fingerprint || !business_id || !service_requested) {
      return NextResponse.json(
        { error: 'user_fingerprint, business_id e service_requested são obrigatórios' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('lead_logs')
      .insert({
        user_fingerprint,
        business_id,
        service_requested,
        contact_method: 'whatsapp',
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Lead registrado com sucesso',
      data
    })
  } catch (error) {
    console.error('Error saving lead:', error)
    return NextResponse.json(
      { error: 'Erro ao registrar lead' },
      { status: 500 }
    )
  }
}

// GET - Buscar estatísticas de leads
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const business_id = searchParams.get('business_id')
    const days = parseInt(searchParams.get('days') || '30')

    const since = new Date()
    since.setDate(since.getDate() - days)

    let query = supabase
      .from('lead_logs')
      .select('*')
      .gte('created_at', since.toISOString())

    if (business_id) {
      query = query.eq('business_id', business_id)
    }

    const { data, error } = await query

    if (error) throw error

    // Calcular estatísticas
    const totalLeads = data.length
    const byStatus = {
      pending: data.filter(l => l.status === 'pending').length,
      contacted: data.filter(l => l.status === 'contacted').length,
      converted: data.filter(l => l.status === 'converted').length,
      expired: data.filter(l => l.status === 'expired').length
    }

    // Agrupar por serviço
    const byService: Record<string, number> = {}
    data.forEach(lead => {
      byService[lead.service_requested] = (byService[lead.service_requested] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: {
        totalLeads,
        byStatus,
        byService,
        period: `${days} days`,
        leads: data
      }
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar leads' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar status de um lead
export async function PATCH(req: NextRequest) {
  try {
    const { lead_id, status } = await req.json()

    if (!lead_id || !status) {
      return NextResponse.json(
        { error: 'lead_id e status são obrigatórios' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'contacted', 'converted', 'expired']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('lead_logs')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', lead_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Lead atualizado com sucesso',
      data
    })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar lead' },
      { status: 500 }
    )
  }
}
