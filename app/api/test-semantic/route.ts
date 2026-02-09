/**
 * Rota de teste para busca semântica
 * Use para testar se os embeddings estão funcionando
 * 
 * Exemplo: GET /api/test-semantic?q=comida rapida&tipo=comercios
 */

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { searchReportsSemantic, searchBusinessesSemantic } from '@/lib/embeddings'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const tipo = searchParams.get('tipo') || 'ambos'

    if (!query) {
      return NextResponse.json({ 
        error: 'Parametro "q" (query) e obrigatorio' 
      }, { status: 400 })
    }

    const results: { relatos?: unknown[]; comercios?: unknown[] } = {}

    console.log(`[v0] Testando busca semantica: "${query}" (tipo: ${tipo})`)

    if (tipo === 'relatos' || tipo === 'ambos') {
      const relatos = await searchReportsSemantic(supabase, query, {
        limit: 5,
        threshold: 0.6,
      })
      results.relatos = relatos
      console.log(`[v0] ${relatos.length} relatos encontrados`)
    }

    if (tipo === 'comercios' || tipo === 'ambos') {
      const comercios = await searchBusinessesSemantic(supabase, query, {
        limit: 5,
        threshold: 0.6,
      })
      results.comercios = comercios
      console.log(`[v0] ${comercios.length} comercios encontrados`)
    }

    return NextResponse.json({
      query,
      tipo,
      ...results,
      total: (results.relatos?.length || 0) + (results.comercios?.length || 0),
    })
  } catch (error) {
    console.error('[v0] Erro na busca semantica:', error)
    return NextResponse.json({ 
      error: 'Erro ao realizar busca semantica',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
