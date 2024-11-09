import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FileUpload } from '@/components/file-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, FileText, ClipboardList, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { adminDb } from '@/lib/firebase-admin'
import { ProjectStatus } from '@/lib/types'

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  try {
    const projectDoc = await adminDb.collection('projects').doc(params.projectId).get()
    const projectData = projectDoc.data()

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

    const project = projectData as ProjectStatus

    return (
      <div className="container py-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{project.name || 'Untitled Project'}</h1>
          <div className="flex gap-2">
            <Link href={`/dashboard/${params.projectId}/chat?tab=scope`}>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Scope Chat
              </Button>
            </Link>
            <Link href={`/dashboard/${params.projectId}/chat?tab=proposal`}>
              <Button variant="outline">
                <ClipboardList className="mr-2 h-4 w-4" />
                Proposal Chat
              </Button>
            </Link>
            <Link href={`/dashboard/${params.projectId}/chat?tab=lesson`}>
              <Button variant="outline">
                <Lightbulb className="mr-2 h-4 w-4" />
                Lessons Chat
              </Button>
            </Link>
            <Link href={`/dashboard/${params.projectId}/chat`}>
              <Button>
                <MessageSquare className="mr-2 h-4 w-4" />
                General Chat
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {project.scope && (
            <Card>
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
          )}

          {project.proposal && (
            <Card>
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
          )}

          {project.lessonsLearned && project.lessonsLearned.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Lessons Learned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {project.lessonsLearned.map((lesson) => (
                    <div key={lesson.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium capitalize">{lesson.category}</span>
                        <span className="text-sm text-muted-foreground capitalize">
                          {lesson.impact} Impact
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{lesson.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4 md:col-span-2">
            <h2 className="text-xl font-semibold">Upload Documents</h2>
            <FileUpload />
          </div>
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
