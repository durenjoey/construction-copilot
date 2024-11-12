import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json()
    
    if (!path) {
      console.error('Revalidation failed: No path provided')
      return NextResponse.json(
        { message: 'Path is required' },
        { status: 400 }
      )
    }

    console.log('Revalidating path:', path)
    revalidatePath(path)
    
    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(),
      path 
    })
  } catch (err) {
    console.error('Revalidation error:', err)
    return NextResponse.json(
      { message: 'Error revalidating', error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
