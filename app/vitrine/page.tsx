'use client'

import { VitrineGrid } from '@/components/VitrineGrid'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function VitrinePage() {
  return (
    <div className="min-h-screen bg-background">
      <VitrineGrid />

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
