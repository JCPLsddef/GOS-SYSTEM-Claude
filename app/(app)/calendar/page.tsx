'use client'

import { useState, useEffect } from 'react'
import { useGosStore } from '@/store/gos-store'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { startOfWeek, endOfWeek, addWeeks, format, isSameDay, isToday, addDays } from 'date-fns'

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6:00 - 23:00

export default function CalendarPage() {
  const { missions, calendarEvents, fetchCalendarEvents, syncToCalendar, lastSyncedAt } = useGosStore()
  // null initial state avoids SSR/client timezone hydration mismatch
  const [weekStart, setWeekStart] = useState<Date | null>(null)
  const [syncing, setSyncing] = useState(false)

  // Set weekStart only on client to avoid hydration mismatch from new Date() timezone differences
  useEffect(() => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }, [])

  useEffect(() => {
    if (!weekStart) return
    fetchCalendarEvents(weekStart.toISOString())
  }, [weekStart, fetchCalendarEvents])

  // Guard: show loading until client has initialised weekStart
  if (!weekStart) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cream-muted animate-pulse font-display text-lg">Loading calendar...</div>
      </div>
    )
  }

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Get missions for this week
  const weekMissions = missions.filter(m => {
    const date = new Date(m.attackDate)
    return date >= weekStart && date <= weekEnd
  })

  async function handleSync() {
    setSyncing(true)
    const result = await syncToCalendar()
    setSyncing(false)
    if (result) {
      toast(`Synced: ${result.created} created, ${result.updated} updated`, 'success')
      fetchCalendarEvents(weekStart!.toISOString())
    } else {
      toast('Sync failed. Check your Google connection.', 'error')
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekStart(addWeeks(weekStart!, -1))}
            className="p-2 rounded-lg text-cream-muted hover:text-cream hover:bg-bg-elevated"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-display text-lg font-semibold text-cream">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
          </h2>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart!, 1))}
            className="p-2 rounded-lg text-cream-muted hover:text-cream hover:bg-bg-elevated"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="px-3 py-1.5 rounded-lg text-sm text-cream-muted hover:text-cream hover:bg-bg-elevated"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          {lastSyncedAt && (
            <span className="text-xs text-cream-muted">
              Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}
            </span>
          )}
          <Button variant="secondary" size="sm" loading={syncing} onClick={handleSync}>
            <RefreshCw className="w-4 h-4" />
            Sync to Google Calendar
          </Button>
        </div>
      </div>

      {/* Week grid */}
      <div className="bg-bg-surface border border-cream-muted/10 rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-cream-muted/10">
          <div className="p-2" /> {/* Time column header */}
          {days.map(day => (
            <div
              key={day.toISOString()}
              className={`p-3 text-center border-l border-cream-muted/10 ${
                isToday(day) ? 'bg-gold/5' : ''
              }`}
            >
              <p className="text-xs text-cream-muted">{format(day, 'EEE')}</p>
              <p className={`text-lg font-display ${
                isToday(day) ? 'text-gold font-bold' : 'text-cream'
              }`}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="max-h-[600px] overflow-y-auto">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[50px]">
              {/* Time label */}
              <div className="px-2 py-1 text-xs text-cream-muted text-right font-mono border-r border-cream-muted/10">
                {String(hour).padStart(2, '0')}:00
              </div>

              {/* Day cells */}
              {days.map(day => {
                const { events, missionBlocks } = getEventsForDayAndHour(day, hour)
                return (
                  <div
                    key={day.toISOString() + hour}
                    className={`border-l border-b border-cream-muted/5 p-0.5 ${
                      isToday(day) ? 'bg-gold/[0.02]' : ''
                    }`}
                  >
                    {/* Google Calendar events */}
                    {events.map(event => (
                      <div
                        key={event.id}
                        className="text-xs px-1.5 py-1 rounded bg-cream-muted/10 text-cream-muted mb-0.5 truncate"
                      >
                        {event.title}
                      </div>
                    ))}

                    {/* GOS mission blocks */}
                    {missionBlocks.map(mission => (
                      <div
                        key={mission.id}
                        className="text-xs px-1.5 py-1 rounded mb-0.5 truncate"
                        style={{
                          backgroundColor: `${mission.frontId === 'business' ? '#4CAF7D' : mission.frontId === 'school' ? '#4A90D9' : '#E8973A'}20`,
                          color: mission.frontId === 'business' ? '#4CAF7D' : mission.frontId === 'school' ? '#4A90D9' : '#E8973A',
                          borderLeft: `2px solid ${mission.frontId === 'business' ? '#4CAF7D' : mission.frontId === 'school' ? '#4A90D9' : '#E8973A'}`,
                        }}
                      >
                        {mission.completed ? '✓ ' : ''}{mission.name}
                      </div>
                    ))}
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
