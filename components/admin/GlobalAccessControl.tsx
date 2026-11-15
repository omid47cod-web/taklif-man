
'use client'

import { useEffect, useState } from 'react'

type AccessStatus = {
  enabled: boolean
  reason: string
  updated_at: string | null
}

export default function GlobalAccessControl() {
  const [status, setStatus] = useState<AccessStatus>({
    enabled: false,
    reason: '',
    updated_at: null,
  })

  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  async function loadStatus() {
    try {
      const response = await fetch('/api/admin/global-access', {
        cache: 'no-store',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'دریافت اطلاعات ناموفق بود.')
      }

      setStatus(result)
      setReason(result.reason || '')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'خطا در دریافت اطلاعات.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  async function updateAccess(enabled: boolean) {
    setError('')
    setSuccess('')

    if (enabled && !reason.trim()) {
      setError('برای قطع دسترسی، ابتدا دلیل را بنویس.')
      return
    }

    const message = enabled
      ? 'آیا مطمئنی که می‌خواهی دسترسی تمام دانش‌آموزان قطع شود؟'
      : 'آیا می‌خواهی دسترسی دانش‌آموزان دوباره فعال شود؟'

    if (!window.confirm(message)) return

    setSaving(true)

    try {
      const response = await fetch('/api/admin/global-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled,
          reason: reason.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'تغییر وضعیت انجام نشد.')
      }

      setStatus({
        enabled: result.enabled,
        reason: result.reason,
        updated_at: new Date().toISOString(),
      })

      setSuccess(
        enabled
          ? 'دسترسی دانش‌آموزان با موفقیت قطع شد.'
          : 'دسترسی دانش‌آموزان دوباره فعال شد.'
      )
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'خطا در تغییر وضعیت.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section dir="rtl" className="mt-8">
      {/* دکمه اصلی */}
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-[#c9a96a]/20 bg-white/[0.035] p-5 text-right transition hover:border-[#c9a96a]/50 hover:bg-white/[0.06] sm:p-6"
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#c9a96a]/20 bg-[#c9a96a]/10 text-[#d6b779]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-6 w-6"
            >
              <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white sm:text-base">
              مدیریت دسترسی سراسری
            </h2>

            <p className="mt-2 text-xs leading-6 text-white/40">
              کنترل دسترسی تمام دانش‌آموزان به اپلیکیشن
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span
            className={`hidden rounded-full border px-3 py-2 text-[11px] font-semibold sm:inline-flex ${
              loading
                ? 'border-white/10 bg-white/5 text-white/40'
                : status.enabled
                  ? 'border-red-400/20 bg-red-400/10 text-red-300'
                  : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
            }`}
          >
            {loading
              ? 'در حال بررسی'
              : status.enabled
                ? 'دسترسی قطع است'
                : 'دسترسی فعال است'}
          </span>

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-5 w-5 text-white/50 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* تنظیمات؛ فقط هنگام کلیک نمایش داده می‌شوند */}
      {isOpen && (
        <div className="mt-4 rounded-[26px] border border-[#c9a96a]/20 bg-white/[0.035] p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-white">
              تنظیمات دسترسی کاربران
            </h3>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="بستن تنظیمات"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <span className="text-xs text-white/50">
              وضعیت فعلی سامانه
            </span>

            <span
              className={`rounded-full px-3 py-2 text-xs font-semibold ${
                loading
                  ? 'bg-white/5 text-white/40'
                  : status.enabled
                    ? 'bg-red-400/10 text-red-300'
                    : 'bg-emerald-400/10 text-emerald-300'
              }`}
            >
              {loading
                ? 'در حال بررسی...'
                : status.enabled
                  ? 'دسترسی قطع است'
                  : 'دسترسی فعال است'}
            </span>
          </div>

          <div className="mt-6">
            <label
              htmlFor="global-access-reason"
              className="mb-3 block text-xs font-medium text-white/60"
            >
              دلیل قطع دسترسی برای دانش‌آموزان
            </label>

            <textarea
              id="global-access-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="دلیل قطع ارتباط را اینجا بنویس..."
              disabled={loading || saving}
              className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a96a]/50 disabled:opacity-50"
            />

            <p className="mt-2 text-left text-[11px] text-white/30">
              {reason.length.toLocaleString('fa-IR')} از ۱۰۰۰ نویسه
            </p>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs leading-6 text-red-300">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs leading-6 text-emerald-300">
              {success}
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={loading || saving || status.enabled}
              onClick={() => updateAccess(true)}
              className="rounded-xl bg-red-500 px-5 py-3.5 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving
                ? 'در حال ذخیره...'
                : 'قطع دسترسی دانش‌آموزان'}
            </button>

            <button
              type="button"
              disabled={loading || saving || !status.enabled}
              onClick={() => updateAccess(false)}
              className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              فعال‌سازی مجدد دسترسی
            </button>
          </div>

          {status.updated_at && (
            <p className="mt-5 text-[11px] text-white/25">
              آخرین تغییر:{' '}
              {new Date(status.updated_at).toLocaleString('fa-IR')}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
