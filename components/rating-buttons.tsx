'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

interface RatingButtonsProps {
  messageId: string
}

export function RatingButtons({ messageId }: RatingButtonsProps) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRating = async (value: 'up' | 'down') => {
    if (isSubmitting || rating) return

    setIsSubmitting(true)
    setRating(value)

    try {
      await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          rating: value,
        }),
      })
    } catch (error) {
      console.error('Error submitting rating:', error)
      setRating(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-2 flex items-center gap-1">
      <button
        onClick={() => handleRating('up')}
        disabled={isSubmitting || rating !== null}
        className={`rounded-lg p-2 transition-all ${
          rating === 'up'
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            : rating === 'down'
            ? 'cursor-not-allowed opacity-30'
            : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
        }`}
        aria-label="Resposta útil"
      >
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleRating('down')}
        disabled={isSubmitting || rating !== null}
        className={`rounded-lg p-2 transition-all ${
          rating === 'down'
            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            : rating === 'up'
            ? 'cursor-not-allowed opacity-30'
            : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
        }`}
        aria-label="Resposta não útil"
      >
        <ThumbsDown className="h-4 w-4" />
      </button>
      {rating && (
        <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
          Obrigado pelo feedback!
        </span>
      )}
    </div>
  )
}
