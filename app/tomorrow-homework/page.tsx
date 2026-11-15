
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

          <div className="heading-row">
            <div>
              <span className="eyebrow">برنامه درسی شما</span>
              <h1>تکالیف جلسه بعد</h1>
              <p>همه چیزهایی که برای جلسه بعد باید آماده کنی.</p>
            </div>

            <div className="header-icon">
              <Icon name="book" size={29} />
            </div>
          </div>
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

            <span className="empty-label">فعلاً خبری نیست!</span>
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
                <span className="section-eyebrow">برای جلسه آینده</span>
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
                            <Icon name="star" size={13} />
                            تکلیف مهم
                          </>
                        ) : (
                          'تکلیف جلسه بعد'
                        )}
                      </span>

                      {item.is_red && (
                        <span className="important-badge">
                          مهم
                        </span>
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
          padding: 25px 18px 35px;
          background:
            radial-gradient(
              circle at 85% 0%,
              rgba(13, 148, 136, 0.08),
              transparent 30%
            ),
            #f3f7f8;
          color: #173b50;
          font-family: inherit;
        }

        .container {
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
        }

        .header {
          margin-bottom: 26px;
        }

        .back-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          margin-bottom: 22px;
          border: 1px solid #e1e9ec;
          border-radius: 14px;
          background: #ffffff;
          color: #173b50;
          cursor: pointer;
          box-shadow: 0 3px 12px rgba(23, 59, 80, 0.04);
          transition: 0.2s ease;
        }

        .back-button:hover {
          border-color: #0d9488;
          color: #0d9488;
          transform: translateX(2px);
        }

        .brand-line {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 15px;
        }

        .brand-mark {
          width: 24px;
          height: 3px;
          border-radius: 5px;
          background: #0d9488;
        }

        .brand-line small {
          color: #66818d;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.13em;
        }

        .heading-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .heading-row > div:first-child {
          min-width: 0;
        }

        .eyebrow {
          display: inline-block;
          margin-bottom: 5px;
          color: #0d9488;
          font-size: 11px;
          font-weight: 750;
        }

        .header h1 {
          margin: 0;
          color: #173b50;
          font-size: clamp(25px, 6vw, 34px);
          line-height: 1.55;
          font-weight: 850;
          letter-spacing: -0.04em;
        }

        .header p {
          margin: 5px 0 0;
          color: #71858e;
          font-size: 13px;
          line-height: 1.9;
        }

        .header-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 65px;
          height: 65px;
          flex-shrink: 0;
          border: 1px solid #d7eeeb;
          border-radius: 21px;
          background: #e7f5f3;
          color: #0d9488;
        }

        .overview {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 15px;
          margin-bottom: 25px;
          border: 1px solid #dcebe9;
          border-radius: 19px;
          background: #ffffff;
          box-shadow: 0 5px 18px rgba(23, 59, 80, 0.035);
        }

        .overview-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 45px;
          height: 45px;
          flex-shrink: 0;
          border-radius: 14px;
          background: #e8f5f3;
          color: #0d9488;
        }

        .overview-text {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .overview-text strong {
          color: #173b50;
          font-size: 14px;
          font-weight: 800;
        }

        .overview-text span {
          color: #71858e;
          font-size: 11px;
          line-height: 1.7;
        }

        .overview-count {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 41px;
          height: 41px;
          padding: 0 8px;
          border-radius: 13px;
          background: #edf6f5;
          color: #0d9488;
          font-size: 14px;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
        }

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 0 2px 14px;
        }

        .section-eyebrow {
          display: block;
          margin-bottom: 3px;
          color: #0d9488;
          font-size: 10px;
          font-weight: 750;
        }

        .section-heading h2 {
          margin: 0;
          color: #173b50;
          font-size: 17px;
          font-weight: 850;
        }

        .section-heading p {
          margin: 5px 0 0;
          color: #7b8e96;
          font-size: 11px;
          line-height: 1.8;
        }

        .section-count {
          flex-shrink: 0;
          padding: 7px 10px;
          border: 1px solid #e1e9ec;
          border-radius: 10px;
          background: #ffffff;
          color: #617b87;
          font-size: 10px;
          font-weight: 700;
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
          min-height: 108px;
          padding: 15px;
          overflow: hidden;
          border: 1px solid #e2eaed;
          border-radius: 19px;
          background: #ffffff;
          color: #173b50;
          text-align: right;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 4px 15px rgba(23, 59, 80, 0.035);
          transition:
            border-color 0.18s ease,
            box-shadow 0.18s ease,
            transform 0.18s ease;
        }

        .homework-card:hover {
          border-color: #a9d9d3;
          box-shadow: 0 7px 20px rgba(13, 148, 136, 0.09);
          transform: translateY(-2px);
        }

        .homework-card:active {
          transform: scale(0.99);
        }

        .homework-card.important {
          border-color: #f0d8d1;
          background: linear-gradient(110deg, #fffaf8, #ffffff 65%);
        }

        .homework-card.important:hover {
          border-color: #e7b8aa;
          box-shadow: 0 7px 20px rgba(190, 94, 70, 0.07);
        }

        .card-index {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 45px;
          flex-shrink: 0;
          border: 1px solid #dcefeb;
          border-radius: 13px;
          background: #edf7f5;
          color: #0d9488;
          font-size: 12px;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
        }

        .important .card-index {
          border-color: #f2dfd9;
          background: #fff0eb;
          color: #bd705c;
        }

        .card-main {
          flex: 1;
          min-width: 0;
        }

        .card-topline {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 5px;
        }

        .card-label {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #0d9488;
          font-size: 10px;
          font-weight: 750;
        }

        .important .card-label {
          color: #bd705c;
        }

        .important-badge {
          padding: 3px 7px;
          border-radius: 6px;
          background: #fff0eb;
          color: #b96853;
          font-size: 9px;
          font-weight: 800;
        }

        .card-main h3 {
          margin: 0;
          color: #173b50;
          font-size: clamp(14px, 3.8vw, 17px);
          line-height: 1.8;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          color: #81939a;
          font-size: 10.5px;
          line-height: 1.7;
        }

        .card-meta :global(svg) {
          flex-shrink: 0;
          color: #0d9488;
        }

        .important .card-meta :global(svg) {
          color: #bd705c;
        }

        .card-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border: 1px solid #e0eeeb;
          border-radius: 11px;
          background: #f2f8f7;
          color: #0d9488;
          transition: 0.18s ease;
        }

        .homework-card:hover .card-arrow {
          border-color: #c4e5df;
          background: #e6f4f1;
        }

        .important .card-arrow {
          border-color: #f2e1dc;
          background: #fff4f0;
          color: #bd705c;
        }

        .state-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 285px;
          padding: 32px 23px;
          border: 1px solid #e1e9ec;
          border-radius: 23px;
          background: #ffffff;
          text-align: center;
          box-shadow: 0 5px 20px rgba(23, 59, 80, 0.035);
        }

        .state-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 62px;
          height: 62px;
          margin-bottom: 17px;
          border: 1px solid #d9eeea;
          border-radius: 20px;
          background: #eaf6f4;
          color: #0d9488;
        }

        .error-icon {
          border-color: #f1dcd6;
          background: #fff1ed;
          color: #bd705c;
        }

        .empty-label {
          margin-bottom: 5px;
          color: #0d9488;
          font-size: 10px;
          font-weight: 800;
        }

        .state-card h2 {
          margin: 0;
          color: #173b50;
          font-size: 17px;
          font-weight: 850;
        }

        .state-card p {
          max-width: 365px;
          margin: 9px 0 0;
          color: #778b93;
          font-size: 12px;
          line-height: 2.1;
        }

        .retry-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
          padding: 11px 18px;
          border: 1px solid #c8e5e0;
          border-radius: 12px;
          background: #eaf6f4;
          color: #087f76;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          font-weight: 750;
          transition: 0.2s ease;
        }

        .retry-button:hover {
          border-color: #9dd3ca;
          background: #dff1ee;
        }

        .empty-note {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 20px;
          padding: 9px 12px;
          border: 1px solid #e0eeeb;
          border-radius: 10px;
          background: #f5faf9;
          color: #398b82;
          font-size: 10px;
          font-weight: 700;
        }

        .bottom-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 11px;
          margin-top: 26px;
          color: #82949a;
          font-size: 10px;
          text-align: center;
        }

        .note-line {
          width: 23px;
          height: 1px;
          background: #c8dedb;
        }

        .loading-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 13px;
          min-height: 108px;
          padding: 17px;
          border: 1px solid #e3ebed;
          border-radius: 19px;
          background: #ffffff;
        }

        .skeleton-line {
          height: 9px;
          border-radius: 8px;
          background: linear-gradient(
            100deg,
            #edf2f3 20%,
            #e2ebed 45%,
            #edf2f3 70%
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
          margin-top: 32px;
          color: #91a1a6;
          font-size: 10px;
          font-weight: 650;
        }

        .footer-mark {
          width: 17px;
          height: 2px;
          border-radius: 5px;
          background: #c8dedb;
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
            padding: 18px 13px 29px;
          }

          .header {
            margin-bottom: 22px;
          }

          .header-icon {
            width: 55px;
            height: 55px;
            border-radius: 18px;
          }

          .homework-card {
            gap: 10px;
            min-height: 99px;
            padding: 12px;
            border-radius: 16px;
          }

          .card-index {
            width: 35px;
            height: 39px;
            border-radius: 11px;
          }

          .card-arrow {
            width: 30px;
            height: 30px;
            border-radius: 9px;
          }

          .overview {
            padding: 12px;
            margin-bottom: 22px;
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
