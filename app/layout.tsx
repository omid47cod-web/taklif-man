import type { Metadata } from 'next'
import { Vazirmatn } from 'next/font/google'
import './globals.css'
import AppBackHandler from '@/components/AppBackHandler'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-vazirmatn',
})

export const metadata: Metadata = {
  title: 'تکلیف من',
  description: 'دسترسی سریع به تکالیف کلاس',
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazirmatn.variable}>
        <AppBackHandler />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}