import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { adminDb } from 'lib/firebase-admin'
import { DailyReport } from 'lib/types'

const validWeatherTypes = ['Sunny', 'Cloudy', 'Rainy', 'Stormy'] as const;

// Validate date format
const isValidDate = (dateString: string) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

// Validate URL format
const isValidUrl = (urlString: string) => {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
};

// GET /api/daily-reports?projectId=xxx
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to access this resource' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Get project to verify ownership
    const projectDoc = await adminDb.collection('projects').doc(projectId).get()
    if (!projectDoc.exists || projectDoc.data()?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Project not found or you do not have access to it' }, { status: 404 })
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
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Failed to fetch daily reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/daily-reports?projectId=xxx
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to access this resource' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Get project to verify ownership
    const projectDoc = await adminDb.collection('projects').doc(projectId).get()
    if (!projectDoc.exists || projectDoc.data()?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Project not found or you do not have access to it' }, { status: 404 })
    }

    const data = await req.json()

    // Validate required fields
    if (!data.date || !isValidDate(data.date)) {
      return NextResponse.json({ 
        error: 'Invalid date format'
      }, { status: 400 });
    }

    // Validate weather type
    if (!data.weather?.type || !validWeatherTypes.includes(data.weather.type)) {
      return NextResponse.json({ 
        error: 'Invalid weather type. Must be one of: Sunny, Cloudy, Rainy, Stormy'
      }, { status: 400 });
    }

    // Validate photos
    if (data.photos) {
      if (!Array.isArray(data.photos)) {
        return NextResponse.json({ 
          error: 'Photos must be an array'
        }, { status: 400 });
      }

      for (const photo of data.photos) {
        if (!photo.url || !isValidUrl(photo.url)) {
          return NextResponse.json({ 
            error: 'Invalid photo URL format'
          }, { status: 400 });
        }
      }
    }

    const now = new Date().toISOString()

    const dailyReport: Omit<DailyReport, 'id'> = {
      ...data,
      photos: data.photos || [],
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
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Failed to create daily report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
