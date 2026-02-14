'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

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
    puv: '', // Renomeado de diferencial para puv (Proposta Única de Valor)
    whatsapp_link: '',
    menu_link: '',
    social_link: '',
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
        puv: '',
        whatsapp_link: '',
        menu_link: '',
        social_link: '',
        verified: false
      })
      onSuccess()
      onClose()
    } catch (error) {
      logger.error('Error creating business:', error)
      toast.error('Erro ao cadastrar empresa')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in-0 duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Nova Empresa</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Cadastre uma nova empresa local</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-8">
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Nome da Empresa *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-grok mt-1 w-full"
                placeholder="Ex: Padaria Central"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Categoria *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-grok mt-1 w-full"
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
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Descricao
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-grok mt-1 w-full"
                rows={3}
                placeholder="Breve descricao da empresa..."
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Telefone / WhatsApp
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-grok mt-1 w-full"
                placeholder="(27) 99999-9999"
              />
            </div>

            {/* Endereco */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Endereco
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-grok mt-1 w-full"
                placeholder="Rua, numero, bairro"
              />
            </div>

            {/* Horario */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Horario de Funcionamento
              </label>
              <input
                type="text"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                className="input-grok mt-1 w-full"
                placeholder="Ex: Seg-Sex 8h-18h"
              />
            </div>

            {/* PUV - Proposta Única de Valor */}
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Diferencial (PUV) *
              </label>
              <textarea
                required
                value={formData.puv}
                onChange={(e) => setFormData({ ...formData, puv: e.target.value })}
                className="input-grok mt-1 w-full"
                rows={3}
                placeholder="O que torna este negócio único? Descreva o principal diferencial..."
              />
              <p className="mt-1 text-xs text-zinc-500">
                Este campo é proeminente e ajuda os clientes a entenderem por que escolher você.
              </p>
            </div>

            {/* Links para Conversão */}
            <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 p-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Links de Conversão</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Campos opcionais que aumentam a taxa de cliques
              </p>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Link do WhatsApp
                </label>
                <input
                  type="url"
                  value={formData.whatsapp_link}
                  onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
                  className="input-grok mt-1 w-full"
                  placeholder="https://wa.me/5527999999999"
                />
              </div>

              {/* Cardápio Online */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Link para Cardápio/Catálogo
                </label>
                <input
                  type="url"
                  value={formData.menu_link}
                  onChange={(e) => setFormData({ ...formData, menu_link: e.target.value })}
                  className="input-grok mt-1 w-full"
                  placeholder="https://cardapio.com/..."
                />
              </div>

              {/* Redes Sociais */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Instagram/Facebook
                </label>
                <input
                  type="url"
                  value={formData.social_link}
                  onChange={(e) => setFormData({ ...formData, social_link: e.target.value })}
                  className="input-grok mt-1 w-full"
                  placeholder="https://instagram.com/..."
                />
              </div>
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
              <label htmlFor="verified" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Empresa verificada
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-grok flex-1 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-grok flex flex-1 items-center justify-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
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
