import { ProjectList } from '@/components/project-list'
import { NewProjectButton } from '@/components/new-project-button'

export default function DashboardPage() {
  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Projects</h1>
        <NewProjectButton />
      </div>
      <ProjectList />
    </div>
  )
}
