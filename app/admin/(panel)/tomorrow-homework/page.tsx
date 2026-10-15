'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Homework = {
  id: string
  title: string
  due_date: string
  content: string
  is_red: boolean
  created_at: string
}

type TomorrowHomework = {
  id: string
  homework_id: string
  created_at: string
}

function TomorrowIcon({
  name,
  size = 22,
}: {
  name: 'calendar' | 'check' | 'plus' | 'trash' | 'book' | 'arrow' | 'logout' | 'alert'
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
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M16 3v4M8 3v4M3 10h18" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M3 6h18M8 6V4h8v2m-11 0 1 14h12l1-14M10 10v6m4-6v6" />
        </svg>
      )
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" />
          <path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M8 7h8" />
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
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 9v4m0 4h.01" />
          <path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      )
  }
}

export default function AdminTomorrowHomeworkPage() {
  const router = useRouter()

  const [homework, setHomework] = useState<Homework[]>([])
  const [tomorrowHomework, setTomorrowHomework] =
    useState<TomorrowHomework[]>([])

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const [
        { data: homeworkData, error: homeworkError },
        { data: tomorrowData, error: tomorrowError },
      ] = await Promise.all([
        supabase
          .from('homework')
          .select('id, title, due_date, content, is_red, created_at')
          .order('created_at', { ascending: false }),

        supabase
          .from('tomorrow_homework')
          .select('id, homework_id, created_at')
          .order('created_at', { ascending: false }),
      ])

      if (homeworkError) {
        console.error('LOAD HOMEWORK ERROR:', homeworkError)
        setError(`دریافت تکالیف انجام نشد: ${homeworkError.message}`)
        return
      }

      if (tomorrowError) {
        console.error('LOAD TOMORROW HOMEWORK ERROR:', tomorrowError)
        setError(
          `دریافت فهرست تکالیف فردا انجام نشد: ${tomorrowError.message}`
        )
        return
      }

      setHomework((homeworkData ?? []) as Homework[])
      setTomorrowHomework((tomorrowData ?? []) as TomorrowHomework[])
    } catch (err) {
      console.error('LOAD DATA ERROR:', err)
      setError('ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  async function handleAddToTomorrow(homeworkId: string) {
    setActionLoading(homeworkId)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()

      const { error: insertError } = await supabase
        .from('tomorrow_homework')
        .insert({ homework_id: homeworkId })

      if (insertError) {
        console.error('ADD TOMORROW HOMEWORK ERROR:', insertError)

        if (insertError.code === '23505') {
          setError('این تکلیف قبلاً برای جلسه بعد انتخاب شده است.')
        } else {
          setError(`اضافه کردن تکلیف انجام نشد: ${insertError.message}`)
        }

        return
      }

      setSuccess('تکلیف با موفقیت برای جلسه بعد انتخاب شد.')
      await loadData()
    } catch (err) {
      console.error('ADD TOMORROW HOMEWORK ERROR:', err)
      setError('هنگام انتخاب تکلیف مشکلی رخ داد. دوباره تلاش کنید.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRemoveFromTomorrow(homeworkId: string) {
    setActionLoading(homeworkId)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('tomorrow_homework')
        .delete()
        .eq('homework_id', homeworkId)

      if (deleteError) {
        console.error('REMOVE TOMORROW HOMEWORK ERROR:', deleteError)
        setError(`حذف از فهرست انجام نشد: ${deleteError.message}`)
        return
      }

      setSuccess('تکلیف از فهرست جلسه بعد حذف شد.')
      await loadData()
    } catch (err) {
      console.error('REMOVE TOMORROW HOMEWORK ERROR:', err)
      setError('هنگام حذف تکلیف مشکلی رخ داد. دوباره تلاش کنید.')
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

  const tomorrowIds = new Set(
    tomorrowHomework.map((item) => item.homework_id)
  )

  const selectedHomework = homework.filter((item) => tomorrowIds.has(item.id))
  const availableHomework = homework.filter((item) => !tomorrowIds.has(item.id))

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
              <TomorrowIcon name="calendar" size={15} />
              پنل مدیریت
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              مدیریت تکالیف جلسه بعد
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-[#a9a297]">
              تکالیفی را که می‌خواهید در بخش جلسه بعد برای دانش‌آموزان نمایش
              داده شوند، انتخاب کنید.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#e9e1d4] transition hover:border-[#c9a96a]/40 hover:bg-white/[0.07]"
            >
              <TomorrowIcon name="arrow" size={17} />
              داشبورد
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300 transition hover:bg-red-500/[0.12]"
            >
              <TomorrowIcon name="logout" size={17} />
              خروج
            </button>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-[#10100f] p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.08] text-[#c9a96a]">
              <TomorrowIcon name="book" size={22} />
            </div>
            <p className="text-sm text-[#a9a297]">مجموع تکالیف</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{homework.length}</p>
          </div>

          <div className="rounded-2xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.045] p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#c9a96a]/25 bg-[#c9a96a]/[0.10] text-[#d6b77d]">
              <TomorrowIcon name="check" size={22} />
            </div>
            <p className="text-sm text-[#bdb19b]">انتخاب‌شده برای جلسه بعد</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-[#d6b77d]">
              {selectedHomework.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#10100f] p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#c5bdb0]">
              <TomorrowIcon name="plus" size={22} />
            </div>
            <p className="text-sm text-[#a9a297]">تکالیف انتخاب‌نشده</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {availableHomework.length}
            </p>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/[0.07] p-4 text-sm leading-7 text-red-300"
          >
            <span className="mt-1 shrink-0">
              <TomorrowIcon name="alert" size={19} />
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
              <TomorrowIcon name="check" size={19} />
            </span>
            <p>{success}</p>
          </div>
        )}

        <section className="mb-7 overflow-hidden rounded-[26px] border border-[#c9a96a]/20 bg-[#10100f]">
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] p-5 sm:p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#d6b77d]">
                  <TomorrowIcon name="check" size={20} />
                </span>
                <h2 className="text-lg font-bold">انتخاب‌شده برای جلسه بعد</h2>
              </div>
              <p className="mt-2 text-xs leading-6 text-[#a9a297] sm:text-sm">
                این موارد در صفحه جلسه بعد برای دانش‌آموزان نمایش داده می‌شوند.
              </p>
            </div>
            <span className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-[#c9a96a]/25 bg-[#c9a96a]/[0.09] px-2 text-sm font-bold tabular-nums text-[#d6b77d]">
              {selectedHomework.length}
            </span>
          </div>

          {selectedHomework.length === 0 ? (
            <div className="px-5 py-12 text-center sm:px-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] text-[#b6a27b]">
                <TomorrowIcon name="calendar" size={27} />
              </div>
              <h3 className="font-semibold">هنوز تکلیفی انتخاب نشده است</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#a9a297]">
                از فهرست تکالیف موجود در پایین، موارد موردنظر را انتخاب کن.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {selectedHomework.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 px-5 py-5 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {item.is_red && (
                        <span className="rounded-md border border-red-400/20 bg-red-500/[0.08] px-2 py-1 text-[11px] font-medium text-red-300">
                          مهم
                        </span>
                      )}
                      <span className="text-xs text-[#9f978a]">
                        مهلت: {item.due_date}
                      </span>
                    </div>
                    <h3 className="break-words font-semibold leading-7 text-[#f1e9dc]">
                      {item.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading === item.id}
                    onClick={() => handleRemoveFromTomorrow(item.id)}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.06] px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-500/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <TomorrowIcon name="trash" size={17} />
                    {actionLoading === item.id ? 'در حال انجام...' : 'حذف از جلسه بعد'}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#10100f]">
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] p-5 sm:p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[#c9a96a]">
                  <TomorrowIcon name="book" size={20} />
                </span>
                <h2 className="text-lg font-bold">تکالیف موجود</h2>
              </div>
              <p className="mt-2 text-xs leading-6 text-[#a9a297] sm:text-sm">
                برای افزودن هر تکلیف به فهرست جلسه بعد، دکمه انتخاب را بزن.
              </p>
            </div>
            <span className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-2 text-sm font-bold tabular-nums text-[#e5dccc]">
              {availableHomework.length}
            </span>
          </div>

          {availableHomework.length === 0 ? (
            <div className="px-5 py-12 text-center sm:px-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.07] text-[#d6b77d]">
                <TomorrowIcon name="check" size={27} />
              </div>
              <h3 className="font-semibold">همه تکالیف انتخاب شده‌اند</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[#a9a297]">
                در حال حاضر تکلیف دیگری برای انتخاب باقی نمانده است.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {availableHomework.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 px-5 py-5 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {item.is_red && (
                        <span className="rounded-md border border-red-400/20 bg-red-500/[0.08] px-2 py-1 text-[11px] font-medium text-red-300">
                          مهم
                        </span>
                      )}
                      <span className="text-xs text-[#9f978a]">
                        مهلت: {item.due_date}
                      </span>
                    </div>
                    <h3 className="break-words font-semibold leading-7 text-[#f1e9dc]">
                      {item.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading === item.id}
                    onClick={() => handleAddToTomorrow(item.id)}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#c9a96a]/30 bg-[#c9a96a]/[0.09] px-4 py-2.5 text-sm font-medium text-[#e0c58f] transition hover:bg-[#c9a96a]/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <TomorrowIcon name="plus" size={17} />
                    {actionLoading === item.id ? 'در حال انجام...' : 'انتخاب برای جلسه بعد'}
                  </button>
                </article>
              ))}
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
  )
}

