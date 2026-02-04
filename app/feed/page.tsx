'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Calendar, Tag, Sparkles, Store, BadgeCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface FeedItem {
  id: string
  type: 'business' | 'promotion' | 'event'
  title: string
  description: string
  businessName: string
  date?: string
  location?: string
  discountText?: string
  isVerified?: boolean
  isFeatured?: boolean
  whatsapp?: string
  phone?: string
}

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeed()
  }, [])

  async function loadFeed() {
    const supabase = createClient()
    
    try {
      const items: FeedItem[] = []

      // Get featured business first
      const { data: featuredBusiness } = await supabase
        .from('businesses')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .gte('featured_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (featuredBusiness) {
        items.push({
          id: featuredBusiness.id,
          type: 'business',
          title: featuredBusiness.trade_name || featuredBusiness.business_name,
          description: featuredBusiness.description || 'Negócio local',
          businessName: featuredBusiness.business_name,
          isVerified: featuredBusiness.is_verified,
          isFeatured: true,
          whatsapp: featuredBusiness.whatsapp,
          phone: featuredBusiness.phone,
        })
      }

      // Get new businesses (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: newBusinesses } = await supabase
        .from('businesses')
        .select('*')
        .eq('is_active', true)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

      newBusinesses?.forEach((business) => {
        if (business.is_featured) return // Skip featured, already added
        items.push({
          id: business.id,
          type: 'business',
          title: business.trade_name || business.business_name,
          description: business.description || 'Novo negócio no bairro',
          businessName: business.business_name,
          date: business.created_at,
          isVerified: business.is_verified,
          whatsapp: business.whatsapp,
          phone: business.phone,
        })
      })

      // Get active promotions
      const { data: promotions } = await supabase
        .from('promotions')
        .select('*, businesses(*)')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(20)

      promotions?.forEach((promo: any) => {
        items.push({
          id: promo.id,
          type: 'promotion',
          title: promo.title,
          description: promo.description,
          businessName: promo.businesses.business_name,
          discountText: promo.discount_text,
          date: promo.start_date,
          isVerified: promo.businesses.is_verified,
          whatsapp: promo.businesses.whatsapp,
          phone: promo.businesses.phone,
        })
      })

      // Get upcoming events
      const { data: events } = await supabase
        .from('events')
        .select('*, businesses(*)')
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .limit(20)

      events?.forEach((event: any) => {
        items.push({
          id: event.id,
          type: 'event',
          title: event.name,
          description: event.description || '',
          businessName: event.businesses.business_name,
          date: event.event_date,
          location: event.location,
          isVerified: event.businesses.is_verified,
          whatsapp: event.businesses.whatsapp,
          phone: event.businesses.phone,
        })
      })

      // Sort by most recent
      items.sort((a, b) => {
        // Featured always first
        if (a.isFeatured && !b.isFeatured) return -1
        if (!a.isFeatured && b.isFeatured) return 1
        
        const dateA = a.date ? new Date(a.date).getTime() : 0
        const dateB = b.date ? new Date(b.date).getTime() : 0
        return dateB - dateA
      })

      setFeedItems(items)
    } catch (error) {
      console.error('Error loading feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = (item: FeedItem) => {
    const number = (item.whatsapp || item.phone || '').replace(/\D/g, '')
    if (!number) return

    const message = encodeURIComponent(
      `Olá! Vi "${item.title}" no Jacupemba AI e gostaria de mais informações.`
    )
    const url = `https://wa.me/55${number}?text=${message}`
    window.open(url, '_blank')
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'promotion': return Tag
      case 'event': return Calendar
      default: return Store
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'promotion': return 'Promoção'
      case 'event': return 'Evento'
      default: return 'Novo Negócio'
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  Feed Local
                </h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Novidades, promoções e eventos do bairro
                </p>
              </div>
            </div>
            <MapPin className="h-6 w-6 text-zinc-400" />
          </div>
        </div>
      </header>

      {/* Feed Content */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-zinc-500">Carregando...</div>
          </div>
        ) : feedItems.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <Store className="mx-auto mb-3 h-12 w-12 text-zinc-400" />
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Nenhum item no feed
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Aguarde novidades de negócios, promoções e eventos locais
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedItems.map((item) => {
              const Icon = getIcon(item.type)
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`rounded-lg border bg-white p-5 transition-shadow hover:shadow-md dark:bg-zinc-900 ${
                    item.isFeatured
                      ? 'border-amber-400 shadow-lg dark:border-amber-600'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {item.isFeatured && (
                    <div className="mb-3 flex items-center gap-2 text-amber-600 dark:text-amber-500">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-semibold">DESTAQUE</span>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
                      <Icon className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {getTypeLabel(item.type)}
                        </span>
                        {item.discountText && (
                          <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            {item.discountText}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {item.title}
                      </h3>
                      
                      <div className="mt-1 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <span>{item.businessName}</span>
                        {item.isVerified && (
                          <BadgeCheck className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      
                      {item.description && (
                        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                          {item.description}
                        </p>
                      )}
                      
                      {item.location && (
                        <div className="mt-2 flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                          <MapPin className="h-4 w-4" />
                          <span>{item.location}</span>
                        </div>
                      )}
                      
                      {item.date && (
                        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      
                      {(item.whatsapp || item.phone) && (
                        <button
                          onClick={() => handleWhatsApp(item)}
                          className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                        >
                          Enviar WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
