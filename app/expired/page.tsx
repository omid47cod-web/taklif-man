
import Link from 'next/link'

export default function ExpiredPage() {
  return (
    <main
      dir="rtl"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f5f2] px-4 py-8 text-[#493544] sm:px-6"
    >
      {/* پس‌زمینه تزئینی */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#ead8e1] opacity-60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#eee0c9] opacity-60 blur-3xl"
      />

      <section className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_24px_80px_-28px_rgba(73,53,68,0.24)] backdrop-blur-xl">
        {/* نوار بالای کارت */}
        <div className="h-1.5 w-full bg-gradient-to-l from-[#b79a68] via-[#a87991] to-[#493544]" />

        <div className="px-5 py-9 sm:px-10 sm:py-12">
          {/* نشان برنامه */}
          <div className="mb-7 flex justify-center">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#67475c] to-[#493544] shadow-lg shadow-[#493544]/20">
              <svg
                viewBox="0 0 80 80"
                className="h-16 w-16"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="19"
                  y="15"
                  width="42"
                  height="51"
                  rx="7"
                  fill="#F8F5F2"
                />
                <rect
                  x="25"
                  y="23"
                  width="30"
                  height="4"
                  rx="2"
                  fill="#B79A68"
                />
                <rect
                  x="25"
                  y="33"
                  width="25"
                  height="4"
                  rx="2"
                  fill="#B79A68"
                />
                <rect
                  x="25"
                  y="43"
                  width="20"
                  height="4"
                  rx="2"
                  fill="#B79A68"
                />
                <circle
                  cx="54"
                  cy="55"
                  r="15"
                  fill="#E7CDA0"
                  stroke="#493544"
                  strokeWidth="2"
                />
                <path
                  d="M49 50L59 60M59 50L49 60"
                  stroke="#493544"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>

              <span className="absolute -bottom-2 -left-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-[#b79a68] text-sm text-white">
                !
              </span>
            </div>
          </div>

          {/* عنوان */}
          <div className="text-center">
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#a87991]">
              TAKLIF MAN
            </p>

            <h1 className="text-2xl font-black leading-relaxed tracking-tight sm:text-3xl">
              این اپلیکیشن
              <span className="mt-1 block text-[#8d4667]">
                منقضی شده است
              </span>
            </h1>

            <div className="mx-auto my-6 flex items-center justify-center gap-3">
              <span className="h-px w-12 bg-[#d8c5a5]" />
              <span className="h-2 w-2 rotate-45 bg-[#b79a68]" />
              <span className="h-px w-12 bg-[#d8c5a5]" />
            </div>

            <p className="text-sm leading-8 text-gray-600 sm:text-base">
              نسخه دوم اپلیکیشن «تکلیف من» دیگر فعال نیست.
              برای دریافت نسخه سوم و استفاده از امکانات جدید،
              از طریق ایتا با من در ارتباط باشید.
            </p>
          </div>

          {/* اطلاعیه */}
          <div className="my-7 flex gap-3 rounded-2xl border border-[#eadde4] bg-[#faf5f7] p-4 text-right">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#8d4667] shadow-sm">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  d="M12 11v5M12 7.5h.01"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <h2 className="mb-1 text-sm font-extrabold">
                نسخه سوم در انتظار شماست
              </h2>
              <p className="text-xs leading-6 text-gray-600 sm:text-sm">
                برای دریافت نسخه جدید، روی دکمه زیر بزنید
                و از طریق پیام‌رسان ایتا درخواست خود را ارسال کنید.
              </p>
            </div>
          </div>

          {/* دکمه ایتا */}
          <Link
            href="https://eitaa.com/website_designer1"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-[#a87991]/40 bg-gradient-to-l from-[#493544] to-[#85516c] p-4 text-white shadow-lg shadow-[#493544]/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 sm:p-5"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                aria-hidden="true"
              >
                <path
                  d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 12h8M8 9h5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="flex-1 text-right">
              <span className="block text-base font-extrabold sm:text-lg">
                پیام دادن در ایتا
              </span>
              <span className="mt-1 block text-xs text-white/75">
                درخواست دریافت نسخه سوم
              </span>
            </div>

            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d="M19 12H5m7-7-7 7 7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          {/* پابرگ */}
          <footer className="mt-8 border-t border-[#eee6e9] pt-5 text-center">
            <p className="text-xs leading-6 text-gray-500">
              از همراهی شما سپاسگزاریم
            </p>
            <p className="mt-1 text-sm font-extrabold text-[#8d4667]">
              تکلیف من
              <span className="mx-1 text-[#b79a68]">✦</span>
            </p>
          </footer>
        </div>
      </section>
    </main>
  )
}
