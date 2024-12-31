'use client';

import { MainNav } from 'components/main-nav'
import { UserNav } from 'components/user-nav'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  useEffect(() => {
    // Redirect to signin if no session exists
    if (status === 'unauthenticated') {
      const searchParams = new URLSearchParams({
        callbackUrl: '/dashboard',
      })
      redirect(`/auth/signin?${searchParams.toString()}`)
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          <MainNav />
          {session?.user && <UserNav user={session.user} />}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
