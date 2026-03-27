'use client'

import { Flame } from 'lucide-react'
import { useGosStore } from '@/store/gos-store'

export function TopBar() {
  const { currentStreak } = useGosStore()
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <header className="h-16 bg-bg-surface/80 backdrop-blur-sm border-b border-cream-muted/10 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Date — suppressHydrationWarning: server (UTC) vs client (local) timezone differ */}
      <div>
        <p className="text-sm text-cream-muted" suppressHydrationWarning>{dateStr}</p>
      </div>

      {/* Right: Streak + actions */}
      <div className="flex items-center gap-4">
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated rounded-lg">
          <Flame className="w-4 h-4 text-front-health" />
          <span className="text-sm font-mono text-cream">
            {currentStreak}
          </span>
        </div>
      </div>
    </header>
  )
}
