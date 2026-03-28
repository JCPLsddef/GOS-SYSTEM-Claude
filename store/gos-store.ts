'use client'

import { create } from 'zustand'
import type { BattleFront, Mission, NotificationRule, CalendarEvent } from '@/types/gos'
import { calculateAvatarPosition, calculateStreak } from '@/lib/gos-engine'
import { isToday } from '@/lib/utils'

// XP constants
const XP_VALUES = { 1: 100, 2: 50, 3: 25 } as const
const LEVELS = [
  { name: 'Recruit', min: 0 },
  { name: 'Operator', min: 500 },
  { name: 'Commander', min: 1500 },
  { name: 'General', min: 3500 },
  { name: 'King', min: 7500 },
] as const

export function getLevel(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) {
      const next = LEVELS[i + 1]
      return {
        name: LEVELS[i].name,
        current: xp - LEVELS[i].min,
        max: next ? next.min - LEVELS[i].min : 5000,
        index: i,
      }
    }
  }
  return { name: 'Recruit', current: 0, max: 500, index: 0 }
}

export function getXpForPriority(priority: number): number {
  return XP_VALUES[priority as keyof typeof XP_VALUES] || 25
}

interface GOSStore {
  fronts: BattleFront[]
  missions: Mission[]
  notificationRules: NotificationRule[]
  calendarEvents: CalendarEvent[]
  avatarPosition: number
  currentStreak: number
  totalXp: number
  lastSyncedAt: string | null
  isLoading: boolean
  isSeeded: boolean

  fetchAll: () => Promise<void>
  fetchFronts: () => Promise<void>
  fetchMissions: () => Promise<void>
  fetchNotifications: () => Promise<void>
  fetchCalendarEvents: (weekStart: string) => Promise<void>
  completeMission: (missionId: string) => Promise<{ checkpointCompleted: boolean; targetAchieved: boolean; xpGained: number } | null>
  createMission: (mission: Partial<Mission>) => Promise<Mission | null>
  updateMission: (id: string, updates: Partial<Mission>) => Promise<void>
  deleteMission: (id: string) => Promise<void>
  updateFront: (frontId: string, updates: Partial<BattleFront>) => Promise<void>
  updateNotificationRule: (ruleId: string, updates: Partial<NotificationRule>) => Promise<void>
  syncToCalendar: () => Promise<{ created: number; updated: number } | null>
  seedData: () => Promise<void>

  // Selectors
  getTodayMissions: () => Mission[]
  getMissionsByFront: (frontId: string) => Mission[]
  getFrontProgress: (frontId: string) => number
  getFrontById: (frontId: string) => BattleFront | undefined
  getFrontByType: (type: string) => BattleFront | undefined
}

export const useGosStore = create<GOSStore>((set, get) => ({
  fronts: [],
  missions: [],
  notificationRules: [],
  calendarEvents: [],
  avatarPosition: 0,
  currentStreak: 0,
  totalXp: 0,
  lastSyncedAt: null,
  isLoading: false,
  isSeeded: false,

  fetchAll: async () => {
    set({ isLoading: true })
    try {
      await Promise.all([
        get().fetchFronts(),
        get().fetchMissions(),
        get().fetchNotifications(),
      ])
    } finally {
      set({ isLoading: false })
    }
  },

  fetchFronts: async () => {
    try {
      const res = await fetch('/api/fronts')
      const json = await res.json()
      if (json.success) set({ fronts: json.data })
    } catch { /* ignore */ }
  },

  fetchMissions: async () => {
    try {
      const res = await fetch('/api/missions')
      const json = await res.json()
      if (json.success) {
        const missions = json.data as Mission[]
        const completionDates = missions.filter(m => m.completedAt).map(m => m.completedAt!)

        // Calculate total XP from completed missions
        let xp = 0
        for (const m of missions) {
          if (m.completed) xp += getXpForPriority(m.priority)
        }
        // Streak bonus: every 5 days gives +200 XP
        const streak = calculateStreak(completionDates)
        xp += Math.floor(streak / 5) * 200

        set({
          missions,
          avatarPosition: calculateAvatarPosition(missions),
          currentStreak: streak,
          totalXp: xp,
        })
      }
    } catch { /* ignore */ }
  },

  fetchNotifications: async () => {
    try {
      const res = await fetch('/api/notifications')
      const json = await res.json()
      if (json.success) set({ notificationRules: json.data })
    } catch { /* ignore */ }
  },

  fetchCalendarEvents: async (weekStart: string) => {
    try {
      const res = await fetch(`/api/calendar/events?weekStart=${weekStart}`)
      const json = await res.json()
      if (json.success) set({ calendarEvents: json.data })
    } catch { /* ignore */ }
  },

  completeMission: async (missionId: string) => {
    try {
      const mission = get().missions.find(m => m.id === missionId)
      const res = await fetch(`/api/missions/${missionId}/complete`, { method: 'POST' })
      const json = await res.json()
      if (!json.success) return null

      const xpGained = mission ? getXpForPriority(mission.priority) : 25
      await Promise.all([get().fetchMissions(), get().fetchFronts()])

      return {
        checkpointCompleted: json.data.checkpointCompleted,
        targetAchieved: json.data.targetAchieved,
        xpGained,
      }
    } catch {
      return null
    }
  },

  createMission: async (missionData: Partial<Mission>) => {
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missionData),
      })
      const json = await res.json()
      if (!json.success) return null
      await get().fetchMissions()
      return json.data
    } catch {
      return null
    }
  },

  updateMission: async (id: string, updates: Partial<Mission>) => {
    await fetch(`/api/missions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    await get().fetchMissions()
  },

  deleteMission: async (id: string) => {
    await fetch(`/api/missions/${id}`, { method: 'DELETE' })
    await get().fetchMissions()
  },

  updateFront: async (frontId: string, updates: Partial<BattleFront>) => {
    await fetch('/api/fronts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frontId, ...updates }),
    })
    await get().fetchFronts()
  },

  updateNotificationRule: async (ruleId: string, updates: Partial<NotificationRule>) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleId, ...updates }),
    })
    await get().fetchNotifications()
  },

  syncToCalendar: async () => {
    try {
      const res = await fetch('/api/calendar/sync', { method: 'POST' })
      const json = await res.json()
      if (!json.success) return null
      set({ lastSyncedAt: json.data.syncedAt })
      await get().fetchMissions()
      return { created: json.data.created, updated: json.data.updated }
    } catch {
      return null
    }
  },

  seedData: async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const json = await res.json()
      if (json.success) set({ isSeeded: true })
    } catch { /* ignore */ }
  },

  getTodayMissions: () => get().missions.filter(m => !m.completed && isToday(m.attackDate)),
  getMissionsByFront: (frontId: string) => get().missions.filter(m => m.frontId === frontId),
  getFrontProgress: (frontId: string) => {
    const fm = get().missions.filter(m => m.frontId === frontId)
    if (fm.length === 0) return 0
    return Math.round((fm.filter(m => m.completed).length / fm.length) * 100)
  },
  getFrontById: (frontId: string) => get().fronts.find(f => f.id === frontId),
  getFrontByType: (type: string) => get().fronts.find(f => f.type === type),
}))
