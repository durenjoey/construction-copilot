import { Button } from 'components/ui/button'
import { HardHat } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-3xl text-center space-y-6 sm:space-y-8">
        <div className="flex justify-center">
          <div className="p-3 bg-primary rounded-2xl">
            <HardHat className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Construction Copilot</h1>
        <p className="text-lg sm:text-xl text-muted-foreground px-4 sm:px-0">
          AI-powered construction project management that streamlines your workflow
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/auth/signin">
            <Button size="lg" className="text-base sm:text-lg px-6 py-3">Get Started</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
