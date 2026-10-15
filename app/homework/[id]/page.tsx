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
    strokeWidth: 1.7,
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
    <main className="page" dir="rtl">
      <div className="page-glow" aria-hidden="true" />

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
              <h1>جزئیات <span>تکلیف</span></h1>
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
            <article className={`detail-panel ${homework.is_red ? 'important-panel' : ''}`}>
              <div className="panel-heading">
                <div className="panel-heading-icon">
                  <Icon name={homework.is_red ? 'star' : 'book'} size={20} />
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
        :global(*) {
          box-sizing: border-box;
        }

        :global(html) {
          background: #090909;
        }

        :global(body) {
          margin: 0;
          background: #090909;
          color: #f5f2ec;
          font-family: var(--font-vazirmatn), Tahoma, sans-serif;
        }

        .page {
          position: relative;
          isolation: isolate;
          min-height: 100vh;
          overflow: hidden;
          padding: 20px 18px 25px;
          background: #090909;
          color: #f5f2ec;
        }

        .page-glow {
          position: absolute;
          z-index: -1;
          top: -180px;
          right: 50%;
          width: 480px;
          height: 350px;
          transform: translateX(50%);
          border-radius: 50%;
          background: rgba(197, 168, 103, 0.07);
          filter: blur(100px);
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
          min-height: 44px;
        }

        .back-button {
          display: grid;
          flex-shrink: 0;
          place-items: center;
          width: 39px;
          height: 39px;
          padding: 0;
          color: #d6c49b;
          background: #14130f;
          border: 1px solid rgba(197, 168, 103, 0.19);
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .back-button:hover {
          background: #201d15;
          border-color: rgba(197, 168, 103, 0.45);
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
          width: 39px;
          height: 39px;
          color: #17130b;
          background: linear-gradient(145deg, #e2cd94, #b99a5a);
          border-radius: 12px;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .brand-name {
          color: #f4f0e7;
          font-size: 13px;
          font-weight: 800;
        }

        .brand-en {
          color: #9e895e;
          font-family: Arial, sans-serif;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1.6px;
          direction: ltr;
        }

        .brand-status {
          display: grid;
          place-items: center;
          width: 29px;
          height: 29px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 50%;
        }

        .brand-status span {
          width: 6px;
          height: 6px;
          background: #c5a867;
          border-radius: 50%;
          box-shadow: 0 0 9px rgba(197, 168, 103, 0.4);
        }

        .page-heading {
          padding: 34px 0 23px;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #b9a575;
          font-size: 11px;
        }

        .eyebrow-line {
          width: 19px;
          height: 2px;
          background: #c5a867;
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
          color: #f6f3ec;
          font-size: clamp(27px, 6vw, 34px);
          font-weight: 900;
          line-height: 1.55;
          letter-spacing: -0.6px;
        }

        .title-row h1 span {
          color: #c5a867;
        }

        .title-row p {
          margin: 3px 0 0;
          color: #99958c;
          font-size: 11px;
          line-height: 1.9;
        }

        .important-badge {
          display: inline-flex;
          flex-shrink: 0;
          align-items: center;
          gap: 5px;
          padding: 6px 9px;
          color: #ddc17c;
          background: rgba(197, 168, 103, 0.09);
          border: 1px solid rgba(197, 168, 103, 0.23);
          border-radius: 8px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .detail-panel {
          padding: 17px;
          background: #10100f;
          border: 1px solid #25231d;
          border-radius: 17px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
          animation: enter 0.3s ease both;
        }

        .important-panel {
          border-color: rgba(197, 168, 103, 0.25);
          background: linear-gradient(145deg, rgba(197, 168, 103, 0.045), #10100f 48%);
        }

        .panel-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.055);
        }

        .panel-heading-icon {
          display: grid;
          flex-shrink: 0;
          place-items: center;
          width: 37px;
          height: 37px;
          color: #cbb476;
          background: rgba(197, 168, 103, 0.09);
          border: 1px solid rgba(197, 168, 103, 0.14);
          border-radius: 10px;
        }

        .panel-heading-copy {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .panel-heading-copy > span {
          color: #eee9df;
          font-size: 12px;
          font-weight: 800;
        }

        .panel-heading-copy small {
          color: #9e895e;
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
          color: #9b978b;
          font-size: 9px;
          white-space: nowrap;
        }

        .panel-status > span {
          width: 5px;
          height: 5px;
          background: #bba36c;
          border-radius: 50%;
        }

        .title-section {
          padding: 19px 1px 0;
        }

        .section-label {
          display: block;
          margin-bottom: 7px;
          color: #b99a5a;
          font-size: 10px;
          font-weight: 700;
        }

        .title-section h2 {
          margin: 0;
          color: #f5f2ec;
          font-size: clamp(19px, 4.8vw, 24px);
          line-height: 1.9;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .date-box {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 17px;
          padding: 11px;
          background: rgba(197, 168, 103, 0.045);
          border: 1px solid rgba(197, 168, 103, 0.13);
          border-radius: 12px;
        }

        .date-icon {
          display: grid;
          flex-shrink: 0;
          place-items: center;
          width: 37px;
          height: 37px;
          color: #cbb476;
          background: rgba(197, 168, 103, 0.09);
          border: 1px solid rgba(197, 168, 103, 0.12);
          border-radius: 10px;
        }

        .date-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .date-content span {
          color: #908a7e;
          font-size: 10px;
        }

        .date-content strong {
          color: #ddc17c;
          font-size: 12px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .section-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 20px 0;
        }

        .section-divider > span:not(.divider-symbol) {
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.065);
        }

        .divider-symbol {
          color: #8c7748;
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
          width: 29px;
          height: 29px;
          color: #bca46c;
          background: rgba(197, 168, 103, 0.07);
          border-radius: 8px;
        }

        .content-heading h3 {
          margin: 0;
          color: #eee9df;
          font-size: 12px;
          font-weight: 800;
        }

        .homework-content {
          margin: 0;
          padding: 12px 13px;
          color: #c8c5bd;
          background: rgba(255, 255, 255, 0.018);
          border: 1px solid rgba(255, 255, 255, 0.045);
          border-radius: 10px;
          font-size: 12px;
          line-height: 2.2;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .no-content {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 13px;
          color: #898478;
          background: rgba(255, 255, 255, 0.018);
          border: 1px dashed rgba(255, 255, 255, 0.09);
          border-radius: 10px;
        }

        .no-content-mark {
          color: #b99a5a;
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
          min-height: 43px;
          margin-top: 10px;
          padding: 10px 13px;
          color: #c7b27f;
          background: rgba(197, 168, 103, 0.045);
          border: 1px solid rgba(197, 168, 103, 0.16);
          border-radius: 11px;
          font-family: inherit;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }

        .bottom-back:hover {
          background: rgba(197, 168, 103, 0.09);
          border-color: rgba(197, 168, 103, 0.32);
        }

        .bottom-back span {
          flex: 0 1 auto;
        }

        .bottom-back :global(svg:last-child) {
          margin-right: auto;
          opacity: 0.6;
        }

        .state-panel {
          display: flex;
          align-items: center;
          flex-direction: column;
          padding: 30px 18px;
          text-align: center;
          background: #10100f;
          border: 1px solid #25231d;
          border-radius: 16px;
        }

        .state-icon {
          display: grid;
          place-items: center;
          width: 49px;
          height: 49px;
          margin-bottom: 14px;
          color: #cbb476;
          background: rgba(197, 168, 103, 0.09);
          border: 1px solid rgba(197, 168, 103, 0.17);
          border-radius: 14px;
        }

        .state-panel h2 {
          margin: 0;
          color: #f2efe8;
          font-size: 15px;
          font-weight: 800;
        }

        .state-panel p {
          max-width: 340px;
          margin: 9px 0 0;
          color: #928d82;
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
          padding: 0 13px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 11px;
          cursor: pointer;
        }

        .primary-button {
          color: #17130b;
          background: linear-gradient(135deg, #e0ca8f, #b99a5a);
          border: 0;
          font-weight: 800;
        }

        .retry-button {
          margin-top: 9px;
          color: #b9a575;
          background: transparent;
          border: 1px solid rgba(197, 168, 103, 0.16);
        }

        .skeleton-heading,
        .skeleton-title,
        .skeleton-date,
        .skeleton-label,
        .skeleton-line {
          background: linear-gradient(100deg, #191815 25%, #28251c 50%, #191815 75%);
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
          background: rgba(255, 255, 255, 0.06);
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
          margin-top: 30px;
          text-align: center;
        }

        .footer-rule {
          width: 100%;
          height: 1px;
          margin-bottom: 17px;
          background: linear-gradient(90deg, transparent, rgba(197, 168, 103, 0.19), transparent);
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #c5a867;
          font-size: 11px;
          font-weight: 800;
        }

        .footer-brand span {
          font-size: 12px;
        }

        .footer p {
          margin: 6px 0 0;
          color: #77736a;
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
          .page {
            padding-top: 27px;
          }

          .page-heading {
            padding-top: 40px;
            padding-bottom: 27px;
          }

          .detail-panel {
            padding: 21px;
          }

          .title-section {
            padding-top: 22px;
          }
        }

        @media (max-width: 420px) {
          .page {
            padding: 15px 12px 20px;
          }

          .page-heading {
            padding-top: 29px;
            padding-bottom: 20px;
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
            padding: 13px;
            border-radius: 14px;
          }

          .title-section h2 {
            font-size: 19px;
          }

          .date-box {
            padding: 9px;
          }

          .homework-content {
            padding: 10px;
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