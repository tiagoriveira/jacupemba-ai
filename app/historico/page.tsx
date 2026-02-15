'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Trash2, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  listConversations,
  deleteConversation as deleteConv,
  clearAllConversations,
  migrateOldHistory,
  type Conversation,
} from '@/lib/conversation-store'

export default function HistoricoPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const router = useRouter()

  useEffect(() => {
    migrateOldHistory()
    setConversations(listConversations())
  }, [])

  const clearHistory = () => {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
      clearAllConversations()
      setConversations([])
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Deseja apagar esta conversa?')) {
      deleteConv(id)
      setConversations(listConversations())
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
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

  const openConversation = (conv: Conversation) => {
    sessionStorage.setItem('load-conversation', JSON.stringify(conv))
    sessionStorage.setItem('active-conversation-id', conv.id)
    router.push('/')
  }

  const getLastAssistantMessage = (conv: Conversation): string => {
    const lastMsg = [...conv.messages].reverse().find(m => m.role === 'assistant')
    if (!lastMsg) return ''
    return lastMsg.content.length > 120
      ? lastMsg.content.substring(0, 120) + '...'
      : lastMsg.content
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
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Histórico
            </h1>
          </div>

          {conversations.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
            >
              <Trash2 className="h-4 w-4" />
              Limpar tudo
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {conversations.length === 0 ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <MessageSquare className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
              </div>
              <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-white">
                Nenhuma conversa ainda
              </h2>
              <p className="mb-6 text-zinc-500 dark:text-zinc-400">
                Suas conversas com o Jacupemba AI aparecerão aqui
              </p>
              <Link
                href="/"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Iniciar conversa
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className="group rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-md cursor-pointer dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1 font-medium text-zinc-900 dark:text-white truncate">
                        {conv.title}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {getLastAssistantMessage(conv)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(conv.id)
                      }}
                      className="shrink-0 rounded p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                      title="Apagar conversa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">
                        {formatDate(conv.updated_at)}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-600">
                        {conv.messages.length} msgs
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 transition-colors">
                      Abrir conversa →
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
