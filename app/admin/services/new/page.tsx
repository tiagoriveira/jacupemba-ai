'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function NewServicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
  })

  useEffect(() => {
    async function fetchBusiness() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (data) setBusinessId(data.id)
    }
    fetchBusiness()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!businessId) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.from('services').insert([{
        business_id: businessId,
        name: formData.name,
        description: formData.description || null,
        price: formData.price ? parseFloat(formData.price) : null,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        is_active: true,
      }])

      if (error) throw error

      router.push('/admin/services')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar serviço')
    } finally {
      setLoading(false)
    }
  }

  if (!businessId) {
    return <div>Carregando...</div>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Novo Serviço</h2>
        <p className="text-muted-foreground mt-1">
          Adicione um novo serviço ao seu catálogo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Serviço</CardTitle>
          <CardDescription>
            Preencha os detalhes do serviço oferecido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Serviço *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
                placeholder="Ex: Corte de cabelo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
                rows={4}
                placeholder="Descreva o serviço..."
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  disabled={loading}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  disabled={loading}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Serviço'
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/services">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
