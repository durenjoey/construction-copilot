'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { ProjectStatus } from '../lib/types'
import { db, verifyFirebaseConnection } from '../lib/firebase'
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore'
import { Skeleton } from '../components/ui/skeleton'
import Link from 'next/link'
import { Button } from '../components/ui/button'
import { MessageSquare, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '../hooks/use-toast'

export function ProjectList() {
  const [projects, setProjects] = useState<ProjectStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()

  useEffect(() => {
    console.log('Session status:', status)
    console.log('Session data:', session)
  }, [session, status])

  useEffect(() => {
    async function initializeFirebase() {
      try {
        console.log('Verifying Firebase connection...')
        const isConnected = await verifyFirebaseConnection()
        if (!isConnected) {
          const errorMsg = 'Failed to connect to Firebase'
          console.error(errorMsg)
          setError(errorMsg)
          toast({
            title: 'Connection Error',
            description: 'Failed to connect to Firebase. Please check your environment variables and refresh the page.',
            variant: 'destructive',
          })
        } else {
          console.log('Firebase connection verified successfully')
        }
      } catch (error) {
        const errorMsg = 'Failed to initialize Firebase'
        console.error(errorMsg, error)
        setError(errorMsg)
        toast({
          title: 'Error',
          description: 'Failed to initialize Firebase. Please check your configuration.',
          variant: 'destructive',
        })
      }
    }

    initializeFirebase()
  }, [toast])

  useEffect(() => {
    if (!session?.user?.id) {
      console.log('No user ID found in session, skipping project fetch')
      setLoading(false)
      return
    }

    try {
      console.log('Setting up projects query for user:', session.user.id)
      const projectsQuery = query(
        collection(db, 'projects'),
        where('userId', '==', session.user.id),
        orderBy('createdAt', 'desc')
      )

      console.log('Setting up snapshot listener...')
      const unsubscribe = onSnapshot(
        projectsQuery,
        (snapshot) => {
          console.log('Received Firestore snapshot with', snapshot.docs.length, 'projects')
          const projectsData = snapshot.docs.map(doc => {
            const data = doc.data()
            console.log('Processing project:', { id: doc.id, ...data })
            return {
              ...data,
              id: doc.id
            }
          }) as ProjectStatus[]
          
          console.log('Setting projects state with:', projectsData)
          setProjects(projectsData)
          setLoading(false)
          setError(null)
        },
        (error) => {
          const errorMsg = 'Error loading projects'
          console.error(errorMsg, error)
          setError(errorMsg)
          toast({
            title: 'Error',
            description: 'Failed to load projects. Please check your Firebase configuration and refresh the page.',
            variant: 'destructive',
          })
          setLoading(false)
        }
      )

      return () => {
        console.log('Cleaning up Firestore listener')
        unsubscribe()
      }
    } catch (error) {
      const errorMsg = 'Error setting up projects listener'
      console.error(errorMsg, error)
      setError(errorMsg)
      toast({
        title: 'Error',
        description: 'Failed to set up projects listener. Please check your Firebase configuration.',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }, [session?.user?.id, toast])

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-40">
          <p className="text-destructive">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!session?.user) {
    console.log('No user session found')
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-40">
          <p className="text-muted-foreground">Please sign in to view your projects</p>
        </CardContent>
      </Card>
    )
  }

  if (projects.length === 0) {
    console.log('No projects found for user:', session.user.id)
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-40">
          <p className="text-muted-foreground">No projects yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/dashboard/${project.id}`}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
              <CardTitle>{project.name || 'Untitled Project'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {project.description || 'No description provided'}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <span>
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </span>
                </Button>
                <Button variant="outline" size="sm" className="w-full" onClick={(e) => {
                  e.preventDefault()
                  router.push(`/dashboard/${project.id}/chat`)
                }}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Open Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
