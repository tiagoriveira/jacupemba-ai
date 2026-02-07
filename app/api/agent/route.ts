import { ToolLoopAgent, createAgentUIStreamResponse, tool } from 'ai'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'

// Tool para buscar relatos recentes
const buscarRelatos = tool({
  description: 'Busca relatos recentes no bairro. Use para responder perguntas sobre o que está acontecendo, problemas reportados, segurança, trânsito, etc.',
  inputSchema: z.object({
    categoria: z.string().optional().describe('Categoria específica: seguranca, emergencia, saude, transito, saneamento, iluminacao, convivencia, animais, eventos, comercio, transporte, outros'),
    limite: z.number().optional().default(5).describe('Número de relatos a buscar (padrão: 5)')
  }),
  execute: async ({ categoria, limite }) => {
    try {
      let query = supabase
        .from('anonymous_reports')
        .select('*')
        .eq('status', 'aprovado')
        .order('created_at', { ascending: false })
        .limit(limite || 5)

      if (categoria) {
        query = query.eq('category', categoria)
      }

      const { data, error } = await query

      if (error) throw error

      return {
        success: true,
        relatos: data?.map(r => ({
          id: r.id,
          texto: r.text,
          categoria: r.category,
          data: r.created_at,
          nivelRisco: r.triagem?.nivelRisco || 'baixo'
        })) || []
      }
    } catch (error) {
      console.error('[v0] Erro ao buscar relatos:', error)
      return { success: false, erro: 'Erro ao buscar relatos' }
    }
  }
})

// Tool para buscar empresas locais
const buscarEmpresas = tool({
  description: 'Busca empresas e comércios locais no bairro. Use para responder perguntas sobre restaurantes, serviços, lojas, etc.',
  inputSchema: z.object({
    categoria: z.string().optional().describe('Categoria de empresa: restaurante, servicos, mercado, saude, educacao, lazer'),
    termo: z.string().optional().describe('Termo de busca no nome ou descrição')
  }),
  execute: async ({ categoria, termo }) => {
    try {
      let query = supabase
        .from('local_businesses')
        .select('*')
        .eq('approved', true)
        .order('name', { ascending: true })
        .limit(10)

      if (categoria) {
        query = query.eq('category', categoria)
      }

      if (termo) {
        query = query.ilike('name', `%${termo}%`)
      }

      const { data, error } = await query

      if (error) throw error

      return {
        success: true,
        empresas: data?.map(e => ({
          id: e.id,
          nome: e.name,
          categoria: e.category,
          descricao: e.description,
          contato: e.contact,
          endereco: e.address,
          horario: e.hours
        })) || []
      }
    } catch (error) {
      console.error('[v0] Erro ao buscar empresas:', error)
      return { success: false, erro: 'Erro ao buscar empresas' }
    }
  }
})

// Tool para estatísticas do bairro
const obterEstatisticas = tool({
  description: 'Obtém estatísticas gerais sobre o bairro, como número de relatos por categoria, tendências, etc.',
  inputSchema: z.object({
    periodo: z.enum(['24h', '7d', '30d']).optional().default('7d').describe('Período de análise')
  }),
  execute: async ({ periodo }) => {
    try {
      const periodoMap = {
        '24h': '1 day',
        '7d': '7 days',
        '30d': '30 days'
      }

      const { data, error } = await supabase
        .from('anonymous_reports')
        .select('category, created_at, status')
        .eq('status', 'aprovado')
        .gte('created_at', new Date(Date.now() - (periodo === '24h' ? 86400000 : periodo === '7d' ? 604800000 : 2592000000)).toISOString())

      if (error) throw error

      const categorias: Record<string, number> = {}
      data?.forEach(r => {
        categorias[r.category] = (categorias[r.category] || 0) + 1
      })

      return {
        success: true,
        periodo,
        totalRelatos: data?.length || 0,
        porCategoria: categorias,
        categoriaMaisReportada: Object.entries(categorias).sort(([,a], [,b]) => b - a)[0]?.[0] || 'nenhuma'
      }
    } catch (error) {
      console.error('[v0] Erro ao buscar estatísticas:', error)
      return { success: false, erro: 'Erro ao buscar estatísticas' }
    }
  }
})

// Criar agente com personalidade
const jacupembaAgent = new ToolLoopAgent({
  model: 'xai/grok-beta',
  instructions: `Você é o Jacupemba AI, um assistente virtual do bairro Jacupemba em Campo Grande (RJ).

PERSONALIDADE:
- Você é AMIGÁVEL, INFORMAL e um pouco SARCÁSTICO (mas nunca rude)
- Use gírias cariocas ocasionalmente: "mano", "véi", "massa", "sinistro", "top"
- Seja DIRETO e OBJETIVO - não enrola
- Demonstre EMPATIA com problemas do bairro
- Use emojis ocasionalmente para dar vida às respostas

CONHECIMENTO:
- Você tem acesso a dados REAIS de relatos, empresas e estatísticas do bairro
- SEMPRE use as ferramentas disponíveis quando o usuário perguntar sobre:
  * Problemas ou acontecimentos no bairro → buscarRelatos
  * Comércios, restaurantes, serviços → buscarEmpresas
  * Estatísticas ou tendências → obterEstatisticas
- Se não tiver dados suficientes, seja honesto e peça mais informações

ESTILO DE RESPOSTA:
- Respostas CURTAS e PRÁTICAS (2-4 frases normalmente)
- Use markdown para formatar (listas, negrito)
- Mencione dados específicos quando relevante (ex: "achei 3 relatos sobre isso")
- Finalize com perguntas abertas quando apropriado

EXEMPLOS DE TOM:
❌ "Prezado usuário, informo que foram identificados diversos relatos..."
✅ "Opa! Achei uns relatos sobre isso aqui. Dá uma olhada:"

❌ "Lamento informar que não possuo dados..."
✅ "Rapaz, não tenho info sobre isso ainda... Mas posso te ajudar com outra coisa?"

IMPORTANTE: Você NUNCA inventa dados. Se não tiver informação, diga claramente.`,
  tools: {
    buscarRelatos,
    buscarEmpresas,
    obterEstatisticas
  },
  maxSteps: 10
})

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    return createAgentUIStreamResponse({ 
      agent: jacupembaAgent, 
      uiMessages: messages 
    })
  } catch (error) {
    console.error('[v0] Erro no agente:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao processar mensagem' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
