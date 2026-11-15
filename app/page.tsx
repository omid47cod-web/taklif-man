
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
  number: string
}[] = [
  {
    href: '/homework',
    title: 'تکالیف جاری',
    description: 'مشاهده تکالیفی که در حال حاضر باید انجام شوند',
    icon: 'check',
    number: '۰۱',
  },
  {
    href: '/tomorrow-homework',
    title: 'تکالیف جلسه بعد',
    description: 'تکالیفی که برای جلسه بعد در نظر گرفته شده‌اند',
    icon: 'clock',
    number: '۰۲',
  },
  {
    href: '/task-requests',
    title: 'درخواست تکالیف',
    description: 'اگر تکلیفی گفته شده و ننوشتی، درخواست بده',
    icon: 'plus',
    number: '۰۳',
  },
  {
    href: '/group-chat',
    title: 'چت گروهی',
    description: 'گفت‌وگو با همکلاسی‌ها در فضای مشترک کلاس',
    icon: 'chat',
    number: '۰۴',
  },
  {
    href: '/support',
    title: 'ارتباط با مدیریت',
    description: 'ارسال پیام خصوصی و ارتباط مستقیم با مدیریت',
    icon: 'message',
    number: '۰۵',
  },
]

function MenuIcon({ name }: { name: MenuIconName }) {
  const common = {
    width: 25,
    height: 25,
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
      className="relative min-h-screen overflow-hidden bg-[#f3f7f8] text-[#172f40]"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-40 h-[430px] w-[430px] rounded-full bg-[#0d9488]/[0.07]" />
        <div className="absolute -left-40 top-[430px] h-[380px] w-[380px] rounded-full bg-[#193b50]/[0.045]" />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-white/80 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-7 sm:py-8 lg:px-10">

        {/* Header */}
        <header className="mb-7 flex items-center justify-between rounded-[25px] border border-white bg-white/85 px-4 py-4 shadow-[0_8px_35px_rgba(27,54,68,0.045)] sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-[#173b50] text-xl font-black text-white shadow-[0_6px_16px_rgba(23,59,80,0.16)]">
              ت
            </div>

            <div>
              <p className="text-[10px] font-bold tracking-[0.22em] text-[#0d9488]">
                TAKLIF MAN
              </p>
              <p className="mt-1 text-sm font-bold text-[#19384a]">
                سامانه تکالیف کلاس
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-[#d8eeea] bg-[#f0faf8] px-3 py-2 sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#0d9488]" />
            <span className="text-[11px] font-semibold text-[#327c74]">
              کلاس شما، همیشه در دسترس
            </span>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f2f6f7] text-[#597383] sm:hidden">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </div>
        </header>

        {/* Welcome section */}
        <section className="relative mb-8 overflow-hidden rounded-[30px] bg-[#173b50] px-6 py-8 text-white shadow-[0_18px_45px_rgba(23,59,80,0.12)] sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute -left-12 -top-24 h-64 w-64 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -left-2 -top-14 h-44 w-44 rounded-full border border-white/[0.07]" />
          <div className="pointer-events-none absolute -bottom-24 right-[45%] h-52 w-52 rounded-full bg-[#0d9488]/15 blur-2xl" />

          <div className="relative max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-[#57d3bd]" />
              <span className="text-[11px] font-medium text-white/80">
                کلاس شما، همیشه در دسترس
              </span>
            </div>

            <h1 className="text-[30px] font-black leading-[1.55] tracking-tight sm:text-[39px] sm:leading-[1.45]">
              {student ? (
                <>
                  سلام،{' '}
                  <span className="text-[#65d5c3]">
                    {student.fullName.split(' ')[0]}
                  </span>
                  <br />
                  امروز چه کاری داری؟
                </>
              ) : (
                <>
                  همه چیز برای
                  <br />
                  <span className="text-[#65d5c3]">کلاس شما</span>
                </>
              )}
            </h1>

            <p className="mt-4 max-w-xl text-[12px] leading-8 text-white/65 sm:text-sm">
              این اپلیکیشن جهت یادآوری و دسترسی سریع‌تر به تکالیف گفته شده
              توسط معلمین طراحی شده است.
            </p>

            <div className="mt-7 flex items-center gap-2 text-[11px] font-medium text-white/55">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3v18M3 12h18" />
              </svg>
              <span>همه امکانات کلاس در یک مکان</span>
            </div>
          </div>
        </section>

        {/* Main menu */}
        <section className="flex-1">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-[#0d9488]">
                QUICK ACCESS
              </p>
              <h2 className="mt-1.5 text-lg font-black text-[#19384a] sm:text-xl">
                دسترسی سریع
              </h2>
              <p className="mt-1 text-[11px] text-[#83949c]">
                برای شروع، بخش موردنظرت را انتخاب کن
              </p>
            </div>

            <span className="rounded-xl border border-[#dfe9eb] bg-white px-3 py-2 text-[10px] font-bold text-[#70858e]">
              {menuItems.length} بخش
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
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
                  className="group relative flex min-h-[116px] items-center gap-4 overflow-hidden rounded-[23px] border border-[#e5edef] bg-white p-4 shadow-[0_5px_22px_rgba(27,54,68,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#a8d9d2] hover:shadow-[0_12px_28px_rgba(27,54,68,0.075)] active:scale-[0.99] sm:min-h-[130px] sm:p-5"
                >
                  <div className="absolute inset-y-0 right-0 w-[3px] bg-[#0d9488] opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="relative flex h-[53px] w-[53px] shrink-0 items-center justify-center rounded-[18px] bg-[#edf8f6] text-[#138d83] transition-colors group-hover:bg-[#dff3ef] sm:h-[58px] sm:w-[58px]">
                    <MenuIcon name={item.icon} />

                    {showUnreadDot && (
                      <span
                        className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-[2.5px] border-white bg-[#e34f56] shadow-[0_2px_8px_rgba(227,79,86,0.3)]"
                        aria-label={unreadLabel}
                        title={unreadLabel}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <h3 className="text-[14px] font-extrabold text-[#203d4d] sm:text-[15px]">
                        {item.title}
                      </h3>

                      {showUnreadDot && (
                        <span className="rounded-full bg-[#fff0f0] px-2 py-1 text-[9px] font-bold text-[#d64d55]">
                          پیام جدید
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] leading-[2.1] text-[#84969e] sm:text-[11px]">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-center gap-2">
                    <span className="text-[9px] font-bold tracking-wider text-[#bdcbd0]">
                      {item.number}
                    </span>

                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3f7f8] text-[#81969e] transition-all group-hover:bg-[#e8f5f2] group-hover:text-[#0d9488]">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-[#e2eaec] py-5">
          <div className="flex flex-col items-center justify-between gap-3 text-[10px] text-[#91a0a6] sm:flex-row">
            <span className="font-semibold text-[#617984]">
              تکلیف من
            </span>

            <div className="flex items-center gap-2">
              <span>طراحی شده توسط</span>
              <span className="font-bold text-[#0d9488]">
                امید اوقانی
              </span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
