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
      /*
       * تکالیف جاری
       */
      if (
        pathname.startsWith('/homework/') &&
        pathname !== '/homework'
      ) {
        router.push('/homework')
        return
      }

      if (pathname === '/homework') {
        router.push('/')
        return
      }

      /*
       * تکالیف جلسه بعد
       */
      if (
        pathname.startsWith('/tomorrow-homework/') &&
        pathname !== '/tomorrow-homework'
      ) {
        router.push('/tomorrow-homework')
        return
      }

      if (pathname === '/tomorrow-homework') {
        router.push('/')
        return
      }

      /*
       * درخواست تکالیف
       */
      if (
        pathname.startsWith('/task-requests/') &&
        pathname !== '/task-requests'
      ) {
        router.push('/task-requests')
        return
      }

      if (pathname === '/task-requests') {
        router.push('/')
        return
      }

      /*
       * چت گروهی
       */
      if (pathname === '/group-chat') {
        router.push('/')
        return
      }

      /*
       * ارتباط آنلاین با مدیریت
       */
      if (pathname === '/support') {
        router.push('/')
      }
    }

    window.addEventListener(
      'popstate',
      handlePopState
    )

    return () => {
      window.removeEventListener(
        'popstate',
        handlePopState
      )
    }
  }, [pathname, router])

  return null
}