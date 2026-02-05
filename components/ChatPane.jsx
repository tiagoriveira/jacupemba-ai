"use client"

import { useState, forwardRef, useImperativeHandle, useRef } from "react"
import { Pencil, RefreshCw, Check, X, Square } from "lucide-react"
import Message from "./Message"
import Composer from "./Composer"
import { cls, timeAgo } from "./utils"

function ThinkingMessage({ onPause }) {
  return (
    <Message role="assistant">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
        </div>
        <span className="text-sm text-zinc-500">AI is thinking...</span>
        <button
          onClick={onPause}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <Square className="h-3 w-3" /> Pause
        </button>
      </div>
    </Message>
  )
}

const ChatPane = forwardRef(function ChatPane(
  { conversation, onSend, onEditMessage, onResendMessage, isThinking, onPauseThinking },
  ref,
) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const composerRef = useRef(null)

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        composerRef.current?.insertTemplate(templateContent)
      },
    }),
    [],
  )

  if (!conversation) return null

  const tags = ["Certified", "Personalized", "Experienced", "Helpful"]
  const messages = Array.isArray(conversation.messages) ? conversation.messages : []
  const count = messages.length || conversation.messageCount || 0

  // Assuntos do Momento - Tópicos em alta mockados
  const trendingTopics = [
    { id: 1, topic: "Falta de luz na região", summary: "Muitos vizinhos relataram queda de energia na região do Jacupemba nas últimas 6 horas, principalmente nas ruas próximas à Praça. A concessionária foi notificada e estima reparo até às 18h." },
    { id: 2, topic: "Movimentação na Praça", summary: "Há uma feira de artesanato acontecendo na Praça do Jacupemba neste fim de semana, com vendedores locais oferecendo produtos artesanais, comidas típicas e apresentações musicais ao vivo." },
    { id: 3, topic: "Coleta de lixo atrasada", summary: "A coleta de lixo está com atraso de 2 dias em algumas ruas do bairro. A prefeitura informou que houve problema com o caminhão e a coleta será normalizada a partir de amanhã." }
  ]

  async function handleTrendingTopicClick(topic) {
    if (!onSend) return
    const message = `Me conte mais sobre: ${topic.topic}`
    await onSend(message)
  }

  function startEdit(m) {
    setEditingId(m.id)
    setDraft(m.content)
  }
  function cancelEdit() {
    setEditingId(null)
    setDraft("")
  }
  function saveEdit() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    cancelEdit()
  }
  function saveAndResend() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    onResendMessage?.(editingId)
    cancelEdit()
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mb-2 text-3xl font-serif tracking-tight sm:text-4xl md:text-5xl">
          <span className="block leading-[1.05] font-sans text-2xl">{conversation.title}</span>
        </div>
        <div className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Updated {timeAgo(conversation.updatedAt)} · {count} messages
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-200"
            >
              {t}
            </span>
          ))}
        </div>

        {messages.length === 0 ? (
          <div className="space-y-4">
            {/* Saudação */}
            <div className="mb-2">
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Olá!</p>
              <p className="text-base text-zinc-600 dark:text-zinc-400 mt-1">Como posso ajudar você hoje?</p>
            </div>
            
            {/* Assuntos do Momento */}
            <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5 dark:border-zinc-800 dark:from-orange-950/30 dark:to-amber-950/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📈</span>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Assuntos do Momento</span>
              </div>
              <div className="flex flex-col gap-2">
                {trendingTopics.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTrendingTopicClick(item)}
                    className="group flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-left text-sm font-medium text-zinc-700 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] dark:bg-zinc-900 dark:text-zinc-200"
                  >
                    <span className="text-base transition-transform group-hover:scale-110">🔥</span>
                    <span className="flex-1">{item.topic}</span>
                    <svg className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Sugestão */}
            <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Ou digite sua pergunta abaixo para começar uma conversa...
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div key={m.id} className="space-y-2">
                {editingId === m.id ? (
                  <div className={cls("rounded-2xl border p-2", "border-zinc-200 dark:border-zinc-800")}>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="w-full resize-y rounded-xl bg-transparent p-2 text-sm outline-none"
                      rows={3}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={saveEdit}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-zinc-900"
                      >
                        <Check className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={saveAndResend}
                        className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Save & Resend
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <Message role={m.role}>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    {m.role === "user" && (
                      <div className="mt-1 flex gap-2 text-[11px] text-zinc-500">
                        <button className="inline-flex items-center gap-1 hover:underline" onClick={() => startEdit(m)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-1 hover:underline"
                          onClick={() => onResendMessage?.(m.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Resend
                        </button>
                      </div>
                    )}
                  </Message>
                )}
              </div>
            ))}
            {isThinking && <ThinkingMessage onPause={onPauseThinking} />}
          </>
        )}
      </div>

      <Composer
        ref={composerRef}
        onSend={async (text) => {
          if (!text.trim()) return
          setBusy(true)
          await onSend?.(text)
          setBusy(false)
        }}
        busy={busy}
      />
    </div>
  )
})

export default ChatPane
