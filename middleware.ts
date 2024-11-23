import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    console.log('Middleware processing path:', request.nextUrl.pathname)

    // Skip auth check for next-auth endpoints, static files, and API routes
    if (
      request.nextUrl.pathname.startsWith('/api/auth') ||
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.includes('.') ||
      request.nextUrl.pathname.startsWith('/api/')
    ) {
      console.log('Skipping auth check for:', request.nextUrl.pathname)
      return NextResponse.next()
    }

    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    
    console.log('Token status:', token ? 'present' : 'absent')
    const { pathname, origin } = request.nextUrl

    // Protect dashboard routes
    if (pathname.startsWith('/dashboard')) {
      if (!token) {
        console.log('No token found, redirecting to signin')
        const signInUrl = new URL('/auth/signin', origin)
        signInUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(signInUrl)
      }
      console.log('Token found, allowing access to dashboard')
      return NextResponse.next()
    }

    // Redirect authenticated users from auth pages to dashboard
    if (token && (pathname === '/auth/signin' || pathname === '/')) {
      console.log('User is authenticated, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', origin))
    }
    
    // Allow all other routes
    console.log('Allowing access to:', pathname)
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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
