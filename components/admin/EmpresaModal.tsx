'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface EmpresaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EmpresaModal({ isOpen, onClose, onSuccess }: EmpresaModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    phone: '',
    address: '',
    hours: '',
    diferencial: '',
    promocao: '',
    tempo_entrega: '',
    formas_pagamento: '',
    link_social: '',
    verified: false
  })

  const categories = [
    'Alimentacao',
    'Restaurante',
    'Mercado',
    'Farmacia',
    'Padaria',
    'Servicos',
    'Beleza',
    'Saude',
    'Educacao',
    'Construcao e Reparos',
    'Automotivo',
    'Pets',
    'Tecnologia',
    'Outro'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.category) {
      toast.error('Preencha os campos obrigatorios')
      return
    }

    try {
      setIsLoading(true)
      
      const { error } = await supabase
        .from('local_businesses')
        .insert([{
          ...formData,
          status: 'aprovado' // Admin criando já aprova automaticamente
        }])

      if (error) throw error
      
      toast.success('Empresa cadastrada com sucesso!')
      setFormData({
        name: '',
        category: '',
        description: '',
        phone: '',
        address: '',
        hours: '',
        diferencial: '',
        promocao: '',
        tempo_entrega: '',
        formas_pagamento: '',
        link_social: '',
        verified: false
      })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating business:', error)
      toast.error('Erro ao cadastrar empresa')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white p-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Nova Empresa</h2>
            <p className="text-sm text-zinc-600">Cadastre uma nova empresa local</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Nome da Empresa *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                placeholder="Ex: Padaria Central"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Categoria *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Descricao */}
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Descricao
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                rows={3}
                placeholder="Breve descricao da empresa..."
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                placeholder="(27) 99999-9999"
              />
            </div>

            {/* Endereco */}
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Endereco
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                placeholder="Rua, numero, bairro"
              />
            </div>

            {/* Horario */}
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Horario de Funcionamento
              </label>
              <input
                type="text"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                placeholder="Ex: Seg-Sex 8h-18h"
              />
            </div>

            {/* Diferencial */}
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Diferencial (obrigatorio) *
              </label>
              <input
                type="text"
                required
                value={formData.diferencial}
                onChange={(e) => setFormData({ ...formData, diferencial: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                placeholder="O que torna esta empresa especial?"
              />
            </div>

            {/* Promocao */}
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Promocao ou Oferta Especial
              </label>
              <input
                type="text"
                value={formData.promocao}
                onChange={(e) => setFormData({ ...formData, promocao: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                placeholder="Ex: 10% de desconto na primeira compra"
              />
            </div>

            {/* Tempo de Entrega */}
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Tempo de Entrega
              </label>
              <input
                type="text"
                value={formData.tempo_entrega}
                onChange={(e) => setFormData({ ...formData, tempo_entrega: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                placeholder="Ex: 30-45 minutos"
              />
            </div>

            {/* Formas de Pagamento */}
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Formas de Pagamento
              </label>
              <input
                type="text"
                value={formData.formas_pagamento}
                onChange={(e) => setFormData({ ...formData, formas_pagamento: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                placeholder="Ex: Dinheiro, Pix, Cartao"
              />
            </div>

            {/* Link Social */}
            <div>
              <label className="block text-sm font-medium text-zinc-900">
                Instagram / Facebook
              </label>
              <input
                type="url"
                value={formData.link_social}
                onChange={(e) => setFormData({ ...formData, link_social: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 focus:border-zinc-900 focus:outline-none"
                placeholder="https://instagram.com/..."
              />
            </div>

            {/* Verificado */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="verified"
                checked={formData.verified}
                onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-900"
              />
              <label htmlFor="verified" className="text-sm font-medium text-zinc-900">
                Empresa verificada
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-zinc-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Empresa'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
