import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PromotionForm } from '@/components/admin/promotion-form'

export default async function NewPromotionPage() {
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nova Promoção</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Crie uma nova oferta ou desconto
        </p>
      </div>

      <PromotionForm businessId={business.id} />
    </div>
  )
}
