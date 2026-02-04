'use client'

import React from "react"

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { MapPin, Send, Loader2, Briefcase, Calendar, Store, Clock, ImagePlus, X, History, ThumbsUp, ThumbsDown, Rss } from 'lucide-react'
import Link from 'next/link'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

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
    <div className="flex h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-zinc-900 dark:text-white" />
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Assistente Local
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/feed"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Rss className="h-5 w-5" />
              <span className="hidden sm:inline">Feed</span>
            </Link>
            <Link 
              href="/historico"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <History className="h-5 w-5" />
              <span className="hidden sm:inline">Histórico</span>
            </Link>
          </div>
        </div>
      </header>

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
                      className="group flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                    >
                      <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                        <Icon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                          {suggestion.category}
                        </div>
                        <div className="text-sm text-zinc-900 dark:text-zinc-100">
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
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        isUser
                          ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                          : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
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
                      <div className="mt-2 flex gap-1">
                        <button
                          onClick={() => handleRating(message.id, 'up')}
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-sm transition-colors ${
                            messageRatings[message.id] === 'up'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                          }`}
                          aria-label="Resposta útil"
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRating(message.id, 'down')}
                          className={`flex items-center gap-1 rounded-lg px-2 py-1 text-sm transition-colors ${
                            messageRatings[message.id] === 'down'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                          }`}
                          aria-label="Resposta não útil"
                        >
                          <ThumbsDown className="h-4 w-4" />
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
            
            <div className="flex items-end gap-2 rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
                className="m-2 ml-3 flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-all hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <ImagePlus className="h-5 w-5" />
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta ou envie uma foto..."
                disabled={isLoading}
                className="flex-1 resize-none bg-transparent py-4 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className="m-2 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </form>
          <p className="mt-2 text-center text-xs text-zinc-400 dark:text-zinc-600">
            A IA pode cometer erros. Verifique informações importantes.
          </p>
        </div>
      </div>
    </div>
  )
}
