import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { buildFronts } from '@/lib/queries'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.dbUserId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const fronts = await buildFronts(session.dbUserId)
  return NextResponse.json({ success: true, data: fronts })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.dbUserId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { frontId, target, ...updates } = body

  if (!frontId) {
    return NextResponse.json({ success: false, error: 'frontId required' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (updates.name) updateData.name = updates.name
  if (updates.color) updateData.color = updates.color
  if (updates.icon) updateData.icon = updates.icon
  if (target) {
    if (target.description !== undefined) updateData.target_description = target.description
    if (target.deadline !== undefined) updateData.target_deadline = target.deadline
    if (target.achieved !== undefined) updateData.target_achieved = target.achieved
  }

  await supabaseAdmin.from('fronts').update(updateData).eq('id', frontId).eq('user_id', session.dbUserId)

  const fronts = await buildFronts(session.dbUserId)
  const updated = fronts.find(f => f.id === frontId)
  return NextResponse.json({ success: true, data: updated })
}
