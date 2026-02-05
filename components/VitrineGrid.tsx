'use client'

import { useState, useRef, useEffect } from 'react'
import { X, MessageCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface VitrinePost {
  id: string
  type: 'image' | 'video'
  mediaUrl: string
  thumbnail?: string
  title: string
  price?: string
  description: string
  sellerName: string
  sellerPhone: string
  category: string
  createdAt: string
  expiresAt: string
}

// Mock data de posts comerciais
const mockPosts: VitrinePost[] = [
  {
    id: '1',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=800&fit=crop',
    title: 'Hambúrguer Artesanal',
    price: 'R$ 25,00',
    description: 'Hambúrguer artesanal com blend da casa, queijo cheddar, bacon crocante e molho especial. Entrega no bairro!',
    sellerName: 'Burger do Jacupemba',
    sellerPhone: '5511999999001',
    category: 'Alimentos',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
    expiresAt: new Date(Date.now() + 46 * 60 * 60 * 1000).toISOString(), // expira em 46h
  },
  {
    id: '2',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop',
    title: 'Corte e Barba',
    price: 'R$ 40,00',
    description: 'Corte moderno + barba por apenas R$ 40! Agende seu horário. Atendimento de segunda a sábado.',
    sellerName: 'Barbearia Estilo',
    sellerPhone: '5511999999002',
    category: 'Serviços',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 43 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&h=800&fit=crop',
    title: 'Brigadeiros Gourmet',
    price: 'R$ 3,00 cada',
    description: 'Brigadeiros artesanais de diversos sabores! Encomende a partir de 12 unidades. Perfeito para festas!',
    sellerName: 'Doces da Vila',
    sellerPhone: '5511999999003',
    category: 'Alimentos',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 47 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=800&fit=crop',
    title: 'Conserto de Celulares',
    price: 'A partir de R$ 50',
    description: 'Conserto de telas, baterias e mais! Orçamento grátis. 20 anos de experiência.',
    sellerName: 'TechCell Jacupemba',
    sellerPhone: '5511999999004',
    category: 'Serviços',
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 38 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=800&fit=crop',
    title: 'Marmita Fitness',
    price: 'R$ 18,00',
    description: 'Marmitas saudáveis com frango, arroz integral, legumes e salada. Entrega em casa!',
    sellerName: 'Fit Food',
    sellerPhone: '5511999999005',
    category: 'Alimentos',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 45 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&h=800&fit=crop',
    title: 'Aulas de Violão',
    price: 'R$ 80,00/mês',
    description: 'Aulas particulares de violão para iniciantes e intermediários. Primeira aula grátis!',
    sellerName: 'Escola de Música JCP',
    sellerPhone: '5511999999006',
    category: 'Serviços',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 40 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=800&fit=crop',
    title: 'Sapatos Femininos',
    price: 'R$ 89,90',
    description: 'Coleção nova de sapatos femininos! Várias cores e modelos disponíveis. Venha conferir!',
    sellerName: 'Loja Passo Certo',
    sellerPhone: '5511999999007',
    category: 'Produtos',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 42 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '8',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800&h=800&fit=crop',
    title: 'Lavagem de Sofás',
    price: 'R$ 120,00',
    description: 'Lavagem profissional de sofás e estofados. Secagem rápida. Atendemos todo o Jacupemba!',
    sellerName: 'LimpaSofá Pro',
    sellerPhone: '5511999999008',
    category: 'Serviços',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 44 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '9',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=800&fit=crop',
    title: 'Pizza Caseira',
    price: 'R$ 35,00',
    description: 'Pizzas artesanais feitas no forno a lenha! Massa fina e crocante. Peça já a sua!',
    sellerName: 'Pizzaria Nonna',
    sellerPhone: '5511999999009',
    category: 'Alimentos',
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 41 * 60 * 60 * 1000).toISOString(),
  },
]

// Função para filtrar posts que ainda não expiraram
function getActivePosts(posts: VitrinePost[]) {
  const now = new Date()
  return posts.filter((post) => new Date(post.expiresAt) > now)
}

export function VitrineGrid() {
  const [selectedPost, setSelectedPost] = useState<VitrinePost | null>(null)
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({})
  
  const activePosts = getActivePosts(mockPosts)

  // Autoplay videos when they come into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target as HTMLVideoElement
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Autoplay might be blocked
            })
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
  }, [])

  function handleWhatsAppClick(post: VitrinePost) {
    const message = encodeURIComponent('Olá, vi seu post no Assistente Local e tenho interesse!')
    const whatsappUrl = `https://wa.me/${post.sellerPhone}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-zinc-200 dark:bg-zinc-900/80 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Voltar</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Vitrine do Bairro</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Produtos e serviços locais</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="hidden sm:inline">{activePosts.length} anúncios ativos</span>
                <span className="sm:hidden">{activePosts.length}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Grid Mosaico */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {activePosts.map((post) => (
            <button
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800 transition-transform hover:scale-[1.02]"
            >
              {post.type === 'image' ? (
                <img
                  src={post.mediaUrl}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <video
                    ref={(el) => {
                      videoRefs.current[post.id] = el
                    }}
                    src={post.mediaUrl}
                    poster={post.thumbnail}
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </>
              )}
              
              {/* Overlay com informações */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white font-semibold text-sm line-clamp-1">{post.title}</p>
                {post.price && (
                  <p className="text-green-400 font-bold text-xs">{post.price}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal Fullscreen */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Botão Fechar */}
          <button
            onClick={() => setSelectedPost(null)}
            className="absolute top-4 right-4 z-10 rounded-full bg-black/60 backdrop-blur-sm p-2 text-white transition-colors hover:bg-black/80"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Conteúdo */}
          <div className="relative h-full w-full">
            {selectedPost.type === 'image' ? (
              <img
                src={selectedPost.mediaUrl}
                alt={selectedPost.title}
                className="h-full w-full object-contain"
              />
            ) : (
              <video
                src={selectedPost.mediaUrl}
                poster={selectedPost.thumbnail}
                controls
                autoPlay
                loop
                className="h-full w-full object-contain"
              />
            )}

            {/* Informações sobrepostas (rodapé) */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent px-6 py-8">
              <div className="max-w-2xl mx-auto">
                {/* Categoria */}
                <div className="mb-3">
                  <span className="inline-block rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                    {selectedPost.category}
                  </span>
                </div>

                {/* Título e Preço */}
                <h2 className="text-2xl font-bold text-white mb-2">{selectedPost.title}</h2>
                {selectedPost.price && (
                  <p className="text-3xl font-bold text-green-400 mb-4">{selectedPost.price}</p>
                )}

                {/* Descrição */}
                <p className="text-white/90 text-base leading-relaxed mb-4">
                  {selectedPost.description}
                </p>

                {/* Vendedor */}
                <p className="text-white/70 text-sm mb-2">
                  Por: <span className="font-medium text-white">{selectedPost.sellerName}</span>
                </p>

                {/* Tempo restante */}
                <p className="text-white/50 text-xs">
                  Este anuncio expira em {Math.round((new Date(selectedPost.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))} horas
                </p>
              </div>
            </div>

            {/* Botao WhatsApp Flutuante */}
            <button
              onClick={() => handleWhatsAppClick(selectedPost)}
              className="absolute bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:bg-green-600 hover:scale-110"
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
