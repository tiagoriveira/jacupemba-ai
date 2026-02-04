'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface PromotionsListProps {
  promotions: any[]
  businessId: string
}

export function PromotionsList({ promotions, businessId }: PromotionsListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta promoção?')) return

    setDeletingId(id)
    const supabase = createClient()

    try {
      const { error } = await supabase.from('promotions').delete().eq('id', id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Error deleting promotion:', error)
      alert('Erro ao excluir promoção')
    } finally {
      setDeletingId(null)
    }
  }

  if (!promotions || promotions.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">
          Nenhuma promoção cadastrada ainda.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {promotions.map((promo) => {
        const isActive = promo.is_active &&
          new Date(promo.start_date) <= new Date() &&
          new Date(promo.end_date) >= new Date()

        return (
          <div
            key={promo.id}
            className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {promo.title}
                  </h3>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {isActive ? 'Ativa' : 'Inativa'}
                  </span>
                  {promo.discount_text && (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {promo.discount_text}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {promo.description}
                </p>
                <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
                  Válido de {new Date(promo.start_date).toLocaleDateString('pt-BR')} até{' '}
                  {new Date(promo.end_date).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(promo.id)}
                disabled={deletingId === promo.id}
              >
                {deletingId === promo.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Excluir'
                )}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
