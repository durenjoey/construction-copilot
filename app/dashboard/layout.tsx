import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MainNav } from '@/components/main-nav'
import { UserNav } from '@/components/user-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Redirect to signin if no session exists
  if (!session?.user) {
    const searchParams = new URLSearchParams({
      callbackUrl: '/dashboard',
    })
    redirect(`/auth/signin?${searchParams.toString()}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <MainNav />
          {session.user && <UserNav user={session.user} />}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
