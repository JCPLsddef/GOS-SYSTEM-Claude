// ========================================
// GOS — Core Type System
// ========================================

export type FrontType = 'business' | 'school' | 'health' | 'family' | 'finance' | 'custom'

export interface BattleFront {
  id: string
  name: string
  type: FrontType
  color: string
  icon: string
  target: BinaryTarget
  checkpoints: Checkpoint[]
  createdAt: string
  updatedAt: string
}

export interface BinaryTarget {
  id: string
  frontId: string
  description: string
  deadline: string
  achieved: boolean
  achievedAt?: string
}

export interface Checkpoint {
  id: string
  frontId: string
  name: string
  order: number
  completed: boolean
  completedAt?: string
  missions: Mission[]
}

export interface Mission {
  id: string
  frontId: string
  checkpointId: string
  name: string
  definitionOfDone: string
  priority: 1 | 2 | 3
  energyDemand: 'high' | 'medium' | 'low'
  estimatedMinutes: number
  attackDate: string
  dueDate?: string
  completed: boolean
  completedAt?: string
  googleCalendarEventId?: string
  stonePosition: number
  dependencies: string[]
}

export interface GOSState {
  fronts: BattleFront[]
  todayMissions: Mission[]
  weekMissions: Mission[]
  avatarPosition: number
  currentStreak: number
  lastSyncedAt?: string
}

export interface NotificationRule {
  id: string
  missionId?: string
  type: 'mission_reminder' | 'daily_preview' | 'weekly_review' | 'front_check'
  message: string
  triggerAt: string
  recurring?: 'daily' | 'weekly'
  sent: boolean
  enabled: boolean
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  source: 'google' | 'gos'
  color: string
  frontId?: string
  missionId?: string
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
