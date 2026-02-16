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
// Rate limiter simples em memória (30 req/min por IP)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// Limpar entradas expiradas a cada 5 min
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key)
  }
}, 300_000)

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
// Helper: build conversation context summary for memory
// ---------------------------------------------------------------------------
function buildConversationContext(messages: UIMessage[]): string {
  if (messages.length <= 1) return ''

  // Pegar apenas mensagens de texto (user e assistant) para resumo
  const relevantMessages = messages
    .slice(-10) // Últimas 10 mensagens para não sobrecarregar
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => {
      // UIMessage pode ter content como string ou array de parts
      const msgAny = m as unknown as { content?: string; parts?: { type: string; text?: string }[] }
      let content = ''
      if (typeof msgAny.content === 'string') {
        content = msgAny.content
      } else if (Array.isArray(msgAny.parts)) {
        content = msgAny.parts
          .filter(p => p.type === 'text' && p.text)
          .map(p => p.text)
          .join(' ')
      }
      const role = m.role === 'user' ? 'Usuario' : 'Agente'
      // Truncar mensagens longas
      const truncated = content.length > 150 ? content.substring(0, 150) + '...' : content
      return truncated ? `${role}: ${truncated}` : null
    })
    .filter(Boolean)

  if (relevantMessages.length === 0) return ''

  return `\n\nCONTEXTO DA CONVERSA ATUAL (ultimas ${relevantMessages.length} mensagens):
${relevantMessages.join('\n')}

IMPORTANTE: Use esse contexto para entender referencias implicitas. Se o usuario perguntar "e o telefone?" ou "qual o horario deles?", voce deve saber a qual comercio/local ele se refere baseado nas mensagens anteriores.`
}

// ---------------------------------------------------------------------------
// Base context: loads the 3 data layers
//   1. Relatos (last 7 days)
//   2. Comentarios dos relatos
//   3. Vitrine (anuncios ativos)
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

    // Layer 3 - Active vitrine posts (not expired)
    const { data: vitrinePosts } = await supabase
      .from('vitrine_posts')
      .select('*')
      .eq('status', 'aprovado')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    return {
      reports: reports || [],
      comments,
      vitrinePosts: vitrinePosts || [],
    }
  } catch (error) {
    console.error('Error fetching bairro context:', error)
    return { reports: [], comments: [], vitrinePosts: [] }
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

// Tool buscarComercio REMOVIDA - agente não recomenda comércios

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
    'Analisa o sentimento (reputacao) de um comercio ou local com base nos relatos, comentarios e avaliacoes dos moradores. Use quando o usuario perguntar sobre reputacao, opiniao, se um lugar e bom/ruim, o que as pessoas acham.',
  inputSchema: z.object({
    local: z.string().describe('Nome do comercio ou local para analisar'),
  }),
  execute: async ({ local }) => {
    try {
      // Buscar relatos que mencionam o local
      const { data: relatos } = await supabase
        .from('anonymous_reports')
        .select('*')
        .eq('status', 'aprovado')
        .or(`text.ilike.%${local}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      // Buscar o comércio pelo nome
      const { data: comercio } = await supabase
        .from('local_businesses')
        .select('id, name')
        .eq('status', 'aprovado')
        .ilike('name', `%${local}%`)
        .single()

      const totalMencoes = relatos?.length || 0

      if (totalMencoes === 0) {
        return {
          local,
          totalMencoes: 0,
          mensagem: 'Nenhum relato encontrado sobre este local.',
        }
      }

      // Preparar dados para análise
      let contextTexto = ''
      
      if (relatos && relatos.length > 0) {
        contextTexto += 'RELATOS DOS MORADORES:\n'
        contextTexto += relatos.map(r => r.text).join('\n---\n')
      }

      const { text: analise } = await generateText({
        model: xai('grok-4-1-fast-reasoning'),
        prompt: `Analise os seguintes dados sobre "${local}" e classifique o sentimento geral.

${contextTexto}

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
        return { 
          local, 
          totalMencoes,
          totalRelatos: relatos?.length || 0,
          ...resultado 
        }
      } catch {
        return { local, totalMencoes, analise_texto: analise }
      }
    } catch {
      return { local, totalMencoes: 0, erro: 'Erro ao analisar sentimento' }
    }
  },
})

const buscarVitrine = tool({
  description:
    'Busca anuncios ativos na vitrine digital do bairro. Use quando o usuario perguntar sobre produtos a venda, servicos anunciados, ofertas, promocoes ou quiser comprar algo no bairro.',
  inputSchema: z.object({
    termo: z.string().nullable().describe('Termo de busca no titulo ou descricao do anuncio'),
    categoria: z
      .string()
      .nullable()
      .describe('Categoria: produto, servico, comunicado, vaga, informativo. Null para todas.'),
  }),
  execute: async ({ termo, categoria }) => {
    try {
      let query = supabase
        .from('vitrine_posts')
        .select('*')
        .eq('status', 'aprovado')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

      if (categoria) {
        query = query.eq('category', categoria)
      }
      if (termo) {
        query = query.or(`title.ilike.%${termo}%,description.ilike.%${termo}%`)
      }

      const { data, error } = await query
      if (error) throw error

      if (!data || data.length === 0) {
        return {
          total: 0,
          anuncios: [],
          mensagem: termo
            ? `Nenhum anuncio encontrado para "${termo}" na vitrine.`
            : 'Nenhum anuncio ativo na vitrine no momento.',
        }
      }

      return {
        total: data.length,
        anuncios: data.map(v => ({
          titulo: v.title,
          descricao: v.description || '',
          preco: v.price ? `R$ ${Number(v.price).toFixed(2)}` : 'A combinar',
          categoria: v.category,
          vendedor: v.contact_name || 'Anonimo',
          telefone: v.contact_phone || 'N/A',
          expira: formatRelativeTime(v.expires_at),
        })),
      }
    } catch {
      return { total: 0, anuncios: [], erro: 'Erro ao buscar vitrine' }
    }
  },
})

// Tool detectarIntencaoServico REMOVIDA - agente não recomenda serviços/profissionais

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  // Rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Calma lá, muitas perguntas de uma vez! Espere um momento antes de continuar.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
    )
  }

  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    // Load base context from 3 data layers (removido businesses)
    const { reports, comments, vitrinePosts } = await getBairroContext()

    // Modelo fixo - sem configuração de personalidade
    const agentModel = 'grok-4-1-fast-reasoning'

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

    // Contexto de comércios REMOVIDO - agente não recomenda comércios

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
      buscarVitrine,
      obterEstatisticas,
      analisarSentimento,
    }

    // Build conversation context for memory
    const conversationContext = buildConversationContext(messages)

    // System prompt com personalidade FIXA de fofoqueiro ético
    const systemPrompt = `Voce e o Fofoqueiro do Jacupemba - o assistente local que sabe de TUDO que rola no bairro.

PERSONALIDADE (FIXA - NAO CONFIGURAVEL):
Voce e o fofoqueiro do bairro: curioso, sarcastico, direto e sempre por dentro das novidades. Conta as fofocas com humor ácido e sem papas na língua, MAS:

✅ ETICA E LIMITES (INEGOCIAVEL):
- NUNCA difame pessoas ou negócios sem provas concretas (relatos aprovados)
- NUNCA invente informações - use APENAS dados reais do sistema
- Respeite privacidade - não exponha dados sensíveis além do que está nos relatos públicos
- Evite discriminação, preconceito ou discurso de ódio
- Seja sarcastico com PROBLEMAS (buracos, falta de luz), não com PESSOAS
- Siga princípios de jornalismo comunitário: verdade, transparência, utilidade pública

DADOS REAIS DO BAIRRO:${reportsContext}${vitrineContext}${conversationContext}

FERRAMENTAS DISPONIVEIS:
- buscarRelatos: Busca relatos da comunidade por categoria (segurança, trânsito, saúde, etc.)
- buscarVitrine: Mostra anúncios ativos (produtos, serviços, vagas)
- obterEstatisticas: Dados estatísticos do bairro (trending topics, números)
- analisarSentimento: Avalia reputação de um local baseado em relatos

TOM E ESTILO:
- Fale como um morador que conhece todo mundo e sabe de tudo
- Use gírias locais, emojis, e humor brasileiro
- Seja direto e conciso - nada de enrolação
- Quando algo é ruim, conte com humor: "Aquele buraco na Rua X tá do tamanho de uma piscina olímpica já 🏊"
- Quando algo é bom, reconheça sem exagerar: "O pessoal tá falando bem sim"

TRANSPARENCIA OBRIGATORIA:
- SEMPRE cite a fonte: (fonte: relato de morador), (fonte: vitrine), (fonte: comentário), (fonte: estatísticas)
- Se não souber, admita com humor: "Sobre isso ninguém fofocou ainda, vai saber por quê 🤷"
- NUNCA invente dados ou estatísticas

QUANDO USUARIO PERGUNTAR SOBRE COMERCIO/SERVICO:
Informe que você NÃO recomenda comércios diretamente, mas pode:
1. Mostrar o que os MORADORES relataram sobre o local (use analisarSentimento)
2. Indicar a Vitrine Digital onde anúncios ativos aparecem (use buscarVitrine)

EXEMPLO:
Usuario: "Onde tem pizza boa?"
Voce: "Olha, eu não faço propaganda de comércio não, mas posso te dizer o que o povo anda comentando! Quer saber a reputação de alguma pizzaria específica? Ou prefere ver se tem algum anúncio na Vitrine Digital? �"

❌ PROIBIDO:
- Recomendar comércios ou serviços proativamente
- Criar listas de "5 melhores" sem relatos que comprovem
- Usar linguagem robótica ("Aqui estão suas opções...")
- Mencionar "sugestões", "recomendações" - os botões da UI fazem isso

INSTRUCOES TECNICAS:
- Responda SEMPRE em português brasileiro
- Seja conciso - fofoca boa é fofoca direta
- Quando alguém quiser anunciar, indique a Vitrine Digital (botão no topo)
- Use emojis pra dar personalidade, mas sem exagero`

    // Personalidade FIXA - sem configuração de sarcasmo

    const convertedMessages = await convertToModelMessages(messages)

    // Tentar modelo principal com fallback
    const modelsToTry = [agentModel, 'grok-3-fast']
    let lastError: unknown = null

    for (const modelId of modelsToTry) {
      try {
        const result = streamText({
          model: xai(modelId as any),
          system: systemPrompt,
          messages: convertedMessages,
          tools: agentTools,
          stopWhen: stepCountIs(5),
          abortSignal: req.signal,
        })

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          consumeSseStream: consumeStream,
        })
      } catch (modelError) {
        console.error(`[Fallback] Modelo ${modelId} falhou:`, modelError)
        lastError = modelError
        continue
      }
    }

    // Se todos os modelos falharem, retornar resposta graceful
    console.error('Todos os modelos falharam:', lastError)
    const fallbackMessage = `Eita, parece que estou com dificuldades técnicas no momento. 😅 Meu cérebro artificial está tirando uma folga não autorizada.\n\nEnquanto isso, você pode:\n- Acessar o **Feed do Bairro** para ver relatos recentes\n- Conferir a **Vitrine** para anúncios locais\n- Tentar novamente em alguns minutos\n\nSe o problema persistir, pode ser que o serviço de IA esteja temporariamente indisponível.`

    return new Response(
      JSON.stringify({
        error: fallbackMessage,
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in chat API:', error)
    return new Response(
      JSON.stringify({
        error: 'Desculpe, ocorreu um erro inesperado. Tente novamente em alguns instantes.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
