import { createClient } from '@/lib/supabase/server'
import { HoursForm } from '@/components/admin/hours-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function HoursPage() {
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

  const { data: hours } = await supabase
    .from('business_hours')
    .select('*')
    .eq('business_id', business.id)
    .order('day_of_week', { ascending: true })

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Horários de Funcionamento</h2>
        <p className="text-muted-foreground mt-1">
          Configure os dias e horários que seu negócio atende
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Definir Horários</CardTitle>
          <CardDescription>
            Configure os horários de funcionamento para cada dia da semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HoursForm businessId={business.id} existingHours={hours || []} />
        </CardContent>
      </Card>
    </div>
  )
}
