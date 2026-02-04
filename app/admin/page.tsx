import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, Package, Briefcase, Calendar, Users, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get business
  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get counts
  const [services, products, events, jobs] = await Promise.all([
    supabase.from('services').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('events').select('id', { count: 'exact', head: true }),
    supabase.from('jobs').select('id', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      title: 'Serviços',
      value: services.count || 0,
      icon: Briefcase,
      href: '/admin/services',
      description: 'Serviços cadastrados',
    },
    {
      title: 'Produtos',
      value: products.count || 0,
      icon: Package,
      href: '/admin/products',
      description: 'Produtos no catálogo',
    },
    {
      title: 'Eventos',
      value: events.count || 0,
      icon: Calendar,
      href: '/admin/events',
      description: 'Eventos programados',
    },
    {
      title: 'Vagas',
      value: jobs.count || 0,
      icon: Users,
      href: '/admin/jobs',
      description: 'Vagas disponíveis',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao painel administrativo
        </p>
      </div>

      {!business && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Configure seu negócio
            </CardTitle>
            <CardDescription>
              Você ainda não cadastrou as informações do seu negócio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/business">Cadastrar Negócio</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {business && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {business.business_name}
            </CardTitle>
            <CardDescription>
              CNPJ: {business.cnpj} • {business.category || 'Sem categoria'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/business">Editar Informações</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/hours">
                  <Clock className="h-4 w-4 mr-2" />
                  Horários
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="transition-colors hover:bg-slate-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
