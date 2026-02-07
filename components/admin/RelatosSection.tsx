'use client'

import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, Search, Check, X, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { analisarRelato, NIVEL_CONFIG, type ResultadoTriagem } from '@/lib/moderacao-triagem'

interface Relato {
  id: string
  category: string
  text: string
  created_at: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
}

interface RelatoComTriagem extends Relato {
  triagem: ResultadoTriagem
}

export function RelatosSection() {
  const [relatos, setRelatos] = useState<Relato[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('pendente')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  useEffect(() => {
    fetchRelatos()
  }, [filterStatus])

  const fetchRelatos = async () => {
    try {
      setIsLoading(true)
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
      toast.error('Erro ao carregar relatos')
    } finally {
      setIsLoading(false)
    }
  }

  // Processar triagem e ordenar por prioridade
  const relatosComTriagem = useMemo<RelatoComTriagem[]>(() => {
    const processados = relatos.map(relato => ({
      ...relato,
      triagem: analisarRelato(relato.text, relato.category)
    }))

    // Ordenar: pendentes por prioridade (alto primeiro), depois aprovados/rejeitados por data
    return processados.sort((a, b) => {
      if (a.status === 'pendente' && b.status === 'pendente') {
        // Dentro de pendentes: alto risco primeiro (prioridade 3, 2, 1)
        return b.triagem.prioridade - a.triagem.prioridade
      }
      // Outros status: manter ordem por data
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [relatos])

  const updateStatus = async (id: string, status: 'aprovado' | 'rejeitado') => {
    try {
      setLoadingId(id)
      const { error } = await supabase
        .from('anonymous_reports')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      
      toast.success(
        status === 'aprovado' 
          ? 'Relato aprovado com sucesso!' 
          : 'Relato rejeitado com sucesso!'
      )
      
      await fetchRelatos()
    } catch (error) {
      console.error('[v0] Error updating status:', error)
      toast.error('Erro ao atualizar status')
    } finally {
      setLoadingId(null)
    }
  }

  const deleteRelato = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este relato?')) return
    
    try {
      setLoadingId(id)
      const { error } = await supabase
        .from('anonymous_reports')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Relato deletado com sucesso!')
      await fetchRelatos()
    } catch (error) {
      console.error('[v0] Error deleting relato:', error)
      toast.error('Erro ao deletar relato')
    } finally {
      setLoadingId(null)
    }
  }

  const bulkUpdateStatus = async (status: 'aprovado' | 'rejeitado') => {
    if (selectedIds.length === 0) return
    if (!confirm(`Tem certeza que deseja ${status === 'aprovado' ? 'aprovar' : 'rejeitar'} ${selectedIds.length} relato(s)?`)) return
    
    try {
      setIsBulkProcessing(true)
      const { error } = await supabase
        .from('anonymous_reports')
        .update({ status })
        .in('id', selectedIds)

      if (error) throw error
      
      toast.success(
        `${selectedIds.length} relato(s) ${status === 'aprovado' ? 'aprovado(s)' : 'rejeitado(s)'} com sucesso!`
      )
      
      setSelectedIds([])
      await fetchRelatos()
    } catch (error) {
      console.error('[v0] Error bulk updating status:', error)
      toast.error('Erro ao atualizar relatos em lote')
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const toggleSelectRelato = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const pendingRelatos = filteredRelatos.filter(r => r.status === 'pendente')
    if (selectedIds.length === pendingRelatos.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(pendingRelatos.map(r => r.id))
    }
  }

  const filteredRelatos = relatosComTriagem.filter((relato) =>
    relato.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relato.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categoryLabels: Record<string, string> = {
    comercio: 'Comércio',
    seguranca: 'Segurança',
    transito: 'Trânsito',
    convivencia: 'Convivência',
    eventos: 'Eventos',
    outro: 'Outro'
  }

  const stats = {
    total: relatos.length,
    pendentes: relatos.filter(r => r.status === 'pendente').length,
    aprovados: relatos.filter(r => r.status === 'aprovado').length,
    rejeitados: relatos.filter(r => r.status === 'rejeitado').length,
    altoRisco: relatosComTriagem.filter(r => r.status === 'pendente' && r.triagem.nivelRisco === 'alto').length
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-500">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.pendentes}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">🚨 Alto Risco</p>
          <p className="text-2xl font-bold text-red-900">{stats.altoRisco}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">Aprovados</p>
          <p className="text-2xl font-bold text-green-900">{stats.aprovados}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">Rejeitados</p>
          <p className="text-2xl font-bold text-zinc-700">{stats.rejeitados}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar relatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-4 focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(['todos', 'pendente', 'aprovado', 'rejeitado'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status)
                setSelectedIds([])
              }}
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

      {/* Bulk Actions Bar */}
      {filterStatus === 'pendente' && filteredRelatos.filter(r => r.status === 'pendente').length > 0 && (
        <div className="rounded-lg border-2 border-zinc-300 bg-zinc-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredRelatos.filter(r => r.status === 'pendente').length && selectedIds.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-900"
                />
                <span className="text-sm font-medium text-zinc-700">
                  Selecionar todos
                </span>
              </label>
              {selectedIds.length > 0 && (
                <span className="text-sm font-semibold text-zinc-900">
                  {selectedIds.length} relato(s) selecionado(s)
                </span>
              )}
            </div>
            {selectedIds.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => bulkUpdateStatus('aprovado')}
                  disabled={isBulkProcessing}
                  className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBulkProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Aprovar Selecionados
                </button>
                <button
                  onClick={() => bulkUpdateStatus('rejeitado')}
                  disabled={isBulkProcessing}
                  className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBulkProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Rejeitar Selecionados
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Relatos List */}
      <div className="space-y-3">
        {filteredRelatos.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-zinc-400" />
            <p className="mt-2 text-zinc-500">Nenhum relato encontrado</p>
          </div>
        ) : (
          filteredRelatos.map((relato) => {
            const config = NIVEL_CONFIG[relato.triagem.nivelRisco]
            return (
              <div
                key={relato.id}
                className={`rounded-lg border bg-white p-4 transition-all ${
                  relato.status === 'pendente' && relato.triagem.nivelRisco === 'alto'
                    ? 'border-red-300 shadow-lg'
                    : 'border-zinc-200'
                } ${
                  selectedIds.includes(relato.id) ? 'ring-2 ring-zinc-900' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox for pending relatos */}
                  {relato.status === 'pendente' && (
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(relato.id)}
                        onChange={() => toggleSelectRelato(relato.id)}
                        className="h-5 w-5 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-900 cursor-pointer"
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    {/* Header com categoria e badge de risco */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                        {categoryLabels[relato.category] || relato.category}
                      </span>
                      {relato.status === 'pendente' && (
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${config.cor}`}>
                          {config.icon} {config.label}
                        </span>
                      )}
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        relato.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                        relato.status === 'rejeitado' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {relato.status.charAt(0).toUpperCase() + relato.status.slice(1)}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {new Date(relato.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    {/* Texto do relato */}
                    <p className="text-sm text-zinc-900">{relato.text}</p>

                    {/* Alertas de triagem (apenas para pendentes) */}
                    {relato.status === 'pendente' && relato.triagem.alertas.length > 0 && (
                      <div className="rounded-lg bg-zinc-50 p-3 space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
                          <AlertCircle className="h-3 w-3" />
                          Análise Automática:
                        </div>
                        {relato.triagem.alertas.map((alerta, idx) => (
                          <p key={idx} className="text-xs text-zinc-600 ml-5">• {alerta}</p>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  {relato.status === 'pendente' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(relato.id, 'aprovado')}
                        disabled={loadingId === relato.id}
                        className="rounded-lg bg-green-500 p-2 text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Aprovar"
                      >
                        {loadingId === relato.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => updateStatus(relato.id, 'rejeitado')}
                        disabled={loadingId === relato.id}
                        className="rounded-lg bg-red-500 p-2 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Rejeitar"
                      >
                        {loadingId === relato.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteRelato(relato.id)}
                        disabled={loadingId === relato.id}
                        className="rounded-lg bg-zinc-500 p-2 text-white transition-colors hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Deletar"
                      >
                        {loadingId === relato.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
