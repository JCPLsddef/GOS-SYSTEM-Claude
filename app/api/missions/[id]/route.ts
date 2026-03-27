import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kvGet, kvSet } from '@/lib/kv'
import type { Mission, BattleFront } from '@/types/gos'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const missions = await kvGet<Mission[]>(`user:${session.userId}:missions`) || []
  const mission = missions.find(m => m.id === params.id)

  if (!mission) {
    return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: mission })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const missions = await kvGet<Mission[]>(`user:${session.userId}:missions`) || []
  const index = missions.findIndex(m => m.id === params.id)

  if (index === -1) {
    return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 })
  }

  // Update mission fields
  const updated: Mission = { ...missions[index], ...body }

  // If completing, set completedAt
  if (body.completed && !missions[index].completed) {
    updated.completedAt = new Date().toISOString()
  }

  missions[index] = updated
  await kvSet(`user:${session.userId}:missions`, missions)

  // Sync to fronts
  await syncMissionToFronts(session.userId, updated)

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const missions = await kvGet<Mission[]>(`user:${session.userId}:missions`) || []
  const filtered = missions.filter(m => m.id !== params.id)

  if (filtered.length === missions.length) {
    return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 })
  }

  await kvSet(`user:${session.userId}:missions`, filtered)

  // Also remove from fronts
  const fronts = await kvGet<BattleFront[]>(`user:${session.userId}:fronts`) || []
  for (const front of fronts) {
    for (const cp of front.checkpoints) {
      cp.missions = cp.missions.filter(m => m.id !== params.id)
    }
  }
  await kvSet(`user:${session.userId}:fronts`, fronts)

  return NextResponse.json({ success: true })
}

async function syncMissionToFronts(userId: string, mission: Mission) {
  const fronts = await kvGet<BattleFront[]>(`user:${userId}:fronts`) || []
  const front = fronts.find(f => f.id === mission.frontId)
  if (!front) return

  const checkpoint = front.checkpoints.find(cp => cp.id === mission.checkpointId)
  if (!checkpoint) return

  const mIndex = checkpoint.missions.findIndex(m => m.id === mission.id)
  if (mIndex >= 0) {
    checkpoint.missions[mIndex] = mission
  }

  // Check if checkpoint is now complete
  const allDone = checkpoint.missions.every(m => m.completed)
  if (allDone && checkpoint.missions.length > 0) {
    checkpoint.completed = true
    checkpoint.completedAt = new Date().toISOString()
  }

  // Check if target is achieved (all checkpoints complete)
  const allCheckpointsDone = front.checkpoints.every(cp => cp.completed)
  if (allCheckpointsDone && front.checkpoints.length > 0) {
    front.target.achieved = true
    front.target.achievedAt = new Date().toISOString()
  }

  front.updatedAt = new Date().toISOString()
  await kvSet(`user:${userId}:fronts`, fronts)
}
