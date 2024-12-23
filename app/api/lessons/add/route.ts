import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { adminDb } from '../../../../lib/firebase-admin'
import { LessonLearned } from '../../../../lib/types'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { projectId, lesson } = await req.json()

    if (!projectId || !lesson) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Get the project document
    const projectRef = adminDb.collection('projects').doc(projectId)
    const projectDoc = await projectRef.get()

    if (!projectDoc.exists) {
      return new NextResponse('Project not found', { status: 404 })
    }

    const projectData = projectDoc.data()
    const currentLessons = projectData?.lessonsLearned || []

    // Add the new lesson
    const newLesson: LessonLearned = {
      ...lesson,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }

    // Update the project document
    await projectRef.update({
      lessonsLearned: [...currentLessons, newLesson]
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding lesson:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
