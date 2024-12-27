import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    console.log('Project creation request received')

    // Verify session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('No authenticated session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get project data from request
    const data = await req.json()
    const { name, description } = data

    // Validate required fields
    if (!name) {
      console.error('Missing required field: name')
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    console.log('Creating project:', {
      name,
      description,
      userId: session.user.id
    })

    // Create project document
    const projectData = {
      name,
      description: description || '',
      userId: session.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chatHistory: [],
      scope: null,
      proposal: null,
      lessonsLearned: [],
      status: 'active'
    }

    const projectRef = await adminDb.collection('projects').add(projectData)
    const project = await projectRef.get()

    console.log('Project created successfully:', projectRef.id)

    return NextResponse.json({
      id: projectRef.id,
      ...project.data()
    })
  } catch (error) {
    console.error('Error creating project:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Failed to create project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('Projects fetch request received')

    // Verify session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('No authenticated session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching projects for user:', session.user.id)

    // Get all projects for the user
    const projectsSnapshot = await adminDb
      .collection('projects')
      .where('userId', '==', session.user.id)
      .orderBy('createdAt', 'desc')
      .get()

    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    console.log('Projects fetched successfully:', projects.length)

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
