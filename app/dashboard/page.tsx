import { ProjectList } from 'components/project-list'
import { NewProjectButton } from 'components/new-project-button'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="container flex-1 py-4 sm:py-8 space-y-4 sm:space-y-8 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Projects</h1>
          <NewProjectButton />
        </div>
        <ProjectList />
      </div>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center space-y-4 md:h-16 md:flex-row md:justify-between md:space-y-0 px-4 sm:px-6">
          <div className="flex flex-col items-center md:items-start space-y-2 md:space-y-1">
            <p className="text-sm text-muted-foreground">
              © 2024 Construction Copilot. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              A Service Disabled Veteran Owned Small Business
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
