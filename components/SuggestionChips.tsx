'use client'

import { MapPin, TrendingUp, MessageSquare, ShoppingBag } from 'lucide-react'

interface Suggestion {
  icon: React.ElementType
  text: string
  query: string
  category: 'servico' | 'comercio' | 'relato' | 'estatistica' | 'local' | 'feedback'
}

interface SuggestionChipsProps {
  suggestions: Suggestion[]
  onSuggestionClick: (query: string) => void
}

export function SuggestionChips({ suggestions, onSuggestionClick }: SuggestionChipsProps) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon
          return (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.query)}
              className="group flex items-center gap-1.5 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs text-zinc-600 transition-all hover:border-zinc-400 hover:bg-zinc-200 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            >
              <Icon className="h-3 w-3" />
              <span>{suggestion.text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Gera sugestões contextuais baseadas na resposta do agente, focando no que foi discutido
export function generateContextualSuggestions(
  agentMessage: string,
  lastUserMessage?: string,
  conversationContext?: string
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const lowerMessage = agentMessage.toLowerCase()
  const lowerUserMessage = lastUserMessage?.toLowerCase() || ''

  // Se agente está fazendo pergunta, não mostrar sugestões (usuário deve responder)
  if (agentMessage.includes('?') && agentMessage.split('?').length >= 3) {
    return []
  }

  // Contexto: conversa sobre segurança/problemas
  if (lowerMessage.includes('segurança') || lowerMessage.includes('relato') ||
    lowerUserMessage.includes('segurança') || lowerUserMessage.includes('problema')) {
    suggestions.push(
      { icon: MapPin, text: 'Mais relatos', query: 'Tem mais relatos recentes sobre isso?', category: 'relato' },
      { icon: TrendingUp, text: 'Últimos 30 dias', query: 'Como estava isso nos últimos 30 dias?', category: 'estatistica' }
    )
  }

  // Contexto: conversa sobre vitrine/produtos
  if (lowerMessage.includes('vitrine') || lowerMessage.includes('anúncio') ||
    lowerUserMessage.includes('comprar') || lowerUserMessage.includes('produto')) {
    suggestions.push(
      { icon: ShoppingBag, text: 'Outros anúncios', query: 'Tem outros anúncios na vitrine?', category: 'comercio' },
    )
  }

  // Contexto: conversa sobre trânsito/infraestrutura
  if (lowerMessage.includes('trânsito') || lowerMessage.includes('buraco') ||
    lowerMessage.includes('iluminação') || lowerMessage.includes('saneamento')) {
    suggestions.push(
      { icon: MapPin, text: 'Outras ruas', query: 'E nas outras ruas, como está?', category: 'relato' },
    )
  }

  // Contexto: conversa sobre estatísticas
  if (lowerMessage.includes('estatística') || lowerMessage.includes('tendência') ||
    lowerMessage.includes('total de')) {
    suggestions.push(
      { icon: TrendingUp, text: 'Comparar períodos', query: 'Como era no mês passado?', category: 'estatistica' },
    )
  }

  // Fallback sutil — apenas 2 opções genéricas se nenhum contexto foi detectado
  if (suggestions.length === 0) {
    suggestions.push(
      { icon: MapPin, text: 'Relatos recentes', query: 'Quais são os últimos relatos do bairro?', category: 'relato' },
      { icon: MessageSquare, text: 'Resumo do bairro', query: 'Me dá um resumo do que está rolando no bairro', category: 'estatistica' }
    )
  }

  return suggestions.slice(0, 3)
}

// Sugestões iniciais para primeira interação — focadas em informação, não recomendação
export const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    icon: MapPin,
    text: 'Relatos do bairro',
    query: 'Quais são os últimos relatos do bairro?',
    category: 'relato'
  },
  {
    icon: TrendingUp,
    text: 'Resumo do Jacupemba',
    query: 'Me dá um resumo de como está o bairro',
    category: 'estatistica'
  },
  {
    icon: ShoppingBag,
    text: 'Vitrine digital',
    query: 'O que tem na vitrine digital hoje?',
    category: 'comercio'
  }
]
