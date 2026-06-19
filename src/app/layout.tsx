import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import '@/styles/globals.css'
import { Toaster } from 'sonner'
import { NavigationProgress } from '@/components/shared/NavigationProgress'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'CareerOS Partner Intelligence',
    template: '%s | CareerOS',
  },
  description: 'AI-powered platform for college partnerships, placements & training.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
