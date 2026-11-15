
'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Student = {
  fullName: string
  phone: string
}

type Message = {
  id: string
  student_name: string
  student_phone: string
  message: string
  created_at: string
  author_name?: string | null
  body?: string | null
  author_student_id?: string | null
}

function ChatIcon({
  name,
  size = 22,
}: {
  name: 'back' | 'chat' | 'send' | 'info' | 'refresh' | 'delete'
  size?: number
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  switch (name) {
    case 'back':
      return <svg {...common}><path d="m15 5-7 7 7 7" /></svg>
    case 'chat':
      return (
        <svg {...common}>
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
          <path d="M8 12h8M8 8.5h5" />
        </svg>
      )
    case 'send':
      return (
        <svg {...common}>
          <path d="m21 3-7.2 18-3.9-7.9L2 9.2 21 3Z" />
          <path d="M21 3 9.9 13.1" />
        </svg>
      )
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M20 7v5h-5M4 17v-5h5" />
          <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" />
        </svg>
      )
    case 'delete':
      return (
        <svg {...common}>
          <path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 13h11l1-13M9 7V4h6v3" />
        </svg>
      )
  }
}

function formatMessageTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function GroupChatPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [student, setStudent] = useState<Student | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [isManagement, setIsManagement] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const savedStudent = localStorage.getItem('taklif-man-student')

    if (!savedStudent) {
      router.replace('/register')
      return
    }

    try {
      const parsed = JSON.parse(savedStudent)

      if (
        !parsed?.fullName ||
        typeof parsed.fullName !== 'string' ||
        typeof parsed.phone !== 'string' ||
        !/^09\d{9}$/.test(parsed.phone)
      ) {
        localStorage.removeItem('taklif-man-student')
        router.replace('/register')
        return
      }

      setStudent({
        fullName: parsed.fullName,
        phone: parsed.phone,
      })
    } catch {
      localStorage.removeItem('taklif-man-student')
      router.replace('/register')
    }
  }, [router])

  useEffect(() => {
    if (!student) return

    let active = true

    async function identifyUser() {
      const { data: studentRecord, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('phone', student!.phone)
        .maybeSingle()

      if (!active) return

      if (studentError) {
        console.error('Student lookup failed:', studentError)
        setError('بررسی اطلاعات دانش‌آموز ناموفق بود.')
      } else {
        setStudentId(studentRecord?.id ?? null)
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!active || !user) {
        if (active) setIsManagement(false)
        return
      }

      const { data: adminRecord, error: adminError } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('id', user.id)
        .eq('role', 'manager')
        .maybeSingle()

      if (!active) return

      if (adminError) {
        console.error('Admin verification failed:', adminError)
        setIsManagement(false)
      } else {
        setIsManagement(!!adminRecord)
      }
    }

    void identifyUser()

    return () => {
      active = false
    }
  }, [student, supabase])

  useEffect(() => {
    if (!student) return

    let active = true

    async function markMessagesRead() {
      try {
        const response = await fetch('/api/group-chat/read', {
          method: 'POST',
          cache: 'no-store',
        })

        if (!active) return

        if (!response.ok) {
          console.error(
            'GROUP CHAT MARK READ ERROR:',
            await response.text(),
          )
        }
      } catch (error) {
        console.error('GROUP CHAT MARK READ ERROR:', error)
      }
    }

    void markMessagesRead()

    return () => {
      active = false
    }
  }, [student])

  useEffect(() => {
    if (!student) return

    let active = true

    async function loadMessages() {
      setLoading(true)
      setError('')

      try {
        const { data, error: loadError } = await supabase
          .from('group_messages')
          .select(
            'id, student_name, student_phone, message, created_at, author_name, body, author_student_id',
          )
          .order('created_at', { ascending: true })

        if (!active) return

        if (loadError) {
          console.error('GROUP CHAT LOAD ERROR:', loadError)
          setError('دریافت پیام‌ها انجام نشد. اتصال و دسترسی را بررسی کنید.')
        } else {
          setMessages((data as Message[]) || [])
        }
      } catch (cause) {
        console.error('GROUP CHAT LOAD ERROR:', cause)
        if (active) setError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadMessages()

    const channel = supabase
      .channel('group-chat-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incoming = payload.new as Message
            if (!incoming?.id) return

            setMessages((current) => {
              if (current.some((item) => item.id === incoming.id)) {
                return current
              }

              return [...current, incoming].sort(
                (a, b) =>
                  new Date(a.created_at).getTime() -
                  new Date(b.created_at).getTime(),
              )
            })
          }

          if (payload.eventType === 'DELETE') {
            const deleted = payload.old as Partial<Message>

            if (deleted.id) {
              setMessages((current) =>
                current.filter((item) => item.id !== deleted.id),
              )
            }
          }
        },
      )
      .subscribe((status) => {
        console.log('GROUP CHAT REALTIME:', status)
      })

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [student, supabase, reloadKey])

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!student || sending) return

    const messageText = text.trim()
    if (!messageText) return

    if (messageText.length > 2000) {
      setError('پیام نمی‌تواند بیشتر از ۲۰۰۰ نویسه باشد.')
      return
    }

    setSending(true)
    setError('')

    try {
      let authorId = studentId

      if (!authorId) {
        const { data: studentRecord, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('phone', student.phone)
          .single()

        if (studentError || !studentRecord) {
          console.error('GROUP CHAT STUDENT LOOKUP ERROR:', studentError)
          setError('اطلاعات دانش‌آموز پیدا نشد. دوباره ثبت‌نام را بررسی کنید.')
          return
        }

        authorId = studentRecord.id
        setStudentId(authorId)
      }

      const { data, error: insertError } = await supabase
        .from('group_messages')
        .insert({
          author_student_id: authorId,
          author_name: student.fullName,
          body: messageText,
          student_name: student.fullName,
          student_phone: student.phone,
          message: messageText,
        })
        .select(
          'id, student_name, student_phone, message, created_at, author_name, body, author_student_id',
        )
        .single()

      if (insertError) {
        console.error('GROUP CHAT SEND ERROR:', insertError)
        setError('ارسال پیام انجام نشد. لطفاً دوباره تلاش کنید.')
        return
      }

      if (data) {
        setText('')
        setMessages((current) => {
          if (current.some((item) => item.id === data.id)) return current

          return [...current, data as Message].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          )
        })
      }
    } catch (cause) {
      console.error('GROUP CHAT SEND ERROR:', cause)
      setError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید.')
    } finally {
      setSending(false)
    }
  }

  async function deleteMessage(message: Message) {
    const isMine =
      !!studentId && message.author_student_id === studentId

    if (!isManagement && !isMine) {
      setError('فقط فرستنده پیام یا مدیریت می‌تواند آن را حذف کند.')
      return
    }

    const confirmed = window.confirm(
      isManagement && !isMine
        ? `پیام ${getMessageName(message)} حذف شود؟`
        : 'پیام خودت حذف شود؟',
    )

    if (!confirmed) return

    setDeletingId(message.id)
    setError('')

    let query = supabase
      .from('group_messages')
      .delete()
      .eq('id', message.id)

    if (!isManagement) {
      if (!studentId) {
        setError('شناسه دانش‌آموز مشخص نیست؛ صفحه را دوباره بارگذاری کن.')
        setDeletingId(null)
        return
      }

      query = query.eq('author_student_id', studentId)
    }

    const { error: deleteError } = await query

    if (deleteError) {
      console.error(
        'GROUP CHAT DELETE ERROR:',
        JSON.stringify(deleteError, Object.getOwnPropertyNames(deleteError), 2)
      )

      setError(`حذف پیام انجام نشد: ${deleteError.message}`)
      setDeletingId(null)
      return
    }

    setMessages((current) =>
      current.filter((item) => item.id !== message.id),
    )
    setDeletingId(null)
  }

  function getMessageText(message: Message) {
    return message.message || message.body || ''
  }

  function getMessageName(message: Message) {
    return message.student_name || message.author_name || 'دانش‌آموز'
  }

  if (!student) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f3f7f8] text-[#173b50]"
      >
        <div className="flex items-center gap-3 text-sm text-[#71838b]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0d9488]/20 border-t-[#0d9488]" />
          در حال آماده‌سازی...
        </div>
      </main>
    )
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#f3f7f8] text-[#173b50]"
    >
      <div className="pointer-events-none fixed -right-32 top-0 h-72 w-72 rounded-full bg-[#0d9488]/[0.07] blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col border-x border-[#e5edef] bg-white/50">
        <header className="sticky top-0 z-20 border-b border-[#e5edef] bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e2ebed] bg-white text-[#526b75] transition hover:border-[#0d9488]/30 hover:bg-[#f1faf8] hover:text-[#0d9488]"
              aria-label="بازگشت"
            >
              <ChatIcon name="back" size={21} />
            </button>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#cce7e2] bg-[#eaf7f5] text-[#0d9488]">
              <ChatIcon name="chat" size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-base font-extrabold text-[#173b50] sm:text-lg">
                چت گروهی
              </h1>
              <p className="mt-1 text-xs text-[#84969c]">
                گفت‌وگوی دانش‌آموزان کلاس
              </p>
            </div>

            {isManagement && (
              <span className="rounded-full border border-[#cce7e2] bg-[#eff9f7] px-3 py-2 text-[11px] font-bold text-[#0d9488]">
                مدیریت
              </span>
            )}
          </div>
        </header>

        <section
          aria-label="پیام‌های گروه"
          className="flex-1 px-4 py-5 sm:px-6 sm:py-7"
        >
          {loading ? (
            <div className="flex min-h-[45vh] items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#0d9488]/20 border-t-[#0d9488]" />
                <p className="text-sm text-[#84969c]">
                  در حال دریافت پیام‌ها...
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-[45vh] items-center justify-center">
              <div className="w-full max-w-sm rounded-[28px] border border-[#e5edef] bg-white p-7 text-center shadow-[0_10px_35px_rgba(23,59,80,0.045)] sm:p-9">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#cce7e2] bg-[#eff9f7] text-[#0d9488]">
                  <ChatIcon name="chat" size={30} />
                </div>
                <h2 className="text-lg font-extrabold text-[#173b50]">
                  هنوز پیامی وجود ندارد
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#84969c]">
                  گفت‌وگو را با ارسال اولین پیام شروع کن.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isMine =
                  !!studentId && message.author_student_id === studentId
                const canDelete = isManagement || isMine

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isMine ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    <article
                      className={`max-w-[88%] rounded-[22px] px-4 py-3 shadow-[0_3px_12px_rgba(23,59,80,0.035)] sm:max-w-[78%] sm:px-5 ${
                        isMine
                          ? 'rounded-br-md border border-[#cce7e2] bg-[#eaf7f5] text-[#173b50]'
                          : 'rounded-bl-md border border-[#e5edef] bg-white text-[#173b50]'
                      }`}
                    >
                      {!isMine && (
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eaf7f5] text-xs font-bold text-[#0d9488]">
                            {getMessageName(message).trim().charAt(0) || '؟'}
                          </span>
                          <span className="text-xs font-bold text-[#0d9488]">
                            {getMessageName(message)}
                          </span>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap break-words text-sm leading-7">
                        {getMessageText(message)}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-[10px] tabular-nums text-[#91a0a5]">
                          {formatMessageTime(message.created_at)}
                        </span>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => void deleteMessage(message)}
                            disabled={deletingId === message.id}
                            title="حذف پیام"
                            aria-label="حذف پیام"
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-red-500/80 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          >
                            <ChatIcon name="delete" size={14} />
                            {deletingId === message.id
                              ? 'در حال حذف'
                              : 'حذف'}
                          </button>
                        )}
                      </div>
                    </article>
                  </div>
                )
              })}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-7 text-red-700"
            >
              <span className="mt-1 shrink-0 text-red-500">
                <ChatIcon name="info" size={18} />
              </span>
              <div className="min-w-0 flex-1">{error}</div>
              {!loading && (
                <button
                  type="button"
                  onClick={() => setReloadKey((value) => value + 1)}
                  className="shrink-0 rounded-lg p-1 text-red-600/80 transition hover:bg-red-100"
                  aria-label="تلاش دوباره"
                  title="تلاش دوباره"
                >
                  <ChatIcon name="refresh" size={18} />
                </button>
              )}
            </div>
          )}
        </section>

        <footer className="sticky bottom-0 z-20 border-t border-[#e5edef] bg-white/95 px-4 pb-3 pt-4 backdrop-blur-xl sm:px-6 sm:pb-5">
          <form onSubmit={sendMessage}>
            <div className="flex items-end gap-2 rounded-[22px] border border-[#dfe9eb] bg-[#f8fafb] p-2 transition focus-within:border-[#0d9488]/50 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(13,148,136,0.07)]">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="پیامت را بنویس..."
                rows={1}
                maxLength={2000}
                disabled={sending}
                aria-label="متن پیام"
                className="max-h-36 min-h-11 min-w-0 flex-1 resize-y bg-transparent px-3 py-3 text-sm leading-6 text-[#173b50] outline-none placeholder:text-[#9aabad] disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#173b50] text-white transition hover:bg-[#0d9488] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="ارسال پیام"
              >
                {sending ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                ) : (
                  <ChatIcon name="send" size={20} />
                )}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 px-1">
              <p className="text-[10px] leading-5 text-[#91a0a5]">
                پیام‌ها برای اعضای کلاس قابل مشاهده‌اند.
              </p>
              <span className="shrink-0 text-[10px] tabular-nums text-[#91a0a5]">
                {text.length}/2000
              </span>
            </div>
          </form>
        </footer>
      </div>
    </main>
  )
}
