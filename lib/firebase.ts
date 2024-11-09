import { initializeApp, getApps, getApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  query,
  getDocs,
  orderBy,
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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const db = getFirestore(app)

export async function createProject(data: {
  name: string
  description: string
}) {
  return addDoc(collection(db, 'projects'), {
    ...data,
    createdAt: new Date().toISOString(),
    chatHistory: [],
    scope: null,
    proposal: null,
    lessonsLearned: []
  })
}

export async function getProjects(): Promise<ProjectStatus[]> {
  const projectsQuery = query(
    collection(db, 'projects'),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(projectsQuery)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ProjectStatus[]
}
