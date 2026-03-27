import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { kvGet, kvSet } from '@/lib/kv'
import { syncMissionsToCalendar } from '@/lib/google-calendar'
import type { Mission } from '@/types/gos'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken || !session?.userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const missions = await kvGet<Mission[]>(`user:${session.userId}:missions`) || []

  // Only sync missions with attack dates that aren't completed
  const toSync = missions.filter(m => m.attackDate && !m.completed)

  try {
    const result = await syncMissionsToCalendar(session.accessToken, toSync)

    // Save updated missions (with new googleCalendarEventIds)
    // Merge synced missions back
    for (const synced of toSync) {
      const idx = missions.findIndex(m => m.id === synced.id)
      if (idx >= 0) {
        missions[idx] = synced
      }
    }
    await kvSet(`user:${session.userId}:missions`, missions)
    await kvSet(`user:${session.userId}:lastSyncedAt`, new Date().toISOString())

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
