
'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

type Student = {
  fullName: string
  phone: string
}

type MenuIconName = 'check' | 'clock' | 'plus' | 'chat' | 'message'

const menuItems: {
  href: string
  title: string
  description: string
  icon: MenuIconName
}[] = [
  {
    href: '/homework',
    title: 'تکالیف جاری',
    description: 'مشاهده تکالیفی که در حال حاضر باید انجام شوند',
    icon: 'check',
  },
  {
    href: '/tomorrow-homework',
    title: 'تکالیف جلسه بعد',
    description: 'تکالیفی که برای جلسه بعد در نظر گرفته شده‌اند',
    icon: 'clock',
  },
  {
    href: '/task-requests',
    title: 'درخواست تکالیف',
    description: 'اگر تکلیفی گفته شده اما در سامانه نیست، درخواست بده',
    icon: 'plus',
  },
  {
    href: '/group-chat',
    title: 'چت گروهی',
    description: 'گفت‌وگو با همکلاسی‌ها در فضای مشترک کلاس',
    icon: 'chat',
  },
  {
    href: '/support',
    title: 'ارتباط با مدیریت',
    description: 'ارسال پیام خصوصی و ارتباط مستقیم با مدیریت',
    icon: 'message',
  },
]

function MenuIcon({ name }: { name: MenuIconName }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  switch (name) {
    case 'check':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      )

    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )

    case 'plus':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      )

    case 'chat':
      return (
        <svg {...common}>
          <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />
          <path d="M8 12h.01M12 12h.01M16 12h.01" />
        </svg>
      )

    case 'message':
      return (
        <svg {...common}>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          <path d="M8 9h8M8 13h5" />
        </svg>
      )

    default:
      return null
  }
}

export default function HomePage() {
  const [student, setStudent] = useState<Student | null>(null)
  const [hasAdminReply, setHasAdminReply] = useState(false)
  const [hasUnreadTaskRequests, setHasUnreadTaskRequests] = useState(false)
  const [hasUnreadGroupMessages, setHasUnreadGroupMessages] = useState(false)

  const checkAdminReply = useCallback(async (currentStudent: Student) => {
    try {
      const supabase = createClient()

      const { data: studentRow, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('phone', currentStudent.phone)
        .maybeSingle()

      if (studentError || !studentRow) {
        setHasAdminReply(false)
        return
      }

      const { data: conversation, error: conversationError } = await supabase
        .from('support_conversations')
        .select('id')
        .eq('student_id', studentRow.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (conversationError || !conversation) {
        setHasAdminReply(false)
        return
      }

      const { count, error: messagesError } = await supabase
        .from('support_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conversation.id)
        .eq('sender_type', 'management')
        .is('read_at', null)

      if (messagesError) {
        console.error('CHECK ADMIN REPLY ERROR:', messagesError.message)
        return
      }

      setHasAdminReply((count ?? 0) > 0)
    } catch (error) {
      console.error('CHECK ADMIN REPLY ERROR:', error)
    }
  }, [])

  const checkOtherUnreadMessages = useCallback(async () => {
    try {
      const [taskResponse, groupResponse] = await Promise.all([
        fetch('/api/task-requests/unread', { cache: 'no-store' }),
        fetch('/api/group-chat/unread', { cache: 'no-store' }),
      ])

      if (taskResponse.ok) {
        const taskData = await taskResponse.json()
        setHasUnreadTaskRequests(taskData.unread === true)
      }

      if (groupResponse.ok) {
        const groupData = await groupResponse.json()
        setHasUnreadGroupMessages(groupData.unread === true)
      }
    } catch (error) {
      console.error('UNREAD NOTIFICATIONS ERROR:', error)
    }
  }, [])

  useEffect(() => {
    try {
      const savedStudent = localStorage.getItem('taklif-man-student')

      if (!savedStudent) return

      const parsed = JSON.parse(savedStudent) as Student

      if (
        typeof parsed.fullName === 'string' &&
        typeof parsed.phone === 'string' &&
        /^09\d{9}$/.test(parsed.phone)
      ) {
        setStudent(parsed)
      } else {
        localStorage.removeItem('taklif-man-student')
      }
    } catch {
      localStorage.removeItem('taklif-man-student')
    }
  }, [])

  useEffect(() => {
    if (!student) {
      setHasAdminReply(false)
      return
    }

    void checkAdminReply(student)

    const intervalId = window.setInterval(() => {
      void checkAdminReply(student)
    }, 15000)

    return () => window.clearInterval(intervalId)
  }, [student, checkAdminReply])

  useEffect(() => {
    void checkOtherUnreadMessages()

    const intervalId = window.setInterval(() => {
      void checkOtherUnreadMessages()
    }, 15000)

    return () => window.clearInterval(intervalId)
  }, [checkOtherUnreadMessages])

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-[#050505] text-white"
    >
      <div className="relative min-h-screen">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#c9a96a]/10 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-white/[0.04] blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.045),transparent_42%)]" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8 sm:py-10">
          <header className="mb-10">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#c9a96a]/25 bg-[#c9a96a]/10 text-lg text-[#c9a96a] shadow-[0_0_30px_rgba(201,169,106,0.08)]">
                  ت
                </div>

                <div>
                  <p className="text-[11px] font-medium tracking-[0.25em] text-white/35">
                    TAKLIF MAN
                  </p>
                  <p className="text-sm font-medium text-white/75">
                    سامانه تکالیف کلاس
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-2xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9a96a]/20 bg-[#c9a96a]/[0.07] px-3 py-1.5 text-[11px] font-medium text-[#c9a96a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c9a96a]" />
                کلاس شما، همیشه در دسترس
              </span>

              <h1 className="text-4xl font-bold leading-[1.25] tracking-tight text-white sm:text-5xl">
                {student ? (
                  <>
                    سلام،{' '}
                    <span className="text-[#c9a96a]">
                      {student.fullName.split(' ')[0]}
                    </span>
                    <br />
                    امروز چه کاری داری؟
                  </>
                ) : (
                  <>
                    همه چیز برای
                    <br />
                    <span className="text-[#c9a96a]">کلاس شما</span>
                  </>
                )}
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-[15px]">
                این اپلیکیشن جهت یادآوری و دسترسی سریع‌تر به تکالیف گفته شده
                توسط معلمین طراحی شده.
              </p>
            </div>
          </header>

          <section className="flex-1">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-white/30">
                  دسترسی سریع
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white/90">
                  چه کاری می‌خواهی انجام دهی؟
                </h2>
              </div>

              <span className="text-xs text-white/20">
                {menuItems.length} بخش
              </span>
            </div>

            <div className="grid gap-3">
              {menuItems.map((item) => {
                const showUnreadDot =
                  (item.href === '/task-requests' && hasUnreadTaskRequests) ||
                  (item.href === '/group-chat' && hasUnreadGroupMessages) ||
                  (item.href === '/support' && hasAdminReply)

                const unreadLabel =
                  item.href === '/task-requests'
                    ? 'پاسخ خوانده‌نشده'
                    : item.href === '/group-chat'
                      ? 'پیام خوانده‌نشده'
                      : 'پاسخ جدید مدیریت'

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c9a96a]/30 hover:bg-white/[0.055] hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)] active:scale-[0.99]"
                  >
                    <div className="absolute inset-y-0 right-0 w-1 bg-[#c9a96a] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="flex items-center gap-4">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-[#c9a96a] transition-colors group-hover:border-[#c9a96a]/20 group-hover:bg-[#c9a96a]/10">
                        <MenuIcon name={item.icon} />

                        {showUnreadDot && (
                          <span
                            className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-[#050505] bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.65)]"
                            aria-label={unreadLabel}
                            title={unreadLabel}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-white/90">
                            {item.title}
                          </h3>

                          {showUnreadDot && (
                            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">
                              پیام جدید
                            </span>
                          )}
                        </div>

                        <p className="text-xs leading-6 text-white/35">
                          {item.description}
                        </p>
                      </div>

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.07] text-sm text-white/25 transition-all group-hover:-translate-x-1 group-hover:border-[#c9a96a]/20 group-hover:text-[#c9a96a]">
                        ←
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>

          <footer className="mt-12 flex items-center justify-between border-t border-white/[0.06] pt-5 text-[11px] text-white/20">
            <span>تکلیف من</span>

            <div className="flex items-center gap-2">
              <span>طراحی شده توسط</span>
              <span className="text-white/40">امید اوقانی</span>
            </div>
          </footer>
        </div>
      </div>
    </main>
  )
}
