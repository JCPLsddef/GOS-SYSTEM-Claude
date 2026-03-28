import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.dbUserId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.dbUserId

  // Get the mission
  const { data: mission } = await supabaseAdmin
    .from('missions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()

  if (!mission) {
    return NextResponse.json({ success: false, error: 'Mission not found' }, { status: 404 })
  }

  if (mission.completed) {
    return NextResponse.json({ success: false, error: 'Mission already completed' }, { status: 400 })
  }

  // Complete the mission
  const now = new Date().toISOString()
  await supabaseAdmin
    .from('missions')
    .update({ completed: true, completed_at: now })
    .eq('id', params.id)

  // Check if checkpoint is now complete
  let checkpointCompleted = false
  if (mission.checkpoint_id) {
    // Check all missions in this checkpoint (including the one we just completed)
    const { data: cpMissionsUpdated } = await supabaseAdmin
      .from('missions')
      .select('completed')
      .eq('checkpoint_id', mission.checkpoint_id)
      .eq('user_id', userId)

    if (cpMissionsUpdated && cpMissionsUpdated.length > 0 && cpMissionsUpdated.every(m => m.completed)) {
      checkpointCompleted = true
      await supabaseAdmin
        .from('checkpoints')
        .update({ completed: true, completed_at: now })
        .eq('id', mission.checkpoint_id)
    }
  }

  // Check if target is achieved (all checkpoints for this front complete)
  let targetAchieved = false
  if (mission.front_id) {
    const { data: frontCheckpoints } = await supabaseAdmin
      .from('checkpoints')
      .select('completed')
      .eq('front_id', mission.front_id)
      .eq('user_id', userId)

    if (frontCheckpoints && frontCheckpoints.length > 0 && frontCheckpoints.every(cp => cp.completed)) {
      targetAchieved = true
      await supabaseAdmin
        .from('fronts')
        .update({ target_achieved: true })
        .eq('id', mission.front_id)
    }
  }

  // Update user streak
  const today = new Date().toISOString().split('T')[0]
  await supabaseAdmin
    .from('users')
    .update({ last_active: today })
    .eq('id', userId)

  return NextResponse.json({
    success: true,
    data: {
      mission: { ...mission, completed: true, completed_at: now },
      checkpointCompleted,
      targetAchieved,
      avatarPosition: mission.stone_position,
    },
  })
}
