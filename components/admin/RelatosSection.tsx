'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Search, Check, X, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Relato {
  id: string
  category: string
  text: string
  created_at: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
}

export function RelatosSection() {
  const [relatos, setRelatos] = useState<Relato[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente')

  useEffect(() => {
    fetchRelatos()
  }, [filterStatus])

  const fetchRelatos = async () => {
    try {
      const query = supabase
        .from('anonymous_reports')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (filterStatus !== 'todos') {
        query.eq('status', filterStatus)
      }

      const { data, error } = await query
      if (error) throw error
      setRelatos(data || [])
    } catch (error) {
      console.error('[v0] Error fetching relatos:', error)
    }
  }

  const updateStatus = async (id: string, status: 'aprovado' | 'rejeitado') => {
    try {
      const { error } = await supabase
        .from('anonymous_reports')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      fetchRelatos()
    } catch (error) {
      console.error('[v0] Error updating status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const deleteRelato = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este relato?')) return
    
    try {
      const { error } = await supabase
        .from('anonymous_reports')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchRelatos()
    } catch (error) {
      console.error('[v0] Error deleting:', error)
      alert('Erro ao deletar')
    }
  }

  const filteredRelatos = relatos.filter(relato =>
    relato.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relato.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-700'
      case 'rejeitado': return 'bg-red-100 text-red-700'
      case 'pendente': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-zinc-100 text-zinc-700'
    }
  }

  const pendentesCount = relatos.filter(r => r.status === 'pendente').length

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Relatos Anônimos</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Modere e aprove relatos dos moradores
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-2">
            <AlertTriangle className="h-5 w-5 text-yellow-700" />
            <span className="text-sm font-semibold text-yellow-700">
              {pendentesCount} pendentes
            </span>
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
              placeholder="Buscar relatos..."
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
          {filteredRelatos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center">
              <p className="text-sm text-zinc-600">Nenhum relato encontrado</p>
            </div>
          ) : (
            filteredRelatos.map((relato) => (
              <div key={relato.id} className="rounded-xl border border-zinc-200 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-medium uppercase text-zinc-500">
                        {relato.category}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(relato.status)}`}>
                        {relato.status}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-700 mb-3">{relato.text}</p>
                    <span className="text-xs text-zinc-400">
                      {new Date(relato.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {relato.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => updateStatus(relato.id, 'aprovado')}
                          className="rounded-lg bg-green-100 p-2 text-green-700 hover:bg-green-200"
                          title="Aprovar"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => updateStatus(relato.id, 'rejeitado')}
                          className="rounded-lg bg-red-100 p-2 text-red-700 hover:bg-red-200"
                          title="Rejeitar"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteRelato(relato.id)}
                      className="rounded-lg bg-zinc-100 p-2 text-zinc-700 hover:bg-zinc-200"
                      title="Deletar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
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
