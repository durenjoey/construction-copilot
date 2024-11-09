import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Skip auth check for next-auth endpoints and static files
    if (
      request.nextUrl.pathname.startsWith('/api/auth') ||
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.includes('.')
    ) {
      return NextResponse.next()
    }

    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    
    const { pathname, origin } = request.nextUrl

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        const signInUrl = new URL('/auth/signin', origin)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }
      return NextResponse.next()
    }

    // Redirect authenticated users from auth pages to dashboard
    if (token && (pathname === '/auth/signin' || pathname === '/')) {
      return NextResponse.redirect(new URL('/dashboard', origin))
    }
    
    // Allow all other routes
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to signin page
    const signInUrl = new URL('/auth/signin', request.url)
    return NextResponse.redirect(signInUrl)
  }
}

// Configure middleware to run only on specific paths
export const config = {
  matcher: [
    /*
     * Match all paths except static files and API routes
     */
    '/((?!_next/|images/|favicon.ico).*)',
  ],
}
