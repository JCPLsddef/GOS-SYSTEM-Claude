'use client'

import { useState } from 'react'
import { useGosStore } from '@/store/gos-store'
import type { BattleFront, Checkpoint, Mission } from '@/types/gos'
import { Card } from '@/components/ui/Card'
import { Badge, getFrontBadgeVariant } from '@/components/ui/Badge'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { toast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Target, Clock } from 'lucide-react'

export default function FrontsPage() {
  const { fronts, missions, completeMission, updateFront, getFrontProgress } = useGosStore()

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="font-display text-3xl font-bold text-cream">Battle Fronts</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {fronts.map((front) => (
          <FrontCard
            key={front.id}
            front={front}
            missions={missions.filter(m => m.frontId === front.id)}
            progress={getFrontProgress(front.id)}
            onComplete={completeMission}
            onToggleTarget={async () => {
              await updateFront(front.id, {
                target: { ...front.target, achieved: !front.target.achieved, achievedAt: new Date().toISOString() },
              } as Partial<BattleFront>)
              if (!front.target.achieved) {
                toast('TARGET ACHIEVED. Front conquered.', 'hype')
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}

function FrontCard({
  front,
  missions,
  progress,
  onComplete,
  onToggleTarget,
}: {
  front: BattleFront
  missions: Mission[]
  progress: number
  onComplete: (id: string) => Promise<{ checkpointCompleted: boolean; targetAchieved: boolean } | null>
  onToggleTarget: () => void
}) {
  const [expandedCheckpoint, setExpandedCheckpoint] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)

  async function handleComplete(missionId: string) {
    setCompleting(missionId)
    await onComplete(missionId)
    setCompleting(null)
    toast('Mission done.', 'success')
  }

  return (
    <Card
      className="flex flex-col"
      style={{ borderTop: `3px solid ${front.color}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{front.icon}</span>
          <div>
            <h2 className="font-display text-xl font-bold text-cream">{front.name}</h2>
            <Badge variant={getFrontBadgeVariant(front.id)}>{front.type}</Badge>
          </div>
        </div>
        <ProgressRing value={progress} size={52} strokeWidth={3} color={front.color}>
          <span className="text-xs font-mono text-cream-muted">{progress}%</span>
        </ProgressRing>
      </div>

      {/* Binary Target */}
      <div className="bg-bg-elevated rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-4 h-4 text-gold" />
          <span className="text-xs font-mono text-gold uppercase tracking-wider">Target</span>
        </div>
        <p className="text-sm text-cream mb-2">{front.target.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-cream-muted">
            Deadline: {formatDate(front.target.deadline)}
          </span>
          <button
            onClick={onToggleTarget}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
              front.target.achieved
                ? 'bg-gold/20 text-gold'
                : 'bg-bg-surface text-cream-muted hover:text-cream'
            }`}
          >
            {front.target.achieved ? '✓ Achieved' : 'Mark Achieved'}
          </button>
        </div>
      </div>

      {/* Checkpoints */}
      <div className="space-y-2 flex-1">
        <p className="text-xs text-cream-muted uppercase tracking-wider mb-2">Checkpoints</p>
        {front.checkpoints.map((cp: Checkpoint) => {
          const isExpanded = expandedCheckpoint === cp.id
          const cpMissions = missions.filter((m: Mission) => m.checkpointId === cp.id)
          const cpDone = cpMissions.filter((m: Mission) => m.completed).length
          const cpTotal = cpMissions.length

          return (
            <div key={cp.id}>
              <button
                onClick={() => setExpandedCheckpoint(isExpanded ? null : cp.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-bg-elevated transition-colors"
              >
                {cp.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-cream-muted flex-shrink-0" />
                )}
                <span className={`text-sm flex-1 ${cp.completed ? 'text-cream-muted line-through' : 'text-cream'}`}>
                  {cp.name}
                </span>
                <span className="text-xs font-mono text-cream-muted">
                  {cpDone}/{cpTotal}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-cream-muted" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-cream-muted" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-9 pr-3 pb-2 space-y-1">
                      {cpMissions.map((mission: Mission) => (
                        <div
                          key={mission.id}
                          className="flex items-center gap-2 py-1.5"
                        >
                          <button
                            onClick={() => !mission.completed && handleComplete(mission.id)}
                            disabled={mission.completed || completing === mission.id}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                              mission.completed
                                ? 'bg-gold border-gold'
                                : 'border-cream-muted/30 hover:border-gold'
                            }`}
                          >
                            {mission.completed && (
                              <CheckCircle2 className="w-3 h-3 text-bg-base" />
                            )}
                            {completing === mission.id && (
                              <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                            )}
                          </button>
                          <span className={`text-xs flex-1 ${
                            mission.completed ? 'text-cream-muted line-through' : 'text-cream'
                          }`}>
                            {mission.name}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-cream-muted">
                            <Clock className="w-3 h-3" />
                            {mission.estimatedMinutes}m
                          </div>
                        </div>
                      ))}
                      {cpMissions.length === 0 && (
                        <p className="text-xs text-cream-muted italic py-1">No missions yet</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
