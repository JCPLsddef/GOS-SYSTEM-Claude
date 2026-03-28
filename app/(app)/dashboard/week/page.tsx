'use client'

import { useGosStore } from '@/store/gos-store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { CheckCircle2, Flame, Mail, Dumbbell, Users, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'

export default function WeekDashboardPage() {
  const { missions, fronts, currentStreak, completeMission, isLoading } = useGosStore()
  const [completing, setCompleting] = useState<string | null>(null)

  // Calculate current week info
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() + 1) // Monday
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6) // Sunday

  const weekNumber = Math.ceil(
    ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7
  )

  const weekStartStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
  const weekEndStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()

  // Week missions = missions with attackDate in this week
  const weekMissions = useMemo(() => {
    const startStr = weekStart.toISOString().split('T')[0]
    const endStr = weekEnd.toISOString().split('T')[0]
    return missions.filter(m => {
      const attackDay = m.attackDate.split('T')[0]
      return attackDay >= startStr && attackDay <= endStr
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missions])

  // Stat card calculations
  const emailMissions = weekMissions.filter(m =>
    m.frontId === 'business' && (
      m.name.toLowerCase().includes('email') ||
      m.name.toLowerCase().includes('cold') ||
      m.name.toLowerCase().includes('outreach')
    )
  )
  const emailsSent = emailMissions.filter(m => m.completed).length
  const emailTarget = emailMissions.length || 50

  const boxingMissions = weekMissions.filter(m =>
    m.frontId === 'health' && m.name.toLowerCase().includes('boxing')
  )
  const boxingDone = boxingMissions.filter(m => m.completed).length

  const schoolMissions = weekMissions.filter(m => m.frontId === 'school')
  const schoolRemaining = schoolMissions.filter(m => !m.completed).length

  // Group missions by front
  const missionsByFront = useMemo(() => {
    const groups: Record<string, typeof weekMissions> = {}
    for (const m of weekMissions) {
      if (!groups[m.frontId]) groups[m.frontId] = []
      groups[m.frontId].push(m)
    }
    return groups
  }, [weekMissions])

  async function handleComplete(missionId: string) {
    setCompleting(missionId)
    const result = await completeMission(missionId)
    setCompleting(null)
    if (result) {
      toast('Mission complete.', 'hype')
      if (result.checkpointCompleted) toast('Checkpoint cleared.', 'success')
      if (result.targetAchieved) toast('TARGET ACHIEVED.', 'hype')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cream-muted animate-pulse font-display text-lg">Loading operations...</div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Days consistent',
      value: `${currentStreak}`,
      icon: Flame,
      color: '#D4A853',
      borderColor: 'border-gold/30',
    },
    {
      label: 'Cold emails sent',
      value: `${emailsSent} / ${emailTarget}`,
      icon: Mail,
      color: '#4CAF7D',
      borderColor: 'border-front-business/30',
    },
    {
      label: 'Boxing sessions',
      value: `${boxingDone} / 5`,
      icon: Dumbbell,
      color: '#E8973A',
      borderColor: 'border-front-health/30',
    },
    {
      label: 'Active clients',
      value: '0',
      subtext: 'Target: 4',
      icon: Users,
      color: '#D4A853',
      borderColor: 'border-gold/30',
    },
    {
      label: 'Assignments left',
      value: `${schoolRemaining}`,
      icon: BookOpen,
      color: '#4A90D9',
      borderColor: 'border-front-school/30',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between" suppressHydrationWarning>
        <div>
          <h1 className="gos-title font-display text-2xl font-bold text-gold">
            WEEK {weekNumber} &mdash; {weekStartStr}&ndash;{weekEndStr}
          </h1>
        </div>
        <div className="text-right">
          <p className="text-5xl font-mono font-bold text-gold">{currentStreak}</p>
          <p className="text-xs text-cream-muted uppercase tracking-[0.2em] mt-1">Day Streak</p>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((card) => (
          <Card key={card.label} className={`text-center ${card.borderColor}`}>
            <card.icon className="w-5 h-5 mx-auto mb-2" style={{ color: card.color }} />
            <p className="text-2xl font-mono font-bold text-cream" style={{ color: card.color }}>
              {card.value}
            </p>
            <p className="text-xs text-cream-muted uppercase tracking-wider mt-1">
              {card.label}
            </p>
            {card.subtext && (
              <p className="text-[10px] text-cream-muted/60 mt-0.5">{card.subtext}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Mission list grouped by front */}
      <div className="space-y-6">
        {fronts.map((front) => {
          const frontMissions = missionsByFront[front.id]
          if (!frontMissions || frontMissions.length === 0) return null

          const completed = frontMissions.filter(m => m.completed).length
          const progress = Math.round((completed / frontMissions.length) * 100)

          return (
            <div key={front.id}>
              {/* Front header + progress bar */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: front.color }} />
                <h3 className="gos-title font-display text-sm font-semibold text-cream">
                  {front.name}
                </h3>
                <span className="text-xs font-mono text-cream-muted">
                  {completed}/{frontMissions.length}
                </span>
                <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: front.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Missions */}
              <div className="space-y-2 ml-6">
                {frontMissions
                  .sort((a, b) => new Date(a.attackDate).getTime() - new Date(b.attackDate).getTime())
                  .map((mission) => {
                    const attackDay = new Date(mission.attackDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })

                    return (
                      <Card
                        key={mission.id}
                        className={`flex items-center gap-4 ${mission.completed ? 'opacity-50' : ''}`}
                      >
                        {/* Front color dot */}
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: front.color }}
                        />

                        {/* Mission name */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${mission.completed ? 'text-cream-muted line-through' : 'text-cream'} truncate`}>
                            {mission.name}
                          </p>
                        </div>

                        {/* Attack date */}
                        <span className="text-xs font-mono text-cream-muted flex-shrink-0">
                          {attackDay}
                        </span>

                        {/* Complete button */}
                        {!mission.completed ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={completing === mission.id}
                            onClick={() => handleComplete(mission.id)}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                        )}
                      </Card>
                    )
                  })}
              </div>
            </div>
          )
        })}

        {Object.keys(missionsByFront).length === 0 && (
          <Card className="text-center py-8">
            <p className="text-cream-muted">No missions this week.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
