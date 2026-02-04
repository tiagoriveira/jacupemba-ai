'use client'

import { MessageSquare, BadgeCheck } from 'lucide-react'

interface BusinessCardProps {
  businessId: string
  name: string
  whatsapp?: string
  phone?: string
  isVerified?: boolean
}

export function BusinessCard({
  businessId,
  name,
  whatsapp,
  phone,
  isVerified,
}: BusinessCardProps) {
  const handleWhatsApp = () => {
    const number = (whatsapp || phone || '').replace(/\D/g, '')
    if (!number) return

    const message = encodeURIComponent(
      `Olá! Vi sua empresa "${name}" através do Jacupemba AI e gostaria de mais informações.`
    )
    const url = `https://wa.me/55${number}?text=${message}`
    window.open(url, '_blank')
  }

  if (!whatsapp && !phone) return null

  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {name}
          </span>
          {isVerified && (
            <BadgeCheck className="h-4 w-4 text-blue-500" title="Negócio verificado" />
          )}
        </div>
      </div>
      <button
        onClick={handleWhatsApp}
        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
      >
        <MessageSquare className="h-4 w-4" />
        WhatsApp
      </button>
    </div>
  )
}
