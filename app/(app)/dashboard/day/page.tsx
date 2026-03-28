'use client'

import { useGosStore, getLevel } from '@/store/gos-store'
import { Card } from '@/components/ui/Card'
import { FrontBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { CreateMissionModal } from '@/components/CreateMissionModal'
import { toast } from '@/components/ui/Toast'
import { isOverdue, isToday } from '@/lib/utils'
import { CheckCircle2, Clock, Zap, AlertTriangle, Plus, Flame } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'

export default function DayDashboardPage() {
  const { missions, fronts, currentStreak, totalXp, completeMission, getFrontProgress, getFrontById, isLoading } = useGosStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [completing, setCompleting] = useState<string | null>(null)
  const [justCompleted, setJustCompleted] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [xpFloat, setXpFloat] = useState<{ amount: number; id: string } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const level = getLevel(totalXp)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const todayMissions = useMemo(
    () => missions.filter(m => !m.completed && m.attackDate && isToday(m.attackDate)).sort((a, b) => a.priority - b.priority),
    [missions]
  )
  const allActiveMissions = useMemo(
    () => missions.filter(m => !m.completed).sort((a, b) => a.priority - b.priority),
    [missions]
  )

  const heroMission = todayMissions[0] || allActiveMissions[0]
  const heroFront = heroMission ? getFrontById(heroMission.frontId) : null
  const secondaryMissions = (todayMissions.length > 0 ? todayMissions.slice(1) : allActiveMissions.slice(1)).slice(0, 5)

  async function handleComplete(missionId: string) {
    setCompleting(missionId)
    const result = await completeMission(missionId)
    setCompleting(null)

    if (result) {
      setJustCompleted(missionId)
      setXpFloat({ amount: result.xpGained, id: missionId })
      setTimeout(() => { setJustCompleted(null); setXpFloat(null) }, 1200)

      toast(`${missions.find(m => m.id === missionId)?.name || 'Mission'} DONE. Keep going.`, 'success')
      if (result.checkpointCompleted) toast('Checkpoint cleared.', 'success')
      if (result.targetAchieved) toast('TARGET ACHIEVED. Front conquered.', 'hype')

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
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="flex items-start justify-between" suppressHydrationWarning>
        <div>
          <h1 className="gos-title font-display text-2xl font-bold text-gold">
            TODAY &mdash; {dayName} {dateStr}
          </h1>
          <p className="font-mono text-sm text-cream-muted mt-1">{timeStr}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <Flame className="w-4 h-4 text-gold" />
              <span className="text-2xl font-mono font-bold text-gold">{currentStreak}</span>
            </div>
            <p className="text-[10px] text-cream-muted uppercase tracking-wider">Day Streak</p>
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-gold uppercase tracking-wider">{level.name}</span>
        <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gold rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(level.current / level.max) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <span className="text-[10px] font-mono text-cream-muted">{totalXp} XP</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Hero mission */}
          {heroMission ? (
            <div className={`relative ${justCompleted === heroMission.id ? 'animate-complete-pulse' : ''}`}>
              <Card variant="gold" className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-gold" />
                    <span className="text-[10px] font-mono text-gold uppercase tracking-[0.2em]">
                      #1 Mission Today
                    </span>
                  </div>

                  <h2 className="font-display text-xl md:text-[28px] font-bold text-cream mb-2 leading-tight">
                    {heroMission.name}
                  </h2>

                  {heroMission.definitionOfDone && (
                    <div className="mb-4">
                      <span className="text-[10px] font-mono text-cream-muted/60 uppercase">Done when:</span>
                      <p className="text-sm text-cream-muted">{heroMission.definitionOfDone}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                    {heroFront && <FrontBadge name={heroFront.name} color={heroFront.color} />}
                    <span className="text-xs font-mono text-gold">P{heroMission.priority}</span>
                    <span className="flex items-center gap-1 text-xs text-cream-muted font-mono">
                      <Clock className="w-3 h-3" />{heroMission.estimatedMinutes}min
                    </span>
                    <span className="flex items-center gap-1 text-xs text-cream-muted font-mono capitalize">
                      <Zap className="w-3 h-3" />{heroMission.energyDemand}
                    </span>
                    {heroMission.dueDate && isOverdue(heroMission.dueDate) && (
                      <span className="flex items-center gap-1 text-xs text-danger">
                        <AlertTriangle className="w-3 h-3" />Overdue
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      loading={completing === heroMission.id}
                      onClick={() => handleComplete(heroMission.id)}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      MARK COMPLETE ✓
                    </Button>

                    {/* XP float animation */}
                    <AnimatePresence>
                      {xpFloat && xpFloat.id === heroMission.id && (
                        <motion.span
                          className="absolute -top-4 left-1/2 -translate-x-1/2 text-gold font-mono font-bold text-lg pointer-events-none"
                          initial={{ opacity: 1, y: 0 }}
                          animate={{ opacity: 0, y: -40 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.2 }}
                        >
                          +{xpFloat.amount} XP
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="text-center py-12">
              <p className="text-cream-muted text-lg mb-3">No missions planned. Ready to build your empire?</p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4" /> ADD YOUR FIRST MISSION
              </Button>
            </Card>
          )}

          {/* Secondary missions */}
          {secondaryMissions.length > 0 && (
            <div>
              <h3 className="gos-title font-display text-xs font-semibold text-cream-muted mb-3">
                {todayMissions.length > 0 ? 'Other Missions Today' : 'Upcoming Missions'}
              </h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {secondaryMissions.map(mission => {
                    const front = getFrontById(mission.frontId)
                    return (
                      <motion.div
                        key={mission.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`relative ${justCompleted === mission.id ? 'animate-complete-pulse' : ''}`}
                      >
                        <Card className="flex items-center gap-4">
                          <button
                            onClick={() => handleComplete(mission.id)}
                            disabled={completing === mission.id}
                            className="w-6 h-6 rounded-full border-2 border-cream-muted/30 hover:border-gold flex items-center justify-center transition-all flex-shrink-0"
                          >
                            {completing === mission.id && <div className="w-3 h-3 rounded-full bg-gold animate-pulse" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-cream truncate">{mission.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {front && <FrontBadge name={front.name} color={front.color} />}
                              <span className="text-[10px] text-cream-muted font-mono">P{mission.priority}</span>
                              <span className="text-[10px] text-cream-muted font-mono">{mission.estimatedMinutes}min</span>
                            </div>
                          </div>
                          {/* XP float */}
                          <AnimatePresence>
                            {xpFloat && xpFloat.id === mission.id && (
                              <motion.span
                                className="absolute -top-2 right-4 text-gold font-mono font-bold text-sm pointer-events-none"
                                initial={{ opacity: 1, y: 0 }}
                                animate={{ opacity: 0, y: -30 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1 }}
                              >
                                +{xpFloat.amount} XP
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <h3 className="gos-title font-display text-xs font-semibold text-cream-muted">
            Front Status
          </h3>
          {fronts.map(front => {
            const progress = getFrontProgress(front.id)
            const deadline = front.target.deadline ? new Date(front.target.deadline) : null
            const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null
            return (
              <Card key={front.id} className="flex items-center gap-4">
                <ProgressRing value={progress} size={48} strokeWidth={3} color={front.color}>
                  <span className="text-[10px] font-mono text-cream-muted">{progress}%</span>
                </ProgressRing>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{front.icon}</span>
                    <span className="text-sm font-semibold text-cream">{front.name}</span>
                  </div>
                  <p className="text-xs text-cream-muted truncate mt-0.5">{front.target.description}</p>
                  {daysLeft !== null && daysLeft > 0 && (
                    <p className="text-[10px] font-mono text-cream-muted/60 mt-0.5">{daysLeft} days left</p>
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
                <p className="text-[10px] text-cream-muted uppercase tracking-wider mt-1">Day Streak</p>
              </div>
              <div>
                <p className="text-3xl font-mono font-bold text-cream">
                  {missions.filter(m => m.completed).length}
                </p>
                <p className="text-[10px] text-cream-muted uppercase tracking-wider mt-1">Completed</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <CreateMissionModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
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
