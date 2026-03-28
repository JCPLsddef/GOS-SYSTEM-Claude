'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { Trash2, Plus, Eye, Moon, Sun } from 'lucide-react'

interface Mantra {
  id: string
  text: string
  type: 'dream' | 'nightmare'
}

interface MantraData {
  dreams: Mantra[]
  nightmares: Mantra[]
  todayMantra: Mantra | null
  todayType: 'dream' | 'nightmare'
}

export default function MantrasSettingsPage() {
  const [data, setData] = useState<MantraData | null>(null)
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState<'dream' | 'nightmare'>('dream')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function fetchMantras() {
    const res = await fetch('/api/mantras')
    const json = await res.json()
    if (json.success) setData(json.data)
    setLoading(false)
  }

  useEffect(() => { fetchMantras() }, [])

  async function handleAdd() {
    if (!newText.trim()) return
    setSaving(true)
    const res = await fetch('/api/mantras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText.trim(), type: newType }),
    })
    const json = await res.json()
    setSaving(false)
    if (json.success) {
      toast('Mantra added.', 'success')
      setNewText('')
      fetchMantras()
    }
  }

  async function handleDelete(id: string, type: 'dream' | 'nightmare') {
    setDeleting(id)
    await fetch(`/api/mantras?id=${id}&type=${type}`, { method: 'DELETE' })
    setDeleting(null)
    toast('Mantra removed.', 'info')
    fetchMantras()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cream-muted animate-pulse font-display text-lg">Loading mantras...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="gos-title font-display text-2xl font-bold text-gold">Mantras</h1>
        <p className="text-sm text-cream-muted mt-1">Manage your dream and nightmare mantras.</p>
      </div>

      {/* Today's Preview */}
      {data?.todayMantra && (
        <Card variant="gold" className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-gold" />
            <span className="text-xs font-mono text-gold uppercase tracking-[0.2em]">
              Today&apos;s Mantra ({data.todayType})
            </span>
          </div>
          <p className="text-cream text-sm leading-relaxed italic">
            &ldquo;{data.todayMantra.text}&rdquo;
          </p>
        </Card>
      )}

      {/* Add New Mantra */}
      <Card>
        <h3 className="gos-title font-display text-sm font-semibold text-cream mb-4">
          Add New Mantra
        </h3>
        <textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Write your mantra here..."
          rows={4}
          className="w-full bg-bg-base border border-cream-muted/20 rounded-lg px-4 py-3 text-sm text-cream placeholder-cream-muted/40 focus:border-gold/50 focus:outline-none resize-none"
        />
        <div className="flex items-center gap-3 mt-4">
          {/* Type toggle */}
          <div className="flex rounded-lg overflow-hidden border border-cream-muted/20">
            <button
              onClick={() => setNewType('dream')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-colors ${
                newType === 'dream' ? 'bg-gold/20 text-gold' : 'text-cream-muted hover:text-cream'
              }`}
            >
              <Sun className="w-3 h-3" /> Dream
            </button>
            <button
              onClick={() => setNewType('nightmare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono transition-colors ${
                newType === 'nightmare' ? 'bg-danger/20 text-danger' : 'text-cream-muted hover:text-cream'
              }`}
            >
              <Moon className="w-3 h-3" /> Nightmare
            </button>
          </div>
          <Button variant="primary" size="sm" loading={saving} onClick={handleAdd}>
            <Plus className="w-4 h-4" /> Save
          </Button>
        </div>
      </Card>

      {/* Dream Mantras */}
      <div>
        <h3 className="gos-title font-display text-sm font-semibold text-gold mb-3 flex items-center gap-2">
          <Sun className="w-4 h-4" /> Dream Mantras
        </h3>
        <div className="space-y-2">
          {data?.dreams.map((mantra) => (
            <Card key={mantra.id} className="flex items-start gap-4">
              <p className="text-sm text-cream flex-1 leading-relaxed">
                &ldquo;{mantra.text}&rdquo;
              </p>
              <Button
                variant="ghost"
                size="sm"
                loading={deleting === mantra.id}
                onClick={() => handleDelete(mantra.id, 'dream')}
              >
                <Trash2 className="w-4 h-4 text-danger" />
              </Button>
            </Card>
          ))}
          {(!data?.dreams || data.dreams.length === 0) && (
            <p className="text-sm text-cream-muted">No dream mantras.</p>
          )}
        </div>
      </div>

      {/* Nightmare Mantras */}
      <div>
        <h3 className="gos-title font-display text-sm font-semibold text-danger mb-3 flex items-center gap-2">
          <Moon className="w-4 h-4" /> Nightmare Mantras
        </h3>
        <div className="space-y-2">
          {data?.nightmares.map((mantra) => (
            <Card key={mantra.id} className="flex items-start gap-4">
              <p className="text-sm text-cream flex-1 leading-relaxed">
                &ldquo;{mantra.text}&rdquo;
              </p>
              <Button
                variant="ghost"
                size="sm"
                loading={deleting === mantra.id}
                onClick={() => handleDelete(mantra.id, 'nightmare')}
              >
                <Trash2 className="w-4 h-4 text-danger" />
              </Button>
            </Card>
          ))}
          {(!data?.nightmares || data.nightmares.length === 0) && (
            <p className="text-sm text-cream-muted">No nightmare mantras.</p>
          )}
        </div>
      </div>
    </div>
  )
}
