'use client'

import { useState } from 'react'
import { useGosStore } from '@/store/gos-store'
import { getMissionStoneState } from '@/lib/gos-engine'
import { Card } from '@/components/ui/Card'
import { FrontBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Lock, Clock, Zap, AlertTriangle } from 'lucide-react'

type StoneState = 'completed' | 'active' | 'locked' | 'cracked'

export default function MapPage() {
  const { missions, fronts, completeMission } = useGosStore()
  const [selectedMission, setSelectedMission] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [completing, setCompleting] = useState(false)

  const sortedMissions = [...missions].sort((a, b) => a.stonePosition - b.stonePosition)
  const selected = missions.find(m => m.id === selectedMission)
  const selectedFront = selected ? fronts.find(f => f.id === selected.frontId) : null

  async function handleComplete(id: string) {
    setCompleting(true)
    const result = await completeMission(id)
    setCompleting(false)
    if (result) {
      toast(`+${result.xpGained} XP. Keep walking.`, 'hype')
      if (result.checkpointCompleted) toast('Checkpoint cleared.', 'success')
      if (result.targetAchieved) toast('TARGET ACHIEVED.', 'hype')
    }
  }

  const activeMissions = sortedMissions.filter(m => getMissionStoneState(m, missions) === 'active')
  const avatarMissionIndex = activeMissions.length > 0
    ? sortedMissions.indexOf(activeMissions[0])
    : sortedMissions.length - 1

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start gap-6">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="gos-title font-display text-2xl font-bold text-gold">THE PATH</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${filter === 'all' ? 'bg-gold/10 text-gold' : 'text-cream-muted hover:text-cream'}`}>ALL</button>
              {fronts.map(front => (
                <button key={front.id} onClick={() => setFilter(front.id)} className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${filter === front.id ? 'bg-gold/10 text-gold' : 'text-cream-muted hover:text-cream'}`}>
                  {front.icon} {front.name.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Electric vertical road */}
          <div className="relative pb-16">
            {/* Animated center electric line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 overflow-hidden">
              <div className="absolute inset-0 bg-[rgba(147,210,255,0.2)]" />
              <div className="absolute inset-0 electric-flow" />
            </div>

            {sortedMissions.map((mission, index) => {
              const state = getMissionStoneState(mission, missions) as StoneState
              const isLeft = index % 2 === 0
              const front = fronts.find(f => f.id === mission.frontId)
              const isFiltered = filter !== 'all' && mission.frontId !== filter
              const isAvatarHere = index === avatarMissionIndex

              const frontColor = front?.color || '#8A8578'
              const cardStyle: React.CSSProperties = state === 'active' ? {
                border: '1px solid rgba(147,210,255,0.6)',
                borderLeftWidth: '3px',
                borderLeftColor: frontColor,
                boxShadow: '0 0 20px rgba(147,210,255,0.3), inset 0 0 15px rgba(147,210,255,0.05)',
              } : state === 'completed' ? {
                border: '1px solid rgba(212,168,83,0.4)',
                borderLeftWidth: '3px',
                borderLeftColor: frontColor,
              } : state === 'cracked' ? {
                border: '1px solid rgba(224,90,90,0.5)',
                borderLeftWidth: '3px',
                borderLeftColor: frontColor,
                boxShadow: '0 0 10px rgba(224,90,90,0.2)',
              } : {
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeftWidth: '3px',
                borderLeftColor: frontColor,
              }

              return (
                <div key={mission.id} className="relative" style={{ opacity: isFiltered ? 0.2 : 1, transition: 'opacity 0.3s' }}>
                  {/* Avatar */}
                  {isAvatarHere && (
                    <motion.div
                      className="absolute left-1/2 -translate-x-1/2 -top-2 z-20"
                      animate={{ y: [0, -3, 0, 3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center font-display font-bold text-bg-base text-lg shadow-[0_0_20px_rgba(212,168,83,0.5)]">
                        J
                      </div>
                    </motion.div>
                  )}

                  {/* Connector node on center line */}
                  <div className="absolute left-1/2 top-8 -translate-x-1/2 z-10">
                    <div className={`w-2 h-2 rounded-full ${
                      state === 'active'
                        ? 'bg-white shadow-[0_0_8px_rgba(147,210,255,0.9),0_0_20px_rgba(147,210,255,0.4)] animate-pulse'
                        : state === 'completed'
                        ? 'bg-gold shadow-[0_0_6px_rgba(212,168,83,0.5)]'
                        : state === 'cracked'
                        ? 'bg-danger'
                        : 'bg-cream-muted/30'
                    }`} />
                  </div>

                  {/* Horizontal connector line */}
                  <div className={`absolute top-[34px] h-[2px] ${isLeft ? 'right-1/2 left-[48%] mr-1' : 'left-1/2 right-[48%] ml-1'}`}
                    style={{ background: state === 'active' ? 'rgba(147,210,255,0.4)' : 'rgba(147,210,255,0.1)' }} />

                  {/* Card */}
                  <div className={`flex ${isLeft ? 'pr-[52%]' : 'pl-[52%]'} mb-4`}>
                    <motion.div
                      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="w-full"
                    >
                      <button onClick={() => setSelectedMission(mission.id)} className="w-full text-left">
                        <div
                          className={`rounded-xl p-4 transition-all hover:scale-[1.02] ${
                            state === 'completed' ? 'opacity-70' : ''
                          } ${selectedMission === mission.id ? 'ring-1 ring-[rgba(147,210,255,0.5)]' : ''}`}
                          style={{ background: 'linear-gradient(135deg, #111109 0%, #0D0D0B 100%)', ...cardStyle }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {front && <FrontBadge name={front.name} color={front.color} />}
                              <span className="text-[10px] font-mono text-gold">P{mission.priority}</span>
                            </div>
                            {state === 'completed' && <CheckCircle2 className="w-4 h-4 text-gold" />}
                            {state === 'locked' && <Lock className="w-4 h-4 text-cream-muted/30" />}
                            {state === 'cracked' && <AlertTriangle className="w-4 h-4 text-danger" />}
                            {state === 'active' && (
                              <span className="text-[10px] font-mono text-[rgb(147,210,255)] uppercase animate-pulse">ATTACK NOW</span>
                            )}
                          </div>

                          <h4 className={`text-sm font-semibold mb-1 ${state === 'completed' ? 'text-cream-muted line-through' : 'text-cream'}`}>
                            {mission.name}
                          </h4>

                          {state === 'locked' && (
                            <p className="text-[10px] text-cream-muted/40 mb-1">Complete previous mission first</p>
                          )}

                          {mission.definitionOfDone && state !== 'locked' && (
                            <p className="text-xs text-cream-muted/50 line-clamp-1 mb-2">{mission.definitionOfDone}</p>
                          )}

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-cream-muted">
                              {mission.attackDate ? new Date(mission.attackDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                            </span>
                            <span className="text-[10px] font-mono text-cream-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" />{mission.estimatedMinutes}m
                            </span>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  </div>
                </div>
              )
            })}

            {sortedMissions.length === 0 && (
              <Card className="text-center py-12 relative z-10">
                <p className="text-cream-muted">No missions yet. Create one to start your path.</p>
              </Card>
            )}
          </div>
        </div>

        {/* Side panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="w-[380px] flex-shrink-0 sticky top-20"
            >
              <Card variant="gold">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {selectedFront && <FrontBadge name={selectedFront.name} color={selectedFront.color} />}
                    <span className="text-xs font-mono text-gold">P{selected.priority}</span>
                  </div>
                  <button onClick={() => setSelectedMission(null)} className="text-cream-muted hover:text-cream"><X className="w-5 h-5" /></button>
                </div>
                <h3 className="font-display text-lg font-semibold text-cream mb-3">{selected.name}</h3>
                {selected.definitionOfDone && (
                  <div className="mb-4">
                    <p className="text-[10px] font-mono text-cream-muted uppercase tracking-wider mb-1">Done when:</p>
                    <p className="text-sm text-cream-muted">{selected.definitionOfDone}</p>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-cream-muted mb-4">
                  <span className="flex items-center gap-1 font-mono"><Clock className="w-3 h-3" />{selected.estimatedMinutes}min</span>
                  <span className="flex items-center gap-1 font-mono capitalize"><Zap className="w-3 h-3" />{selected.energyDemand}</span>
                  <span className="font-mono">{selected.attackDate ? new Date(selected.attackDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}</span>
                </div>
                {!selected.completed && getMissionStoneState(selected, missions) === 'active' && (
                  <Button variant="primary" className="w-full" size="lg" loading={completing} onClick={() => handleComplete(selected.id)}>
                    <CheckCircle2 className="w-4 h-4" /> MARK COMPLETE
                  </Button>
                )}
                {getMissionStoneState(selected, missions) === 'locked' && (
                  <div className="flex items-center gap-2 text-sm text-cream-muted"><Lock className="w-4 h-4" />Complete previous mission first</div>
                )}
                {selected.completed && (
                  <div className="flex items-center gap-2 text-sm text-gold"><CheckCircle2 className="w-4 h-4" />Completed {selected.completedAt ? new Date(selected.completedAt).toLocaleDateString() : ''}</div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
