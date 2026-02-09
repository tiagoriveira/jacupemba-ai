/**
 * Script para gerar embeddings de todos os relatos e comercios existentes
 * Roda uma única vez para popular o banco, depois só precisa rodar em novos dados
 * 
 * Para executar: npx tsx scripts/generate-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js'
import { generateEmbedding, prepareReportText, prepareBusinessText } from '../lib/embeddings'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

  for (const report of reports) {
    try {
      // Verificar se já existe embedding
      const { data: existing } = await supabase
        .from('report_embeddings')
        .select('id')
        .eq('report_id', report.id)
        .single()

      if (existing) {
        console.log(`⏭️  Relato ${report.id} já tem embedding, pulando...`)
        continue
      }

      // Gerar embedding
      const text = prepareReportText(report)
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

      // Rate limiting: aguardar 100ms entre chamadas
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (err) {
      errors++
      console.error(`❌ Erro ao processar relato ${report.id}:`, err)
    }
  }

  console.log(`\n✨ Concluído! ${processed} embeddings gerados, ${errors} erros`)
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

  for (const business of businesses) {
    try {
      // Verificar se já existe embedding
      const { data: existing } = await supabase
        .from('business_embeddings')
        .select('id')
        .eq('business_id', business.id)
        .single()

      if (existing) {
        console.log(`⏭️  Comercio ${business.id} já tem embedding, pulando...`)
        continue
      }

      // Gerar embedding
      const text = prepareBusinessText(business)
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

      // Rate limiting: aguardar 100ms entre chamadas
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (err) {
      errors++
      console.error(`❌ Erro ao processar comercio ${business.id}:`, err)
    }
  }

  console.log(`\n✨ Concluído! ${processed} embeddings gerados, ${errors} erros`)
}

async function main() {
  console.log('🚀 Iniciando geração de embeddings...\n')

  await generateReportEmbeddings()
  await generateBusinessEmbeddings()

  console.log('\n🎉 Processo completo!')
}

main().catch(console.error)
