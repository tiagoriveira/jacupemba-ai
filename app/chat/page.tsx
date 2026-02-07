'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Send, Loader2, MessageSquare, Sparkles, Bot, User } from 'lucide-react'

export default function ChatPage() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent' })
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    sendMessage({ text: input })
    setInput('')
  }

  const getMessageText = (message: any): string => {
    if (!message.parts || !Array.isArray(message.parts)) return ''
    return message.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('')
  }

  const suggestedPrompts = [
    "O que está acontecendo no bairro?",
    "Algum problema de segurança recente?",
    "Quais restaurantes tem por aqui?",
    "Mostre estatísticas da semana"
  ]

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-900">Jacupemba AI</h1>
            <p className="text-sm text-zinc-500">Seu assistente do bairro</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100">
                <MessageSquare className="h-10 w-10 text-violet-600" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-zinc-900">Olá! 👋</h2>
                <p className="text-zinc-600 max-w-md">
                  Sou o Jacupemba AI, seu assistente local. Pergunte sobre relatos, comércios ou o que está rolando no bairro!
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(prompt)
                      setTimeout(() => {
                        const form = document.querySelector('form')
                        form?.requestSubmit()
                      }, 100)
                    }}
                    className="text-left px-4 py-3 rounded-xl border-2 border-zinc-200 bg-white hover:border-violet-300 hover:bg-violet-50 transition-all duration-200 text-sm text-zinc-700 hover:text-violet-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, idx) => {
                const text = getMessageText(message)
                const isUser = message.role === 'user'

                return (
                  <div
                    key={idx}
                    className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                      isUser 
                        ? 'bg-zinc-900 text-white' 
                        : 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white'
                    }`}>
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`flex-1 max-w-2xl ${isUser ? 'flex justify-end' : ''}`}>
                      <div className={`rounded-2xl px-5 py-3 ${
                        isUser 
                          ? 'bg-zinc-900 text-white' 
                          : 'bg-white border border-zinc-200 text-zinc-800'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1 max-w-2xl">
                    <div className="rounded-2xl px-5 py-3 bg-white border border-zinc-200">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Pensando...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte algo sobre o bairro..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-violet-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
          <p className="text-xs text-zinc-400 text-center mt-3">
            Jacupemba AI pode cometer erros. Sempre verifique informações importantes.
          </p>
        </div>
      </div>
    </div>
  )
}
