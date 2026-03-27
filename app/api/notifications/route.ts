import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kvGet, kvSet } from '@/lib/kv'
import type { NotificationRule } from '@/types/gos'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const rules = await kvGet<NotificationRule[]>(`user:${session.userId}:notifications`) || []
  return NextResponse.json({ success: true, data: rules })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { ruleId, ...updates } = body

  if (!ruleId) {
    return NextResponse.json({ success: false, error: 'ruleId required' }, { status: 400 })
  }

  const rules = await kvGet<NotificationRule[]>(`user:${session.userId}:notifications`) || []
  const index = rules.findIndex(r => r.id === ruleId)

  if (index === -1) {
    return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 })
  }

  rules[index] = { ...rules[index], ...updates }
  await kvSet(`user:${session.userId}:notifications`, rules)

  return NextResponse.json({ success: true, data: rules[index] })
}
