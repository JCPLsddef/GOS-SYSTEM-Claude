import { BattleFront, Checkpoint, Mission, NotificationRule } from '@/types/gos'

// ========================================
// Default Seed Data — Juan's 3 Battle Fronts
// ========================================

export function getDefaultFronts(): BattleFront[] {
  const now = new Date().toISOString()

  return [
    {
      id: 'business',
      name: 'Business',
      type: 'business',
      color: '#4CAF7D',
      icon: '⚡',
      target: {
        id: 'target-business',
        frontId: 'business',
        description: '2 new clients signed by April 25, 2026',
        deadline: '2026-04-25T23:59:59.000Z',
        achieved: false,
      },
      checkpoints: [
        createCheckpoint('business', 'cp-prospect-list', 'Build prospect list (50 leads)', 1),
        createCheckpoint('business', 'cp-email-sequence', 'Write cold email sequence', 2),
        createCheckpoint('business', 'cp-send-emails', 'Send 100 cold emails', 3),
        createCheckpoint('business', 'cp-book-calls', 'Book 3+ discovery calls', 4),
        createCheckpoint('business', 'cp-close-clients', 'Close 2 clients', 5),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'school',
      name: 'School',
      type: 'school',
      color: '#4A90D9',
      icon: '📚',
      target: {
        id: 'target-school',
        frontId: 'school',
        description: 'Pass all courses this semester',
        deadline: '2026-05-30T23:59:59.000Z',
        achieved: false,
      },
      checkpoints: [
        createCheckpoint('school', 'cp-assignments', 'Complete all pending assignments', 1),
        createCheckpoint('school', 'cp-midterms', 'Pass all midterms', 2),
        createCheckpoint('school', 'cp-finals', 'Submit all finals', 3),
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'health',
      name: 'Health',
      type: 'health',
      color: '#E8973A',
      icon: '🥊',
      target: {
        id: 'target-health',
        frontId: 'health',
        description: '5x boxing per week, Mon–Fri 18:00–19:00',
        deadline: '2026-04-25T23:59:59.000Z',
        achieved: false,
      },
      checkpoints: [
        createCheckpoint('health', 'cp-week1', 'Week 1: 5 sessions', 1),
        createCheckpoint('health', 'cp-week2', 'Week 2: 5 sessions', 2),
        createCheckpoint('health', 'cp-week3', 'Week 3: 5 sessions', 3),
        createCheckpoint('health', 'cp-week4', 'Week 4: 5 sessions', 4),
      ],
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function createCheckpoint(
  frontId: string,
  id: string,
  name: string,
  order: number
): Checkpoint {
  return {
    id,
    frontId,
    name,
    order,
    completed: false,
    missions: [],
  }
}

export function getDefaultMissions(): Mission[] {
  return [
    {
      id: 'm-prospect-list',
      frontId: 'business',
      checkpointId: 'cp-prospect-list',
      name: 'Build 50-prospect cold email list (painters + barbershops)',
      definitionOfDone: 'Google Sheet with 50 verified leads — name, business, email, city',
      priority: 1,
      energyDemand: 'high',
      estimatedMinutes: 90,
      attackDate: '2026-03-31T09:00:00.000Z',
      dueDate: '2026-03-31T23:59:59.000Z',
      completed: false,
      stonePosition: 10,
      dependencies: [],
    },
    {
      id: 'm-email-sequence',
      frontId: 'business',
      checkpointId: 'cp-email-sequence',
      name: 'Write 3-email cold outreach sequence',
      definitionOfDone: '3 emails drafted, reviewed, loaded in Gmail',
      priority: 1,
      energyDemand: 'high',
      estimatedMinutes: 60,
      attackDate: '2026-04-01T12:00:00.000Z',
      dueDate: '2026-04-01T23:59:59.000Z',
      completed: false,
      stonePosition: 20,
      dependencies: ['m-prospect-list'],
    },
    {
      id: 'm-send-batch-1',
      frontId: 'business',
      checkpointId: 'cp-send-emails',
      name: 'Send batch 1: 25 cold emails',
      definitionOfDone: '25 emails sent, logged in tracker sheet',
      priority: 1,
      energyDemand: 'medium',
      estimatedMinutes: 45,
      attackDate: '2026-04-02T12:00:00.000Z',
      dueDate: '2026-04-02T23:59:59.000Z',
      completed: false,
      stonePosition: 30,
      dependencies: ['m-email-sequence'],
    },
    {
      id: 'm-send-batch-2',
      frontId: 'business',
      checkpointId: 'cp-send-emails',
      name: 'Send batch 2: 25 cold emails',
      definitionOfDone: '50 total emails sent this week',
      priority: 1,
      energyDemand: 'medium',
      estimatedMinutes: 45,
      attackDate: '2026-04-03T12:00:00.000Z',
      dueDate: '2026-04-03T23:59:59.000Z',
      completed: false,
      stonePosition: 40,
      dependencies: ['m-send-batch-1'],
    },
    // Health: Boxing sessions for week 1
    {
      id: 'm-boxing-mon',
      frontId: 'health',
      checkpointId: 'cp-week1',
      name: 'Boxing session — Monday',
      definitionOfDone: '1 hour boxing at 18:00',
      priority: 2,
      energyDemand: 'high',
      estimatedMinutes: 60,
      attackDate: '2026-03-30T18:00:00.000Z',
      completed: false,
      stonePosition: 50,
      dependencies: [],
    },
    {
      id: 'm-boxing-tue',
      frontId: 'health',
      checkpointId: 'cp-week1',
      name: 'Boxing session — Tuesday',
      definitionOfDone: '1 hour boxing at 18:00',
      priority: 2,
      energyDemand: 'high',
      estimatedMinutes: 60,
      attackDate: '2026-03-31T18:00:00.000Z',
      completed: false,
      stonePosition: 55,
      dependencies: [],
    },
    {
      id: 'm-boxing-wed',
      frontId: 'health',
      checkpointId: 'cp-week1',
      name: 'Boxing session — Wednesday',
      definitionOfDone: '1 hour boxing at 18:00',
      priority: 2,
      energyDemand: 'high',
      estimatedMinutes: 60,
      attackDate: '2026-04-01T18:00:00.000Z',
      completed: false,
      stonePosition: 60,
      dependencies: [],
    },
    {
      id: 'm-boxing-thu',
      frontId: 'health',
      checkpointId: 'cp-week1',
      name: 'Boxing session — Thursday',
      definitionOfDone: '1 hour boxing at 18:00',
      priority: 2,
      energyDemand: 'high',
      estimatedMinutes: 60,
      attackDate: '2026-04-02T18:00:00.000Z',
      completed: false,
      stonePosition: 65,
      dependencies: [],
    },
    {
      id: 'm-boxing-fri',
      frontId: 'health',
      checkpointId: 'cp-week1',
      name: 'Boxing session — Friday',
      definitionOfDone: '1 hour boxing at 18:00',
      priority: 2,
      energyDemand: 'high',
      estimatedMinutes: 60,
      attackDate: '2026-04-03T18:00:00.000Z',
      completed: false,
      stonePosition: 70,
      dependencies: [],
    },
    // School mission
    {
      id: 'm-assignments',
      frontId: 'school',
      checkpointId: 'cp-assignments',
      name: 'Complete overdue assignment — Database Systems',
      definitionOfDone: 'Assignment submitted on Moodle before 23:59',
      priority: 1,
      energyDemand: 'high',
      estimatedMinutes: 120,
      attackDate: '2026-03-31T14:00:00.000Z',
      dueDate: '2026-04-01T23:59:59.000Z',
      completed: false,
      stonePosition: 80,
      dependencies: [],
    },
  ]
}

export function getDefaultNotificationRules(): NotificationRule[] {
  return [
    {
      id: 'nr-morning',
      type: 'daily_preview',
      message: "Morning. One win today. What's the mission?",
      triggerAt: '06:30',
      recurring: 'daily',
      sent: false,
      enabled: true,
    },
    {
      id: 'nr-boxing-reminder',
      type: 'mission_reminder',
      message: 'Boxing in 15 minutes. Non-negotiable.',
      triggerAt: '17:45',
      recurring: 'daily',
      sent: false,
      enabled: true,
    },
    {
      id: 'nr-shutdown',
      type: 'daily_preview',
      message: 'Shutdown. What got done? What moves tomorrow?',
      triggerAt: '22:00',
      recurring: 'daily',
      sent: false,
      enabled: true,
    },
    {
      id: 'nr-weekly-review',
      type: 'weekly_review',
      message: 'Weekly review. 20 minutes. OODA time.',
      triggerAt: '21:00',
      recurring: 'weekly',
      sent: false,
      enabled: true,
    },
    {
      id: 'nr-weekly-plan',
      type: 'weekly_review',
      message: 'Plan the week. What are the targets?',
      triggerAt: '20:00',
      recurring: 'weekly',
      sent: false,
      enabled: true,
    },
    {
      id: 'nr-no-outreach',
      type: 'front_check',
      message: "3 days. Zero emails. That's why you have no clients.",
      triggerAt: '12:00',
      recurring: 'daily',
      sent: false,
      enabled: true,
    },
  ]
}

// ========================================
// Progress Calculation Engine
// ========================================

export function calculateCheckpointProgress(checkpoint: Checkpoint): number {
  if (checkpoint.missions.length === 0) return 0
  const completed = checkpoint.missions.filter((m) => m.completed).length
  return Math.round((completed / checkpoint.missions.length) * 100)
}

export function calculateFrontProgress(front: BattleFront): number {
  const allMissions = front.checkpoints.flatMap((cp) => cp.missions)
  if (allMissions.length === 0) return 0
  const completed = allMissions.filter((m) => m.completed).length
  return Math.round((completed / allMissions.length) * 100)
}

export function calculateAvatarPosition(missions: Mission[]): number {
  if (missions.length === 0) return 0
  const completed = missions.filter((m) => m.completed)
  if (completed.length === 0) return 0
  return Math.max(...completed.map((m) => m.stonePosition))
}

export function calculateStreak(completionDates: string[]): number {
  if (completionDates.length === 0) return 0

  const uniqueDays = Array.from(new Set(completionDates.map((d) => d.split('T')[0])))
    .sort()
    .reverse()

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Must have completed something today or yesterday to maintain streak
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0

  let streak = 0
  let checkDate = new Date(uniqueDays[0])

  for (const day of uniqueDays) {
    const dayDate = new Date(day)
    const diff = Math.round(
      (checkDate.getTime() - dayDate.getTime()) / 86400000
    )
    if (diff <= 1) {
      streak++
      checkDate = dayDate
    } else {
      break
    }
  }

  return streak
}

export function getMissionStoneState(
  mission: Mission,
  allMissions: Mission[]
): 'completed' | 'active' | 'locked' | 'cracked' {
  if (mission.completed) return 'completed'

  // Check dependencies
  const depsCompleted = mission.dependencies.every((depId) => {
    const dep = allMissions.find((m) => m.id === depId)
    return dep?.completed
  })

  if (!depsCompleted) return 'locked'

  // Check if overdue
  if (mission.dueDate && new Date(mission.dueDate) < new Date()) {
    return 'cracked'
  }

  return 'active'
}
