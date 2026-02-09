import { consumeStream, convertToModelMessages, generateText, stepCountIs, streamText, tool, UIMessage } from 'ai'
import { supabase } from '@/lib/supabase'
import { createXai } from '@ai-sdk/xai'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const xai = createXai({
  apiKey: process.env.XAI_API_KEY || 'placeholder'
})

// ---------------------------------------------------------------------------
// Helper: format relative time for context readability
// ---------------------------------------------------------------------------
function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}min atras`
  if (hours < 24) return `${hours}h atras`
  return `${days}d atras`
}

// ---------------------------------------------------------------------------
// Base context: loads the 4 data layers available today
//   1. Relatos (last 7 days)
//   2. Comentarios dos relatos
//   3. Comercios verificados
//   4. Vitrine (anuncios ativos)
// ---------------------------------------------------------------------------
async function getBairroContext() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Layer 1 - Recent reports
    const { data: reports } = await supabase
      .from('anonymous_reports')
      .select('*')
      .eq('status', 'aprovado')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(20)

    // Layer 2 - Comments on those reports
    const reportIds = (reports || []).map(r => r.id)
    let comments: Record<string, unknown>[] = []
    if (reportIds.length > 0) {
      const { data: commentsData } = await supabase
        .from('report_comments')
        .select('*')
        .in('report_id', reportIds)
        .order('created_at', { ascending: false })
      comments = commentsData || []
    }

    // Layer 3 - Verified businesses
    const { data: businesses } = await supabase
      .from('local_businesses')
      .select('*')
      .eq('status', 'aprovado')
      .eq('verified', true)
      .order('name')

    // Layer 4 - Active vitrine posts (not expired)
    const { data: vitrinePosts } = await supabase
      .from('vitrine_posts')
      .select('*')
      .eq('status', 'aprovado')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    return {
      reports: reports || [],
      comments,
      businesses: businesses || [],
      vitrinePosts: vitrinePosts || [],
    }
  } catch (error) {
    console.error('Error fetching bairro context:', error)
    return { reports: [], comments: [], businesses: [], vitrinePosts: [] }
  }
}

// ---------------------------------------------------------------------------
// Tools - give the agent real-time, filtered access to data
// ---------------------------------------------------------------------------

const buscarRelatos = tool({
  description:
    'Busca relatos recentes do bairro filtrados por categoria. Use quando o usuario perguntar sobre problemas especificos, seguranca, transito, acontecimentos recentes, etc.',
  inputSchema: z.object({
    categoria: z
      .string()
      .nullable()
      .describe(
        'Categoria: seguranca, emergencia, saude, transito, saneamento, iluminacao, convivencia, animais, eventos, comercio, transporte, outros. Null para todas.'
      ),
    limite: z.number().nullable().describe('Numero de relatos a buscar (padrao: 10)'),
  }),
  execute: async ({ categoria, limite }) => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      let query = supabase
        .from('anonymous_reports')
        .select('*')
        .eq('status', 'aprovado')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(limite || 10)

      if (categoria) {
        query = query.eq('category', categoria)
      }

      const { data, error } = await query
      if (error) throw error

      // Fetch comments for these reports
      const ids = (data || []).map(r => r.id)
      let relComments: Record<string, unknown>[] = []
      if (ids.length > 0) {
        const { data: cd } = await supabase
          .from('report_comments')
          .select('*')
          .in('report_id', ids)
          .order('created_at', { ascending: false })
        relComments = cd || []
      }

      return {
        total: data?.length || 0,
        relatos: (data || []).map(r => ({
          texto: r.text,
          categoria: r.category,
          quando: formatRelativeTime(r.created_at),
          comentarios: relComments
            .filter((c: Record<string, unknown>) => c.report_id === r.id)
            .map((c: Record<string, unknown>) => ({
              texto: c.text,
              quando: formatRelativeTime(c.created_at as string),
            })),
        })),
      }
    } catch {
      return { total: 0, relatos: [], erro: 'Erro ao buscar relatos' }
    }
  },
})

const buscarComercio = tool({
  description:
    'Busca comercios e servicos locais verificados. Use quando o usuario perguntar sobre restaurantes, lojas, servicos, prestadores, etc.',
  inputSchema: z.object({
    categoria: z
      .string()
      .nullable()
      .describe('Categoria: comercio, servicos, alimentacao, saude, educacao, outro. Null para todas.'),
    termo: z.string().nullable().describe('Termo de busca no nome ou descricao'),
  }),
  execute: async ({ categoria, termo }) => {
    try {
      let query = supabase
        .from('local_businesses')
        .select('*')
        .eq('status', 'aprovado')
        .eq('verified', true)
        .order('name')
        .limit(15)

      if (categoria) {
        query = query.eq('category', categoria)
      }
      if (termo) {
        query = query.or(`name.ilike.%${termo}%,description.ilike.%${termo}%`)
      }

      const { data, error } = await query
      if (error) throw error

      return {
        total: data?.length || 0,
        comercios: (data || []).map(b => ({
          nome: b.name,
          categoria: b.category,
          telefone: b.phone || 'N/A',
          endereco: b.address || 'N/A',
          horario: b.hours || 'Consultar',
          descricao: b.description || '',
          verificado: b.verified,
        })),
      }
    } catch {
      return { total: 0, comercios: [], erro: 'Erro ao buscar comercios' }
    }
  },
})

const obterEstatisticas = tool({
  description:
    'Obtem estatisticas do bairro: total de relatos por categoria, tendencias, problemas mais reportados. Use quando o usuario perguntar por estatisticas, tendencias, resumo do bairro.',
  inputSchema: z.object({
    periodo: z
      .enum(['24h', '7d', '30d'])
      .nullable()
      .describe('Periodo de analise (padrao: 7d)'),
  }),
  execute: async ({ periodo }) => {
    try {
      const periodoMs: Record<string, number> = {
        '24h': 86400000,
        '7d': 604800000,
        '30d': 2592000000,
      }
      const p = periodo || '7d'
      const since = new Date(Date.now() - periodoMs[p]).toISOString()

      const { data, error } = await supabase
        .from('anonymous_reports')
        .select('category, created_at')
        .eq('status', 'aprovado')
        .gte('created_at', since)

      if (error) throw error

      const categorias: Record<string, number> = {}
        ; (data || []).forEach(r => {
          categorias[r.category] = (categorias[r.category] || 0) + 1
        })

      const sorted = Object.entries(categorias).sort(([, a], [, b]) => b - a)

      return {
        periodo: p,
        totalRelatos: data?.length || 0,
        porCategoria: categorias,
        top3: sorted.slice(0, 3).map(([cat, count]) => `${cat}: ${count} relatos`),
        categoriaMaisReportada: sorted[0]?.[0] || 'nenhuma',
      }
    } catch {
      return { totalRelatos: 0, porCategoria: {}, erro: 'Erro ao buscar estatisticas' }
    }
  },
})

const analisarSentimento = tool({
  description:
    'Analisa o sentimento (reputacao) de um comercio ou local com base nos relatos e comentarios dos moradores. Use quando o usuario perguntar sobre reputacao, opiniao, se um lugar e bom/ruim, o que as pessoas acham.',
  inputSchema: z.object({
    local: z.string().describe('Nome do comercio ou local para analisar'),
  }),
  execute: async ({ local }) => {
    try {
      const { data: relatos } = await supabase
        .from('anonymous_reports')
        .select('*')
        .eq('status', 'aprovado')
        .or(`text.ilike.%${local}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!relatos || relatos.length === 0) {
        return {
          local,
          totalMencoes: 0,
          mensagem: 'Nenhum relato encontrado mencionando este local.',
        }
      }

      const textos = relatos.map(r => r.text).join('\n---\n')

      const { text: analise } = await generateText({
        model: xai('grok-3-mini-fast'),
        prompt: `Analise os seguintes relatos sobre "${local}" e classifique o sentimento geral.

RELATOS:
${textos}

Responda APENAS no formato JSON (sem markdown):
{
  "positivos": <numero>,
  "negativos": <numero>,
  "neutros": <numero>,
  "sentimento_geral": "positivo" | "negativo" | "misto" | "neutro",
  "resumo": "<resumo em 1-2 frases do que as pessoas dizem>"
}`,
      })

      try {
        const resultado = JSON.parse(analise.replace(/```json\n?|\n?```/g, '').trim())
        return { local, totalMencoes: relatos.length, ...resultado }
      } catch {
        return { local, totalMencoes: relatos.length, analise_texto: analise }
      }
    } catch {
      return { local, totalMencoes: 0, erro: 'Erro ao analisar sentimento' }
    }
  },
})

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    // Load base context from all 4 data layers
    const { reports, comments, businesses, vitrinePosts } = await getBairroContext()

    // Format reports with comments and relative timestamps
    const reportsContext =
      reports.length > 0
        ? `\n\nRELATOS RECENTES DO BAIRRO (ultimos 7 dias):\n${reports
          .map(r => {
            const rc = comments.filter((c: Record<string, unknown>) => c.report_id === r.id)
            const commentsStr =
              rc.length > 0
                ? `\n  Comentarios: ${rc.map((c: Record<string, unknown>) => `"${c.text}" (${formatRelativeTime(c.created_at as string)})`).join(' | ')}`
                : ''
            return `- [${r.category}] ${r.text} (${formatRelativeTime(r.created_at)}) [fonte: relato de morador]${commentsStr}`
          })
          .join('\n')}`
        : '\n\nNenhum relato recente nos ultimos 7 dias.'

    const businessesContext =
      businesses.length > 0
        ? `\n\nCOMERCIOS E SERVICOS LOCAIS VERIFICADOS:\n${businesses
          .map(
            b =>
              `- ${b.name} (${b.category}) | Tel: ${b.phone || 'N/A'} | ${b.address || 'Endereco nao informado'} | Horario: ${b.hours || 'Consultar'} | ${b.description || ''} [fonte: comercio verificado]`
          )
          .join('\n')}`
        : '\n\nNenhum comercio ou servico cadastrado no momento.'

    const vitrineContext =
      vitrinePosts.length > 0
        ? `\n\nANUNCIOS NA VITRINE (temporarios):\n${vitrinePosts
          .map(
            v =>
              `- ${v.title} - R$ ${v.price || 'A combinar'} | Vendedor: ${v.contact_name || 'N/A'} | Tel: ${v.contact_phone || 'N/A'} | ${v.description || ''} (${formatRelativeTime(v.created_at)}) [fonte: vitrine]`
          )
          .join('\n')}`
        : '\n\nNenhum anuncio ativo na vitrine.'

    const agentTools = {
      buscarRelatos,
      buscarComercio,
      obterEstatisticas,
      analisarSentimento,
    }

    const result = streamText({
      model: xai('grok-3-mini-fast'),
      system: `Voce e o Assistente Local do Jacupemba, um assistente conversacional com personalidade sarcastica e senso de humor acido. Voce conhece o bairro como a palma da sua mao e nao tem medo de falar a verdade, mesmo que ela doa um pouco.

DADOS REAIS DO BAIRRO (CONTEXTO BASE):${reportsContext}${businessesContext}${vitrineContext}

FERRAMENTAS DISPONIVEIS:
Voce tem acesso a ferramentas para buscar e analisar dados em tempo real. USE-AS ativamente quando precisar:
- buscarRelatos: Filtra relatos por categoria especifica (seguranca, transito, saude, etc.)
- buscarComercio: Busca comercios por categoria ou por nome/descricao
- obterEstatisticas: Dados estatisticos e tendencias do bairro (24h, 7 dias, 30 dias)
- analisarSentimento: Avalia a reputacao de um comercio/local baseado nos relatos dos moradores

PERSONALIDADE E TOM:
- Voce e util, mas com uma camada de sarcasmo inteligente e humor local.
- Nao seja robotico ou excessivamente educado. Seja direto, conciso, honesto e um pouco cinico.
- Use os relatos dos moradores para fazer observacoes sarcasticas sobre a realidade do bairro.
- Quando algo for ruim (servico lento, lugar lotado, problema recorrente), nao amenize. Seja sincero com humor.
- Quando algo for bom, reconheca sem exagerar.
- Use analogias e comparacoes ironicas para ilustrar seus pontos.

TRANSPARENCIA OBRIGATORIA:
- SEMPRE indique a fonte da informacao entre parenteses ao final de cada afirmacao factual.
- Fontes possiveis: (fonte: relato de morador), (fonte: comercio verificado), (fonte: vitrine), (fonte: comentario de morador), (fonte: estatisticas do bairro).
- Se nao tiver certeza ou nao houver dados, diga claramente que nao tem essa informacao - de forma sarcastica (ex: "Nao tenho essa informacao ainda. Aparentemente ninguem achou importante compartilhar.").
- NUNCA invente ou assuma dados que nao estao no contexto fornecido ou retornados pelas ferramentas.

CONTEXTUALIZACAO GEOGRAFICA:
- Quando o usuario mencionar referencias locais como "perto de", "ao lado de", "proximo a", "na esquina de", "atras de", "em frente a", associe essas referencias aos dados disponiveis.
- Se encontrar correspondencias nos relatos ou comercios, use-as para contextualizar a resposta.
- Se nao reconhecer um local mencionado, pergunte ao usuario para esclarecer de forma natural e sarcastica.

EXEMPLOS DE ESTILO:
- Se perguntarem sobre lugar rapido e houver relato de demora: "Se estiver com pressa, [lugar X] nao e exatamente a melhor amiga do seu relogio. Talvez tente [alternativa]. (fonte: relato de morador)"
- Se perguntarem sobre lugar silencioso e houver relato de barulho: "Silencioso... so se voce considerar grave batendo as 2h como trilha sonora relaxante. Melhor escolher outro ponto. (fonte: relato de morador)"
- Se perguntarem sobre reputacao: Use a ferramenta analisarSentimento para dar uma resposta baseada em dados reais.
- Se perguntarem sobre estatisticas: Use a ferramenta obterEstatisticas e apresente os dados com sarcasmo.
- Se houver problema de transito: "Qualquer rota que nao passe pela [rua X] as [horario]. Ali e mais estacionamento do que rua. (fonte: relato de morador)"

INSTRUCOES TECNICAS:
- Responda SEMPRE em portugues brasileiro.
- Use APENAS dados reais do contexto ou retornados pelas ferramentas - NAO invente informacoes.
- Quando listar estabelecimentos, inclua telefone, endereco e horario exatos do banco de dados.
- Quando perguntarem sobre "assuntos do momento" ou "o que esta acontecendo", resuma os relatos recentes por categoria COM SARCASMO baseado no conteudo.
- Considere os COMENTARIOS dos relatos como atualizacoes em tempo real - eles complementam e podem atualizar as informacoes dos relatos originais.
- Seja conciso, util e SEMPRE com uma pitada de humor acido.
- Quando o usuario enviar uma imagem, analise e recomende servicos ou comercios relacionados dos dados acima.`,
      messages: await convertToModelMessages(messages),
      tools: agentTools,
      stopWhen: stepCountIs(5),
      abortSignal: req.signal,
    })

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      consumeSseStream: consumeStream,
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response(
      JSON.stringify({
        error: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
