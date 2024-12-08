import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { adminDb, adminStorage } from 'lib/firebase-admin'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function uploadWithRetry(
  bucket: any,
  filename: string,
  buffer: Buffer,
  metadata: { contentType: string },
  retryCount = 0
): Promise<void> {
  try {
    const fileRef = bucket.file(filename)
    await fileRef.save(buffer, {
      metadata,
      timeout: 30000, // 30 second timeout
      resumable: true, // Enable resumable uploads
      maxRetries: 5
    })
  } catch (error) {
    console.error(`Upload attempt ${retryCount + 1} failed:`, error)
    
    if (retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * Math.pow(2, retryCount)) // Exponential backoff
      return uploadWithRetry(bucket, filename, buffer, metadata, retryCount + 1)
    }
    throw error
  }
}

async function getSignedUrlWithRetry(
  fileRef: any,
  retryCount = 0
): Promise<string> {
  try {
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
    })
    return url
  } catch (error) {
    console.error(`Signed URL generation attempt ${retryCount + 1} failed:`, error)
    
    if (retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * Math.pow(2, retryCount))
      return getSignedUrlWithRetry(fileRef, retryCount + 1)
    }
    throw error
  }
}

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
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF and Word documents are supported' },
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

    // Extract text content from the file
    let content = ''
    try {
      // For now, treat the buffer as text content
      // In a production environment, you'd want to use proper PDF/DOCX parsing libraries
      content = buffer.toString('utf-8')
      
      // If content is empty or appears to be binary, provide a placeholder
      if (!content.trim() || /[\x00-\x08\x0E-\x1F]/.test(content)) {
        content = `Content of ${file.name} (${file.type})`
      }
    } catch (error) {
      console.error('Error extracting file content:', error)
      content = `Content of ${file.name} (${file.type})`
    }

    // Generate unique filename with sanitization
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `uploads/${session.user.id}/${timestamp}-${sanitizedFileName}`

    // Upload file to Firebase Storage with retry logic
    const bucket = adminStorage.bucket()
    const fileRef = bucket.file(filename)
    
    try {
      console.log('Starting file upload to Firebase Storage...')
      await uploadWithRetry(bucket, filename, buffer, {
        contentType: file.type,
      })
      console.log('File upload completed successfully')
    } catch (error) {
      console.error('All upload attempts failed:', error)
      return NextResponse.json(
        { error: 'Failed to upload file after multiple attempts' },
        { status: 500 }
      )
    }

    // Generate signed URL with retry logic
    let url: string
    try {
      console.log('Generating signed URL...')
      url = await getSignedUrlWithRetry(fileRef)
      console.log('Signed URL generated successfully:', url)
    } catch (error) {
      console.error('Failed to generate signed URL after all retries:', error)
      // Clean up the uploaded file since we couldn't generate a URL
      try {
        await fileRef.delete()
      } catch (deleteError) {
        console.error('Error deleting file after URL generation failure:', deleteError)
      }
      return NextResponse.json(
        { error: 'Failed to generate file access URL' },
        { status: 500 }
      )
    }

    // Save file metadata to Firestore
    try {
      await adminDb.collection('files').add({
        filename: file.name,
        filepath: filename,
        url,
        type: file.type,
        size: file.size,
        content,
        uploadedBy: session.user.id,
        uploadedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error saving to Firestore:', error)
      // If Firestore save fails, clean up the uploaded file
      try {
        await fileRef.delete()
      } catch (deleteError) {
        console.error('Error deleting file after Firestore failure:', deleteError)
      }
      return NextResponse.json(
        { error: 'Failed to save file metadata' },
        { status: 500 }
      )
    }

    console.log('Successfully processed file upload:', {
      name: file.name,
      type: file.type,
      size: file.size,
      url
    })

    return NextResponse.json({
      success: true,
      url,
      name: file.name,
      type: file.type,
      content
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process upload',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
