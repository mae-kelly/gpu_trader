import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorLogger } from '@/components/error-logger'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'GPU Swarm Trader',
  description: 'Real-time crypto momentum scanner powered by GPU clusters',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-gradient-to-br from-background via-background to-muted/20`}>
        <ErrorLogger />
        <div className="relative min-h-screen">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
