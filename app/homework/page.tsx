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
  if (!date?.trim()) return 'بدون مهلت مشخص'

  const value = date.trim()

  // تاریخ‌هایی که به‌صورت متن فارسی ذخیره شده‌اند
  if (/[آ-ی]/.test(value)) {
    return value
  }

  // تاریخ استاندارد میلادی
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
                <Icon name="book" size={18} />
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
              <p>هر وقت تکلیف جدیدی ثبت شود، اینجا نمایش داده می‌شود.</p>

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
                      {item.is_red && <span className="important-badge">مهم</span>}
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
          padding: 20px 18px 24px;
          background: #090909;
          color: #f5f2ec;
        }

        .page-glow {
          position: absolute;
          z-index: -1;
          top: -180px;
          right: 50%;
          width: 480px;
          height: 380px;
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
          padding: 35px 0 28px;
        }

        .eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #b9a575;
          font-size: 11px;
          font-weight: 500;
        }

        .eyebrow-line {
          width: 19px;
          height: 2px;
          background: #c5a867;
          border-radius: 2px;
        }

        .page-heading h1 {
          margin: 11px 0 6px;
          color: #f6f3ec;
          font-size: clamp(29px, 6vw, 36px);
          font-weight: 900;
          line-height: 1.5;
          letter-spacing: -0.8px;
        }

        .page-heading h1 span {
          color: #c5a867;
        }

        .intro {
          margin: 0;
          color: #99958c;
          font-size: 12px;
          line-height: 2;
        }

        .list-section {
          padding: 16px;
          background: rgba(255, 255, 255, 0.018);
          border: 1px solid rgba(255, 255, 255, 0.065);
          border-radius: 19px;
        }

        .list-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 14px;
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
          width: 36px;
          height: 36px;
          color: #cbb476;
          background: rgba(197, 168, 103, 0.09);
          border: 1px solid rgba(197, 168, 103, 0.14);
          border-radius: 11px;
        }

        .list-heading h2 {
          margin: 0;
          color: #f0ece3;
          font-size: 13px;
          font-weight: 800;
        }

        .list-heading p {
          margin: 4px 0 0;
          color: #817d74;
          font-size: 10px;
        }

        .count-pill {
          display: inline-flex;
          flex-shrink: 0;
          align-items: center;
          gap: 5px;
          min-height: 29px;
          padding: 0 9px;
          color: #aaa18c;
          background: rgba(197, 168, 103, 0.065);
          border: 1px solid rgba(197, 168, 103, 0.12);
          border-radius: 9px;
          font-size: 10px;
        }

        .count-number {
          color: #e0c581;
          font-size: 12px;
          font-weight: 800;
        }

        .count-dot {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(197, 168, 103, 0.22);
          border-top-color: #c5a867;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .homework-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .homework-card {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          min-height: 66px;
          gap: 10px;
          padding: 10px 11px;
          overflow: hidden;
          color: inherit;
          text-align: right;
          background: #10100f;
          border: 1px solid #25231d;
          border-radius: 12px;
          cursor: pointer;
          transition:
            background 0.18s ease,
            border-color 0.18s ease,
            transform 0.18s ease;
          animation: enter 0.28s ease both;
        }

        .homework-card:hover {
          background: #17150f;
          border-color: rgba(197, 168, 103, 0.4);
          transform: translateY(-1px);
        }

        .homework-card:focus-visible,
        .back-button:focus-visible,
        .retry-button:focus-visible {
          outline: 2px solid #c5a867;
          outline-offset: 3px;
        }

        .important-card {
          background: linear-gradient(
            100deg,
            rgba(197, 168, 103, 0.075),
            #10100f 55%
          );
          border-color: rgba(197, 168, 103, 0.21);
        }

        .assignment-icon {
          display: grid;
          flex-shrink: 0;
          place-items: center;
          width: 37px;
          height: 37px;
          color: #b9a16b;
          background: #1a1812;
          border: 1px solid rgba(197, 168, 103, 0.14);
          border-radius: 10px;
        }

        .important-icon {
          color: #dfc27c;
          background: rgba(197, 168, 103, 0.13);
          border-color: rgba(197, 168, 103, 0.22);
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
          gap: 6px;
          margin-bottom: 5px;
        }

        .assignment-title-row h3 {
          margin: 0;
          color: #efede7;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.8;
          overflow-wrap: anywhere;
        }

        .important-badge {
          display: inline-flex;
          align-items: center;
          padding: 1px 6px;
          color: #d9bd7b;
          background: rgba(197, 168, 103, 0.1);
          border: 1px solid rgba(197, 168, 103, 0.2);
          border-radius: 5px;
          font-size: 9px;
          line-height: 1.7;
        }

        .assignment-date {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #918c80;
          font-size: 10px;
          line-height: 1.7;
        }

        .assignment-date :global(svg) {
          flex-shrink: 0;
          color: #a9915b;
        }

        .assignment-arrow {
          display: grid;
          flex-shrink: 0;
          place-items: center;
          width: 27px;
          height: 27px;
          color: #a9966a;
          background: rgba(197, 168, 103, 0.045);
          border: 1px solid rgba(197, 168, 103, 0.1);
          border-radius: 8px;
        }

        .assignment-arrow :global(svg) {
          transform: rotate(180deg);
        }

        .assignment-number {
          position: absolute;
          top: 3px;
          left: 7px;
          color: rgba(197, 168, 103, 0.28);
          font-size: 8px;
          pointer-events: none;
        }

        .state-card {
          display: flex;
          align-items: center;
          flex-direction: column;
          padding: 30px 18px;
          text-align: center;
          background: #10100f;
          border: 1px solid #25231d;
          border-radius: 13px;
        }

        .state-icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          margin-bottom: 13px;
          color: #cbb476;
          background: rgba(197, 168, 103, 0.09);
          border: 1px solid rgba(197, 168, 103, 0.18);
          border-radius: 14px;
        }

        .state-card h3 {
          margin: 0;
          color: #f0ece3;
          font-size: 14px;
          font-weight: 800;
        }

        .state-card p {
          max-width: 330px;
          margin: 8px 0 0;
          color: #928d82;
          font-size: 11px;
          line-height: 2;
        }

        .retry-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 37px;
          margin-top: 17px;
          padding: 0 13px;
          color: #e0c581;
          background: rgba(197, 168, 103, 0.09);
          border: 1px solid rgba(197, 168, 103, 0.24);
          border-radius: 9px;
          font-family: inherit;
          font-size: 11px;
          cursor: pointer;
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
          width: 57px;
          height: 57px;
          color: #cfb575;
          background: rgba(197, 168, 103, 0.09);
          border: 1px solid rgba(197, 168, 103, 0.19);
          border-radius: 17px;
          transform: rotate(-4deg);
        }

        .empty-star {
          position: absolute;
          color: #c5a867;
        }

        .star-one {
          top: 5px;
          right: 5px;
          font-size: 15px;
        }

        .star-two {
          bottom: 4px;
          left: 5px;
          color: #877349;
          font-size: 18px;
        }

        .empty-note {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 17px;
          padding: 7px 10px;
          color: #b5a474;
          background: rgba(197, 168, 103, 0.06);
          border-radius: 8px;
          font-size: 10px;
        }

        .skeleton-card {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 66px;
          padding: 10px 11px;
          background: #10100f;
          border: 1px solid #22211d;
          border-radius: 12px;
        }

        .skeleton-icon {
          flex-shrink: 0;
          width: 37px;
          height: 37px;
          border-radius: 10px;
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
          width: 27px;
          height: 27px;
          border-radius: 8px;
        }

        .shimmer {
          background: linear-gradient(
            100deg,
            #191815 25%,
            #252219 50%,
            #191815 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        .bottom-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 13px;
          color: #898477;
          font-size: 10px;
          line-height: 1.8;
          text-align: center;
        }

        .bottom-note-icon {
          display: grid;
          place-items: center;
          color: #bda76e;
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
            rgba(197, 168, 103, 0.19),
            transparent
          );
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #c5a867;
          font-size: 11px;
          font-weight: 800;
        }

        .footer-star {
          font-size: 12px;
        }

        .footer p {
          margin: 6px 0 0;
          color: #77736a;
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
          .page {
            padding-top: 27px;
          }

          .page-heading {
            padding-top: 42px;
            padding-bottom: 32px;
          }

          .list-section {
            padding: 19px;
          }

          .homework-card {
            min-height: 70px;
            padding: 11px 13px;
          }
        }

        @media (max-width: 420px) {
          .page {
            padding: 15px 12px 20px;
          }

          .page-heading {
            padding-top: 29px;
            padding-bottom: 22px;
          }

          .page-heading h1 {
            font-size: 30px;
          }

          .intro {
            font-size: 11px;
          }

          .list-section {
            padding: 11px;
            border-radius: 16px;
          }

          .list-heading {
            margin-bottom: 11px;
          }

          .homework-list {
            gap: 6px;
          }

          .homework-card {
            min-height: 62px;
            gap: 8px;
            padding: 9px;
            border-radius: 11px;
          }

          .assignment-icon {
            width: 33px;
            height: 33px;
            border-radius: 9px;
          }

          .assignment-title-row h3 {
            font-size: 11px;
          }

          .assignment-date {
            font-size: 9px;
          }

          .assignment-arrow {
            width: 24px;
            height: 24px;
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