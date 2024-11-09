'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectStatus } from '@/lib/types'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ProjectList() {
  const [projects, setProjects] = useState<ProjectStatus[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const projectsQuery = query(
      collection(db, 'projects'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const projectsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as ProjectStatus[]
        setProjects(projectsData)
        setLoading(false)
      },
      (error) => {
        console.error('Error loading projects:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

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

  if (projects.length === 0) {
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
