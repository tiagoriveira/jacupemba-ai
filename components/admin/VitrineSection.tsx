'use client'

import { useState, useEffect } from 'react'
import { Store, Search, Check, X, Trash2, Clock, AlertTriangle, Plus, Loader2 } from 'lucide-react'
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
      const { error } = await supabase
        .from('vitrine_posts')
        .update({ status })
        .eq('id', id)

      if (error) throw error

      toast.success(
        status === 'aprovado'
          ? 'Post aprovado com sucesso!'
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
      const { error } = await supabase
        .from('vitrine_posts')
        .update({ status: action })
        .in('id', selectedPosts)

      if (error) throw error

      toast.success(`${selectedPosts.length} posts ${action === 'aprovado' ? 'aprovados' : 'rejeitados'}!`)
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
      case 'aprovado': return 'bg-green-100 text-green-700'
      case 'rejeitado': return 'bg-red-100 text-red-700'
      case 'pendente': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-zinc-100 text-zinc-700'
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
        onSuccess={fetchPosts}
        editPost={editingPost}
      />

      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Vitrine</h1>
            <p className="mt-1 text-sm text-zinc-600">
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
            <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-2">
              <AlertTriangle className="h-5 w-5 text-yellow-700" />
              <span className="text-sm font-semibold text-yellow-700">
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
            <div className="col-span-full rounded-xl border border-dashed border-zinc-300 p-12 text-center">
              <p className="text-sm text-zinc-600">Nenhum post encontrado</p>
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

                <div className="relative aspect-square bg-zinc-100">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Store className="h-12 w-12 text-zinc-300" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex gap-2">
                    <span className={`badge-grok ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-zinc-900">{post.title}</h3>
                  <p className="text-lg font-bold text-zinc-900 mt-1">
                    R$ {Number(post.price).toFixed(2)}
                  </p>

                  <div className="mt-3 space-y-1 text-sm text-zinc-600">
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
                          className="flex-1 rounded-lg bg-green-100 py-2 text-sm font-medium text-green-700 hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50"
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
                          className="flex-1 rounded-lg bg-red-100 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <button
                      onClick={() => deletePost(post.id)}
                      disabled={loadingId === post.id}
                      className="rounded-lg bg-zinc-100 p-2 text-zinc-700 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
  )
}
