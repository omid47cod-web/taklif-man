
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Homework = {
  id: string
  title: string
  due_date: string | null
  content: string | null
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
  if (!date?.trim()) return 'بدون تاریخ'
  return date.trim()
}

export default function HomeworkDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [homework, setHomework] = useState<Homework | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadHomework = useCallback(async () => {
    setLoading(true)
    setError(false)

    try {
      const supabase = createClient()

      const { data, error: supabaseError } = await supabase
        .from('homework')
        .select('id, title, due_date, content, is_red, created_at')
        .eq('id', id)
        .single()

      if (supabaseError || !data) {
        setError(true)
        return
      }

      setHomework(data as Homework)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) return

    const student = localStorage.getItem('taklif-man-student')

    if (!student) {
      router.replace('/register')
      return
    }

    void loadHomework()
  }, [id, router, loadHomework])

  return (
    <main className="homework-detail-page" dir="rtl">
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
              <Icon name="book" size={21} />
            </div>

            <div className="brand-text">
              <span className="brand-name">تکلیف من</span>
              <span className="brand-en">TAKLIF MAN</span>
            </div>
          </div>

          <div className="brand-status" aria-hidden="true">
            <span />
          </div>
        </header>

        <section className="page-heading">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            فضای آموزشی شما
          </div>

          <div className="title-row">
            <div>
              <h1>
                جزئیات <span>تکلیف</span>
              </h1>

              <p>عنوان، مهلت و توضیحات تکلیف</p>
            </div>

            {!loading && !error && homework?.is_red && (
              <span className="important-badge">
                <Icon name="star" size={14} />
                تکلیف مهم
              </span>
            )}
          </div>
        </section>

        {loading ? (
          <section className="detail-panel" aria-label="در حال بارگذاری">
            <div className="skeleton-heading shimmer" />
            <div className="skeleton-title shimmer" />
            <div className="skeleton-date shimmer" />
            <div className="skeleton-divider" />
            <div className="skeleton-label shimmer" />
            <div className="skeleton-line shimmer" />
            <div className="skeleton-line medium shimmer" />
            <div className="skeleton-line short shimmer" />
          </section>
        ) : error || !homework ? (
          <section className="state-panel">
            <div className="state-icon">
              <Icon name="book" size={25} />
            </div>

            <h2>تکلیف پیدا نشد</h2>

            <p>
              این تکلیف ممکن است حذف شده باشد یا دیگر در دسترس نباشد.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() => router.push('/homework')}
            >
              <Icon name="back" size={17} />
              بازگشت به فهرست تکالیف
            </button>

            <button
              type="button"
              className="retry-button"
              onClick={() => void loadHomework()}
            >
              <Icon name="refresh" size={15} />
              تلاش دوباره
            </button>
          </section>
        ) : (
          <>
            <article
              className={`detail-panel ${homework.is_red ? 'important-panel' : ''}`}
            >
              <div className="panel-heading">
                <div className="panel-heading-icon">
                  <Icon
                    name={homework.is_red ? 'star' : 'book'}
                    size={20}
                  />
                </div>

                <div className="panel-heading-copy">
                  <span>اطلاعات تکلیف</span>
                  <small>ASSIGNMENT DETAILS</small>
                </div>

                <span className="panel-status">
                  <span />
                  ثبت‌شده
                </span>
              </div>

              <div className="title-section">
                <span className="section-label">عنوان تکلیف</span>
                <h2>{homework.title}</h2>
              </div>

              <div className="date-box">
                <div className="date-icon">
                  <Icon name="calendar" size={20} />
                </div>

                <div className="date-content">
                  <span>مهلت انجام تکلیف</span>
                  <strong>{formatDate(homework.due_date)}</strong>
                </div>
              </div>

              <div className="section-divider">
                <span />
                <span className="divider-symbol">✦</span>
                <span />
              </div>

              <section className="content-section">
                <div className="content-heading">
                  <div className="content-heading-icon">
                    <Icon name="book" size={17} />
                  </div>

                  <h3>توضیحات تکلیف</h3>
                </div>

                {homework.content?.trim() ? (
                  <p className="homework-content">{homework.content}</p>
                ) : (
                  <div className="no-content">
                    <span className="no-content-mark">—</span>
                    <p>برای این تکلیف توضیحی ثبت نشده است.</p>
                  </div>
                )}
              </section>
            </article>

            <button
              type="button"
              className="bottom-back"
              onClick={() => router.push('/homework')}
            >
              <Icon name="back" size={18} />
              <span>بازگشت به فهرست تکالیف</span>
              <Icon name="arrow" size={16} />
            </button>
          </>
        )}

        <footer className="footer">
          <div className="footer-rule" />

          <div className="footer-brand">
            <span>✦</span>
            تکلیف من
          </div>

          <p>همه تکالیف کلاس، ساده و همیشه در دسترس.</p>
        </footer>
      </div>

      <style jsx>{`
        .homework-detail-page {
          --navy: #173b50;
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
          padding: 37px 0 25px;
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

        .title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 9px;
        }

        .title-row h1 {
          margin: 0;
          color: var(--navy);
          font-size: clamp(27px, 6vw, 34px);
          font-weight: 900;
          line-height: 1.55;
          letter-spacing: -0.6px;
        }

        .title-row h1 span {
          color: var(--teal);
        }

        .title-row p {
          margin: 3px 0 0;
          color: var(--muted);
          font-size: 11px;
          line-height: 1.9;
        }

        .important-badge {
          display: inline-flex;
          flex-shrink: 0;
          align-items: center;
          gap: 5px;
          padding: 6px 9px;
          color: #a66f1c;
          background: #fff4dc;
          border: 1px solid #f0e0ba;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .detail-panel {
          padding: 19px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: 0 9px 30px rgba(23, 59, 80, 0.05);
          animation: enter 0.3s ease both;
        }

        .important-panel {
          border-color: #f0dfb9;
          background: linear-gradient(145deg, #fffdf8, #fff 55%);
        }

        .panel-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 15px;
          border-bottom: 1px solid #edf1f2;
        }

        .panel-heading-icon {
          display: grid;
          flex-shrink: 0;
          place-items: center;
          width: 39px;
          height: 39px;
          color: var(--teal);
          background: var(--teal-light);
          border-radius: 11px;
        }

        .important-panel .panel-heading-icon {
          color: #b17b24;
          background: #fff3d8;
        }

        .panel-heading-copy {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .panel-heading-copy > span {
          color: var(--navy);
          font-size: 12px;
          font-weight: 900;
        }

        .panel-heading-copy small {
          color: #7c929b;
          font-family: Arial, sans-serif;
          font-size: 8px;
          letter-spacing: 1.2px;
          direction: ltr;
          text-align: right;
        }

        .panel-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #84949a;
          font-size: 9px;
          white-space: nowrap;
        }

        .panel-status > span {
          width: 6px;
          height: 6px;
          background: var(--teal);
          border-radius: 50%;
        }

        .title-section {
          padding: 21px 1px 0;
        }

        .section-label {
          display: block;
          margin-bottom: 7px;
          color: var(--teal);
          font-size: 10px;
          font-weight: 800;
        }

        .important-panel .section-label {
          color: #a77b31;
        }

        .title-section h2 {
          margin: 0;
          color: var(--navy);
          font-size: clamp(19px, 4.8vw, 24px);
          line-height: 1.9;
          font-weight: 900;
          overflow-wrap: anywhere;
        }

        .date-box {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 18px;
          padding: 12px;
          background: #f1f8f7;
          border: 1px solid #e1efed;
          border-radius: 12px;
        }

        .important-panel .date-box {
          background: #fffaf0;
          border-color: #f2e8d2;
        }

        .date-icon {
          display: grid;
          flex-shrink: 0;
          place-items: center;
          width: 39px;
          height: 39px;
          color: var(--teal);
          background: #e2f2ef;
          border-radius: 11px;
        }

        .important-panel .date-icon {
          color: #b17b24;
          background: #fff1d1;
        }

        .date-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .date-content span {
          color: #7e9298;
          font-size: 10px;
        }

        .date-content strong {
          color: var(--navy);
          font-size: 12px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .section-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 21px 0;
        }

        .section-divider > span:not(.divider-symbol) {
          flex: 1;
          height: 1px;
          background: #e9eff0;
        }

        .divider-symbol {
          color: var(--teal);
          font-size: 11px;
        }

        .content-section {
          min-width: 0;
        }

        .content-heading {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .content-heading-icon {
          display: grid;
          flex-shrink: 0;
          place-items: center;
          width: 30px;
          height: 30px;
          color: var(--teal);
          background: #eaf6f4;
          border-radius: 9px;
        }

        .content-heading h3 {
          margin: 0;
          color: var(--navy);
          font-size: 12px;
          font-weight: 900;
        }

        .homework-content {
          margin: 0;
          padding: 14px;
          color: #536b75;
          background: #f8fbfb;
          border: 1px solid #edf2f2;
          border-radius: 11px;
          font-size: 12px;
          line-height: 2.25;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .important-panel .homework-content {
          background: #fffdf8;
          border-color: #f1eadb;
        }

        .no-content {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 13px;
          color: #84949a;
          background: #f8fbfb;
          border: 1px dashed #dfe9ea;
          border-radius: 10px;
        }

        .no-content-mark {
          color: var(--teal);
          font-size: 17px;
        }

        .no-content p {
          margin: 0;
          font-size: 11px;
          line-height: 1.9;
        }

        .bottom-back {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          min-height: 45px;
          margin-top: 11px;
          padding: 10px 13px;
          color: var(--navy);
          background: #fff;
          border: 1px solid #dce9eb;
          border-radius: 11px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .bottom-back:hover {
          background: #eaf6f4;
          border-color: #b9ded9;
        }

        .bottom-back span {
          flex: 0 1 auto;
        }

        .bottom-back :global(svg:last-child) {
          margin-right: auto;
          color: var(--teal);
          opacity: 0.7;
        }

        .state-panel {
          display: flex;
          align-items: center;
          flex-direction: column;
          padding: 32px 18px;
          text-align: center;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 17px;
          box-shadow: 0 8px 25px rgba(23, 59, 80, 0.04);
        }

        .state-icon {
          display: grid;
          place-items: center;
          width: 49px;
          height: 49px;
          margin-bottom: 14px;
          color: var(--teal);
          background: var(--teal-light);
          border: 1px solid #d6eeea;
          border-radius: 14px;
        }

        .state-panel h2 {
          margin: 0;
          color: var(--navy);
          font-size: 15px;
          font-weight: 900;
        }

        .state-panel p {
          max-width: 340px;
          margin: 9px 0 0;
          color: #829198;
          font-size: 11px;
          line-height: 2;
        }

        .primary-button,
        .retry-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 39px;
          margin-top: 17px;
          padding: 0 14px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 11px;
          cursor: pointer;
        }

        .primary-button {
          color: #fff;
          background: var(--teal);
          border: 1px solid var(--teal);
          font-weight: 800;
          transition: background 0.2s;
        }

        .primary-button:hover {
          background: #087e74;
        }

        .retry-button {
          margin-top: 9px;
          color: var(--navy);
          background: #f4f8f8;
          border: 1px solid #e1ebec;
        }

        .skeleton-heading,
        .skeleton-title,
        .skeleton-date,
        .skeleton-label,
        .skeleton-line {
          background: linear-gradient(
            100deg,
            #edf2f2 25%,
            #e2ebeb 50%,
            #edf2f2 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
          border-radius: 7px;
        }

        .skeleton-heading {
          width: 42%;
          height: 37px;
          margin-bottom: 22px;
        }

        .skeleton-title {
          width: 65%;
          height: 23px;
          margin-bottom: 20px;
        }

        .skeleton-date {
          height: 57px;
          margin-bottom: 20px;
        }

        .skeleton-divider {
          height: 1px;
          margin-bottom: 21px;
          background: #e9eff0;
        }

        .skeleton-label {
          width: 32%;
          height: 13px;
          margin-bottom: 15px;
        }

        .skeleton-line {
          width: 100%;
          height: 11px;
          margin-bottom: 11px;
        }

        .skeleton-line.medium {
          width: 82%;
        }

        .skeleton-line.short {
          width: 55%;
        }

        .footer {
          display: flex;
          align-items: center;
          flex-direction: column;
          margin-top: 32px;
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

        .footer-brand span {
          color: var(--teal);
          font-size: 12px;
        }

        .footer p {
          margin: 6px 0 0;
          color: #94a1a5;
          font-size: 10px;
          line-height: 1.8;
        }

        @keyframes shimmer {
          to {
            background-position: -200% 0;
          }
        }

        @keyframes enter {
          from {
            opacity: 0;
            transform: translateY(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (min-width: 600px) {
          .homework-detail-page {
            padding-top: 27px;
          }

          .page-heading {
            padding-top: 40px;
            padding-bottom: 27px;
          }

          .detail-panel {
            padding: 22px;
          }

          .title-section {
            padding-top: 23px;
          }
        }

        @media (max-width: 420px) {
          .homework-detail-page {
            padding: 15px 12px 20px;
          }

          .page-heading {
            padding-top: 29px;
            padding-bottom: 21px;
          }

          .title-row {
            align-items: flex-start;
          }

          .title-row h1 {
            font-size: 28px;
          }

          .title-row p {
            max-width: 235px;
            font-size: 10px;
          }

          .important-badge {
            gap: 4px;
            padding: 5px 7px;
            font-size: 9px;
          }

          .detail-panel {
            padding: 14px;
            border-radius: 15px;
          }

          .title-section h2 {
            font-size: 19px;
          }

          .date-box {
            padding: 10px;
          }

          .homework-content {
            padding: 11px;
            font-size: 11px;
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
