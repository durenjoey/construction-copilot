import Link from 'next/link'
import { Button } from 'components/ui/button'

export default function NotFound() {
  return (
    <div className="container flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4 text-center">
        <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
        <p className="text-muted-foreground">The page you are looking for does not exist.</p>
        <Button asChild>
          <Link href="/dashboard">
            Return to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  )
}
