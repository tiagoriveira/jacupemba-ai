'use client'

import { useState } from 'react'
import { Building2, Search, Plus, Edit2, Trash2, Phone, MapPin, Globe, Star } from 'lucide-react'

interface Empresa {
  id: string
  nome: string
  categoria: string
  telefone: string
  endereco: string
  horario: string
  descricao: string
  avaliacoes: number
  nota: number
  site?: string
  verificada: boolean
}

const MOCK_EMPRESAS: Empresa[] = [
  {
    id: '1',
    nome: 'Pizzaria Bella',
    categoria: 'Restaurante',
    telefone: '(27) 99999-1234',
    endereco: 'Rua das Flores, 123',
    horario: 'Seg-Dom: 18h-23h',
    descricao: 'Pizzas artesanais com massa fermentada naturalmente',
    avaliacoes: 47,
    nota: 4.8,
    site: 'https://pizzariabella.com',
    verificada: true
  },
  {
    id: '2',
    nome: 'TechFix Assistencia',
    categoria: 'Servicos',
    telefone: '(27) 99888-5678',
    endereco: 'Av. Principal, 456',
    horario: 'Seg-Sex: 9h-18h, Sab: 9h-13h',
    descricao: 'Conserto de celulares, tablets e notebooks',
    avaliacoes: 89,
    nota: 4.9,
    verificada: true
  },
  {
    id: '3',
    nome: 'Mercadinho Sao Jose',
    categoria: 'Comercio',
    telefone: '(27) 99777-4321',
    endereco: 'Rua Central, 789',
    horario: 'Seg-Sab: 7h-20h, Dom: 7h-12h',
    descricao: 'Mercadinho de bairro com produtos frescos',
    avaliacoes: 124,
    nota: 4.6,
    verificada: false
  },
  {
    id: '4',
    nome: 'Auto Escola Volante',
    categoria: 'Servicos',
    telefone: '(27) 99666-8765',
    endereco: 'Av. Contorno, 321',
    horario: 'Seg-Sex: 8h-19h, Sab: 8h-12h',
    descricao: 'Aulas de direcao para todas as categorias',
    avaliacoes: 52,
    nota: 4.7,
    site: 'https://autoescolavolante.com.br',
    verificada: true
  }
]

export function EmpresasSection() {
  const [empresas, setEmpresas] = useState<Empresa[]>(MOCK_EMPRESAS)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState<string>('todas')

  const categorias = ['todas', ...Array.from(new Set(empresas.map(e => e.categoria)))]

  const filteredEmpresas = empresas.filter(empresa => {
    const matchesSearch = 
      empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empresa.endereco.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategoria = filterCategoria === 'todas' || empresa.categoria === filterCategoria
    return matchesSearch && matchesCategoria
  })

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta empresa?')) {
      setEmpresas(empresas.filter(e => e.id !== id))
    }
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-8 py-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Cadastro de Empresas
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Gerencie o diretorio de empresas e servicos locais
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
            <Plus className="h-4 w-4" />
            Nova Empresa
          </button>
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
              placeholder="Buscar empresas..."
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {categorias.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b border-zinc-200 bg-white px-8 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{empresas.length}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Empresas Cadastradas</div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {empresas.filter(e => e.verificada).length}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Verificadas</div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {(empresas.reduce((sum, e) => sum + e.nota, 0) / empresas.length).toFixed(1)}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Media de Avaliacoes</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="space-y-4">
          {filteredEmpresas.map((empresa) => (
            <div
              key={empresa.id}
              className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start gap-6">
                {/* Logo Placeholder */}
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  <Building2 className="h-10 w-10 text-zinc-400" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          {empresa.nome}
                        </h3>
                        {empresa.verificada && (
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                            Verificada
                          </span>
                        )}
                        <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {empresa.categoria}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {empresa.descricao}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button className="rounded-lg bg-zinc-100 p-2 text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(empresa.id)}
                        className="rounded-lg bg-red-100 p-2 text-red-700 transition-colors hover:bg-red-200 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Phone className="h-4 w-4" />
                      <span>{empresa.telefone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <MapPin className="h-4 w-4" />
                      <span>{empresa.endereco}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{empresa.nota} ({empresa.avaliacoes} avaliacoes)</span>
                    </div>
                    {empresa.site && (
                      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        <Globe className="h-4 w-4" />
                        <a 
                          href={empresa.site} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Horario */}
                  <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {empresa.horario}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
