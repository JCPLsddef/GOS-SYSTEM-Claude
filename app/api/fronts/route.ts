import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { buildFronts } from '@/lib/queries'
import { getAuthenticatedUserId } from '@/lib/get-user'

export async function GET() {
  const { userId } = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const fronts = await buildFronts(userId)
  return NextResponse.json({ success: true, data: fronts })
}

export async function POST(request: NextRequest) {
  const { userId } = await getAuthenticatedUserId()
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, type, color, icon, targetDescription, targetDeadline } = body

  if (!name || !type) {
    return NextResponse.json({ success: false, error: 'Name and type are required' }, { status: 400 })
  }

  const { data: front, error } = await supabaseAdmin
    .from('fronts')
    .insert({
      user_id: userId,
      name,
      type,
      color: color || '#D4A853',
      icon: icon || '🎯',
      target_description: targetDescription || '',
      target_deadline: targetDeadline || null,
      target_achieved: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: front }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const { userId } = await getAuthenticatedUserId()
  if (!userId) {
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

  await supabaseAdmin.from('fronts').update(updateData).eq('id', frontId).eq('user_id', userId)

  const fronts = await buildFronts(userId)
  const updated = fronts.find(f => f.id === frontId)
  return NextResponse.json({ success: true, data: updated })
}
