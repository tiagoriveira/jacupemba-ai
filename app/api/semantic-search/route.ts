import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createXai } from '@ai-sdk/xai'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const xai = createXai({
  apiKey: process.env.XAI_API_KEY || 'placeholder'
})

// TODO: Implementar embeddings quando xAI SDK suportar
// Por enquanto, usar busca híbrida com Grok para expansão de consulta
async function expandQuery(query: string): Promise<string[]> {
  try {
    const { text } = await generateText({
      model: xai('grok-beta'),
      prompt: `Dado o termo de busca "${query}", gere 5 termos relacionados/sinônimos que ajudariam a encontrar resultados similares. Responda APENAS com os termos separados por vírgula, sem explicações.`
    })
    
    const terms = text.split(',').map(t => t.trim()).filter(t => t.length > 0)
    return [query, ...terms]
  } catch {
    return [query]
  }
}

// POST - Busca semântica com expansão de query via Grok
export async function POST(req: NextRequest) {
  try {
    const { query, target, limit = 10 } = await req.json()

    if (!query) {
      return NextResponse.json(
        { error: 'query é obrigatório' },
        { status: 400 }
      )
    }

    if (!target || !['reports', 'businesses', 'all'].includes(target)) {
      return NextResponse.json(
        { error: 'target deve ser "reports", "businesses" ou "all"' },
        { status: 400 }
      )
    }

    // Expandir query com termos relacionados usando Grok
    const searchTerms = await expandQuery(query)
    const searchPattern = searchTerms.map(t => `%${t}%`).join('|')

    const results: any = {
      query,
      expandedTerms: searchTerms,
      reports: [],
      businesses: []
    }

    // Buscar em relatos usando termos expandidos
    if (target === 'reports' || target === 'all') {
      const conditions = searchTerms.map(term => `text.ilike.%${term}%`).join(',')
      
      const { data: reportMatches, error: reportError } = await supabase
        .from('anonymous_reports')
        .select('*')
        .eq('status', 'aprovado')
        .or(conditions)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!reportError && reportMatches) {
        results.reports = reportMatches
      }
    }

    // Buscar em comércios usando termos expandidos
    if (target === 'businesses' || target === 'all') {
      const conditions = searchTerms.map(term => 
        `name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`
      ).join(',')
      
      const { data: businessMatches, error: businessError } = await supabase
        .from('local_businesses')
        .select('*')
        .eq('status', 'aprovado')
        .or(conditions)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!businessError && businessMatches) {
        results.businesses = businessMatches
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      totalResults: (results.reports?.length || 0) + (results.businesses?.length || 0)
    })
  } catch (error) {
    console.error('Error in semantic search:', error)
    return NextResponse.json(
      { error: 'Erro na busca semântica', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
