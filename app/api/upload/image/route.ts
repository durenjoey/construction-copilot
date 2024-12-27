import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { adminStorage } from 'lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return new NextResponse('No file provided', { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new NextResponse('Only image files are allowed', { status: 400 })
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return new NextResponse('File size must be less than 5MB', { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `daily-reports/${session.user.id}/${Date.now()}-${file.name}`
    
    // Upload to Firebase Storage
    const bucket = adminStorage.bucket()
    const fileRef = bucket.file(fileName)
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type
      }
    })

    // Make the file publicly accessible
    await fileRef.makePublic()

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`

    return NextResponse.json({
      url: publicUrl,
      name: file.name,
      type: file.type
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
