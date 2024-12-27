'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectStatus } from '@/lib/types'
import { db, verifyFirebaseConnection } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare, FileText, Trash2, ClipboardList } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { useRouter, usePathname } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ProjectList() {
  const [projects, setProjects] = useState<ProjectStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    console.log('Current pathname:', pathname)
    console.log('Session status:', status)
    console.log('Session data:', session)
  }, [pathname, session, status])

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

    const userId = session.user.id

    async function fetchProjects() {
      try {
        console.log('Setting up projects query for user:', userId)
        const projectsQuery = query(
          collection(db, 'projects'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        )

        // First, try to get projects directly
        console.log('Fetching projects...')
        const snapshot = await getDocs(projectsQuery)
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

        // Then set up real-time listener
        console.log('Setting up snapshot listener...')
        const unsubscribe = onSnapshot(
          projectsQuery,
          (snapshot) => {
            console.log('Real-time update received with', snapshot.docs.length, 'projects')
            const updatedProjects = snapshot.docs.map(doc => ({
              ...doc.data(),
              id: doc.id
            })) as ProjectStatus[]
            
            console.log('Updating projects state with:', updatedProjects)
            setProjects(updatedProjects)
          },
          (error) => {
            console.error('Snapshot listener error:', error)
            toast({
              title: 'Update Error',
              description: 'Failed to receive real-time updates. Some changes may not appear immediately.',
              variant: 'destructive',
            })
          }
        )

        return () => {
          console.log('Cleaning up Firestore listener')
          unsubscribe()
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
        setError('Failed to load projects')
        toast({
          title: 'Error',
          description: 'Failed to load projects. Please check your connection and try again.',
          variant: 'destructive',
        })
        setLoading(false)
      }
    }

    fetchProjects()
  }, [session?.user?.id, toast])

  const handleProjectClick = (projectId: string) => {
    console.log('Navigating to project:', projectId)
    router.push(`/dashboard/${projectId}`)
  }

  const handleChatClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    console.log('Opening chat for project:', projectId)
    router.push(`/dashboard/${projectId}/chat?tab=scope`)
  }

  const handleDailyReportsClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation()
    console.log('Opening daily reports for project:', projectId)
    router.push(`/dashboard/${projectId}/daily-reports`)
  }

  const handleDeleteClick = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/delete?projectId=${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });

      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive',
      });
    }
  };

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
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
    <>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card 
            key={project.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow h-full hover:bg-accent hover:text-accent-foreground"
            onClick={() => handleProjectClick(project.id)}
          >
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{project.name || 'Untitled Project'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {project.description || 'No description provided'}
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-sm py-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleProjectClick(project.id)
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="whitespace-nowrap">Project Details</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-sm py-2"
                  onClick={(e) => handleChatClick(e, project.id)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span className="whitespace-nowrap">Open Chat</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-sm py-2"
                  onClick={(e) => handleDailyReportsClick(e, project.id)}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  <span className="whitespace-nowrap">Daily Reports</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-sm py-2 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    setProjectToDelete(project.id)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <span className="whitespace-nowrap">Delete Project</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => projectToDelete && handleDeleteClick(projectToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
