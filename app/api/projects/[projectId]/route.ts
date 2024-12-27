import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { adminDb } from 'lib/firebase-admin'

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    console.log('Project fetch request received for:', params.projectId)

    // Verify session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('No authenticated session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the project document
    const projectDoc = await adminDb.collection('projects').doc(params.projectId).get()

    // Check if project exists and belongs to user
    if (!projectDoc.exists || projectDoc.data()?.userId !== session.user.id) {
      console.error('Project not found or unauthorized')
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    console.log('Project fetched successfully')

    return NextResponse.json({
      id: projectDoc.id,
      ...projectDoc.data()
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Failed to fetch project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
