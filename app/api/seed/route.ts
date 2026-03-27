import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kvGet, kvSet } from '@/lib/kv'
import { getDefaultFronts, getDefaultMissions, getDefaultNotificationRules } from '@/lib/gos-engine'
import type { BattleFront } from '@/types/gos'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.userId

  // Check if already seeded
  const existingFronts = await kvGet<BattleFront[]>(`user:${userId}:fronts`)
  if (existingFronts && existingFronts.length > 0) {
    return NextResponse.json({ success: true, data: { seeded: false, message: 'Already seeded' } })
  }

  // Seed fronts
  const fronts = getDefaultFronts()
  await kvSet(`user:${userId}:fronts`, fronts)

  // Seed missions
  const missions = getDefaultMissions()
  await kvSet(`user:${userId}:missions`, missions)

  // Assign missions to checkpoint.missions arrays
  const frontsWithMissions = fronts.map((front) => ({
    ...front,
    checkpoints: front.checkpoints.map((cp) => ({
      ...cp,
      missions: missions.filter((m) => m.checkpointId === cp.id),
    })),
  }))
  await kvSet(`user:${userId}:fronts`, frontsWithMissions)

  // Seed notification rules
  const rules = getDefaultNotificationRules()
  await kvSet(`user:${userId}:notifications`, rules)

  // Seed streak
  await kvSet(`user:${userId}:streak`, 0)

  return NextResponse.json({
    success: true,
    data: {
      seeded: true,
      fronts: frontsWithMissions.length,
      missions: missions.length,
      notificationRules: rules.length,
    },
  })
}
