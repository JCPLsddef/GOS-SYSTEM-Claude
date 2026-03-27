import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kvGet, kvSet } from '@/lib/kv'
import { generateId } from '@/lib/utils'
import type { Mission, BattleFront } from '@/types/gos'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const missions = await kvGet<Mission[]>(`user:${session.userId}:missions`) || []
  return NextResponse.json({ success: true, data: missions })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const missions = await kvGet<Mission[]>(`user:${session.userId}:missions`) || []

  const newMission: Mission = {
    id: generateId(),
    frontId: body.frontId,
    checkpointId: body.checkpointId,
    name: body.name,
    definitionOfDone: body.definitionOfDone || '',
    priority: body.priority || 2,
    energyDemand: body.energyDemand || 'medium',
    estimatedMinutes: body.estimatedMinutes || 30,
    attackDate: body.attackDate,
    dueDate: body.dueDate,
    completed: false,
    stonePosition: body.stonePosition || Math.max(...missions.map(m => m.stonePosition), 0) + 5,
    dependencies: body.dependencies || [],
  }

  missions.push(newMission)
  await kvSet(`user:${session.userId}:missions`, missions)

  // Also update the front's checkpoint missions
  const fronts = await kvGet<BattleFront[]>(`user:${session.userId}:fronts`) || []
  const front = fronts.find(f => f.id === newMission.frontId)
  if (front) {
    const checkpoint = front.checkpoints.find(cp => cp.id === newMission.checkpointId)
    if (checkpoint) {
      checkpoint.missions.push(newMission)
      await kvSet(`user:${session.userId}:fronts`, fronts)
    }
  }

  return NextResponse.json({ success: true, data: newMission }, { status: 201 })
}
