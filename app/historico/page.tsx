'use client'

import { useState, useEffect } from 'react'
import { MapPin, ArrowLeft, Trash2, MessageSquare, Rss } from 'lucide-react'
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
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            </Link>
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-zinc-900 dark:text-white" />
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Histórico
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link 
              href="/feed"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Rss className="h-5 w-5" />
              <span className="hidden sm:inline">Feed</span>
            </Link>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {history.length === 0 ? (
            /* Empty State */
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <MessageSquare className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-white">
                Você ainda não fez nenhuma consulta
              </h2>
              <p className="mb-6 text-zinc-500 dark:text-zinc-400">
                Suas conversas aparecerão aqui
              </p>
              <Link
                href="/"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
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
                  className="group rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="mb-1 font-medium text-zinc-900 dark:text-white">
                        {item.question}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {truncateText(item.answer, 150)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">
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
