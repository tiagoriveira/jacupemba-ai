'use client'

import { useState } from 'react'
import { X, Loader2, Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface VitrineUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editPost?: {
    id: string
    title: string
    description: string
    price: number
    category: string
    contact_name: string
    contact_phone: string
    image_url: string
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
    category: editPost?.category || ''
  })

  const categories = [
    'Eletronicos',
    'Moveis',
    'Roupas',
    'Alimentos',
    'Servicos',
    'Veiculos',
    'Imoveis',
    'Outro'
  ]

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
        console.error('Storage upload error:', uploadError)
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
      console.error('Error in uploadImage:', error)
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
    
    if (!formData.title || !formData.price || !formData.contact_name || !formData.contact_phone) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (!editPost && !imageFile) {
      toast.error('Selecione uma imagem')
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
        price: parseFloat(formData.price),
        category: formData.category,
        image_url: imageUrl,
        expires_at: expiresAt.toISOString(),
        status: 'aprovado' as const
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
        toast.success('Post criado com sucesso!')
      }
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error('Erro ao salvar post')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white p-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">
              {editPost ? 'Editar Post da Vitrine' : 'Novo Post na Vitrine'}
            </h2>
            <p className="text-sm text-zinc-600">
              {editPost ? 'Atualize as informações do post' : 'Adicione um novo anúncio comercial (48h)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Coluna Esquerda - Imagem */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-zinc-900">
                Imagem {!editPost && '*'}
              </label>
              
              <div className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50">
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
              
              <p className="text-xs text-zinc-500">
                Imagens JPG, PNG ou WebP. Máximo 5MB.
              </p>
            </div>

            {/* Coluna Direita - Formulário */}
            <div className="space-y-4">
              {/* Vendedor */}
              <div>
                <label className="block text-sm font-medium text-zinc-900">
                  Nome do Vendedor *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                  placeholder="Nome ou empresa"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-zinc-900">
                  Telefone/WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                  placeholder="(11) 98765-4321"
                />
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-zinc-900">
                  Título do Anúncio *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                  placeholder="Ex: iPhone 13 Pro Max"
                />
              </div>

              {/* Preço e Categoria */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-900">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-900">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                  >
                    <option value="">Selecione</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-zinc-900">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                  rows={3}
                  placeholder="Detalhes do produto ou serviço..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3 border-t border-zinc-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
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
