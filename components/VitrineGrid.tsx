'use client'

import { useState, useEffect } from 'react'
import { X, MessageCircle, ArrowLeft, Loader2, Clock, Share2, Tag, Wrench, ShoppingBag, User } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface VitrinePost {
  id: string
  contact_name: string
  contact_phone: string
  title: string
  description: string
  price: number
  category: string
  image_url: string
  expires_at: string
  created_at: string
}

const CATEGORY_STYLES: Record<string, { bg: string; icon: typeof Tag }> = {
  produto: { bg: 'from-zinc-800 to-zinc-600', icon: ShoppingBag },
  servico: { bg: 'from-zinc-700 to-zinc-500', icon: Wrench },
}

function getHoursRemaining(expiresAt: string) {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
}

function formatPrice(price: number | null) {
  if (!price || price === 0) return 'A combinar'
  return `R$ ${Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export function VitrineGrid() {
  const [posts, setPosts] = useState<VitrinePost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<VitrinePost | null>(null)
  const [filter, setFilter] = useState<'todos' | 'produto' | 'servico'>('todos')

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('vitrine_posts')
          .select('*')
          .eq('status', 'aprovado')
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching vitrine posts:', error)
          return
        }
        setPosts(data || [])
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const filteredPosts = filter === 'todos' ? posts : posts.filter(p => p.category === filter)

  function handleWhatsAppClick(post: VitrinePost, e?: React.MouseEvent) {
    e?.stopPropagation()
    const phone = (post.contact_phone || '').replace(/\D/g, '')
    const message = encodeURIComponent(`Ola, vi seu anuncio "${post.title}" no Assistente Local e tenho interesse!`)
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank')
  }

  function handleShare(post: VitrinePost, e?: React.MouseEvent) {
    e?.stopPropagation()
    const text = `${post.title} - ${formatPrice(post.price)}\n${post.description || ''}\nContato: ${post.contact_name || ''} ${post.contact_phone || ''}`
    const encoded = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  const catStyle = (cat: string) => CATEGORY_STYLES[cat] || CATEGORY_STYLES.produto

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Voltar</span>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-zinc-900">Vitrine do Bairro</h1>
                <p className="text-xs text-zinc-500">Anuncios expiram em 48h</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>{posts.length} ativos</span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-4 flex gap-2">
            {([
              { value: 'todos', label: 'Todos' },
              { value: 'produto', label: 'Produtos' },
              { value: 'servico', label: 'Servicos' },
            ] as const).map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filter === tab.value
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <p className="text-zinc-500 text-sm">Nenhum anuncio ativo no momento</p>
          <p className="text-zinc-400 text-xs mt-1">Os anuncios expiram em 48h</p>
        </div>
      ) : (
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => {
              const style = catStyle(post.category)
              const CatIcon = style.icon
              const hoursLeft = getHoursRemaining(post.expires_at)

              return (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left shadow-sm transition-all duration-200 hover:shadow-lg hover:border-zinc-300 hover:-translate-y-0.5"
                >
                  {/* Visual Area */}
                  {post.image_url ? (
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      {/* Price Badge */}
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="rounded-xl bg-white px-3.5 py-2 text-base font-bold text-zinc-900 shadow-lg">
                          {formatPrice(post.price)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br ${style.bg}`}>
                      {/* Pattern Background */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                          backgroundSize: '24px 24px'
                        }} />
                      </div>
                      <CatIcon className="h-20 w-20 text-white/30 relative z-10" />
                      {/* Price Badge */}
                      <div className="absolute bottom-3 left-3 z-20">
                        <span className="rounded-xl bg-white px-3.5 py-2 text-base font-bold text-zinc-900 shadow-lg">
                          {formatPrice(post.price)}
                        </span>
                      </div>
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3 z-20">
                        <span className="rounded-lg bg-white/25 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                          {post.category === 'servico' ? 'Servico' : 'Produto'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Info Area */}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-base font-semibold text-zinc-900 leading-tight line-clamp-2">
                      {post.title}
                    </h3>
                    {post.description && (
                      <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed line-clamp-2">
                        {post.description}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <User className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[120px]">{post.contact_name || 'Anonimo'}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        hoursLeft <= 6 ? 'text-red-500' : hoursLeft <= 12 ? 'text-amber-500' : 'text-zinc-400'
                      }`}>
                        <Clock className="h-3.5 w-3.5" />
                        <span>{hoursLeft}h</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div 
            className="relative w-full max-w-lg overflow-hidden rounded-t-3xl bg-white sm:rounded-2xl sm:shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image / Gradient */}
            {selectedPost.image_url ? (
              <div className="relative aspect-square">
                <img
                  src={selectedPost.image_url}
                  alt={selectedPost.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className={`relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br ${catStyle(selectedPost.category).bg}`}>
                {(() => {
                  const Icon = catStyle(selectedPost.category).icon
                  return <Icon className="h-20 w-20 text-white/15" />
                })()}
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <span className="mb-2 inline-block rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                    {selectedPost.category === 'servico' ? 'Servico' : 'Produto'}
                  </span>
                  <h2 className="text-xl font-bold text-zinc-900">{selectedPost.title}</h2>
                </div>
                {(selectedPost.price && selectedPost.price > 0) ? (
                  <div className="flex-shrink-0 rounded-xl bg-zinc-900 px-4 py-2">
                    <span className="text-lg font-bold text-white">
                      R$ {Number(selectedPost.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ) : (
                  <div className="flex-shrink-0 rounded-xl bg-zinc-100 px-4 py-2">
                    <span className="text-sm font-medium text-zinc-600">A combinar</span>
                  </div>
                )}
              </div>

              {selectedPost.description && (
                <p className="mb-4 text-sm text-zinc-600 leading-relaxed">
                  {selectedPost.description}
                </p>
              )}

              {/* Seller Info */}
              <div className="mb-4 rounded-xl bg-zinc-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200">
                      <User className="h-5 w-5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{selectedPost.contact_name || 'Anonimo'}</p>
                      <p className="text-xs text-zinc-500">{selectedPost.contact_phone || 'Sem telefone'}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    getHoursRemaining(selectedPost.expires_at) <= 6 ? 'text-red-500' : 'text-zinc-400'
                  }`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span>Expira em {getHoursRemaining(selectedPost.expires_at)}h</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleWhatsAppClick(selectedPost)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                >
                  <MessageCircle className="h-5 w-5" />
                  Contato via WhatsApp
                </button>
                <button
                  onClick={(e) => handleShare(selectedPost, e)}
                  className="flex items-center justify-center rounded-xl border border-zinc-200 px-4 py-3 text-zinc-600 transition-colors hover:bg-zinc-50"
                  title="Compartilhar"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
