import { FeedRelatos } from '@/components/FeedRelatos'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function RelatosPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center gap-4">
          <Link 
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900">Relatos do Bairro</h1>
        </div>
      </header>
      
      <main className="py-8 px-4">
        <FeedRelatos />
      </main>
    </div>
  )
}
