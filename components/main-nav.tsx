import Link from 'next/link'
import { HardHat } from 'lucide-react'

export function MainNav() {
  return (
    <div className="flex items-center space-x-4 sm:space-x-6">
      <Link href="/dashboard" className="flex items-center space-x-2">
        <HardHat className="h-6 w-6" />
        <span className="font-bold hidden sm:inline">Construction Copilot</span>
        <span className="font-bold sm:hidden">CC</span>
      </Link>
      <nav className="flex items-center space-x-4">
        <Link
          href="/dashboard"
          className="text-sm font-medium transition-colors hover:text-primary"
        >
          Projects
        </Link>
      </nav>
    </div>
  )
}
