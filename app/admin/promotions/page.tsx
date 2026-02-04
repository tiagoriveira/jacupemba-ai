import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PromotionsList } from '@/components/admin/promotions-list'

export default async function PromotionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    redirect('/admin/business')
  }

  const { data: promotions } = await supabase
    .from('promotions')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promoções</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Gerencie suas ofertas e descontos
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/promotions/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Promoção
          </Link>
        </Button>
      </div>

      <PromotionsList promotions={promotions || []} businessId={business.id} />
    </div>
  )
}
