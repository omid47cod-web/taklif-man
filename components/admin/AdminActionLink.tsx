
'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase'

type Props = {
  href: string
  className?: string
  children: ReactNode
}

const sectionConfig: Record<string, { table: string; filter?: string }> = {
  '/admin/task-requests': {
    table: 'task_requests',
  },
  '/admin/support': {
    table: 'support_messages',
    filter: 'support',
  },
  '/admin/group-chat': {
    table: 'group_messages',
  },
}

const storageKey = (href: string) => `taklif-man-v3-admin-seen:${href}`

export default function AdminActionLink({
  href,
  className = '',
  children,
}: Props) {
  const config = sectionConfig[href]
  const [unread, setUnread] = useState(0)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    if (!config) return

    const key = storageKey(href)
    const seen = localStorage.getItem(key)

    // اگر این بخش بازدید شده، بررسی دوره‌ای نباید اعلان قبلی را برگرداند.
    if (seen === 'opened') {
      setUnread(0)
      setReady(true)
      return
    }

    const supabase = createClient()
    let query = supabase
      .from(config.table)
      .select('id', { count: 'exact', head: true })

    if (config.filter === 'support') {
      query = query.eq('sender_type', 'student')
    }

    const { count, error } = await query

    if (!error) {
      setUnread(count ?? 0)
    }

    setReady(true)
  }, [config, href])

  useEffect(() => {
    if (!config) return

    let active = true

    const run = async () => {
      if (active) await refresh()
    }

    void run()

    const timer = window.setInterval(() => {
      if (active) void run()
    }, 15000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [config, refresh])

  function markSeen() {
    if (!config) return

    localStorage.setItem(storageKey(href), 'opened')
    setUnread(0)
    setReady(true)
  }

  return (
    <Link
      href={href}
      onClick={markSeen}
      className={`${className} relative`}
    >
      {children}

      {config && ready && unread > 0 && (
        <span
          aria-label={`${unread} مورد جدید`}
          title={`${unread} مورد جدید`}
          className="absolute right-3 top-3 z-10 flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1.5 text-xs font-bold text-white shadow-md"
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}
