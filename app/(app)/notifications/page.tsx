'use client'

import { useGosStore } from '@/store/gos-store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { Bell, BellOff, Clock, Zap, Calendar, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

export default function NotificationsPage() {
  const { notificationRules, updateNotificationRule } = useGosStore()
  const [pushEnabled, setPushEnabled] = useState(false)

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
      new Notification('GOS — Test', {
        body: "You've got boxing at 18:00. No excuses.",
        icon: '/icons/icon-192.png',
      })
      toast('Test notification sent.', 'info')
    } else {
      toast('Enable notifications first.', 'error')
    }
  }

  const typeIcons: Record<string, React.ReactNode> = {
    daily_preview: <Clock className="w-4 h-4 text-front-school" />,
    mission_reminder: <Zap className="w-4 h-4 text-gold" />,
    weekly_review: <Calendar className="w-4 h-4 text-front-business" />,
    front_check: <AlertTriangle className="w-4 h-4 text-danger" />,
  }

  const typeLabels: Record<string, string> = {
    daily_preview: 'Daily',
    mission_reminder: 'Reminder',
    weekly_review: 'Weekly',
    front_check: 'Front Check',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-3xl font-bold text-cream">Notifications</h1>
      <p className="text-cream-muted">Your hype coach. Configure when and how GOS talks to you.</p>

      {/* Push notification toggle */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {pushEnabled ? (
              <Bell className="w-5 h-5 text-gold" />
            ) : (
              <BellOff className="w-5 h-5 text-cream-muted" />
            )}
            <div>
              <p className="text-sm font-semibold text-cream">Push Notifications</p>
              <p className="text-xs text-cream-muted">
                {pushEnabled ? 'Enabled — you will receive browser notifications' : 'Disabled — enable to get reminders'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pushEnabled && (
              <Button variant="ghost" size="sm" onClick={handleTest}>
                Test
              </Button>
            )}
            <Button
              variant={pushEnabled ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => pushEnabled ? setPushEnabled(false) : handleEnablePush()}
            >
              {pushEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Notification rules */}
      <div className="space-y-2">
        <h3 className="font-display text-lg font-semibold text-cream">Notification Rules</h3>
        {notificationRules.map((rule) => (
          <Card key={rule.id} className="flex items-center gap-4">
            {typeIcons[rule.type]}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-cream">{rule.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-cream-muted font-mono">
                  {rule.triggerAt}
                </span>
                <span className="text-xs text-cream-muted">
                  {typeLabels[rule.type]}
                </span>
                {rule.recurring && (
                  <span className="text-xs text-cream-muted capitalize">
                    ({rule.recurring})
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => updateNotificationRule(rule.id, { enabled: !rule.enabled })}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                rule.enabled ? 'bg-gold' : 'bg-bg-elevated'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-cream transition-transform ${
                  rule.enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </Card>
        ))}

        {notificationRules.length === 0 && (
          <Card className="text-center py-8">
            <p className="text-cream-muted">No notification rules configured yet.</p>
          </Card>
        )}
      </div>
    </div>
  )
}
