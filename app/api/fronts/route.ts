import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kvGet, kvSet } from '@/lib/kv'
import type { BattleFront } from '@/types/gos'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const fronts = await kvGet<BattleFront[]>(`user:${session.userId}:fronts`) || []
  return NextResponse.json({ success: true, data: fronts })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { frontId, ...updates } = body

  if (!frontId) {
    return NextResponse.json({ success: false, error: 'frontId required' }, { status: 400 })
  }

  const fronts = await kvGet<BattleFront[]>(`user:${session.userId}:fronts`) || []
  const index = fronts.findIndex(f => f.id === frontId)

  if (index === -1) {
    return NextResponse.json({ success: false, error: 'Front not found' }, { status: 404 })
  }

  // Update front fields (shallow merge)
  fronts[index] = {
    ...fronts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  // Handle target updates separately
  if (updates.target) {
    fronts[index].target = {
      ...fronts[index].target,
      ...updates.target,
    }
  }

  await kvSet(`user:${session.userId}:fronts`, fronts)
  return NextResponse.json({ success: true, data: fronts[index] })
}
