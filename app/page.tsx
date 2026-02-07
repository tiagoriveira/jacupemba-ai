'use client'

import React from "react"

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Loader2, Briefcase, Calendar, Store, ImagePlus, X, History, ShoppingBag, MessageSquare, ArrowUp, Shield } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const SUGGESTED_QUESTIONS = [
  {
    icon: Store,
    text: 'Preciso de um eletricista urgente',
    category: 'Serviços'
  },
  {
    icon: ImagePlus,
    text: 'Envie uma foto do produto ou serviço que precisa',
    category: 'Upload de Foto'
  },
  {
    icon: Store,
    text: 'Onde compro tinta spray no bairro?',
    category: 'Comércio'
  },
  {
    icon: Briefcase,
    text: 'Tem vaga de emprego na área administrativa?',
    category: 'Vagas'
  },
  {
    icon: Calendar,
    text: 'Que eventos têm esse fim de semana?',
    category: 'Eventos'
  },
  {
    icon: Store,
    text: 'Preciso de um mecânico de confiança',
    category: 'Serviços'
  },
]

export default function Page() {
  const [input, setInput] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportText, setReportText] = useState('')
  const [reportCategory, setReportCategory] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [trendingTopics, setTrendingTopics] = useState<Array<{category: string, count: number}>>([])

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
    transport: new DefaultChatTransport({ api: '/api/chat' }),
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
          console.error('[v0] Error fetching reports:', error)
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
        console.error('[v0] Error calculating trending topics:', error)
        setTrendingTopics([])
      }
    }

    calculateTrendingTopics()
    // Recalculate when modal closes (new report might have been added)
    const interval = setInterval(calculateTrendingTopics, 30000) // Every 30s
    return () => clearInterval(interval)
  }, [isReportModalOpen])

  // Save to history when conversation is complete
  useEffect(() => {
    if (messages.length >= 2 && !isLoading) {
      const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0]
      
      if (lastUserMessage && lastAssistantMessage) {
        const userText = getMessageText(lastUserMessage.parts)
        const assistantText = getMessageText(lastAssistantMessage.parts)
        
        if (userText && assistantText) {
          const historyItem = {
            id: Date.now().toString(),
            question: userText,
            answer: assistantText,
            timestamp: new Date().toISOString()
          }
          
          const savedHistory = localStorage.getItem('chat-history')
          const history = savedHistory ? JSON.parse(savedHistory) : []
          
          // Check if this item already exists (avoid duplicates)
          const exists = history.some((item: any) => 
            item.question === userText && item.answer === assistantText
          )
          
          if (!exists) {
            history.unshift(historyItem)
            // Keep only last 50 items
            if (history.length > 50) history.pop()
            localStorage.setItem('chat-history', JSON.stringify(history))
          }
        }
      }
    }
  }, [messages, isLoading])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setSelectedImage(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !selectedImage) || isLoading) return
    
    const messageContent = []
    
    if (input.trim()) {
      messageContent.push({ type: 'text' as const, text: input })
    }
    
    if (selectedImage) {
      messageContent.push({
        type: 'image' as const,
        image: selectedImage,
      })
    }
    
    sendMessage({ parts: messageContent })
    setInput('')
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSuggestionClick = (question: string) => {
    if (isLoading) return
    if (question.includes('foto')) {
      fileInputRef.current?.click()
      return
    }
    sendMessage({ text: question })
  }

  const getMessageText = (parts: any[]): string => {
    if (!parts || !Array.isArray(parts)) return ''
    return parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('')
  }

  const handleCloseReportModal = () => {
    if (reportText.trim() && !reportSubmitted) {
      const confirmClose = window.confirm('Voce tem texto digitado. Deseja descartar e fechar?')
      if (!confirmClose) return
    }
    setIsReportModalOpen(false)
    setReportText('')
    setReportCategory('')
    setReportSubmitted(false)
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
        console.error('[v0] Error submitting report:', error)
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
      console.error('[v0] Error submitting report:', error)
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
            <Link 
              href="/historico"
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-700 transition-all duration-150 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98] dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <History className="h-4 w-4" />
              <span>Historico</span>
            </Link>
            <Link 
              href="/admin"
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 border border-red-300 transition-all duration-150 hover:bg-red-50 active:scale-[0.98]"
              title="Painel administrativo"
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="flex min-h-[calc(100vh-180px)] flex-col items-center justify-center py-16">
              <div className="mb-16 text-center">
                <h2 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-white">
                  Olá! Sou seu assistente local
                </h2>
                <p className="text-base text-zinc-600 dark:text-zinc-400">
                  Como posso ajudar?
                </p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  Pergunte sobre serviços, comercios, vagas ou eventos do bairro
                </p>
              </div>

              {/* Feed do Bairro - Card de Acesso */}
              <div className="w-full max-w-3xl mb-10">
                <Link 
                  href="/relatos"
                  className="block group"
                >
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-700 p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <MessageSquare className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white mb-1">Feed do Bairro</h3>
                            <p className="text-sm text-zinc-300">Ultimos 7 dias de relatos</p>
                          </div>
                        </div>
                        <ArrowUp className="h-5 w-5 text-white rotate-45 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </div>
                      <p className="text-zinc-200 text-sm leading-relaxed">
                        Veja todos os relatos da comunidade organizados por categoria. Filtre por periodo, comente e acompanhe o que esta acontecendo no bairro em tempo real.
                      </p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Suggestion Cards */}
              <div className="grid w-full max-w-3xl grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((suggestion, index) => {
                  const Icon = suggestion.icon
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="group flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-white p-3 text-left transition-all duration-150 hover:border-zinc-300 hover:shadow-sm active:scale-[0.99]"
                    >
                      <div className="rounded-lg bg-zinc-100 p-1.5 transition-colors group-hover:bg-zinc-200">
                        <Icon className="h-4 w-4 text-zinc-600" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-0.5 text-xs font-medium text-zinc-400">
                          {suggestion.category}
                        </div>
                        <div className="text-sm text-zinc-700">
                          {suggestion.text}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="space-y-6 py-6">
              {messages.map((message) => {
                const text = getMessageText(message.parts)
                const isUser = message.role === 'user'
                const images = message.parts?.filter((p: any) => p.type === 'image') || []

                return (
                  <div
                    key={message.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in-0 slide-in-from-bottom-2 duration-200`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-3 ${
                        isUser
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {images.length > 0 && (
                        <div className="mb-2 space-y-2">
                          {images.map((img: any, idx: number) => (
                            <img
                              key={idx}
                              src={img.image || "/placeholder.svg"}
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
          <form onSubmit={handleSubmit} className="relative space-y-3">
            {selectedImage && (
              <div className="relative inline-block">
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt="Preview"
                  className="h-24 rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            
            <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 transition-colors focus-within:border-zinc-300 focus-within:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:focus-within:border-zinc-700">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="m-2 ml-3 flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-all duration-150 hover:bg-zinc-200 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta ou envie uma foto..."
                disabled={isLoading}
                className="flex-1 resize-none bg-transparent py-3.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !selectedImage)}
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
    </div>
  )
}
