'use client'

import { useState, useEffect } from 'react'
import { MapPin, ArrowLeft, Trash2, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface HistoryItem {
  id: string
  question: string
  answer: string
  timestamp: Date
}

export default function HistoricoPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    const savedHistory = localStorage.getItem('chat-history')
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory)
      setHistory(parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })))
    }
  }, [])

  const clearHistory = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      localStorage.removeItem('chat-history')
      setHistory([])
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}m atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays}d atrás`
    
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="glass sticky top-0 z-40 border-b border-white/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="glass-button flex h-9 w-9 items-center justify-center rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5 text-zinc-300" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                Histórico
              </h1>
            </div>
          </div>
          
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="glass-button flex items-center gap-2 rounded-xl px-3 py-2 text-sm shadow-lg transition-all duration-300 hover:scale-105 hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
              <span className="hidden text-red-400 sm:inline">Limpar</span>
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {history.length === 0 ? (
            /* Empty State */
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <div className="glass-card mb-6 flex h-20 w-20 items-center justify-center rounded-3xl shadow-2xl">
                <MessageSquare className="h-10 w-10 text-zinc-400" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-white">
                Você ainda não fez nenhuma consulta
              </h2>
              <p className="mb-6 text-zinc-400">
                Suas conversas aparecerão aqui
              </p>
              <Link
                href="/"
                className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-105"
              >
                Fazer uma consulta
              </Link>
            </div>
          ) : (
            /* History List */
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="glass-card group rounded-2xl p-5 shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="mb-2 font-semibold text-white">
                        {item.question}
                      </h3>
                      <p className="text-sm leading-relaxed text-zinc-300">
                        {truncateText(item.answer, 150)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
