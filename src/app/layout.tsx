import type { Metadata } from 'next'
import './globals.css'
import InAppBrowserBanner from '@/components/ui/InAppBrowserBanner'

export const metadata: Metadata = {
  title: 'Photo Gallery',
  description: 'Photo Automation Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-white text-gray-900 min-h-screen">
        <InAppBrowserBanner />
        {children}
      </body>
    </html>
  )
}
