'use client'

import { useState, useEffect } from 'react'
import { X, MessageCircle, ArrowLeft, Loader2, Clock, Share2, Briefcase, Info, Wrench, ShoppingBag, Megaphone, User, Play, ChevronLeft, ChevronRight, Camera, Search } from 'lucide-react'
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
  images?: string[]
  video_url?: string
  aspect_ratio?: 'square' | 'vertical'
  expires_at: string
  created_at: string
}

type CategoryType = 'vaga' | 'informativo' | 'servico' | 'produto' | 'comunicado'

const CATEGORY_CONFIG: Record<CategoryType, { label: string; bg: string; icon: any }> = {
  vaga: { label: 'Vaga', bg: 'from-blue-600 to-blue-400', icon: Briefcase },
  informativo: { label: 'Informativo', bg: 'from-purple-600 to-purple-400', icon: Info },
  servico: { label: 'Servico', bg: 'from-orange-600 to-orange-400', icon: Wrench },
  produto: { label: 'Produto', bg: 'from-green-600 to-green-400', icon: ShoppingBag },
  comunicado: { label: 'Comunicado', bg: 'from-red-600 to-red-400', icon: Megaphone },
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
  const [filter, setFilter] = useState<'todos' | CategoryType>('todos')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

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
        const validPosts = (data || []).filter(post =>
          post.video_url ||
          post.image_url ||
          (post.images && post.images.length > 0)
        )
        setPosts(validPosts)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const filteredPosts = posts.filter(p => {
    const matchesFilter = filter === 'todos' || p.category === filter
    const matchesSearch = !searchTerm.trim() || 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  function handleWhatsAppClick(post: VitrinePost, e?: React.MouseEvent) {
    e?.stopPropagation()

    // TODO: Quando backend estiver pronto, substituir por chamada API
    // await fetch('/api/analytics/track', { method: 'POST', body: JSON.stringify({ postId: post.id, action: 'whatsapp_click' }) })
    console.log('[ANALYTICS]', {
      action: 'whatsapp_click',
      post_id: post.id,
      post_title: post.title,
      timestamp: new Date().toISOString()
    })

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

  const getCatConfig = (cat: string) => CATEGORY_CONFIG[cat as CategoryType] || CATEGORY_CONFIG.produto

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
                <h1 className="text-xl font-bold text-zinc-900">Explorar</h1>
                <p className="text-xs text-zinc-500">Comunidade local</p>
              </div>
            </div>
            <Link
              href="/painel-lojista"
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Anunciar Aqui</span>
              <span className="sm:hidden">Anunciar</span>
            </Link>
          </div>

          {/* Filter Tabs */}
          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar anúncios..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-zinc-400 focus:bg-white"
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {([
              { value: 'todos', label: 'Todos' },
              { value: 'vaga', label: 'Vagas' },
              { value: 'informativo', label: 'Informativos' },
              { value: 'servico', label: 'Servicos' },
              { value: 'produto', label: 'Produtos' },
              { value: 'comunicado', label: 'Comunicados' },
            ] as const).map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${filter === tab.value
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
        <div className="mx-auto max-w-6xl px-0 py-0">
          <div className="columns-2 gap-0 sm:columns-3 lg:columns-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="mb-0 w-full break-inside-avoid">
                <div className={`animate-pulse bg-zinc-200 ${i % 3 === 0 ? 'aspect-[9/16]' : 'aspect-square'}`} />
              </div>
            ))}
          </div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
          <p className="text-zinc-500 text-sm">Nenhum anuncio ativo no momento</p>
          <p className="text-zinc-400 text-xs mt-1">Os anuncios expiram em 48h</p>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-0 py-0">
          {/* Masonry Grid - Instagram Explore Style */}
          <div className="columns-2 gap-0 sm:columns-3 lg:columns-4">
            {filteredPosts.map((post) => {
              const config = getCatConfig(post.category)
              const isVertical = post.aspect_ratio === 'vertical'
              const postImages = post.images && post.images.length > 0 ? post.images : (post.image_url ? [post.image_url] : [])
              const hasMultipleImages = postImages.length > 1

              return (
                <button
                  key={post.id}
                  onClick={() => {
                    setSelectedPost(post)
                    setCurrentImageIndex(0)
                  }}
                  className="group relative mb-0 w-full break-inside-avoid overflow-hidden transition-all duration-200 hover:opacity-90"
                >
                  {/* Price badge */}
                  <div className="absolute bottom-2 left-2 z-[2] rounded-full bg-black/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    {formatPrice(post.price)}
                  </div>

                  {/* Expiry badge */}
                  {getHoursRemaining(post.expires_at) <= 12 && (
                    <div className="absolute bottom-2 right-2 z-[2] flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      <Clock className="h-3 w-3" />
                      {getHoursRemaining(post.expires_at)}h
                    </div>
                  )}
                  {post.video_url ? (
                    <div className="relative w-full">
                      <video
                        src={post.video_url}
                        className={`w-full object-cover ${isVertical ? 'aspect-[9/16]' : 'aspect-square'}`}
                        playsInline
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="rounded-full bg-white/90 p-3 backdrop-blur-sm">
                          <Play className="h-6 w-6 text-zinc-900" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                  ) : postImages.length > 0 ? (
                    <div className="relative">
                      <img
                        src={postImages[0]}
                        alt={post.title}
                        loading="lazy"
                        className={`w-full object-cover ${isVertical ? 'aspect-[9/16]' : 'aspect-square'}`}
                      />
                      {hasMultipleImages && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
                          <Camera className="h-3 w-3 text-white" />
                          <span className="text-xs font-medium text-white">1/{postImages.length}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`flex ${isVertical ? 'aspect-[9/16]' : 'aspect-square'} w-full items-center justify-center bg-gradient-to-br ${config.bg}`}>
                      <config.icon className="h-16 w-16 text-white/20" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-4 animate-in fade-in-0 duration-200"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-t-2xl bg-white dark:bg-zinc-900 sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 dark:bg-zinc-800/90 p-2 text-zinc-900 dark:text-zinc-100 backdrop-blur-sm transition-all hover:bg-white dark:hover:bg-zinc-800 shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image / Video / Gradient */}
            {selectedPost.video_url ? (
              <div className="relative aspect-square">
                <video
                  src={selectedPost.video_url}
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                />
              </div>
            ) : (() => {
              const modalImages = selectedPost.images && selectedPost.images.length > 0
                ? selectedPost.images
                : (selectedPost.image_url ? [selectedPost.image_url] : [])

              if (modalImages.length === 0) {
                return (
                  <div className={`relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br ${getCatConfig(selectedPost.category).bg}`}>
                    {(() => {
                      const Icon = getCatConfig(selectedPost.category).icon
                      return <Icon className="h-20 w-20 text-white/15" />
                    })()}
                  </div>
                )
              }

              const hasMultiple = modalImages.length > 1
              const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % modalImages.length)
              const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length)

              return (
                <div className="relative aspect-square bg-zinc-900">
                  <img
                    src={modalImages[currentImageIndex]}
                    alt={`${selectedPost.title} - ${currentImageIndex + 1}`}
                    className="h-full w-full object-contain"
                  />

                  {hasMultiple && (
                    <>
                      {/* Navigation Arrows */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          prevImage()
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/80"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          nextImage()
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/80"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>

                      {/* Dots Indicator */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {modalImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation()
                              setCurrentImageIndex(idx)
                            }}
                            className={`h-2 rounded-full transition-all ${idx === currentImageIndex
                              ? 'w-6 bg-white'
                              : 'w-2 bg-white/50 hover:bg-white/75'
                              }`}
                          />
                        ))}
                      </div>

                      {/* Counter */}
                      <div className="absolute top-4 right-4 rounded-full bg-black/60 px-3 py-1 backdrop-blur-sm">
                        <span className="text-sm font-medium text-white">
                          {currentImageIndex + 1}/{modalImages.length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )
            })()}

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Category Badge & Expiration */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {(() => {
                    const Icon = getCatConfig(selectedPost.category).icon
                    return <Icon className="h-3.5 w-3.5" />
                  })()}
                  {getCatConfig(selectedPost.category).label}
                </span>
                <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  getHoursRemaining(selectedPost.expires_at) <= 6 
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}>
                  <Clock className="h-3 w-3" />
                  Expira em {getHoursRemaining(selectedPost.expires_at)}h
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                {selectedPost.title}
              </h2>

              {/* Price */}
              {(selectedPost.price && selectedPost.price > 0) ? (
                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  R$ {Number(selectedPost.price).toFixed(2).replace('.', ',')}
                </div>
              ) : (
                <div className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
                  Preço a combinar
                </div>
              )}

              {/* Description */}
              {selectedPost.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {selectedPost.description}
                </p>
              )}

              {/* Divider */}
              <div className="border-t border-zinc-200 dark:border-zinc-800" />

              {/* Seller Info */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <User className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedPost.contact_name || 'Anunciante'}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    📞 {selectedPost.contact_phone || 'Sem telefone'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleWhatsAppClick(selectedPost)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-green-700 active:scale-[0.98] shadow-lg shadow-green-600/20"
                >
                  <MessageCircle className="h-5 w-5" />
                  Contato via WhatsApp
                </button>
                <button
                  onClick={(e) => handleShare(selectedPost, e)}
                  className="flex items-center justify-center rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 px-4 py-3.5 text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98]"
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
