import { consumeStream, convertToModelMessages, streamText, UIMessage } from 'ai'
import { supabase } from '@/lib/supabase'

export const maxDuration = 30

async function getBairroContext() {
  try {
    // Buscar relatos das ultimas 48h
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const { data: reports } = await supabase
      .from('anonymous_reports')
      .select('*')
      .gte('created_at', fortyEightHoursAgo)
      .order('created_at', { ascending: false })
      .limit(20)

    // Buscar comercios e servicos verificados
    const { data: businesses } = await supabase
      .from('local_businesses')
      .select('*')
      .eq('verified', true)
      .order('name')

    // Buscar posts da vitrine validos
    const { data: vitrinePosts } = await supabase
      .from('vitrine_posts')
      .select('*')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    return { reports: reports || [], businesses: businesses || [], vitrinePosts: vitrinePosts || [] }
  } catch (error) {
    console.error('[v0] Error fetching bairro context:', error)
    return { reports: [], businesses: [], vitrinePosts: [] }
  }
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  // Buscar dados reais do bairro
  const { reports, businesses, vitrinePosts } = await getBairroContext()

  // Montar contexto dinamico
  const reportsContext = reports.length > 0 
    ? `\n\nRELATOS RECENTES DO BAIRRO (ultimas 48h):\n${reports.map(r => `- [${r.category}] ${r.text}`).join('\n')}`
    : ''

  const businessesContext = businesses.length > 0
    ? `\n\nCOMERCIOS E SERVICOS LOCAIS VERIFICADOS:\n${businesses.map(b => 
        `- ${b.name} (${b.category})\n  Tel: ${b.phone || 'N/A'} | WhatsApp: ${b.whatsapp || 'N/A'}\n  ${b.address || 'Endereco nao informado'}\n  Horario: ${b.hours || 'Consultar'}\n  ${b.description || ''}`
      ).join('\n\n')}`
    : ''

  const vitrineContext = vitrinePosts.length > 0
    ? `\n\nANUNCIOS NA VITRINE (validos por 48h):\n${vitrinePosts.map(v => 
        `- ${v.title} - R$ ${v.price}\n  Vendedor: ${v.seller_name} | Tel: ${v.seller_phone}\n  ${v.description || ''}`
      ).join('\n\n')}`
    : ''

  const result = streamText({
    model: 'xai/grok-beta',
    system: `Você é o Assistente Local, um assistente conversacional que ajuda moradores do bairro a encontrar serviços, comércios, vagas de emprego e eventos locais.

DADOS REAIS DO BAIRRO:${reportsContext}${businessesContext}${vitrineContext}

INSTRUÇÕES IMPORTANTES:
- Sempre responda em português brasileiro de forma natural e amigável
- Use APENAS os dados reais fornecidos acima - NAO invente informacoes
- Quando listar estabelecimentos, use os telefones e enderecos exatos do banco de dados
- Se nao houver dados sobre algo, seja honesto e diga que nao tem essa informacao no momento
- Quando perguntarem sobre "assuntos do momento" ou "o que esta acontecendo", analise os relatos recentes por categoria
- Sempre responda em português brasileiro de forma natural e amigável
- Foque em informações locais do bairro
- Quando listar estabelecimentos ou profissionais, organize as informações de forma clara com:
  * Nome do estabelecimento/profissional
  * Telefone/WhatsApp (formato: (XX) XXXXX-XXXX)
  * Endereço completo
  * Horário de funcionamento (quando relevante)
  * Informações adicionais relevantes

ASSUNTOS DO MOMENTO:
Quando o usuário mencionar "Me conte mais sobre:" (como um dos tópicos em alta), responda com as seguintes informações:

- "Falta de luz na região": Explique que muitos vizinhos relataram queda de energia na região do Jacupemba nas últimas 6 horas. Mencione que as áreas mais afetadas são próximas à Praça, que a concessionária foi notificada, a equipe está a caminho, e a previsão de reparo é até às 18h. Recomende ligar para 0800-XXX-XXXX após esse horário se ainda houver problema.

- "Movimentação na Praça": Comente que há uma feira de artesanato acontecendo na Praça do Jacupemba neste fim de semana (sábado e domingo, 10h às 20h). Mencione que há vendedores locais com produtos artesanais, comidas típicas e apresentações musicais ao vivo às 14h, 16h e 18h.

- "Coleta de lixo atrasada": Informe que a coleta está com atraso de 2 dias em algumas ruas da zona oeste do bairro devido a problema mecânico no caminhão. Mencione que a prefeitura enviou um caminhão reserva e que a coleta será normalizada a partir de amanhã com coleta reforçada.

ANÁLISE DE IMAGENS:
- Quando o usuário enviar uma imagem, analise-a cuidadosamente para identificar produtos, objetos ou situações
- Infira qual serviço ou produto está relacionado à imagem
- Se a imagem for ambígua ou pouco clara, faça perguntas curtas para confirmar (ex: "Isso é um vazamento?" ou "Você precisa consertar ou comprar?")
- Se não conseguir identificar com confiança, seja honesto e peça uma foto melhor ou mais contexto
- NUNCA invente serviços que não existem - use apenas dados realistas
- Sempre recomende estabelecimentos/profissionais que oferecem o que foi identificado na imagem

FORMATO DE RESPOSTA EXEMPLO:
"Vi que na foto você precisa de [serviço/produto]. Encontrei 2 opções para você:

**1. [Nome do Estabelecimento]**
📞 (27) 99999-1234
📍 Rua Exemplo, 123
⏰ Segunda a Sexta: 8h às 18h
ℹ️ [Informação adicional relevante]

**2. [Nome do Estabelecimento]**
📞 (27) 99999-5678
📍 Avenida Principal, 456
⏰ Segunda a Sábado: 9h às 19h"

Por enquanto, use dados fictícios mas realistas para simular respostas até que o banco de dados real esteja integrado.`,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
