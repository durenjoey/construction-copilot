import { adminDb } from 'lib/firebase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { Timestamp } from 'firebase-admin/firestore'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const { projectId, lesson } = await request.json()

    if (!projectId || !lesson) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    const projectRef = adminDb.collection('projects').doc(projectId)
    const projectDoc = await projectRef.get()

    if (!projectDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404 }
      )
    }

    const now = Timestamp.now()
    const serverLesson = {
      ...lesson,
      timestamp: now
    }

    const currentData = projectDoc.data()
    const currentLessons = currentData?.lessonsLearned || []

    await projectRef.update({
      lessonsLearned: [...currentLessons, serverLesson]
    })

    revalidatePath(`/dashboard/${projectId}/lessons`)

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to add lesson' }),
      { status: 500 }
    )
  }
}
