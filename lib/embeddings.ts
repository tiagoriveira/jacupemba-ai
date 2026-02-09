/**
 * Biblioteca para geração de embeddings usando Grok
 * Simples, eficaz e sem custos extras
 */

import { embed } from 'ai'
import { createXai } from '@ai-sdk/xai'

const xai = createXai({
  apiKey: process.env.XAI_API_KEY || 'placeholder'
})

/**
 * Gera embedding para um texto usando Grok
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: xai.embedding('grok-embedding-1'), // Modelo de embedding do Grok
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
  const { threshold = 0.7, limit = 10 } = options

  // Gerar embedding da query
  const queryEmbedding = await generateEmbedding(query)

  // Buscar usando a função SQL
  const { data, error } = await supabase.rpc('search_reports_semantic', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    console.error('[v0] Error searching reports semantically:', error)
    throw error
  }

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
  const { threshold = 0.7, limit = 10 } = options

  // Gerar embedding da query
  const queryEmbedding = await generateEmbedding(query)

  // Buscar usando a função SQL
  const { data, error } = await supabase.rpc('search_businesses_semantic', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    console.error('[v0] Error searching businesses semantically:', error)
    throw error
  }

  return data || []
}
