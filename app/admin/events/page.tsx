import { createClient } from '@/lib/supabase/server'
import { EventsList } from '@/components/admin/events-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function EventsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return (
      <div className="max-w-4xl space-y-6">
        <p>Você precisa cadastrar seu negócio primeiro.</p>
        <Button asChild>
          <Link href="/admin/business">Cadastrar Negócio</Link>
        </Button>
      </div>
    )
  }

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('business_id', business.id)
    .order('event_date', { ascending: false })

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Eventos</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie os eventos da sua empresa
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Link>
        </Button>
      </div>

      <EventsList events={events || []} businessId={business.id} />
    </div>
  )
}
