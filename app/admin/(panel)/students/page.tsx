'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Student = {
  id: string
  full_name: string
  phone: string
  created_at: string
}

export default function AdminStudentsPage() {
  const router = useRouter()

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadStudents() {
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: fetchError } = await supabase
      .from('students')
      .select('id, full_name, phone, created_at')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('LOAD STUDENTS ERROR:', fetchError)

      setError(
        `دریافت اطلاعات دانش‌آموزان انجام نشد: ${fetchError.message}`
      )

      setStudents([])
      setLoading(false)
      return
    }

    setStudents(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadStudents()
  }, [])

  async function handleLogout() {
    const supabase = createClient()

    await supabase.auth.signOut()

    router.replace('/admin/login')
    router.refresh()
  }

  if (loading) {
    return (
      <main className="admin-management-page" dir="rtl">
        <div className="admin-page-loader">
          <div className="loader-spinner" />
          <p>در حال دریافت اطلاعات...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="admin-management-page" dir="rtl">
      <div className="admin-management-container">

        <header className="admin-management-header">
          <div>
            <span className="admin-management-eyebrow">
              پنل مدیریت
            </span>

            <h1>
              دانش‌آموزان
            </h1>

            <p>
              فهرست افرادی که برای استفاده از سامانه ثبت‌نام کرده‌اند.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-back-dashboard"
              onClick={() => router.push('/admin')}
            >
              ← داشبورد
            </button>

            <button
              type="button"
              className="admin-logout-button"
              onClick={handleLogout}
            >
              خروج
            </button>
          </div>
        </header>

        <section className="admin-students-summary">
          <div className="admin-students-summary-icon">
            👥
          </div>

          <div>
            <span>
              تعداد ثبت‌نام‌شده‌ها
            </span>

            <strong>
              {students.length}
            </strong>
          </div>
        </section>

        {error && (
          <div className="admin-form-message admin-form-error">
            {error}
          </div>
        )}

        {students.length === 0 ? (
          <section className="admin-empty-homework">
            <div className="admin-empty-icon">
              ◌
            </div>

            <h3>
              هنوز کسی ثبت‌نام نکرده است
            </h3>

            <p>
              با ثبت‌نام دانش‌آموزان، اطلاعات آن‌ها در این بخش نمایش داده می‌شود.
            </p>
          </section>
        ) : (
          <section className="admin-students-card">

            <div className="admin-students-card-header">
              <div>
                <span>
                  فهرست دانش‌آموزان
                </span>

                <p>
                  جدیدترین ثبت‌نام‌ها در ابتدای فهرست قرار دارند.
                </p>
              </div>

              <div className="admin-list-count">
                {students.length}
              </div>
            </div>

            <div className="admin-students-list">

              {students.map((student, index) => (
                <article
                  key={student.id}
                  className="admin-student-item"
                >
                  <div className="admin-student-number">
                    {index + 1}
                  </div>

                  <div className="admin-student-avatar">
                    {student.full_name
                      .trim()
                      .charAt(0)}
                  </div>

                  <div className="admin-student-info">
                    <strong>
                      {student.full_name}
                    </strong>

                    <span>
                      {student.phone}
                    </span>
                  </div>

                  <div className="admin-student-date">
                    {new Date(
                      student.created_at
                    ).toLocaleDateString('fa-IR')}
                  </div>
                </article>
              ))}

            </div>
          </section>
        )}

        <footer className="admin-management-footer">
          تکلیف من · پنل مدیریت
        </footer>

      </div>
    </main>
  )
}