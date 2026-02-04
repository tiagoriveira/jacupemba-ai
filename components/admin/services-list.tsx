'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Trash2, Loader2 } from 'lucide-react'
import type { Service } from '@/lib/types/database'

interface ServicesListProps {
  services: Service[]
  businessId: string
}

export function ServicesList({ services, businessId }: ServicesListProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir serviço')
    } finally {
      setDeleting(null)
    }
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Nenhum serviço cadastrado ainda
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <Card key={service.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{service.name}</CardTitle>
              {service.is_active ? (
                <Badge variant="default" className="bg-green-500">Ativo</Badge>
              ) : (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </div>
            {service.description && (
              <CardDescription className="line-clamp-2">
                {service.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              {service.price && (
                <p>
                  <span className="text-muted-foreground">Preço:</span>{' '}
                  <span className="font-medium">
                    R$ {service.price.toFixed(2)}
                  </span>
                </p>
              )}
              {service.duration_minutes && (
                <p>
                  <span className="text-muted-foreground">Duração:</span>{' '}
                  <span className="font-medium">{service.duration_minutes} min</span>
                </p>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => handleDelete(service.id)}
              disabled={deleting === service.id}
            >
              {deleting === service.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
