import { ProjectList } from 'components/project-list'
import { NewProjectButton } from 'components/new-project-button'

export default function DashboardPage() {
  return (
    <div className="container py-4 sm:py-8 space-y-4 sm:space-y-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Projects</h1>
        <NewProjectButton />
      </div>
      <ProjectList />
    </div>
  )
}
