'use client'

import { useState, useEffect } from 'react'
import { useGosStore } from '@/store/gos-store'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { ChevronLeft, ChevronRight, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { startOfWeek, endOfWeek, addWeeks, format, isSameDay, isToday, addDays } from 'date-fns'

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6)

export default function CalendarPage() {
  const { missions, calendarEvents, fetchCalendarEvents, lastSyncedAt, getFrontById } = useGosStore()
  const [weekStart, setWeekStart] = useState<Date | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }, [])

  useEffect(() => {
    if (!weekStart) return
    fetchCalendarEvents(weekStart.toISOString())
  }, [weekStart, fetchCalendarEvents])

  if (!weekStart) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cream-muted animate-pulse font-display text-lg">Loading calendar...</div>
      </div>
    )
  }

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const weekMissions = missions.filter(m => {
    if (!m.attackDate) return false
    const date = new Date(m.attackDate)
    return date >= weekStart && date <= weekEnd
  })

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/calendar/sync', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        const synced = json.data.synced || (json.data.created + json.data.updated)
        setSyncResult({ type: 'success', message: `${synced} events synced` })
        toast(`${synced} missions pushed to Google Calendar.`, 'success')
        fetchCalendarEvents(weekStart!.toISOString())
      } else {
        setSyncResult({ type: 'error', message: json.error || 'Sync failed' })
        toast(json.error || 'Sync failed.', 'error')
      }
    } catch {
      setSyncResult({ type: 'error', message: 'Network error' })
      toast('Network error during sync.', 'error')
    }
    setSyncing(false)
    setTimeout(() => setSyncResult(null), 5000)
  }

  function getEventsForDayAndHour(day: Date, hour: number) {
    const events = calendarEvents.filter(e => {
      const start = new Date(e.start)
      return isSameDay(start, day) && start.getHours() === hour
    })

    const missionBlocks = weekMissions.filter(m => {
      const start = new Date(m.attackDate)
      return isSameDay(start, day) && start.getHours() === hour
    })

    return { events, missionBlocks }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekStart(addWeeks(weekStart!, -1))} className="p-2 rounded-lg text-cream-muted hover:text-cream hover:bg-bg-elevated">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="gos-title font-display text-lg font-semibold text-gold">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
          </h2>
          <button onClick={() => setWeekStart(addWeeks(weekStart!, 1))} className="p-2 rounded-lg text-cream-muted hover:text-cream hover:bg-bg-elevated">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="px-3 py-1.5 rounded-lg text-sm text-cream-muted hover:text-cream hover:bg-bg-elevated">
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          {lastSyncedAt && (
            <span className="text-xs text-cream-muted font-mono">
              Last: {new Date(lastSyncedAt).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant={syncResult?.type === 'success' ? 'secondary' : syncResult?.type === 'error' ? 'danger' : 'secondary'}
            size="sm"
            loading={syncing}
            onClick={handleSync}
          >
            {syncResult?.type === 'success' ? (
              <><Check className="w-4 h-4 text-front-business" />{syncResult.message}</>
            ) : syncResult?.type === 'error' ? (
              <><AlertCircle className="w-4 h-4" />{syncResult.message}</>
            ) : (
              <><RefreshCw className="w-4 h-4" />Sync to Google Calendar</>
            )}
          </Button>
        </div>
      </div>

      <div className="gos-card rounded-xl overflow-hidden">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-cream-muted/10">
          <div className="p-2" />
          {days.map(day => (
            <div key={day.toISOString()} className={`p-3 text-center border-l border-cream-muted/10 ${isToday(day) ? 'bg-gold/5' : ''}`}>
              <p className="text-xs text-cream-muted">{format(day, 'EEE')}</p>
              <p className={`text-lg font-display ${isToday(day) ? 'text-gold font-bold' : 'text-cream'}`}>{format(day, 'd')}</p>
            </div>
          ))}
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[50px]">
              <div className="px-2 py-1 text-xs text-cream-muted text-right font-mono border-r border-cream-muted/10">
                {String(hour).padStart(2, '0')}:00
              </div>
              {days.map(day => {
                const { events, missionBlocks } = getEventsForDayAndHour(day, hour)
                return (
                  <div key={day.toISOString() + hour} className={`border-l border-b border-cream-muted/5 p-0.5 ${isToday(day) ? 'bg-gold/[0.02]' : ''}`}>
                    {events.map(event => (
                      <div key={event.id} className="text-xs px-1.5 py-1 rounded mb-0.5 truncate" style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#8A8578' }}>
                        {event.title}
                      </div>
                    ))}
                    {missionBlocks.map(mission => {
                      const front = getFrontById(mission.frontId)
                      const color = front?.color || '#D4A853'
                      return (
                        <div key={mission.id} className="text-xs px-1.5 py-1 rounded mb-0.5 truncate" style={{ backgroundColor: `${color}20`, color: color, borderLeft: `2px solid ${color}` }}>
                          {mission.completed ? '✓ ' : ''}{mission.name}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
