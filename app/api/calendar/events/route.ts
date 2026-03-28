import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchCalendarEvents } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    // Return empty array instead of crashing
    return NextResponse.json({ success: true, data: [] })
  }

  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('weekStart')

  if (!weekStart) {
    return NextResponse.json({ success: false, error: 'weekStart param required' }, { status: 400 })
  }

  const timeMin = new Date(weekStart).toISOString()
  const timeMax = new Date(new Date(weekStart).getTime() + 7 * 86400000).toISOString()

  try {
    const events = await fetchCalendarEvents(session.accessToken, timeMin, timeMax)
    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    console.error('Google Calendar fetch error:', error)
    // Return empty array on error, don't crash
    return NextResponse.json({ success: true, data: [] })
  }
}
