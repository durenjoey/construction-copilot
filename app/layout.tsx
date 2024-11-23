import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from '../components/providers'
import { Toaster } from '../components/ui/toaster'
import { getServerSession } from 'next-auth'
import { authOptions } from '../lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Construction Copilot - AI-Powered Construction Management',
  description: 'Streamline your construction project management with AI assistance',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  console.log('Root layout session:', session ? 'authenticated' : 'unauthenticated')

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
