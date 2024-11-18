import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  query,
  getDocs,
  orderBy,
  where,
  enableIndexedDbPersistence,
  limit,
} from 'firebase/firestore'
import { ProjectStatus } from './types'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Log Firebase config (without sensitive values)
console.log('Initializing Firebase with config:', {
  apiKey: firebaseConfig.apiKey ? '✓' : '✗',
  authDomain: firebaseConfig.authDomain ? '✓' : '✗',
  projectId: firebaseConfig.projectId ? '✓' : '✗',
  storageBucket: firebaseConfig.storageBucket ? '✓' : '✗',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✓' : '✗',
  appId: firebaseConfig.appId ? '✓' : '✗',
  measurementId: firebaseConfig.measurementId ? '✓' : '✗',
})

// Check if any config values are missing
const missingConfigs = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value)
  .map(([key]) => key)

if (missingConfigs.length > 0) {
  console.error('Missing Firebase config values:', missingConfigs)
  throw new Error(`Missing Firebase configuration: ${missingConfigs.join(', ')}`)
}

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.error('Multiple tabs open, persistence can only be enabled in one tab at a time.')
    } else if (err.code === 'unimplemented') {
      console.error('The current browser doesn\'t support persistence.')
    }
  })
} catch (err) {
  console.error('Error enabling persistence:', err)
}

export async function createProject(data: {
  name: string
  description: string
}, userId: string) {
  console.log('Creating project with data:', { ...data, userId })
  
  if (!userId) {
    throw new Error('User ID is required to create a project')
  }

  const projectData = {
    ...data,
    userId,
    createdAt: new Date().toISOString(),
    chatHistory: [],
    scope: null,
    proposal: null,
    lessonsLearned: [],
    status: 'active'
  }

  try {
    console.log('Attempting to add document to Firestore')
    const projectsRef = collection(db, 'projects')
    const docRef = await addDoc(projectsRef, projectData)
    console.log('Project created successfully with ID:', docRef.id)
    return docRef
  } catch (error) {
    console.error('Error creating project:', error)
    throw error
  }
}

export async function getProjects(userId: string): Promise<ProjectStatus[]> {
  console.log('Fetching projects for user:', userId)
  
  if (!userId) {
    console.error('No user ID provided to getProjects')
    return []
  }

  try {
    const projectsQuery = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )

    console.log('Executing Firestore query with:', {
      collection: 'projects',
      userId,
      orderBy: 'createdAt'
    })

    const snapshot = await getDocs(projectsQuery)
    console.log('Query returned', snapshot.docs.length, 'projects')

    const projects = snapshot.docs.map(doc => {
      const data = doc.data()
      console.log('Project data:', { id: doc.id, ...data })
      return {
        id: doc.id,
        ...data,
      }
    }) as ProjectStatus[]

    console.log('Processed projects:', projects)
    return projects
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw error
  }
}

// Add a function to verify Firebase connection
export async function verifyFirebaseConnection() {
  try {
    console.log('Testing Firebase connection...')
    const testQuery = query(collection(db, 'projects'), limit(1))
    const snapshot = await getDocs(testQuery)
    console.log('Firebase connection verified successfully, found', snapshot.docs.length, 'documents')
    return true
  } catch (error) {
    console.error('Firebase connection test failed:', error)
    return false
  }
}
