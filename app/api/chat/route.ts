import { consumeStream, convertToModelMessages, streamText, UIMessage } from 'ai'
import { supabase } from '@/lib/supabase'

export const maxDuration = 30

async function getBairroContext() {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const { data: reports } = await supabase
      .from('anonymous_reports')
      .select('*')
      .gte('created_at', fortyEightHoursAgo)
      .order('created_at', { ascending: false })
      .limit(20)

    const { data: businesses } = await supabase
      .from('local_businesses')
      .select('*')
      .eq('verified', true)
      .order('name')

    const { data: vitrinePosts } = await supabase
      .from('vitrine_posts')
      .select('*')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    console.log('[v0] Supabase data fetched:', { reports: reports?.length, businesses: businesses?.length, vitrinePosts: vitrinePosts?.length })
    return { reports: reports || [], businesses: businesses || [], vitrinePosts: vitrinePosts || [] }
  } catch (error) {
    console.error('[v0] Error fetching bairro context:', error)
    return { reports: [], businesses: [], vitrinePosts: [] }
  }
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    // Buscar dados reais do bairro
    const { reports, businesses, vitrinePosts } = await getBairroContext()
    console.log('[v0] Context loaded - Reports:', reports.length, 'Businesses:', businesses.length, 'Vitrine:', vitrinePosts.length)

  const reportsContext = reports.length > 0 
    ? `\n\nRELATOS RECENTES DO BAIRRO (ultimas 48h):\n${reports.map(r => `- [${r.category}] ${r.text}`).join('\n')}`
    : '\n\nNenhum relato recente nas ultimas 48h.'

  const businessesContext = businesses.length > 0
    ? `\n\nCOMERCIOS E SERVICOS LOCAIS VERIFICADOS:\n${businesses.map(b => 
        `- ${b.name} (${b.category}) | Tel: ${b.phone || 'N/A'} | WhatsApp: ${b.whatsapp || 'N/A'} | ${b.address || ''} | Horario: ${b.hours || 'Consultar'} | ${b.description || ''}`
      ).join('\n')}`
    : '\n\nNenhum comercio ou servico cadastrado no momento.'

  const vitrineContext = vitrinePosts.length > 0
    ? `\n\nANUNCIOS NA VITRINE (validos por 48h):\n${vitrinePosts.map(v => 
        `- ${v.title} - R$ ${v.price} | Vendedor: ${v.seller_name} | Tel: ${v.seller_phone} | ${v.description || ''}`
      ).join('\n')}`
    : '\n\nNenhum anuncio ativo na vitrine.'

  const result = streamText({
    model: 'xai/grok-beta',
    system: `Voce e o Assistente Local, um assistente conversacional que ajuda moradores do bairro a encontrar servicos, comercios, vagas de emprego e eventos locais.

DADOS REAIS DO BAIRRO:${reportsContext}${businessesContext}${vitrineContext}

INSTRUCOES:
- Responda SEMPRE em portugues brasileiro, de forma natural e amigavel
- Use APENAS os dados reais fornecidos acima - NAO invente informacoes
- Quando listar estabelecimentos, inclua telefone, endereco e horario exatos do banco de dados
- Se nao houver dados sobre algo, diga que nao tem essa informacao no momento
- Quando perguntarem sobre "assuntos do momento" ou "o que esta acontecendo", resuma os relatos recentes por categoria
- Para perguntas sobre servicos, busque nos comercios verificados
- Para perguntas sobre a vitrine, liste os anuncios ativos
- Seja conciso e util nas respostas
- Quando o usuario enviar uma imagem, analise e recomende servicos ou comercios relacionados dos dados acima`,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      consumeSseStream: consumeStream,
    })
  } catch (error) {
    console.error('[v0] Error in chat API:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
