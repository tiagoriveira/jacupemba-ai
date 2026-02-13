'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getApiUrl } from '@/lib/api-config'
import { getUserFingerprint } from '@/lib/fingerprint'
import { logger } from '@/lib/logger'

interface AgentFeedbackProps {
  messageId: string
  onFeedbackSubmitted?: () => void
}

export function AgentFeedback({ messageId, onFeedbackSubmitted }: AgentFeedbackProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFeedback = async (type: 'positive' | 'negative') => {
    if (isSubmitting || feedback) return

    try {
      setIsSubmitting(true)
      setFeedback(type)
      const userFingerprint = getUserFingerprint()

      const response = await fetch(getApiUrl('/api/agent-feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          rating: type === 'positive' ? 5 : 1,
          user_fingerprint: userFingerprint
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar feedback')
      }

      toast.success('Obrigado pelo feedback!', {
        duration: 2000
      })

      onFeedbackSubmitted?.()
    } catch (error) {
      logger.error('Error submitting feedback:', error)
      setFeedback(null)
      toast.error('Erro ao enviar feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (feedback) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {feedback === 'positive' ? (
          <>
            <ThumbsUp className="h-3.5 w-3.5 fill-green-500 text-green-500" />
            <span>Obrigado pelo feedback!</span>
          </>
        ) : (
          <>
            <ThumbsDown className="h-3.5 w-3.5 fill-red-500 text-red-500" />
            <span>Vamos melhorar!</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-zinc-500">Essa resposta foi útil?</span>
      <button
        onClick={() => handleFeedback('positive')}
        disabled={isSubmitting}
        className="rounded p-1 hover:bg-zinc-800 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        title="Resposta útil"
      >
        {isSubmitting && feedback === 'positive' ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        ) : (
          <ThumbsUp className="h-4 w-4 text-zinc-600 hover:text-green-600 transition-colors" />
        )}
      </button>
      <button
        onClick={() => handleFeedback('negative')}
        disabled={isSubmitting}
        className="rounded p-1 hover:bg-zinc-800 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        title="Resposta não útil"
      >
        {isSubmitting && feedback === 'negative' ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        ) : (
          <ThumbsDown className="h-4 w-4 text-zinc-600 hover:text-red-600 transition-colors" />
        )}
      </button>
    </div>
  )
}
