'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Homework = {
  id: string
  title: string
  due_date: string | null
  content: string | null
  is_red: boolean
}

type TomorrowHomework = {
  homework_id: string
}

function Icon({
  name,
  size = 18,
}: {
  name: 'arrow' | 'calendar' | 'star' | 'book' | 'refresh' | 'alert' | 'check'
  size?: number
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true as const,
  }

  switch (name) {
    case 'arrow':
      return (
        <svg {...common}>
          <path
            d="M5 12H19M13 6L19 12L13 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )

    case 'calendar':
      return (
        <svg {...common}>
          <rect
            x="3.5"
            y="5"
            width="17"
            height="16"
            rx="3"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M7.5 3.5V7M16.5 3.5V7M3.5 10H20.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )

    case 'star':
      return (
        <svg {...common}>
          <path
            d="M12 3.5L14.6 9.1L20.5 9.8L16.1 13.8L17.3 19.7L12 16.7L6.7 19.7L7.9 13.8L3.5 9.8L9.4 9.1L12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      )

    case 'book':
      return (
        <svg {...common}>
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20V19H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M4 5.5V21.5M8 7H16M8 11H15"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )

    case 'refresh':
      return (
        <svg {...common}>
          <path
            d="M20 7V12H15M4 17V12H9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.6 9A7 7 0 0 1 18 6L20 12M4 12L6 18A7 7 0 0 0 18.4 15"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )

    case 'alert':
      return (
        <svg {...common}>
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M12 7.5V12.5M12 16.5H12.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )

    case 'check':
      return (
        <svg {...common}>
          <path
            d="M5 12.5L9.5 17L19 7"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
  }
}

function formatDate(date: string | null) {
  if (!date?.trim()) return 'تاریخ مشخص نشده'

  const value = date.trim()
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) return value

  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

export default function TomorrowHomeworkPage() {
  const router = useRouter()

  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHomework = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const student = window.localStorage.getItem('taklif-man-student')

      if (!student) {
        router.replace('/register')
        return
      }

      const supabase = createClient()

      const {
        data: selectedHomework,
        error: selectedError,
      } = await supabase
        .from('tomorrow_homework')
        .select('homework_id')
        .order('created_at', { ascending: false })

      if (selectedError) throw selectedError

      const selectedIds =
        (selectedHomework as TomorrowHomework[] | null)?.map(
          (item) => item.homework_id
        ) ?? []

      if (selectedIds.length === 0) {
        setHomework([])
        return
      }

      const {
        data,
        error: homeworkError,
      } = await supabase
        .from('homework')
        .select('id, title, due_date, content, is_red')
        .in('id', selectedIds)

      if (homeworkError) throw homeworkError

      const homeworkMap = new Map(
        (data ?? []).map((item) => [item.id, item as Homework])
      )

      const orderedHomework = selectedIds
        .map((id) => homeworkMap.get(id))
        .filter((item): item is Homework => Boolean(item))

      setHomework(orderedHomework)
    } catch (err) {
      console.error('Failed to load tomorrow homework:', err)
      setError('دریافت تکالیف با مشکل مواجه شد. دوباره تلاش کن.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadHomework()
  }, [loadHomework])

  const importantCount = homework.filter((item) => item.is_red).length

  return (
    <main className="page" dir="rtl">
      <div className="container">
        <header className="header">
          <button
            type="button"
            className="back-button"
            onClick={() => router.back()}
            aria-label="بازگشت"
          >
            <Icon name="arrow" />
          </button>

          <div className="brand-line">
            <span className="brand-mark" />
            <small>TAKLIF MAN</small>
          </div>

          <h1>تکالیف جلسه بعد</h1>
          <p>همه چیزهایی که برای جلسه بعد باید آماده کنی.</p>
        </header>

        {!loading && !error && homework.length > 0 && (
          <section className="overview" aria-label="خلاصه تکالیف">
            <div className="overview-icon">
              <Icon name="book" size={22} />
            </div>

            <div className="overview-text">
              <strong>{homework.length} تکلیف</strong>
              <span>
                {importantCount > 0
                  ? `${importantCount} تکلیف مهم برای توجه بیشتر`
                  : 'تکالیف انتخاب‌شده توسط مدیریت'}
              </span>
            </div>

            <div className="overview-count">
              <span>{String(homework.length).padStart(2, '0')}</span>
            </div>
          </section>
        )}

        {loading && (
          <section className="homework-list" aria-label="در حال بارگذاری">
            {[1, 2, 3].map((item) => (
              <div className="loading-card" key={item}>
                <div className="skeleton-line short" />
                <div className="skeleton-line long" />
                <div className="skeleton-line medium" />
              </div>
            ))}
          </section>
        )}

        {!loading && error && (
          <section className="state-card">
            <div className="state-icon error-icon">
              <Icon name="alert" size={25} />
            </div>

            <h2>بارگذاری ناموفق بود</h2>
            <p>{error}</p>

            <button
              type="button"
              className="retry-button"
              onClick={() => void loadHomework()}
            >
              <Icon name="refresh" size={16} />
              تلاش دوباره
            </button>
          </section>
        )}

        {!loading && !error && homework.length === 0 && (
          <section className="state-card">
            <div className="state-icon">
              <Icon name="calendar" size={25} />
            </div>

            <h2>هنوز تکلیفی ثبت نشده</h2>

            <p>
              در حال حاضر تکلیفی برای جلسه بعد قرار نگرفته است.
              وقتی مدیریت تکلیفی ثبت کند، از همین صفحه می‌توانی آن را ببینی.
            </p>

            <div className="empty-note">
              <Icon name="check" size={15} />
              <span>بعداً دوباره سر بزن</span>
            </div>
          </section>
        )}

        {!loading && !error && homework.length > 0 && (
          <>
            <div className="section-heading">
              <div>
                <h2>فهرست تکالیف</h2>
                <p>برای مشاهده جزئیات، یک تکلیف را انتخاب کن.</p>
              </div>

              <span className="section-count">
                {homework.length} مورد
              </span>
            </div>

            <section className="homework-list">
              {homework.map((item, index) => (
                <button
                  type="button"
                  key={item.id}
                  className={`homework-card ${item.is_red ? 'important' : ''}`}
                  onClick={() => router.push(`/homework/${item.id}`)}
                >
                  <div className="card-index">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="card-main">
                    <div className="card-topline">
                      <span className="card-label">
                        {item.is_red ? (
                          <>
                            <Icon name="star" size={12} />
                            تکلیف مهم
                          </>
                        ) : (
                          'تکلیف جلسه بعد'
                        )}
                      </span>

                      {item.is_red && (
                        <span className="important-dot" aria-label="مهم" />
                      )}
                    </div>

                    <h3>{item.title}</h3>

                    <div className="card-meta">
                      <Icon name="calendar" size={15} />
                      <span>{formatDate(item.due_date)}</span>
                    </div>
                  </div>

                  <span className="card-arrow">
                    <Icon name="arrow" size={17} />
                  </span>
                </button>
              ))}
            </section>

            <div className="bottom-note">
              <span className="note-line" />
              <span>با آمادگی کامل به جلسه بعد برو</span>
              <span className="note-line" />
            </div>
          </>
        )}

        <footer>
          <span className="footer-mark" />
          <span>تکلیف من</span>
          <span className="footer-mark" />
        </footer>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 22px 18px 34px;
          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(190, 158, 88, 0.12),
              transparent 34%
            ),
            #070707;
          color: #f5f3ee;
        }

        .container {
          width: 100%;
          max-width: 650px;
          margin: 0 auto;
        }

        .header {
          margin-bottom: 25px;
        }

        .back-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          margin-bottom: 23px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 13px;
          background: rgba(255, 255, 255, 0.035);
          color: #c5a867;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }

        .back-button:hover {
          border-color: rgba(197, 168, 103, 0.4);
          background: rgba(197, 168, 103, 0.08);
        }

        .brand-line {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 9px;
        }

        .brand-mark {
          width: 25px;
          height: 1px;
          background: #b99a5a;
        }

        .brand-line small {
          color: #b99a5a;
          font-size: 10px;
          letter-spacing: 0.13em;
        }

        .header h1 {
          margin: 0;
          font-size: clamp(26px, 6vw, 34px);
          line-height: 1.5;
          font-weight: 800;
          letter-spacing: -0.035em;
        }

        .header p {
          margin: 6px 0 0;
          color: #85827c;
          font-size: 13px;
          line-height: 1.9;
        }

        .overview {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          margin-bottom: 24px;
          border: 1px solid rgba(185, 154, 90, 0.17);
          border-radius: 18px;
          background: linear-gradient(
            110deg,
            rgba(185, 154, 90, 0.075),
            rgba(255, 255, 255, 0.018)
          );
        }

        .overview-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          border: 1px solid rgba(185, 154, 90, 0.13);
          border-radius: 13px;
          background: rgba(185, 154, 90, 0.08);
          color: #c4a765;
        }

        .overview-text {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .overview-text strong {
          color: #e9d6a5;
          font-size: 14px;
          font-weight: 750;
        }

        .overview-text span {
          color: #89847b;
          font-size: 11px;
          line-height: 1.7;
        }

        .overview-count {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 39px;
          height: 39px;
          padding: 0 8px;
          border-radius: 12px;
          background: rgba(185, 154, 90, 0.1);
          color: #c4a765;
          font-size: 13px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 0 2px 13px;
        }

        .section-heading h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 750;
        }

        .section-heading p {
          margin: 5px 0 0;
          color: #77736c;
          font-size: 11px;
          line-height: 1.8;
        }

        .section-count {
          flex-shrink: 0;
          padding: 6px 9px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 9px;
          color: #a7a198;
          font-size: 10px;
        }

        .homework-list {
          display: grid;
          gap: 11px;
        }

        .homework-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 13px;
          width: 100%;
          min-height: 105px;
          padding: 15px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.075);
          border-radius: 19px;
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.045),
            rgba(255, 255, 255, 0.018)
          );
          color: #f5f3ee;
          text-align: right;
          cursor: pointer;
          font-family: inherit;
          transition:
            border-color 0.18s ease,
            background 0.18s ease,
            transform 0.18s ease;
        }

        .homework-card:hover {
          border-color: rgba(185, 154, 90, 0.34);
          background: linear-gradient(
            145deg,
            rgba(185, 154, 90, 0.07),
            rgba(255, 255, 255, 0.025)
          );
          transform: translateY(-1px);
        }

        .homework-card:active {
          transform: scale(0.99);
        }

        .homework-card.important {
          border-color: rgba(183, 104, 80, 0.27);
          background: linear-gradient(
            110deg,
            rgba(122, 56, 42, 0.105),
            rgba(255, 255, 255, 0.02)
          );
        }

        .homework-card.important:hover {
          border-color: rgba(205, 123, 92, 0.45);
        }

        .card-index {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 39px;
          height: 43px;
          flex-shrink: 0;
          border: 1px solid rgba(185, 154, 90, 0.14);
          border-radius: 12px;
          background: rgba(185, 154, 90, 0.055);
          color: #b99a5a;
          font-size: 12px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }

        .card-main {
          flex: 1;
          min-width: 0;
        }

        .card-topline {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 5px;
        }

        .card-label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #a99a78;
          font-size: 10px;
          font-weight: 600;
        }

        .important .card-label {
          color: #d39a83;
        }

        .important-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #c97f69;
        }

        .card-main h3 {
          margin: 0;
          color: #f1eee8;
          font-size: clamp(14px, 3.8vw, 17px);
          line-height: 1.8;
          font-weight: 750;
          overflow-wrap: anywhere;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          color: #827d73;
          font-size: 10.5px;
          line-height: 1.7;
        }

        .card-meta :global(svg) {
          flex-shrink: 0;
          color: #b99a5a;
        }

        .card-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          border: 1px solid rgba(185, 154, 90, 0.15);
          border-radius: 11px;
          background: rgba(185, 154, 90, 0.055);
          color: #c4a765;
          transition: background 0.18s ease;
        }

        .homework-card:hover .card-arrow {
          background: rgba(185, 154, 90, 0.13);
        }

        .state-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 275px;
          padding: 30px 22px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 23px;
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.04),
            rgba(255, 255, 255, 0.014)
          );
          text-align: center;
        }

        .state-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          margin-bottom: 17px;
          border: 1px solid rgba(185, 154, 90, 0.2);
          border-radius: 19px;
          background: rgba(185, 154, 90, 0.07);
          color: #c4a765;
        }

        .error-icon {
          border-color: rgba(205, 110, 95, 0.2);
          background: rgba(205, 110, 95, 0.07);
          color: #d18d7c;
        }

        .state-card h2 {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
        }

        .state-card p {
          max-width: 350px;
          margin: 9px 0 0;
          color: #858078;
          font-size: 12px;
          line-height: 2;
        }

        .retry-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
          padding: 11px 17px;
          border: 1px solid rgba(185, 154, 90, 0.25);
          border-radius: 12px;
          background: rgba(185, 154, 90, 0.08);
          color: #d4b875;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
        }

        .retry-button:hover {
          background: rgba(185, 154, 90, 0.14);
        }

        .empty-note {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 20px;
          padding: 8px 11px;
          border: 1px solid rgba(185, 154, 90, 0.1);
          border-radius: 10px;
          color: #a89a78;
          font-size: 10px;
        }

        .bottom-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          margin-top: 25px;
          color: #777064;
          font-size: 10px;
          text-align: center;
        }

        .note-line {
          width: 23px;
          height: 1px;
          background: rgba(185, 154, 90, 0.24);
        }

        .loading-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 13px;
          min-height: 105px;
          padding: 17px;
          border: 1px solid rgba(255, 255, 255, 0.055);
          border-radius: 19px;
          background: rgba(255, 255, 255, 0.025);
        }

        .skeleton-line {
          height: 9px;
          border-radius: 8px;
          background: linear-gradient(
            100deg,
            rgba(255, 255, 255, 0.035) 20%,
            rgba(255, 255, 255, 0.09) 45%,
            rgba(255, 255, 255, 0.035) 70%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s linear infinite;
        }

        .skeleton-line.short {
          width: 24%;
        }

        .skeleton-line.long {
          width: 70%;
          height: 13px;
        }

        .skeleton-line.medium {
          width: 42%;
        }

        footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 31px;
          color: #555047;
          font-size: 10px;
        }

        .footer-mark {
          width: 17px;
          height: 1px;
          background: rgba(185, 154, 90, 0.22);
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }

          100% {
            background-position: -200% 0;
          }
        }

        @media (max-width: 480px) {
          .page {
            padding: 17px 13px 29px;
          }

          .header {
            margin-bottom: 22px;
          }

          .homework-card {
            gap: 10px;
            min-height: 96px;
            padding: 12px;
            border-radius: 16px;
          }

          .card-index {
            width: 33px;
            height: 38px;
            border-radius: 10px;
          }

          .card-arrow {
            width: 29px;
            height: 29px;
            border-radius: 9px;
          }

          .overview {
            padding: 12px;
            margin-bottom: 21px;
          }

          .section-heading h2 {
            font-size: 15px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  )
}
