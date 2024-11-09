import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminDb, adminStorage } from '@/lib/firebase-admin'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `uploads/${session.user.id}/${timestamp}-${file.name}`

    // Upload file to Firebase Storage
    const bucket = adminStorage.bucket()
    const fileRef = bucket.file(filename)
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    })

    // Get download URL
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500', // Far future expiration
    })

    // Save file metadata to Firestore
    await adminDb.collection('files').add({
      filename: file.name,
      filepath: filename,
      url,
      type: file.type,
      size: file.size,
      uploadedBy: session.user.id,
      uploadedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      url,
      filename: file.name,
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process upload' },
      { status: 500 }
    )
  }
}
