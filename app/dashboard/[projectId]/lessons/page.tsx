import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { adminDb } from '@/lib/firebase-admin'
import { ProjectStatus, LessonLearned } from '@/lib/types'
import { LessonForm } from '@/components/lesson-form'
import { unstable_noStore } from 'next/cache'

interface LessonsPageProps {
  params: {
    projectId: string
  }
}

export default async function LessonsPage({ params }: LessonsPageProps) {
  // Prevent caching to ensure fresh data on each request
  unstable_noStore()
  
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  try {
    const projectDoc = await adminDb.collection('projects').doc(params.projectId).get()
    const projectData = projectDoc.data() as ProjectStatus | undefined

    if (!projectDoc.exists || !projectData) {
      return (
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h1 className="text-3xl font-bold">Project Not Found</h1>
            <p className="text-muted-foreground">This project may have been deleted or does not exist.</p>
            <Button asChild>
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      )
    }

    // Ensure lessonsLearned exists and is an array
    const lessons = projectData.lessonsLearned || []

    return (
      <div className="container py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">Lessons Learned Repository</h1>
            <p className="text-muted-foreground">
              Document and track lessons learned throughout the project lifecycle
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href={`/dashboard/${params.projectId}`}>
                Back to Project
              </Link>
            </Button>
            <LessonForm projectId={params.projectId} />
          </div>
        </div>

        <div className="grid gap-6">
          {lessons.length > 0 ? (
            lessons.map((lesson: LessonLearned) => (
              <Card key={lesson.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    {lesson.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Problem/Challenge</h3>
                      <p className="text-muted-foreground">{lesson.problem}</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Impact Assessment</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {Object.entries(lesson.impact).map(([type, impact]) => (
                          impact.affected && (
                            <div key={type} className="border rounded-lg p-4">
                              <h4 className="font-medium capitalize mb-1">{type}</h4>
                              <p className="text-sm text-muted-foreground">{impact.details}</p>
                            </div>
                          )
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Root Cause</h3>
                      <p className="text-muted-foreground">{lesson.rootCause}</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Solution/Action Taken</h3>
                      <p className="text-muted-foreground">{lesson.solution}</p>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Added on {new Date(lesson.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Lessons Added Yet</h2>
              <p className="text-muted-foreground mb-4">
                Start documenting lessons learned to improve future project outcomes
              </p>
              <LessonForm projectId={params.projectId} />
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading project:', error)
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h1 className="text-3xl font-bold">Error Loading Project</h1>
          <p className="text-muted-foreground">There was an error loading this project. Please try again later.</p>
          <Button asChild>
            <Link href="/dashboard">
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    )
  }
}
