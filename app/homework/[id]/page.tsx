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

export default function HomeworkDetailPage() {
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
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('homework')
        .select(
          'id, title, due_date, content, is_red, created_at'
        )
        .eq('id', id)
        .single()

      if (fetchError || !data) {
        setError('این تکلیف پیدا نشد.')
        setLoading(false)
        return
      }

      setHomework(data)
      setLoading(false)
    }

    loadHomework()
  }, [id, router])

  function handleBackToHomework() {
    router.push('/homework')
  }

  if (loading) {
    return (
      <main className="app-shell" dir="rtl">
        <div className="page-loader">
          <div className="loader-ring" />
          <p>در حال دریافت تکلیف...</p>
        </div>
      </main>
    )
  }

  if (error || !homework) {
    return (
      <main className="app-shell" dir="rtl">
        <div className="homework-detail-page">
          <button
            type="button"
            className="back-button"
            onClick={handleBackToHomework}
          >
            <span>→</span>
            بازگشت
          </button>

          <section className="empty-card detail-error-card">
            <div className="empty-icon">!</div>

            <h2>تکلیف پیدا نشد</h2>

            <p>
              {error || 'ممکن است این تکلیف حذف شده باشد.'}
            </p>

            <button
              type="button"
              className="detail-return-button"
              onClick={handleBackToHomework}
            >
              مشاهده تکالیف
            </button>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell" dir="rtl">
      <div className="homework-detail-page">
        <header className="detail-topbar">
          <button
            type="button"
            className="back-button"
            onClick={handleBackToHomework}
            aria-label="بازگشت به تکالیف"
          >
            <span>→</span>
            بازگشت
          </button>

          <span className="detail-topbar-label">
            جزئیات تکلیف
          </span>
        </header>

        <article
          className={`homework-detail-card ${
            homework.is_red
              ? 'homework-detail-card-red'
              : ''
          }`}
        >
          <div className="detail-accent" />

          <div className="detail-content">
            <div className="detail-meta">
              <span className="detail-meta-label">
                تکلیف کلاس
              </span>

              {homework.is_red && (
                <span className="important-badge">
                  مهم
                </span>
              )}
            </div>

            <h1>{homework.title}</h1>

            <div className="detail-date">
              <span className="detail-date-icon">◷</span>

              <div>
                <span>مهلت انجام</span>
                <strong>{homework.due_date}</strong>
              </div>
            </div>

            <div className="detail-divider" />

            <section className="detail-text-section">
              <span className="detail-section-label">
                متن تکلیف
              </span>

              <div className="detail-text">
                {homework.content.split('\n').map(
                  (line, index) => (
                    <p key={index}>
                      {line || '\u00A0'}
                    </p>
                  )
                )}
              </div>
            </section>
          </div>
        </article>

        <button
          type="button"
          className="detail-bottom-button"
          onClick={handleBackToHomework}
        >
          بازگشت به تکالیف
          <span>←</span>
        </button>
      </div>
    </main>
  )
}