import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from 'lib/auth'
import { Button } from 'components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'components/ui/tabs'
import { FileText, ClipboardList, Lightbulb, Pencil } from 'lucide-react'
import Link from 'next/link'
import { adminDb } from 'lib/firebase-admin'
import { ProjectStatus, LessonLearned } from 'lib/types'
import { LessonForm } from 'components/lesson-form'
import { EditLessonForm } from 'components/edit-lesson-form'
import { DeleteLessonButton } from 'components/delete-lesson-button'
import { unstable_noStore } from 'next/cache'

interface ProjectPageProps {
  params: {
    projectId: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  // Prevent caching to ensure fresh data on each request
  unstable_noStore()
  
  console.log('Loading project page for ID:', params.projectId)
  
  const session = await getServerSession(authOptions)
  console.log('Session status:', session ? 'authenticated' : 'unauthenticated')
  
  if (!session) {
    console.log('No session found, redirecting to signin')
    redirect('/auth/signin')
  }

  try {
    console.log('Fetching project document...')
    const projectDoc = await adminDb.collection('projects').doc(params.projectId).get()
    console.log('Project document exists:', projectDoc.exists)
    
    const projectData = projectDoc.data()
    console.log('Project data retrieved:', projectData ? 'yes' : 'no')

    if (!projectDoc.exists || !projectData) {
      console.log('Project not found, rendering not found state')
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

    // Verify project belongs to current user
    if (projectData.userId !== session.user.id) {
      console.log('Project does not belong to current user')
      return (
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to view this project.</p>
            <Button asChild>
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      )
    }

    console.log('Rendering project page with data')
    const project = projectData as ProjectStatus

    // Ensure lessonsLearned exists and is an array
    const lessons = project.lessonsLearned || []

    return (
      <div className="container py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{project.name || 'Untitled Project'}</h1>
        </div>

        {/* Main Navigation Tabs */}
        <Tabs defaultValue="scope" className="w-full">
          <TabsList className="w-full grid grid-cols-3 lg:max-w-[800px] mx-auto h-auto p-1">
            <TabsTrigger value="scope" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="font-medium">Scope Writer</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="proposal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <div className="flex items-center justify-center gap-2">
                <ClipboardList className="h-5 w-5" />
                <span className="font-medium">Proposal Review</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="lessons" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground py-3">
              <div className="flex items-center justify-center gap-2">
                <Lightbulb className="h-5 w-5" />
                <span className="font-medium">Lessons</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scope" className="mt-6">
            {project.scope ? (
              <Link href={`/dashboard/${params.projectId}/chat?tab=scope`} className="block transition-transform hover:scale-[1.02]">
                <Card className="h-full cursor-pointer hover:border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Current Scope
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{project.scope.content}</p>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Link href={`/dashboard/${params.projectId}/chat?tab=scope`} className="block">
                <Card className="cursor-pointer hover:border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Start Scope
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Click here to start writing your scope.</p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </TabsContent>

          <TabsContent value="proposal" className="mt-6">
            {project.proposal ? (
              <Link href={`/dashboard/${params.projectId}/chat?tab=proposal`} className="block transition-transform hover:scale-[1.02]">
                <Card className="h-full cursor-pointer hover:border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Current Proposal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{project.proposal.content}</p>
                  </CardContent>
                </Card>
              </Link>
            ) : (
              <Link href={`/dashboard/${params.projectId}/chat?tab=proposal`} className="block">
                <Card className="cursor-pointer hover:border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Review Proposal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Click here to start reviewing your proposal.</p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </TabsContent>

          <TabsContent value="lessons" className="mt-6">
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold">Lessons Learned</h2>
                  <p className="text-muted-foreground">
                    Document and track lessons learned throughout the project lifecycle
                  </p>
                </div>
                <LessonForm projectId={params.projectId} />
              </div>

              <div className="grid gap-6">
                {lessons.length > 0 ? (
                  lessons.map((lesson: LessonLearned) => (
                    <Card key={lesson.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            {lesson.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <EditLessonForm 
                              projectId={params.projectId} 
                              lesson={lesson}
                              trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <DeleteLessonButton 
                              projectId={params.projectId}
                              lessonId={lesson.id}
                            />
                          </div>
                        </div>
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
          </TabsContent>
        </Tabs>
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
