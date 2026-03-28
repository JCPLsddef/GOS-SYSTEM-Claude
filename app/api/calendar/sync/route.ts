import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { syncMissionsToCalendar } from '@/lib/google-calendar'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken || !session?.dbUserId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: missions } = await supabaseAdmin
    .from('missions')
    .select('*')
    .eq('user_id', session.dbUserId)
    .eq('completed', false)

  if (!missions || missions.length === 0) {
    return NextResponse.json({ success: true, data: { created: 0, updated: 0, syncedAt: new Date().toISOString() } })
  }

  // Map to the format google-calendar expects
  const toSync = missions.map(m => ({
    id: m.id,
    frontId: m.front_id,
    checkpointId: m.checkpoint_id,
    name: m.name,
    definitionOfDone: m.definition_of_done || '',
    priority: m.priority,
    energyDemand: m.energy_demand,
    estimatedMinutes: m.estimated_minutes,
    attackDate: m.attack_date,
    dueDate: m.due_date,
    completed: m.completed,
    stonePosition: m.stone_position,
    dependencies: [],
    googleCalendarEventId: m.gcal_event_id,
  }))

  try {
    const result = await syncMissionsToCalendar(session.accessToken, toSync)

    // Update missions with calendar event IDs
    for (const synced of toSync) {
      if (synced.googleCalendarEventId) {
        await supabaseAdmin
          .from('missions')
          .update({ gcal_event_id: synced.googleCalendarEventId })
          .eq('id', synced.id)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        created: result.created,
        updated: result.updated,
        syncedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync to Google Calendar' },
      { status: 500 }
    )
  }
}
