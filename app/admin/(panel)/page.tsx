import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminActionLink from '@/components/admin/AdminActionLink'

function AdminIcon({ name }: { name: string }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  switch (name) {
    case 'check':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      )

    case 'users':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="10" cy="7" r="4" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )

    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )

    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
      )

    case 'message':
      return (
        <svg {...common}>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          <path d="M8 9h8M8 13h5" />
        </svg>
      )

    default:
      return null
  }
}

const actionItems = [
{
href: '/admin/homework',
title: 'مدیریت تکالیف',
description: 'افزودن، ویرایش و حذف تکالیف کلاس',
icon: 'edit',
primary: true,
},
{
href: '/admin/tomorrow-homework',
title: 'تکالیف فردا',
description: 'انتخاب تکالیفی که باید برای فردا نمایش داده شوند',
icon: 'clock',
primary: false,
},
{
href: '/admin/students',
title: 'دانش‌آموزان',
description: 'مشاهده فهرست افراد ثبت‌نام‌شده',
icon: 'users',
primary: false,
},

{
  href: '/admin/task-requests',
  title: 'درخواست تکالیف',
  description: 'مشاهده درخواست‌های دانش‌آموزان و ارسال پاسخ همراه با تصویر',
  icon: 'message',
  primary: true,
},

{
href: '/admin/support',
title: 'ارتباط با دانش‌آموزان',
description: 'مشاهده و پاسخ به پیام‌های خصوصی دانش‌آموزان',
icon: 'message',
primary: true,
},
{
href: '/admin/group-chat',
title: 'چت گروهی',
description: 'مشاهده و مدیریت پیام‌های گروهی دانش‌آموزان',
icon: 'message',
primary: true,
},
]


export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims()

  if (claimsError || !claimsData?.claims?.sub) {
    redirect('/admin/login')
  }

  const userId = claimsData.claims.sub

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!admin) {
    redirect('/admin/login')
  }

  const [
    { count: homeworkCount },
    { count: studentsCount },
    { count: tomorrowHomeworkCount },
  ] = await Promise.all([
    supabase
      .from('homework')
      .select('*', { count: 'exact', head: true }),

    supabase
      .from('students')
      .select('*', { count: 'exact', head: true }),

    supabase
      .from('tomorrow_homework')
      .select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      title: 'تکالیف ثبت‌شده',
      count: homeworkCount ?? 0,
      icon: 'check',
    },
    {
      title: 'دانش‌آموزان',
      count: studentsCount ?? 0,
      icon: 'users',
    },
    {
      title: 'تکالیف فردا',
      count: tomorrowHomeworkCount ?? 0,
      icon: 'clock',
    },
  ]

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#050505] text-white"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#c9a96a]/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-white/[0.04] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.045),transparent_42%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8 sm:py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#c9a96a]/25 bg-[#c9a96a]/10 text-lg text-[#c9a96a] shadow-[0_0_30px_rgba(201,169,106,0.08)]">
                ت
              </div>

              <div>
                <p className="text-[11px] font-medium tracking-[0.25em] text-white/35">
                  TAKLIF MAN
                </p>
                <p className="text-sm font-medium text-white/75">
                  پنل مدیریت سامانه
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-xs text-white/55 transition hover:border-[#c9a96a]/30 hover:text-[#c9a96a]"
            >
              صفحه اصلی
            </Link>
          </div>

          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9a96a]/20 bg-[#c9a96a]/[0.07] px-3 py-1.5 text-[11px] font-medium text-[#c9a96a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9a96a]" />
              مدیریت سامانه
            </span>

            <h1 className="text-4xl font-bold leading-[1.25] tracking-tight text-white sm:text-5xl">
              سلام، <span className="text-[#c9a96a]">امید</span>
              <br />
              امروز چه کاری داری؟
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-[15px]">
              از اینجا می‌توانی تکالیف کلاس و دانش‌آموزان را مدیریت کنی.
            </p>
          </div>
        </header>

        {/* Statistics */}
        <section className="mb-10">
          <div className="mb-5">
            <p className="text-xs font-medium tracking-wide text-white/30">
              گزارش سامانه
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white/90">
              وضعیت کلی کلاس
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <article
                key={stat.title}
                className="group flex items-center gap-4 rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5 transition-all duration-300 hover:border-[#c9a96a]/25 hover:bg-white/[0.055]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.08] text-[#c9a96a] transition-colors group-hover:bg-[#c9a96a]/[0.14]">
                  <AdminIcon name={stat.icon} />
                </div>

                <div>
                  <p className="text-xs text-white/40">
                    {stat.title}
                  </p>
                  <strong className="mt-1 block text-2xl font-bold tabular-nums text-white">
                    {stat.count.toLocaleString('fa-IR')}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Management menu */}
        <section className="flex-1">
          <div className="mb-5">
            <p className="text-xs font-medium tracking-wide text-white/30">
              دسترسی سریع
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white/90">
              چه کاری می‌خواهی انجام دهی؟
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {actionItems.map((item) => (
              <AdminActionLink
                key={item.href}
                href={item.href}
                className={`group relative overflow-hidden rounded-[24px] border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)] active:scale-[0.99] ${
                  item.primary
                    ? 'border-[#c9a96a]/20 bg-[#c9a96a]/[0.045] hover:border-[#c9a96a]/40 hover:bg-[#c9a96a]/[0.075]'
                    : 'border-white/[0.08] bg-white/[0.035] hover:border-[#c9a96a]/30 hover:bg-white/[0.055]'
                }`}
              >
                <div className="absolute inset-y-0 right-0 w-1 bg-[#c9a96a] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.08] text-[#c9a96a] transition-colors group-hover:bg-[#c9a96a]/[0.14]">
                    <AdminIcon name={item.icon} />
                  </div>

                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.07] text-sm text-white/25 transition-all group-hover:-translate-x-1 group-hover:border-[#c9a96a]/20 group-hover:text-[#c9a96a]">
                    ←
                  </span>
                </div>

                <h3 className="text-[15px] font-semibold text-white/90">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs leading-6 text-white/35">
                  {item.description}
                </p>
              </AdminActionLink>
            ))}
          </div>
        </section>

        {/* Access information */}
        <section className="mt-10 flex items-start gap-4 rounded-[24px] border border-[#c9a96a]/15 bg-[#c9a96a]/[0.045] p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.08] text-sm font-semibold text-[#c9a96a]">
            i
          </div>

          <div>
            <strong className="text-sm font-semibold text-white/85">
              دسترسی مدیر فعال است
            </strong>

            <p className="mt-2 text-xs leading-6 text-white/40">
              این صفحه فقط برای حسابی که به عنوان مدیر سامانه ثبت شده قابل مشاهده است.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 flex items-center justify-between border-t border-white/[0.06] pt-5 text-[11px] text-white/25">
          <span>تکلیف من</span>

          <div className="flex items-center gap-2">
            <span>پنل مدیریت</span>
            <span className="text-[#c9a96a]/50">•</span>
            <span className="text-white/40">امید اوقانی</span>
          </div>
        </footer>
      </div>
    </main>
  )
}
