import { google } from 'googleapis'
import type { Mission, CalendarEvent } from '@/types/gos'

function getOAuth2Client(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2Client.setCredentials({ access_token: accessToken })
  return oauth2Client
}

function getCalendar(accessToken: string) {
  return google.calendar({
    version: 'v3',
    auth: getOAuth2Client(accessToken),
  })
}

// GOS front color → Google Calendar colorId
const FRONT_TO_GCAL_COLOR: Record<string, string> = {
  business: '2',  // Sage (green)
  school: '9',    // Blueberry (blue)
  health: '6',    // Tangerine (orange)
}

export async function fetchCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const calendar = getCalendar(accessToken)

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
  })

  const events = response.data.items || []

  return events.map((event) => ({
    id: event.id || '',
    title: event.summary || 'Untitled',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    allDay: !event.start?.dateTime,
    source: (event.summary?.startsWith('[GOS]') ? 'gos' : 'google') as 'gos' | 'google',
    color: event.colorId ? gcalColorToHex(event.colorId) : '#6B7280',
    frontId: extractFrontIdFromDescription(event.description),
  }))
}

export async function createCalendarEvent(
  accessToken: string,
  mission: Mission
): Promise<string> {
  const calendar = getCalendar(accessToken)

  const endTime = new Date(
    new Date(mission.attackDate).getTime() + mission.estimatedMinutes * 60000
  ).toISOString()

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `[GOS] ${mission.name}`,
      description: `Battle Front: ${mission.frontId}\nDone when: ${mission.definitionOfDone}\nPriority: P${mission.priority}`,
      start: {
        dateTime: mission.attackDate,
        timeZone: 'America/Toronto',
      },
      end: {
        dateTime: endTime,
        timeZone: 'America/Toronto',
      },
      colorId: FRONT_TO_GCAL_COLOR[mission.frontId] || '8',
    },
  })

  return response.data.id || ''
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  mission: Mission
): Promise<void> {
  const calendar = getCalendar(accessToken)

  const endTime = new Date(
    new Date(mission.attackDate).getTime() + mission.estimatedMinutes * 60000
  ).toISOString()

  await calendar.events.update({
    calendarId: 'primary',
    eventId,
    requestBody: {
      summary: `[GOS] ${mission.name}`,
      description: `Battle Front: ${mission.frontId}\nDone when: ${mission.definitionOfDone}\nPriority: P${mission.priority}`,
      start: {
        dateTime: mission.attackDate,
        timeZone: 'America/Toronto',
      },
      end: {
        dateTime: endTime,
        timeZone: 'America/Toronto',
      },
      colorId: FRONT_TO_GCAL_COLOR[mission.frontId] || '8',
    },
  })
}

export async function syncMissionsToCalendar(
  accessToken: string,
  missions: Mission[]
): Promise<{ created: number; updated: number }> {
  let created = 0
  let updated = 0

  for (const mission of missions) {
    if (!mission.attackDate) continue

    try {
      if (mission.googleCalendarEventId) {
        await updateCalendarEvent(accessToken, mission.googleCalendarEventId, mission)
        updated++
      } else {
        const eventId = await createCalendarEvent(accessToken, mission)
        mission.googleCalendarEventId = eventId
        created++
      }
    } catch (error) {
      console.error(`Failed to sync mission ${mission.id}:`, error)
    }
  }

  return { created, updated }
}

function gcalColorToHex(colorId: string): string {
  const colors: Record<string, string> = {
    '1': '#7986CB', // Lavender
    '2': '#33B679', // Sage
    '3': '#8E24AA', // Grape
    '4': '#E67C73', // Flamingo
    '5': '#F6BF26', // Banana
    '6': '#F4511E', // Tangerine
    '7': '#039BE5', // Peacock
    '8': '#616161', // Graphite
    '9': '#3F51B5', // Blueberry
    '10': '#0B8043', // Basil
    '11': '#D50000', // Tomato
  }
  return colors[colorId] || '#6B7280'
}

function extractFrontIdFromDescription(description?: string | null): string | undefined {
  if (!description) return undefined
  const match = description.match(/Battle Front: (\w+)/)
  return match?.[1]
}
