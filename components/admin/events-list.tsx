'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Trash2, Loader2 } from 'lucide-react'
import type { Event } from '@/lib/types/database'

interface EventsListProps {
  events: Event[]
  businessId: string
}

export function EventsList({ events, businessId }: EventsListProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return

    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir evento')
    } finally {
      setDeleting(null)
    }
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Nenhum evento cadastrado ainda
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Card key={event.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{event.name}</CardTitle>
              {event.is_active ? (
                <Badge variant="default" className="bg-green-500">Ativo</Badge>
              ) : (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </div>
            {event.description && (
              <CardDescription className="line-clamp-2">
                {event.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Data:</span>{' '}
                <span className="font-medium">
                  {new Date(event.event_date).toLocaleDateString('pt-BR')}
                </span>
              </p>
              {event.start_time && (
                <p>
                  <span className="text-muted-foreground">Horário:</span>{' '}
                  <span className="font-medium">
                    {event.start_time}
                    {event.end_time && ` - ${event.end_time}`}
                  </span>
                </p>
              )}
              {event.location && (
                <p>
                  <span className="text-muted-foreground">Local:</span>{' '}
                  <span className="font-medium">{event.location}</span>
                </p>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => handleDelete(event.id)}
              disabled={deleting === event.id}
            >
              {deleting === event.id ? (
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
