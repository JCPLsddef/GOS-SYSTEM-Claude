import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import type { Session } from 'next-auth'

/**
 * Get the authenticated user's Supabase ID.
 * 1. Fast path: use session.dbUserId (set by jwt callback)
 * 2. Fallback: look up by email
 * 3. Last resort: auto-create user from session data
 * Returns null if no session or creation fails.
 */
export async function getAuthenticatedUserId(): Promise<{
  userId: string | null
  session: Session | null
}> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return { userId: null, session: null }
  }

  // Fast path: dbUserId already in session
  if (session.dbUserId) {
    return { userId: session.dbUserId, session }
  }

  // Fallback: look up by email
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (user) {
    return { userId: user.id, session }
  }

  // Last resort: auto-create user
  const { data: newUser } = await supabaseAdmin
    .from('users')
    .insert({
      google_id: session.userId || session.user.email,
      email: session.user.email,
      name: session.user.name || null,
      avatar_url: session.user.image || null,
      last_active: new Date().toISOString().split('T')[0],
    })
    .select('id')
    .single()

  return { userId: newUser?.id || null, session }
}
