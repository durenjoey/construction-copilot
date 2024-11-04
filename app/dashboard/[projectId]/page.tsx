import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FileUpload } from '@/components/file-upload'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Project Details</h1>
        <Link href={`/dashboard/${params.projectId}/chat`}>
          <Button>
            <MessageSquare className="mr-2 h-4 w-4" />
            Open Chat
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Upload Documents</h2>
          <FileUpload
            onUpload={async () => {}}
            isUploading={false}
          />
        </div>
      </div>
    </div>
  )
}