'use client'

import { create } from 'zustand'
import type { BattleFront, Mission, NotificationRule, CalendarEvent } from '@/types/gos'
import { calculateAvatarPosition, calculateStreak } from '@/lib/gos-engine'
import { isToday } from '@/lib/utils'

interface GOSStore {
  // Data
  fronts: BattleFront[]
  missions: Mission[]
  notificationRules: NotificationRule[]
  calendarEvents: CalendarEvent[]

  // Derived
  avatarPosition: number
  currentStreak: number
  lastSyncedAt: string | null

  // UI state
  isLoading: boolean
  isSeeded: boolean

  // Actions
  fetchAll: () => Promise<void>
  fetchFronts: () => Promise<void>
  fetchMissions: () => Promise<void>
  fetchNotifications: () => Promise<void>
  fetchCalendarEvents: (weekStart: string) => Promise<void>

  completeMission: (missionId: string) => Promise<{
    checkpointCompleted: boolean
    targetAchieved: boolean
  } | null>

  createMission: (mission: Partial<Mission>) => Promise<Mission | null>
  updateMission: (id: string, updates: Partial<Mission>) => Promise<void>
  deleteMission: (id: string) => Promise<void>

  updateFront: (frontId: string, updates: Partial<BattleFront>) => Promise<void>
  updateNotificationRule: (ruleId: string, updates: Partial<NotificationRule>) => Promise<void>

  syncToCalendar: () => Promise<{ created: number; updated: number } | null>
  seedData: () => Promise<void>

  // Selectors (computed from state)
  getTodayMissions: () => Mission[]
  getMissionsByFront: (frontId: string) => Mission[]
  getFrontProgress: (frontId: string) => number
}

export const useGosStore = create<GOSStore>((set, get) => ({
  // Initial state
  fronts: [],
  missions: [],
  notificationRules: [],
  calendarEvents: [],
  avatarPosition: 0,
  currentStreak: 0,
  lastSyncedAt: null,
  isLoading: false,
  isSeeded: false,

  // Fetch all data
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
    const res = await fetch('/api/fronts')
    const json = await res.json()
    if (json.success) {
      set({ fronts: json.data })
    }
  },

  fetchMissions: async () => {
    const res = await fetch('/api/missions')
    const json = await res.json()
    if (json.success) {
      const missions = json.data as Mission[]
      const completionDates = missions
        .filter((m: Mission) => m.completedAt)
        .map((m: Mission) => m.completedAt!)

      set({
        missions,
        avatarPosition: calculateAvatarPosition(missions),
        currentStreak: calculateStreak(completionDates),
      })
    }
  },

  fetchNotifications: async () => {
    const res = await fetch('/api/notifications')
    const json = await res.json()
    if (json.success) {
      set({ notificationRules: json.data })
    }
  },

  fetchCalendarEvents: async (weekStart: string) => {
    const res = await fetch(`/api/calendar/events?weekStart=${weekStart}`)
    const json = await res.json()
    if (json.success) {
      set({ calendarEvents: json.data })
    }
  },

  completeMission: async (missionId: string) => {
    const res = await fetch(`/api/missions/${missionId}/complete`, { method: 'POST' })
    const json = await res.json()
    if (!json.success) return null

    // Refresh data
    await Promise.all([get().fetchMissions(), get().fetchFronts()])

    return {
      checkpointCompleted: json.data.checkpointCompleted,
      targetAchieved: json.data.targetAchieved,
    }
  },

  createMission: async (missionData: Partial<Mission>) => {
    const res = await fetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(missionData),
    })
    const json = await res.json()
    if (!json.success) return null

    await get().fetchMissions()
    return json.data
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
    const res = await fetch('/api/calendar/sync', { method: 'POST' })
    const json = await res.json()
    if (!json.success) return null

    set({ lastSyncedAt: json.data.syncedAt })
    await get().fetchMissions()
    return { created: json.data.created, updated: json.data.updated }
  },

  seedData: async () => {
    const res = await fetch('/api/seed', { method: 'POST' })
    const json = await res.json()
    if (json.success) {
      set({ isSeeded: true })
      await get().fetchAll()
    }
  },

  // Selectors
  getTodayMissions: () => {
    return get().missions.filter(m => !m.completed && isToday(m.attackDate))
  },

  getMissionsByFront: (frontId: string) => {
    return get().missions.filter(m => m.frontId === frontId)
  },

  getFrontProgress: (frontId: string) => {
    const frontMissions = get().missions.filter(m => m.frontId === frontId)
    if (frontMissions.length === 0) return 0
    const completed = frontMissions.filter(m => m.completed).length
    return Math.round((completed / frontMissions.length) * 100)
  },
}))
