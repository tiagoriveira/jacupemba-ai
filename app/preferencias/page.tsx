'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Bell, Filter, MapPin, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { notificationManager } from '@/lib/notificationManager'

const CATEGORIAS_INTERESSE = [
  { value: 'comercio', label: 'Comércios e Serviços', icon: '🏪' },
  { value: 'seguranca', label: 'Segurança', icon: '🚨' },
  { value: 'eventos', label: 'Eventos', icon: '🎉' },
  { value: 'transito', label: 'Trânsito', icon: '🚗' },
  { value: 'infraestrutura', label: 'Infraestrutura', icon: '🏗️' },
  { value: 'saude', label: 'Saúde', icon: '🏥' },
  { value: 'educacao', label: 'Educação', icon: '📚' },
  { value: 'lazer', label: 'Lazer', icon: '🎮' },
]

const TOM_RESPOSTAS = [
  { value: 'informal', label: 'Informal e amigável', description: 'Respostas descontraídas e próximas' },
  { value: 'formal', label: 'Formal e profissional', description: 'Respostas diretas e objetivas' },
  { value: 'detalhado', label: 'Detalhado e explicativo', description: 'Respostas completas com contexto' },
]

interface UserPreferences {
  categoriasInteresse: string[]
  notificacoesAtivas: boolean
  tomResposta: string
  bairroFavorito: string
}

export default function PreferenciasPage() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    categoriasInteresse: [],
    notificacoesAtivas: true,
    tomResposta: 'informal',
    bairroFavorito: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('user-preferences')
    if (saved) {
      setPreferences(JSON.parse(saved))
    }
  }, [])

  const handleCategoriaToggle = (categoria: string) => {
    setPreferences((prev) => ({
      ...prev,
      categoriasInteresse: prev.categoriasInteresse.includes(categoria)
        ? prev.categoriasInteresse.filter((c) => c !== categoria)
        : [...prev.categoriasInteresse, categoria],
    }))
  }

  const handleSave = () => {
    setIsSaving(true)
    localStorage.setItem('user-preferences', JSON.stringify(preferences))
    
    setTimeout(() => {
      setIsSaving(false)
      notificationManager.success(
        'Preferências salvas',
        'Suas preferências foram atualizadas com sucesso!'
      )
    }, 500)
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Preferências
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Personalize sua experiência
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
          {/* Categorias de Interesse */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Categorias de Interesse
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Selecione os assuntos que mais te interessam
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CATEGORIAS_INTERESSE.map((categoria) => {
                const isSelected = preferences.categoriasInteresse.includes(categoria.value)
                return (
                  <button
                    key={categoria.value}
                    onClick={() => handleCategoriaToggle(categoria.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-2xl">{categoria.icon}</span>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {categoria.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Tom de Respostas */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Tom de Resposta
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Como você prefere que a IA se comunique
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {TOM_RESPOSTAS.map((tom) => {
                const isSelected = preferences.tomResposta === tom.value
                return (
                  <button
                    key={tom.value}
                    onClick={() => setPreferences((prev) => ({ ...prev, tomResposta: tom.value }))}
                    className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-5 w-5 rounded-full border-2 ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white'
                          : 'border-zinc-300 dark:border-zinc-600'
                      }`}
                    >
                      {isSelected && (
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-white dark:bg-zinc-900" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-zinc-900 dark:text-white">{tom.label}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">{tom.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Notificações */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                  <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Notificações
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Receba alertas sobre novidades relevantes
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setPreferences((prev) => ({ ...prev, notificacoesAtivas: !prev.notificacoesAtivas }))
                }
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  preferences.notificacoesAtivas ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform dark:bg-zinc-900 ${
                    preferences.notificacoesAtivas ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Bairro Favorito */}
          <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
                <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Bairro Favorito
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Defina seu bairro principal (opcional)
                </p>
              </div>
            </div>

            <input
              type="text"
              value={preferences.bairroFavorito}
              onChange={(e) => setPreferences((prev) => ({ ...prev, bairroFavorito: e.target.value }))}
              placeholder="Ex: Vila Madalena"
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600"
            />
          </section>
        </div>
      </div>
    </div>
  )
}
