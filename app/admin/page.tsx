'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { AdminLogin } from '@/components/AdminLogin'
import { AdminDashboard } from '@/components/AdminDashboard'

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || ''

export default function AdminPage() {
  const { user, loading } = useAuth()
  const [forceShow, setForceShow] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900" />
      </div>
    )
  }

  const isAdmin = user && SUPER_ADMIN_EMAIL && user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()

  if (!isAdmin && !forceShow) {
    return <AdminLogin onLogin={() => setForceShow(true)} />
  }

  return <AdminDashboard />
}
