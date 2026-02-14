'use client'

import { useState } from 'react'
import { X, Loader2, Upload, Image as ImageIcon, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface VitrineUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editPost?: {
    id: string
    title: string
    description: string | null
    price: number | null
    category: string
    contact_name: string
    contact_phone: string
    image_url: string | null
  } | null
}

export function VitrineUploadModal({ isOpen, onClose, onSuccess, editPost }: VitrineUploadModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>(editPost?.image_url || '')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    contact_name: editPost?.contact_name || '',
    contact_phone: editPost?.contact_phone || '',
    title: editPost?.title || '',
    description: editPost?.description || '',
    price: editPost?.price?.toString() || '',
    category: editPost?.category || '',
    aspect_ratio: 'square' as 'square' | 'vertical'
  })

  const categories = [
    { value: 'vaga', label: 'Vaga de Emprego', isCommercial: false },
    { value: 'informativo', label: 'Informativo', isCommercial: false },
    { value: 'servico', label: 'Serviço', isCommercial: true },
    { value: 'produto', label: 'Produto', isCommercial: true },
    { value: 'comunicado', label: 'Comunicado', isCommercial: false }
  ]

  const isCommercial = categories.find(c => c.value === formData.category)?.isCommercial ?? true

  // Placeholders dinâmicos por categoria
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

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 5MB')
      return
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo deve ser uma imagem')
      return
    }

    setImageFile(file)

    // Preview
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
        logger.error('Storage upload error:', uploadError)
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
      logger.error('Error in uploadImage:', error)
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

    if (!editPost && !imageFile) {
      toast.error('Selecione uma imagem principal')
      return
    }

    try {
      setIsLoading(true)

      let imageUrl = editPost?.image_url || ''

      // Upload nova imagem se fornecida
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
      }

      // Calcular data de expiração (48h)
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 48)

      const postData = {
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        title: formData.title,
        description: formData.description,
        price: isCommercial ? parseFloat(formData.price) : 0,
        category: formData.category,
        image_url: imageUrl,
        aspect_ratio: formData.aspect_ratio,
        expires_at: expiresAt.toISOString(),
        status: 'pendente' as const
      }

      if (editPost) {
        // Atualizar post existente
        const { error } = await supabase
          .from('vitrine_posts')
          .update(postData)
          .eq('id', editPost.id)

        if (error) throw error
        toast.success('Post atualizado com sucesso!')
      } else {
        // Criar novo post
        const { error } = await supabase
          .from('vitrine_posts')
          .insert([postData])

        if (error) throw error
        toast.success('Post criado e enviado para análise!')
      }

      onSuccess()
      onClose()
    } catch (error) {
      logger.error('Error saving post:', error)
      toast.error('Erro ao salvar post')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-0 duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {editPost ? 'Editar Post da Vitrine' : 'Novo Post na Vitrine'}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {editPost ? 'Atualize as informações do post' : 'Adicione um novo anúncio comercial (48h)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Coluna Esquerda - Imagem */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Imagem {!editPost && '*'}
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
                  <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-lg transition-colors hover:bg-zinc-50">
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
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  Formato
                </label>
                <select
                  value={formData.aspect_ratio}
                  onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value as 'square' | 'vertical' })}
                  className="input-grok mt-1 w-full"
                >
                  <option value="square">Quadrado (1:1)</option>
                  <option value="vertical">Vertical (9:16) - Estilo Reels</option>
                </select>
              </div>
            </div>

            {/* Coluna Direita - Formulário */}
            <div className="space-y-4">
              {/* Vendedor */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Nome do Vendedor *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="input-grok mt-1 w-full"
                  placeholder="Nome ou empresa"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Telefone/WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="input-grok mt-1 w-full"
                  placeholder="(11) 98765-4321"
                />
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Título do Anúncio *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-grok mt-1 w-full"
                  placeholder={placeholders.title}
                />
              </div>

              {/* Preço e Categoria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-grok mt-1 w-full"
                  >
                    <option value="">Selecione</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isCommercial && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="input-grok mt-1 w-full"
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-grok mt-1 w-full"
                  rows={3}
                  placeholder={placeholders.description}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-grok flex-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-grok flex flex-1 items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {editPost ? 'Atualizando...' : 'Criando...'}
                </>
              ) : (
                editPost ? 'Atualizar Post' : 'Criar Post'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
