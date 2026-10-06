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

type TomorrowHomework = {
  homework_id: string
}

export default function TomorrowHomeworkPage() {
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

    async function loadTomorrowHomework() {
      const supabase = createClient()

      const {
        data: tomorrowItems,
        error: tomorrowError,
      } = await supabase
        .from('tomorrow_homework')
        .select('homework_id')
        .order('created_at', { ascending: false })

      if (tomorrowError) {
        console.error(
          'LOAD TOMORROW HOMEWORK ERROR:',
          tomorrowError
        )

        setError('دریافت تکالیف فردا انجام نشد.')
        setLoading(false)
        return
      }

      const tomorrowIds =
        (tomorrowItems as TomorrowHomework[] | null)?.map(
          (item) => item.homework_id
        ) ?? []

      if (tomorrowIds.length === 0) {
        setHomework([])
        setLoading(false)
        return
      }

      const {
        data: homeworkData,
        error: homeworkError,
      } = await supabase
        .from('homework')
        .select(
          'id, title, due_date, content, is_red, created_at'
        )
        .in('id', tomorrowIds)

      if (homeworkError) {
        console.error(
          'LOAD TOMORROW HOMEWORK DETAILS ERROR:',
          homeworkError
        )

        setError('دریافت جزئیات تکالیف فردا انجام نشد.')
        setLoading(false)
        return
      }

      const homeworkMap = new Map(
        (homeworkData ?? []).map((item) => [
          item.id,
          item,
        ])
      )

      const orderedHomework = tomorrowIds
        .map((id) => homeworkMap.get(id))
        .filter(
          (item): item is Homework =>
            Boolean(item)
        )

      setHomework(orderedHomework)
      setLoading(false)
    }

    loadTomorrowHomework()
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

            <p>
              در حال دریافت تکالیف فردا...
            </p>
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
              برنامه فردا
            </span>

            <h1>
              تکالیف فردا
            </h1>
          </div>
        </header>

        {error ? (
          <section className="empty-card">
            <div className="empty-icon">
              !
            </div>

            <h2>
              خطایی رخ داد
            </h2>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="retry-button"
              onClick={() =>
                window.location.reload()
              }
            >
              تلاش دوباره
            </button>
          </section>
        ) : homework.length === 0 ? (
          <section className="empty-card">
            <div className="empty-icon">
              ✓
            </div>

            <h2>
              برای فردا تکلیفی ثبت نشده است
            </h2>

            <p>
              در حال حاضر تکلیفی برای فردا توسط مدیریت
              انتخاب نشده است.
            </p>
          </section>
        ) : (
          <section className="homework-list">
            {homework.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`homework-card ${
                  item.is_red
                    ? 'homework-card-red'
                    : ''
                }`}
                style={{
                  animationDelay: `${index * 70}ms`,
                }}
                onClick={() =>
                  router.push(
                    `/tomorrow-homework/${item.id}`
                  )
                }
              >
                <span className="homework-card-top">
                  <span className="homework-card-label">
                    تکلیف فردا
                  </span>

                  <span className="homework-card-arrow">
                    ←
                  </span>
                </span>

                <span className="homework-card-title">
                  {item.title}
                </span>

                <span className="homework-card-date">
                  <span>
                    تاریخ ارائه
                  </span>

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