import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

function mapMission(m: Record<string, unknown>) {
  return {
    id: m.id as string,
    frontId: m.front_id as string,
    checkpointId: m.checkpoint_id as string,
    name: m.name as string,
    definitionOfDone: (m.definition_of_done || '') as string,
    priority: (m.priority || 2) as number,
    energyDemand: (m.energy_demand || 'medium') as string,
    estimatedMinutes: (m.estimated_minutes || 60) as number,
    attackDate: m.attack_date as string,
    dueDate: (m.due_date || undefined) as string | undefined,
    completed: (m.completed || false) as boolean,
    completedAt: (m.completed_at || undefined) as string | undefined,
    googleCalendarEventId: (m.gcal_event_id || undefined) as string | undefined,
    stonePosition: (m.stone_position || 0) as number,
    dependencies: [] as string[],
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.dbUserId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabaseAdmin
    .from('missions')
    .select('*')
    .eq('user_id', session.dbUserId)
    .order('stone_position')

  return NextResponse.json({ success: true, data: (data || []).map(mapMission) })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.dbUserId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Get max stone position
  const { data: maxRow } = await supabaseAdmin
    .from('missions')
    .select('stone_position')
    .eq('user_id', session.dbUserId)
    .order('stone_position', { ascending: false })
    .limit(1)

  const maxPos = maxRow?.[0]?.stone_position || 0

  const { data: newMission, error } = await supabaseAdmin
    .from('missions')
    .insert({
      front_id: body.frontId,
      checkpoint_id: body.checkpointId,
      user_id: session.dbUserId,
      name: body.name,
      definition_of_done: body.definitionOfDone || '',
      priority: body.priority || 2,
      energy_demand: body.energyDemand || 'medium',
      estimated_minutes: body.estimatedMinutes || 30,
      attack_date: body.attackDate,
      due_date: body.dueDate || null,
      stone_position: body.stonePosition || maxPos + 5,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: mapMission(newMission) }, { status: 201 })
}
