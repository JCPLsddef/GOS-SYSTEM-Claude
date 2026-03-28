import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

function mapRule(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    type: r.type as string,
    message: r.message as string,
    triggerAt: (r.trigger_time || '') as string,
    recurring: (r.recurring || undefined) as string | undefined,
    sent: false,
    enabled: (r.active ?? true) as boolean,
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.dbUserId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabaseAdmin
    .from('notification_rules')
    .select('*')
    .eq('user_id', session.dbUserId)
    .order('created_at')

  return NextResponse.json({ success: true, data: (data || []).map(mapRule) })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.dbUserId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { ruleId, enabled, ...rest } = body

  if (!ruleId) {
    return NextResponse.json({ success: false, error: 'ruleId required' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (enabled !== undefined) updateData.active = enabled
  if (rest.message !== undefined) updateData.message = rest.message
  if (rest.triggerAt !== undefined) updateData.trigger_time = rest.triggerAt

  const { data: updated, error } = await supabaseAdmin
    .from('notification_rules')
    .update(updateData)
    .eq('id', ruleId)
    .eq('user_id', session.dbUserId)
    .select()
    .single()

  if (error || !updated) {
    return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: mapRule(updated) })
}
