'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const LOCKOUT_KEY = 'taklif-man-admin-lockout'

type LockoutState = {
  failedAttempts: number
  lockLevel: number
  lockedUntil: number
}

const DEFAULT_LOCKOUT: LockoutState = {
  failedAttempts: 0,
  lockLevel: 0,
  lockedUntil: 0,
}

function getLockDuration(level: number) {
  return level * 30
}

function readLockout(): LockoutState {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCKOUT
  }

  try {
    const saved = localStorage.getItem(LOCKOUT_KEY)

    if (!saved) return DEFAULT_LOCKOUT

    const parsed = JSON.parse(saved) as LockoutState

    if (
      typeof parsed.failedAttempts !== 'number' ||
      typeof parsed.lockLevel !== 'number' ||
      typeof parsed.lockedUntil !== 'number' ||
      parsed.failedAttempts < 0 ||
      parsed.lockLevel < 0
    ) {
      return DEFAULT_LOCKOUT
    }

    if (parsed.lockedUntil && parsed.lockedUntil <= Date.now()) {
      return {
        ...parsed,
        lockedUntil: 0,
        failedAttempts: 0,
      }
    }

    return parsed
  } catch {
    return DEFAULT_LOCKOUT
  }
}

function saveLockout(state: LockoutState) {
  try {
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state))
  } catch {
    // ورود نباید صرفاً به دلیل در دسترس نبودن localStorage متوقف شود.
  }
}

function Icon({
  name,
  size = 22,
}: {
  name: 'shield' | 'mail' | 'lock' | 'eye' | 'clock' | 'arrow' | 'spark'
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
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    case 'mail':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...common}>
          <rect x="4" y="10" width="16" height="11" rx="3" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          <path d="M12 14v3" />
        </svg>
      )
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      )
    case 'spark':
      return (
        <svg {...common}>
          <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
          <path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" />
        </svg>
      )
  }
}

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('pulse.electronic112@gmail.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockout, setLockout] =
    useState<LockoutState>(DEFAULT_LOCKOUT)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(() => {
    const saved = readLockout()
    setLockout(saved)

    if (saved.lockedUntil > Date.now()) {
      setRemainingSeconds(
        Math.ceil((saved.lockedUntil - Date.now()) / 1000),
      )
    }
  }, [])

  useEffect(() => {
    if (!lockout.lockedUntil) {
      setRemainingSeconds(0)
      return
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil((lockout.lockedUntil - Date.now()) / 1000),
      )

      setRemainingSeconds(remaining)

      if (remaining <= 0) {
        const updated = {
          ...lockout,
          lockedUntil: 0,
          failedAttempts: 0,
        }

        setLockout(updated)
        saveLockout(updated)
        setError('')
      }
    }

    updateTimer()
    const interval = window.setInterval(updateTimer, 1000)

    return () => window.clearInterval(interval)
  }, [lockout])

  const isLocked = remainingSeconds > 0

  function formatTimer(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remaining = seconds % 60

    return `${String(minutes).padStart(2, '0')}:${String(
      remaining,
    ).padStart(2, '0')}`
  }

  function registerFailedAttempt() {
    const current = readLockout()
    const failedAttempts = current.failedAttempts + 1

    if (failedAttempts >= 3) {
      const nextLevel = current.lockLevel + 1
      const durationSeconds = getLockDuration(nextLevel)

      const updated: LockoutState = {
        failedAttempts: 0,
        lockLevel: nextLevel,
        lockedUntil: Date.now() + durationSeconds * 1000,
      }

      saveLockout(updated)
      setLockout(updated)
      setRemainingSeconds(durationSeconds)
      setError('به دلیل سه ورود ناموفق، ورود شما موقتاً قفل شد.')
      return
    }

    const updated: LockoutState = {
      ...current,
      failedAttempts,
      lockedUntil: 0,
    }

    saveLockout(updated)
    setLockout(updated)

    setError(
      `ایمیل یا رمز عبور صحیح نیست. ${3 - failedAttempts} تلاش دیگر باقی مانده است.`,
    )
  }

  function resetLockoutAfterSuccessfulLogin() {
    try {
      localStorage.removeItem(LOCKOUT_KEY)
    } catch {
      // در صورت خطای ذخیره‌سازی، ورود موفق همچنان ادامه پیدا می‌کند.
    }

    setLockout(DEFAULT_LOCKOUT)
    setRemainingSeconds(0)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isLocked || loading) return

    setError('')

    if (!email.trim() || !password) {
      setError('لطفاً ایمیل و رمز عبور را وارد کنید.')
      return
    }

    setLoading(true)

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

      if (loginError || !data.user) {
        registerFailedAttempt()
        setPassword('')
        return
      }

      resetLockoutAfterSuccessfulLogin()
      router.replace('/admin')
      router.refresh()
    } catch {
      setError('ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-4 py-10 text-[#f4eee4] sm:px-6"
    >
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#c9a96a]/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#c9a96a]/[0.07] blur-[110px]" />

      <div className="relative z-10 w-full max-w-[440px]">
        <header className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c9a96a]/40 bg-[#c9a96a]/10 text-[#c9a96a] shadow-[0_0_35px_rgba(201,169,106,0.09)]">
            <Icon name="spark" size={28} />
          </div>

          <div>
            <p className="mb-1 text-xs font-medium tracking-[0.18em] text-[#c9a96a]">
              مدیریت سامانه
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              تکلیف من
            </h1>
          </div>
        </header>

        <section className="rounded-[28px] border border-white/[0.09] bg-[#101010]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#c9a96a]/20 bg-[#c9a96a]/[0.08] px-3 py-1.5 text-xs font-semibold text-[#d8bb80]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c9a96a]" />
                پنل مدیریت
              </span>
              <h2 className="mt-4 text-2xl font-bold text-white">
                خوش آمدید
              </h2>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.07] text-[#c9a96a]">
              <Icon name="shield" size={29} />
            </div>
          </div>

          <p className="mb-7 text-sm leading-7 text-white/50">
            برای ورود به بخش مدیریت، اطلاعات حساب خود را وارد کنید.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                ایمیل مدیر
              </label>

              <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-[#080808] px-4 transition focus-within:border-[#c9a96a]/60 focus-within:ring-2 focus-within:ring-[#c9a96a]/10">
                <span className="shrink-0 text-[#c9a96a]">
                  <Icon name="mail" size={20} />
                </span>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  dir="ltr"
                  placeholder="ایمیل مدیر"
                  disabled={loading || isLocked}
                  className="min-w-0 flex-1 bg-transparent text-left text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                رمز عبور
              </label>

              <div className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-[#080808] px-4 transition focus-within:border-[#c9a96a]/60 focus-within:ring-2 focus-within:ring-[#c9a96a]/10">
                <span className="shrink-0 text-[#c9a96a]">
                  <Icon name="lock" size={20} />
                </span>

                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  dir="ltr"
                  placeholder={
                    isLocked
                      ? 'ورود موقتاً قفل است'
                      : 'رمز عبور خود را وارد کنید'
                  }
                  disabled={loading || isLocked}
                  className="min-w-0 flex-1 bg-transparent text-left text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-50"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={isLocked}
                  aria-label={showPassword ? 'مخفی کردن رمز عبور' : 'نمایش رمز عبور'}
                  className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-[#c9a96a] transition hover:bg-[#c9a96a]/10 disabled:opacity-40"
                >
                  {showPassword ? 'مخفی' : 'نمایش'}
                </button>
              </div>
            </div>

            {isLocked ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                    <Icon name="clock" size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-amber-200">
                      ورود موقتاً قفل شده است
                    </p>
                    <p className="mt-1 text-xs leading-6 text-white/50">
                      پس از پایان زمان، دوباره می‌توانید تلاش کنید.
                    </p>
                  </div>

                  <span
                    dir="ltr"
                    className="rounded-xl border border-amber-300/20 bg-black/20 px-3 py-2 font-mono text-lg font-bold tabular-nums text-amber-200"
                  >
                    {formatTimer(remainingSeconds)}
                  </span>
                </div>
              </div>
            ) : (
              error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm leading-6 text-red-200"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-300/30 text-xs font-bold">
                    !
                  </span>
                  <p>{error}</p>
                </div>
              )
            )}

            <button
              type="submit"
              disabled={loading || isLocked}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#c9a96a] px-5 font-bold text-[#15110a] shadow-[0_8px_30px_rgba(201,169,106,0.12)] transition duration-200 hover:bg-[#dbc18b] hover:shadow-[0_8px_35px_rgba(201,169,106,0.2)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#15110a]/25 border-t-[#15110a]" />
                  در حال بررسی...
                </>
              ) : isLocked ? (
                <>
                  <Icon name="clock" size={20} />
                  ورود قفل است
                </>
              ) : (
                <>
                  ورود به پنل
                  <span className="transition-transform group-hover:-translate-x-1">
                    <Icon name="arrow" size={19} />
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="mt-7 flex items-start gap-3 border-t border-white/[0.07] pt-5">
            <span className="mt-0.5 shrink-0 text-[#c9a96a]/80">
              <Icon name="shield" size={18} />
            </span>
            <p className="text-xs leading-6 text-white/40">
              این بخش برای مدیریت سامانه است. اطلاعات حساب خود را در اختیار دیگران قرار ندهید.
            </p>
          </div>
        </section>

        <footer className="mt-6 flex items-center justify-center gap-2 text-xs text-white/30">
          <span>تکلیف من</span>
          <span className="text-[#c9a96a]/70">•</span>
          <span>پنل مدیریت</span>
        </footer>
      </div>
    </main>
  )
}