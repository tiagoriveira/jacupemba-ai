import { createClient } from '@/lib/supabase/server'
import { BusinessForm } from '@/components/admin/business-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function BusinessPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {business ? 'Editar Negócio' : 'Cadastrar Negócio'}
        </h2>
        <p className="text-muted-foreground mt-1">
          {business 
            ? 'Atualize as informações do seu negócio' 
            : 'Cadastre as informações do seu negócio para que o assistente possa fornecer dados precisos'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Negócio</CardTitle>
          <CardDescription>
            Preencha os dados básicos sobre sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessForm business={business} userId={user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
