import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Navbar } from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'CampusDeals - Student Deals & Local Discovery',
  description: 'Discover exclusive deals and discounts from local businesses near UMBC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}

