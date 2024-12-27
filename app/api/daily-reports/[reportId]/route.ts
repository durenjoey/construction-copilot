import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from 'lib/auth';
import { adminDb } from 'lib/firebase-admin';

// GET /api/daily-reports/[reportId]
export async function GET(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to access this resource' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get project to verify ownership
    const projectDoc = await adminDb.collection('projects').doc(projectId).get();
    if (!projectDoc.exists || projectDoc.data()?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Project not found or you do not have access to it' }, { status: 404 });
    }

    // Get the specific report
    const reportDoc = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('dailyReports')
      .doc(params.reportId)
      .get();

    if (!reportDoc.exists) {
      return NextResponse.json({ error: 'Daily report not found' }, { status: 404 });
    }

    const report = {
      id: reportDoc.id,
      ...reportDoc.data()
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching daily report:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Failed to fetch daily report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT /api/daily-reports/[reportId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to access this resource' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get project to verify ownership
    const projectDoc = await adminDb.collection('projects').doc(projectId).get();
    if (!projectDoc.exists || projectDoc.data()?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Project not found or you do not have access to it' }, { status: 404 });
    }

    const data = await req.json();
    const now = new Date().toISOString();

    // Update the report
    const reportRef = adminDb
      .collection('projects')
      .doc(projectId)
      .collection('dailyReports')
      .doc(params.reportId);

    await reportRef.update({
      ...data,
      updatedAt: now
    });

    // Get the updated report
    const updatedDoc = await reportRef.get();
    const updatedReport = {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Error updating daily report:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Failed to update daily report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/daily-reports/[reportId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to access this resource' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get project to verify ownership
    const projectDoc = await adminDb.collection('projects').doc(projectId).get();
    if (!projectDoc.exists || projectDoc.data()?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Project not found or you do not have access to it' }, { status: 404 });
    }

    // Delete the report
    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('dailyReports')
      .doc(params.reportId)
      .delete();

    return NextResponse.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting daily report:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      error: 'Failed to delete daily report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
