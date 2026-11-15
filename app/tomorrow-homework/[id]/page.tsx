'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Homework = {
  id: string
  title: string
  due_date: string
  content: string
  is_red: boolean
  created_at: string
}

function Icon({
  name,
  size = 20,
}: {
  name: 'arrow' | 'calendar' | 'book' | 'star' | 'alert' | 'refresh' | 'check'
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
            strokeWidth="1.7"
          />
          <path
            d="M7.5 3.5V7M16.5 3.5V7M3.5 10H20.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      )

    case 'book':
      return (
        <svg {...common}>
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20V19H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M4 5.5V21.5M8 7H16M8 11H15"
            stroke="currentColor"
            strokeWidth="1.7"
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

function formatDate(date: string | null | undefined) {
  if (!date?.trim()) return 'تاریخ مشخص نشده'

  const value = date.trim()
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) return value

  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

export default function TomorrowHomeworkDetailPage() {
  const router = useRouter()
  const params = useParams()

  const id = params.id as string

  const [homework, setHomework] = useState<Homework | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const student = localStorage.getItem('taklif-man-student')

    if (!student) {
      router.replace('/register')
      return
    }

    async function loadHomework() {
      try {
        const supabase = createClient()

        const {
          data: tomorrowItem,
          error: tomorrowError,
        } = await supabase
          .from('tomorrow_homework')
          .select('homework_id')
          .eq('homework_id', id)
          .maybeSingle()

        if (tomorrowError || !tomorrowItem) {
          setError('این تکلیف در فهرست تکالیف جلسه بعد وجود ندارد.')
          setLoading(false)
          return
        }

        const {
          data,
          error: homeworkError,
        } = await supabase
          .from('homework')
          .select('id, title, due_date, content, is_red, created_at')
          .eq('id', id)
          .single()

        if (homeworkError || !data) {
          setError('این تکلیف پیدا نشد.')
          setLoading(false)
          return
        }

        setHomework(data)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load tomorrow homework detail:', err)
        setError('دریافت اطلاعات تکلیف با مشکل مواجه شد.')
        setLoading(false)
      }
    }

    void loadHomework()
  }, [id, router])

  function handleBack() {
    router.push('/tomorrow-homework')
  }

  if (loading) {
    return (
      <main className="page" dir="rtl">
        <div className="loader-container">
          <div className="loader-ring" />
          <p>در حال دریافت تکلیف...</p>
        </div>

        <style jsx>{`
          .page {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
            background: #f3f7f8;
            color: #173b50;
            font-family: inherit;
          }

          .loader-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 17px;
          }

          .loader-ring {
            width: 43px;
            height: 43px;
            border: 3px solid #dcebe9;
            border-top-color: #0d9488;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          p {
            margin: 0;
            color: #71858e;
            font-size: 13px;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .loader-ring {
              animation-duration: 2s;
            }
          }
        `}</style>
      </main>
    )
  }

  if (error || !homework) {
    return (
      <main className="page" dir="rtl">
        <div className="container">
          <button
            type="button"
            className="back-button"
            onClick={handleBack}
          >
            <Icon name="arrow" size={18} />
            بازگشت
          </button>

          <section className="empty-card">
            <div className="empty-icon">
              <Icon name="alert" size={27} />
            </div>

            <span className="error-label">مشکلی پیش آمده</span>

            <h2>تکلیف پیدا نشد</h2>

            <p>
              {error || 'ممکن است این تکلیف حذف شده باشد.'}
            </p>

            <button
              type="button"
              className="return-button"
              onClick={handleBack}
            >
              مشاهده تکالیف جلسه بعد
              <Icon name="arrow" size={16} />
            </button>
          </section>
        </div>

        <style jsx>{`
          .page {
            min-height: 100vh;
            padding: 25px 18px 35px;
            background: #f3f7f8;
            color: #173b50;
            font-family: inherit;
          }

          .container {
            width: 100%;
            max-width: 680px;
            margin: 0 auto;
          }

          .back-button {
            display: inline-flex;
            align-items: center;
            gap: 9px;
            min-height: 42px;
            padding: 0 14px;
            margin-bottom: 24px;
            border: 1px solid #e1e9ec;
            border-radius: 13px;
            background: #ffffff;
            color: #173b50;
            cursor: pointer;
            font-family: inherit;
            font-size: 12px;
            font-weight: 700;
          }

          .back-button :global(svg) {
            transform: rotate(180deg);
          }

          .empty-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 310px;
            padding: 30px 22px;
            border: 1px solid #e1e9ec;
            border-radius: 23px;
            background: #ffffff;
            text-align: center;
            box-shadow: 0 5px 20px rgba(23, 59, 80, 0.035);
          }

          .empty-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 62px;
            height: 62px;
            margin-bottom: 17px;
            border: 1px solid #f1dcd6;
            border-radius: 20px;
            background: #fff1ed;
            color: #bd705c;
          }

          .error-label {
            margin-bottom: 5px;
            color: #bd705c;
            font-size: 10px;
            font-weight: 800;
          }

          h2 {
            margin: 0;
            color: #173b50;
            font-size: 19px;
            font-weight: 850;
          }

          p {
            max-width: 360px;
            margin: 10px 0 0;
            color: #778b93;
            font-size: 12px;
            line-height: 2;
          }

          .return-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            margin-top: 22px;
            padding: 12px 17px;
            border: 1px solid #c8e5e0;
            border-radius: 12px;
            background: #eaf6f4;
            color: #087f76;
            cursor: pointer;
            font-family: inherit;
            font-size: 12px;
            font-weight: 750;
          }

          .return-button :global(svg) {
            transform: rotate(180deg);
          }

          @media (max-width: 480px) {
            .page {
              padding: 18px 13px 29px;
            }
          }
        `}</style>
      </main>
    )
  }

  return (
    <main className="page" dir="rtl">
      <div className="container">
        <header className="topbar">
          <button
            type="button"
            className="back-button"
            onClick={handleBack}
            aria-label="بازگشت به تکالیف جلسه بعد"
          >
            <Icon name="arrow" size={18} />
            بازگشت
          </button>

          <div className="topbar-label">
            <span className="topbar-dot" />
            تکالیف جلسه بعد
          </div>
        </header>

        <div className="brand-line">
          <span className="brand-mark" />
          <span>TAKLIF MAN</span>
        </div>

        <div className="page-heading">
          <span className="eyebrow">جزئیات تکلیف</span>
          <h1>شرح و توضیحات تکلیف</h1>
          <p>اطلاعات تکلیف را با دقت بررسی کن.</p>
        </div>

        <article
          className={`detail-card ${
            homework.is_red ? 'important-card' : ''
          }`}
        >
          <div className="card-accent" />

          <div className="detail-content">
            <div className="detail-meta">
              <span className="detail-meta-label">
                <Icon name="book" size={14} />
                تکلیف جلسه بعد
              </span>

              {homework.is_red && (
                <span className="important-badge">
                  <Icon name="star" size={12} />
                  تکلیف مهم
                </span>
              )}
            </div>

            <h2 className="homework-title">
              {homework.title}
            </h2>

            <div className="date-box">
              <div className="date-icon">
                <Icon name="calendar" size={21} />
              </div>

              <div className="date-content">
                <span>مهلت انجام تکلیف</span>
                <strong>{formatDate(homework.due_date)}</strong>
              </div>
            </div>

            <div className="divider" />

            <section className="text-section">
              <div className="section-title">
                <span className="section-icon">
                  <Icon name="book" size={17} />
                </span>

                <h3>متن تکلیف</h3>
              </div>

              <div className="detail-text">
                {homework.content ? (
                  homework.content.split('\n').map((line, index) => (
                    <p key={index}>
                      {line || '\u00A0'}
                    </p>
                  ))
                ) : (
                  <p className="no-content">
                    توضیحی برای این تکلیف ثبت نشده است.
                  </p>
                )}
              </div>
            </section>
          </div>
        </article>

        <div className="bottom-info">
          <span className="info-icon">
            <Icon name="check" size={16} />
          </span>
          <span>برای جلسه بعد با آمادگی کامل حاضر شو.</span>
        </div>

        <button
          type="button"
          className="bottom-button"
          onClick={handleBack}
        >
          <Icon name="arrow" size={17} />
          بازگشت به تکالیف جلسه بعد
        </button>

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

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 23px;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 41px;
          padding: 0 13px;
          border: 1px solid #e1e9ec;
          border-radius: 13px;
          background: #ffffff;
          color: #173b50;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          font-weight: 750;
          box-shadow: 0 3px 12px rgba(23, 59, 80, 0.035);
          transition: 0.2s ease;
        }

        .back-button :global(svg) {
          transform: rotate(180deg);
        }

        .back-button:hover {
          border-color: #0d9488;
          color: #0d9488;
        }

        .topbar-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #71858e;
          font-size: 11px;
          font-weight: 700;
        }

        .topbar-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #0d9488;
        }

        .brand-line {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 13px;
          color: #66818d;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.13em;
        }

        .brand-mark {
          width: 24px;
          height: 3px;
          border-radius: 5px;
          background: #0d9488;
        }

        .page-heading {
          margin-bottom: 23px;
        }

        .eyebrow {
          display: inline-block;
          margin-bottom: 5px;
          color: #0d9488;
          font-size: 11px;
          font-weight: 800;
        }

        .page-heading h1 {
          margin: 0;
          color: #173b50;
          font-size: clamp(23px, 5.5vw, 30px);
          line-height: 1.6;
          font-weight: 850;
          letter-spacing: -0.035em;
        }

        .page-heading p {
          margin: 5px 0 0;
          color: #7b8e96;
          font-size: 12px;
          line-height: 1.9;
        }

        .detail-card {
          position: relative;
          overflow: hidden;
          border: 1px solid #e0e9ec;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 7px 24px rgba(23, 59, 80, 0.045);
        }

        .important-card {
          border-color: #f0d8d1;
        }

        .card-accent {
          height: 5px;
          background: linear-gradient(90deg, #0d9488, #55b8ac);
        }

        .important-card .card-accent {
          background: linear-gradient(90deg, #bd705c, #e5a28e);
        }

        .detail-content {
          padding: 25px;
        }

        .detail-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 17px;
        }

        .detail-meta-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #0d9488;
          font-size: 11px;
          font-weight: 800;
        }

        .important-card .detail-meta-label {
          color: #bd705c;
        }

        .important-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 9px;
          border: 1px solid #f1ddd7;
          border-radius: 9px;
          background: #fff3ef;
          color: #b96853;
          font-size: 10px;
          font-weight: 800;
        }

        .homework-title {
          margin: 0;
          color: #173b50;
          font-size: clamp(19px, 4.5vw, 25px);
          line-height: 1.9;
          font-weight: 850;
          overflow-wrap: anywhere;
        }

        .date-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          margin-top: 22px;
          border: 1px solid #e0eeeb;
          border-radius: 15px;
          background: #f5faf9;
        }

        .important-card .date-box {
          border-color: #f1e3df;
          background: #fff9f7;
        }

        .date-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 43px;
          height: 43px;
          flex-shrink: 0;
          border-radius: 13px;
          background: #e5f3f0;
          color: #0d9488;
        }

        .important-card .date-icon {
          background: #fff0eb;
          color: #bd705c;
        }

        .date-content {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .date-content span {
          color: #82949a;
          font-size: 10px;
          font-weight: 650;
        }

        .date-content strong {
          color: #173b50;
          font-size: 13px;
          font-weight: 850;
        }

        .divider {
          height: 1px;
          margin: 24px 0;
          background: #eaf0f1;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 15px;
        }

        .section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #eaf6f4;
          color: #0d9488;
        }

        .section-title h3 {
          margin: 0;
          color: #173b50;
          font-size: 14px;
          font-weight: 850;
        }

        .detail-text {
          color: #526c78;
          font-size: 13px;
          line-height: 2.3;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }

        .detail-text p {
          margin: 0 0 5px;
        }

        .detail-text p:last-child {
          margin-bottom: 0;
        }

        .detail-text .no-content {
          color: #8a9ba1;
          font-size: 12px;
        }

        .bottom-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 22px;
          color: #71858e;
          font-size: 11px;
          text-align: center;
        }

        .info-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 25px;
          height: 25px;
          flex-shrink: 0;
          border-radius: 8px;
          background: #e5f3f0;
          color: #0d9488;
        }

        .bottom-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          min-height: 49px;
          margin-top: 19px;
          padding: 12px 16px;
          border: 1px solid #c8e5e0;
          border-radius: 14px;
          background: #eaf6f4;
          color: #087f76;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          transition: 0.2s ease;
        }

        .bottom-button :global(svg) {
          transform: rotate(180deg);
        }

        .bottom-button:hover {
          border-color: #9dd3ca;
          background: #dff1ee;
        }

        footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 30px;
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

        @media (max-width: 480px) {
          .page {
            padding: 18px 13px 29px;
          }

          .detail-content {
            padding: 19px 16px;
          }

          .topbar {
            margin-bottom: 19px;
          }

          .topbar-label {
            font-size: 10px;
          }

          .detail-card {
            border-radius: 18px;
          }

          .date-box {
            padding: 12px;
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
