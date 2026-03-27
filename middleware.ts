import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/map/:path*',
    '/calendar/:path*',
    '/fronts/:path*',
    '/notifications/:path*',
    '/api/missions/:path*',
    '/api/fronts/:path*',
    '/api/calendar/:path*',
    '/api/notifications/:path*',
    '/api/seed/:path*',
  ],
}
