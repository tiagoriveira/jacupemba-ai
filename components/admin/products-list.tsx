'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Trash2, Loader2 } from 'lucide-react'
import type { Product } from '@/lib/types/database'

interface ProductsListProps {
  products: Product[]
  businessId: string
}

export function ProductsList({ products, businessId }: ProductsListProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir produto')
    } finally {
      setDeleting(null)
    }
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Nenhum produto cadastrado ainda
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{product.name}</CardTitle>
              {product.is_active ? (
                <Badge variant="default" className="bg-green-500">Ativo</Badge>
              ) : (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </div>
            {product.description && (
              <CardDescription className="line-clamp-2">
                {product.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              {product.price && (
                <p>
                  <span className="text-muted-foreground">Preço:</span>{' '}
                  <span className="font-medium">
                    R$ {product.price.toFixed(2)}
                  </span>
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Estoque:</span>{' '}
                <span className="font-medium">{product.stock_quantity}</span>
              </p>
              {product.sku && (
                <p>
                  <span className="text-muted-foreground">SKU:</span>{' '}
                  <span className="font-medium">{product.sku}</span>
                </p>
              )}
              {product.category && (
                <p>
                  <span className="text-muted-foreground">Categoria:</span>{' '}
                  <span className="font-medium">{product.category}</span>
                </p>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => handleDelete(product.id)}
              disabled={deleting === product.id}
            >
              {deleting === product.id ? (
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
