'use client'

import React from "react"

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Loader2, AlertTriangle, TrendingUp, MapPin, Store, X, History, ShoppingBag, MessageSquare, ArrowUp, ImagePlus } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getUserFingerprint } from '@/lib/fingerprint'
import { AgentFeedback } from '@/components/AgentFeedback'
import { OnboardingTour } from '@/components/OnboardingTour'
import { SuggestionChips, generateContextualSuggestions, INITIAL_SUGGESTIONS } from '@/components/SuggestionChips'
import { generatePersonalizedChips } from '@/lib/historyAnalyzer'
import { logger } from '@/lib/logger'
import { getApiUrl } from '@/lib/api-config'
import {
  createConversation,
  addMessageToConversation,
  getConversation,
  migrateOldHistory,
  type Conversation,
  type ConversationMessage,
} from '@/lib/conversation-store'

const TRENDING_QUERIES: Record<string, { icon: any, text: string, query: string }> = {
  'seguranca': { icon: AlertTriangle, text: 'Problemas de segurança recentes', query: 'Quais os relatos de segurança mais recentes do bairro?' },
  'emergencia': { icon: AlertTriangle, text: 'Emergências no bairro', query: 'Houve alguma emergência recente no bairro?' },
  'saude': { icon: MapPin, text: 'Saúde pública', query: 'Como está a situação de saúde pública no bairro?' },
  'transito': { icon: MapPin, text: 'Trânsito e buracos', query: 'Quais os problemas de trânsito recentes?' },
  'saneamento': { icon: MapPin, text: 'Saneamento básico', query: 'Como está o saneamento no bairro?' },
  'iluminacao': { icon: MapPin, text: 'Iluminação pública', query: 'Tem problema de iluminação pública no bairro?' },
  'convivencia': { icon: Store, text: 'Comunidade', query: 'O que está acontecendo na comunidade?' },
  'animais': { icon: MapPin, text: 'Animais no bairro', query: 'Tem relatos sobre animais no bairro?' },
  'eventos': { icon: TrendingUp, text: 'Eventos locais', query: 'Quais eventos estão acontecendo no bairro?' },
  'comercio': { icon: Store, text: 'Comércio local', query: 'Quais comércios estão sendo comentados?' },
  'transporte': { icon: MapPin, text: 'Transporte público', query: 'Como está o transporte público no bairro?' },
  'outros': { icon: TrendingUp, text: 'Outros relatos', query: 'Quais são os últimos relatos do bairro?' },
}


// Helper: converter mensagens do store para formato UIMessage do ai-sdk
function storedToUIMessages(msgs: ConversationMessage[]): any[] {
  return msgs.map(m => ({
    id: m.id,
    role: m.role,
    parts: [{ type: 'text', text: m.content }],
  }))
}

export default function Page() {
  const [input, setInput] = useState('')
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  // Carregar conversa do histórico (ANTES do useChat)
  const [initialMessages] = useState(() => {
    if (typeof window === 'undefined') return []
    // Migrar histórico antigo na primeira vez
    migrateOldHistory()
    const loadData = sessionStorage.getItem('load-conversation')
    if (loadData) {
      sessionStorage.removeItem('load-conversation')
      try {
        const conv: Conversation = JSON.parse(loadData)
        return storedToUIMessages(conv.messages)
      } catch { return [] }
    }
    return []
  })

  // Setar activeConversationId após mount se veio do histórico
  useEffect(() => {
    const loadData = sessionStorage.getItem('active-conversation-id')
    if (loadData) {
      sessionStorage.removeItem('active-conversation-id')
      setActiveConversationId(loadData)
    }
  }, [])

  // Feedback state - localStorage temporário até backend
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'positive' | 'negative' | null>>({})
  const [reportText, setReportText] = useState('')
  const [reportCategory, setReportCategory] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [reportImage, setReportImage] = useState<string | null>(null)
  const reportFileInputRef = useRef<HTMLInputElement>(null)
  const [trendingTopics, setTrendingTopics] = useState<Array<{ category: string, count: number }>>([])
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)

  const CATEGORY_LABELS: Record<string, string> = {
    'seguranca': '🚨 Seguranca',
    'emergencia': '🆘 Emergencia',
    'saude': '🏥 Saude Publica',
    'transito': '🚦 Transito',
    'saneamento': '💧 Saneamento',
    'iluminacao': '💡 Iluminacao',
    'convivencia': '🤝 Comunidade',
    'animais': '🐕 Animais',
    'eventos': '🎪 Eventos',
    'comercio': '🏬 Comercio',
    'transporte': '🚌 Transporte',
    'outros': '📍 Outros'
  }

  const REPORT_CATEGORIES = [
    { value: 'seguranca', label: '🚨 Seguranca', placeholder: 'Assaltos, violencia, areas perigosas...' },
    { value: 'emergencia', label: '🆘 Emergencia', placeholder: 'Acidentes, incendios, situacoes urgentes...' },
    { value: 'saude', label: '🏥 Saude Publica', placeholder: 'UBS, postos de saude, surtos...' },
    { value: 'transito', label: '🚦 Transito', placeholder: 'Buracos, semaforos, acidentes...' },
    { value: 'saneamento', label: '💧 Saneamento', placeholder: 'Agua, esgoto, coleta de lixo...' },
    { value: 'iluminacao', label: '💡 Iluminacao', placeholder: 'Postes queimados, falta de luz...' },
    { value: 'convivencia', label: '🤝 Comunidade', placeholder: 'Barulho, conflitos entre vizinhos...' },
    { value: 'animais', label: '🐕 Animais', placeholder: 'Cachorros soltos, maus-tratos...' },
    { value: 'eventos', label: '🎪 Eventos', placeholder: 'Festas, feiras, atividades locais...' },
    { value: 'comercio', label: '🏬 Comercio', placeholder: 'Novos negocios, reclamacoes...' },
    { value: 'transporte', label: '🚌 Transporte Publico', placeholder: 'Onibus, lotacao, atrasos...' },
    { value: 'outros', label: '📍 Outros', placeholder: 'Outras informacoes uteis do bairro...' },
  ]

  const getPopularityIndicator = (count: number): string => {
    if (count >= 11) return '•••'
    if (count >= 6) return '••'
    return '•'
  }

  const { messages, sendMessage, status } = useChat({
    initialMessages: initialMessages.length > 0 ? initialMessages : undefined,
    api: '/api/chat',
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Calculate trending topics from Supabase
  useEffect(() => {
    const calculateTrendingTopics = async () => {
      try {
        // Get reports from last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

        const { data: reports, error } = await supabase
          .from('anonymous_reports')
          .select('category')
          .eq('status', 'aprovado')
          .gte('created_at', sevenDaysAgo)

        if (error) {
          console.error('Error fetching reports:', error)
          setTrendingTopics([])
          return
        }

        // Group by category and count
        const categoryCount: Record<string, number> = {}
        reports?.forEach((report) => {
          if (report.category) {
            categoryCount[report.category] = (categoryCount[report.category] || 0) + 1
          }
        })

        // Get top reported categories (no minimum required)
        const trending = Object.entries(categoryCount)
          .map(([category, count]) => ({ category, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5) // Top 5 most reported

        setTrendingTopics(trending)
      } catch (error) {
        console.error('Error calculating trending topics:', error)
        setTrendingTopics([])
      }
    }

    calculateTrendingTopics()
    // Recalculate when modal closes (new report might have been added)
    const interval = setInterval(calculateTrendingTopics, 30000) // Every 30s
    return () => clearInterval(interval)
  }, [isReportModalOpen])

  // Check if first visit and show onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('jacupemba-onboarding-completed')
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true)
    }
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem('jacupemba-onboarding-completed', 'true')
    setShowOnboarding(false)
  }

  // Handler para cliques em sugestões
  const handleSuggestionClick = (query: string) => {
    sendMessage({ text: query })
  }

  // Handler para novo chat
  const handleNewChat = () => {
    setActiveConversationId(null)
    setCurrentSuggestions(INITIAL_SUGGESTIONS)
    setInput('')
    window.location.reload()
  }

  // Estado para sugestões contextuais
  const [currentSuggestions, setCurrentSuggestions] = useState(INITIAL_SUGGESTIONS)
  
  // Estado para chips personalizados baseados em histórico
  const [personalizedChips, setPersonalizedChips] = useState<{ text: string; query: string }[]>([])

  // Carregar chips personalizados do histórico
  useEffect(() => {
    const chips = generatePersonalizedChips()
    setPersonalizedChips(chips)
  }, [])


  // Salvar conversa como thread completa
  useEffect(() => {
    if (messages.length >= 2 && !isLoading) {
      const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0]

      if (lastUserMessage && lastAssistantMessage) {
        const userText = getMessageText(lastUserMessage.parts)
        const assistantText = getMessageText(lastAssistantMessage.parts)

        if (userText && assistantText) {
          // Gerar sugestões contextuais
          const conversationContext = messages.map(m => getMessageText(m.parts)).join(' ')
          const contextualSuggestions = generateContextualSuggestions(assistantText, userText, conversationContext)
          setCurrentSuggestions(contextualSuggestions)

          // Salvar thread no conversation store
          if (activeConversationId) {
            addMessageToConversation(activeConversationId, 'user', userText)
            addMessageToConversation(activeConversationId, 'assistant', assistantText)
          } else {
            const conv = createConversation(userText, assistantText)
            setActiveConversationId(conv.id)
          }

          // Backend fallback
          try {
            fetch(getApiUrl('/api/conversation-history'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_fingerprint: getUserFingerprint(),
                query: userText,
                response_summary: assistantText.substring(0, 500)
              })
            })
          } catch {}
        }
      }
    }
  }, [messages, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  
  const getMessageText = (parts: any[]): string => {
    if (!parts || !Array.isArray(parts)) return ''
    return parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('')
  }

  const handleMessageFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    // Toggle: se já tem esse feedback, remove; senão, adiciona
    const currentFeedback = messageFeedback[messageId]
    const newFeedback = currentFeedback === feedback ? null : feedback

    setMessageFeedback(prev => ({
      ...prev,
      [messageId]: newFeedback
    }))

    // Salvar feedback no backend via API
    try {
      await fetch(getApiUrl('/api/agent-feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          rating: newFeedback === 'positive' ? 5 : 1,
          user_fingerprint: getUserFingerprint()
        })
      })
    } catch (error) {
      logger.error('Error saving feedback:', error)
    }
  }

  const handleReportImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setReportImage(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveReportImage = () => {
    setReportImage(null)
    if (reportFileInputRef.current) {
      reportFileInputRef.current.value = ''
    }
  }

  const handleCloseReportModal = () => {
    if ((reportText.trim() || reportImage) && !reportSubmitted) {
      const confirmClose = window.confirm('Voce tem conteudo digitado. Deseja descartar e fechar?')
      if (!confirmClose) return
    }
    setIsReportModalOpen(false)
    setReportText('')
    setReportCategory('')
    setReportImage(null)
    setReportSubmitted(false)
    if (reportFileInputRef.current) {
      reportFileInputRef.current.value = ''
    }
  }

  const handleSubmitReport = async () => {
    // Validacoes
    if (!reportText.trim() || !reportCategory) {
      alert('Por favor, preencha todos os campos.')
      return
    }

    if (reportText.trim().length < 10) {
      alert('O relato deve ter pelo menos 10 caracteres.')
      return
    }

    if (reportText.trim().length > 500) {
      alert('O relato deve ter no maximo 500 caracteres.')
      return
    }

    try {
      // Salvar no Supabase
      const { error } = await supabase
        .from('anonymous_reports')
        .insert([{
          text: reportText.trim(),
          category: reportCategory
        }])

      if (error) {
        logger.error('Error submitting report:', error)
        alert('Erro ao enviar relato. Tente novamente.')
        return
      }

      setReportSubmitted(true)
      setTimeout(() => {
        setIsReportModalOpen(false)
        setReportText('')
        setReportCategory('')
        setReportSubmitted(false)
      }, 2000)
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('Erro ao enviar relato. Tente novamente.')
    }
  }

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-50 border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-zinc-900 transition-all duration-150 hover:bg-zinc-800 active:scale-[0.98]"
              title="Relatar algo do bairro"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Contribuir</span>
            </button>
            <Link
              href="/vitrine"
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-700 transition-all duration-150 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98] dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Vitrine</span>
            </Link>
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-700 transition-all duration-150 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98] dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                title="Iniciar nova conversa"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Novo Chat</span>
              </button>
            )}
            <Link
              href="/historico"
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-700 transition-all duration-150 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98] dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <History className="h-4 w-4" />
              <span>Historico</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4">
          {messages.length === 0 ? (
            /* Empty State */
            <div>
              {/* Hero Welcome Block - Altura reduzida para mostrar conteúdo abaixo */}
              <div className="flex min-h-[35vh] md:min-h-[40vh] lg:min-h-[40vh] items-center justify-center px-4">
                <div className="text-center animate-in fade-in-0 duration-700">
                  {/* Avatar - Larger */}
                  <div className="mb-6 mt-16 flex justify-center">
                    <img
                      src="/avatar.png"
                      alt="Jacupemba"
                      className="h-28 w-28 md:h-32 md:w-32 object-contain animate-in zoom-in-50 duration-500 animate-float"
                    />
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 md:text-4xl lg:text-5xl animate-in slide-in-from-bottom-4 duration-500 delay-200">
                    Olá! Sou o Jacupemba AI
                  </h1>

                  {/* Subtitle */}
                  <p className="mt-3 max-w-2xl mx-auto text-base text-zinc-600 dark:text-zinc-400 md:text-lg leading-relaxed animate-in slide-in-from-bottom-4 duration-500 delay-300">
                    Seu assistente irônico do bairro. Pergunte sobre relatos, comércios e serviços locais — ou simplesmente fofoque.
                  </p>
                </div>
              </div>

              {/* Content Below - Container Central com Espaçamento Padronizado */}
              <div className="w-full flex flex-col items-center pt-12 pb-16 px-4">
                {/* Container Central - Largura Máxima Consistente */}
                <div className="w-full max-w-3xl space-y-12">
                  
                  {/* Seção 1: Chips Personalizados (Histórico) */}
                  {personalizedChips.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          💡 Baseado em suas últimas conversas
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {personalizedChips.map((chip, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(chip.query)}
                            className="group flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-all hover:border-zinc-900 hover:bg-zinc-900 hover:text-white hover:shadow-md active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                          >
                            <Store className="h-4 w-4 transition-transform group-hover:scale-110" />
                            <span>{chip.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seção 3: Feed do Bairro - Componente Escuro */}
                  <div className="mt-16">
                    <Link
                      href="/relatos"
                      className="block group"
                    >
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 md:p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] dark:from-zinc-800 dark:to-zinc-900">
                        <div className="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-white/5 rounded-full -mr-16 -mt-16 md:-mr-20 md:-mt-20"></div>
                        <div className="relative z-10">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 md:p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                                  Feed do Bairro
                                </h3>
                                <p className="text-xs md:text-sm text-zinc-300">
                                  Últimos 7 dias de relatos
                                </p>
                              </div>
                            </div>
                            <ArrowUp className="h-4 w-4 md:h-5 md:w-5 text-white/80 rotate-45 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                          </div>
                          <p className="text-zinc-200 text-sm md:text-base leading-relaxed">
                            Veja todos os relatos da comunidade organizados por categoria. Filtre por período, comente e acompanhe o que está acontecendo no bairro em tempo real.
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* Seção 4: Trending Topics - Baseado em relatos reais */}
                  {trendingTopics.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-2 px-1">
                        <TrendingUp className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Trending no bairro
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {trendingTopics.map((topic) => {
                          const config = TRENDING_QUERIES[topic.category]
                          if (!config) return null
                          const Icon = config.icon
                          return (
                            <button
                              key={topic.category}
                              onClick={() => handleSuggestionClick(config.query)}
                              className="group flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-all duration-150 hover:border-zinc-300 hover:shadow-md active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                            >
                              <div className="rounded-lg bg-zinc-100 p-2 transition-colors group-hover:bg-zinc-200 dark:bg-zinc-800 dark:group-hover:bg-zinc-700">
                                <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                              </div>
                              <div className="flex-1">
                                <div className="mb-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                  {CATEGORY_LABELS[topic.category] || topic.category} {getPopularityIndicator(topic.count)}
                                </div>
                                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                  {config.text}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-6 py-6">
              {messages.map((message) => {
                const text = getMessageText(message.parts)
                const isUser = message.role === 'user'
                const images = message.parts?.filter((p: any) => p.type === 'data-image') || []

                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in-0 slide-in-from-bottom-2 duration-200`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-3 ${isUser
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                        }`}
                    >
                      {images.length > 0 && (
                        <div className="mb-2 space-y-2">
                          {images.map((img: any, idx: number) => (
                            <img
                              key={idx}
                              src={img.data || "/placeholder.svg"}
                              alt="Imagem enviada"
                              className="max-h-60 rounded-lg object-contain"
                            />
                          ))}
                        </div>
                      )}
                      {text && (
                        <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                          {text}
                        </div>
                      )}

                      {/* Feedback do agente - apenas para mensagens do assistente */}
                      {!isUser && text && (
                        <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                          <AgentFeedback messageId={message.id} />
                        </div>
                      )}

                      {/* Sugestões clicáveis - apenas para última mensagem do assistente */}
                      {!isUser && text && message.id === messages[messages.length - 1]?.id && (
                        <SuggestionChips 
                          suggestions={currentSuggestions} 
                          onSuggestionClick={handleSuggestionClick} 
                        />
                      )}
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        Pensando...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <form onSubmit={handleSubmit}>
            <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 transition-colors focus-within:border-zinc-300 focus-within:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-zinc-700">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte algo sobre o bairro..."
                disabled={isLoading}
                className="flex-1 resize-none bg-transparent py-3.5 pl-4 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="m-2 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white transition-all duration-150 hover:bg-zinc-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowUp className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
          <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-600">
            A IA pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>

      {/* Modal de Relato Anônimo */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-150">
            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Conte algo do bairro
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Seu relato e anonimo
                </p>
              </div>
              <button
                onClick={handleCloseReportModal}
                className="rounded-lg p-2 text-zinc-400 transition-all duration-150 hover:bg-zinc-100 hover:text-zinc-600 active:scale-95 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conteudo do Modal */}
            <div className="p-5">
              {reportSubmitted ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <svg className="h-6 w-6 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    Relato enviado
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                    Obrigado por compartilhar.
                  </p>
                </div>
              ) : (
                <>
                  {/* Dropdown de Categoria */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Categoria
                    </label>
                    <select
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 transition-colors focus:border-zinc-300 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-600"
                    >
                      <option value="">Selecione...</option>
                      {REPORT_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder={
                      reportCategory
                        ? REPORT_CATEGORIES.find(c => c.value === reportCategory)?.placeholder
                        : 'Selecione uma categoria acima...'
                    }
                    disabled={!reportCategory}
                    className="w-full min-h-[160px] rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 transition-colors focus:border-zinc-300 focus:bg-white focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
                  />

                  {/* Upload de Imagem no Relato */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                      Adicionar foto (opcional)
                    </label>
                    <input
                      ref={reportFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleReportImageSelect}
                      className="hidden"
                    />
                    {reportImage ? (
                      <div className="relative inline-block">
                        <img
                          src={reportImage || "/placeholder.svg"}
                          alt="Preview do relato"
                          className="h-32 rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveReportImage}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => reportFileInputRef.current?.click()}
                        disabled={!reportCategory}
                        className="flex items-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 transition-all hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-700"
                      >
                        <ImagePlus className="h-5 w-5" />
                        <span>Clique para adicionar uma foto</span>
                      </button>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                    Evite incluir dados pessoais no relato.
                  </p>

                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={handleCloseReportModal}
                      className="flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition-all duration-150 hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSubmitReport}
                      disabled={!reportText.trim() || !reportCategory}
                      className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Enviar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour onComplete={handleOnboardingComplete} />
      )}
    </div>
  )
}
