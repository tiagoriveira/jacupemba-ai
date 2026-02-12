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

      // Se encontrou o comércio, buscar reviews
      let reviews: any[] = []
      if (comercio) {
        const { data: reviewsData } = await supabase
          .from('business_reviews')
          .select('rating, comment, created_at')
          .eq('business_id', comercio.id)
          .order('created_at', { ascending: false })
          .limit(20)
        
        reviews = reviewsData || []
      }

      const totalMencoes = (relatos?.length || 0) + reviews.length

      if (totalMencoes === 0) {
        return {
          local,
          totalMencoes: 0,
          mensagem: 'Nenhum relato ou avaliacao encontrada sobre este local.',
        }
      }

      // Preparar dados para análise
      let contextTexto = ''
      
      if (relatos && relatos.length > 0) {
        contextTexto += 'RELATOS DOS MORADORES:\n'
        contextTexto += relatos.map(r => r.text).join('\n---\n')
      }

      if (reviews.length > 0) {
        contextTexto += '\n\nAVALIAÇÕES (1-5 ESTRELAS):\n'
        contextTexto += reviews.map(r => {
          const stars = '⭐'.repeat(r.rating)
          return `${stars} (${r.rating}/5)${r.comment ? ': ' + r.comment : ''}`
        }).join('\n---\n')
        
        // Calcular média de reviews
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        contextTexto += `\n\nMÉDIA DE AVALIAÇÕES: ${avgRating.toFixed(1)}/5 (${reviews.length} avaliações)`
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
  "resumo": "<resumo em 1-2 frases do que as pessoas dizem>",
  "media_avaliacoes": ${reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 'null'}
}`,
      })

      try {
        const resultado = JSON.parse(analise.replace(/```json\n?|\n?```/g, '').trim())
        return { 
          local, 
          totalMencoes,
          totalRelatos: relatos?.length || 0,
          totalAvaliacoes: reviews.length,
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

// NOTA: Busca semântica removida temporariamente para evitar deadlock (fetch interno)
// TODO: Implementar busca semântica diretamente no contexto desta rota sem fetch

const detectarIntencaoServico = tool({
  description:
    'Detecta quando o usuario esta procurando por um servico ou profissional especifico e busca comercios/profissionais assinantes que podem ajudar. Use quando o usuario disser frases como "preciso de", "onde encontro", "procuro", "quero contratar", "orcamento para", etc.',
  inputSchema: z.object({
    termoServico: z.string().describe('O servico ou profissional que o usuario esta procurando (ex: eletricista, encanador, mecanico)'),
  }),
  execute: async ({ termoServico }) => {
    try {
      // Buscar profissionais/comercios ASSINANTES relacionados
      const { data: assinantes, error } = await supabase
        .from('local_businesses')
        .select('*')
        .eq('status', 'aprovado')
        .eq('verified', true)
        .eq('is_subscribed', true)
        .or(`name.ilike.%${termoServico}%,description.ilike.%${termoServico}%,category.ilike.%${termoServico}%`)
        .limit(3)

      if (error) throw error

      // Buscar profissionais NÃO assinantes (para mencionar sem facilitar contato)
      const { data: naoAssinantes } = await supabase
        .from('local_businesses')
        .select('name, category')
        .eq('status', 'aprovado')
        .eq('verified', true)
        .eq('is_subscribed', false)
        .or(`name.ilike.%${termoServico}%,description.ilike.%${termoServico}%,category.ilike.%${termoServico}%`)
        .limit(5)

      if (!assinantes || assinantes.length === 0) {
        // Se não há assinantes, informar sobre não-assinantes sem facilitar contato
        if (naoAssinantes && naoAssinantes.length > 0) {
          return {
            encontrado: false,
            temNaoAssinantes: true,
            servico: termoServico,
            mensagem: `Encontrei alguns profissionais de ${termoServico} no bairro, mas eles ainda nao sao parceiros do Jacupemba AI. Posso mencionar os nomes, mas nao tenho autorizacao para facilitar o contato direto.`,
            naoAssinantes: naoAssinantes.map(p => p.name),
          }
        }

        return {
          encontrado: false,
          mensagem: `Nao encontrei profissionais de ${termoServico} cadastrados no momento.`,
        }
      }

      // Formatar profissionais assinantes com link de WhatsApp
      const profissionaisFormatados = assinantes.map(p => {
        // Limpar telefone (remover espaços, parênteses, hífens)
        const telefoneLimpo = (p.phone || '').replace(/\D/g, '')
        
        // Gerar link de WhatsApp se tiver telefone
        const whatsappLink = telefoneLimpo 
          ? `https://wa.me/55${telefoneLimpo}?text=Ola%2C%20vim%20pelo%20Assistente%20Jacupemba.%20Preciso%20de%20${encodeURIComponent(termoServico)}.`
          : null

        return {
          id: p.id,
          nome: p.name,
          telefone: p.phone || 'N/A',
          endereco: p.address || 'N/A',
          descricao: p.description || '',
          categoria: p.category,
          whatsappLink,
        }
      })

      return {
        encontrado: true,
        total: profissionaisFormatados.length,
        servico: termoServico,
        profissionais: profissionaisFormatados,
        mensagem: `Encontrei ${profissionaisFormatados.length} profissional(is) parceiro(s) que pode(m) ajudar com ${termoServico}.`,
      }
    } catch {
      return {
        encontrado: false,
        erro: 'Erro ao buscar profissionais',
      }
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

    // Ler configurações do agente (via headers do cliente que leu do localStorage)
    // Forçar uso do modelo grok-4-1-fast-reasoning em produção e local conforme solicitado
    const agentModel = 'grok-4-1-fast-reasoning'
    const sarcasmLevel = parseInt(req.headers.get('x-agent-sarcasm') || '5', 10)
    const customInstructions = req.headers.get('x-agent-instructions') || ''

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
      detectarIntencaoServico,
    }

    // Build conversation context for memory
    const conversationContext = buildConversationContext(messages)

    // System prompt base
    let systemPrompt = `Voce e o Assistente Local do Jacupemba, um assistente conversacional interativo que SEMPRE busca entender o contexto antes de dar recomendacoes. Voce tem personalidade sarcastica e senso de humor acido, mas e genuinamente util.

DADOS REAIS DO BAIRRO (CONTEXTO BASE):${reportsContext}${businessesContext}${vitrineContext}${conversationContext}

🎯 REGRA DE OURO - INTERATIVIDADE PRIMEIRO:
NUNCA de listas genericas ou recomendacoes diretas na PRIMEIRA interacao sobre um topico. SEMPRE faca perguntas de contexto para refinar a busca:

**Exemplos de Perguntas de Contexto:**
- Restaurante/Comida → "Legal! Me ajuda a refinar: voce quer um lugar mais **familiar** (almoco tranquilo com a familia) ou algo **descontraido** pra ir com os amigos num fim de semana? 🍽️"
- Eletricista/Servico → "Saquei! E **urgente** ou pode esperar ate amanha? E qual o problema especifico: chuveiro, tomada, disjuntor, fiacao...? ⚡"
- Farmacia → "Fechado! Precisa de algo **especifico** (tipo remedio, teste) ou so quer saber onde tem aberta agora? 💊"
- Mercado → "Beleza! E pra fazer uma **compra grande** ou so pegar algo rapido? 🛒"
- Bar/Balada → "Interessante! Voce quer um lugar mais **animado** (musica ao vivo, agito) ou algo **tranquilo** pra conversar? 🍺"

QUANDO USAR FERRAMENTAS:
Voce tem ferramentas para buscar dados, mas USE-AS SOMENTE APOS coletar o contexto do usuario:
- buscarRelatos: Filtra relatos por categoria
- buscarComercio: Busca comercios por categoria/nome
- obterEstatisticas: Dados estatisticos do bairro
- analisarSentimento: Avalia reputacao de comercio
- detectarIntencaoServico: Busca profissionais assinantes (use APOS coletar contexto de urgencia/problema)

FLUXO CONVERSACIONAL:
1. Usuario faz pergunta vaga → Voce faz 1-2 perguntas de contexto (tom conversacional com emojis)
2. Usuario responde com contexto → Voce USA ferramentas e da recomendacoes ESPECIFICAS com justificativa
3. Voce NUNCA da lista de 5 opcoes sem filtrar por contexto

PERSONALIDADE E TOM:
- Seja util, mas com sarcasmo inteligente e humor local
- Nao seja robotico. Seja direto, conciso, honesto e um pouco cinico
- Use emojis para tornar perguntas mais leves
- Quando algo for ruim, seja sincero com humor (ex: "Se voce tem pressa, [X] nao e a melhor amiga do seu relogio.")
- Quando algo for bom, reconheca sem exagerar

TRANSPARENCIA OBRIGATORIA:
- SEMPRE indique a fonte da informacao entre parenteses: (fonte: relato de morador), (fonte: comercio verificado), (fonte: vitrine), (fonte: comentario de morador), (fonte: estatisticas do bairro)
- Se nao tiver certeza ou nao houver dados, diga claramente de forma sarcastica: "Nao tenho essa informacao ainda. Aparentemente ninguem achou importante compartilhar."
- NUNCA invente dados

GERACAO DE LEADS (MONETIZACAO):
Quando o usuario mencionar que precisa de servico/profissional:
1. PRIMEIRO: Colete contexto (urgencia, problema especifico)
2. DEPOIS: Use detectarIntencaoServico para buscar profissionais assinantes
3. Se encontrar ASSINANTES:
   - Apresente de forma conversacional (nome, descricao, endereco)
   - SEMPRE inclua whatsappLink: "Para falar com [Nome]: [whatsappLink]"
   - Justifique por que essa recomendacao faz sentido pro contexto dele
   - Maximo 2-3 profissionais
4. Se NAO encontrar assinantes mas houver nao-assinantes:
   - Mencione apenas NOMES
   - Explique sarcasticamente: "Eles existem, mas nao investiram em aparecer aqui."
5. Se nao encontrar nenhum:
   - Informe que nao ha cadastrados
   - Sugira reportar se conhecer algum

❌ PROIBIDO - NAO FACA ISSO:
- NAO mencione palavras como "Sugestoes", "Recomendacoes", "Proximos passos" no seu texto
- NAO crie listas de sugestoes formatadas (ex: "💡 **Sugestoes:**")
- NAO de listas genericas sem entender o contexto do usuario
- NAO use linguagem robotica ("Aqui estao 5 opcoes...")
- Os botoes de sugestoes sao gerados AUTOMATICAMENTE pela UI - voce NAO precisa menciona-los

EXEMPLOS DE FLUXO COMPLETO:

**Exemplo 1 - Restaurante:**
Usuario: "Onde tem comida barata?"
Assistente: "Opa! Me ajuda a refinar: voce quer um lugar mais **familiar** (almoco tranquilo) ou algo **descontraido** pra ir com os amigos? 🍽️"
Usuario: "Com os amigos"
Assistente: "Beleza! Pra galera, recomendo a **Pizzaria Massa Boa** (delivery, 30 sabores, da pra rachar a conta facil). Tel: (27) 99934-4567 | Rua das Palmeiras, 89. Se preferir barzinho com petisco, tem a **Lanchonete do Seu Jose** (lanches gigantes e cerveja gelada). Tel: (27) 99912-3456 | Rua Principal, 145. (fonte: comercio verificado)"

**Exemplo 2 - Eletricista:**
Usuario: "Preciso de eletricista"
Assistente: "Saquei! E **urgente** ou pode esperar ate amanha? E qual o problema: chuveiro, tomada, disjuntor...? ⚡"
Usuario: "Urgente, chuveiro queimou"
Assistente: "Puxa, urgencia com chuveiro e osso! O **Eletrica do Joao** atende emergencia e e especialista em chuveiro (ja salvou muita gente de banho gelado aqui no bairro). Para falar com Joao: https://wa.me/5527999999999. (fonte: comercio verificado)"

INSTRUCOES TECNICAS:
- Responda SEMPRE em portugues brasileiro
- Use APENAS dados reais do contexto ou ferramentas
- Seja conciso, util e SEMPRE com humor acido
- Quando usuario enviar imagem, analise e recomende relacionados`

    // Aplicar ajuste de sarcasmo baseado no nível configurado
    const sarcasmAdjustments: Record<number, string> = {
      0: '\n\nTom: Seja extremamente educado, formal e cortês. Evite qualquer tipo de sarcasmo.',
      1: '\n\nTom: Seja gentil e amigável, mas pode usar um humor leve ocasionalmente.',
      2: '\n\nTom: Seja útil e direto, com toques ocasionais de personalidade.',
      3: '\n\nTom: Use humor moderado e seja conversacional, mas mantenha o profissionalismo.',
      4: '\n\nTom: Seja espirituoso e use ironia leve para tornar a conversa mais interessante.',
      5: '\n\nTom: Use sarcasmo de forma equilibrada. Seja sincero mas com bom humor.',
      6: '\n\nTom: Aumente o sarcasmo. Seja direto e não tenha medo de fazer observações ácidas sobre a realidade.',
      7: '\n\nTom: Sarcasmo forte. Seja cínico e não amenize problemas. Use comparações irônicas.',
      8: '\n\nTom: Muito sarcástico. Seja brutalmente honesto e use humor negro quando apropriado.',
      9: '\n\nTom: Extremamente sarcástico. Não poupe críticas e seja impiedoso com a verdade.',
      10: '\n\nTom: TÓXICO. Sarcasmo máximo, sem filtros. Seja implacável e excessivamente crítico.'
    }

    systemPrompt += sarcasmAdjustments[sarcasmLevel] || sarcasmAdjustments[5]

    // Adicionar instruções personalizadas se houver
    if (customInstructions.trim()) {
      systemPrompt += `\n\nINSTRUÇÕES ADICIONAIS DO ADMIN:\n${customInstructions}`
    }

    const result = streamText({
      model: xai(agentModel as any), // Usar modelo configurado dinamicamente
      system: systemPrompt,
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
