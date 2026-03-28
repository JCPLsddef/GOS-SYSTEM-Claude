import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { syncMissionsToCalendar } from '@/lib/google-calendar'
import { getAuthenticatedUserId } from '@/lib/get-user'

export async function POST() {
  const { userId, session } = await getAuthenticatedUserId()
  if (!userId || !session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  if (!session.accessToken) {
    return NextResponse.json(
      { success: false, error: 'No Google access token. Please sign out and sign back in.' },
      { status: 401 }
    )
  }

  if (session.error === 'RefreshAccessTokenError') {
    return NextResponse.json(
      { success: false, error: 'Google token expired. Please sign out and sign back in.' },
      { status: 401 }
    )
  }

  const { data: missions } = await supabaseAdmin
    .from('missions')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)

  if (!missions || missions.length === 0) {
    return NextResponse.json({ success: true, data: { created: 0, updated: 0, synced: 0, syncedAt: new Date().toISOString() } })
  }

  const toSync = missions.filter(m => m.attack_date).map(m => ({
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
        synced: result.created + result.updated,
        syncedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Calendar sync error:', msg)

    if (msg.includes('invalid_grant') || msg.includes('Token has been expired')) {
      return NextResponse.json(
        { success: false, error: 'Google token expired. Please sign out and sign back in.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: `Calendar sync failed: ${msg}` },
      { status: 500 }
    )
  }
}
