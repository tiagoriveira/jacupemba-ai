import { createClient } from '@/lib/supabase/server'
import { ProductsList } from '@/components/admin/products-list'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function ProductsPage() {
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

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produtos</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie o catálogo de produtos
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Link>
        </Button>
      </div>

      <ProductsList products={products || []} businessId={business.id} />
    </div>
  )
}
