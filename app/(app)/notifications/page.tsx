'use client'

import { useEffect, useState, useRef } from 'react'
import { useGosStore } from '@/store/gos-store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { Bell, BellOff, Clock, Zap, Calendar, AlertTriangle, Swords } from 'lucide-react'

export default function NotificationsPage() {
  const { notificationRules, updateNotificationRule, fetchNotifications } = useGosStore()
  const [pushEnabled, setPushEnabled] = useState(false)
  const seeded = useRef(false)

  // Auto-seed notification rules if empty
  useEffect(() => {
    if (seeded.current || notificationRules.length > 0) return
    seeded.current = true

    const defaultRules = [
      { type: 'daily_preview', message: "Morning. One win today. What's the mission?", trigger_time: '06:30', recurring: 'daily' },
      { type: 'boxing_reminder', message: 'Boxing in 15 minutes. Non-negotiable.', trigger_time: '17:45', recurring: 'weekdays' },
      { type: 'daily_shutdown', message: 'Shutdown. What got done? What moves tomorrow?', trigger_time: '22:00', recurring: 'daily' },
      { type: 'weekly_review', message: 'Weekly review. 20 minutes. OODA time.', trigger_time: '21:00', recurring: 'friday' },
      { type: 'mission_attack', message: 'Your mission is today. Attack it.', trigger_time: '08:00', recurring: 'on_attack_date' },
    ]

    Promise.all(
      defaultRules.map(rule =>
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rule),
        })
      )
    ).then(() => fetchNotifications())
  }, [notificationRules.length, fetchNotifications])

  async function handleEnablePush() {
    if (!('Notification' in window)) {
      toast('Your browser does not support notifications.', 'error')
      return
    }
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setPushEnabled(true)
      toast('Notifications enabled. No excuses now.', 'hype')
    } else {
      toast('Notification permission denied.', 'error')
    }
  }

  function handleTest() {
    if (Notification.permission === 'granted') {
      new Notification('GOS — Test', { body: "You've got boxing at 18:00. No excuses." })
      toast('Test notification sent.', 'info')
    } else {
      toast('Enable notifications first.', 'error')
    }
  }

  const typeIcons: Record<string, React.ReactNode> = {
    daily_preview: <Clock className="w-4 h-4 text-front-school" />,
    mission_reminder: <Zap className="w-4 h-4 text-gold" />,
    boxing_reminder: <Zap className="w-4 h-4 text-front-health" />,
    weekly_review: <Calendar className="w-4 h-4 text-front-business" />,
    daily_shutdown: <Clock className="w-4 h-4 text-cream-muted" />,
    front_check: <AlertTriangle className="w-4 h-4 text-danger" />,
    mission_attack: <Swords className="w-4 h-4 text-gold" />,
  }

  const recurringLabels: Record<string, string> = {
    daily: 'Every day',
    weekdays: 'Mon-Fri',
    friday: 'Fridays',
    weekly: 'Weekly',
    on_attack_date: 'On attack day',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="gos-title font-display text-2xl font-bold text-gold">NOTIFICATIONS</h1>
      <p className="text-cream-muted text-sm">Your hype coach. Configure when and how GOS talks to you.</p>

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {pushEnabled ? <Bell className="w-5 h-5 text-gold" /> : <BellOff className="w-5 h-5 text-cream-muted" />}
            <div>
              <p className="text-sm font-semibold text-cream">Push Notifications</p>
              <p className="text-xs text-cream-muted">{pushEnabled ? 'Enabled' : 'Disabled — enable to get reminders'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pushEnabled && <Button variant="ghost" size="sm" onClick={handleTest}>Test</Button>}
            <Button variant={pushEnabled ? 'secondary' : 'primary'} size="sm" onClick={() => pushEnabled ? setPushEnabled(false) : handleEnablePush()}>
              {pushEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <h3 className="gos-title font-display text-sm font-semibold text-cream-muted">NOTIFICATION RULES</h3>
        {notificationRules.map((rule) => (
          <Card key={rule.id} className="flex items-center gap-4">
            {typeIcons[rule.type] || <Bell className="w-4 h-4 text-cream-muted" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-cream">{rule.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-gold">{rule.triggerAt}</span>
                {rule.recurring && (
                  <span className="text-xs text-cream-muted bg-bg-elevated px-2 py-0.5 rounded">
                    {recurringLabels[rule.recurring] || rule.recurring}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => updateNotificationRule(rule.id, { enabled: !rule.enabled })}
              className={`relative w-10 h-5 rounded-full transition-colors ${rule.enabled ? 'bg-gold' : 'bg-bg-elevated'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-cream transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </Card>
        ))}

        {notificationRules.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-cream-muted animate-pulse">Seeding default rules...</p>
          </Card>
        )}
      </div>
    </div>
  )
}
