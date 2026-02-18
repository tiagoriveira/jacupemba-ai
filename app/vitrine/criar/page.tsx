'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Store, Camera, Phone, User, Tag, FileText, CheckCircle, Upload, X, Sparkles, Gift } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import Link from 'next/link'
import { PaymentModal } from '@/components/PaymentModal'

const CATEGORIES = [
  { value: 'produto', label: 'Produto', description: 'Itens à venda' },
  { value: 'servico', label: 'Serviço', description: 'Serviços oferecidos' },
  { value: 'vaga', label: 'Vaga', description: 'Oportunidades de trabalho' },
  { value: 'informativo', label: 'Informativo', description: 'Avisos gerais' },
  { value: 'comunicado', label: 'Comunicado', description: 'Comunicados importantes' },
]

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const MAX_IMAGES = 5
const MAX_VIDEOS = 1
const MAX_TITLE = 80
const MAX_DESC = 300

export default function CriarPostPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<{ preview: string; url: string }[]>([])
  const [video, setVideo] = useState<{ preview: string; url: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentPostData, setPaymentPostData] = useState<Record<string, any> | null>(null)
  const [isFirstPost, setIsFirstPost] = useState<boolean | null>(null)
  const [checkingFirstPost, setCheckingFirstPost] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    contact_name: '',
    contact_phone: '',
  })

  // Preencher telefone salvo + verificar primeiro post
  useEffect(() => {
    const saved = localStorage.getItem('jacupemba_lojista_phone')
    if (saved) {
      setForm(prev => ({ ...prev, contact_phone: saved }))
      checkFirstPost(saved)
    }
  }, [])


  const checkFirstPost = async (phone: string) => {
    setCheckingFirstPost(true)
    try {
      const res = await fetch(`/api/vitrine/check-first-post?phone=${encodeURIComponent(phone)}`)
      const data = await res.json()
      setIsFirstPost(data.is_first_post)
    } catch {
      setIsFirstPost(null)
    } finally {
      setCheckingFirstPost(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    // Re-verificar primeiro post quando telefone muda (11 dígitos completos)
    if (field === 'contact_phone') {
      const digits = value.replace(/\D/g, '')
      if (digits.length === 11) {
        checkFirstPost(digits)
      }
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remaining = MAX_IMAGES - images.length
    if (remaining <= 0) {
      toast.error(`Máximo de ${MAX_IMAGES} imagens`)
      return
    }

    const filesToUpload = files.slice(0, remaining)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

    for (const file of filesToUpload) {
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name}: formato inválido`)
        continue
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: máximo 5MB`)
        continue
      }

      try {
        setUploading(true)

        // Preview local
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })

        // Upload para Supabase Storage
        const formData = new FormData()
        formData.append('image', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (data.success) {
          setImages(prev => [...prev, { preview, url: data.imageUrl }])
        } else {
          throw new Error(data.error)
        }
      } catch (error) {
        console.error('Erro no upload:', error)
        toast.error(`Erro ao enviar ${file.name}`)
      } finally {
        setUploading(false)
      }
    }

    // Limpar input para permitir re-upload do mesmo arquivo
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use: MP4, WebM ou MOV')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Vídeo muito grande. Máximo: 50MB')
      return
    }

    try {
      setUploading(true)

      // Preview local
      const preview = URL.createObjectURL(file)

      // Upload para Supabase Storage
      const formData = new FormData()
      formData.append('video', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setVideo({ preview, url: data.videoUrl })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro no upload do vídeo:', error)
      toast.error('Erro ao enviar vídeo')
    } finally {
      setUploading(false)
    }

    // Limpar input
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  const removeVideo = () => {
    if (video?.preview) {
      URL.revokeObjectURL(video.preview)
    }
    setVideo(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.category) {
      toast.error('Selecione uma categoria')
      return
    }

    if (!form.title.trim()) {
      toast.error('Informe o título do anúncio')
      return
    }

    if (!form.contact_name.trim()) {
      toast.error('Informe seu nome')
      return
    }

    const phoneDigits = form.contact_phone.replace(/\D/g, '')
    if (phoneDigits.length !== 11) {
      toast.error('Telefone deve ter 11 dígitos: (XX) 9XXXX-XXXX')
      return
    }

    try {
      setSubmitting(true)

      const imageUrls = images.map(img => img.url)

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: null,
        category: form.category,
        contact_name: form.contact_name.trim(),
        contact_phone: phoneDigits,
        image_url: imageUrls[0] || null,
        images: imageUrls,
        video_url: video?.url || null,
      }

      const response = await fetch('/api/vitrine/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.requires_payment) {
        // Abrir modal de pagamento Stripe com os dados do post
        setPaymentPostData(data.post_data)
        setShowPaymentModal(true)
        return
      }

      if (data.success) {
        // Salvar telefone no localStorage para o painel
        localStorage.setItem('jacupemba_lojista_phone', form.contact_phone)
        setSuccess(true)
        if (data.is_first_post) {
          toast.success('Primeiro anúncio grátis!')
        }
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
              setForm(prev => ({ ...prev, title: '', description: '' }))
              setImages([])
              setVideo(null)
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
                  className={`rounded-xl border-2 p-3 text-left transition-all relative ${form.category === cat.value
                    ? 'bg-zinc-900 text-white border-zinc-900 ring-4 ring-zinc-900/30 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 dark:ring-zinc-100/30'
                    : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
                    }`}
                >
                  {form.category === cat.value && (
                    <div className="absolute -top-2 -right-2 bg-zinc-900 dark:bg-zinc-100 rounded-full p-1 shadow-lg">
                      <CheckCircle className="h-4 w-4 text-white dark:text-zinc-900" />
                    </div>
                  )}
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
                    placeholder="Nome completo"
                    className="input-grok has-icon w-full"
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
                    placeholder="Número do WhatsApp"
                    className="input-grok has-icon w-full"
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
                  onChange={(e) => updateField('title', e.target.value.slice(0, MAX_TITLE))}
                  placeholder="Título do anúncio"
                  className="input-grok has-icon w-full"
                  maxLength={MAX_TITLE}
                  required
                />
              </div>
              <p className={`text-xs ${form.title.length >= MAX_TITLE ? 'text-red-500' : 'text-zinc-400'}`}>{form.title.length}/{MAX_TITLE}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value.slice(0, MAX_DESC))}
                placeholder="Descreva seu anúncio (opcional)"
                className="input-grok w-full min-h-[100px] resize-none"
                maxLength={MAX_DESC}
              />
              <p className={`text-xs ${form.description.length >= MAX_DESC ? 'text-red-500' : 'text-zinc-400'}`}>{form.description.length}/{MAX_DESC}</p>
            </div>


          </div>

          {/* Imagens */}
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Imagens</h3>
              <span className="text-xs text-zinc-400">{images.length}/{MAX_IMAGES}</span>
            </div>

            {/* Preview grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <img
                        src={img.preview}
                        alt={`Imagem ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">Capa</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            {images.length < MAX_IMAGES && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-6 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      {images.length === 0 ? 'Enviar imagens' : 'Adicionar mais'}
                    </>
                  )}
                </button>
                <p className="mt-2 text-xs text-zinc-400 text-center">JPG, PNG, WEBP ou GIF • Máx 5MB cada • Até {MAX_IMAGES} imagens</p>
              </div>
            )}
          </div>

          {/* Vídeo */}
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Vídeo</h3>
              <span className="text-xs text-zinc-400">{video ? '1' : '0'}/{MAX_VIDEOS}</span>
            </div>

            {/* Preview vídeo */}
            {video && (
              <div className="relative group">
                <div className="aspect-video overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <video
                    src={video.preview}
                    className="h-full w-full object-cover"
                    controls
                  />
                </div>
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Upload button */}
            {!video && (
              <div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-6 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5" />
                      Enviar vídeo
                    </>
                  )}
                </button>
                <p className="mt-2 text-xs text-zinc-400 text-center">MP4, WebM ou MOV • Máx 50MB • Opcional</p>
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900 space-y-2">
            {isFirstPost === true && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2">
                <Gift className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                  Seu primeiro anúncio é GRÁTIS!
                </p>
              </div>
            )}
            {isFirstPost === false && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Valor do anúncio: R$ 30,00 (pagamento via Stripe)
                </p>
              </div>
            )}
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              <strong>Como funciona:</strong> Seu anúncio será revisado pelo administrador antes de ir ao ar.
              Após aprovação, ele fica visível por <strong>48 horas</strong>.
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

      {/* Payment Modal - Stripe Embedded Checkout */}
      {paymentPostData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setPaymentPostData(null)
          }}
          amount={30}
          postData={paymentPostData}
          onPaymentComplete={() => {
            localStorage.setItem('jacupemba_lojista_phone', form.contact_phone)
            setShowPaymentModal(false)
            setPaymentPostData(null)
            setSuccess(true)
          }}
        />
      )}
    </div>
  )
}
