import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { supabaseAdmin } from '@/lib/supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          await supabase.from('users').upsert(
            {
              google_id: user.id!,
              email: user.email!,
              name: user.name,
              avatar_url: user.image,
            },
            { onConflict: 'google_id' }
          )
        } catch (err) {
          console.error('Error upserting user in signIn callback:', err)
        }
      }
      return true
    },
    async jwt({ token, account }) {
      // On initial sign in, persist OAuth tokens + upsert user in Supabase
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        token.userId = token.sub

        // Upsert user in Supabase
        try {
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('google_id', token.sub!)
            .single()

          if (existingUser) {
            // Update last active
            await supabaseAdmin
              .from('users')
              .update({
                last_active: new Date().toISOString().split('T')[0],
                name: token.name || undefined,
                avatar_url: token.picture || undefined,
              })
              .eq('id', existingUser.id)
            token.dbUserId = existingUser.id
          } else {
            // Insert new user
            const { data: newUser } = await supabaseAdmin
              .from('users')
              .insert({
                google_id: token.sub!,
                email: token.email!,
                name: token.name || null,
                avatar_url: token.picture || null,
                last_active: new Date().toISOString().split('T')[0],
              })
              .select('id')
              .single()
            if (newUser) token.dbUserId = newUser.id
          }
        } catch (err) {
          console.error('Error upserting user:', err)
        }
      }

      // Return previous token if not expired
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token
      }

      // Token expired — refresh it
      try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: 'refresh_token',
            refresh_token: token.refreshToken as string,
          }),
        })

        const refreshed = await response.json()

        if (!response.ok) throw refreshed

        token.accessToken = refreshed.access_token
        token.expiresAt = Math.floor(Date.now() / 1000) + refreshed.expires_in
        if (refreshed.refresh_token) {
          token.refreshToken = refreshed.refresh_token
        }
      } catch (error) {
        console.error('Error refreshing access token:', error)
        token.error = 'RefreshAccessTokenError'
      }

      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.userId = token.userId as string
      session.dbUserId = token.dbUserId as string
      session.error = token.error as string | undefined
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}

// Augment NextAuth types
declare module 'next-auth' {
  interface Session {
    accessToken: string
    userId: string
    dbUserId: string
    error?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
    userId?: string
    dbUserId?: string
    error?: string
  }
}
