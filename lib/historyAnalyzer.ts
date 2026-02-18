// Análise de histórico de conversas para gerar chips personalizados

interface HistoryItem {
  id: string
  question: string
  answer: string
  timestamp: string
}

interface TopicSuggestion {
  topic: string
  query: string
  count: number
}

// Palavras-chave para identificar tópicos
const TOPIC_KEYWORDS: Record<string, string[]> = {
  eletricista: ['eletricista', 'elétrica', 'eletrico', 'chuveiro', 'tomada', 'disjuntor', 'fiação'],
  encanador: ['encanador', 'encanamento', 'cano', 'vazamento', 'agua', 'esgoto'],
  mecanico: ['mecânico', 'mecanica', 'carro', 'moto', 'auto', 'oficina'],
  restaurante: ['restaurante', 'comida', 'comer', 'almoço', 'jantar', 'delivery', 'marmita'],
  farmacia: ['farmácia', 'remédio', 'medicamento', 'drogaria'],
  mercado: ['mercado', 'supermercado', 'padaria', 'açougue', 'feira'],
  bar: ['bar', 'cerveja', 'bebida', 'balada', 'festa'],
  academia: ['academia', 'ginástica', 'musculação', 'treino'],
  seguranca: ['segurança', 'assalto', 'roubo', 'perigo', 'violência'],
  transito: ['trânsito', 'buraco', 'rua', 'avenida', 'semáforo'],
}

// Queries sugeridas por tópico
const TOPIC_QUERIES: Record<string, string> = {
  eletricista: 'Preciso de um eletricista',
  encanador: 'Preciso de um encanador',
  mecanico: 'Onde tem mecânico de confiança?',
  restaurante: 'Quais restaurantes tem no bairro?',
  farmacia: 'Onde tem farmácia aberta?',
  mercado: 'Onde tem mercado ou padaria?',
  bar: 'Onde tem um bar legal?',
  academia: 'Onde tem academia no bairro?',
  seguranca: 'Como está a segurança no bairro?',
  transito: 'Quais são os principais problemas de trânsito?',
}

/**
 * Extrai tópicos mais buscados do histórico
 */
export function extractTopicsFromHistory(history: HistoryItem[]): TopicSuggestion[] {
  const topicCounts: Record<string, number> = {}

  // Analisar cada conversa
  history.forEach(item => {
    const text = `${item.question} ${item.answer}`.toLowerCase()

    // Verificar cada categoria de tópico
    Object.entries(TOPIC_KEYWORDS).forEach(([topic, keywords]) => {
      const hasKeyword = keywords.some(keyword => text.includes(keyword))
      if (hasKeyword) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
      }
    })
  })

  // Converter para array e ordenar por frequência
  const topics: TopicSuggestion[] = Object.entries(topicCounts)
    .map(([topic, count]) => ({
      topic,
      query: TOPIC_QUERIES[topic] || `Buscar ${topic}`,
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4) // Top 4 tópicos

  return topics
}

/**
 * Gera texto amigável para chip baseado no tópico
 */
export function getChipText(topic: string): string {
  const texts: Record<string, string> = {
    eletricista: 'Procurar eletricista novamente',
    encanador: 'Ver encanadores disponíveis',
    mecanico: 'Buscar mecânico',
    restaurante: 'Ver outros restaurantes',
    farmacia: 'Farmácias no bairro',
    mercado: 'Mercados e padarias',
    bar: 'Bares e baladas',
    academia: 'Academias próximas',
    seguranca: 'Status de segurança',
    transito: 'Problemas de trânsito',
  }

  return texts[topic] || `Buscar ${topic}`
}

/**
 * Carrega e analisa histórico do localStorage (novo formato conversation-store)
 */
export function getHistoryFromLocalStorage(): HistoryItem[] {
  if (typeof window === 'undefined') return []

  try {
    // Novo formato: conversation-store threads
    const conversationsRaw = localStorage.getItem('jacupemba-conversations')
    if (conversationsRaw) {
      const conversations = JSON.parse(conversationsRaw)
      if (Array.isArray(conversations) && conversations.length > 0) {
        return conversations.slice(0, 10).map((conv: any) => {
          const userMsg = conv.messages?.find((m: any) => m.role === 'user')
          const assistantMsg = conv.messages?.find((m: any) => m.role === 'assistant')
          return {
            id: conv.id || '',
            question: userMsg?.content || '',
            answer: assistantMsg?.content || '',
            timestamp: conv.created_at || new Date().toISOString(),
          }
        }).filter((item: HistoryItem) => item.question)
      }
    }

    // Fallback: formato antigo (pré-migração)
    const oldHistory = localStorage.getItem('chat-history')
    if (!oldHistory) return []
    const parsed = JSON.parse(oldHistory)
    return parsed.slice(-10)
  } catch (error) {
    console.error('Error parsing history:', error)
    return []
  }
}

/**
 * Função principal: gera chips personalizados baseados no histórico
 */
export function generatePersonalizedChips(): { text: string; query: string }[] {
  const history = getHistoryFromLocalStorage()
  
  // Se não houver histórico, retornar array vazio
  if (history.length === 0) {
    return []
  }

  const topics = extractTopicsFromHistory(history)

  return topics.map(topic => ({
    text: getChipText(topic.topic),
    query: topic.query
  }))
}
