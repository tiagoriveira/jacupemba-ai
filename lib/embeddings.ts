/**
 * Biblioteca para geração de embeddings
 * Usa OpenAI via AI Gateway (zero config)
 */

import { embed } from 'ai'
import { EMBEDDING_CONFIG } from './embedding-config'

/**
 * Gera embedding para um texto usando OpenAI text-embedding-3-small via AI Gateway
 * O AI Gateway já está configurado, não precisa de API key extra
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: EMBEDDING_CONFIG.model,
      value: text,
    })
    return embedding
  } catch (error) {
    console.error('[v0] Error generating embedding:', error)
    throw error
  }
}

/**
 * Prepara texto de relato para embedding (extrai conteúdo relevante)
 */
export function prepareReportText(report: {
  text: string
  category: string
}): string {
  return `${report.category}: ${report.text}`
}

/**
 * Prepara texto de comercio para embedding (extrai conteúdo relevante)
 */
export function prepareBusinessText(business: {
  name: string
  category: string
  description?: string | null
}): string {
  const parts = [business.category, business.name]
  if (business.description) {
    parts.push(business.description)
  }
  return parts.join(' - ')
}

/**
 * Busca semântica em relatos
 */
export async function searchReportsSemantic(
  supabase: any,
  query: string,
  options: {
    threshold?: number
    limit?: number
  } = {}
) {
  const { 
    threshold = EMBEDDING_CONFIG.defaultThreshold, 
    limit = EMBEDDING_CONFIG.defaultLimit 
  } = options

  console.log(`[v0] Busca semantica em relatos: "${query}" (threshold: ${threshold}, limit: ${limit})`)

  // Gerar embedding da query
  const queryEmbedding = await generateEmbedding(query)

  // Buscar usando a função SQL
  const { data, error } = await supabase.rpc('search_reports_semantic', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: Math.min(limit, EMBEDDING_CONFIG.maxLimit),
  })

  if (error) {
    console.error('[v0] Error searching reports semantically:', error)
    throw error
  }

  console.log(`[v0] ${data?.length || 0} relatos encontrados`)
  return data || []
}

/**
 * Busca semântica em comercios
 */
export async function searchBusinessesSemantic(
  supabase: any,
  query: string,
  options: {
    threshold?: number
    limit?: number
  } = {}
) {
  const { 
    threshold = EMBEDDING_CONFIG.defaultThreshold, 
    limit = EMBEDDING_CONFIG.defaultLimit 
  } = options

  console.log(`[v0] Busca semantica em comercios: "${query}" (threshold: ${threshold}, limit: ${limit})`)

  // Gerar embedding da query
  const queryEmbedding = await generateEmbedding(query)

  // Buscar usando a função SQL
  const { data, error } = await supabase.rpc('search_businesses_semantic', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: Math.min(limit, EMBEDDING_CONFIG.maxLimit),
  })

  if (error) {
    console.error('[v0] Error searching businesses semantically:', error)
    throw error
  }

  console.log(`[v0] ${data?.length || 0} comercios encontrados`)
  return data || []
}
