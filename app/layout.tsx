import type { Metadata, Viewport } from 'next'
import { Vazirmatn } from 'next/font/google'
import './globals.css'
import AppBackHandler from '@/components/AppBackHandler'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-vazirmatn',
})

export const metadata: Metadata = {
  title: {
    default: 'تکلیف من',
    template: '%s | تکلیف من',
  },
  description:
    'دسترسی سریع به تکالیف، درخواست تکالیف و ارتباط با مدیریت کلاس',
  applicationName: 'تکلیف من',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'تکلیف من',
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#5b4050',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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