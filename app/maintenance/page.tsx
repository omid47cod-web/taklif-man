
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type MaintenancePageProps = {
  searchParams: Promise<{
    temporary?: string
  }>
}

export default async function MaintenancePage({
  searchParams,
}: MaintenancePageProps) {
  const params = await searchParams
  const isTemporaryError = params.temporary === '1'

  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'get_global_access_status'
  )

  const status = Array.isArray(data) ? data[0] : data

  // اگر سامانه دوباره فعال شده باشد،
  // کاربر به صفحه اصلی می‌رود تا نشست قبلی بررسی شود.
  if (
    !isTemporaryError &&
    !error &&
    status?.enabled !== true
  ) {
    redirect('/')
  }

  const title = isTemporaryError
    ? 'بررسی حساب شما موقتاً امکان‌پذیر نیست.'
    : 'ارتباط با این اپلیکیشن توسط مدیریت قطع شده است!'

  const reason = isTemporaryError
    ? 'در حال حاضر امکان بررسی نشست شما وجود ندارد. لطفاً کمی بعد دوباره مراجعه کنید.'
    : error
      ? 'در حال حاضر امکان بررسی وضعیت سامانه وجود ندارد.'
      : status?.reason ||
        'دسترسی دانش‌آموزان موقتاً غیرفعال شده است.'

  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f7f8] px-5 py-12 text-[#173b50]"
    >
      <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-[#0d9488]/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-[#173b50]/10 blur-3xl" />

      <section className="relative w-full max-w-lg rounded-[32px] border border-[#dce8e9] bg-white p-7 text-center shadow-[0_20px_80px_rgba(23,59,80,0.08)] sm:p-10">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#e8f5f3] text-[#0d9488]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-10 w-10"
          >
            <rect x="4" y="10" width="16" height="11" rx="2.5" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            <path d="M12 14v3" />
          </svg>
        </div>

        <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#0d9488]">
          TAKLIF MAN
        </p>

        <h1 className="text-2xl font-extrabold leading-10 text-[#173b50] sm:text-3xl">
          {title}
        </h1>

        <div className="mt-8 rounded-2xl border border-[#f0dfbd] bg-[#fffaf0] p-5 text-right">
          <p className="text-xs font-bold text-[#a87935]">
            {isTemporaryError ? 'وضعیت سامانه' : 'دلیل قطع ارتباط'}
          </p>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-[#5d5140]">
            {reason}
          </p>
        </div>

        <p className="mt-8 text-sm leading-7 text-[#71858e]">
          لطفاً بعداً دوباره مراجعه کنید.
        </p>

        <div className="mt-9 border-t border-[#edf1f2] pt-5 text-xs text-[#9aabb1]">
          تکلیف من
        </div>
      </section>
    </main>
  )
}
