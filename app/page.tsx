'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const student = localStorage.getItem('taklif-man-student')

    if (!student) {
      router.replace('/register')
      return
    }

    setReady(true)
  }, [router])

  if (!ready) {
    return null
  }

  return (
    <main className="app-shell" dir="rtl">
      <div className="home-container">
        <header className="brand">
          <span className="brand-small">
            دسترسی سریع به تکالیف
          </span>

          <h1>تکلیف من</h1>

          <p>
            همه تکالیف کلاس، ساده و همیشه در دسترس.
          </p>
        </header>

        <section className="intro-card">
          <p>
            این اپلیکیشن جهت یادآوری و دسترسی سریع‌تر
            به تکالیف گفته شده توسط معلمین طراحی شده.
          </p>
        </section>

        <button
          type="button"
          className="homework-button"
          onClick={() => router.push('/homework')}
        >
          <span className="homework-button-content">
            <span className="homework-button-label">
              تکالیف جاری
            </span>

            <span className="homework-button-hint">
              مشاهده تکالیف کلاس
            </span>
          </span>

          <span className="homework-arrow">
            ←
          </span>
        </button>

        <footer className="creator">
          <div className="creator-line" />

          <p>
            طراحی شده توسط امید اوقانی
          </p>
        </footer>
      </div>
    </main>
  )
}