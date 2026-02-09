import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { embed } from 'ai'

/**
 * API para gerar embeddings de comercios
 * POST /api/generate-business-embeddings
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[v0] Iniciando geração de embeddings para comercios...')

    // Buscar comercios sem embeddings
    const { data: businesses, error: fetchError } = await supabase
      .from('local_businesses')
      .select('id, name, description, category, address')
      .eq('status', 'aprovado')
      .eq('verified', true)
      .order('created_at', { ascending: false })

    if (fetchError) throw fetchError
    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ message: 'Nenhum comercio encontrado' })
    }

    // Buscar IDs dos comercios que já têm embeddings
    const { data: existingEmbeddings } = await supabase
      .from('business_embeddings')
      .select('business_id')

    const existingIds = new Set(existingEmbeddings?.map(e => e.business_id) || [])

    // Filtrar comercios sem embeddings
    const businessesWithoutEmbeddings = businesses.filter(b => !existingIds.has(b.id))

    console.log(
      `[v0] Encontrados ${businessesWithoutEmbeddings.length} comercios sem embeddings`
    )

    let generatedCount = 0
    const errors: string[] = []

    // Gerar embeddings para cada comercio
    for (const business of businessesWithoutEmbeddings) {
      try {
        // Preparar texto para embedding
        const textToEmbed = [business.name, business.description, business.category]
          .filter(Boolean)
          .join(' | ')

        console.log(`[v0] Gerando embedding para: ${business.name}`)

        // Gerar embedding usando OpenAI via AI Gateway
        const { embedding } = await embed({
          model: 'openai/text-embedding-3-small',
          value: textToEmbed,
        })

        // Salvar embedding no banco
        const { error: insertError } = await supabase.from('business_embeddings').insert([
          {
            business_id: business.id,
            embedding: embedding,
            created_at: new Date().toISOString(),
          },
        ])

        if (insertError) {
          const errMsg = `Erro ao salvar embedding de ${business.name}: ${insertError.message}`
          console.error(`[v0] ${errMsg}`)
          errors.push(errMsg)
        } else {
          generatedCount++
          console.log(`[v0] ✅ Embedding gerado para ${business.name}`)
        }

        // Rate limiting para evitar throttling
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        const errMsg = `Erro ao gerar embedding para ${business.name}: ${error}`
        console.error(`[v0] ${errMsg}`)
        errors.push(errMsg)
      }
    }

    console.log(`[v0] Geração concluída: ${generatedCount} embeddings criados`)

    return NextResponse.json(
      {
        success: true,
        message: `Embeddings gerados com sucesso: ${generatedCount}/${businessesWithoutEmbeddings.length}`,
        generatedCount,
        totalBusinesses: businesses.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Erro na geração de embeddings:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET para verificar status dos embeddings
 */
export async function GET() {
  try {
    const stats = await supabase.rpc(
      'sql',
      {},
      {
        body: `
          SELECT 
            (SELECT COUNT(*) FROM local_businesses WHERE status = 'aprovado' AND verified = true) as total_businesses,
            (SELECT COUNT(*) FROM business_embeddings) as embeddings_count
        `,
      }
    )

    return NextResponse.json({
      message: 'Status dos embeddings de comercios',
      data: {
        totalBusinesses: stats?.data?.[0]?.total_businesses || 0,
        embeddingsGenerated: stats?.data?.[0]?.embeddings_count || 0,
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
