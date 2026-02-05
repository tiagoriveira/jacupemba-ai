'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Search, Filter, Check, X, Eye, MessageSquare } from 'lucide-react'

interface Relato {
  id: string
  usuario: string
  mensagem: string
  categoria: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
  data: string
  gravidade: 'baixa' | 'media' | 'alta'
}

const MOCK_RELATOS: Relato[] = [
  {
    id: '1',
    usuario: 'Maria Silva',
    mensagem: 'Tem um buraco enorme na Rua das Flores que ja causou varios acidentes.',
    categoria: 'Infraestrutura',
    status: 'pendente',
    data: '2024-02-05T10:30:00',
    gravidade: 'alta'
  },
  {
    id: '2',
    usuario: 'Joao Santos',
    mensagem: 'Iluminacao publica apagada na Av. Principal ha 3 dias.',
    categoria: 'Iluminacao',
    status: 'pendente',
    data: '2024-02-05T09:15:00',
    gravidade: 'media'
  },
  {
    id: '3',
    usuario: 'Ana Costa',
    mensagem: 'Lixo acumulado na praca causando mau cheiro.',
    categoria: 'Limpeza',
    status: 'aprovado',
    data: '2024-02-04T16:45:00',
    gravidade: 'media'
  },
  {
    id: '4',
    usuario: 'Pedro Lima',
    mensagem: 'Barulho excessivo de obra durante madrugada.',
    categoria: 'Barulho',
    status: 'rejeitado',
    data: '2024-02-04T14:20:00',
    gravidade: 'baixa'
  }
]

export function RelatosSection() {
  const [relatos, setRelatos] = useState<Relato[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'aprovado' | 'rejeitado'>('todos')

  // Carregar relatos do localStorage
  useEffect(() => {
    const savedReports = localStorage.getItem('anonymous-reports')
    if (savedReports) {
      const reports = JSON.parse(savedReports)
      const formattedRelatos: Relato[] = reports.map((report: any) => ({
        id: report.id,
        usuario: 'Anônimo',
        mensagem: report.text,
        categoria: 'Relato Anônimo',
        status: report.status || 'pendente',
        data: report.timestamp,
        gravidade: 'media'
      }))
      setRelatos([...formattedRelatos, ...MOCK_RELATOS])
    } else {
      setRelatos(MOCK_RELATOS)
    }
  }, [])

  const filteredRelatos = relatos.filter(relato => {
    const matchesSearch = relato.mensagem.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         relato.usuario.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'todos' || relato.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleApprove = (id: string) => {
    const updatedRelatos = relatos.map(r => r.id === id ? { ...r, status: 'aprovado' as const } : r)
    setRelatos(updatedRelatos)
    
    // Atualizar localStorage
    const savedReports = localStorage.getItem('anonymous-reports')
    if (savedReports) {
      const reports = JSON.parse(savedReports)
      const updatedReports = reports.map((r: any) => 
        r.id === id ? { ...r, status: 'aprovado' } : r
      )
      localStorage.setItem('anonymous-reports', JSON.stringify(updatedReports))
    }
  }

  const handleReject = (id: string) => {
    const updatedRelatos = relatos.map(r => r.id === id ? { ...r, status: 'rejeitado' as const } : r)
    setRelatos(updatedRelatos)
    
    // Atualizar localStorage
    const savedReports = localStorage.getItem('anonymous-reports')
    if (savedReports) {
      const reports = JSON.parse(savedReports)
      const updatedReports = reports.map((r: any) => 
        r.id === id ? { ...r, status: 'rejeitado' } : r
      )
      localStorage.setItem('anonymous-reports', JSON.stringify(updatedReports))
    }
  }

  const getGravidadeColor = (gravidade: string) => {
    switch (gravidade) {
      case 'alta': return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
      case 'media': return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
      case 'baixa': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
      default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
      case 'rejeitado': return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
      case 'pendente': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
      default: return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
    }
  }

  const pendentesCount = relatos.filter(r => r.status === 'pendente').length

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-8 py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Relatos Problematicos
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Modere e gerencie relatos de problemas dos moradores
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-2 dark:bg-yellow-950/30">
            <AlertTriangle className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
              {pendentesCount} pendentes
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar relatos..."
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {['todos', 'pendente', 'aprovado', 'rejeitado'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
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
            <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
              <MessageSquare className="mx-auto h-12 w-12 text-zinc-400" />
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                Nenhum relato encontrado
              </p>
            </div>
          ) : (
            filteredRelatos.map((relato) => (
              <div
                key={relato.id}
                className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {relato.usuario}
                      </h3>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getGravidadeColor(relato.gravidade)}`}>
                        {relato.gravidade}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(relato.status)}`}>
                        {relato.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                      {relato.mensagem}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                      <span>{relato.categoria}</span>
                      <span>•</span>
                      <span>{new Date(relato.data).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {relato.status === 'pendente' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(relato.id)}
                        className="rounded-lg bg-green-100 p-2 text-green-700 transition-colors hover:bg-green-200 dark:bg-green-950 dark:text-green-400 dark:hover:bg-green-900"
                        title="Aprovar"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleReject(relato.id)}
                        className="rounded-lg bg-red-100 p-2 text-red-700 transition-colors hover:bg-red-200 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                        title="Rejeitar"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
