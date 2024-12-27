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
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 });
    }

    // Get project to verify ownership
    const projectDoc = await adminDb.collection('projects').doc(projectId).get();
    if (!projectDoc.exists || projectDoc.data()?.userId !== session.user.id) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Get the specific report
    const reportDoc = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('dailyReports')
      .doc(params.reportId)
      .get();

    if (!reportDoc.exists) {
      return new NextResponse('Report not found', { status: 404 });
    }

    const report = {
      id: reportDoc.id,
      ...reportDoc.data()
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching daily report:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
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
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 });
    }

    // Get project to verify ownership
    const projectDoc = await adminDb.collection('projects').doc(projectId).get();
    if (!projectDoc.exists || projectDoc.data()?.userId !== session.user.id) {
      return new NextResponse('Project not found', { status: 404 });
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
    return new NextResponse('Internal Server Error', { status: 500 });
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
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 });
    }

    // Get project to verify ownership
    const projectDoc = await adminDb.collection('projects').doc(projectId).get();
    if (!projectDoc.exists || projectDoc.data()?.userId !== session.user.id) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Delete the report
    await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('dailyReports')
      .doc(params.reportId)
      .delete();

    return new NextResponse('Report deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting daily report:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
