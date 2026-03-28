'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useGosStore } from '@/store/gos-store'
import { toast } from '@/components/ui/Toast'

interface CreateMissionModalProps {
  open: boolean
  onClose: () => void
}

export function CreateMissionModal({ open, onClose }: CreateMissionModalProps) {
  const { fronts, createMission } = useGosStore()
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [frontId, setFrontId] = useState('')
  const [checkpointId, setCheckpointId] = useState('')
  const [definitionOfDone, setDefinitionOfDone] = useState('')
  const [priority, setPriority] = useState(2)
  const [energyDemand, setEnergyDemand] = useState('medium')
  const [estimatedMinutes, setEstimatedMinutes] = useState(60)
  const [attackDate, setAttackDate] = useState(new Date().toISOString().split('T')[0])
  const [attackTime, setAttackTime] = useState('09:00')
  const [dueDate, setDueDate] = useState('')

  const selectedFront = fronts.find(f => f.id === frontId)
  const checkpoints = selectedFront?.checkpoints || []

  function reset() {
    setName('')
    setFrontId('')
    setCheckpointId('')
    setDefinitionOfDone('')
    setPriority(2)
    setEnergyDemand('medium')
    setEstimatedMinutes(60)
    setAttackDate(new Date().toISOString().split('T')[0])
    setAttackTime('09:00')
    setDueDate('')
  }

  async function handleSave() {
    if (!name.trim() || !frontId) {
      toast('Name and front are required.', 'error')
      return
    }
    setSaving(true)

    const result = await createMission({
      name: name.trim(),
      frontId,
      checkpointId: checkpointId || undefined,
      definitionOfDone,
      priority: priority as 1 | 2 | 3,
      energyDemand: energyDemand as 'high' | 'medium' | 'low',
      estimatedMinutes,
      attackDate: `${attackDate}T${attackTime}:00Z`,
      dueDate: dueDate ? `${dueDate}T23:59:59Z` : undefined,
    })

    setSaving(false)

    if (result) {
      toast('Mission locked in.', 'info')
      reset()
      onClose()
    } else {
      toast('Failed to create mission.', 'error')
    }
  }

  const inputClass = 'w-full bg-bg-base border border-cream-muted/20 rounded-lg px-3 py-2 text-sm text-cream placeholder-cream-muted/40 focus:border-gold/50 focus:outline-none'
  const labelClass = 'text-xs text-cream-muted uppercase tracking-wider mb-1 block font-mono'

  return (
    <Modal open={open} onClose={onClose} title="New Mission">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Name */}
        <div>
          <label className={labelClass}>Mission name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="What needs to be done?"
            className={inputClass}
          />
        </div>

        {/* Front */}
        <div>
          <label className={labelClass}>Battle Front *</label>
          <select
            value={frontId}
            onChange={e => { setFrontId(e.target.value); setCheckpointId('') }}
            className={inputClass}
          >
            <option value="">Select front...</option>
            {fronts.map(f => (
              <option key={f.id} value={f.id}>{f.icon} {f.name}</option>
            ))}
          </select>
        </div>

        {/* Checkpoint */}
        {checkpoints.length > 0 && (
          <div>
            <label className={labelClass}>Checkpoint</label>
            <select
              value={checkpointId}
              onChange={e => setCheckpointId(e.target.value)}
              className={inputClass}
            >
              <option value="">Select checkpoint...</option>
              {checkpoints.map(cp => (
                <option key={cp.id} value={cp.id}>{cp.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Definition of done */}
        <div>
          <label className={labelClass}>Definition of done</label>
          <textarea
            value={definitionOfDone}
            onChange={e => setDefinitionOfDone(e.target.value)}
            placeholder="How do you know it's complete?"
            rows={2}
            className={inputClass + ' resize-none'}
          />
        </div>

        {/* Priority + Energy row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Priority</label>
            <div className="flex gap-2">
              {[1, 2, 3].map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono transition-colors border ${
                    priority === p
                      ? 'bg-gold/20 text-gold border-gold/40'
                      : 'bg-bg-base text-cream-muted border-cream-muted/20 hover:border-cream-muted/40'
                  }`}
                >
                  P{p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Energy</label>
            <select
              value={energyDemand}
              onChange={e => setEnergyDemand(e.target.value)}
              className={inputClass}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Time estimate */}
        <div>
          <label className={labelClass}>Estimated time</label>
          <div className="flex gap-2">
            {[15, 30, 45, 60, 90, 120].map(m => (
              <button
                key={m}
                onClick={() => setEstimatedMinutes(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-mono transition-colors border ${
                  estimatedMinutes === m
                    ? 'bg-gold/20 text-gold border-gold/40'
                    : 'bg-bg-base text-cream-muted border-cream-muted/20 hover:border-cream-muted/40'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Attack date + time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Attack date</label>
            <input
              type="date"
              value={attackDate}
              onChange={e => setAttackDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Attack time</label>
            <input
              type="time"
              value={attackTime}
              onChange={e => setAttackTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Due date */}
        <div>
          <label className={labelClass}>Due date (optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-cream-muted/10">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" loading={saving} onClick={handleSave}>
          Lock In Mission
        </Button>
      </div>
    </Modal>
  )
}
