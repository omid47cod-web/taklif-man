
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Homework = {
  id: string
  title: string
  due_date: string | null
  is_red: boolean
  created_at: string
}

function Icon({
  name,
  size = 20,
}: {
  name: 'back' | 'book' | 'calendar' | 'star' | 'arrow' | 'refresh' | 'check'
  size?: number
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  switch (name) {
    case 'back':
      return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>

    case 'book':
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
          <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20M8 7h8M8 10h6" />
        </svg>
      )

    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="15" rx="3" />
          <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" />
        </svg>
      )

    case 'star':
      return (
        <svg {...common}>
          <path d="m12 3 2.75 5.58 6.16.9-4.45 4.34 1.05 6.13L12 17.06l-5.51 2.89 1.05-6.13-4.45-4.34 6.16-.9L12 3Z" />
        </svg>
      )

    case 'arrow':
      return <svg {...common}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>

    case 'refresh':
      return (
        <svg {...common}>
          <path d="M20 7v5h-5M4 17v-5h5" />
          <path d="M5.6 9a7 7 0 0 1 11.7-2L20 12M4 12l2.7 5a7 7 0 0 0 11.7-2" />
        </svg>
      )

    case 'check':
      return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>
  }
}

function formatDate(date: string | null) {
  if (!date?.trim()) return 'بدون مهلت مشخص'

  const value = date.trim()

  if (/[آ-ی]/.test(value)) {
    return value
  }

  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}

export default function HomeworkPage() {
  const router = useRouter()

  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHomework = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { data, error: queryError } = await supabase
        .from('homework')
        .select('id, title, due_date, is_red, created_at')
        .order('created_at', { ascending: false })

      if (queryError) throw queryError

      setHomework((data ?? []) as Homework[])
    } catch {
      setError('دریافت تکالیف انجام نشد. اتصال اینترنت را بررسی و دوباره تلاش کن.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const student = localStorage.getItem('taklif-man-student')

    if (!student) {
      router.replace('/register')
      return
    }

    void loadHomework()
  }, [router, loadHomework])

  return (
    <main className="homework-page" dir="rtl">
      <div className="page-decoration" aria-hidden="true" />

      <div className="container">
        <header className="topbar">
          <button
            type="button"
            className="back-button"
            onClick={() => router.back()}
            aria-label="بازگشت"
          >
            <Icon name="back" />
          </button>

          <div className="brand">
            <div className="brand-logo">
              <Icon name="book" size={22} />
            </div>

            <div className="brand-text">
              <span className="brand-name">تکلیف من</span>
              <span className="brand-en">TAKLIF MAN</span>
            </div>
          </div>

          <div className="brand-status" title="تکلیف من">
            <span />
          </div>
        </header>

        <section className="page-heading">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            فضای آموزشی شما
          </div>

          <h1>
            تکالیف <span>جاری</span>
          </h1>

          <p className="intro">
            تکالیف کلاس را ببین و جزئیات هرکدام را بررسی کن.
          </p>
        </section>

        <section className="list-section">
          <div className="list-heading">
            <div className="list-heading-title">
              <div className="heading-icon">
                <Icon name="book" size={19} />
              </div>

              <div>
                <h2>فهرست تکالیف</h2>
                <p>آخرین تکالیف ثبت‌شده</p>
              </div>
            </div>

            <div className="count-pill" aria-live="polite">
              {loading ? (
                <span className="count-dot" />
              ) : (
                <>
                  <span className="count-number">
                    {homework.length.toLocaleString('fa-IR')}
                  </span>
                  <span>تکلیف</span>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div className="homework-list" aria-label="در حال بارگذاری تکالیف">
              {[1, 2, 3, 4].map((item) => (
                <div className="skeleton-card" key={item}>
                  <div className="skeleton-icon shimmer" />

                  <div className="skeleton-body">
                    <div className="skeleton-line title-line shimmer" />
                    <div className="skeleton-line date-line shimmer" />
                  </div>

                  <div className="skeleton-arrow shimmer" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="state-card">
              <div className="state-icon">
                <Icon name="refresh" size={25} />
              </div>

              <h3>بارگذاری تکالیف ناموفق بود</h3>
              <p>{error}</p>

              <button
                type="button"
                className="retry-button"
                onClick={() => void loadHomework()}
              >
                <Icon name="refresh" size={17} />
                تلاش دوباره
              </button>
            </div>
          ) : homework.length === 0 ? (
            <div className="state-card empty-state">
              <div className="empty-illustration">
                <div className="empty-circle">
                  <Icon name="book" size={30} />
                </div>

                <span className="empty-star star-one">✦</span>
                <span className="empty-star star-two">✧</span>
              </div>

              <h3>فعلاً تکلیفی نداری!</h3>

              <p>
                هر وقت تکلیف جدیدی ثبت شود، اینجا نمایش داده می‌شود.
              </p>

              <div className="empty-note">
                <Icon name="check" size={15} />
                <span>همه‌چیز مرتب است</span>
              </div>
            </div>
          ) : (
            <div className="homework-list">
              {homework.map((item, index) => (
                <button
                  type="button"
                  className={`homework-card ${item.is_red ? 'important-card' : ''}`}
                  key={item.id}
                  onClick={() => router.push(`/homework/${item.id}`)}
                  aria-label={`مشاهده تکلیف ${item.title}`}
                >
                  <div className={`assignment-icon ${item.is_red ? 'important-icon' : ''}`}>
                    <Icon name={item.is_red ? 'star' : 'book'} size={19} />
                  </div>

                  <div className="assignment-content">
                    <div className="assignment-title-row">
                      <h3>{item.title}</h3>

                      {item.is_red && (
                        <span className="important-badge">مهم</span>
                      )}
                    </div>

                    <div className="assignment-date">
                      <Icon name="calendar" size={14} />
                      <span>{formatDate(item.due_date)}</span>
                    </div>
                  </div>

                  <div className="assignment-arrow">
                    <Icon name="back" size={17} />
                  </div>

                  <span className="assignment-number">
                    {(index + 1).toLocaleString('fa-IR')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {!loading && !error && homework.length > 0 && (
          <div className="bottom-note">
            <span className="bottom-note-icon">
              <Icon name="check" size={14} />
            </span>

            برای مشاهده جزئیات، تکلیف موردنظرت را انتخاب کن.
          </div>
        )}

        <footer className="footer">
          <div className="footer-rule" />

          <div className="footer-brand">
            <span className="footer-star">✦</span>
            <span>تکلیف من</span>
          </div>

          <p>همه تکالیف کلاس، ساده و همیشه در دسترس.</p>
        </footer>
      </div>

      <style jsx>{`
        .homework-page {
          --navy: #173b50;
          --navy-dark: #102f42;
          --teal: #0d9488;
          --teal-light: #e5f5f2;
          --background: #f3f7f8;
          --surface: #ffffff;
          --text: #193748;
          --muted: #71818a;
          --border: #e5edef;

          position: relative;
          isolation: isolate;
          min-height: 100vh;
          overflow: hidden;
          padding: 22px 18px 28px;
          background: var(--background);
          color: var(--text);
          font-family: var(--font-vazirmatn), Tahoma, sans-serif;
        }

        .page-decoration {
          position: absolute;
          z-index: -1;
          top: -190px;
          right: 50%;
          width: 490px;
          height: 360px;
          transform: translateX(50%);
          border-radius: 50%;
          background: rgba(13, 148, 136, 0.07);
          filter: blur(85px);
          pointer-events: none;
        }

        .container {
          width: 100%;
          max-width: 660px;
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          align-items: center;
          gap: 12px;
          min-height: 46px;
        }

        .back-button {
          display: grid;
          flex-shrink: 0;
          place-items: center;
          width: 40px;
          height: 40px;
          padding: 0;
          color: var(--navy);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .back-button:hover {
          background: #eaf5f4;
          border-color: #b7ded9;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-right: auto;
        }

        .brand-logo {
          display: grid;
          place-items: center;
          width: 40px;
          height: 40px;
          color: #fff;
          background: linear-gradient(145deg, #1d5269, #0d9488);
          border-radius: 12px;
          box-shadow: 0 5px 12px rgba(13, 148, 136, 0.15);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .brand-name {
          color: var(--navy);
          font-size: 13px;
          font-weight: 900;
        }

        .brand-en {
          color: #7c929b;
          font-family: Arial, sans-serif;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1.5px;
          direction: ltr;
        }

        .brand-status {
          display: grid;
          place-items: center;
          width: 29px;
          height: 29px;
          border: 1px solid #dce9eb;
          border-radius: 50%;
        }

        .brand-status span {
          width: 7px;
          height: 7px;
          background: var(--teal);
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1);
        }

        .page-heading {
          padding: 38px 0 29px;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--teal);
          font-size: 11px;
          font-weight: 700;
        }

        .eyebrow-line {
          width: 19px;
          height: 2px;
          background: var(--teal);
          border-radius: 2px;
        }

        .page-heading h1 {
          margin: 10px 0 5px;
          color: var(--navy);
          font-size: clamp(29px, 6vw, 36px);
          font-weight: 900;
          line-height: 1.5;
          letter-spacing: -0.7px;
        }

        .page-heading h1 span {
          color: var(--teal);
        }

        .intro {
          margin: 0;
          color: var(--muted);
          font-size: 12px;
          line-height: 2;
        }

        .list-section {
          padding: 17px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          box-shadow: 0 8px 30px rgba(23, 59, 80, 0.045);
        }

        .list-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 15px;
        }

        .list-heading-title {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .heading-icon {
          display: grid;
          flex-shrink: 0;
          place-items: center;
          width: 38px;
          height: 38px;
          color: var(--teal);
          background: var(--teal-light);
          border-radius: 12px;
        }

        .list-heading h2 {
          margin: 0;
          color: var(--navy);
          font-size: 13px;
          font-weight: 900;
        }

        .list-heading p {
          margin: 4px 0 0;
          color: #89989e;
          font-size: 10px;
        }

        .count-pill {
          display: inline-flex;
          flex-shrink: 0;
          align-items: center;
          gap: 5px;
          min-height: 30px;
          padding: 0 10px;
          color: #62777f;
          background: #f1f7f7;
          border: 1px solid #e3eeee;
          border-radius: 9px;
          font-size: 10px;
        }

        .count-number {
          color: var(--teal);
          font-size: 12px;
          font-weight: 900;
        }

        .count-dot {
          width: 13px;
          height: 13px;
          border: 2px solid #d6e8e6;
          border-top-color: var(--teal);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .homework-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .homework-card {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          min-height: 68px;
          gap: 11px;
          padding: 10px 12px;
          overflow: hidden;
          color: inherit;
          text-align: right;
          background: #fff;
          border: 1px solid #e9eff0;
          border-radius: 13px;
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            transform 0.18s ease,
            box-shadow 0.18s ease;
          animation: enter 0.25s ease both;
        }

        .homework-card:hover {
          background: #f9fdfc;
          border-color: #b9ded9;
          box-shadow: 0 5px 15px rgba(13, 148, 136, 0.07);
          transform: translateY(-1px);
        }

        .homework-card:focus-visible,
        .back-button:focus-visible,
        .retry-button:focus-visible {
          outline: 2px solid var(--teal);
          outline-offset: 3px;
        }

        .important-card {
          background: #fffdf8;
          border-color: #f0dfb9;
        }

        .important-card:hover {
          background: #fffaf0;
          border-color: #e6c982;
        }

        .assignment-icon {
          display: grid;
          flex-shrink: 0;
          place-items: center;
          width: 39px;
          height: 39px;
          color: #287d7a;
          background: #eaf6f4;
          border: 1px solid #dcefeb;
          border-radius: 11px;
        }

        .important-icon {
          color: #b17b24;
          background: #fff4db;
          border-color: #f4e5c2;
        }

        .assignment-content {
          flex: 1;
          min-width: 0;
          padding: 1px 0;
        }

        .assignment-title-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
          margin-bottom: 5px;
        }

        .assignment-title-row h3 {
          margin: 0;
          color: var(--navy);
          font-size: 12px;
          font-weight: 800;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .important-badge {
          display: inline-flex;
          align-items: center;
          padding: 1px 7px;
          color: #a66f1c;
          background: #fff3d8;
          border: 1px solid #f1e0b8;
          border-radius: 6px;
          font-size: 9px;
          line-height: 1.7;
        }

        .assignment-date {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #84939a;
          font-size: 10px;
          line-height: 1.7;
        }

        .assignment-date :global(svg) {
          flex-shrink: 0;
          color: #0d9488;
        }

        .assignment-arrow {
          display: grid;
          flex-shrink: 0;
          place-items: center;
          width: 28px;
          height: 28px;
          color: #458e89;
          background: #f0f8f7;
          border-radius: 9px;
        }

        .assignment-arrow :global(svg) {
          transform: rotate(180deg);
        }

        .assignment-number {
          position: absolute;
          top: 4px;
          left: 8px;
          color: #b4c7c9;
          font-size: 8px;
          pointer-events: none;
        }

        .state-card {
          display: flex;
          align-items: center;
          flex-direction: column;
          padding: 32px 18px;
          text-align: center;
          background: #fbfdfd;
          border: 1px solid #e7eff0;
          border-radius: 14px;
        }

        .state-icon {
          display: grid;
          place-items: center;
          width: 49px;
          height: 49px;
          margin-bottom: 13px;
          color: var(--teal);
          background: var(--teal-light);
          border: 1px solid #d6eeea;
          border-radius: 15px;
        }

        .state-card h3 {
          margin: 0;
          color: var(--navy);
          font-size: 14px;
          font-weight: 900;
        }

        .state-card p {
          max-width: 330px;
          margin: 8px 0 0;
          color: #829198;
          font-size: 11px;
          line-height: 2;
        }

        .retry-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 38px;
          margin-top: 17px;
          padding: 0 14px;
          color: #fff;
          background: var(--teal);
          border: 1px solid var(--teal);
          border-radius: 9px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }

        .retry-button:hover {
          background: #087e74;
        }

        .empty-illustration {
          position: relative;
          display: grid;
          place-items: center;
          width: 88px;
          height: 82px;
          margin-bottom: 12px;
        }

        .empty-circle {
          display: grid;
          place-items: center;
          width: 58px;
          height: 58px;
          color: var(--teal);
          background: #e7f5f2;
          border: 1px solid #d5ebe7;
          border-radius: 18px;
          transform: rotate(-4deg);
        }

        .empty-star {
          position: absolute;
          color: #0d9488;
        }

        .star-one {
          top: 5px;
          right: 5px;
          font-size: 15px;
        }

        .star-two {
          bottom: 4px;
          left: 5px;
          color: #83b9b3;
          font-size: 18px;
        }

        .empty-note {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 17px;
          padding: 7px 10px;
          color: #16847b;
          background: #eaf6f3;
          border-radius: 8px;
          font-size: 10px;
        }

        .skeleton-card {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 68px;
          padding: 10px 12px;
          background: #fff;
          border: 1px solid #e9eff0;
          border-radius: 13px;
        }

        .skeleton-icon {
          flex-shrink: 0;
          width: 39px;
          height: 39px;
          border-radius: 11px;
        }

        .skeleton-body {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 9px;
        }

        .skeleton-line {
          height: 8px;
          border-radius: 5px;
        }

        .title-line {
          width: 53%;
        }

        .date-line {
          width: 32%;
          height: 6px;
        }

        .skeleton-arrow {
          width: 28px;
          height: 28px;
          border-radius: 9px;
        }

        .shimmer {
          background: linear-gradient(
            100deg,
            #edf2f2 25%,
            #e2ebeb 50%,
            #edf2f2 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        .bottom-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 14px;
          color: #84949a;
          font-size: 10px;
          line-height: 1.8;
          text-align: center;
        }

        .bottom-note-icon {
          display: grid;
          place-items: center;
          color: var(--teal);
        }

        .footer {
          display: flex;
          align-items: center;
          flex-direction: column;
          margin-top: 34px;
          text-align: center;
        }

        .footer-rule {
          width: 100%;
          height: 1px;
          margin-bottom: 17px;
          background: linear-gradient(
            90deg,
            transparent,
            #d7e5e6,
            transparent
          );
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--navy);
          font-size: 11px;
          font-weight: 900;
        }

        .footer-star {
          color: var(--teal);
          font-size: 12px;
        }

        .footer p {
          margin: 6px 0 0;
          color: #94a1a5;
          font-size: 10px;
          line-height: 1.8;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes shimmer {
          to {
            background-position: -200% 0;
          }
        }

        @keyframes enter {
          from {
            opacity: 0;
            transform: translateY(4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (min-width: 600px) {
          .homework-page {
            padding-top: 27px;
          }

          .page-heading {
            padding-top: 42px;
            padding-bottom: 32px;
          }

          .list-section {
            padding: 20px;
          }

          .homework-card {
            min-height: 71px;
            padding: 11px 14px;
          }
        }

        @media (max-width: 420px) {
          .homework-page {
            padding: 15px 12px 20px;
          }

          .page-heading {
            padding-top: 30px;
            padding-bottom: 23px;
          }

          .page-heading h1 {
            font-size: 30px;
          }

          .intro {
            font-size: 11px;
          }

          .list-section {
            padding: 12px;
            border-radius: 16px;
          }

          .list-heading {
            margin-bottom: 12px;
          }

          .homework-list {
            gap: 6px;
          }

          .homework-card {
            min-height: 63px;
            gap: 8px;
            padding: 9px;
            border-radius: 11px;
          }

          .assignment-icon {
            width: 34px;
            height: 34px;
            border-radius: 9px;
          }

          .assignment-title-row h3 {
            font-size: 11px;
          }

          .assignment-date {
            font-size: 9px;
          }

          .assignment-arrow {
            width: 25px;
            height: 25px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  )
}
