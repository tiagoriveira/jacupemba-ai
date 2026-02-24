import { consumeStream, convertToModelMessages, generateText, stepCountIs, streamText, tool, UIMessage } from 'ai'
import { supabase } from '@/lib/supabase'
import { createXai } from '@ai-sdk/xai'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const xai = createXai({
  apiKey: process.env.XAI_API_KEY!
})

if (!process.env.XAI_API_KEY) {
  console.error('[FATAL] XAI_API_KEY não configurada nas variáveis de ambiente')
}

// ---------------------------------------------------------------------------
// Helper: sanitize user input for PostgREST queries
// ---------------------------------------------------------------------------
function sanitizeForPostgrest(input: string): string {
  return input.replace(/[%_\\(),.]/g, '').substring(0, 100).trim()
}

// ---------------------------------------------------------------------------
// Helper: format relative time for context readability
// ---------------------------------------------------------------------------
function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()

  // Datas futuras
  if (diff < 0) {
    const absDiff = Math.abs(diff)
    const minutes = Math.floor(absDiff / 60000)
    const hours = Math.floor(absDiff / 3600000)
    const days = Math.floor(absDiff / 86400000)
    if (minutes < 60) return `em ${minutes}min`
    if (hours < 24) return `em ${hours}h`
    return `em ${days}d`
  }

  // Datas passadas
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
// Helper: load persistent memory from Supabase (cross-session)
// ---------------------------------------------------------------------------
async function loadPersistentMemory(userFingerprint: string | null): Promise<string> {
  if (!userFingerprint) return ''

  try {
    const { data: history, error } = await supabase
      .from('user_query_history')
      .select('query, response_summary, created_at')
      .eq('user_id', userFingerprint)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error || !history || history.length === 0) return ''

    const memoryLines = history
      .reverse() // Ordem cronológica
      .map(h => {
        const when = formatRelativeTime(h.created_at)
        const summary = h.response_summary
          ? h.response_summary.substring(0, 120) + (h.response_summary.length > 120 ? '...' : '')
          : ''
        return `- [${when}] Perguntou: "${h.query}" → ${summary}`
      })

    return `\n\nMEMORIA DE CONVERSAS ANTERIORES (este usuario ja conversou com voce antes):
${memoryLines.join('\n')}

Use essa memória para personalizar suas respostas. Se o usuario retomar um tema antigo, mostre que lembra. Exemplo: "Ah, voce perguntou sobre isso antes! Deixa eu atualizar..."`
  } catch (err) {
    console.error('[Memory] Erro ao carregar memória:', err)
    return ''
  }
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
        .ilike('text', `%${sanitizeForPostgrest(local)}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      // Buscar o comércio pelo nome
      const { data: comercio } = await supabase
        .from('local_businesses')
        .select('id, name')
        .eq('status', 'aprovado')
        .ilike('name', `%${sanitizeForPostgrest(local)}%`)
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
        model: xai('grok-3-fast'),
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
        const safe = sanitizeForPostgrest(termo)
        query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
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
  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    // Load base context from 3 data layers (removido businesses)
    const { reports, comments, vitrinePosts } = await getBairroContext()

    // Modelo fixo - sem configuração de personalidade
    const agentModel = 'grok-3-fast'

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

    // Load persistent memory from Supabase
    const userFingerprint = req.headers.get('x-user-fingerprint')
    const persistentMemory = await loadPersistentMemory(userFingerprint)

    // System prompt — Assistente Local do Jacupemba
    const systemPrompt = `Você é um morador do Jacupemba que sabe tudo do bairro. Fala direto, sem enrolação.

DADOS DISPONÍVEIS:${reportsContext}${vitrineContext}${conversationContext}${persistentMemory}

FERRAMENTAS:
- buscarRelatos: Busca relatos por categoria
- analisarSentimento: Vê o que o pessoal tá falando sobre um lugar

📏 ESTRUTURA DE RESPOSTA (OBRIGATÓRIA):

Quando listar múltiplos relatos, organize assim:

1️⃣ RESUMO EXECUTIVO (2-3 linhas no topo)
   Panorama geral + números + categorias mais ativas
   Exemplo: "Tá rolando bastante coisa! 11 relatos nos últimos 7 dias: 3 urgentes, 5 moderados, 3 informativos."

2️⃣ RELATOS POR URGÊNCIA (organize por prioridade):

🚨 URGENTE
• Segurança - Descrição curta (há X dias)
• Emergência - Descrição curta (há X dias)

⚠️ ATENÇÃO
• Trânsito - Descrição curta (há X dias)
• Saneamento - Descrição curta (há X dias)

ℹ️ INFORMATIVO
• Eventos - Descrição curta (há X dias)
• Comércio - Descrição curta (há X dias)

---

3️⃣ CALL TO ACTION (final)
   "Quer mais detalhes de alguma categoria?"

🎯 REGRAS DE FORMATAÇÃO:

✅ USE:
• Bullets com • (nunca use - **texto**)
• Emojis para categorias (🚨 🚸 🚦 💧 💡 🏥 🐕 🎪 🏬)
• Separador --- entre seções principais
• Máximo 3-4 relatos por categoria (se tiver mais, agrupe: "5 relatos de trânsito")
• Linha em branco entre categorias de urgência

❌ NÃO USE:
• Negrito com asteriscos em nenhuma palavra
• Listas numeradas longas
• Textos densos sem respiração
• "Aqui estão suas opções" ou linguagem robótica

📊 PRIORIZAÇÃO:

URGENTE (🚨): Segurança, Emergência
ATENÇÃO (⚠️): Trânsito, Saneamento, Saúde, Iluminação
INFORMATIVO (ℹ️): Eventos, Comércio, Convivência, Animais, Transporte, Outros

� TOM:
- Direto, conciso e natural
- Tom sacarstico e conciso ao responder
- Sempre cite a fonte
- Se não sabe diga que não tem fontes pra responder

🔄 CONTINUIDADE:
- Primeira mensagem: "E aí, o que cê quer saber do bairro?"
- Próximas: responde direto, continuando o contexto da conversa

É simples: tem relato? Estrutura bonitinho. Não tem? Diz que não tem. Fim.`


    const convertedMessages = await convertToModelMessages(messages)

    // Stream com modelo principal — fallback tratado via onError do stream
    const result = streamText({
      model: xai(agentModel as any),
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
