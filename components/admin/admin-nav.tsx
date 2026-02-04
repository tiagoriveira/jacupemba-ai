'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Building, 
  Clock, 
  Package, 
  Briefcase, 
  Calendar, 
  Users,
  LayoutDashboard
} from 'lucide-react'

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Meu Negócio',
    href: '/admin/business',
    icon: Building,
  },
  {
    title: 'Horários',
    href: '/admin/hours',
    icon: Clock,
  },
  {
    title: 'Serviços',
    href: '/admin/services',
    icon: Briefcase,
  },
  {
    title: 'Produtos',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Eventos',
    href: '/admin/events',
    icon: Calendar,
  },
  {
    title: 'Vagas',
    href: '/admin/jobs',
    icon: Users,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="w-64 border-r bg-white p-4 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-slate-100 hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
