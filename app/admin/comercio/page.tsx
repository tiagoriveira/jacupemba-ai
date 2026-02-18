'use client'

import { useRouter } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { Store, Settings, Package, ArrowLeft, LogOut, Loader2, Save, Upload, Plus, Trash2, Sparkles, TrendingUp, Star, Lock, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { VitrineUploadModal } from '@/components/admin/VitrineUploadModal'

interface Business {
    id: string
    name: string
    category: string
    description: string
    phone: string
    address: string
    hours: string
    puv?: string
    whatsapp_link?: string
    menu_link?: string
    social_link?: string
    access_token: string
    is_subscribed?: boolean
    verified?: boolean
}

interface PostStats {
    total: number
    pendentes: number
    aprovados: number
    rejeitados: number
}

interface VitrinePost {
    id: string
    title: string
    status: 'pendente' | 'aprovado' | 'rejeitado'
    image_url: string
    created_at: string
}

function MerchantPageContent() {
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [business, setBusiness] = useState<Business>({
        id: 'demo',
        name: 'Meu Negócio',
        category: 'Comércio Local',
        description: '',
        phone: '',
        address: '',
        hours: '',
        access_token: '',
        is_subscribed: false,
        verified: false
    })
    const [activeTab, setActiveTab] = useState<'info' | 'vitrine' | 'inventory' | 'analytics'>('info')
    const [postStats, setPostStats] = useState<PostStats | null>(null)
    const [statsLoading, setStatsLoading] = useState(false)
    const [posts, setPosts] = useState<VitrinePost[]>([])

    // Forms State
    const [saving, setSaving] = useState(false)
    const [postsLoading, setPostsLoading] = useState(false)

    // Vitrine Modal
    const [isVitrineModalOpen, setIsVitrineModalOpen] = useState(false)

    // Inventory AI
    const [inventoryText, setInventoryText] = useState('')
    const [processingAI, setProcessingAI] = useState(false)

    // Fetch post stats when analytics tab is active
    useEffect(() => {
        if (activeTab === 'analytics') {
            fetchPostStats()
        }
    }, [activeTab])

    const fetchPostStats = async () => {
        try {
            setStatsLoading(true)
            const { data, error } = await supabase
                .from('vitrine_posts')
                .select('status')

            if (error) {
                console.error('Error fetching post stats:', error)
                return
            }

            const posts = data || []
            setPostStats({
                total: posts.length,
                pendentes: posts.filter(p => p.status === 'pendente').length,
                aprovados: posts.filter(p => p.status === 'aprovado').length,
                rejeitados: posts.filter(p => p.status === 'rejeitado').length,
            })
        } catch (error) {
            console.error('Error fetching post stats:', error)
        } finally {
            setStatsLoading(false)
        }
    }

    const fetchBusinessPosts = async (businessId: string) => {
        try {
            setPostsLoading(true)
            const { data, error } = await supabase
                .from('vitrine_posts')
                .select('*')
                .eq('business_id', businessId)
                .order('created_at', { ascending: false })

            if (error) {
                console.warn('Could not fetch posts:', error)
            } else {
                setPosts(data || [])
            }
        } finally {
            setPostsLoading(false)
        }
    }

    const handleUpdateInfo = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!business) return

        try {
            setSaving(true)
            const { error } = await supabase
                .from('local_businesses')
                .update({
                    name: business.name,
                    category: business.category,
                    description: business.description,
                    phone: business.phone,
                    address: business.address,
                    hours: business.hours,
                    puv: business.puv,
                    whatsapp_link: business.whatsapp_link,
                    menu_link: business.menu_link,
                    social_link: business.social_link
                })
                .eq('id', business.id)

            if (error) throw error
            toast.success('Informações atualizadas com sucesso!')
        } catch (error) {
            console.error('Update error:', error)
            toast.error('Erro ao atualizar informações')
        } finally {
            setSaving(false)
        }
    }

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Tem certeza que deseja excluir este post?')) return
        try {
            const { error } = await supabase
                .from('vitrine_posts')
                .delete()
                .eq('id', postId)
            if (error) throw error
            toast.success('Post excluído com sucesso!')
            if (business) fetchBusinessPosts(business.id)
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Erro ao excluir post')
        }
    }

    const handleAIProcessing = async () => {
        if (!inventoryText.trim()) return

        setProcessingAI(true)
        setTimeout(() => {
            setProcessingAI(false)
            toast.success('Inventário processado com sucesso! (Simulação)')
            setInventoryText('')
        }, 2000)
    }


    return (
        <>
            <Toaster position="top-right" richColors />
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
                <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
                    <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 rounded-xl flex items-center justify-center text-white dark:text-zinc-900 font-bold shadow-sm">
                                {business.name.charAt(0)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">{business.name}</h1>
                                    {business.is_subscribed && (
                                        <span className="badge-grok bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700 flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-current" />
                                            Premium
                                        </span>
                                    )}
                                    {business.verified && (
                                        <span className="badge-grok bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                            Verificado
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Painel do Parceiro</p>
                            </div>
                        </div>
                        <Link href="/" className="btn-grok text-xs bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 flex items-center gap-1">
                            Sair
                            <LogOut className="h-3 w-3" />
                        </Link>
                    </div>
                </header>

                <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="max-w-5xl mx-auto px-4 flex gap-6 overflow-x-auto">
                        {[
                            { id: 'info', label: 'Meu Negócio', icon: Settings },
                            { id: 'analytics', label: 'Desempenho', icon: TrendingUp },
                            { id: 'vitrine', label: 'Vitrine', icon: Store },
                            { id: 'inventory', label: 'Cardápio IA', icon: Package },
                        ].map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                                        : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <main className="max-w-5xl mx-auto px-4 py-8">
                    {activeTab === 'info' && (
                        <form onSubmit={handleUpdateInfo} className="max-w-2xl space-y-6">
                            <div className="card-grok p-6 space-y-6">
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Informações Básicas</h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome do Negócio</label>
                                        <input
                                            required
                                            value={business.name}
                                            onChange={e => setBusiness({ ...business, name: e.target.value })}
                                            className="input-grok w-full"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Categoria</label>
                                        <input
                                            required
                                            value={business.category}
                                            onChange={e => setBusiness({ ...business, category: e.target.value })}
                                            className="input-grok w-full"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Diferencial (PUV)</label>
                                    <textarea
                                        value={business.puv || ''}
                                        onChange={e => setBusiness({ ...business, puv: e.target.value })}
                                        placeholder="O que torna seu negócio único?"
                                        className="input-grok w-full min-h-[80px]"
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Telefone/WhatsApp</label>
                                        <input
                                            value={business.phone || ''}
                                            onChange={e => setBusiness({ ...business, phone: e.target.value })}
                                            className="input-grok w-full"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Horário de Funcionamento</label>
                                        <input
                                            value={business.hours || ''}
                                            onChange={e => setBusiness({ ...business, hours: e.target.value })}
                                            placeholder="Ex: Seg-Sex 08h-18h"
                                            className="input-grok w-full"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Endereço Completo</label>
                                    <input
                                        value={business.address || ''}
                                        onChange={e => setBusiness({ ...business, address: e.target.value })}
                                        className="input-grok w-full"
                                    />
                                </div>
                            </div>

                            <div className="card-grok p-6 space-y-6">
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Links Externos</h2>
                                <div className="grid gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Link do WhatsApp</label>
                                        <input
                                            value={business.whatsapp_link || ''}
                                            onChange={e => setBusiness({ ...business, whatsapp_link: e.target.value })}
                                            placeholder="https://wa.me/..."
                                            className="input-grok w-full"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Link do Cardápio/Catálogo</label>
                                        <input
                                            value={business.menu_link || ''}
                                            onChange={e => setBusiness({ ...business, menu_link: e.target.value })}
                                            placeholder="https://..."
                                            className="input-grok w-full"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Instagram/Rede Social</label>
                                        <input
                                            value={business.social_link || ''}
                                            onChange={e => setBusiness({ ...business, social_link: e.target.value })}
                                            placeholder="https://instagram.com/..."
                                            className="input-grok w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-grok flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 px-8"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Salvar Alterações
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Desempenho da Vitrine</h2>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Acompanhe seus anúncios na plataforma</p>
                            </div>

                            {statsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                                </div>
                            ) : postStats ? (
                                <div className="space-y-6">
                                    {/* Card Principal - Total */}
                                    <div className="card-grok p-8 bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-zinc-400">Total de Posts</p>
                                                <p className="text-5xl font-bold text-white mt-2">{postStats.total}</p>
                                                <p className="text-xs text-zinc-500 mt-2">Todos os anúncios criados</p>
                                            </div>
                                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                                                <Store className="h-8 w-8 text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cards de Status */}
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="card-grok p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Pendentes</p>
                                                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{postStats.pendentes}</p>
                                                </div>
                                                <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-grok p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Aprovados</p>
                                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{postStats.aprovados}</p>
                                                </div>
                                                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-grok p-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Rejeitados</p>
                                                    <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{postStats.rejeitados}</p>
                                                </div>
                                                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Barra de Aprovação */}
                                    {postStats.total > 0 && (
                                        <div className="card-grok p-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Taxa de Aprovação</h3>
                                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                                    {Math.round((postStats.aprovados / postStats.total) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all duration-500"
                                                    style={{ width: `${(postStats.aprovados / postStats.total) * 100}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                                                {postStats.aprovados} de {postStats.total} posts aprovados
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="card-grok p-12 text-center">
                                    <TrendingUp className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                                    <p className="text-zinc-600 dark:text-zinc-400 font-medium">Nenhum post encontrado</p>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">Crie seu primeiro anúncio para ver as métricas aqui.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'vitrine' && (
                        <div className="space-y-6">
                            {!business.is_subscribed ? (
                                <div className="card-grok p-8 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                                        <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Funcionalidade Premium</h3>
                                    <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto mb-6">
                                        A Vitrine é exclusiva para parceiros assinantes. Publique produtos e serviços que alcançam toda a comunidade do Jacupemba!
                                    </p>
                                    <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700">
                                        <Star className="h-5 w-5 text-amber-600 dark:text-amber-400 fill-current" />
                                        <span className="font-semibold text-amber-900 dark:text-amber-300">Fale com o Administrador para Ativar</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Minha Vitrine</h2>
                                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Gerencie seus anúncios ativos na plataforma.</p>
                                        </div>
                                        <button
                                            onClick={() => setIsVitrineModalOpen(true)}
                                            className="btn-grok flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Criar Novo Post
                                        </button>
                                    </div>

                                    <VitrineUploadModal
                                        isOpen={isVitrineModalOpen}
                                        onClose={() => setIsVitrineModalOpen(false)}
                                        onSuccess={() => fetchBusinessPosts(business.id)}
                                    />

                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {posts.length === 0 ? (
                                            <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl">
                                                <Store className="h-12 w-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                                                <p className="text-zinc-500 dark:text-zinc-400 font-medium">Nenhum post ativo</p>
                                                <p className="text-sm text-zinc-400 dark:text-zinc-500">Crie seu primeiro anúncio para aparecer na vitrine!</p>
                                            </div>
                                        ) : (
                                            posts.map(post => (
                                                <div key={post.id} className="card-grok overflow-hidden flex flex-col">
                                                    <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative">
                                                        {post.image_url ? (
                                                            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-full text-zinc-300 dark:text-zinc-600">
                                                                <Store className="h-8 w-8" />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-2 right-2">
                                                            <span className={`badge-grok ${post.status === 'aprovado' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                post.status === 'rejeitado' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                                }`}>
                                                                {post.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 flex-1">
                                                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{post.title}</h3>

                                                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                                                            Criado em {new Date(post.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                                                        <button onClick={() => handleDeletePost(post.id)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors" title="Excluir">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="max-w-3xl">
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900 rounded-2xl p-8 text-center space-y-6">
                                <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm flex items-center justify-center mx-auto">
                                    <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Atualização Inteligente</h2>
                                    <p className="text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
                                        Não perca tempo cadastrando produtos um por um. Cole seu cardápio abaixo ou envie uma foto e nossa IA fará o resto.
                                    </p>
                                </div>
                                <div className="card-grok p-4 text-left">
                                    <textarea
                                        value={inventoryText}
                                        onChange={(e) => setInventoryText(e.target.value)}
                                        placeholder="Cole aqui a lista de produtos, preços e descrições..."
                                        className="w-full h-40 resize-none border-0 focus:ring-0 text-sm p-0 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-transparent dark:text-zinc-100"
                                    />
                                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex items-center justify-between">
                                        <button className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                                            <Upload className="h-4 w-4" />
                                            Anexar Arquivo (PDF/Img)
                                        </button>
                                        <button
                                            onClick={handleAIProcessing}
                                            disabled={processingAI || !inventoryText.trim()}
                                            className="btn-grok flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed px-6"
                                        >
                                            {processingAI ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Processando...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="h-4 w-4" />
                                                    Processar com IA
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                    * A IA pode levar alguns segundos para estruturar seus dados. Você poderá revisar antes de publicar.
                                </p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    )
}

export default function MerchantPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-zinc-50">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        }>
            <MerchantPageContent />
        </Suspense>
    )
}
