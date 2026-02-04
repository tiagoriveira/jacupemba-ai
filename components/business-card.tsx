import { MapPin, Phone, Clock, BadgeCheck, MessageCircle } from 'lucide-react'

export interface Business {
  id: string
  name: string
  phone: string
  address: string
  hours?: string
  info?: string
  verified?: boolean
  sponsored?: boolean
  category?: string
}

interface BusinessCardProps {
  business: Business
  isSponsored?: boolean
}

export function BusinessCard({ business, isSponsored }: BusinessCardProps) {
  const whatsappMessage = encodeURIComponent('Olá! Vim pelo Assistente Local e gostaria de mais informações.')
  const whatsappLink = `https://wa.me/55${business.phone.replace(/\D/g, '')}?text=${whatsappMessage}`
  
  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      isSponsored 
        ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-white shadow-md dark:border-amber-700 dark:from-amber-950/20 dark:to-zinc-900'
        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
    }`}>
      {isSponsored && (
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
            Destaque
          </div>
        </div>
      )}
      
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {business.name}
            </h3>
            {business.verified && (
              <BadgeCheck className="h-5 w-5 text-blue-500" aria-label="Verificado" />
            )}
          </div>
          {business.category && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {business.category}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" />
          <span>{business.phone}</span>
        </div>
        
        <div className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" />
          <span>{business.address}</span>
        </div>
        
        {business.hours && (
          <div className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-500" />
            <span>{business.hours}</span>
          </div>
        )}
        
        {business.info && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {business.info}
          </p>
        )}
      </div>

      <div className="mt-4">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          <MessageCircle className="h-4 w-4" />
          Chamar no WhatsApp
        </a>
      </div>
    </div>
  )
}
