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

    if (!projectId || !lesson || !lesson.id) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    // Get the project document
    const projectRef = adminDb.collection('projects').doc(projectId)
    const projectDoc = await projectRef.get()

    if (!projectDoc.exists) {
      return new NextResponse('Project not found', { status: 404 })
    }

    const projectData = projectDoc.data()
    const lessons = projectData?.lessonsLearned || []

    // Replace the old lesson with the updated one
    const updatedLessons = lessons.map((l: LessonLearned) => 
      l.id === lesson.id ? lesson : l
    )

    // Update the project document
    await projectRef.update({
      lessonsLearned: updatedLessons
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating lesson:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
