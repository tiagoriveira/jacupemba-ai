'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react'
import { SHOWCASE_POSTS, type ShowcasePost } from '@/lib/showcase-data'

interface VitrineBairroProps {
  isOpen: boolean
  onClose: () => void
}

export function VitrineBairro({ isOpen, onClose }: VitrineBairroProps) {
  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set())
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null)

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

  const handlePostClick = (index: number) => {
    setSelectedPostIndex(index)
    markAsViewed(SHOWCASE_POSTS[index].id)
  }

  const handleClose = () => {
    setSelectedPostIndex(null)
  }

  const handleNext = () => {
    if (selectedPostIndex !== null && selectedPostIndex < SHOWCASE_POSTS.length - 1) {
      const newIndex = selectedPostIndex + 1
      setSelectedPostIndex(newIndex)
      markAsViewed(SHOWCASE_POSTS[newIndex].id)
    }
  }

  const handlePrev = () => {
    if (selectedPostIndex !== null && selectedPostIndex > 0) {
      const newIndex = selectedPostIndex - 1
      setSelectedPostIndex(newIndex)
      markAsViewed(SHOWCASE_POSTS[newIndex].id)
    }
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

        {/* Grid */}
        <div className="h-[calc(100%-73px)] overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {recentPosts.map((post, index) => {
              const isViewed = viewedPosts.has(post.id)
              return (
                <button
                  key={post.id}
                  onClick={() => handlePostClick(index)}
                  className={`group relative aspect-[3/4] overflow-hidden rounded-xl transition-opacity ${
                    isViewed ? 'opacity-60' : 'opacity-100'
                  }`}
                >
                  <img
                    src={post.imageUrl}
                    alt={post.productName}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-balance text-sm font-semibold text-white">
                      {post.productName}
                    </p>
                    <p className="mt-1 text-xs text-white/80">{post.businessName}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Fullscreen Post View (Stories Style) */}
      {selectedPostIndex !== null && (
        <div className="fixed inset-0 z-[60] bg-black">
          {/* Progress Indicators */}
          <div className="absolute left-0 right-0 top-0 z-10 flex gap-1 p-2">
            {recentPosts.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index === selectedPostIndex
                    ? 'bg-white'
                    : index < selectedPostIndex
                      ? 'bg-white/70'
                      : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* Navigation Areas */}
          <button
            onClick={handlePrev}
            disabled={selectedPostIndex === 0}
            className="absolute left-0 top-0 z-10 h-full w-1/3 disabled:cursor-not-allowed"
            aria-label="Post anterior"
          >
            {selectedPostIndex > 0 && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <ChevronLeft className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={selectedPostIndex === recentPosts.length - 1}
            className="absolute right-0 top-0 z-10 h-full w-1/3 disabled:cursor-not-allowed"
            aria-label="Próximo post"
          >
            {selectedPostIndex < recentPosts.length - 1 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <ChevronRight className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
            )}
          </button>

          {/* Image */}
          <div className="relative h-full w-full">
            <img
              src={recentPosts[selectedPostIndex].imageUrl}
              alt={recentPosts[selectedPostIndex].productName}
              className="h-full w-full object-contain"
            />

            {/* Info Card */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6">
              <h3 className="mb-2 text-2xl font-bold text-white">
                {recentPosts[selectedPostIndex].productName}
              </h3>
              <p className="mb-4 text-lg text-white/90">
                {recentPosts[selectedPostIndex].businessName}
              </p>

              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{recentPosts[selectedPostIndex].address}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{recentPosts[selectedPostIndex].hours}</span>
                </div>
              </div>

              <button
                onClick={() => handleWhatsApp(recentPosts[selectedPostIndex])}
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
