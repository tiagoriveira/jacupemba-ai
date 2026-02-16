'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, MessageCircle, Share2, ChevronLeft, ChevronRight, User, Clock, Camera } from 'lucide-react'

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

interface ProductStoriesViewProps {
  posts: VitrinePost[]
  initialIndex: number
  onClose: () => void
  onWhatsAppClick: (post: VitrinePost) => void
  onShare: (post: VitrinePost) => void
  getCatConfig: (cat: string) => { label: string; bg: string; icon: any }
}

function getHoursRemaining(expiresAt: string) {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
}

function formatPrice(price: number | null) {
  if (!price || price === 0) return 'A combinar'
  return `R$ ${Number(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export function ProductStoriesView({
  posts,
  initialIndex,
  onClose,
  onWhatsAppClick,
  onShare,
  getCatConfig
}: ProductStoriesViewProps) {
  const [currentPostIndex, setCurrentPostIndex] = useState(initialIndex)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const currentPost = posts[currentPostIndex]
  const postImages = currentPost.images && currentPost.images.length > 0 
    ? currentPost.images 
    : (currentPost.image_url ? [currentPost.image_url] : [])
  const hasMultipleImages = postImages.length > 1

  // Navegação entre posts
  const goToNextPost = useCallback(() => {
    if (currentPostIndex < posts.length - 1) {
      setCurrentPostIndex(prev => prev + 1)
      setCurrentImageIndex(0)
    }
  }, [currentPostIndex, posts.length])

  const goToPrevPost = useCallback(() => {
    if (currentPostIndex > 0) {
      setCurrentPostIndex(prev => prev - 1)
      setCurrentImageIndex(0)
    }
  }, [currentPostIndex])

  // Navegação entre imagens
  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % postImages.length)
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + postImages.length) % postImages.length)

  // Touch handlers para swipe
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      goToNextPost()
    }
    if (isRightSwipe) {
      goToPrevPost()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrevPost()
      if (e.key === 'ArrowRight') goToNextPost()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevPost, goToNextPost, onClose])

  const config = getCatConfig(currentPost.category)
  const Icon = config.icon

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header com informações do post */}
      <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-black/80 to-transparent px-4 py-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          {/* Info do anunciante */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {currentPost.contact_name || 'Anunciante'}
              </p>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span className={`inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 backdrop-blur-sm`}>
                  <Icon className="h-3 w-3" />
                  {config.label}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {getHoursRemaining(currentPost.expires_at)}h
                </span>
              </div>
            </div>
          </div>

          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
            aria-label="Fechar visualização"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress indicators */}
        {posts.length > 1 && (
          <div className="mx-auto mt-4 flex max-w-2xl gap-1">
            {posts.map((_, idx) => (
              <div
                key={idx}
                className={`h-0.5 flex-1 rounded-full transition-all ${
                  idx === currentPostIndex
                    ? 'bg-white'
                    : idx < currentPostIndex
                    ? 'bg-white/50'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Conteúdo principal - Imagem/Vídeo */}
      <div className="flex h-full items-center justify-center">
        {currentPost.video_url ? (
          <video
            src={currentPost.video_url}
            className="h-full w-full object-contain"
            controls
            playsInline
            autoPlay
          />
        ) : postImages.length > 0 ? (
          <div className="relative h-full w-full">
            <img
              src={postImages[currentImageIndex]}
              alt={currentPost.title}
              className="h-full w-full object-contain"
            />

            {/* Navegação de imagens */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Indicador de imagens */}
                <div className="absolute bottom-24 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/60 px-3 py-2 backdrop-blur-sm">
                  <Camera className="h-4 w-4 text-white" />
                  <span className="text-sm font-medium text-white">
                    {currentImageIndex + 1}/{postImages.length}
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${config.bg}`}>
            <Icon className="h-32 w-32 text-white/20" />
          </div>
        )}
      </div>

      {/* Footer com informações e ações */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 to-transparent px-4 py-6">
        <div className="mx-auto max-w-2xl">
          {/* Título e preço */}
          <h2 className="mb-2 text-2xl font-bold text-white leading-tight">
            {currentPost.title}
          </h2>
          
          <div className="mb-3 text-3xl font-bold text-white">
            {formatPrice(currentPost.price)}
          </div>

          {/* Descrição */}
          {currentPost.description && (
            <p className="mb-4 text-sm text-white/80 leading-relaxed line-clamp-3">
              {currentPost.description}
            </p>
          )}

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={() => onWhatsAppClick(currentPost)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl active:scale-95"
              aria-label="Iniciar conversa no WhatsApp"
            >
              <MessageCircle className="h-5 w-5" />
              Conversar
            </button>
            <button
              onClick={() => onShare(currentPost)}
              className="flex items-center justify-center rounded-xl bg-white/20 p-3.5 text-white backdrop-blur-sm transition-all hover:bg-white/30 active:scale-95"
              aria-label="Compartilhar anúncio"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navegação entre posts (setas laterais) */}
      {currentPostIndex > 0 && (
        <button
          onClick={goToPrevPost}
          className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/60 p-4 text-white backdrop-blur-sm transition-all hover:bg-black/80 md:flex"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}
      {currentPostIndex < posts.length - 1 && (
        <button
          onClick={goToNextPost}
          className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/60 p-4 text-white backdrop-blur-sm transition-all hover:bg-black/80 md:flex"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}
    </div>
  )
}
