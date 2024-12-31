'use client'

import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { useEffect, useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider 
        refetchInterval={5 * 60} // Refetch session every 5 minutes
        refetchOnWindowFocus={true}
      >
        {children}
      </SessionProvider>
    </ThemeProvider>
  )
}
