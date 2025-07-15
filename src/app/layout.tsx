import './globals.css'

export const metadata = {
  title: 'Ultimate Crypto Trading Bot',
  description: 'Automated crypto day trading with GPU acceleration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
