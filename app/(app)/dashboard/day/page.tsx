'use client'

import { useGosStore } from '@/store/gos-store'
import { Card } from '@/components/ui/Card'
import { Badge, getFrontBadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { toast } from '@/components/ui/Toast'
import { isOverdue, isToday } from '@/lib/utils'
import { CheckCircle2, Clock, Zap, AlertTriangle, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'

export default function DayDashboardPage() {
  const { missions, fronts, currentStreak, completeMission, getFrontProgress, isLoading } = useGosStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [completing, setCompleting] = useState<string | null>(null)
  const [justCompleted, setJustCompleted] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  // Live clock — update every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const todayMissions = useMemo(
    () => missions.filter(m => !m.completed && isToday(m.attackDate)).sort((a, b) => a.priority - b.priority),
    [missions]
  )
  const allActiveMissions = useMemo(
    () => missions.filter(m => !m.completed).sort((a, b) => a.priority - b.priority),
    [missions]
  )

  const heroMission = todayMissions[0] || allActiveMissions[0]
  const secondaryMissions = (todayMissions.length > 0 ? todayMissions.slice(1) : allActiveMissions.slice(1)).slice(0, 5)

  async function handleComplete(missionId: string) {
    setCompleting(missionId)
    const result = await completeMission(missionId)
    setCompleting(null)

    if (result) {
      setJustCompleted(missionId)
      setTimeout(() => setJustCompleted(null), 600)

      toast('Mission complete. Keep moving.', 'hype')
      if (result.checkpointCompleted) {
        toast('Checkpoint cleared.', 'success')
      }
      if (result.targetAchieved) {
        toast('TARGET ACHIEVED. Front conquered.', 'hype')
      }

      // Check if all today's missions are done
      const remainingToday = todayMissions.filter(m => m.id !== missionId)
      if (remainingToday.length === 0 && todayMissions.length > 0) {
        setShowConfetti(true)
        toast('DAY COMPLETE. REST LIKE A KING.', 'hype', 6000)
        setTimeout(() => setShowConfetti(false), 4000)
      }
    }
  }

  const dayName = currentTime.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const dateStr = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cream-muted animate-pulse font-display text-lg">Loading operations...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Header */}
      <div suppressHydrationWarning>
        <h1 className="gos-title font-display text-2xl font-bold text-cream">
          TODAY &mdash; {dayName} {dateStr}
        </h1>
        <p className="font-mono text-sm text-cream-muted mt-1">{timeStr}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero mission — takes significant space */}
          {heroMission && (
            <motion.div
              className={justCompleted === heroMission.id ? 'animate-complete-pulse' : ''}
            >
              <Card variant="gold" className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-gold" />
                    <span className="text-xs font-mono text-gold uppercase tracking-[0.2em]">
                      #1 Mission Today
                    </span>
                  </div>

                  <h2 className="font-display text-xl md:text-[28px] font-bold text-cream mb-3 leading-tight">
                    {heroMission.name}
                  </h2>

                  <p className="text-sm text-cream-muted mb-5">
                    {heroMission.definitionOfDone}
                  </p>

                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <Badge variant={getFrontBadgeVariant(heroMission.frontId)}>
                      {heroMission.frontId}
                    </Badge>
                    <Badge variant="priority">P{heroMission.priority}</Badge>
                    <div className="flex items-center gap-1 text-xs text-cream-muted font-mono">
                      <Clock className="w-3 h-3" />
                      {heroMission.estimatedMinutes}min
                    </div>
                    <div className="flex items-center gap-1 text-xs text-cream-muted font-mono uppercase">
                      <Zap className="w-3 h-3" />
                      {heroMission.energyDemand}
                    </div>
                    {heroMission.dueDate && isOverdue(heroMission.dueDate) && (
                      <div className="flex items-center gap-1 text-xs text-danger">
                        <AlertTriangle className="w-3 h-3" />
                        Overdue
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      loading={completing === heroMission.id}
                      onClick={() => handleComplete(heroMission.id)}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      COMPLETE
                    </Button>
                    <Button variant="secondary" size="lg">
                      <Calendar className="w-5 h-5" />
                      ADD TO CALENDAR
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Secondary missions */}
          <div>
            <h3 className="gos-title font-display text-sm font-semibold text-cream-muted mb-3">
              {todayMissions.length > 0 ? 'Other Missions Today' : 'Upcoming Missions'}
            </h3>
            <div className="space-y-2">
              <AnimatePresence>
                {secondaryMissions.map((mission) => (
                  <motion.div
                    key={mission.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={justCompleted === mission.id ? 'animate-complete-pulse' : ''}
                  >
                    <Card className="flex items-center gap-4">
                      <button
                        onClick={() => handleComplete(mission.id)}
                        disabled={completing === mission.id}
                        className="w-6 h-6 rounded-full border-2 border-cream-muted/30 hover:border-gold hover:gold-glow flex items-center justify-center transition-all flex-shrink-0"
                      >
                        {completing === mission.id && (
                          <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-cream truncate">{mission.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getFrontBadgeVariant(mission.frontId)}>
                            {mission.frontId}
                          </Badge>
                          <span className="text-xs text-cream-muted font-mono">
                            P{mission.priority}
                          </span>
                          <span className="text-xs text-cream-muted font-mono">
                            {mission.estimatedMinutes}min
                          </span>
                        </div>
                      </div>
                      {mission.dueDate && (
                        <span className={`text-xs font-mono ${isOverdue(mission.dueDate) ? 'text-danger' : 'text-cream-muted'}`}>
                          {new Date(mission.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {secondaryMissions.length === 0 && !heroMission && (
                <Card className="text-center py-8">
                  <p className="text-cream-muted">No active missions. Time to plan.</p>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Right column — Front status + stats */}
        <div className="space-y-4">
          <h3 className="gos-title font-display text-sm font-semibold text-cream-muted">
            Front Status
          </h3>
          {fronts.map((front) => {
            const progress = getFrontProgress(front.id)
            return (
              <Card key={front.id} className="flex items-center gap-4">
                <ProgressRing
                  value={progress}
                  size={48}
                  strokeWidth={3}
                  color={front.color}
                >
                  <span className="text-[10px] font-mono text-cream-muted">
                    {progress}%
                  </span>
                </ProgressRing>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{front.icon}</span>
                    <span className="text-sm font-semibold text-cream">{front.name}</span>
                  </div>
                  <p className="text-xs text-cream-muted truncate mt-0.5">
                    {front.target.description}
                  </p>
                  {front.target.achieved && (
                    <Badge variant="priority" className="mt-1">Achieved</Badge>
                  )}
                </div>
              </Card>
            )
          })}

          {/* Stats */}
          <Card>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-3xl font-mono font-bold text-gold">{currentStreak}</p>
                <p className="text-xs text-cream-muted uppercase tracking-wider mt-1">Day Streak</p>
              </div>
              <div>
                <p className="text-3xl font-mono font-bold text-cream">
                  {missions.filter(m => m.completed).length}
                </p>
                <p className="text-xs text-cream-muted uppercase tracking-wider mt-1">Completed</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Confetti() {
  const colors = ['#D4A853', '#E8C47A', '#F5F0E8', '#4CAF7D', '#4A90D9']
  const pieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animation: `confetti-fall ${2 + Math.random()}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}
