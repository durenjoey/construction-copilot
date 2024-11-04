import Link from 'next/link'
import { HardHat } from 'lucide-react'

export function MainNav() {
  return (
    <div className="flex items-center space-x-6">
      <Link href="/dashboard" className="flex items-center space-x-2">
        <HardHat className="h-6 w-6" />
        <span className="font-bold">Construction Copilot</span>
      </Link>
      <nav className="flex items-center space-x-4">
        <Link
          href="/dashboard"
          className="text-sm font-medium transition-colors hover:text-primary"
        >
          Projects
        </Link>
        <Link
          href="/dashboard/lessons"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Lessons Learned
        </Link>
      </nav>
    </div>
  )
}