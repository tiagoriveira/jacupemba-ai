'use client'

import { useState, useEffect } from 'react'
import { Building2, Search, Check, X, Trash2, Phone, MapPin, AlertTriangle, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { EmpresaModal } from './EmpresaModal'

interface Empresa {
  id: string
  name: string
  category: string
  description: string
  phone: string
  whatsapp: string
  address: string
  hours: string
  verified: boolean
  status: 'pendente' | 'aprovado' | 'rejeitado'
  created_at: string
}

export function EmpresasSection() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchEmpresas()
  }, [filterStatus])

  const fetchEmpresas = async () => {
    try {
      const query = supabase
        .from('local_businesses')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (filterStatus !== 'todos') {
        query.eq('status', filterStatus)
      }

      const { data, error } = await query
      if (error) throw error
      setEmpresas(data || [])
    } catch (error) {
      console.error('[v0] Error fetching businesses:', error)
    }
  }

  const updateStatus = async (id: string, status: 'aprovado' | 'rejeitado') => {
    try {
      setLoadingId(id)
      const { error } = await supabase
        .from('local_businesses')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      
      toast.success(
        status === 'aprovado' 
          ? 'Empresa aprovada com sucesso!' 
          : 'Empresa rejeitada com sucesso!'
      )
      
      await fetchEmpresas()
    } catch (error) {
      console.error('[v0] Error updating status:', error)
      toast.error('Erro ao atualizar status')
    } finally {
      setLoadingId(null)
    }
  }

  const deleteEmpresa = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta empresa?')) return
    
    try {
      setLoadingId(id)
      const { error } = await supabase
        .from('local_businesses')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Empresa deletada com sucesso!')
      await fetchEmpresas()
    } catch (error) {
      console.error('[v0] Error deleting:', error)
      toast.error('Erro ao deletar')
    } finally {
      setLoadingId(null)
    }
  }

  const filteredEmpresas = empresas.filter(empresa =>
    empresa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (empresa.address && empresa.address.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-700'
      case 'rejeitado': return 'bg-red-100 text-red-700'
      case 'pendente': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-zinc-100 text-zinc-700'
    }
  }

  const pendentesCount = empresas.filter(e => e.status === 'pendente').length

  return (
    <div className="h-full">
      <EmpresaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEmpresas}
      />
      
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Empresas Locais</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Modere cadastros de comércios e serviços
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <Plus className="h-5 w-5" />
              Nova Empresa
            </button>
            <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-2">
              <AlertTriangle className="h-5 w-5 text-yellow-700" />
              <span className="text-sm font-semibold text-yellow-700">
                {pendentesCount} pendentes
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar empresas..."
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm"
            />
          </div>

          <div className="flex gap-2">
            {(['todos', 'pendente', 'aprovado', 'rejeitado'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="space-y-4">
          {filteredEmpresas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center">
              <p className="text-sm text-zinc-600">Nenhuma empresa encontrada</p>
            </div>
          ) : (
            filteredEmpresas.map((empresa) => (
              <div key={empresa.id} className="rounded-xl border border-zinc-200 bg-white p-6">
                <div className="flex items-start gap-6">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                    <Building2 className="h-8 w-8 text-zinc-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-zinc-900">
                            {empresa.name}
                          </h3>
                          {empresa.verified && (
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                              Verificada
                            </span>
                          )}
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(empresa.status)}`}>
                            {empresa.status}
                          </span>
                        </div>
                        <span className="mt-1 text-xs font-medium uppercase text-zinc-500">
                          {empresa.category}
                        </span>
                        {empresa.description && (
                          <p className="mt-2 text-sm text-zinc-600">{empresa.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      {empresa.phone && (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <Phone className="h-4 w-4" />
                          <span>{empresa.phone}</span>
                        </div>
                      )}
                      {empresa.address && (
                        <div className="flex items-center gap-2 text-zinc-600">
                          <MapPin className="h-4 w-4" />
                          <span>{empresa.address}</span>
                        </div>
                      )}
                    </div>

                    {empresa.hours && (
                      <div className="mt-3 inline-flex rounded-lg bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
                        {empresa.hours}
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      {empresa.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => updateStatus(empresa.id, 'aprovado')}
                            disabled={loadingId === empresa.id}
                            className="flex items-center gap-1 rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {loadingId === empresa.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Aprovar
                          </button>
                          <button
                            onClick={() => updateStatus(empresa.id, 'rejeitado')}
                            disabled={loadingId === empresa.id}
                            className="flex items-center gap-1 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {loadingId === empresa.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                            Rejeitar
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteEmpresa(empresa.id)}
                        disabled={loadingId === empresa.id}
                        className="rounded-lg bg-zinc-100 p-2 text-zinc-700 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingId === empresa.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
