/**
 * Script para gerar embeddings de todos os relatos e comercios existentes
 * Versão em JavaScript puro para evitar problemas de compilação TypeScript
 * 
 * Para executar: npm run generate-embeddings
 */

import { createClient } from '@supabase/supabase-js'
import { embed } from 'ai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configurações
const EMBEDDING_CONFIG = {
  model: 'openai/text-embedding-3-small',
  defaultThreshold: 0.7,
  defaultLimit: 10,
  maxLimit: 50,
  rateLimitDelay: 100, // ms entre chamadas
}

// Funções auxiliares
function prepareReportText(report) {
  return `${report.text} (categoria: ${report.category})`
}

function prepareBusinessText(business) {
  const parts = [business.name, business.category]
  if (business.description) parts.push(business.description)
  return parts.join(' - ')
}

async function generateEmbedding(text) {
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

async function generateReportEmbeddings() {
  console.log('🔄 Gerando embeddings para relatos...')

  // Buscar todos os relatos aprovados
  const { data: reports, error } = await supabase
    .from('anonymous_reports')
    .select('id, text, category')
    .eq('status', 'aprovado')

  if (error) {
    console.error('❌ Erro ao buscar relatos:', error)
    return
  }

  console.log(`📊 ${reports.length} relatos encontrados`)

  let processed = 0
  let errors = 0
  let skipped = 0

  for (const report of reports) {
    try {
      // Verificar se já existe embedding
      const { data: existing, error: checkError } = await supabase
        .from('report_embeddings')
        .select('id')
        .eq('report_id', report.id)
        .single()

      if (existing) {
        skipped++
        console.log(`⏭️  Relato ${report.id} já tem embedding, pulando...`)
        continue
      }

      // Gerar embedding
      const text = prepareReportText(report)
      console.log(`  → Gerando embedding para: "${text.substring(0, 50)}..."`)
      const embedding = await generateEmbedding(text)

      // Salvar no banco
      const { error: insertError } = await supabase
        .from('report_embeddings')
        .insert({
          report_id: report.id,
          embedding: embedding,
        })

      if (insertError) {
        throw insertError
      }

      processed++
      console.log(`✅ Relato ${processed}/${reports.length} processado`)

      // Rate limiting para evitar sobrecarga da API
      await new Promise(resolve => setTimeout(resolve, EMBEDDING_CONFIG.rateLimitDelay))
    } catch (err) {
      errors++
      console.error(`❌ Erro ao processar relato ${report.id}:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`\n✨ Relatos concluído! ${processed} embeddings gerados, ${skipped} pulados, ${errors} erros`)
}

async function generateBusinessEmbeddings() {
  console.log('\n🔄 Gerando embeddings para comercios...')

  // Buscar todos os comercios verificados e aprovados
  const { data: businesses, error } = await supabase
    .from('local_businesses')
    .select('id, name, category, description')
    .eq('status', 'aprovado')
    .eq('verified', true)

  if (error) {
    console.error('❌ Erro ao buscar comercios:', error)
    return
  }

  console.log(`📊 ${businesses.length} comercios encontrados`)

  let processed = 0
  let errors = 0
  let skipped = 0

  for (const business of businesses) {
    try {
      // Verificar se já existe embedding
      const { data: existing, error: checkError } = await supabase
        .from('business_embeddings')
        .select('id')
        .eq('business_id', business.id)
        .single()

      if (existing) {
        skipped++
        console.log(`⏭️  Comercio ${business.id} já tem embedding, pulando...`)
        continue
      }

      // Gerar embedding
      const text = prepareBusinessText(business)
      console.log(`  → Gerando embedding para: "${text.substring(0, 50)}..."`)
      const embedding = await generateEmbedding(text)

      // Salvar no banco
      const { error: insertError } = await supabase
        .from('business_embeddings')
        .insert({
          business_id: business.id,
          embedding: embedding,
        })

      if (insertError) {
        throw insertError
      }

      processed++
      console.log(`✅ Comercio ${processed}/${businesses.length} processado`)

      // Rate limiting para evitar sobrecarga da API
      await new Promise(resolve => setTimeout(resolve, EMBEDDING_CONFIG.rateLimitDelay))
    } catch (err) {
      errors++
      console.error(`❌ Erro ao processar comercio ${business.id}:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`\n✨ Comercios concluído! ${processed} embeddings gerados, ${skipped} pulados, ${errors} erros`)
}

async function main() {
  console.log('🚀 Iniciando geração de embeddings semânticos...\n')
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  console.log(`🤖 Modelo: ${EMBEDDING_CONFIG.model}\n`)

  try {
    await generateReportEmbeddings()
    await generateBusinessEmbeddings()

    console.log('\n🎉 Processo completo! Agora o agente pode fazer buscas semânticas.\n')
    console.log('💡 Teste no chat: "Onde comer rapidinho?" ou "Problema com água no bairro?"')
  } catch (err) {
    console.error('\n❌ Erro fatal:', err)
    process.exit(1)
  }
}

main()
