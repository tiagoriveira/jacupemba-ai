'use client'

import { useState, useEffect } from 'react'
import { X, MessageCircle, ArrowLeft, Loader2, Clock, Share2, Briefcase, Info, Wrench, ShoppingBag, Megaphone, User, Play, ChevronLeft, ChevronRight, Camera, Search } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ProductStoriesView } from './ProductStoriesView'

interface VitrinePost {
  id: string
  contact_name: string
  contact_phone: string
  title: string
  description: string
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



export function VitrineGrid() {
  const [posts, setPosts] = useState<VitrinePost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<VitrinePost | null>(null)
  const [filter, setFilter] = useState<'todos' | CategoryType>('todos')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [storiesMode, setStoriesMode] = useState(false)
  const [storiesStartIndex, setStoriesStartIndex] = useState(0)

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
    const text = `${post.title}\n${post.description || ''}\nContato: ${post.contact_name || ''} ${post.contact_phone || ''}`
    const encoded = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encoded}`, '_blank')
  }

  const getCatConfig = (cat: string) => CATEGORY_CONFIG[cat as CategoryType] || CATEGORY_CONFIG.produto

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95"
                aria-label="Voltar para página inicial"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Voltar</span>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Explorar</h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Comunidade local</p>
              </div>
            </div>
            <Link
              href="/painel-lojista"
              className="flex items-center gap-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-semibold text-white dark:text-zinc-900 shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md dark:hover:bg-zinc-200 active:scale-95"
              aria-label="Acessar painel do anunciante"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Acessar Painel</span>
              <span className="sm:hidden">Painel</span>
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
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 py-2.5 pl-10 pr-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-all duration-200 focus:border-zinc-400 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-800 focus:shadow-sm"
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
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 ${filter === tab.value
                  ? 'bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:shadow-sm dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                  }`}
                aria-label={`Filtrar por ${tab.label.toLowerCase()}`}
                aria-pressed={filter === tab.value}
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
                <div className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 ${i % 3 === 0 ? 'aspect-[9/16]' : 'aspect-square'}`} />
              </div>
            ))}
          </div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Nenhum anuncio ativo no momento</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">Os anuncios expiram em 48h</p>
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
                    const postIndex = filteredPosts.findIndex(p => p.id === post.id)
                    setStoriesStartIndex(postIndex)
                    setStoriesMode(true)
                  }}
                  className="group relative mb-0 w-full break-inside-avoid overflow-hidden transition-all duration-300 hover:brightness-95 active:scale-[0.98]"
                  aria-label={`Ver detalhes de ${post.title}`}
                >


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
                      {/* Overlay com título no hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-sm font-semibold text-white line-clamp-2 leading-tight">
                            {post.title}
                          </p>
                        </div>
                      </div>
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

      {/* Stories Mode - Instagram Style Fullscreen */}
      {storiesMode && (
        <ProductStoriesView
          posts={filteredPosts}
          initialIndex={storiesStartIndex}
          onClose={() => setStoriesMode(false)}
          onWhatsAppClick={handleWhatsAppClick}
          onShare={handleShare}
          getCatConfig={getCatConfig}
        />
      )}
    </div>
  )
}
