import { FeedRelatos } from '@/components/FeedRelatos'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default function RelatosPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Relatos do Bairro</h1>
        </div>
      </header>

      <main className="py-8 px-4">
        <FeedRelatos />
      </main>

      {/* Floating Action Button - Jacupemba AI Agent */}
      <Link
        href="/"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 group"
        title="Falar com Jacupemba AI"
      >
        <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
      </Link>
    </div>
  )
}
