import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.dbUserId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.dbUserId

  // Check if already seeded
  const { data: existingFronts } = await supabaseAdmin
    .from('fronts')
    .select('id')
    .eq('user_id', userId)
    .limit(1)

  if (existingFronts && existingFronts.length > 0) {
    return NextResponse.json({ success: true, data: { seeded: false, message: 'Already seeded' } })
  }

  // Seed 3 fronts
  const frontsData = [
    { user_id: userId, name: 'Business', type: 'business', color: '#4CAF7D', icon: '⚡', target_description: '2 new clients signed by April 25, 2026', target_deadline: '2026-04-25', target_achieved: false },
    { user_id: userId, name: 'School', type: 'school', color: '#4A90D9', icon: '📚', target_description: 'Pass all courses this semester', target_deadline: '2026-05-30', target_achieved: false },
    { user_id: userId, name: 'Health', type: 'health', color: '#E8973A', icon: '🥊', target_description: '5x boxing per week, Mon–Fri 18:00–19:00', target_deadline: '2026-04-25', target_achieved: false },
  ]

  const { data: fronts } = await supabaseAdmin.from('fronts').insert(frontsData).select()
  if (!fronts) return NextResponse.json({ success: false, error: 'Failed to seed fronts' }, { status: 500 })

  const businessId = fronts[0].id
  const schoolId = fronts[1].id
  const healthId = fronts[2].id

  // Seed checkpoints
  const checkpointsData = [
    { front_id: businessId, user_id: userId, name: 'Build prospect list (50 leads)', order_index: 1 },
    { front_id: businessId, user_id: userId, name: 'Write cold email sequence', order_index: 2 },
    { front_id: businessId, user_id: userId, name: 'Send 100 cold emails', order_index: 3 },
    { front_id: businessId, user_id: userId, name: 'Book 3+ discovery calls', order_index: 4 },
    { front_id: businessId, user_id: userId, name: 'Close 2 clients', order_index: 5 },
    { front_id: schoolId, user_id: userId, name: 'Complete all pending assignments', order_index: 1 },
    { front_id: schoolId, user_id: userId, name: 'Pass all midterms', order_index: 2 },
    { front_id: schoolId, user_id: userId, name: 'Submit all finals', order_index: 3 },
    { front_id: healthId, user_id: userId, name: 'Week 1: 5 sessions', order_index: 1 },
    { front_id: healthId, user_id: userId, name: 'Week 2: 5 sessions', order_index: 2 },
    { front_id: healthId, user_id: userId, name: 'Week 3: 5 sessions', order_index: 3 },
    { front_id: healthId, user_id: userId, name: 'Week 4: 5 sessions', order_index: 4 },
  ]

  const { data: checkpoints } = await supabaseAdmin.from('checkpoints').insert(checkpointsData).select()
  if (!checkpoints) return NextResponse.json({ success: false, error: 'Failed to seed checkpoints' }, { status: 500 })

  // Helper to find checkpoint ID by name prefix
  const cpId = (prefix: string) => checkpoints.find(c => c.name.startsWith(prefix))?.id

  // Seed missions
  const missionsData = [
    { front_id: businessId, checkpoint_id: cpId('Build prospect'), user_id: userId, name: 'Build 50-prospect cold email list (painters + barbershops)', definition_of_done: 'Google Sheet with 50 verified leads — name, business, email, city', priority: 1, energy_demand: 'high', estimated_minutes: 90, attack_date: '2026-03-31T09:00:00Z', due_date: '2026-03-31T23:59:59Z', stone_position: 10 },
    { front_id: businessId, checkpoint_id: cpId('Write cold'), user_id: userId, name: 'Write 3-email cold outreach sequence', definition_of_done: '3 emails drafted, reviewed, loaded in Gmail', priority: 1, energy_demand: 'high', estimated_minutes: 60, attack_date: '2026-04-01T12:00:00Z', due_date: '2026-04-01T23:59:59Z', stone_position: 20 },
    { front_id: businessId, checkpoint_id: cpId('Send 100'), user_id: userId, name: 'Send batch 1: 25 cold emails', definition_of_done: '25 emails sent, logged in tracker sheet', priority: 1, energy_demand: 'medium', estimated_minutes: 45, attack_date: '2026-04-02T12:00:00Z', due_date: '2026-04-02T23:59:59Z', stone_position: 30 },
    { front_id: businessId, checkpoint_id: cpId('Send 100'), user_id: userId, name: 'Send batch 2: 25 cold emails', definition_of_done: '50 total emails sent this week', priority: 1, energy_demand: 'medium', estimated_minutes: 45, attack_date: '2026-04-03T12:00:00Z', due_date: '2026-04-03T23:59:59Z', stone_position: 40 },
    { front_id: healthId, checkpoint_id: cpId('Week 1'), user_id: userId, name: 'Boxing session — Monday', definition_of_done: '1 hour boxing at 18:00', priority: 2, energy_demand: 'high', estimated_minutes: 60, attack_date: '2026-03-30T18:00:00Z', stone_position: 50 },
    { front_id: healthId, checkpoint_id: cpId('Week 1'), user_id: userId, name: 'Boxing session — Tuesday', definition_of_done: '1 hour boxing at 18:00', priority: 2, energy_demand: 'high', estimated_minutes: 60, attack_date: '2026-03-31T18:00:00Z', stone_position: 55 },
    { front_id: healthId, checkpoint_id: cpId('Week 1'), user_id: userId, name: 'Boxing session — Wednesday', definition_of_done: '1 hour boxing at 18:00', priority: 2, energy_demand: 'high', estimated_minutes: 60, attack_date: '2026-04-01T18:00:00Z', stone_position: 60 },
    { front_id: healthId, checkpoint_id: cpId('Week 1'), user_id: userId, name: 'Boxing session — Thursday', definition_of_done: '1 hour boxing at 18:00', priority: 2, energy_demand: 'high', estimated_minutes: 60, attack_date: '2026-04-02T18:00:00Z', stone_position: 65 },
    { front_id: healthId, checkpoint_id: cpId('Week 1'), user_id: userId, name: 'Boxing session — Friday', definition_of_done: '1 hour boxing at 18:00', priority: 2, energy_demand: 'high', estimated_minutes: 60, attack_date: '2026-04-03T18:00:00Z', stone_position: 70 },
    { front_id: schoolId, checkpoint_id: cpId('Complete all'), user_id: userId, name: 'Complete overdue assignment — Database Systems', definition_of_done: 'Assignment submitted on Moodle before 23:59', priority: 1, energy_demand: 'high', estimated_minutes: 120, attack_date: '2026-03-31T14:00:00Z', due_date: '2026-04-01T23:59:59Z', stone_position: 80 },
  ]

  await supabaseAdmin.from('missions').insert(missionsData)

  // Seed mantras
  const mantrasData = [
    { user_id: userId, type: 'dream', text: 'Villa. Tropical sun. MacBook open. Beautiful wife. Children laughing. Luxury car in the driveway. Your family proud. Your peers in awe. This is what you\'re building. Every. Single. Day.' },
    { user_id: userId, type: 'dream', text: 'You made it. The man your 18-year-old self was betting on. King of your domain. Respected by everyone who doubted you. The life you dreamed \u2014 you built it with your hands.' },
    { user_id: userId, type: 'dream', text: 'She looks at you like you hung the stars. Your children carry your name with pride. The villa is yours. The cars are yours. The freedom is yours. You earned every inch of it.' },
    { user_id: userId, type: 'nightmare', text: 'Video games. Doom scrolling. Parents\' house. 25 years old, no clients, no income, no respect. The business you talked about \u2014 still just talk. The man you could have become \u2014 a ghost.' },
    { user_id: userId, type: 'nightmare', text: 'Single. Ashamed. The villa exists \u2014 someone else built it. The life exists \u2014 someone else lived it. You had everything it took. You just didn\'t show up.' },
    { user_id: userId, type: 'nightmare', text: 'Your family stopped asking about the business. Your peers stopped expecting anything. You became the cautionary tale. The one who almost made it. Don\'t let this be you.' },
  ]

  await supabaseAdmin.from('mantras').insert(mantrasData)

  // Seed notification rules
  const notifData = [
    { user_id: userId, type: 'daily_preview', message: "Morning. One win today. What's the mission?", trigger_time: '06:30', recurring: 'daily' },
    { user_id: userId, type: 'mission_reminder', message: 'Boxing in 15 minutes. Non-negotiable.', trigger_time: '17:45', recurring: 'daily' },
    { user_id: userId, type: 'daily_preview', message: 'Shutdown. What got done? What moves tomorrow?', trigger_time: '22:00', recurring: 'daily' },
    { user_id: userId, type: 'weekly_review', message: 'Weekly review. 20 minutes. OODA time.', trigger_time: '21:00', recurring: 'weekly' },
  ]

  await supabaseAdmin.from('notification_rules').insert(notifData)

  return NextResponse.json({
    success: true,
    data: { seeded: true, fronts: 3, missions: missionsData.length, mantras: 6, notifications: 4 },
  })
}
