import { supabaseAdmin } from '@/lib/supabase'

export function mapMission(m: Record<string, unknown>) {
  return {
    id: m.id as string,
    frontId: m.front_id as string,
    checkpointId: m.checkpoint_id as string,
    name: m.name as string,
    definitionOfDone: (m.definition_of_done || '') as string,
    priority: (m.priority || 2) as 1 | 2 | 3,
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

// Build nested front objects (front -> checkpoints -> missions) for the frontend
export async function buildFronts(userId: string) {
  const { data: fronts } = await supabaseAdmin
    .from('fronts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')

  if (!fronts) return []

  const { data: checkpoints } = await supabaseAdmin
    .from('checkpoints')
    .select('*')
    .eq('user_id', userId)
    .order('order_index')

  const { data: missions } = await supabaseAdmin
    .from('missions')
    .select('*')
    .eq('user_id', userId)

  return fronts.map(f => ({
    id: f.id,
    name: f.name,
    type: f.type,
    color: f.color,
    icon: f.icon || '',
    target: {
      id: `target-${f.id}`,
      frontId: f.id,
      description: f.target_description || '',
      deadline: f.target_deadline ? new Date(f.target_deadline).toISOString() : '',
      achieved: f.target_achieved || false,
    },
    checkpoints: (checkpoints || [])
      .filter(cp => cp.front_id === f.id)
      .map(cp => ({
        id: cp.id,
        frontId: cp.front_id,
        name: cp.name,
        order: cp.order_index,
        completed: cp.completed || false,
        completedAt: cp.completed_at || undefined,
        missions: (missions || [])
          .filter(m => m.checkpoint_id === cp.id)
          .map(mapMission),
      })),
    createdAt: f.created_at,
    updatedAt: f.created_at,
  }))
}
