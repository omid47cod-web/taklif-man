
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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

type FilterType = 'all' | 'active' | 'blocked'

function Icon({
  name,
  size = 19,
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
    | 'search'
    | 'refresh'
    | 'filter'
    | 'shield'
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

  const paths: Record<string, React.ReactNode> = {
    users: <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>,
    user: <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </>,
    phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.35 1.9.68 2.8a2 2 0 0 1-.45 2.11L8.07 9.93a16 16 0 0 0 6 6l1.3-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.68A2 2 0 0 1 22 16.92z" />,
    calendar: <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>,
    lock: <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
    </>,
    unlock: <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 7.5-2M12 15v2" />
    </>,
    trash: <path d="M3 6h18M8 6V4h8v2m-11 0 1 14h12l1-14M10 10v6m4-6v6" />,
    arrow: <path d="M19 12H5m7-7-7 7 7 7" />,
    logout: <>
      <path d="M10 17l5-5-5-5M15 12H3" />
      <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
    </>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4m0 4h.01" />
    </>,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    search: <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>,
    refresh: <>
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M5.6 9a7 7 0 0 1 11.7-2L20 12M4 12l2.7 5a7 7 0 0 0 11.7-2" />
    </>,
    filter: <path d="M4 6h16M7 12h10m-7 6h4" />,
    shield: <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
      <path d="m9 12 2 2 4-4" />
    </>,
  }

  return <svg {...common}>{paths[name]}</svg>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))
}

export default function AdminStudentsPage() {
  const router = useRouter()

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [blockStudent, setBlockStudent] = useState<Student | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [blockSubmitting, setBlockSubmitting] = useState(false)

  const loadStudents = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)

    setError('')

    try {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('students')
        .select('id, full_name, phone, created_at, is_blocked, block_reason')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('LOAD STUDENTS ERROR:', fetchError)
        setError('دریافت اطلاعات دانش‌آموزان انجام نشد. دوباره تلاش کنید.')
        return
      }

      setStudents((data ?? []) as Student[])
    } catch (err) {
      console.error('LOAD STUDENTS ERROR:', err)
      setError('ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadStudents()
  }, [loadStudents])

  const activeCount = students.filter((student) => !student.is_blocked).length
  const blockedCount = students.filter((student) => student.is_blocked).length

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return students.filter((student) => {
      const matchesSearch =
        !normalizedSearch ||
        student.full_name.toLowerCase().includes(normalizedSearch) ||
        student.phone.includes(normalizedSearch)

      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && !student.is_blocked) ||
        (filter === 'blocked' && student.is_blocked)

      return matchesSearch && matchesFilter
    })
  }, [students, search, filter])

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

      const { data, error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id)
        .select('id')

      if (deleteError) {
        console.error('DELETE STUDENT ERROR:', {
          message: deleteError.message,
          code: deleteError.code,
          details: deleteError.details,
          hint: deleteError.hint,
        })

        setError(`حذف دانش‌آموز انجام نشد: ${deleteError.message}`)
        return
      }

      if (!data || data.length === 0) {
        setError('هیچ رکوردی حذف نشد. ممکن است دسترسی حذف وجود نداشته باشد.')
        return
      }

      setStudents((current) =>
        current.filter((item) => item.id !== student.id)
      )

      setSuccess(`دانش‌آموز «${student.full_name}» با موفقیت حذف شد.`)
    } catch (err) {
      console.error('DELETE STUDENT ERROR:', err)
      setError('هنگام حذف دانش‌آموز مشکلی رخ داد.')
    } finally {
      setActionLoading(null)
    }
  }

  // حذف همه دانش‌آموزان
  async function handleDeleteAllStudents() {
    if (students.length === 0) {
      setError('هیچ دانش‌آموزی برای حذف وجود ندارد.')
      return
    }

    if (actionLoading !== null || refreshing) {
      setError('ابتدا صبر کنید عملیات جاری تمام شود.')
      return
    }

    const count = students.length

    const confirmed = window.confirm(
      `هشدار مهم!\n\nقرار است تمام ${count} دانش‌آموز ثبت‌نام‌شده حذف شوند.\n\nاین عملیات قابل بازگشت نیست. آیا مطمئن هستید؟`
    )

    if (!confirmed) return

    const confirmationText = window.prompt(
      'برای تأیید نهایی، عبارت «حذف همه» را دقیقاً وارد کنید:'
    )

    if (confirmationText?.trim() !== 'حذف همه') {
      setError('عملیات حذف همه دانش‌آموزان لغو شد.')
      return
    }

    setActionLoading('__all__')
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()

      const { data, error: deleteError } = await supabase
        .from('students')
        .delete()
        .not('id', 'is', null)
        .select('id')

      if (deleteError) {
        console.error('DELETE ALL STUDENTS ERROR:', {
          message: deleteError.message,
          code: deleteError.code,
          details: deleteError.details,
          hint: deleteError.hint,
        })

        setError(`حذف دانش‌آموزان انجام نشد: ${deleteError.message}`)
        return
      }

      const deletedCount = data?.length ?? 0

      if (deletedCount === 0) {
        setError(
          'هیچ دانش‌آموزی حذف نشد. ممکن است دسترسی حذف وجود نداشته باشد یا رکوردی برای حذف موجود نباشد.'
        )
        return
      }

      setStudents((current) =>
        current.filter(
          (student) => !data?.some((deleted) => deleted.id === student.id)
        )
      )

      setSearch('')
      setFilter('all')

      setSuccess(
        `${deletedCount.toLocaleString('fa-IR')} دانش‌آموز با موفقیت حذف شدند.`
      )
    } catch (err) {
      console.error('DELETE ALL STUDENTS ERROR:', err)
      setError('هنگام حذف همه دانش‌آموزان مشکلی رخ داد.')
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

    const reason = blockReason.trim()

    if (!reason) {
      setError('برای انسداد دانش‌آموز باید دلیل وارد کنید.')
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
          block_reason: reason,
        })
        .eq('id', blockStudent.id)

      if (updateError) {
        console.error('BLOCK STUDENT ERROR:', updateError)
        setError('انسداد دانش‌آموز انجام نشد. دوباره تلاش کنید.')
        return
      }

      const studentName = blockStudent.full_name

      setStudents((current) =>
        current.map((item) =>
          item.id === blockStudent.id
            ? { ...item, is_blocked: true, block_reason: reason }
            : item
        )
      )

      setBlockStudent(null)
      setBlockReason('')
      setSuccess(`«${studentName}» با موفقیت مسدود شد.`)
    } catch (err) {
      console.error('BLOCK STUDENT ERROR:', err)
      setError('هنگام انسداد دانش‌آموز مشکلی رخ داد.')
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
        setError('لغو انسداد انجام نشد. دوباره تلاش کنید.')
        return
      }

      setStudents((current) =>
        current.map((item) =>
          item.id === student.id
            ? { ...item, is_blocked: false, block_reason: null }
            : item
        )
      )

      setSuccess(`انسداد «${student.full_name}» لغو شد.`)
    } catch (err) {
      console.error('UNBLOCK STUDENT ERROR:', err)
      setError('هنگام لغو انسداد دانش‌آموز مشکلی رخ داد.')
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

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#08090b] text-[#eee9df]"
      >
        <div className="flex flex-col items-center gap-5">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#c9a96a]/20 border-t-[#c9a96a]" />
          <p className="text-sm text-[#aaa397]">
            در حال دریافت اطلاعات کاربران...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#08090b] px-4 py-6 text-[#f1eee7] sm:px-6 sm:py-9"
    >
      <div className="pointer-events-none absolute -top-48 right-[-100px] h-[440px] w-[440px] rounded-full bg-[#c9a96a]/[0.075] blur-[130px]" />
      <div className="pointer-events-none absolute top-[650px] left-[-180px] h-[400px] w-[400px] rounded-full bg-blue-500/[0.035] blur-[130px]" />

      <div className="relative mx-auto max-w-6xl">
        <header className="mb-7 flex flex-col gap-5 rounded-[30px] border border-white/[0.08] bg-[#111317] p-5 shadow-2xl shadow-black/20 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9a96a]/20 bg-[#c9a96a]/[0.07] px-3 py-1.5 text-xs text-[#d7bd8c]">
              <Icon name="shield" size={15} />
              مدیریت و نظارت کاربران
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              دانش‌آموزان
            </h1>

            <p className="mt-2 text-sm leading-7 text-[#96999f]">
              مدیریت اعضای ثبت‌نام‌شده و کنترل وضعیت دسترسی آن‌ها
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleDeleteAllStudents()}
              disabled={students.length === 0 || actionLoading !== null || refreshing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.08] px-4 text-sm text-red-300 transition hover:bg-red-500/[0.16] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="trash" size={17} />
              {actionLoading === '__all__'
                ? 'در حال حذف همه...'
                : 'حذف همه دانش‌آموزان'}
            </button>

            <button
              type="button"
              onClick={() => void loadStudents(true)}
              disabled={refreshing || actionLoading !== null}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-[#d9d6cf] transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              <span className={refreshing ? 'animate-spin' : ''}>
                <Icon name="refresh" size={17} />
              </span>
              بروزرسانی
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#c9a96a]/25 bg-[#c9a96a]/[0.07] px-4 text-sm text-[#dfc590] transition hover:bg-[#c9a96a]/[0.13]"
            >
              <Icon name="arrow" size={17} />
              داشبورد
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-500/[0.045] px-4 text-sm text-red-300 transition hover:bg-red-500/[0.1]"
            >
              <Icon name="logout" size={17} />
              خروج
            </button>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#111317] p-5">
            <div className="absolute -left-7 -top-8 h-28 w-28 rounded-full bg-[#c9a96a]/[0.07] blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9a9da3]">کل دانش‌آموزان</p>
                <p className="mt-3 text-3xl font-extrabold tabular-nums">
                  {students.length.toLocaleString('fa-IR')}
                </p>
                <p className="mt-2 text-xs text-[#747982]">
                  تمام اعضای ثبت‌نام‌شده
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.08] text-[#d8bd89]">
                <Icon name="users" size={23} />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[24px] border border-emerald-400/[0.12] bg-[#111317] p-5">
            <div className="absolute -left-7 -top-8 h-28 w-28 rounded-full bg-emerald-400/[0.06] blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9a9da3]">کاربران فعال</p>
                <p className="mt-3 text-3xl font-extrabold tabular-nums text-emerald-300">
                  {activeCount.toLocaleString('fa-IR')}
                </p>
                <p className="mt-2 text-xs text-[#747982]">
                  دارای دسترسی به سامانه
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300">
                <Icon name="check" size={23} />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[24px] border border-red-400/[0.12] bg-[#111317] p-5">
            <div className="absolute -left-7 -top-8 h-28 w-28 rounded-full bg-red-400/[0.06] blur-2xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm text-[#9a9da3]">کاربران مسدود</p>
                <p className="mt-3 text-3xl font-extrabold tabular-nums text-red-300">
                  {blockedCount.toLocaleString('fa-IR')}
                </p>
                <p className="mt-2 text-xs text-[#747982]">
                  دسترسی محدودشده
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/15 bg-red-400/[0.07] text-red-300">
                <Icon name="lock" size={23} />
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/[0.07] p-4 text-sm leading-7 text-red-300"
          >
            <Icon name="alert" size={19} />
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError('')}
              className="mr-auto text-red-200/70 hover:text-red-100"
              aria-label="بستن پیام خطا"
            >
              <Icon name="close" size={17} />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4 text-sm leading-7 text-emerald-300"
          >
            <Icon name="check" size={19} />
            <p>{success}</p>
            <button
              type="button"
              onClick={() => setSuccess('')}
              className="mr-auto text-emerald-200/70 hover:text-emerald-100"
              aria-label="بستن پیام"
            >
              <Icon name="close" size={17} />
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#111317] shadow-2xl shadow-black/20">
          <div className="border-b border-white/[0.07] p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">فهرست اعضا</h2>
                <p className="mt-1 text-xs text-[#858991]">
                  جست‌وجو و مدیریت حساب‌های دانش‌آموزی
                </p>
              </div>

              <span className="rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-xs text-[#b7b9bd]">
                نمایش {filteredStudents.length.toLocaleString('fa-IR')} از{' '}
                {students.length.toLocaleString('fa-IR')}
              </span>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#858991]">
                  <Icon name="search" size={19} />
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="جست‌وجو بر اساس نام یا شماره تماس..."
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#090b0e] pr-12 pl-4 text-sm text-white outline-none transition placeholder:text-[#656a73] focus:border-[#c9a96a]/40 focus:ring-2 focus:ring-[#c9a96a]/[0.08]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e9299] hover:text-white"
                    aria-label="پاک کردن جست‌وجو"
                  >
                    <Icon name="close" size={17} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#090b0e] p-1">
                {([
                  ['all', 'همه'],
                  ['active', 'فعال'],
                  ['blocked', 'مسدود'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`min-h-10 flex-1 rounded-lg px-4 text-xs transition sm:flex-none ${
                      filter === value
                        ? 'border border-[#c9a96a]/25 bg-[#c9a96a]/[0.12] font-semibold text-[#e2c995]'
                        : 'text-[#92969e] hover:bg-white/[0.045] hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] text-[#b5a078]">
                <Icon
                  name={search || filter !== 'all' ? 'search' : 'users'}
                  size={27}
                />
              </div>
              <h3 className="font-bold text-[#e7e3db]">
                {students.length === 0
                  ? 'هنوز دانش‌آموزی ثبت‌نام نکرده است'
                  : 'کاربری با این مشخصات پیدا نشد'}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-[#858991]">
                {students.length === 0
                  ? 'پس از ثبت‌نام دانش‌آموزان، اطلاعات آن‌ها در این قسمت نمایش داده می‌شود.'
                  : 'عبارت جست‌وجو یا فیلتر انتخاب‌شده را تغییر بده.'}
              </p>
              {(search || filter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setFilter('all')
                  }}
                  className="mt-5 rounded-xl border border-[#c9a96a]/25 bg-[#c9a96a]/[0.07] px-4 py-2.5 text-sm text-[#dfc590] hover:bg-[#c9a96a]/[0.13]"
                >
                  پاک کردن فیلترها
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-right">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-white/[0.018] text-xs text-[#858991]">
                      <th className="px-5 py-4 font-medium">دانش‌آموز</th>
                      <th className="px-5 py-4 font-medium">شماره تماس</th>
                      <th className="px-5 py-4 font-medium">تاریخ عضویت</th>
                      <th className="px-5 py-4 font-medium">وضعیت</th>
                      <th className="px-5 py-4 text-left font-medium">مدیریت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.055]">
                    {filteredStudents.map((student) => {
                      const isBusy =
                        actionLoading === student.id ||
                        actionLoading === '__all__'

                      return (
                        <tr
                          key={student.id}
                          className="transition hover:bg-white/[0.025]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.07] font-bold text-[#d7bd8c]">
                                {student.full_name.trim().charAt(0) || '؟'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-[#e9e5dc]">
                                  {student.full_name}
                                </p>
                                <p className="mt-1 text-[11px] text-[#747982]">
                                  شناسه: {student.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td
                            className="px-5 py-4 text-sm text-[#c3c4c7]"
                            dir="ltr"
                          >
                            {student.phone}
                          </td>

                          <td className="px-5 py-4 text-xs text-[#969aa1]">
                            {formatDate(student.created_at)}
                          </td>

                          <td className="px-5 py-4">
                            {student.is_blocked ? (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/15 bg-red-500/[0.07] px-2.5 py-1.5 text-xs text-red-300">
                                <Icon name="lock" size={13} />
                                مسدود
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/15 bg-emerald-500/[0.06] px-2.5 py-1.5 text-xs text-emerald-300">
                                <Icon name="check" size={13} />
                                فعال
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {student.is_blocked ? (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    void handleUnblockStudent(student)
                                  }
                                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-400/15 bg-emerald-500/[0.05] px-3 text-xs text-emerald-300 transition hover:bg-emerald-500/[0.12] disabled:opacity-40"
                                >
                                  <Icon name="unlock" size={15} />
                                  رفع انسداد
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => openBlockModal(student)}
                                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#c9a96a]/20 bg-[#c9a96a]/[0.05] px-3 text-xs text-[#d9bd87] transition hover:bg-[#c9a96a]/[0.12] disabled:opacity-40"
                                >
                                  <Icon name="lock" size={15} />
                                  انسداد
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  void handleDeleteStudent(student)
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/15 bg-red-500/[0.045] text-red-300 transition hover:bg-red-500/[0.12] disabled:opacity-40"
                                title="حذف دانش‌آموز"
                                aria-label={`حذف ${student.full_name}`}
                              >
                                <Icon name="trash" size={16} />
                              </button>
                            </div>
                            {isBusy && (
                              <p className="mt-1 text-left text-[10px] text-[#8c9098]">
                                در حال انجام...
                              </p>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-white/[0.06] md:hidden">
                {filteredStudents.map((student) => {
                  const isBusy =
                    actionLoading === student.id ||
                    actionLoading === '__all__'

                  return (
                    <article
                      key={student.id}
                      className={`p-4 ${
                        student.is_blocked ? 'bg-red-500/[0.018]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.07] text-lg font-bold text-[#d7bd8c]">
                          {student.full_name.trim().charAt(0) || '؟'}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-[#e9e5dc]">
                              {student.full_name}
                            </h3>
                            {student.is_blocked ? (
                              <span className="rounded-md border border-red-400/15 bg-red-500/[0.07] px-2 py-1 text-[10px] text-red-300">
                                مسدود
                              </span>
                            ) : (
                              <span className="rounded-md border border-emerald-400/15 bg-emerald-500/[0.06] px-2 py-1 text-[10px] text-emerald-300">
                                فعال
                              </span>
                            )}
                          </div>

                          <p
                            className="mt-2 flex items-center gap-2 text-xs text-[#a0a3aa]"
                            dir="ltr"
                          >
                            <Icon name="phone" size={14} />
                            {student.phone}
                          </p>

                          <p className="mt-2 flex items-center gap-2 text-xs text-[#777d86]">
                            <Icon name="calendar" size={14} />
                            {formatDate(student.created_at)}
                          </p>
                        </div>
                      </div>

                      {student.is_blocked && student.block_reason && (
                        <div className="mt-3 rounded-xl border border-red-400/10 bg-red-500/[0.035] p-3 text-xs leading-6 text-[#c4a5a1]">
                          <span className="font-semibold text-red-300">
                            دلیل انسداد:{' '}
                          </span>
                          {student.block_reason}
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {student.is_blocked ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleUnblockStudent(student)
                            }
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.05] px-3 text-xs text-emerald-300 disabled:opacity-40"
                          >
                            <Icon name="unlock" size={15} />
                            لغو انسداد
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => openBlockModal(student)}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.05] px-3 text-xs text-[#d9bd87] disabled:opacity-40"
                          >
                            <Icon name="lock" size={15} />
                            انسداد کاربر
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void handleDeleteStudent(student)
                          }
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-500/[0.045] px-3 text-xs text-red-300 disabled:opacity-40"
                        >
                          <Icon name="trash" size={15} />
                          حذف کاربر
                        </button>
                      </div>

                      {isBusy && (
                        <p className="mt-2 text-center text-[10px] text-[#8c9098]">
                          در حال انجام...
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-4 text-xs text-[#747982]">
            <span>سامانه مدیریت تکلیف من</span>
            <span>
              تعداد نتایج: {filteredStudents.length.toLocaleString('fa-IR')}
            </span>
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-[#666b73]">
          <span className="text-[#c9a96a]">✦</span>
          <span className="mx-2">تکلیف من</span>
          <span className="text-white/20">|</span>
          <span className="mx-2">پنل مدیریت کاربران</span>
        </footer>
      </div>

      {blockStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeBlockModal()
          }}
        >
          <section
            className="my-auto w-full max-w-md rounded-[28px] border border-white/[0.09] bg-[#14171b] p-5 shadow-2xl shadow-black/60 sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-student-title"
            dir="rtl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/15 bg-red-500/[0.07] text-red-300">
                  <Icon name="lock" size={23} />
                </div>
                <div>
                  <h2 id="block-student-title" className="font-bold text-lg">
                    انسداد حساب کاربری
                  </h2>
                  <p className="mt-1 text-xs text-[#8e939c]">
                    محدودکردن دسترسی دانش‌آموز
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="بستن پنجره"
                onClick={closeBlockModal}
                disabled={blockSubmitting}
                className="rounded-lg p-2 text-[#9297a0] hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
              >
                <Icon name="close" size={19} />
              </button>
            </div>

            <div className="mb-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-xs text-[#858b95]">حساب انتخاب‌شده</p>
              <p className="mt-2 font-semibold text-[#eee9df]">
                {blockStudent.full_name}
              </p>
              <p className="mt-1 text-sm text-[#969ba3]" dir="ltr">
                {blockStudent.phone}
              </p>
            </div>

            <label
              htmlFor="block-reason"
              className="mb-2 block text-sm font-medium text-[#e1dcd2]"
            >
              دلیل انسداد
            </label>

            <textarea
              id="block-reason"
              value={blockReason}
              onChange={(event) => setBlockReason(event.target.value)}
              placeholder="دلیل محدودیت دسترسی را بنویس..."
              rows={4}
              maxLength={500}
              autoFocus
              disabled={blockSubmitting}
              className="min-h-32 w-full resize-y rounded-2xl border border-white/[0.09] bg-[#090b0e] px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-[#666c75] focus:border-[#c9a96a]/45 focus:ring-2 focus:ring-[#c9a96a]/[0.08] disabled:opacity-60"
            />

            <div className="mt-2 text-left text-xs text-[#777d86]" dir="ltr">
              {blockReason.length}/500
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-red-400/15 bg-red-500/[0.06] p-3 text-sm leading-6 text-red-300"
              >
                {error}
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeBlockModal}
                disabled={blockSubmitting}
                className="min-h-12 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-sm text-[#d1d2d4] transition hover:bg-white/[0.07] disabled:opacity-40"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={() => void handleBlockStudent()}
                disabled={blockSubmitting || !blockReason.trim()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.09] px-4 text-sm font-semibold text-red-300 transition hover:bg-red-500/[0.15] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="lock" size={16} />
                {blockSubmitting ? 'در حال ثبت...' : 'تأیید انسداد'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}
