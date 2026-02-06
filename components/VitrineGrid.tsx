'use client'

import { useState, useRef, useEffect } from 'react'
import { X, MessageCircle, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface VitrinePost {
  id: string
  seller_name: string
  seller_phone: string
  title: string
  description: string
  price: number
  category: string
  media_url: string
  media_type: 'image' | 'video'
  expires_at: string
  views: number
  clicks: number
  created_at: string
}

// Masonry heights for visual variety
const ASPECT_PATTERNS = ['tall', 'normal', 'normal', 'tall', 'normal', 'normal', 'tall', 'normal'] as const

export function VitrineGrid() {
  const [posts, setPosts] = useState<VitrinePost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<VitrinePost | null>(null)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})

  useEffect(() => {
    async function fetchPosts() {
      try {
        const { data, error } = await supabase
          .from('vitrine_posts')
          .select('*')
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })

        if (error) {
          console.error('[v0] Error fetching vitrine posts:', error)
          return
        }
        setPosts(data || [])
      } catch (err) {
        console.error('[v0] Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  // Autoplay videos when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement
          if (entry.isIntersecting) {
            video.play().catch(() => {})
          } else {
            video.pause()
          }
        })
      },
      { threshold: 0.5 }
    )

    Object.values(videoRefs.current).forEach((video) => {
      if (video) observer.observe(video)
    })

    return () => observer.disconnect()
  }, [posts])

  function handleWhatsAppClick(post: VitrinePost) {
    const message = encodeURIComponent(`Ola, vi seu anuncio "${post.title}" no Assistente Local e tenho interesse!`)
    window.open(`https://wa.me/${post.seller_phone}?text=${message}`, '_blank')
  }

  function getAspect(index: number) {
    return ASPECT_PATTERNS[index % ASPECT_PATTERNS.length]
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Voltar</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">Vitrine do Bairro</h1>
                <p className="text-sm text-zinc-600">Produtos e servicos locais</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="hidden sm:inline">{posts.length} anuncios ativos</span>
                <span className="sm:hidden">{posts.length}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <p className="text-zinc-500 text-sm">Nenhum anuncio ativo no momento</p>
          <p className="text-zinc-400 text-xs mt-1">Os anuncios expiram em 48h</p>
        </div>
      ) : (
        /* Masonry Grid */
        <div className="max-w-7xl mx-auto px-1 py-2">
          <div className="columns-2 md:columns-3 gap-1">
            {posts.map((post, index) => {
              const aspect = getAspect(index)
              return (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="relative mb-1 w-full break-inside-avoid overflow-hidden rounded-sm bg-zinc-200 block"
                >
                  {post.media_type === 'video' ? (
                    <>
                      <video
                        ref={(el) => { videoRefs.current[post.id] = el }}
                        src={post.media_url}
                        loop
                        muted
                        playsInline
                        className={`w-full object-cover ${aspect === 'tall' ? 'aspect-[3/4]' : 'aspect-square'}`}
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <img
                      src={post.media_url}
                      alt={post.title}
                      className={`w-full object-cover ${aspect === 'tall' ? 'aspect-[3/4]' : 'aspect-square'}`}
                    />
                  )}

                  {/* Always visible bottom info */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white font-medium text-xs line-clamp-1">{post.title}</p>
                    {post.price && (
                      <p className="text-green-400 font-bold text-xs">R$ {Number(post.price).toFixed(2)}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal Fullscreen */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black">
          <button
            onClick={() => setSelectedPost(null)}
            className="absolute top-4 right-4 z-10 rounded-full bg-black/60 backdrop-blur-sm p-2 text-white hover:bg-black/80 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative h-full w-full">
            {selectedPost.media_type === 'video' ? (
              <video
                src={selectedPost.media_url}
                controls
                autoPlay
                loop
                className="h-full w-full object-contain"
              />
            ) : (
              <img
                src={selectedPost.media_url}
                alt={selectedPost.title}
                className="h-full w-full object-contain"
              />
            )}

            {/* Info footer */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent px-6 py-8">
              <div className="max-w-2xl mx-auto">
                <span className="inline-block rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white mb-3">
                  {selectedPost.category}
                </span>

                <h2 className="text-2xl font-bold text-white mb-2">{selectedPost.title}</h2>
                {selectedPost.price && (
                  <p className="text-3xl font-bold text-green-400 mb-4">
                    R$ {Number(selectedPost.price).toFixed(2)}
                  </p>
                )}

                <p className="text-white/90 text-base leading-relaxed mb-4">
                  {selectedPost.description}
                </p>

                <p className="text-white/70 text-sm mb-2">
                  Por: <span className="font-medium text-white">{selectedPost.seller_name}</span>
                </p>

                <p className="text-white/50 text-xs">
                  Expira em {Math.max(0, Math.round((new Date(selectedPost.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)))} horas
                </p>
              </div>
            </div>

            <button
              onClick={() => handleWhatsAppClick(selectedPost)}
              className="absolute bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 hover:scale-110 transition-all"
              title="Contato via WhatsApp"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
