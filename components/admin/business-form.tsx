'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { Business } from '@/lib/types/database'

interface BusinessFormProps {
  business: Business | null
  userId: string
}

const categories = [
  'Restaurante',
  'Comércio',
  'Serviços',
  'Saúde',
  'Educação',
  'Tecnologia',
  'Beleza',
  'Construção',
  'Automotivo',
  'Outros',
]

const states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

export function BusinessForm({ business, userId }: BusinessFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    cnpj: business?.cnpj || '',
    business_name: business?.business_name || '',
    trade_name: business?.trade_name || '',
    description: business?.description || '',
    category: business?.category || '',
    email: business?.email || '',
    phone: business?.phone || '',
    whatsapp: business?.whatsapp || '',
    website: business?.website || '',
    address_street: business?.address_street || '',
    address_number: business?.address_number || '',
    address_complement: business?.address_complement || '',
    address_neighborhood: business?.address_neighborhood || '',
    address_city: business?.address_city || '',
    address_state: business?.address_state || '',
    address_zipcode: business?.address_zipcode || '',
    is_active: business?.is_active ?? true,
  })

  function formatCNPJ(value: string) {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        '$1.$2.$3/$4-$5'
      )
    }
    return value
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      
      const dataToSave = {
        ...formData,
        user_id: userId,
      }

      if (business) {
        const { error } = await supabase
          .from('businesses')
          .update(dataToSave)
          .eq('id', business.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('businesses')
          .insert([dataToSave])
        
        if (error) throw error
      }

      setSuccess(true)
      router.refresh()
      
      setTimeout(() => {
        router.push('/admin')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar negócio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Negócio salvo com sucesso! Redirecionando...
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ *</Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
            placeholder="00.000.000/0000-00"
            required
            disabled={loading || !!business}
            maxLength={18}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="business_name">Razão Social *</Label>
          <Input
            id="business_name"
            value={formData.business_name}
            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="trade_name">Nome Fantasia</Label>
          <Input
            id="trade_name"
            value={formData.trade_name}
            onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
            disabled={loading}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={loading}
            rows={4}
            placeholder="Descreva seu negócio..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={loading}
            placeholder="(00) 0000-0000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            disabled={loading}
            placeholder="(00) 00000-0000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            disabled={loading}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Endereço</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="address_zipcode">CEP</Label>
            <Input
              id="address_zipcode"
              value={formData.address_zipcode}
              onChange={(e) => setFormData({ ...formData, address_zipcode: e.target.value })}
              disabled={loading}
              placeholder="00000-000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_state">Estado</Label>
            <Select
              value={formData.address_state}
              onValueChange={(value) => setFormData({ ...formData, address_state: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address_street">Logradouro</Label>
            <Input
              id="address_street"
              value={formData.address_street}
              onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_number">Número</Label>
            <Input
              id="address_number"
              value={formData.address_number}
              onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_complement">Complemento</Label>
            <Input
              id="address_complement"
              value={formData.address_complement}
              onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_neighborhood">Bairro</Label>
            <Input
              id="address_neighborhood"
              value={formData.address_neighborhood}
              onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_city">Cidade</Label>
            <Input
              id="address_city"
              value={formData.address_city}
              onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            business ? 'Atualizar' : 'Cadastrar'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin')}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}
