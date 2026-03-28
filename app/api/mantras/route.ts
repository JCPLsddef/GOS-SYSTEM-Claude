import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET — return all mantras + today's mantra
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.dbUserId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.dbUserId

  const { data: allMantras } = await supabaseAdmin
    .from('mantras')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')

  const dreams = (allMantras || []).filter(m => m.type === 'dream')
  const nightmares = (allMantras || []).filter(m => m.type === 'nightmare')

  // Determine today's mantra type
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon, ...
  // Mon/Wed/Fri → nightmare, Tue/Thu/Sat/Sun → dream
  const isNightmareDay = day === 1 || day === 3 || day === 5
  const todayType = isNightmareDay ? 'nightmare' : 'dream'
  const pool = todayType === 'dream' ? dreams : nightmares

  // Simple rotation: use day of year mod pool length
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const index = pool.length > 0 ? dayOfYear % pool.length : 0
  const todayMantra = pool[index] || null

  return NextResponse.json({
    success: true,
    data: { dreams, nightmares, todayMantra, todayType },
  })
}

// POST — add a new mantra
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.dbUserId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { text, type } = body as { text: string; type: 'dream' | 'nightmare' }

  if (!text || !type || !['dream', 'nightmare'].includes(type)) {
    return NextResponse.json({ success: false, error: 'Invalid text or type' }, { status: 400 })
  }

  const { data: newMantra, error } = await supabaseAdmin
    .from('mantras')
    .insert({ user_id: session.dbUserId, text, type })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: newMantra })
}

// DELETE — remove a mantra by id
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.dbUserId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })
  }

  await supabaseAdmin
    .from('mantras')
    .delete()
    .eq('id', id)
    .eq('user_id', session.dbUserId)

  return NextResponse.json({ success: true })
}
