import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kvGet, kvSet } from '@/lib/kv'
import type { Mission, BattleFront } from '@/types/gos'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.userId
  const missions = await kvGet<Mission[]>(`user:${userId}:missions`) || []
  const index = missions.findIndex(m => m.id === params.id)

  if (index === -1) {
    return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 })
  }

  if (missions[index].completed) {
    return NextResponse.json({ success: false, error: 'Mission already completed' }, { status: 400 })
  }

  // Check dependencies
  const unmetDeps = missions[index].dependencies.filter(depId => {
    const dep = missions.find(m => m.id === depId)
    return !dep?.completed
  })

  if (unmetDeps.length > 0) {
    return NextResponse.json({
      success: false,
      error: 'Dependencies not met',
      data: { unmetDependencies: unmetDeps },
    }, { status: 400 })
  }

  // Complete the mission
  missions[index].completed = true
  missions[index].completedAt = new Date().toISOString()
  await kvSet(`user:${userId}:missions`, missions)

  // Update fronts (checkpoint + target progress)
  const fronts = await kvGet<BattleFront[]>(`user:${userId}:fronts`) || []
  const front = fronts.find(f => f.id === missions[index].frontId)
  let checkpointCompleted = false
  let targetAchieved = false

  if (front) {
    const checkpoint = front.checkpoints.find(cp => cp.id === missions[index].checkpointId)
    if (checkpoint) {
      const cpMissionIndex = checkpoint.missions.findIndex(m => m.id === params.id)
      if (cpMissionIndex >= 0) {
        checkpoint.missions[cpMissionIndex] = missions[index]
      }

      // Check checkpoint completion
      if (checkpoint.missions.length > 0 && checkpoint.missions.every(m => m.completed)) {
        checkpoint.completed = true
        checkpoint.completedAt = new Date().toISOString()
        checkpointCompleted = true
      }
    }

    // Check target achievement
    if (front.checkpoints.length > 0 && front.checkpoints.every(cp => cp.completed)) {
      front.target.achieved = true
      front.target.achievedAt = new Date().toISOString()
      targetAchieved = true
    }

    front.updatedAt = new Date().toISOString()
    await kvSet(`user:${userId}:fronts`, fronts)
  }

  // Update streak
  const completionDates = missions
    .filter(m => m.completedAt)
    .map(m => m.completedAt!)
  completionDates.push(missions[index].completedAt!)

  // Simple streak: count consecutive days with completions
  const today = new Date().toISOString().split('T')[0]
  const existingDates = await kvGet<string[]>(`user:${userId}:completionDates`) || []
  if (!existingDates.includes(today)) {
    existingDates.push(today)
    await kvSet(`user:${userId}:completionDates`, existingDates)
  }

  return NextResponse.json({
    success: true,
    data: {
      mission: missions[index],
      checkpointCompleted,
      targetAchieved,
      avatarPosition: missions[index].stonePosition,
    },
  })
}
