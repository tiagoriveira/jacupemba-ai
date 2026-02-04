'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface PromotionFormProps {
  businessId: string
}

export function PromotionForm({ businessId }: PromotionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount_text: '',
    start_date: '',
    end_date: '',
    terms: '',
    is_active: true,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()

      const { error } = await supabase.from('promotions').insert([
        {
          ...formData,
          business_id: businessId,
        },
      ])

      if (error) throw error

      setSuccess(true)
      router.refresh()

      setTimeout(() => {
        router.push('/admin/promotions')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar promoção')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            Promoção criada com sucesso! Redirecionando...
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            disabled={loading}
            placeholder="Ex: 20% de desconto em todos os produtos"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            disabled={loading}
            rows={4}
            placeholder="Descreva os detalhes da promoção..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_text">Texto do Desconto</Label>
          <Input
            id="discount_text"
            value={formData.discount_text}
            onChange={(e) => setFormData({ ...formData, discount_text: e.target.value })}
            disabled={loading}
            placeholder="Ex: 20% OFF, 2 por 1, etc"
            maxLength={100}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start_date">Data de Início *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">Data de Término *</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="terms">Termos e Condições</Label>
          <Textarea
            id="terms"
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            disabled={loading}
            rows={3}
            placeholder="Condições da promoção, restrições, etc"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_active: !!checked })
            }
            disabled={loading}
          />
          <Label htmlFor="is_active" className="cursor-pointer">
            Promoção ativa
          </Label>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Criar Promoção'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/promotions')}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
