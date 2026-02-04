'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Trash2, Loader2 } from 'lucide-react'
import type { Job } from '@/lib/types/database'

interface JobsListProps {
  jobs: Job[]
  businessId: string
}

export function JobsList({ jobs, businessId }: JobsListProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta vaga?')) return

    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('jobs').delete().eq('id', id)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir vaga')
    } finally {
      setDeleting(null)
    }
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Nenhuma vaga cadastrada ainda
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <Card key={job.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{job.title}</CardTitle>
              {job.is_active ? (
                <Badge variant="default" className="bg-green-500">Ativo</Badge>
              ) : (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {job.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              {job.employment_type && (
                <p>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  <span className="font-medium">{job.employment_type}</span>
                </p>
              )}
              {job.location && (
                <p>
                  <span className="text-muted-foreground">Local:</span>{' '}
                  <span className="font-medium">{job.location}</span>
                </p>
              )}
              {job.remote_option && (
                <Badge variant="outline" className="text-xs">Remoto</Badge>
              )}
              {(job.salary_min || job.salary_max) && (
                <p>
                  <span className="text-muted-foreground">Salário:</span>{' '}
                  <span className="font-medium">
                    {job.salary_min && `R$ ${job.salary_min.toFixed(2)}`}
                    {job.salary_min && job.salary_max && ' - '}
                    {job.salary_max && `R$ ${job.salary_max.toFixed(2)}`}
                  </span>
                </p>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => handleDelete(job.id)}
              disabled={deleting === job.id}
            >
              {deleting === job.id ? (
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
