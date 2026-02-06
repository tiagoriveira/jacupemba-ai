'use client'

import { useState, useEffect } from 'react'
import { Store, Search, Check, X, Trash2, Clock, AlertTriangle } from 'lucide-react'
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
  expires_at: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
  created_at: string
}

export function VitrineSection() {
  const [posts, setPosts] = useState<VitrinePost[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente')

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
    } catch (error) {
      console.error('[v0] Error fetching vitrine posts:', error)
    }
  }

  const updateStatus = async (id: string, status: 'aprovado' | 'rejeitado') => {
    try {
      const { error } = await supabase
        .from('vitrine_posts')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      fetchPosts()
    } catch (error) {
      console.error('[v0] Error updating status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const deletePost = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este post?')) return
    
    try {
      const { error } = await supabase
        .from('vitrine_posts')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPosts()
    } catch (error) {
      console.error('[v0] Error deleting:', error)
      alert('Erro ao deletar')
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.seller_name.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Vitrine</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Modere posts comerciais da vitrine (48h)
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-2">
            <AlertTriangle className="h-5 w-5 text-yellow-700" />
            <span className="text-sm font-semibold text-yellow-700">
              {pendentesCount} pendentes
            </span>
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
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm"
            />
          </div>

          <div className="flex gap-2">
            {(['todos', 'pendente', 'aprovado', 'rejeitado'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
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
              <div key={post.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <div className="relative aspect-square bg-zinc-100">
                  <img
                    src={post.media_url}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(post.status)}`}>
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
                      <span>{post.seller_name}</span>
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
                          className="flex-1 rounded-lg bg-green-100 py-2 text-sm font-medium text-green-700 hover:bg-green-200"
                        >
                          <Check className="inline h-4 w-4" /> Aprovar
                        </button>
                        <button
                          onClick={() => updateStatus(post.id, 'rejeitado')}
                          className="flex-1 rounded-lg bg-red-100 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                        >
                          <X className="inline h-4 w-4" /> Rejeitar
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deletePost(post.id)}
                      className="rounded-lg bg-zinc-100 p-2 text-zinc-700 hover:bg-zinc-200"
                    >
                      <Trash2 className="h-4 w-4" />
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
