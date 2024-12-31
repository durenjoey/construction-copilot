import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Test endpoint working' });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    return NextResponse.json({ message: 'Test endpoint received data', data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );
  }
}
