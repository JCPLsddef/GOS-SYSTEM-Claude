'use client'

import { useGosStore } from '@/store/gos-store'
import { Card } from '@/components/ui/Card'
import { Badge, getFrontBadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { toast } from '@/components/ui/Toast'
import { formatDate, isOverdue } from '@/lib/utils'
import { CheckCircle2, Clock, Zap, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function DashboardPage() {
  const { missions, fronts, currentStreak, completeMission, getFrontProgress, isLoading } = useGosStore()

  const todayMissions = useGosStore(s => s.getTodayMissions())
  const allActiveMissions = missions.filter(m => !m.completed).sort((a, b) => a.priority - b.priority)
  const heroMission = todayMissions[0] || allActiveMissions[0]
  const secondaryMissions = (todayMissions.length > 0 ? todayMissions.slice(1) : allActiveMissions.slice(1)).slice(0, 5)

  const [completing, setCompleting] = useState<string | null>(null)

  async function handleComplete(missionId: string) {
    setCompleting(missionId)
    const result = await completeMission(missionId)
    setCompleting(null)

    if (result) {
      toast('Mission complete. Keep moving.', 'hype')
      if (result.checkpointCompleted) {
        toast('Checkpoint cleared.', 'success')
      }
      if (result.targetAchieved) {
        toast('TARGET ACHIEVED. Front conquered.', 'hype')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cream-muted animate-pulse font-display text-lg">Loading operations...</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-3xl font-bold text-cream">
          Good {getTimeOfDay()}, Juan.
        </h1>
        <p className="text-cream-muted mt-1">
          {todayMissions.length > 0
            ? `${todayMissions.length} mission${todayMissions.length > 1 ? 's' : ''} on deck today.`
            : 'No missions scheduled for today. Plan your attack.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero mission */}
          {heroMission && (
            <Card variant="gold" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-gold" />
                  <span className="text-xs font-mono text-gold uppercase tracking-wider">
                    Priority Mission
                  </span>
                </div>
                <h2 className="font-display text-xl font-bold text-cream mb-2">
                  {heroMission.name}
                </h2>
                <p className="text-sm text-cream-muted mb-4">
                  {heroMission.definitionOfDone}
                </p>

                <div className="flex items-center gap-3 mb-4">
                  <Badge variant={getFrontBadgeVariant(heroMission.frontId)}>
                    {heroMission.frontId}
                  </Badge>
                  <Badge variant="priority">P{heroMission.priority}</Badge>
                  <div className="flex items-center gap-1 text-xs text-cream-muted">
                    <Clock className="w-3 h-3" />
                    {heroMission.estimatedMinutes}min
                  </div>
                  {heroMission.dueDate && isOverdue(heroMission.dueDate) && (
                    <div className="flex items-center gap-1 text-xs text-danger">
                      <AlertTriangle className="w-3 h-3" />
                      Overdue
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  loading={completing === heroMission.id}
                  onClick={() => handleComplete(heroMission.id)}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Complete Mission
                </Button>
              </div>
            </Card>
          )}

          {/* Secondary missions */}
          <div>
            <h3 className="font-display text-lg font-semibold text-cream mb-3">
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
                  >
                    <Card className="flex items-center gap-4">
                      <button
                        onClick={() => handleComplete(mission.id)}
                        disabled={completing === mission.id}
                        className="w-6 h-6 rounded-full border-2 border-cream-muted/30 hover:border-gold flex items-center justify-center transition-colors flex-shrink-0"
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
                          <span className="text-xs text-cream-muted">
                            P{mission.priority}
                          </span>
                          <span className="text-xs text-cream-muted">
                            {mission.estimatedMinutes}min
                          </span>
                        </div>
                      </div>
                      {mission.dueDate && (
                        <span className={`text-xs ${isOverdue(mission.dueDate) ? 'text-danger' : 'text-cream-muted'}`}>
                          {formatDate(mission.dueDate)}
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

        {/* Right sidebar — Front status */}
        <div className="space-y-4">
          <h3 className="font-display text-lg font-semibold text-cream">
            Battle Fronts
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
                <p className="text-2xl font-display font-bold text-gold">{currentStreak}</p>
                <p className="text-xs text-cream-muted">Day Streak</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-cream">
                  {missions.filter(m => m.completed).length}
                </p>
                <p className="text-xs text-cream-muted">Completed</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
