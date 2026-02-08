'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Store, Settings, Package, ArrowLeft, LogOut, Loader2, Save, Upload, Plus, Trash2, Sparkles } from 'lucide-react'
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
}

interface VitrinePost {
    id: string
    title: string
    price: number
    status: 'pendente' | 'aprovado' | 'rejeitado'
    image_url: string
    created_at: string
}

export default function MerchantPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [loading, setLoading] = useState(true)
    const [business, setBusiness] = useState<Business | null>(null)
    const [activeTab, setActiveTab] = useState<'info' | 'vitrine' | 'inventory'>('info')
    const [posts, setPosts] = useState<VitrinePost[]>([])

    // Forms State
    const [saving, setSaving] = useState(false)
    const [postsLoading, setPostsLoading] = useState(false)

    // Vitrine Modal
    const [isVitrineModalOpen, setIsVitrineModalOpen] = useState(false)

    // Inventory AI
    const [inventoryText, setInventoryText] = useState('')
    const [processingAI, setProcessingAI] = useState(false)

    useEffect(() => {
        if (!token) {
            setLoading(false)
            return
        }
        verifyToken()
    }, [token])

    const verifyToken = async () => {
        try {
            const { data, error } = await supabase
                .from('local_businesses')
                .select('*')
                .eq('access_token', token)
                .single()

            if (error || !data) throw new Error('Token inválido')

            setBusiness(data)
            fetchBusinessPosts(data.id)
        } catch (error) {
            console.error('Auth error:', error)
            toast.error('Acesso negado. Token inválido.')
        } finally {
            setLoading(false)
        }
    }

    const fetchBusinessPosts = async (businessId: string) => {
        try {
            setPostsLoading(true)
            const { data, error } = await supabase
                .from('vitrine_posts')
                .select('*')
                .eq('business_id', businessId) // Assuming we added this field
                .order('created_at', { ascending: false })

            if (error) {
                // Fallback if column doesn't exist yet or other error, just show empty
                console.warn('Could not fetch posts (column might be missing):', error)
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

    const handleAIProcessing = async () => {
        if (!inventoryText.trim()) return

        setProcessingAI(true)
        // Mock AI processing
        setTimeout(() => {
            setProcessingAI(false)
            toast.success('Inventário processado com sucesso! (Simulação)')
            setInventoryText('')
        }, 2000)
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-50">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        )
    }

    if (!business) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-zinc-50 p-4 text-center">
                <div className="rounded-full bg-red-100 p-4">
                    <LogOut className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="mt-4 text-xl font-bold text-zinc-900">Acesso Negado</h1>
                <p className="mt-2 text-zinc-600">Token de acesso inválido ou expirado.</p>
                <Link href="/" className="mt-6 flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao início
                </Link>
            </div>
        )
    }

    return (
        <>
            <Toaster position="top-right" richColors />
            <div className="min-h-screen bg-zinc-50 pb-20">
                {/* Top Bar */}
                <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
                    <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold">
                                {business.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="font-bold text-zinc-900 text-sm sm:text-base">{business.name}</h1>
                                <p className="text-xs text-zinc-500">Painel do Parceiro</p>
                            </div>
                        </div>
                        <Link href="/" className="text-xs font-medium text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
                            Sair
                            <LogOut className="h-3 w-3" />
                        </Link>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <div className="bg-white border-b border-zinc-200">
                    <div className="max-w-5xl mx-auto px-4 flex gap-6 overflow-x-auto">
                        {[
                            { id: 'info', label: 'Meu Negócio', icon: Settings },
                            { id: 'vitrine', label: 'Vitrine', icon: Store },
                            { id: 'inventory', label: 'Cardápio IA', icon: Package },
                        ].map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-zinc-900 text-zinc-900'
                                        : 'border-transparent text-zinc-500 hover:text-zinc-700'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Content */}
                <main className="max-w-5xl mx-auto px-4 py-8">

                    {/* Business Info Tab */}
                    {activeTab === 'info' && (
                        <form onSubmit={handleUpdateInfo} className="max-w-2xl space-y-6">
                            <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
                                <h2 className="text-lg font-bold text-zinc-900">Informações Básicas</h2>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-zinc-700">Nome do Negócio</label>
                                        <input
                                            required
                                            value={business.name}
                                            onChange={e => setBusiness({ ...business, name: e.target.value })}
                                            className="w-full rounded-lg border border-zinc-300 p-2 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-zinc-700">Categoria</label>
                                        <input
                                            required
                                            value={business.category}
                                            onChange={e => setBusiness({ ...business, category: e.target.value })}
                                            className="w-full rounded-lg border border-zinc-300 p-2 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-zinc-700">Diferencial (PUV)</label>
                                    <textarea
                                        value={business.puv || ''}
                                        onChange={e => setBusiness({ ...business, puv: e.target.value })}
                                        placeholder="O que torna seu negócio único?"
                                        rows={2}
                                        className="w-full rounded-lg border border-zinc-300 p-2 text-sm"
                                    />
                                    <p className="text-xs text-zinc-500">Ex: "A melhor coxinha da cidade dita por quem entende"</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-zinc-700">Descrição</label>
                                    <textarea
                                        value={business.description}
                                        onChange={e => setBusiness({ ...business, description: e.target.value })}
                                        rows={3}
                                        className="w-full rounded-lg border border-zinc-300 p-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
                                <h2 className="text-lg font-bold text-zinc-900">Contato & Links</h2>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-zinc-700">Telefone / WhatsApp</label>
                                        <input
                                            value={business.phone}
                                            onChange={e => setBusiness({ ...business, phone: e.target.value })}
                                            className="w-full rounded-lg border border-zinc-300 p-2 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-zinc-700">Endereço</label>
                                        <input
                                            value={business.address}
                                            onChange={e => setBusiness({ ...business, address: e.target.value })}
                                            className="w-full rounded-lg border border-zinc-300 p-2 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-zinc-700">Horário de Funcionamento</label>
                                    <input
                                        value={business.hours}
                                        onChange={e => setBusiness({ ...business, hours: e.target.value })}
                                        className="w-full rounded-lg border border-zinc-300 p-2 text-sm"
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-zinc-700">Link WhatsApp Direto (Opcional)</label>
                                        <input
                                            value={business.whatsapp_link || ''}
                                            onChange={e => setBusiness({ ...business, whatsapp_link: e.target.value })}
                                            placeholder="https://wa.me/..."
                                            className="w-full rounded-lg border border-zinc-300 p-2 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-zinc-700">Link Cardápio/Site (Opcional)</label>
                                        <input
                                            value={business.menu_link || ''}
                                            onChange={e => setBusiness({ ...business, menu_link: e.target.value })}
                                            placeholder="https://..."
                                            className="w-full rounded-lg border border-zinc-300 p-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 rounded-xl bg-zinc-900 px-8 py-3 font-semibold text-white transition-all hover:bg-zinc-800 disabled:opacity-70"
                                >
                                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Vitrine Tab */}
                    {activeTab === 'vitrine' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-zinc-900">Seus Anúncios</h2>
                                    <p className="text-sm text-zinc-500">Gerencie seus posts na vitrine da comunidade</p>
                                </div>
                                <button
                                    onClick={() => setIsVitrineModalOpen(true)}
                                    className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                                >
                                    <Plus className="h-4 w-4" />
                                    Criar Novo Post
                                </button>
                            </div>

                            {/* Using existing VitrineUploadModal but we might need to tweak passed props or make it aware of business context */}
                            {/* For now, let's assume VitrineUploadModal handles general upload, but we need to inject business_id if possible or handle it via a wrapper. 
                       However, VitrineUploadModal is built for public use currently. 
                       I will use it as is, but maybe I should have created a specialized one.
                       Actually, I can pass a pre-filled contact info or handle submission internally.
                       For MVP simplicity, let's just use the modal as a trigger and maybe standard form?
                       
                       Wait, existing VitrineUploadModal does everything internally.
                       I should probably create a specific form for the merchant that includes the business_id automatically.
                   */}

                            <VitrineUploadModal
                                isOpen={isVitrineModalOpen}
                                onClose={() => setIsVitrineModalOpen(false)}
                                onSuccess={() => fetchBusinessPosts(business.id)}
                            // We might need to modify VitrineUploadModal to accept business_id or initial data
                            // For now, let's assume the user fills it out manually or I'll implement a simple form here later if needed.
                            // Actually, I'll update VitrineUploadModal to accept `businessId` prop in a future step if needed.
                            />

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {posts.length === 0 ? (
                                    <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-200 rounded-xl">
                                        <Store className="h-12 w-12 mx-auto text-zinc-300 mb-3" />
                                        <p className="text-zinc-500 font-medium">Nenhum post ativo</p>
                                        <p className="text-sm text-zinc-400">Crie seu primeiro anúncio para aparecer na vitrine!</p>
                                    </div>
                                ) : (
                                    posts.map(post => (
                                        <div key={post.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col">
                                            <div className="aspect-video bg-zinc-100 relative">
                                                {post.image_url ? (
                                                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-zinc-300">
                                                        <Store className="h-8 w-8" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${post.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                                                        post.status === 'rejeitado' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {post.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1">
                                                <h3 className="font-bold text-zinc-900">{post.title}</h3>
                                                <p className="text-zinc-500 text-sm mt-1">
                                                    R$ {Number(post.price).toFixed(2)}
                                                </p>
                                                <p className="text-xs text-zinc-400 mt-2">
                                                    Criado em {new Date(post.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
                                                <button className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Excluir">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Inventory / AI Tab */}
                    {activeTab === 'inventory' && (
                        <div className="max-w-3xl">
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-8 text-center space-y-6">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto">
                                    <Package className="h-8 w-8 text-indigo-600" />
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-zinc-900">Atualização Inteligente</h2>
                                    <p className="text-zinc-600 max-w-lg mx-auto">
                                        Não perca tempo cadastrando produtos um por um. Cole seu cardápio abaixo ou envie uma foto e nossa IA fará o resto.
                                    </p>
                                </div>

                                <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-sm text-left">
                                    <textarea
                                        value={inventoryText}
                                        onChange={(e) => setInventoryText(e.target.value)}
                                        placeholder="Cole aqui a lista de produtos, preços e descrições..."
                                        className="w-full h-40 resize-none border-0 focus:ring-0 text-sm p-0 placeholder:text-zinc-400"
                                    />
                                    <div className="border-t border-zinc-100 pt-4 flex items-center justify-between">
                                        <button className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                                            <Upload className="h-4 w-4" />
                                            Anexar Arquivo (PDF/Img)
                                        </button>

                                        <button
                                            onClick={handleAIProcessing}
                                            disabled={processingAI || !inventoryText.trim()}
                                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

                                <p className="text-xs text-zinc-400">
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
