'use client'

import React from "react"

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { MapPin, Send, Loader2, Briefcase, Calendar, Store, Clock, ImagePlus, X, History, ThumbsUp, ThumbsDown } from 'lucide-react'
import Link from 'next/link'
import { VitrineBairro } from '@/components/vitrine-bairro'
import { SHOWCASE_POSTS } from '@/lib/showcase-data'

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
  const [messageRatings, setMessageRatings] = useState<Record<string, 'up' | 'down' | null>>({})
  const [vitrineOpen, setVitrineOpen] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Tutorial and new posts counter
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('vitrine-tutorial-seen')
    if (!hasSeenTutorial) {
      setShowTutorial(true)
      setTimeout(() => {
        setShowTutorial(false)
        localStorage.setItem('vitrine-tutorial-seen', 'true')
      }, 3000)
    }

    // Count new posts (not viewed)
    const viewedPosts = localStorage.getItem('viewed-showcase-posts')
    const viewed = viewedPosts ? new Set(JSON.parse(viewedPosts)) : new Set()
    
    const recentPosts = SHOWCASE_POSTS.filter(post => {
      const hoursDiff = (Date.now() - post.postedAt.getTime()) / (1000 * 60 * 60)
      return hoursDiff <= 48
    })
    
    const newCount = recentPosts.filter(post => !viewed.has(post.id)).length
    setNewPostsCount(newCount)

    // Clear new posts badge when vitrine is visited
    if (vitrineOpen && newCount > 0) {
      const timer = setTimeout(() => setNewPostsCount(0), 1000)
      return () => clearTimeout(timer)
    }
  }, [vitrineOpen])

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

  const handleRating = (messageId: string, rating: 'up' | 'down') => {
    setMessageRatings(prev => ({
      ...prev,
      [messageId]: prev[messageId] === rating ? null : rating
    }))
    
    // Save rating to localStorage for analytics
    const ratings = localStorage.getItem('message-ratings')
    const allRatings = ratings ? JSON.parse(ratings) : []
    allRatings.push({
      messageId,
      rating,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('message-ratings', JSON.stringify(allRatings))
  }

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      // Swipe left (open vitrine)
      setVitrineOpen(true)
    }
    touchStartX.current = 0
    touchEndX.current = 0
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

  return (
    <div 
      className="relative flex h-screen flex-col bg-white dark:bg-zinc-950"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Assistente Local
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVitrineOpen(true)}
              className="glass-button relative flex h-9 w-9 items-center justify-center rounded-xl text-lg shadow-lg transition-all duration-300 hover:scale-105"
            >
              <span>🏪</span>
              {newPostsCount > 0 && (
                <span className="glow-green absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-[10px] font-bold text-white animate-pulse">
                  {newPostsCount}
                </span>
              )}
            </button>
            <Link 
              href="/historico"
              className="glass-button flex h-9 items-center gap-2 rounded-xl px-3 shadow-lg transition-all duration-300 hover:scale-105"
            >
              <History className="h-4 w-4 text-zinc-300" />
              <span className="hidden text-sm text-zinc-300 sm:inline">Histórico</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Tutorial Hint */}
      {showTutorial && (
        <div className="pointer-events-none fixed right-4 top-20 z-50 animate-fade-in-right">
          <div className="glass-card flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl">
            <div className="flex flex-col items-end gap-1">
              <p className="text-pretty text-right text-sm font-medium text-white">
                Deslize para ver ofertas
              </p>
              <p className="text-xs text-zinc-400">🏪 Vitrine do Bairro</p>
            </div>
            <div className="text-2xl animate-bounce-x">👈</div>
          </div>
        </div>
      )}

      {/* Green Border Hint */}
      {newPostsCount > 0 && !vitrineOpen && (
        <div className="glow-green pointer-events-none fixed right-0 top-0 z-20 h-full w-1 bg-gradient-to-b from-transparent via-green-400 to-transparent opacity-60 animate-pulse" />
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4">
          {messages.length === 0 ? (
            /* Welcome Screen */
            <div className="flex min-h-[calc(100vh-180px)] flex-col items-center justify-center py-8">
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-3xl font-semibold text-zinc-900 dark:text-white">
                  Olá! Como posso ajudar?
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Pergunte sobre serviços, comércios, vagas ou eventos do bairro
                </p>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
                  💡 Você também pode enviar uma foto e eu recomendo quem faz ou vende o que aparece na imagem
                </p>
              </div>

              {/* Suggestion Cards */}
              <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((suggestion, index) => {
                  const Icon = suggestion.icon
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="glass-card group flex items-start gap-3 rounded-2xl p-4 text-left shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 ring-1 ring-green-500/20">
                        <Icon className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 text-xs font-medium text-zinc-400">
                          {suggestion.category}
                        </div>
                        <div className="text-sm text-zinc-100">
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
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 ${
                        isUser
                          ? 'glass-card bg-gradient-to-br from-green-500/90 to-emerald-600/90 text-white'
                          : 'glass-card text-zinc-100'
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
                    
                    {!isUser && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleRating(message.id, 'up')}
                          className={`glass-button flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm shadow-md transition-all duration-300 hover:scale-105 ${
                            messageRatings[message.id] === 'up'
                              ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
                              : 'text-zinc-400 hover:text-green-400'
                          }`}
                          aria-label="Resposta útil"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleRating(message.id, 'down')}
                          className={`glass-button flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm shadow-md transition-all duration-300 hover:scale-105 ${
                            messageRatings[message.id] === 'down'
                              ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                              : 'text-zinc-400 hover:text-red-400'
                          }`}
                          aria-label="Resposta não útil"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
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
      <div className="glass border-t border-white/10">
        <div className="mx-auto max-w-4xl px-5 py-5">
          <form onSubmit={handleSubmit} className="relative space-y-3">
            {selectedImage && (
              <div className="relative inline-block">
                <img
                  src={selectedImage || "/placeholder.svg"}
                  alt="Preview"
                  className="glass-card h-24 rounded-xl object-cover shadow-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg transition-all duration-300 hover:scale-110"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            
            <div className="glass-input flex items-end gap-2 rounded-3xl shadow-xl">
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
                className="m-2 ml-3 flex h-11 w-11 items-center justify-center rounded-2xl text-zinc-400 transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:text-green-400 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta ou envie uma foto..."
                disabled={isLoading}
                className="flex-1 resize-none bg-transparent py-4 text-[15px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className="m-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-green-500/30 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
          <p className="mt-3 text-center text-xs text-zinc-500">
            A IA pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>

      {/* Vitrine do Bairro */}
      <VitrineBairro isOpen={vitrineOpen} onClose={() => setVitrineOpen(false)} />
    </div>
  )
}
