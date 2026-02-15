'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Loader2, Store, Plus, RefreshCw, Trash2, Clock, AlertCircle, CheckCircle, XCircle, LogOut } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import Link from 'next/link'
import { AuthModal } from '@/components/AuthModal'

interface Post {
  id: string
  title: string
  description: string
  price: number
  category: string
  image_url: string
  images: string[]
  status: 'pendente' | 'aprovado' | 'rejeitado'
  expires_at: string
  created_at: string
  is_paid: boolean
  repost_count: number
  max_reposts: number
  is_expired: boolean
  is_active: boolean
  hours_remaining: number
  can_repost: boolean
  repost_limit_reached: boolean
}

const CATEGORY_LABELS = {
  produto: 'Produto',
  servico: 'Serviço',
  comunicado: 'Comunicado',
  vaga: 'Vaga',
  informativo: 'Informativo',
}

const CATEGORY_COLORS = {
  produto: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  servico: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  comunicado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  vaga: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  informativo: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export default function PainelLojistaPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      setShowAuthModal(true)
    } else if (user) {
      fetchPosts()
    }
  }, [user, authLoading])

  const fetchPosts = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/vitrine/my-posts?user_id=${user.id}`)
      const data = await response.json()

      if (data.success) {
        setPosts(data.posts)
      } else {
        toast.error('Erro ao carregar posts')
      }
    } catch (error) {
      console.error('Erro ao buscar posts:', error)
      toast.error('Erro ao carregar posts')
    } finally {
      setLoading(false)
    }
  }

  const handleRepost = async (post: Post) => {
    if (!user) return

    try {
      const response = await fetch('/api/vitrine/repost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          user_id: user.id,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Post republicado com sucesso!')
        fetchPosts()
      } else if (data.requires_payment) {
        toast.info('Este post requer pagamento para republicação')
        // Redirecionar para checkout Asaas
        // TODO: Implementar modal de pagamento
      } else {
        toast.error(data.error || 'Erro ao republicar post')
      }
    } catch (error) {
      console.error('Erro ao republicar:', error)
      toast.error('Erro ao republicar post')
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return

    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('vitrine_posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      toast.success('Post excluído com sucesso!')
      fetchPosts()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir post')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => router.push('/')}
          onSuccess={() => {
            setShowAuthModal(false)
            fetchPosts()
          }}
        />
      </>
    )
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Painel do Lojista
                  </h1>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Voltar
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Seus Posts
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Gerencie seus anúncios na vitrine
              </p>
            </div>
            <Link
              href="/vitrine/criar"
              className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus className="h-4 w-4" />
              Criar Post
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 py-20 dark:border-zinc-800">
              <Store className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
              <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Nenhum post criado ainda
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                Crie seu primeiro anúncio para aparecer na vitrine
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
                    {post.image_url || (post.images && post.images.length > 0) ? (
                      <img
                        src={post.image_url || post.images[0]}
                        alt={post.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Store className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute right-2 top-2">
                      {post.status === 'aprovado' && post.is_active ? (
                        <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </span>
                      ) : post.status === 'pendente' ? (
                        <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Clock className="h-3 w-3" />
                          Pendente
                        </span>
                      ) : post.status === 'rejeitado' ? (
                        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <XCircle className="h-3 w-3" />
                          Rejeitado
                        </span>
                      ) : post.is_expired ? (
                        <span className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                          <AlertCircle className="h-3 w-3" />
                          Expirado
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[post.category as keyof typeof CATEGORY_COLORS]}`}>
                        {CATEGORY_LABELS[post.category as keyof typeof CATEGORY_LABELS]}
                      </span>
                      {!post.is_paid && (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {post.repost_count}/{post.max_reposts} republicações
                        </span>
                      )}
                    </div>

                    <h3 className="mb-1 font-bold text-zinc-900 dark:text-zinc-100">
                      {post.title}
                    </h3>

                    {post.price > 0 && (
                      <p className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                        R$ {post.price.toFixed(2)}
                      </p>
                    )}

                    {post.is_active && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Expira em {post.hours_remaining}h
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      {post.can_repost && (
                        <button
                          onClick={() => handleRepost(post)}
                          disabled={post.repost_limit_reached}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                          <RefreshCw className="h-3 w-3" />
                          {post.repost_limit_reached ? 'Limite Atingido' : 'Republicar'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="flex items-center justify-center rounded-lg border border-zinc-200 p-2 text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  )
}
