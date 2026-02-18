'use client'

import { useState, useEffect } from 'react'
import { Store, Search, Check, X, Trash2, Clock, AlertTriangle, Plus, Loader2, RefreshCw, Edit, ChevronLeft, ChevronRight, Play, Phone, User, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { VitrinePost } from '@/lib/supabase'
import { toast } from 'sonner'
import { logger } from '@/lib/logger'
import { VitrineUploadModal } from './VitrineUploadModal'

export function VitrineSection() {
  const [posts, setPosts] = useState<VitrinePost[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<VitrinePost | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [processingBatch, setProcessingBatch] = useState(false)
  const [previewPost, setPreviewPost] = useState<VitrinePost | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [filterStatus])

  const fetchPosts = async () => {
    try {
      const query = supabase
        .from('vitrine_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (filterStatus !== 'todos') {
        query.eq('status', filterStatus)
      }

      const { data, error } = await query
      if (error) throw error
      setPosts(data || [])
      setSelectedPosts([]) // Clear selection on refresh
    } catch (error) {
      logger.error('Error fetching vitrine posts:', error)
    }
  }

  const updateStatus = async (id: string, status: 'aprovado' | 'rejeitado' | 'pendente') => {
    try {
      setLoadingId(id)

      const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() }

      // 48h a partir da aprovação do admin
      if (status === 'aprovado') {
        const approvedAt = new Date()
        const expiresAt = new Date(approvedAt.getTime() + 48 * 60 * 60 * 1000)
        updateData.approved_at = approvedAt.toISOString()
        updateData.expires_at = expiresAt.toISOString()
      }

      const { error } = await supabase
        .from('vitrine_posts')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      toast.success(
        status === 'aprovado'
          ? 'Post aprovado! Expira em 48h.'
          : 'Post rejeitado com sucesso!'
      )

      await fetchPosts()
    } catch (error) {
      logger.error('Error updating status:', error)
      toast.error('Erro ao atualizar status')
    } finally {
      setLoadingId(null)
    }
  }

  const deletePost = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este post?')) return

    try {
      setLoadingId(id)
      const { error } = await supabase
        .from('vitrine_posts')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Post deletado com sucesso!')
      await fetchPosts()
    } catch (error) {
      logger.error('Error deleting:', error)
      toast.error('Erro ao deletar')
    } finally {
      setLoadingId(null)
    }
  }

  const handleBatchAction = async (action: 'aprovado' | 'rejeitado' | 'pendente') => {
    if (selectedPosts.length === 0) return
    if (!confirm(`Confirma ${action === 'aprovado' ? 'aprovar' : 'rejeitar'} ${selectedPosts.length} posts?`)) return

    try {
      setProcessingBatch(true)

      const updateData: Record<string, any> = { status: action, updated_at: new Date().toISOString() }

      if (action === 'aprovado') {
        const approvedAt = new Date()
        const expiresAt = new Date(approvedAt.getTime() + 48 * 60 * 60 * 1000)
        updateData.approved_at = approvedAt.toISOString()
        updateData.expires_at = expiresAt.toISOString()
      }

      const { error } = await supabase
        .from('vitrine_posts')
        .update(updateData)
        .in('id', selectedPosts)

      if (error) throw error

      toast.success(`${selectedPosts.length} posts ${action === 'aprovado' ? 'aprovados (48h)' : 'rejeitados'}!`)
      setSelectedPosts([])
      await fetchPosts()
    } catch (error) {
      logger.error('Error batch update:', error)
      toast.error('Erro na atualização em lote')
    } finally {
      setProcessingBatch(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedPosts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const republishPost = async (post: VitrinePost) => {
    if (!confirm('Republicar este post por mais 48h?')) return
    try {
      setLoadingId(post.id)
      const newExpiry = new Date()
      newExpiry.setHours(newExpiry.getHours() + 48)
      const { error } = await supabase
        .from('vitrine_posts')
        .update({ expires_at: newExpiry.toISOString(), status: 'aprovado' })
        .eq('id', post.id)
      if (error) throw error
      toast.success('Post republicado por +48h!')
      await fetchPosts()
    } catch (error) {
      logger.error('Error republishing:', error)
      toast.error('Erro ao republicar')
    } finally {
      setLoadingId(null)
    }
  }

  const handleEditPost = (post: VitrinePost) => {
    setEditingPost(post)
    setIsModalOpen(true)
  }

  const handleEditSuccess = async () => {
    if (editingPost) {
      const originalStatus = editingPost.status
      let newStatus = originalStatus

      if (originalStatus === 'aprovado') {
        newStatus = 'pendente'
      }
      // rejeitado → stays rejeitado, pendente → stays pendente

      if (newStatus !== 'pendente') {
        // VitrineUploadModal already sets 'pendente', so we override back
        const { error } = await supabase
          .from('vitrine_posts')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', editingPost.id)

        if (error) {
          logger.error('Error updating post status after edit:', error)
        }
      }

      if (originalStatus === 'aprovado') {
        toast.info('Post editado — requer re-aprovação')
      } else if (originalStatus === 'rejeitado') {
        toast.info('Post editado — aguardando nova revisão')
      }
    }
    await fetchPosts()
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPost(null)
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.contact_name && post.contact_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'rejeitado': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'pendente': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
    }
  }

  const getTimeRemaining = (expiraEm: string) => {
    const now = new Date()
    const expiry = new Date(expiraEm)
    const diff = expiry.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return hours > 0 ? `${hours}h restantes` : 'Expirado'
  }

  const pendentesCount = posts.filter(p => p.status === 'pendente').length

  return (
    <div className="h-full">
      <VitrineUploadModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={editingPost ? handleEditSuccess : fetchPosts}
        editPost={editingPost}
      />

      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Vitrine</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Modere posts comerciais da vitrine (48h)
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedPosts.length > 0 && (
              <div className="flex items-center gap-2 mr-4 animate-in fade-in slide-in-from-right-4">
                <button
                  onClick={() => handleBatchAction('aprovado')}
                  disabled={processingBatch}
                  className="btn-grok flex gap-2 items-center bg-green-600 text-white hover:bg-green-700"
                >
                  {processingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Aprovar ({selectedPosts.length})
                </button>
                <button
                  onClick={() => handleBatchAction('rejeitado')}
                  disabled={processingBatch}
                  className="btn-grok flex gap-2 items-center bg-red-600 text-white hover:bg-red-700"
                >
                  {processingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Rejeitar
                </button>
                {filterStatus !== 'pendente' && (
                  <button
                    onClick={() => handleBatchAction('pendente')}
                    disabled={processingBatch}
                    className="btn-grok flex gap-2 items-center bg-yellow-500 text-white hover:bg-yellow-600"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Reverter
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => {
                setEditingPost(null)
                setIsModalOpen(true)
              }}
              className="btn-grok flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus className="h-5 w-5" />
              Novo Post
            </button>
            <div className="flex items-center gap-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 px-4 py-2">
              <AlertTriangle className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                {pendentesCount} pendentes
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar posts..."
              className="input-grok w-full pl-10"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (selectedPosts.length === filteredPosts.length) {
                  setSelectedPosts([])
                } else {
                  setSelectedPosts(filteredPosts.map(p => p.id))
                }
              }}
              className="btn-grok bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {selectedPosts.length === filteredPosts.length && filteredPosts.length > 0 ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
            {(['todos', 'pendente', 'aprovado', 'rejeitado'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`btn-grok ${filterStatus === status
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredPosts.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Nenhum post encontrado</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div key={post.id} className={`card-grok overflow-hidden relative group hover:shadow-lg ${selectedPosts.includes(post.id) ? 'ring-2 ring-zinc-900 dark:ring-zinc-100' : ''
                }`}>
                {/* Selection Checkbox */}
                <div className="absolute top-3 right-3 z-10">
                  <input
                    type="checkbox"
                    checked={selectedPosts.includes(post.id)}
                    onChange={() => toggleSelect(post.id)}
                    className="h-5 w-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer shadow-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewPost(post)}
                  className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 w-full cursor-pointer"
                >
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Store className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex gap-2">
                    <span className={`badge-grok ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                    <Eye className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>

                <div className="p-4">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{post.title}</h3>

                  <div className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      <span>{post.contact_name || 'Sem nome'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{getTimeRemaining(post.expires_at)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {post.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => updateStatus(post.id, 'aprovado')}
                          disabled={loadingId === post.id}
                          className="flex-1 rounded-lg bg-green-100 dark:bg-green-900/30 py-2 text-sm font-medium text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loadingId === post.id ? (
                            <Loader2 className="inline h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="inline h-4 w-4" />
                          )}
                          {' '}Aprovar
                        </button>
                        <button
                          onClick={() => updateStatus(post.id, 'rejeitado')}
                          disabled={loadingId === post.id}
                          className="flex-1 rounded-lg bg-red-100 dark:bg-red-900/30 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loadingId === post.id ? (
                            <Loader2 className="inline h-4 w-4 animate-spin" />
                          ) : (
                            <X className="inline h-4 w-4" />
                          )}
                          {' '}Rejeitar
                        </button>
                      </>
                    )}
                    {new Date(post.expires_at) < new Date() && (
                      <button
                        onClick={() => republishPost(post)}
                        disabled={loadingId === post.id}
                        className="flex-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Republicar por +48h"
                      >
                        {loadingId === post.id ? (
                          <Loader2 className="inline h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="inline h-4 w-4" />
                        )}
                        {' '}Republicar
                      </button>
                    )}
                    <button
                      onClick={() => handleEditPost(post)}
                      disabled={loadingId === post.id}
                      className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      disabled={loadingId === post.id}
                      className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Deletar"
                    >
                      {loadingId === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Preview Modal */}
      {previewPost && (
        <PostPreviewModal
          post={previewPost}
          onClose={() => setPreviewPost(null)}
          onApprove={(id) => { setPreviewPost(null); updateStatus(id, 'aprovado') }}
          onReject={(id) => { setPreviewPost(null); updateStatus(id, 'rejeitado') }}
          onEdit={(post) => { setPreviewPost(null); handleEditPost(post) }}
          getStatusColor={getStatusColor}
          getTimeRemaining={getTimeRemaining}
        />
      )}
    </div>
  )
}

// --- Admin Preview Modal ---
function PostPreviewModal({
  post,
  onClose,
  onApprove,
  onReject,
  onEdit,
  getStatusColor,
  getTimeRemaining,
}: {
  post: VitrinePost
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onEdit: (post: VitrinePost) => void
  getStatusColor: (status: string) => string
  getTimeRemaining: (exp: string) => string
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const allImages = post.images && post.images.length > 0
    ? post.images
    : (post.image_url ? [post.image_url] : [])

  const hasMultipleImages = allImages.length > 1

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0 duration-200">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Preview do Post</h2>
            <span className={`badge-grok ${getStatusColor(post.status)}`}>
              {post.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Media Section */}
        <div className="relative">
          {/* Video */}
          {post.video_url && (
            <div className="border-b border-zinc-200 dark:border-zinc-800">
              <video
                src={post.video_url}
                className="w-full max-h-[400px] object-contain bg-black"
                controls
                playsInline
              />
            </div>
          )}

          {/* Image Gallery */}
          {allImages.length > 0 && (
            <div className="relative bg-zinc-100 dark:bg-zinc-800">
              <img
                src={allImages[currentImageIndex]}
                alt={`${post.title} - ${currentImageIndex + 1}`}
                className="w-full max-h-[400px] object-contain"
              />

              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`h-2 w-2 rounded-full transition-all ${
                          idx === currentImageIndex
                            ? 'bg-white scale-125'
                            : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* No media */}
          {allImages.length === 0 && !post.video_url && (
            <div className="flex h-48 items-center justify-center bg-zinc-100 dark:bg-zinc-800">
              <Store className="h-16 w-16 text-zinc-300 dark:text-zinc-600" />
            </div>
          )}
        </div>

        {/* Post Details */}
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{post.title}</h3>

          {post.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{post.description}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3">
              <User className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Anunciante</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{post.contact_name || 'Sem nome'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3">
              <Phone className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Telefone</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{post.contact_phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3">
              <Store className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Categoria</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">{post.category || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3">
              <Clock className="h-5 w-5 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Tempo</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{getTimeRemaining(post.expires_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex gap-3">
          <button
            onClick={() => onApprove(post.id)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-all hover:bg-green-700 active:scale-[0.98]"
          >
            <Check className="h-4 w-4" />
            Aprovar
          </button>
          <button
            onClick={() => onReject(post.id)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition-all hover:bg-red-700 active:scale-[0.98]"
          >
            <X className="h-4 w-4" />
            Rejeitar
          </button>
          <button
            onClick={() => onEdit(post)}
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98]"
          >
            <Edit className="h-4 w-4" />
            Editar
          </button>
        </div>
      </div>
    </div>
  )
}
