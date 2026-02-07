'use client'

import { useState } from 'react'
import { Shield, AlertTriangle, Store, Building2, LogOut } from 'lucide-react'
import { RelatosSection } from './admin/RelatosSection'
import { VitrineSection } from './admin/VitrineSection'
import { EmpresasSection } from './admin/EmpresasSection'

type Section = 'relatos' | 'vitrine' | 'empresas'

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<Section>('relatos')

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('[v0] Logout clicked')
  }

  const sections = [
    {
      id: 'relatos' as Section,
      name: 'Relatos Problematicos',
      icon: AlertTriangle,
      description: 'Moderar relatos de problemas'
    },
    {
      id: 'vitrine' as Section,
      name: 'Gestao da Vitrine',
      icon: Store,
      description: 'Gerenciar posts comerciais'
    },
    {
      id: 'empresas' as Section,
      name: 'Cadastro de Empresas',
      icon: Building2,
      description: 'Gerenciar empresas locais'
    }
  ]

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-zinc-900 p-2 dark:bg-zinc-100">
                <Shield className="h-5 w-5 text-white dark:text-zinc-900" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Admin Panel
                </h1>
                <p className="text-xs text-zinc-500">Jacupemba AI</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${
                    isActive 
                      ? 'text-zinc-900 dark:text-zinc-100' 
                      : 'text-zinc-500'
                  }`} />
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      isActive
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}>
                      {section.name}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500">
                      {section.description}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
            >
              <LogOut className="h-5 w-5 text-zinc-500" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {activeSection === 'relatos' && <RelatosSection />}
        {activeSection === 'vitrine' && <VitrineSection />}
        {activeSection === 'empresas' && <EmpresasSection />}
      </main>
    </div>
  )
}
