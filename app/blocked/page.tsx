
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
      strokeWidth="1.6"
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
      strokeWidth="1.7"
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
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-4 py-10 text-[#f5f0e7] sm:px-6"
    >
      {/* نورهای پس‌زمینه هماهنگ با پنل مدیریت */}
      <div className="pointer-events-none absolute -top-36 right-[-100px] h-[360px] w-[360px] rounded-full bg-[#c9a96a]/[0.10] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-160px] left-[-100px] h-[360px] w-[360px] rounded-full bg-red-500/[0.045] blur-[120px]" />

      <section className="relative w-full max-w-lg overflow-hidden rounded-[30px] border border-white/[0.09] bg-[#10100f]/95 shadow-2xl shadow-black/40">
        {/* نوار بالایی */}
        <div className="h-1 w-full bg-gradient-to-l from-transparent via-[#c9a96a] to-transparent" />

        <div className="px-5 py-9 sm:px-9 sm:py-11">
          {/* آیکون و وضعیت */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-[86px] w-[86px] items-center justify-center rounded-[27px] border border-red-300/20 bg-red-400/[0.055] text-red-300 shadow-lg shadow-red-950/10">
              <LockIcon size={35} />
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-400/[0.055] px-3.5 py-2 text-xs font-medium text-red-300">
              <span className="h-1.5 w-1.5 rounded-full bg-red-300" />
              وضعیت حساب: مسدود
            </div>

            <h1 className="text-2xl font-extrabold leading-relaxed tracking-tight text-[#f5f0e7] sm:text-[28px]">
              دسترسی شما مسدود شده است
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-7 text-[#a9a297]">
              در حال حاضر امکان دسترسی به بخش‌های دانش‌آموزی برای حساب شما وجود ندارد.
            </p>
          </div>

          {/* دلیل انسداد */}
          <div className="mt-8 rounded-[22px] border border-[#c9a96a]/20 bg-[#c9a96a]/[0.035] p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.07] text-[#d6b77d]">
                <AlertIcon />
              </span>

              <div>
                <h2 className="text-sm font-bold text-[#e9d5ad]">
                  دلیل انسداد حساب
                </h2>
                <p className="mt-1 text-[11px] text-[#898174]">
                  توضیحات ثبت‌شده توسط مدیریت
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.055] bg-black/20 px-4 py-3.5">
              <p className="break-words text-sm leading-8 text-[#e2dbcf]">
                {reason}
              </p>
            </div>
          </div>

          {/* راهنما */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <span className="mt-0.5 shrink-0 text-[#c9a96a]">
              <AlertIcon />
            </span>
            <p className="text-xs leading-7 text-[#a9a297]">
              اگر درباره این محدودیت پرسشی دارید یا فکر می‌کنید اشتباهی رخ داده است، برای پیگیری موضوع با مدیریت برنامه هماهنگ کنید.
            </p>
          </div>

          {/* پابرگ */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#777166]">
            <span className="text-[#c9a96a]">✦</span>
            <span>تکلیف من</span>
            <span className="mx-1 text-white/15">|</span>
            <span>مدیریت دسترسی</span>
            <span className="text-[#c9a96a]">✦</span>
          </div>
        </div>
      </section>
    </main>
  )
}
