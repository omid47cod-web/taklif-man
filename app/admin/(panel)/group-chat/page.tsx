'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'

type GroupMessage = {
  id: string
  student_phone: string | null
  student_name: string | null
  message: string | null
  content?: string | null
  created_at: string
}

const GOLD = '#c9a96a'
const BLACK = '#050505'
const MUTED = '#a3a3a3'

export default function AdminGroupChatPage() {
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [authorized, setAuthorized] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const loadMessages = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('group_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300)

    if (queryError) {
      setError('دریافت پیام‌ها با مشکل مواجه شد.')
      return
    }

    setMessages((data ?? []) as GroupMessage[])
    setError('')
  }, [supabase])

  useEffect(() => {
    let active = true

    async function initialize() {
      setLoading(true)
      setError('')

      const { data, error: authError } = await supabase.auth.getUser()

      if (!active) return

      if (authError || !data.user) {
        setError('برای دسترسی به این بخش باید وارد حساب مدیریت شوید.')
        setLoading(false)
        return
      }

      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!active) return

      if (
        adminError ||
        !admin ||
        !['manager', 'owner'].includes(admin.role)
      ) {
        setError('شما اجازه دسترسی به مدیریت چت گروهی را ندارید.')
        setLoading(false)
        return
      }

      setAuthorized(true)

      const { data: messageData, error: messageError } = await supabase
        .from('group_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300)

      if (!active) return

      if (messageError) {
        setError('دریافت پیام‌ها با مشکل مواجه شد.')
      } else {
        setMessages((messageData ?? []) as GroupMessage[])
      }

      setLoading(false)
    }

    void initialize()

    const channel = supabase
      .channel('admin-group-chat-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_messages',
        },
        () => {
          if (active) void loadMessages()
        },
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [supabase, loadMessages])

  async function deleteMessage(message: GroupMessage) {
    if (!authorized || deletingId) return

    const confirmed = window.confirm(
      'آیا مطمئن هستید که می‌خواهید این پیام را حذف کنید؟',
    )

    if (!confirmed) return

    setDeletingId(message.id)
    setNotice('')
    setError('')

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser()

      if (authError || !authData.user) {
        setError('نشست مدیریت معتبر نیست. دوباره وارد شوید.')
        return
      }

      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('id', authData.user.id)
        .maybeSingle()

      if (
        adminError ||
        !admin ||
        !['manager', 'owner'].includes(admin.role)
      ) {
        setError('اجازه حذف پیام را ندارید.')
        return
      }

      const { data, error: deleteError } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', message.id)
        .select('id')
        .maybeSingle()

      if (deleteError) {
        setError('حذف پیام انجام نشد. تنظیمات دسترسی پایگاه داده را بررسی کنید.')
        return
      }

      if (!data) {
        setError('پیام حذف نشد؛ ممکن است دسترسی حذف در پایگاه داده محدود باشد.')
        return
      }

      setMessages((current) =>
        current.filter((item) => item.id !== message.id),
      )
      setNotice('پیام با موفقیت حذف شد.')
    } catch {
      setError('خطایی هنگام حذف پیام رخ داد.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleString('fa-IR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  const getMessageText = (message: GroupMessage) =>
    message.message ?? message.content ?? ''

  const uniqueStudents = new Set(
    messages.map((message) => message.student_phone).filter(Boolean),
  ).size

  const goldButtonStyle = {
    background: GOLD,
    color: BLACK,
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen px-4 py-6 text-white sm:px-6 sm:py-8"
      style={{ background: BLACK }}
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div
              className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
              style={{
                borderColor: `${GOLD}66`,
                color: GOLD,
                background: '#111111',
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: GOLD }}
              />
              مدیریت پیام‌ها
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              چت گروهی <span style={{ color: GOLD }}>دانش‌آموزان</span>
            </h1>

            <p className="mt-2 text-sm leading-7" style={{ color: MUTED }}>
              مشاهده و مدیریت پیام‌های ارسال‌شده در گفت‌وگوی گروهی
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadMessages()}
            disabled={loading}
            className="rounded-xl border px-4 py-3 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-50"
            style={{ borderColor: `${GOLD}80`, color: GOLD }}
          >
            ↻ به‌روزرسانی پیام‌ها
          </button>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            className="rounded-2xl border p-5"
            style={{ background: '#101010', borderColor: '#292929' }}
          >
            <p className="text-sm" style={{ color: MUTED }}>
              تعداد پیام‌های بارگذاری‌شده
            </p>
            <p className="mt-3 text-3xl font-bold" style={{ color: GOLD }}>
              {messages.length.toLocaleString('fa-IR')}
            </p>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{ background: '#101010', borderColor: '#292929' }}
          >
            <p className="text-sm" style={{ color: MUTED }}>
              دانش‌آموزان پیام‌دهنده
            </p>
            <p className="mt-3 text-3xl font-bold" style={{ color: GOLD }}>
              {uniqueStudents.toLocaleString('fa-IR')}
            </p>
          </div>

          <div
            className="rounded-2xl border p-5"
            style={{ background: '#101010', borderColor: '#292929' }}
          >
            <p className="text-sm" style={{ color: MUTED }}>
              وضعیت دسترسی
            </p>
            <p className="mt-3 text-lg font-bold">
              {authorized ? (
                <span style={{ color: GOLD }}>مدیریت فعال</span>
              ) : (
                <span className="text-white/60">در حال بررسی</span>
              )}
            </p>
          </div>
        </section>

        {notice && (
          <div
            role="status"
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              background: '#101810',
              borderColor: '#355b3a',
              color: '#b8e5bd',
            }}
          >
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border px-4 py-3 text-sm leading-7"
            style={{
              background: '#1a1010',
              borderColor: '#713333',
              color: '#ffb4b4',
            }}
          >
            {error}
          </div>
        )}

        <section
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: '#303030', background: '#0c0c0c' }}
        >
          <div
            className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-6"
            style={{ borderColor: '#292929' }}
          >
            <div>
              <h2 className="font-bold">فهرست پیام‌ها</h2>
              <p className="mt-1 text-xs" style={{ color: MUTED }}>
                جدیدترین پیام‌ها در ابتدای فهرست قرار دارند.
              </p>
            </div>

            <span
              className="rounded-lg px-3 py-2 text-xs font-semibold"
              style={{ background: '#201b11', color: GOLD }}
            >
              حداکثر ۳۰۰ پیام اخیر
            </span>
          </div>

          {loading ? (
            <div className="px-4 py-16 text-center">
              <div
                className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: GOLD, borderTopColor: 'transparent' }}
              />
              <p className="text-sm" style={{ color: MUTED }}>
                در حال دریافت پیام‌ها...
              </p>
            </div>
          ) : !error && messages.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="mb-3 text-4xl" style={{ color: GOLD }}>
                ◇
              </div>
              <p className="font-semibold">هنوز پیامی ثبت نشده است.</p>
              <p className="mt-2 text-sm" style={{ color: MUTED }}>
                پیام‌های جدید پس از ارسال در این قسمت نمایش داده می‌شوند.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className="p-4 transition hover:bg-white/[0.025] sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="font-bold"
                          style={{ color: GOLD }}
                        >
                          {message.student_name?.trim() || 'دانش‌آموز'}
                        </span>

                        {message.student_phone && (
                          <span
                            dir="ltr"
                            className="text-xs"
                            style={{ color: MUTED }}
                          >
                            {message.student_phone}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs" style={{ color: MUTED }}>
                        {formatDate(message.created_at)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void deleteMessage(message)}
                      disabled={deletingId !== null || !authorized}
                      className="shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{
                        borderColor: '#713333',
                        color: '#ff9999',
                      }}
                    >
                      {deletingId === message.id
                        ? 'در حال حذف...'
                        : 'حذف پیام'}
                    </button>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-8 text-white/90">
                    {getMessageText(message) || 'این پیام متن قابل نمایشی ندارد.'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="pb-4 text-center text-xs" style={{ color: '#777' }}>
          تکلیف من · پنل مدیریت چت گروهی
        </footer>
      </div>

      <style jsx>{`
        button {
          -webkit-tap-highlight-color: transparent;
        }

        button:focus-visible {
          outline: 2px solid ${GOLD};
          outline-offset: 3px;
        }
      `}</style>
    </main>
  )
}

