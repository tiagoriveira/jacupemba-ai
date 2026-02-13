'use client'

import { Lightbulb, MapPin, Store, TrendingUp, Users, Zap, Star, MessageSquare } from 'lucide-react'

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
              className="group flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition-all hover:border-zinc-900 hover:bg-zinc-900 hover:text-white hover:shadow-md active:scale-95"
            >
              <Icon className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
              <span>{suggestion.text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Gera sugestões contextuais baseadas na resposta do agente E no contexto da conversa atual
export function generateContextualSuggestions(
  agentMessage: string,
  lastUserMessage?: string,
  conversationContext?: string // Nova: todo o contexto da conversa atual
): Suggestion[] {
  const suggestions: Suggestion[] = []
  const lowerMessage = agentMessage.toLowerCase()
  const lowerUserMessage = lastUserMessage?.toLowerCase() || ''
  const lowerConversation = conversationContext?.toLowerCase() || ''

  // Contexto: Serviços/Profissionais (baseado na conversa atual)
  if (lowerMessage.includes('eletricista') || lowerMessage.includes('encanador') || 
      lowerMessage.includes('profissional') || lowerMessage.includes('serviço') ||
      lowerUserMessage.includes('preciso de') || lowerUserMessage.includes('procuro') ||
      lowerConversation.includes('serviço') || lowerConversation.includes('profissional')) {
    
    suggestions.push(
      {
        icon: Zap,
        text: 'Outros serviços',
        query: 'Quais outros serviços estão disponíveis?',
        category: 'servico'
      },
      {
        icon: Store,
        text: 'Material de construção',
        query: 'Onde tem loja de material de construção?',
        category: 'comercio'
      }
    )
  }

  // Contexto: Comércios/Restaurantes (baseado na conversa atual)
  if (lowerMessage.includes('restaurante') || lowerMessage.includes('loja') || 
      lowerMessage.includes('comércio') || lowerMessage.includes('comer') ||
      lowerUserMessage.includes('onde') && lowerUserMessage.includes('comer') ||
      lowerConversation.includes('restaurante') || lowerConversation.includes('comércio')) {
    
    suggestions.push(
      {
        icon: Store,
        text: 'Delivery barato',
        query: 'Onde tem comida barata para delivery?',
        category: 'comercio'
      },
      {
        icon: Store,
        text: 'Farmácia 24h',
        query: 'Onde tem farmácia aberta agora?',
        category: 'comercio'
      }
    )
  }

  // Contexto: Segurança/Problemas (baseado na conversa atual)
  if (lowerMessage.includes('segurança') || lowerMessage.includes('problema') || 
      lowerMessage.includes('relato') || lowerMessage.includes('rua') ||
      lowerUserMessage.includes('problema') || lowerUserMessage.includes('rua') ||
      lowerConversation.includes('segurança') || lowerConversation.includes('relato')) {
    
    suggestions.push(
      {
        icon: MapPin,
        text: 'Relatos recentes',
        query: 'Quais são os relatos mais recentes do bairro?',
        category: 'relato'
      },
      {
        icon: TrendingUp,
        text: 'Tendências de segurança',
        query: 'Como está a situação de segurança no bairro?',
        category: 'estatistica'
      }
    )
  }

  // Contexto: Estatísticas/Dados (baseado na conversa atual)
  if (lowerMessage.includes('estatística') || lowerMessage.includes('dados') || 
      lowerMessage.includes('tendência') || lowerUserMessage.includes('como está') ||
      lowerConversation.includes('estatística') || lowerConversation.includes('tendência')) {
    
    suggestions.push(
      {
        icon: TrendingUp,
        text: 'Tendências do mês',
        query: 'Quais são as tendências do último mês no bairro?',
        category: 'estatistica'
      },
      {
        icon: Users,
        text: 'Resumo geral',
        query: 'Me dá um resumo completo do bairro',
        category: 'estatistica'
      }
    )
  }

  // Contexto: Mencionou comércio específico com contato (só se tiver nome próprio + telefone/endereço)
  const hasBusinessName = /\*\*[A-Z][^*]+\*\*/.test(agentMessage) // Detecta nomes em negrito (padrão do agente)
  const hasContact = lowerMessage.includes('tel:') || lowerMessage.includes('telefone') || 
                     lowerMessage.includes('whatsapp') || lowerMessage.includes('wa.me')
  
  if (hasBusinessName && hasContact) {
    suggestions.push({
      icon: Star,
      text: 'Avaliar este local',
      query: 'Quero avaliar este comércio',
      category: 'local'
    })
  }

  // Contexto: Agente fez pergunta de refinamento (detectar emojis + interrogação)
  const isAskingQuestion = agentMessage.includes('?') && 
                          (agentMessage.includes('🍽️') || agentMessage.includes('⚡') || 
                           agentMessage.includes('💊') || agentMessage.includes('🛒'))
  
  // Se agente está fazendo pergunta, não mostrar sugestões genéricas (usuário deve responder)
  if (isAskingQuestion) {
    // Não adicionar sugestões genéricas quando agente pergunta
    return suggestions.slice(0, 2) // Máximo 2 contextuais se houver
  }

  // Se não houver contexto específico, sugestões gerais
  if (suggestions.length === 0) {
    suggestions.push(
      {
        icon: Zap,
        text: 'Preciso de um serviço',
        query: 'Preciso encontrar um profissional para um serviço',
        category: 'servico'
      },
      {
        icon: Store,
        text: 'Onde comer?',
        query: 'Onde tem um lugar bom e barato para comer?',
        category: 'comercio'
      },
      {
        icon: MapPin,
        text: 'Relatos do bairro',
        query: 'Quais são os últimos relatos do bairro?',
        category: 'relato'
      },
      {
        icon: TrendingUp,
        text: 'Como está o Jacupemba?',
        query: 'Me dá um resumo de como está o bairro',
        category: 'estatistica'
      }
    )
  }

  // Limitar a máximo 4 sugestões
  return suggestions.slice(0, 4)
}

// Sugestões iniciais para primeira interação
export const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    icon: Zap,
    text: 'Preciso de um serviço',
    query: 'Preciso encontrar um profissional para um serviço',
    category: 'servico'
  },
  {
    icon: Store,
    text: 'Onde comer?',
    query: 'Onde tem um lugar bom e barato para comer?',
    category: 'comercio'
  },
  {
    icon: MapPin,
    text: 'Relatos do bairro',
    query: 'Quais são os últimos relatos do bairro?',
    category: 'relato'
  },
  {
    icon: TrendingUp,
    text: 'Como está o Jacupemba?',
    query: 'Me dá um resumo de como está o bairro',
    category: 'estatistica'
  }
]
