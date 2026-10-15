'use client'

import { type FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function RegisterIcon({
  name,
  size = 21,
}: {
  name: 'user' | 'phone' | 'shield' | 'arrow' | 'alert' | 'check'
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
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M19 12H5m7-7-7 7 7 7" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 9v4m0 4h.01" />
          <path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      )
  }
}

export default function RegisterPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function createStudentSession(mobile: string) {
    try {
      const response = await fetch('/api/student-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: mobile }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        console.error('CREATE STUDENT SESSION ERROR:', data)
        return false
      }

      return true
    } catch (sessionError) {
      console.error('CREATE STUDENT SESSION ERROR:', sessionError)
      return false
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading) return

    setError('')

    const name = fullName.trim()
    const mobile = phone.trim()

    if (name.length < 3) {
      setError('لطفاً نام و نام خانوادگی را کامل وارد کنید.')
      return
    }

    if (!/^09\d{9}$/.test(mobile)) {
      setError('شماره تماس باید با 09 شروع شود و دقیقاً 11 رقم باشد.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      await supabase.auth.signOut({ scope: 'local' })

      const { error: insertError } = await supabase
        .from('students')
        .insert({
          full_name: name,
          phone: mobile,
        })

      if (insertError) {
        console.error('REGISTER STUDENT ERROR:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        })

        if (insertError.code === '23505') {
          setError('این شماره تماس قبلاً ثبت شده است.')
        } else {
          setError('ثبت اطلاعات انجام نشد. لطفاً دوباره تلاش کنید.')
        }

        return
      }

      const sessionCreated = await createStudentSession(mobile)

      if (!sessionCreated) {
        setError(
          'اطلاعات شما ثبت شده، اما ورود کامل نشد. صفحه را دوباره بارگذاری نکنید؛ لطفاً یک بار دیگر تلاش کنید یا با مدیریت تماس بگیرید.'
        )
        return
      }

      try {
        localStorage.setItem(
          'taklif-man-student',
          JSON.stringify({
            fullName: name,
            phone: mobile,
          })
        )
      } catch (storageError) {
        console.error('SAVE STUDENT DISPLAY DATA ERROR:', storageError)
      }

      router.replace('/')
      router.refresh()
    } catch (submitError) {
      console.error('REGISTER ERROR:', submitError)
      setError('ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-4 py-8 text-[#f5f0e7] sm:px-6"
      dir="rtl"
    >
      <div className="pointer-events-none absolute -top-40 right-[-100px] h-[400px] w-[400px] rounded-full bg-[#c9a96a]/[0.10] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-180px] left-[-100px] h-[380px] w-[380px] rounded-full bg-[#c9a96a]/[0.06] blur-[120px]" />

      <div className="relative w-full max-w-md">
        <header className="mb-7 flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c9a96a]/35 bg-[#c9a96a]/[0.09] text-lg font-bold tracking-wider text-[#d9bd87] shadow-lg shadow-[#c9a96a]/[0.04]">
            TM
          </div>

          <div>
            <p className="text-xs text-[#a9a297]">
              سامانه تکالیف کلاس
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              تکلیف من
            </h1>
          </div>
        </header>

        <section className="rounded-[28px] border border-white/[0.09] bg-[#10100f]/95 p-5 shadow-2xl shadow-black/40 sm:p-8">
          <div className="mb-7">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9a96a]/25 bg-[#c9a96a]/[0.07] px-3 py-1.5 text-xs text-[#d9bd87]">
              <RegisterIcon name="check" size={14} />
              خوش آمدید
            </span>

            <h2 className="text-2xl font-bold leading-relaxed sm:text-[27px]">
              قبل از شروع،
              <br />
              خودت را معرفی کن.
            </h2>

            <p className="mt-3 text-sm leading-7 text-[#a9a297]">
              اطلاعاتت برای شناسایی اعضای کلاس و دسترسی به تکالیف ثبت می‌شود.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-[#e5ddcf]"
              >
                نام و نام خانوادگی
              </label>

              <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-[#080808] px-4 transition focus-within:border-[#c9a96a]/50 focus-within:ring-2 focus-within:ring-[#c9a96a]/10">
                <span className="shrink-0 text-[#c9a96a]">
                  <RegisterIcon name="user" size={20} />
                </span>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="نام و نام خانوادگی"
                  autoComplete="name"
                  autoFocus
                  required
                  maxLength={100}
                  disabled={loading}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[#f5f0e7] outline-none placeholder:text-[#716b61] disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-[#e5ddcf]"
              >
                شماره تماس
              </label>

              <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-[#080808] px-4 transition focus-within:border-[#c9a96a]/50 focus-within:ring-2 focus-within:ring-[#c9a96a]/10">
                <span className="shrink-0 text-[#c9a96a]">
                  <RegisterIcon name="phone" size={19} />
                </span>

                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  value={phone}
                  onChange={(event) => {
                    const value = event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 11)

                    setPhone(value)
                  }}
                  placeholder="09123456789"
                  autoComplete="tel"
                  dir="ltr"
                  required
                  disabled={loading}
                  className="min-w-0 flex-1 bg-transparent py-3 text-left text-sm tracking-wider text-[#f5f0e7] outline-none placeholder:text-[#716b61] disabled:opacity-60"
                />
              </div>

              <p className="mt-2 text-xs leading-6 text-[#898174]">
                شماره باید با 09 شروع شود و دقیقاً 11 رقم باشد.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/[0.07] p-4 text-sm leading-7 text-red-300"
              >
                <span className="mt-1 shrink-0">
                  <RegisterIcon name="alert" size={18} />
                </span>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-[#d9bd87]/40 bg-[#c9a96a] px-5 py-3 text-sm font-bold text-[#17120a] shadow-lg shadow-[#c9a96a]/[0.08] transition hover:bg-[#d7b979] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                {loading ? 'در حال ثبت اطلاعات...' : 'ورود به تکلیف من'}
              </span>

              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#17120a]/25 border-t-[#17120a]" />
              ) : (
                <RegisterIcon name="arrow" size={20} />
              )}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
            <span className="mt-0.5 shrink-0 text-[#c9a96a]">
              <RegisterIcon name="shield" size={19} />
            </span>

            <p className="text-xs leading-7 text-[#a9a297]">
              اطلاعاتت برای شناسایی اعضای کلاس استفاده می‌شود. شماره تماس را
              درست وارد کن تا دسترسی به حساب خودت برقرار شود.
            </p>
          </div>
        </section>

        <footer className="pt-7 text-center text-xs text-[#777166]">
          طراحی شده توسط امید اوقانی
        </footer>
      </div>
    </main>
  )
}