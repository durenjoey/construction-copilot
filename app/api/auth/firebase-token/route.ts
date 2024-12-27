import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAuth } from 'firebase-admin/auth'

export async function POST(req: NextRequest) {
  try {
    console.log('Firebase token request received')

    // Verify session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('No authenticated session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from request
    const body = await req.json()
    const { userId } = body

    console.log('Request details:', {
      sessionUserId: session.user.id,
      requestUserId: userId
    })

    // Verify user ID matches session
    if (userId !== session.user.id) {
      console.error('User ID mismatch')
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 403 })
    }

    // Create custom token
    console.log('Creating Firebase custom token...')
    const auth = getAuth()
    const token = await auth.createCustomToken(userId)
    console.log('Firebase custom token created successfully')

    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error creating Firebase token:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
