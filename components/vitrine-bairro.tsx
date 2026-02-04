'use client'

import { useState, useEffect } from 'react'
import { X, MapPin, Clock } from 'lucide-react'
import { SHOWCASE_POSTS, type ShowcasePost } from '@/lib/showcase-data'

interface VitrineBairroProps {
  isOpen: boolean
  onClose: () => void
}

export function VitrineBairro({ isOpen, onClose }: VitrineBairroProps) {
  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set())
  const [selectedPost, setSelectedPost] = useState<ShowcasePost | null>(null)

  // Load viewed posts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('viewed-showcase-posts')
    if (saved) {
      setViewedPosts(new Set(JSON.parse(saved)))
    }
  }, [])

  // Save viewed posts to localStorage
  const markAsViewed = (postId: string) => {
    const newViewed = new Set(viewedPosts)
    newViewed.add(postId)
    setViewedPosts(newViewed)
    localStorage.setItem('viewed-showcase-posts', JSON.stringify(Array.from(newViewed)))
  }

  const handlePostClick = (post: ShowcasePost) => {
    setSelectedPost(post)
    markAsViewed(post.id)
  }

  const handleClose = () => {
    setSelectedPost(null)
  }

  const handleWhatsApp = (post: ShowcasePost) => {
    const message = encodeURIComponent(
      `Olá! Vi seu post na Vitrine do Bairro sobre ${post.productName}. Gostaria de mais informações!`
    )
    window.open(`https://wa.me/${post.whatsappNumber}?text=${message}`, '_blank')
  }

  // Filter posts from last 48 hours
  const recentPosts = SHOWCASE_POSTS.filter(post => {
    const hoursDiff = (Date.now() - post.postedAt.getTime()) / (1000 * 60 * 60)
    return hoursDiff <= 48
  })

  return (
    <>
      {/* Drawer Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full bg-white transition-transform duration-300 dark:bg-zinc-950 sm:w-[500px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏪</span>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Vitrine do Bairro
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
          </button>
        </div>

        {/* Grid - Estilo Instagram Explorar */}
        <div className="h-[calc(100%-73px)] overflow-y-auto p-1">
          <div className="grid grid-cols-3 gap-1">
            {recentPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => handlePostClick(post)}
                className="group relative aspect-square overflow-hidden"
              >
                <img
                  src={post.imageUrl}
                  alt={post.productName}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal - Imagem única em tela cheia */}
      {selectedPost && (
        <div className="fixed inset-0 z-[60] bg-black">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Image */}
          <div className="relative h-full w-full">
            <img
              src={selectedPost.imageUrl}
              alt={selectedPost.productName}
              className="h-full w-full object-contain"
            />

            {/* Info Card */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent p-6">
              <h3 className="mb-2 text-2xl font-bold text-white">
                {selectedPost.productName}
              </h3>
              <p className="mb-4 text-lg text-white/90">
                {selectedPost.businessName}
              </p>

              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{selectedPost.address}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{selectedPost.hours}</span>
                </div>
              </div>

              <button
                onClick={() => handleWhatsApp(selectedPost)}
                className="w-full rounded-xl bg-green-500 py-4 text-center font-semibold text-white transition-colors hover:bg-green-600"
              >
                Chamar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
