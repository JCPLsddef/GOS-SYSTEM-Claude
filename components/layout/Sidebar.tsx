'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  CalendarRange,
  Map,
  CalendarDays,
  Target,
  Bell,
  Star,
  Pin,
  PinOff,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGosStore, getLevel } from '@/store/gos-store'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/week', label: 'Week', icon: CalendarRange },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/fronts', label: 'Fronts', icon: Target },
  { href: '/notifications', label: 'Alerts', icon: Bell },
  { href: '/settings/mantras', label: 'Mantras', icon: Star },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { currentStreak, totalXp } = useGosStore()
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)

  const expanded = pinned || hovered
  const level = getLevel(totalXp)

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'hidden md:flex flex-col h-screen bg-bg-surface border-r border-cream-muted/10 fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out',
          expanded ? 'w-[220px]' : 'w-[60px]'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center border-b border-cream-muted/10 h-16',
          expanded ? 'px-5 justify-between' : 'justify-center'
        )}>
          <span className="font-display text-2xl font-bold text-gold">G</span>
          {expanded && (
            <button
              onClick={() => setPinned(!pinned)}
              className="text-cream-muted hover:text-gold transition-colors"
              title={pinned ? 'Unpin sidebar' : 'Pin sidebar'}
            >
              {pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(item => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard' || pathname === '/dashboard/day'
              : pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  'flex items-center gap-3 rounded-lg text-sm transition-all duration-200 relative',
                  expanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center',
                  isActive
                    ? 'bg-gold/10 text-gold'
                    : 'text-cream-muted hover:text-cream hover:bg-bg-elevated'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gold rounded-r" />
                )}
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {expanded && <span className="truncate font-display text-[13px]">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Level + Streak */}
        <div className={cn(
          'border-t border-cream-muted/10 py-3',
          expanded ? 'px-4' : 'flex justify-center'
        )}>
          <div className={cn('flex items-center gap-2', !expanded && 'flex-col gap-1')}>
            <Flame className="w-4 h-4 text-gold" />
            <span className="text-lg font-mono font-bold text-gold">{currentStreak}</span>
            {expanded && (
              <span className="text-[10px] text-cream-muted uppercase tracking-wider">streak</span>
            )}
          </div>
          {expanded && (
            <div className="mt-2">
              <span className="text-[10px] font-mono text-gold uppercase tracking-[0.15em]">{level.name}</span>
              <div className="h-1 bg-bg-elevated rounded-full overflow-hidden mt-1">
                <div className="h-full bg-gold rounded-full" style={{ width: `${(level.current / level.max) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* User avatar + name */}
        <div className={cn(
          'border-t border-cream-muted/10 py-3',
          expanded ? 'px-4' : 'flex justify-center'
        )}>
          <div className={cn('flex items-center gap-3', !expanded && 'justify-center')}>
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={32}
                height={32}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-mono text-gold">J</span>
              </div>
            )}
            {expanded && (
              <div className="min-w-0">
                <p className="text-sm text-cream truncate">{session?.user?.name || 'Juan'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-surface border-t border-cream-muted/10 px-2 py-2">
        <div className="flex justify-around">
          {navItems.slice(0, 5).map(item => {
            const isActive = item.href === '/dashboard'
              ? pathname === '/dashboard' || pathname === '/dashboard/day'
              : pathname === item.href || pathname.startsWith(item.href + '/')
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
