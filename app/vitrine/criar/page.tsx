'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Store, Camera, Phone, User, Tag, FileText, DollarSign, CheckCircle, Upload, X } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'produto', label: 'Produto', description: 'Itens à venda', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
  { value: 'servico', label: 'Serviço', description: 'Serviços oferecidos', color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' },
  { value: 'vaga', label: 'Vaga', description: 'Oportunidades de trabalho', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  { value: 'informativo', label: 'Informativo', description: 'Avisos gerais', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' },
  { value: 'comunicado', label: 'Comunicado', description: 'Comunicados importantes', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
]

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function CriarPostPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    contact_name: '',
    contact_phone: '',
    image_url: '',
  })

  // Preencher telefone salvo se existir
  useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jacupemba_lojista_phone')
      if (saved) {
        setForm(prev => ({ ...prev, contact_phone: saved }))
      }
    }
  })

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG, WEBP ou GIF')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 5MB')
      return
    }

    try {
      setUploading(true)

      // Preview local
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        updateField('image_url', data.imageUrl)
        toast.success('Imagem enviada!')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao enviar imagem')
      setImagePreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    updateField('image_url', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.category) {
      toast.error('Selecione uma categoria')
      return
    }

    const phoneDigits = form.contact_phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      toast.error('Informe um telefone válido com DDD')
      return
    }

    try {
      setSubmitting(true)

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        category: form.category,
        contact_name: form.contact_name.trim(),
        contact_phone: phoneDigits,
        image_url: form.image_url.trim() || null,
        images: form.image_url.trim() ? [form.image_url.trim()] : [],
        aspect_ratio: 'square',
      }

      const response = await fetch('/api/vitrine/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.requires_payment) {
        toast.info(`Esta categoria custa R$ ${data.category_price.toFixed(2)}. Pagamento será implementado em breve.`)
        return
      }

      if (data.success) {
        // Salvar telefone no localStorage para o painel
        localStorage.setItem('jacupemba_lojista_phone', form.contact_phone)
        setSuccess(true)
      } else {
        toast.error(data.error || 'Erro ao criar post')
      }
    } catch (error) {
      console.error('Erro ao criar post:', error)
      toast.error('Erro ao enviar post')
    } finally {
      setSubmitting(false)
    }
  }

  // Tela de sucesso
  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 rounded-full bg-green-100 p-5 dark:bg-green-900/30">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Post Enviado!
        </h1>
        <p className="mb-8 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          Seu anúncio foi enviado para aprovação. Ele ficará visível na vitrine após ser aprovado pelo administrador. Validade: 48 horas.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/painel-lojista"
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Store className="h-5 w-5" />
            Ver Meus Posts
          </Link>
          <button
            onClick={() => {
              setSuccess(false)
              setForm(prev => ({ ...prev, title: '', description: '', price: '', image_url: '' }))
            }}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-zinc-200 px-6 py-3 font-semibold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Criar Outro Anúncio
          </button>
          <Link
            href="/vitrine"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
          >
            Voltar para Vitrine
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/vitrine"
                className="flex items-center gap-1 rounded-lg px-2 py-2 text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Criar Anúncio
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Categoria */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Categoria *
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => updateField('category', cat.value)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    form.category === cat.value
                      ? `${cat.color} border-current ring-2 ring-current/20`
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                  }`}
                >
                  <span className="text-sm font-semibold">{cat.label}</span>
                  <p className="text-xs opacity-70 mt-0.5">{cat.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Info do Anunciante */}
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Seus Dados</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Nome *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={form.contact_name}
                    onChange={(e) => updateField('contact_name', e.target.value)}
                    placeholder="Seu nome"
                    className="input-grok w-full pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Telefone/WhatsApp *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="tel"
                    value={form.contact_phone}
                    onChange={(e) => updateField('contact_phone', formatPhone(e.target.value))}
                    placeholder="(27) 99999-9999"
                    className="input-grok w-full pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes do Post */}
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Detalhes do Anúncio</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Título *</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Ex: Marmitex caseiro, Corte de cabelo..."
                  className="input-grok w-full pl-10"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Descrição</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Descreva seu produto/serviço em detalhes..."
                  className="input-grok w-full pl-10 min-h-[100px] resize-none"
                  maxLength={500}
                />
              </div>
              <p className="text-xs text-zinc-400">{form.description.length}/500</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Preço (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  placeholder="0,00 (deixe vazio para 'a combinar')"
                  className="input-grok w-full pl-10"
                />
              </div>
            </div>
          </div>

          {/* Imagem */}
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Imagem</h3>
            
            {!imagePreview ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-8 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Clique para enviar imagem
                    </>
                  )}
                </button>
                <p className="mt-2 text-xs text-zinc-400 text-center">JPG, PNG, WEBP ou GIF • Máx 5MB • Qualquer tamanho</p>
              </div>
            ) : (
              <div className="relative">
                <div className="relative w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-auto object-contain max-h-96"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-110 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              <strong>Como funciona:</strong> Seu anúncio será revisado pelo administrador antes de ir ao ar.
              Após aprovação, ele fica visível por <strong>48 horas</strong>.
              {form.category && ['vaga', 'informativo'].includes(form.category)
                ? ' Categorias gratuitas permitem até 3 republicações.'
                : form.category
                  ? ` A categoria "${CATEGORIES.find(c => c.value === form.category)?.label}" requer pagamento (R$ ${form.category === 'comunicado' ? '20,00' : '15,00'}).`
                  : ''
              }
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-4 text-base font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Store className="h-5 w-5" />
                Publicar Anúncio
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  )
}
