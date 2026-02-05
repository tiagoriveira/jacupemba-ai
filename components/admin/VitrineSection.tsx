'use client'

import { useState } from 'react'
import { Store, Search, Eye, Trash2, Clock, DollarSign, Plus } from 'lucide-react'

interface Post {
  id: string
  titulo: string
  preco: string
  comerciante: string
  telefone: string
  categoria: string
  tipo: 'imagem' | 'video'
  mediaUrl: string
  descricao: string
  publicadoEm: string
  expiraEm: string
  visualizacoes: number
  cliques: number
}

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    titulo: 'Pizza Margherita G',
    preco: 'R$ 35,00',
    comerciante: 'Pizzaria Bella',
    telefone: '(27) 99999-1234',
    categoria: 'Alimentos',
    tipo: 'imagem',
    mediaUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    descricao: 'Pizza fresca com mussarela e manjericao',
    publicadoEm: '2024-02-05T08:00:00',
    expiraEm: '2024-02-07T08:00:00',
    visualizacoes: 127,
    cliques: 23
  },
  {
    id: '2',
    titulo: 'Conserto de Celular',
    preco: 'A partir de R$ 50',
    comerciante: 'TechFix',
    telefone: '(27) 99888-5678',
    categoria: 'Servicos',
    tipo: 'imagem',
    mediaUrl: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400',
    descricao: 'Troca de tela, bateria e reparo em geral',
    publicadoEm: '2024-02-04T14:00:00',
    expiraEm: '2024-02-06T14:00:00',
    visualizacoes: 89,
    cliques: 15
  },
  {
    id: '3',
    titulo: 'Roupas de Inverno',
    preco: 'R$ 25 a R$ 80',
    comerciante: 'Loja da Moda',
    telefone: '(27) 99777-4321',
    categoria: 'Produtos',
    tipo: 'imagem',
    mediaUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
    descricao: 'Blusas, casacos e acessorios para o frio',
    publicadoEm: '2024-02-03T10:00:00',
    expiraEm: '2024-02-05T10:00:00',
    visualizacoes: 234,
    cliques: 41
  }
]

export function VitrineSection() {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredPosts = posts.filter(post =>
    post.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.comerciante.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este post?')) {
      setPosts(posts.filter(p => p.id !== id))
    }
  }

  const getTimeRemaining = (expiraEm: string) => {
    const now = new Date()
    const expiry = new Date(expiraEm)
    const diff = expiry.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    return hours > 0 ? `${hours}h restantes` : 'Expirado'
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-8 py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Gestao da Vitrine
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Gerencie posts comerciais da vitrine do bairro
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
            <Plus className="h-4 w-4" />
            Novo Post
          </button>
        </div>

        {/* Search */}
        <div className="relative mt-6">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar posts..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="border-b border-zinc-200 bg-white px-8 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{posts.length}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Posts Ativos</div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {posts.reduce((sum, p) => sum + p.visualizacoes, 0)}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Visualizacoes Total</div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {posts.reduce((sum, p) => sum + p.cliques, 0)}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Cliques WhatsApp</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="group overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img
                  src={post.mediaUrl}
                  alt={post.titulo}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 flex gap-2">
                  <span className="rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {post.categoria}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {post.titulo}
                    </h3>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {post.preco}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    <span>{post.comerciante}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{getTimeRemaining(post.expiraEm)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{post.visualizacoes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{post.cliques} cliques</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 rounded-lg bg-zinc-100 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                    Visualizar
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="rounded-lg bg-red-100 p-2 text-red-700 transition-colors hover:bg-red-200 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
