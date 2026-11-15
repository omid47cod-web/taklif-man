
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'

const SESSION_COOKIE = 'taklif-man-student-session'

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function LockIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="11" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 14v3" />
    </svg>
  )
}

function AlertIcon() {
  return (
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4m0 4h.01" />
    </svg>
  )
}

export default async function BlockedPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) {
    redirect('/register')
  }

  const tokenHash = hashToken(token)
  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'get_student_by_session',
    { p_token_hash: tokenHash }
  )

  if (error) {
    console.error('BLOCKED PAGE SESSION CHECK ERROR:', error)
    throw new Error('بررسی نشست دانش‌آموز انجام نشد.')
  }

  const student = Array.isArray(data) ? data[0] : data

  if (!student?.id) {
    redirect('/register')
  }

  if (student.is_blocked !== true) {
    redirect('/')
  }

  const reason =
    student.block_reason?.trim() ||
    'دلیل انسداد توسط مدیریت ثبت نشده است.'

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f7f8] px-4 py-10 text-[#173b50] sm:px-6"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-[#0d9488]/[0.07] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 -left-24 h-96 w-96 rounded-full bg-[#173b50]/[0.05] blur-3xl" />

      <section className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[#e2ebed] bg-white shadow-[0_18px_60px_rgba(23,59,80,0.09)]">
        {/* Top accent */}
        <div className="h-1.5 w-full bg-gradient-to-l from-[#0d9488] via-[#173b50] to-[#0d9488]" />

        <div className="px-5 py-9 sm:px-9 sm:py-11">
          {/* Status */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex h-[82px] w-[82px] items-center justify-center rounded-[26px] border border-red-100 bg-red-50 text-red-500">
              <LockIcon size={35} />
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              وضعیت حساب: مسدود
            </div>

            <h1 className="text-xl font-extrabold leading-relaxed tracking-tight text-[#173b50] sm:text-2xl">
              دسترسی شما مسدود شده است
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-7 text-[#71838b]">
              در حال حاضر امکان دسترسی به بخش‌های دانش‌آموزی برای حساب شما وجود ندارد.
            </p>
          </div>

          {/* Block reason */}
          <div className="mt-8 rounded-[22px] border border-[#dcece9] bg-[#f5fbfa] p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#cce7e2] bg-white text-[#0d9488]">
                <AlertIcon />
              </span>

              <div>
                <h2 className="text-sm font-extrabold text-[#173b50]">
                  دلیل انسداد حساب
                </h2>
                <p className="mt-1 text-[11px] text-[#84969c]">
                  توضیحات ثبت‌شده توسط مدیریت
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#e4eeee] bg-white px-4 py-3.5">
              <p className="break-words text-sm leading-8 text-[#526b75]">
                {reason}
              </p>
            </div>
          </div>

          {/* Guidance */}
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#e7edef] bg-[#f8fafb] p-4">
            <span className="mt-0.5 shrink-0 text-[#0d9488]">
              <AlertIcon />
            </span>

            <p className="text-xs leading-7 text-[#71838b]">
              اگر درباره این محدودیت پرسشی دارید یا فکر می‌کنید اشتباهی رخ داده است، برای پیگیری موضوع با مدیریت برنامه هماهنگ کنید.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#91a0a5]">
            <span className="text-[#0d9488]">✦</span>
            <span className="font-bold text-[#173b50]">تکلیف من</span>
            <span className="mx-1 text-[#d8e1e3]">|</span>
            <span>مدیریت دسترسی</span>
            <span className="text-[#0d9488]">✦</span>
          </div>
        </div>
      </section>
    </main>
  )
}
