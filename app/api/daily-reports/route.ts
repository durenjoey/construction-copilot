import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { adminDb } from 'lib/firebase-admin'
import { DailyReport } from 'lib/types'

// GET /api/daily-reports?projectId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 })
    }

    // Get project to verify ownership
    const projectDoc = await adminDb.collection('projects').doc(projectId).get()
    if (!projectDoc.exists || projectDoc.data()?.userId !== session.user.id) {
      return new NextResponse('Project not found', { status: 404 })
    }

    // Get all daily reports for the project
    const reportsSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('dailyReports')
      .orderBy('date', 'desc')
      .get()

    const reports = reportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching daily reports:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// POST /api/daily-reports?projectId=xxx
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 })
    }

    // Get project to verify ownership
    const projectDoc = await adminDb.collection('projects').doc(projectId).get()
    if (!projectDoc.exists || projectDoc.data()?.userId !== session.user.id) {
      return new NextResponse('Project not found', { status: 404 })
    }

    const data = await req.json()
    const now = new Date().toISOString()

    const dailyReport: Omit<DailyReport, 'id'> = {
      ...data,
      createdAt: now,
      updatedAt: now
    }

    // Add the daily report
    const reportRef = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('dailyReports')
      .add(dailyReport)

    // Get the created report
    const reportDoc = await reportRef.get()
    const report = {
      id: reportDoc.id,
      ...reportDoc.data()
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error creating daily report:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
