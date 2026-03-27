'use client'

import { useState } from 'react'
import { useGosStore } from '@/store/gos-store'
import { getMissionStoneState } from '@/lib/gos-engine'
import { Card } from '@/components/ui/Card'
import { Badge, getFrontBadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Lock, Clock } from 'lucide-react'

// Road path: a winding path from left to right
const ROAD_PATH = "M 50,450 C 150,450 200,350 300,350 S 450,250 550,250 S 700,150 800,150 S 950,80 1050,80"

export default function MapPage() {
  const { missions, fronts, avatarPosition, completeMission } = useGosStore()
  const [selectedMission, setSelectedMission] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [completing, setCompleting] = useState(false)

  const filteredMissions = filter === 'all'
    ? missions
    : missions.filter(m => m.frontId === filter)

  const sortedMissions = [...filteredMissions].sort((a, b) => a.stonePosition - b.stonePosition)
  const selected = missions.find(m => m.id === selectedMission)

  async function handleComplete(id: string) {
    setCompleting(true)
    const result = await completeMission(id)
    setCompleting(false)
    if (result) {
      toast('Stone lit. Keep walking.', 'hype')
      setSelectedMission(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filter === 'all' ? 'bg-gold/10 text-gold' : 'text-cream-muted hover:text-cream'
          }`}
        >
          All
        </button>
        {fronts.map(front => (
          <button
            key={front.id}
            onClick={() => setFilter(front.id)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === front.id ? 'bg-gold/10 text-gold' : 'text-cream-muted hover:text-cream'
            }`}
          >
            {front.icon} {front.name}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div className="relative bg-bg-surface border border-cream-muted/10 rounded-xl overflow-hidden" style={{ minHeight: '500px' }}>
        <svg
          viewBox="0 0 1100 500"
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background terrain hints */}
          <defs>
            <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1A1A14" />
              <stop offset="100%" stopColor="#111109" />
            </linearGradient>
          </defs>

          {/* Road path - background */}
          <path
            d={ROAD_PATH}
            fill="none"
            stroke="#2A2A20"
            strokeWidth="30"
            strokeLinecap="round"
          />

          {/* Road path - main */}
          <path
            d={ROAD_PATH}
            fill="none"
            stroke="#1A1A14"
            strokeWidth="24"
            strokeLinecap="round"
          />

          {/* Road dashes */}
          <path
            d={ROAD_PATH}
            fill="none"
            stroke="#2A2A20"
            strokeWidth="2"
            strokeDasharray="8,12"
            strokeLinecap="round"
          />

          {/* Stepping stones */}
          {sortedMissions.map((mission) => {
            const state = getMissionStoneState(mission, missions)
            const t = mission.stonePosition / 100
            // Approximate position along path
            const x = 50 + t * 1000
            const y = 450 - t * 370 + Math.sin(t * Math.PI * 2) * 30

            const stoneColors = {
              completed: '#D4A853',
              active: '#F5F0E8',
              locked: '#3A3A30',
              cracked: '#E05A5A',
            }

            const opacity = filter !== 'all' && mission.frontId !== filter ? 0.2 : 1

            return (
              <g
                key={mission.id}
                style={{ cursor: 'pointer', opacity }}
                onClick={() => setSelectedMission(mission.id)}
              >
                {/* Stone glow for completed */}
                {state === 'completed' && (
                  <circle cx={x} cy={y} r={16} fill="#D4A853" opacity={0.15} />
                )}

                {/* Stone */}
                <circle
                  cx={x}
                  cy={y}
                  r={12}
                  fill={stoneColors[state]}
                  stroke={state === 'active' ? '#D4A853' : 'none'}
                  strokeWidth={state === 'active' ? 2 : 0}
                >
                  {state === 'active' && (
                    <animate
                      attributeName="opacity"
                      values="1;0.6;1"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>

                {/* Icons */}
                {state === 'completed' && (
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fill="#0A0A08">
                    ✓
                  </text>
                )}
                {state === 'locked' && (
                  <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="#8A8578">
                    🔒
                  </text>
                )}

                {/* Front color indicator */}
                <circle
                  cx={x}
                  cy={y - 18}
                  r={3}
                  fill={fronts.find(f => f.id === mission.frontId)?.color || '#888'}
                />
              </g>
            )
          })}

          {/* Avatar */}
          <motion.g
            animate={{
              x: 50 + (avatarPosition / 100) * 1000 - 50,
              y: 450 - (avatarPosition / 100) * 370 + Math.sin((avatarPosition / 100) * Math.PI * 2) * 30 - 35,
            }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <circle cx={50} cy={35} r={14} fill="#D4A853" />
            <text x={50} y={40} textAnchor="middle" fontSize="16">
              🧑
            </text>
          </motion.g>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex items-center gap-4 bg-bg-base/80 backdrop-blur-sm px-4 py-2 rounded-lg">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gold" />
            <span className="text-xs text-cream-muted">Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-cream border border-gold" />
            <span className="text-xs text-cream-muted">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#3A3A30]" />
            <span className="text-xs text-cream-muted">Locked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-danger" />
            <span className="text-xs text-cream-muted">Missed</span>
          </div>
        </div>
      </div>

      {/* Selected mission side panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card variant="gold">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={getFrontBadgeVariant(selected.frontId)}>
                    {selected.frontId}
                  </Badge>
                  <Badge variant="priority">P{selected.priority}</Badge>
                </div>
                <button onClick={() => setSelectedMission(null)} className="text-cream-muted hover:text-cream">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h3 className="font-display text-lg font-semibold text-cream mb-2">
                {selected.name}
              </h3>
              <p className="text-sm text-cream-muted mb-4">{selected.definitionOfDone}</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-cream-muted">
                  <Clock className="w-3 h-3" />
                  {selected.estimatedMinutes}min
                </div>
                <span className="text-xs text-cream-muted capitalize">
                  {selected.energyDemand} energy
                </span>
              </div>
              {!selected.completed && getMissionStoneState(selected, missions) === 'active' && (
                <Button
                  variant="primary"
                  className="mt-4"
                  loading={completing}
                  onClick={() => handleComplete(selected.id)}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete
                </Button>
              )}
              {getMissionStoneState(selected, missions) === 'locked' && (
                <div className="flex items-center gap-2 mt-4 text-sm text-cream-muted">
                  <Lock className="w-4 h-4" />
                  Dependencies not met
                </div>
              )}
              {selected.completed && (
                <div className="flex items-center gap-2 mt-4 text-sm text-gold">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed {selected.completedAt ? new Date(selected.completedAt).toLocaleDateString() : ''}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
