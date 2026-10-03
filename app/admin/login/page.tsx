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

    if (!saved) {
      return DEFAULT_LOCKOUT
    }

    const parsed = JSON.parse(saved) as LockoutState

    if (
      typeof parsed.failedAttempts !== 'number' ||
      typeof parsed.lockLevel !== 'number' ||
      typeof parsed.lockedUntil !== 'number'
    ) {
      return DEFAULT_LOCKOUT
    }

    if (parsed.lockedUntil && parsed.lockedUntil <= Date.now()) {
      return {
        ...parsed,
        lockedUntil: 0,
      }
    }

    return parsed
  } catch {
    return DEFAULT_LOCKOUT
  }
}

function saveLockout(state: LockoutState) {
  localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state))
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
        Math.ceil((saved.lockedUntil - Date.now()) / 1000)
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
        Math.ceil((lockout.lockedUntil - Date.now()) / 1000)
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
      remaining
    ).padStart(2, '0')}`
  }

  function registerFailedAttempt() {
    const current = readLockout()

    const failedAttempts = current.failedAttempts + 1

    if (failedAttempts >= 3) {
      const nextLevel = current.lockLevel + 1
      const durationSeconds = getLockDuration(nextLevel)
      const lockedUntil =
        Date.now() + durationSeconds * 1000

      const updated: LockoutState = {
        failedAttempts: 0,
        lockLevel: nextLevel,
        lockedUntil,
      }

      saveLockout(updated)
      setLockout(updated)
      setRemainingSeconds(durationSeconds)

      setError(
        `به دلیل سه ورود ناموفق، ورود شما موقتاً قفل شد.`
      )

      return
    }

    const updated: LockoutState = {
      ...current,
      failedAttempts,
      lockedUntil: 0,
    }

    saveLockout(updated)
    setLockout(updated)

    const remainingAttempts = 3 - failedAttempts

    setError(
      `ایمیل یا رمز عبور صحیح نیست. ${remainingAttempts} تلاش دیگر باقی مانده است.`
    )
  }

  function resetLockoutAfterSuccessfulLogin() {
    localStorage.removeItem(LOCKOUT_KEY)
    setLockout(DEFAULT_LOCKOUT)
    setRemainingSeconds(0)
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (isLocked) {
      return
    }

    setError('')

    if (!email.trim() || !password) {
      setError('لطفاً ایمیل و رمز عبور را وارد کنید.')
      return
    }

    setLoading(true)

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

    if (loginError || !data.user) {
      registerFailedAttempt()
      setLoading(false)
      setPassword('')
      return
    }

    resetLockoutAfterSuccessfulLogin()

    router.replace('/admin')
    router.refresh()
  }

  return (
    <main className="admin-login-page" dir="rtl">
      <div className="admin-login-glow admin-login-glow-one" />
      <div className="admin-login-glow admin-login-glow-two" />

      <div className="admin-login-container">
        <header className="admin-login-brand">
          <div className="admin-login-mark">
            <span>TM</span>
          </div>

          <div>
            <span className="admin-login-brand-small">
              مدیریت سامانه
            </span>

            <h1>تکلیف من</h1>
          </div>
        </header>

        <section className="admin-login-card">
          <div className="admin-login-card-top">
            <span className="admin-login-eyebrow">
              پنل مدیریت
            </span>

            <div className="admin-login-lock">
              <span>⌑</span>
            </div>
          </div>

          <h2>خوش آمدید</h2>

          <p className="admin-login-description">
            برای ورود به بخش مدیریت، اطلاعات حساب خود را وارد کنید.
          </p>

          <form
            onSubmit={handleSubmit}
            className="admin-login-form"
          >
            <div className="admin-login-field">
              <label htmlFor="admin-email">
                ایمیل مدیر
              </label>

              <div className="admin-login-input-wrapper">
                <span className="admin-login-input-icon">
                  @
                </span>

                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  dir="ltr"
                  placeholder="ایمیل مدیر"
                  disabled={loading || isLocked}
                />
              </div>
            </div>

            <div className="admin-login-field">
              <label htmlFor="admin-password">
                رمز عبور
              </label>

              <div className="admin-login-input-wrapper">
                <span className="admin-login-input-icon">
                  •
                </span>

                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  dir="ltr"
                  placeholder={
                    isLocked
                      ? 'ورود موقتاً قفل است'
                      : 'رمز عبور خود را وارد کنید'
                  }
                  disabled={loading || isLocked}
                />

                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  disabled={isLocked}
                >
                  {showPassword ? 'مخفی' : 'نمایش'}
                </button>
              </div>
            </div>

            {isLocked ? (
              <div className="admin-login-lockout">
                <div className="admin-lockout-icon">
                  ⏱
                </div>

                <div className="admin-lockout-content">
                  <strong>
                    ورود موقتاً قفل شده است
                  </strong>

                  <span>
                    پس از پایان زمان، دوباره می‌توانید تلاش کنید.
                  </span>
                </div>

                <div className="admin-lockout-timer">
                  {formatTimer(remainingSeconds)}
                </div>
              </div>
            ) : (
              error && (
                <div className="admin-login-error">
                  <span>!</span>
                  <p>{error}</p>
                </div>
              )
            )}

            <button
              type="submit"
              className="admin-login-submit"
              disabled={loading || isLocked}
            >
              {loading ? (
                <>
                  <span className="admin-login-spinner" />
                  در حال بررسی...
                </>
              ) : isLocked ? (
                <>
                  ورود قفل است
                  <span>◷</span>
                </>
              ) : (
                <>
                  ورود به پنل
                  <span>←</span>
                </>
              )}
            </button>
          </form>

          <div className="admin-login-security">
            <span className="admin-security-dot" />

            <span>
              این بخش فقط برای مدیر سامانه قابل دسترسی است.
            </span>
          </div>
        </section>

        <footer className="admin-login-footer">
          تکلیف من
          <span>•</span>
          پنل مدیریت
        </footer>
      </div>
    </main>
  )
}