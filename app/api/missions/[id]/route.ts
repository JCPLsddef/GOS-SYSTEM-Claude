import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUserId } from '@/lib/get-user'

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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: mission } = await supabaseAdmin
    .from('missions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()

  if (!mission) {
    return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: mapMission(mission) })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.definitionOfDone !== undefined) updateData.definition_of_done = body.definitionOfDone
  if (body.priority !== undefined) updateData.priority = body.priority
  if (body.energyDemand !== undefined) updateData.energy_demand = body.energyDemand
  if (body.estimatedMinutes !== undefined) updateData.estimated_minutes = body.estimatedMinutes
  if (body.attackDate !== undefined) updateData.attack_date = body.attackDate
  if (body.dueDate !== undefined) updateData.due_date = body.dueDate
  if (body.stonePosition !== undefined) updateData.stone_position = body.stonePosition
  if (body.googleCalendarEventId !== undefined) updateData.gcal_event_id = body.googleCalendarEventId

  if (body.completed !== undefined) {
    updateData.completed = body.completed
    if (body.completed) {
      updateData.completed_at = new Date().toISOString()
    }
  }

  const { data: updated, error } = await supabaseAdmin
    .from('missions')
    .update(updateData)
    .eq('id', params.id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error || !updated) {
    return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: mapMission(updated) })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from('missions')
    .delete()
    .eq('id', params.id)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
