'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2, Upload, Image as ImageIcon, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'vaga', label: 'Vaga de Emprego', isCommercial: false },
  { value: 'informativo', label: 'Informativo', isCommercial: false },
  { value: 'servico', label: 'Serviço', isCommercial: true },
  { value: 'produto', label: 'Produto', isCommercial: true },
  { value: 'comunicado', label: 'Comunicado', isCommercial: false }
]

const CATEGORY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  vaga: { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', icon: '💼' },
  informativo: { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300', icon: 'ℹ️' },
  servico: { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', icon: '🔧' },
  produto: { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-700 dark:text-green-300', icon: '📦' },
  comunicado: { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', icon: '📢' }
}

export default function CriarAnuncioPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    contact_name: '',
    contact_phone: '',
    title: '',
    description: '',
    price: '',
    category: 'produto',
    aspect_ratio: 'square' as 'square' | 'vertical'
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  const selectedCategory = CATEGORIES.find(c => c.value === formData.category)
  const isCommercial = selectedCategory?.isCommercial ?? true
  const categoryColor = CATEGORY_COLORS[formData.category] || CATEGORY_COLORS.produto

  const getPlaceholders = () => {
    switch (formData.category) {
      case 'vaga':
        return {
          title: 'Ex: Vaga para Vendedor - Loja de Roupas',
          description: 'Requisitos, horário, salário, benefícios...'
        }
      case 'informativo':
        return {
          title: 'Ex: Campanha de Vacinação no Posto de Saúde',
          description: 'Informações importantes para a comunidade...'
        }
      case 'servico':
        return {
          title: 'Ex: Conserto de Celulares - Especialista em iPhone',
          description: 'Detalhes do serviço oferecido, garantia, tempo de execução...'
        }
      case 'produto':
        return {
          title: 'Ex: iPhone 13 Pro Max 256GB',
          description: 'Estado do produto, acessórios inclusos, garantia...'
        }
      case 'comunicado':
        return {
          title: 'Ex: Festa Junina da Comunidade - Dia 24/06',
          description: 'Data, horário, local e outras informações...'
        }
      default:
        return {
          title: 'Ex: Título do anúncio',
          description: 'Detalhes do produto ou serviço...'
        }
    }
  }

  const placeholders = getPlaceholders()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo deve ser uma imagem')
      return
    }

    setImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `vitrine/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) {
        // Fallback: converter para base64
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve(reader.result as string)
          }
          reader.readAsDataURL(file)
        })
      }

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      // Fallback: converter para base64
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result as string)
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.contact_name || !formData.contact_phone) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    if (isCommercial && !formData.price) {
      toast.error('Preço é obrigatório para produtos/serviços')
      return
    }

    if (!imageFile) {
      toast.error('Selecione uma imagem principal')
      return
    }

    try {
      setLoading(true)

      let imageUrl = ''

      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 48)

      const postData = {
        user_id: user?.id,
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        title: formData.title,
        description: formData.description,
        price: isCommercial ? parseFloat(formData.price) : 0,
        category: formData.category,
        image_url: imageUrl,
        aspect_ratio: formData.aspect_ratio,
        expires_at: expiresAt.toISOString(),
        status: 'pendente'
      }

      const { error } = await supabase
        .from('vitrine_posts')
        .insert([postData])

      if (error) throw error

      toast.success('Anúncio criado e enviado para análise!')
      
      setTimeout(() => {
        router.push('/painel-lojista')
      }, 1500)
    } catch (error) {
      console.error('Erro ao salvar post:', error)
      toast.error('Erro ao criar anúncio')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="mx-auto max-w-5xl px-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/painel-lojista"
                className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Criar Novo Anúncio
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Preencha os detalhes do seu anúncio
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-4xl px-4 py-8">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Coluna Esquerda - Imagem */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Imagem Principal *
                </label>

                <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-400">
                      <ImageIcon className="h-12 w-12" />
                      <p className="text-sm">Nenhuma imagem selecionada</p>
                    </div>
                  )}

                  <label className="absolute bottom-4 left-1/2 -translate-x-1/2 cursor-pointer">
                    <div className="flex items-center gap-2 rounded-lg bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 shadow-lg transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800">
                      <Upload className="h-4 w-4" />
                      {imagePreview ? 'Trocar Imagem' : 'Selecionar Imagem'}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Formato
                  </label>
                  <select
                    value={formData.aspect_ratio}
                    onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value as 'square' | 'vertical' })}
                    className="w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition-all focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100"
                  >
                    <option value="square">Quadrado (1:1)</option>
                    <option value="vertical">Vertical (9:16) - Estilo Reels</option>
                  </select>
                </div>
              </div>

              {/* Coluna Direita - Formulário */}
              <div className="space-y-5">
                {/* Nome do Vendedor */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Seu Nome / Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
                    placeholder="Nome ou empresa"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
                    placeholder="(11) 98765-4321"
                  />
                </div>

                {/* Título */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Título do Anúncio *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
                    placeholder={placeholders.title}
                  />
                </div>

                {/* Categoria e Preço */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      Categoria *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition-all focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isCommercial && (
                    <div>
                      <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        Preço (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="mt-8">
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full min-h-[120px] rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100"
                placeholder={placeholders.description}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Descreva bem seu produto/serviço para atrair mais clientes
              </p>
            </div>

            {/* Info Box */}
            <div className="mt-8 rounded-xl border-2 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/50 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-semibold mb-1">Informações Importantes</p>
                <ul className="space-y-1 text-xs opacity-90">
                  <li>• Seu anúncio ficará ativo por 48 horas</li>
                  <li>• Será revisado por um moderador antes de aparecer</li>
                  <li>• Você poderá republicar após expirar</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-8">
              <Link
                href="/painel-lojista"
                className="flex-1 flex items-center justify-center rounded-xl border-2 border-zinc-200 dark:border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98]"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-5 py-3 text-sm font-semibold text-white dark:text-zinc-900 transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando Anúncio...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Criar Anúncio
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </>
  )
}
