'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Homework = {
  id: string
  title: string
  due_date: string
  content: string
  is_red: boolean
  created_at: string
}

export default function HomeworkPage() {
  const router = useRouter()

  const [homework, setHomework] = useState<Homework[]>([])
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
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError('دریافت تکالیف انجام نشد.')
        setLoading(false)
        return
      }

      setHomework(data ?? [])
      setLoading(false)
    }

    loadHomework()
  }, [router])

  function handleBack() {
    router.push('/')
  }

  if (loading) {
    return (
      <main className="app-shell" dir="rtl">
        <div className="homework-page">
          <div className="page-loader">
            <div className="loader-ring" />
            <p>در حال دریافت تکالیف...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell" dir="rtl">
      <div className="homework-page">
        <header className="page-header">
          <button
            type="button"
            className="back-button"
            onClick={handleBack}
            aria-label="بازگشت به صفحه اصلی"
          >
            →
          </button>

          <div>
            <span className="page-eyebrow">
              کلاس شما
            </span>

            <h1>تکالیف جاری</h1>
          </div>
        </header>

        {error ? (
          <section className="empty-card">
            <div className="empty-icon">!</div>

            <h2>خطایی رخ داد</h2>

            <p>{error}</p>

            <button
              type="button"
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              تلاش دوباره
            </button>
          </section>
        ) : homework.length === 0 ? (
          <section className="empty-card">
            <div className="empty-icon">✓</div>

            <h2>هیچ تکلیفی برای ارائه وجود ندارد</h2>

            <p>
              در حال حاضر تکلیف جدیدی توسط مدیریت ثبت نشده است.
            </p>
          </section>
        ) : (
          <section className="homework-list">
            {homework.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`homework-card ${
                  item.is_red ? 'homework-card-red' : ''
                }`}
                style={{
                  animationDelay: `${index * 70}ms`,
                }}
                onClick={() =>
                  router.push(`/homework/${item.id}`)
                }
              >
                <span className="homework-card-top">
                  <span className="homework-card-label">
                    تکلیف
                  </span>

                  <span className="homework-card-arrow">
                    ←
                  </span>
                </span>

                <span className="homework-card-title">
                  {item.title}
                </span>

                <span className="homework-card-date">
                  <span>تاریخ ارائه</span>
                  {item.due_date}
                </span>
              </button>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}