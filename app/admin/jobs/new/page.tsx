'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    employment_type: '',
    location: '',
    remote_option: false,
    salary_min: '',
    salary_max: '',
    application_email: '',
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
      const { error } = await supabase.from('jobs').insert([{
        business_id: businessId,
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements || null,
        responsibilities: formData.responsibilities || null,
        employment_type: formData.employment_type || null,
        location: formData.location || null,
        remote_option: formData.remote_option,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        application_email: formData.application_email || null,
        is_active: true,
      }])

      if (error) throw error

      router.push('/admin/jobs')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erro ao criar vaga')
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
        <h2 className="text-3xl font-bold tracking-tight">Nova Vaga</h2>
        <p className="text-muted-foreground mt-1">
          Adicione uma nova vaga de emprego
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Vaga</CardTitle>
          <CardDescription>
            Preencha os detalhes da vaga
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
              <Label htmlFor="title">Título da Vaga *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={loading}
                placeholder="Ex: Desenvolvedor Full Stack"
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
                placeholder="Descreva a vaga..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requisitos</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                disabled={loading}
                rows={3}
                placeholder="Requisitos necessários..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibilities">Responsabilidades</Label>
              <Textarea
                id="responsibilities"
                value={formData.responsibilities}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                disabled={loading}
                rows={3}
                placeholder="Responsabilidades do cargo..."
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employment_type">Tipo de Contrato</Label>
                <Input
                  id="employment_type"
                  value={formData.employment_type}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  disabled={loading}
                  placeholder="Ex: CLT, PJ, Estágio"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={loading}
                  placeholder="Ex: São Paulo, SP"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="remote"
                checked={formData.remote_option}
                onCheckedChange={(checked) => setFormData({ ...formData, remote_option: checked })}
                disabled={loading}
              />
              <Label htmlFor="remote">Opção de trabalho remoto</Label>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="salary_min">Salário Mínimo (R$)</Label>
                <Input
                  id="salary_min"
                  type="number"
                  step="0.01"
                  value={formData.salary_min}
                  onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_max">Salário Máximo (R$)</Label>
                <Input
                  id="salary_max"
                  type="number"
                  step="0.01"
                  value={formData.salary_max}
                  onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="application_email">Email para Candidaturas</Label>
              <Input
                id="application_email"
                type="email"
                value={formData.application_email}
                onChange={(e) => setFormData({ ...formData, application_email: e.target.value })}
                disabled={loading}
                placeholder="contato@empresa.com"
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Vaga'
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/jobs">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
