import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    email?: string
  }
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set')
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      console.log('JWT Callback:', { token, user, account })
      if (account && user) {
        // Initial sign in
        token.id = (user.id || user.email || 'unknown-id') as string // Ensure we have a string
        token.email = user.email || undefined
      }
      return token
    },
    async session({ session, token }) {
      console.log('Session Callback:', { session, token })
      if (session.user) {
        session.user.id = token.id || token.email || 'unknown-id' // Ensure we always have a string ID
        if (token.email) {
          session.user.email = token.email
        }
      }
      console.log('Returning session:', session)
      return session
    },
    async redirect({ url, baseUrl }) {
      // If the url is an absolute URL and matches the base URL origin, allow it
      if (url.startsWith(baseUrl)) return url
      // If it's a relative URL, prefix it with the base URL
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Default to the dashboard
      return `${baseUrl}/dashboard`
    }
  },
  debug: process.env.NODE_ENV === 'development',
}
