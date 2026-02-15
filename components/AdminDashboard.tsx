'use client'

import { useState } from 'react'
import { AlertTriangle, Store, ChevronDown } from 'lucide-react'
import { Toaster } from 'sonner'
import Link from 'next/link'
import { RelatosSection } from './admin/RelatosSection'
import { VitrineSection } from './admin/VitrineSection'

type Section = 'relatos' | 'vitrine'

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<Section>('relatos')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const sections = [
    {
      id: 'relatos' as Section,
      name: 'Relatos',
      icon: AlertTriangle,
      description: 'Moderar relatos de problemas'
    },
    {
      id: 'vitrine' as Section,
      name: 'Vitrine',
      icon: Store,
      description: 'Gerenciar posts comerciais'
    }
  ]

  return (
    <>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950">
        {/* Header Navigation - Same as initial interface */}
        <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between px-4 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <img
                src="/avatar.png"
                alt="Jacupemba"
                className="h-8 w-8 object-contain"
              />
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Painel Admin
              </h1>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center gap-2 text-zinc-600 dark:text-zinc-400"
            >
              <ChevronDown className="h-4 w-4" />
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="/"
                className="btn-grok flex items-center gap-2 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                <span>Voltar</span>
              </Link>
            </nav>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 px-4 py-4 space-y-2">
              <Link
                href="/"
                className="btn-grok w-full flex items-center gap-2 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                <span>Voltar</span>
              </Link>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden md:flex md:w-64 flex-shrink-0 border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <nav className="w-full space-y-1 p-4">
              {sections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-all duration-150 ${
                      isActive
                        ? 'bg-zinc-100 dark:bg-zinc-800'
                        : 'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${
                      isActive
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-500'
                    }`} />
                    <div className="flex-1 min-w-0">
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
          </aside>

          {/* Mobile Section Selector */}
          <div className="md:hidden px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {sections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {section.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            <div className="bg-white dark:bg-zinc-950">
              {activeSection === 'relatos' && <RelatosSection />}
              {activeSection === 'vitrine' && <VitrineSection />}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
