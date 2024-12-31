import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from 'lib/auth';
import { monitoring } from 'lib/monitoring';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const data = await req.json();
    const { message, stack, type, timestamp } = data;

    // Log error with monitoring service
    await monitoring.logError(new Error(message), {
      type: type || 'client',
      component: 'ErrorReport',
      action: 'clientReport',
      stack,
      timestamp,
      userId: session?.user?.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reporting error:', error);
    return NextResponse.json(
      { error: 'Failed to report error' },
      { status: 500 }
    );
  }
}
