'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Student = {
  id: string
  full_name: string
  phone: string
  created_at: string
  is_blocked: boolean
  block_reason: string | null
}

function StudentIcon({
  name,
  size = 21,
}: {
  name:
    | 'users'
    | 'user'
    | 'phone'
    | 'calendar'
    | 'lock'
    | 'unlock'
    | 'trash'
    | 'arrow'
    | 'logout'
    | 'check'
    | 'alert'
    | 'close'
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
    case 'users':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="7" r="4" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 21a7 7 0 0 1 14 0" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.35 1.9.68 2.8a2 2 0 0 1-.45 2.11L8.07 9.93a16 16 0 0 0 6 6l1.3-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.68A2 2 0 0 1 22 16.92z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M16 3v4M8 3v4M3 10h18" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...common}>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
        </svg>
      )
    case 'unlock':
      return (
        <svg {...common}>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 7.5-2M12 15v2" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M3 6h18M8 6V4h8v2m-11 0 1 14h12l1-14M10 10v6m4-6v6" />
        </svg>
      )
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M19 12H5m7-7-7 7 7 7" />
        </svg>
      )
    case 'logout':
      return (
        <svg {...common}>
          <path d="M10 17l5-5-5-5M15 12H3" />
          <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 9v4m0 4h.01" />
          <path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      )
    case 'close':
      return (
        <svg {...common}>
          <path d="m18 6-12 12M6 6l12 12" />
        </svg>
      )
  }
}

export default function AdminStudentsPage() {
  const router = useRouter()

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [blockStudent, setBlockStudent] = useState<Student | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [blockSubmitting, setBlockSubmitting] = useState(false)

  async function loadStudents() {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('students')
        .select(
          'id, full_name, phone, created_at, is_blocked, block_reason'
        )
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('LOAD STUDENTS ERROR:', fetchError)
        setError(
          `دریافت اطلاعات دانش‌آموزان انجام نشد: ${fetchError.message}`
        )
        setStudents([])
        return
      }

      setStudents((data ?? []) as Student[])
    } catch (err) {
      console.error('LOAD STUDENTS ERROR:', err)
      setError('ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStudents()
  }, [])

  async function handleDeleteStudent(student: Student) {
    const confirmed = window.confirm(
      `آیا مطمئن هستید که می‌خواهید «${student.full_name}» را حذف کنید؟\n\nپس از حذف، این دانش‌آموز می‌تواند دوباره با همین شماره ثبت‌نام کند.`
    )

    if (!confirmed) return

    setActionLoading(student.id)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id)

      if (deleteError) {
        console.error('DELETE STUDENT ERROR:', deleteError)
        setError(`حذف دانش‌آموز انجام نشد: ${deleteError.message}`)
        return
      }

      setSuccess(`دانش‌آموز «${student.full_name}» با موفقیت حذف شد.`)
      await loadStudents()
    } catch (err) {
      console.error('DELETE STUDENT ERROR:', err)
      setError('هنگام حذف دانش‌آموز مشکلی رخ داد. دوباره تلاش کنید.')
    } finally {
      setActionLoading(null)
    }
  }

  function openBlockModal(student: Student) {
    setError('')
    setSuccess('')
    setBlockReason('')
    setBlockStudent(student)
  }

  function closeBlockModal() {
    if (blockSubmitting) return

    setBlockStudent(null)
    setBlockReason('')
  }

  async function handleBlockStudent() {
    if (!blockStudent) return

    const trimmedReason = blockReason.trim()

    if (!trimmedReason) {
      setError('برای انسداد دانش‌آموز باید دلیل وارد کنید.')
      setSuccess('')
      return
    }

    setBlockSubmitting(true)
    setActionLoading(blockStudent.id)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('students')
        .update({
          is_blocked: true,
          block_reason: trimmedReason,
        })
        .eq('id', blockStudent.id)

      if (updateError) {
        console.error('BLOCK STUDENT ERROR:', updateError)
        setError(`انسداد دانش‌آموز انجام نشد: ${updateError.message}`)
        return
      }

      const studentName = blockStudent.full_name

      setBlockStudent(null)
      setBlockReason('')
      setSuccess(`«${studentName}» با موفقیت مسدود شد.`)

      await loadStudents()
    } catch (err) {
      console.error('BLOCK STUDENT ERROR:', err)
      setError('هنگام انسداد دانش‌آموز مشکلی رخ داد. دوباره تلاش کنید.')
    } finally {
      setBlockSubmitting(false)
      setActionLoading(null)
    }
  }

  async function handleUnblockStudent(student: Student) {
    const confirmed = window.confirm(
      `آیا می‌خواهید انسداد «${student.full_name}» لغو شود؟`
    )

    if (!confirmed) return

    setActionLoading(student.id)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('students')
        .update({
          is_blocked: false,
          block_reason: null,
        })
        .eq('id', student.id)

      if (updateError) {
        console.error('UNBLOCK STUDENT ERROR:', updateError)
        setError(`لغو انسداد انجام نشد: ${updateError.message}`)
        return
      }

      setSuccess(`انسداد «${student.full_name}» لغو شد.`)
      await loadStudents()
    } catch (err) {
      console.error('UNBLOCK STUDENT ERROR:', err)
      setError('هنگام لغو انسداد مشکلی رخ داد. دوباره تلاش کنید.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  const blockedCount = students.filter((student) => student.is_blocked).length

  if (loading) {
    return (
      <main
        dir="rtl"
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-5 text-[#f5f0e7]"
      >
        <div className="pointer-events-none absolute -top-32 right-[-70px] h-80 w-80 rounded-full bg-[#c9a96a]/10 blur-[100px]" />
        <div className="relative flex flex-col items-center gap-5">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#c9a96a]/20 border-t-[#c9a96a]" />
          <p className="text-sm text-[#b9b0a1]">در حال دریافت اطلاعات...</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <main
        dir="rtl"
        className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-7 text-[#f5f0e7] sm:px-6 sm:py-10"
      >
        <div className="pointer-events-none absolute -top-40 right-[-100px] h-[400px] w-[400px] rounded-full bg-[#c9a96a]/[0.09] blur-[120px]" />
        <div className="pointer-events-none absolute top-[650px] left-[-150px] h-[320px] w-[320px] rounded-full bg-[#c9a96a]/[0.05] blur-[110px]" />

        <div className="relative mx-auto max-w-5xl">
          <header className="mb-8 flex flex-col gap-6 rounded-[28px] border border-white/[0.09] bg-[#10100f]/90 p-5 shadow-2xl shadow-black/30 sm:p-7 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9a96a]/25 bg-[#c9a96a]/[0.08] px-3 py-1.5 text-xs text-[#d9bd87]">
                <StudentIcon name="users" size={16} />
                پنل مدیریت
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                مدیریت دانش‌آموزان
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-[#a9a297]">
                فهرست کاربران ثبت‌نام‌شده را ببین و در صورت نیاز دسترسی آن‌ها را
                مدیریت کن.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#e9e1d4] transition hover:border-[#c9a96a]/40 hover:bg-white/[0.07]"
              >
                <StudentIcon name="arrow" size={17} />
                داشبورد
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300 transition hover:bg-red-500/[0.12]"
              >
                <StudentIcon name="logout" size={17} />
                خروج
              </button>
            </div>
          </header>

          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#c9a96a]/20 bg-[#10100f] p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.08] text-[#c9a96a]">
                <StudentIcon name="users" size={22} />
              </div>
              <p className="text-sm text-[#a9a297]">تعداد ثبت‌نام‌شده‌ها</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {students.length}
              </p>
            </div>

            <div className="rounded-2xl border border-red-400/15 bg-[#10100f] p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/[0.07] text-red-300">
                <StudentIcon name="lock" size={21} />
              </div>
              <p className="text-sm text-[#a9a297]">کاربران مسدودشده</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-red-300">
                {blockedCount}
              </p>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/[0.07] p-4 text-sm leading-7 text-red-300"
            >
              <span className="mt-1 shrink-0">
                <StudentIcon name="alert" size={19} />
              </span>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4 text-sm leading-7 text-emerald-300"
            >
              <span className="mt-1 shrink-0">
                <StudentIcon name="check" size={19} />
              </span>
              <p>{success}</p>
            </div>
          )}

          <section className="overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#10100f]">
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] p-5 sm:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[#c9a96a]">
                    <StudentIcon name="users" size={20} />
                  </span>
                  <h2 className="text-lg font-bold">فهرست دانش‌آموزان</h2>
                </div>
                <p className="mt-2 text-xs leading-6 text-[#a9a297] sm:text-sm">
                  جدیدترین ثبت‌نام‌ها در ابتدای فهرست قرار دارند.
                </p>
              </div>

              <span className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-[#c9a96a]/25 bg-[#c9a96a]/[0.09] px-2 text-sm font-bold tabular-nums text-[#d6b77d]">
                {students.length}
              </span>
            </div>

            {students.length === 0 ? (
              <div className="px-5 py-12 text-center sm:px-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] text-[#b6a27b]">
                  <StudentIcon name="users" size={27} />
                </div>
                <h3 className="font-semibold">
                  هنوز کسی ثبت‌نام نکرده است
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#a9a297]">
                  با ثبت‌نام دانش‌آموزان، اطلاعات آن‌ها در این بخش نمایش داده
                  می‌شود.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {students.map((student, index) => {
                  const isBusy = actionLoading === student.id

                  return (
                    <article
                      key={student.id}
                      className={`px-5 py-5 transition hover:bg-white/[0.02] sm:px-6 ${
                        student.is_blocked
                          ? 'border-r-2 border-r-red-400/60 bg-red-500/[0.025]'
                          : ''
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-xs tabular-nums text-[#8f887c]">
                          {index + 1}
                        </div>

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#c9a96a]/25 bg-[#c9a96a]/[0.08] text-lg font-bold text-[#d6b77d]">
                          {student.full_name.trim().charAt(0) || '؟'}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words font-semibold leading-7 text-[#f1e9dc]">
                              {student.full_name}
                            </h3>

                            {student.is_blocked && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-red-400/20 bg-red-500/[0.08] px-2 py-1 text-[11px] text-red-300">
                                <StudentIcon name="lock" size={12} />
                                مسدود
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#a9a297] sm:text-sm">
                            <span className="inline-flex items-center gap-1.5" dir="ltr">
                              <StudentIcon name="phone" size={14} />
                              {student.phone}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <StudentIcon name="calendar" size={14} />
                              {new Date(student.created_at).toLocaleDateString('fa-IR')}
                            </span>
                          </div>

                          {student.is_blocked && student.block_reason && (
                            <div className="mt-3 rounded-xl border border-red-400/10 bg-red-500/[0.045] px-3 py-2.5 text-xs leading-6 text-[#c9aaa5]">
                              <span className="font-semibold text-red-300">
                                دلیل انسداد:{' '}
                              </span>
                              <span className="break-words">
                                {student.block_reason}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 pr-11 sm:pr-[60px]">
                        {student.is_blocked ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleUnblockStudent(student)}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3.5 py-2 text-xs text-emerald-300 transition hover:bg-emerald-500/[0.12] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                          >
                            <StudentIcon name="unlock" size={16} />
                            {isBusy ? 'در حال انجام...' : 'لغو انسداد'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => openBlockModal(student)}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#c9a96a]/25 bg-[#c9a96a]/[0.07] px-3.5 py-2 text-xs text-[#d6b77d] transition hover:bg-[#c9a96a]/[0.14] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                          >
                            <StudentIcon name="lock" size={16} />
                            انسداد کاربر
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDeleteStudent(student)}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.055] px-3.5 py-2 text-xs text-red-300 transition hover:bg-red-500/[0.12] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                        >
                          <StudentIcon name="trash" size={16} />
                          {isBusy ? 'در حال انجام...' : 'حذف کاربر'}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <footer className="py-8 text-center text-xs text-[#777166]">
            <span className="text-[#c9a96a]/70">✦</span>
            <span className="mx-2">تکلیف من</span>
            <span className="text-[#c9a96a]/70">·</span>
            <span className="mx-2">پنل مدیریت</span>
          </footer>
        </div>
      </main>

      {blockStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeBlockModal()
            }
          }}
        >
          <section
            className="my-auto w-full max-w-lg rounded-[26px] border border-[#c9a96a]/20 bg-[#111110] p-5 shadow-2xl shadow-black/60 sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-student-title"
            dir="rtl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/[0.07] text-red-300">
                  <StudentIcon name="lock" size={23} />
                </div>

                <div>
                  <h2
                    id="block-student-title"
                    className="text-lg font-bold"
                  >
                    انسداد دانش‌آموز
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[#a9a297]">
                    دلیل انسداد «{blockStudent.full_name}» را وارد کن.
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="بستن پنجره"
                onClick={closeBlockModal}
                disabled={blockSubmitting}
                className="rounded-lg p-2 text-[#a9a297] transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
              >
                <StudentIcon name="close" size={19} />
              </button>
            </div>

            <label
              className="mb-2 block text-sm font-medium text-[#e3dacb]"
              htmlFor="block-reason"
            >
              دلیل انسداد
            </label>

            <textarea
              id="block-reason"
              className="min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-[#080808] px-4 py-3 text-sm leading-7 text-[#f5f0e7] outline-none transition placeholder:text-[#716b61] focus:border-[#c9a96a]/50 focus:ring-2 focus:ring-[#c9a96a]/10 disabled:opacity-60"
              value={blockReason}
              onChange={(event) => setBlockReason(event.target.value)}
              placeholder="مثلاً عدم رعایت قوانین کلاس..."
              rows={4}
              autoFocus
              disabled={blockSubmitting}
              maxLength={500}
            />

            <div className="mt-2 text-left text-xs text-[#777166]" dir="ltr">
              {blockReason.length}/500
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-400/20 bg-red-500/[0.07] p-3 text-sm leading-6 text-red-300"
              >
                {error}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeBlockModal}
                disabled={blockSubmitting}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-5 py-2.5 text-sm text-[#d5cdbf] transition hover:bg-white/[0.07] disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleBlockStudent}
                disabled={blockSubmitting || !blockReason.trim()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.09] px-5 py-2.5 text-sm text-red-300 transition hover:bg-red-500/[0.15] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <StudentIcon name="lock" size={17} />
                {blockSubmitting ? 'در حال انسداد...' : 'تأیید انسداد'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
