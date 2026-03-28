'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MantraData {
  todayMantra: { id: string; text: string; type: 'dream' | 'nightmare' } | null
  todayType: 'dream' | 'nightmare'
}

export default function RitualPage() {
  const { status } = useSession()
  const router = useRouter()
  const [mantra, setMantra] = useState<MantraData | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showRitual, setShowRitual] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Check if it's ritual hours (05:00-09:00)
  const isRitualTime = useCallback(() => {
    const hour = new Date().getHours()
    return hour >= 5 && hour < 9
  }, [])

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Determine if we show ritual or redirect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }
    if (status !== 'authenticated') return

    if (isRitualTime()) {
      setShowRitual(true)
      fetch('/api/mantras')
        .then(res => res.json())
        .then(json => {
          if (json.success) setMantra(json.data)
          setLoaded(true)
        })
        .catch(() => setLoaded(true))
    } else {
      router.replace('/dashboard')
    }
  }, [status, router, isRitualTime])

  // Calculate streak (same logic as store, but we fetch from missions)
  const [streak, setStreak] = useState(0)
  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/missions')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const missions = json.data as { completedAt?: string }[]
          const completionDates = missions
            .filter((m) => m.completedAt)
            .map((m) => m.completedAt as string)
          // Simple streak calc
          if (completionDates.length === 0) { setStreak(0); return }
          const uniqueDays = Array.from(new Set(completionDates.map((d: string) => d.split('T')[0])))
            .sort()
            .reverse()
          const today = new Date().toISOString().split('T')[0]
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
          if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) { setStreak(0); return }
          let s = 0
          let checkDate = new Date(uniqueDays[0])
          for (const day of uniqueDays) {
            const dayDate = new Date(day)
            const diff = Math.round((checkDate.getTime() - dayDate.getTime()) / 86400000)
            if (diff <= 1) { s++; checkDate = dayDate } else break
          }
          setStreak(s)
        }
      })
  }, [status])

  if (!showRitual || !loaded) {
    return (
      <div className="min-h-screen bg-[#0A0908] flex items-center justify-center">
        <div className="text-gold font-mono animate-pulse text-sm">LOADING...</div>
      </div>
    )
  }

  const timeStr = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const dateStr = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const todayFormatted = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="ritual-bg min-h-screen flex flex-col relative overflow-hidden">
      {/* Time + Date — top right */}
      <div className="absolute top-8 right-8 text-right z-10">
        <p className="font-mono text-gold text-3xl font-semibold tracking-wider">
          {timeStr}
        </p>
        <p className="font-mono text-gold/60 text-sm mt-1 uppercase tracking-widest">
          {dateStr}
        </p>
      </div>

      {/* Center — Mantra */}
      <div className="flex-1 flex items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={mantra?.todayMantra?.id || 'none'}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="max-w-3xl text-center"
          >
            {/* Type label */}
            <p className="font-mono text-xs uppercase tracking-[0.3em] mb-8 text-gold/40">
              {mantra?.todayType === 'nightmare' ? 'THE NIGHTMARE' : 'THE VISION'}
            </p>

            {/* Mantra text */}
            <p className="font-display text-2xl md:text-3xl lg:text-4xl leading-relaxed text-cream font-medium">
              {mantra?.todayMantra?.text || 'No mantras configured. Add them in settings.'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA Button */}
      <div className="flex flex-col items-center pb-16 gap-8">
        <motion.button
          onClick={() => router.push('/dashboard')}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-10 py-4 bg-gold text-[#0A0908] font-display font-bold text-lg uppercase tracking-wider rounded-lg transition-shadow hover:shadow-[0_0_30px_rgba(212,168,83,0.3)]"
        >
          ENTER THE WAR ROOM &rarr;
        </motion.button>

        {/* Bottom — Date + Streak */}
        <div className="text-center">
          <p className="font-mono text-cream-muted text-sm">
            {todayFormatted}
          </p>
          <p className="font-mono text-gold/50 text-xs mt-1 uppercase tracking-wider">
            {streak > 0
              ? `Day ${streak} \u2014 You haven't stopped.`
              : 'Day 0 \u2014 Start now.'}
          </p>
        </div>
      </div>
    </div>
  )
}
