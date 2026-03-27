'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  Shield,
  Bell,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGosStore } from '@/store/gos-store'
import { ProgressRing } from '@/components/ui/ProgressRing'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/fronts', label: 'Fronts', icon: Shield },
  { href: '/notifications', label: 'Alerts', icon: Bell },
]

export function Sidebar() {
  const pathname = usePathname()
  const { fronts, currentStreak, avatarPosition } = useGosStore()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-bg-surface border-r border-cream-muted/10 fixed left-0 top-0 z-40">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-cream-muted/10">
          <h1 className="font-display text-2xl font-bold text-gold">GOS</h1>
          <p className="text-xs text-cream-muted mt-0.5">G Operating System</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors',
                  isActive
                    ? 'bg-gold/10 text-gold'
                    : 'text-cream-muted hover:text-cream hover:bg-bg-elevated'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Front status dots */}
        <div className="px-6 py-3 border-t border-cream-muted/10">
          <p className="text-xs text-cream-muted mb-2 uppercase tracking-wider">Battle Fronts</p>
          <div className="space-y-2">
            {fronts.map((front) => (
              <div key={front.id} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: front.color }}
                />
                <span className="text-xs text-cream-muted">{front.name}</span>
                <span className="text-xs text-cream-muted ml-auto">{front.icon}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Streak + Avatar position */}
        <div className="px-6 py-4 border-t border-cream-muted/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-front-health" />
              <span className="text-sm font-mono text-cream">
                {currentStreak} day{currentStreak !== 1 ? 's' : ''}
              </span>
            </div>
            <ProgressRing value={avatarPosition} size={36} strokeWidth={3}>
              <span className="text-[10px] font-mono text-cream-muted">
                {avatarPosition}%
              </span>
            </ProgressRing>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-surface border-t border-cream-muted/10 px-2 py-2">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg text-xs',
                  isActive ? 'text-gold' : 'text-cream-muted'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
