import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

const apps = getApps()

if (!apps.length) {
  // Check for required environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `Firebase admin environment variables are missing:
      PROJECT_ID: ${projectId ? '✓' : '✗'}
      CLIENT_EMAIL: ${clientEmail ? '✓' : '✗'}
      PRIVATE_KEY: ${privateKey ? '✓' : '✗'}`
    )
  }

  try {
    // Handle different formats of private key
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }
    
    // Ensure the key has the proper header and footer
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`
    }

    const credential = cert({
      projectId,
      clientEmail,
      privateKey,
    })

    initializeApp({
      credential,
      storageBucket: `${projectId}.appspot.com`
    })

    // Test the initialization by trying to access Firestore
    const db = getFirestore()
    console.log('Firebase Admin initialized successfully with project:', projectId)
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error)
    console.error('Project ID:', projectId)
    console.error('Client Email:', clientEmail)
    console.error('Private Key length:', privateKey?.length)
    throw error
  }
}

export const adminDb = getFirestore()
export const adminStorage = getStorage()
