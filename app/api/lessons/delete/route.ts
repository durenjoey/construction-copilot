import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { projectId, lessonId } = await req.json()

    if (!projectId || !lessonId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const projectRef = adminDb.collection('projects').doc(projectId)
    const projectDoc = await projectRef.get()

    if (!projectDoc.exists) {
      return new NextResponse('Project not found', { status: 404 })
    }

    const projectData = projectDoc.data()
    const updatedLessons = (projectData?.lessonsLearned || []).filter(
      (lesson: any) => lesson.id !== lessonId
    )

    await projectRef.update({
      lessonsLearned: updatedLessons
    })

    return new NextResponse('Lesson deleted successfully', { status: 200 })
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
