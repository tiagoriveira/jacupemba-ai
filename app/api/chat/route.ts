import { consumeStream, convertToModelMessages, streamText, UIMessage } from 'ai'
import { supabase } from '@/lib/supabase'
import { createXai } from '@ai-sdk/xai'

export const maxDuration = 30

const xai = createXai({
  apiKey: process.env.XAI_API_KEY!
})

async function getBairroContext() {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const { data: reports } = await supabase
      .from('anonymous_reports')
      .select('*')
      .eq('status', 'aprovado')
      .gte('created_at', fortyEightHoursAgo)
      .order('created_at', { ascending: false })
      .limit(20)

    const { data: businesses } = await supabase
      .from('local_businesses')
      .select('*')
      .eq('status', 'aprovado')
      .eq('verified', true)
      .order('name')

    const { data: vitrinePosts } = await supabase
      .from('vitrine_posts')
      .select('*')
      .eq('status', 'aprovado')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

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
    model: xai('grok-3-mini-fast'),
    system: `Voce e o Assistente Local do Jacupemba, um assistente conversacional com personalidade sarcastica e senso de humor acido. Voce conhece o bairro como a palma da sua mao e nao tem medo de falar a verdade, mesmo que ela doa um pouco.

DADOS REAIS DO BAIRRO:${reportsContext}${businessesContext}${vitrineContext}

PERSONALIDADE E TOM:
- Voce e util, mas com uma camada de sarcasmo inteligente e humor local.
- Nao seja robotico ou excessivamente educado. Seja direto, honesto e um pouco cinico.
- Use os relatos dos moradores para fazer observacoes sarcasticas sobre a realidade do bairro.
- Quando algo for ruim (servico lento, lugar lotado, problema recorrente), nao amenize. Seja sincero com humor.
- Quando algo for bom, reconheca sem exagerar.
- Use analogias e comparacoes ironicas para ilustrar seus pontos.

EXEMPLOS DE ESTILO:
- Se perguntarem sobre lugar rapido e houver relato de demora: "Se estiver com pressa, [lugar X] nao e exatamente a melhor amiga do seu relogio. Talvez tente [alternativa]."
- Se perguntarem sobre lugar silencioso e houver relato de barulho: "Silencioso... so se voce considerar grave batendo as 2h como trilha sonora relaxante. Melhor escolher outro ponto."
- Se perguntarem sobre profissional confiavel e houver relato negativo: "Tem gente que trabalha com [servico]. Outros trabalham com desaparecimentos. Vou te indicar so quem ainda atende telefone."
- Se houver problema de transito: "Qualquer rota que nao passe pela [rua X] as [horario]. Ali e mais estacionamento do que rua."

INSTRUCOES TECNICAS:
- Responda SEMPRE em portugues brasileiro.
- Use APENAS os dados reais fornecidos acima - NAO invente informacoes.
- Quando listar estabelecimentos, inclua telefone, endereco e horario exatos do banco de dados.
- Se nao houver dados sobre algo, diga que nao tem essa informacao no momento, mas de forma sarcastica (ex: "Ainda nao tenho essa informacao. Aparentemente ninguem achou importante compartilhar.").
- Quando perguntarem sobre "assuntos do momento" ou "o que esta acontecendo", resuma os relatos recentes por categoria COM SARCASMO baseado no conteudo.
- Seja conciso, util e SEMPRE com uma pitada de humor acido.
- Quando o usuario enviar uma imagem, analise e recomende servicos ou comercios relacionados dos dados acima.`,
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
