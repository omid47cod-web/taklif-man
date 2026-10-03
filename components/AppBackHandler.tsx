'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function AppBackHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/') {
      return
    }

    const handlePopState = () => {
      if (pathname.startsWith('/homework/') && pathname !== '/homework') {
        router.push('/homework')
        return
      }

      if (pathname === '/homework') {
        router.push('/')
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [pathname, router])

  return null
}