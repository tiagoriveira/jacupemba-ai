'use client'

import React from 'react'
import { MapPin, Store, Tag, Calendar, MessageSquare, History } from 'lucide-react'
import Link from 'next/link'
import { BusinessCard } from '@/components/business-card'
import { mockBusinesses, mockPromotions, mockEvents } from '@/lib/mock-data'

export default function FeedPage() {
  // Find sponsored business
  const sponsoredBusiness = mockBusinesses.find(b => b.sponsored)
  const regularBusinesses = mockBusinesses.filter(b => !b.sponsored)

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-zinc-900 dark:text-white" />
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Assistente Local
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="hidden sm:inline">Chat</span>
            </Link>
            <Link 
              href="/historico"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <History className="h-5 w-5" />
              <span className="hidden sm:inline">Histórico</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              Feed Local
            </h2>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Novidades, promoções e eventos do bairro
            </p>
          </div>

          {/* Sponsored Business */}
          {sponsoredBusiness && (
            <section className="mb-8">
              <div className="mb-4 flex items-center gap-2">
                <Store className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Destaque
                </h3>
              </div>
              <BusinessCard business={sponsoredBusiness} isSponsored />
            </section>
          )}

          {/* Active Promotions */}
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Promoções Ativas
              </h3>
            </div>
            <div className="space-y-4">
              {mockPromotions.map((promo) => (
                <div
                  key={promo.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {promo.title}
                      </h4>
                      <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {promo.business.name}
                      </p>
                    </div>
                    <div className="rounded-lg bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Promoção
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {promo.description}
                  </p>
                  <div className="mb-3 text-xs text-zinc-500 dark:text-zinc-500">
                    Válido até{' '}
                    {new Date(promo.validUntil).toLocaleDateString('pt-BR')}
                  </div>
                  <a
                    href={`https://wa.me/55${promo.business.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Vim pelo Assistente Local e gostaria de mais informações sobre a promoção.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chamar no WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming Events */}
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Eventos Próximos
              </h3>
            </div>
            <div className="space-y-4">
              {mockEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">
                        {event.title}
                      </h4>
                      {event.organizer && (
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          por {event.organizer}
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Evento
                    </div>
                  </div>
                  <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {event.description}
                  </p>
                  <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <span>
                        {new Date(event.date).toLocaleDateString('pt-BR')} às {event.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-zinc-500" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* New Businesses */}
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Novos Negócios
              </h3>
            </div>
            <div className="space-y-4">
              {regularBusinesses.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
