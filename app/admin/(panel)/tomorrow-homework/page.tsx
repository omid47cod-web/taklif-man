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
  id: string
  homework_id: string
  created_at: string
}

export default function AdminTomorrowHomeworkPage() {
  const router = useRouter()

  const [homework, setHomework] = useState<Homework[]>([])
  const [tomorrowHomework, setTomorrowHomework] =
    useState<TomorrowHomework[]>([])

  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] =
    useState<string | null>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')

    const supabase = createClient()

    const [
      { data: homeworkData, error: homeworkError },
      {
        data: tomorrowData,
        error: tomorrowError,
      },
    ] = await Promise.all([
      supabase
        .from('homework')
        .select(
          'id, title, due_date, content, is_red, created_at'
        )
        .order('created_at', {
          ascending: false,
        }),

      supabase
        .from('tomorrow_homework')
        .select(
          'id, homework_id, created_at'
        )
        .order('created_at', {
          ascending: false,
        }),
    ])

    if (homeworkError) {
      console.error(
        'LOAD HOMEWORK ERROR:',
        homeworkError
      )

      setError(
        `دریافت تکالیف انجام نشد: ${homeworkError.message}`
      )

      setLoading(false)
      return
    }

    if (tomorrowError) {
      console.error(
        'LOAD TOMORROW HOMEWORK ERROR:',
        tomorrowError
      )

      setError(
        `دریافت فهرست تکالیف فردا انجام نشد: ${tomorrowError.message}`
      )

      setLoading(false)
      return
    }

    setHomework(homeworkData ?? [])
    setTomorrowHomework(tomorrowData ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  function isTomorrow(homeworkId: string) {
    return tomorrowHomework.some(
      (item) => item.homework_id === homeworkId
    )
  }

  async function handleAddToTomorrow(
    homeworkId: string
  ) {
    setActionLoading(homeworkId)
    setError('')
    setSuccess('')

    const supabase = createClient()

    const { error: insertError } =
      await supabase
        .from('tomorrow_homework')
        .insert({
          homework_id: homeworkId,
        })

    if (insertError) {
      console.error(
        'ADD TOMORROW HOMEWORK ERROR:',
        insertError
      )

      if (insertError.code === '23505') {
        setError(
          'این تکلیف قبلاً برای فردا انتخاب شده است.'
        )
      } else {
        setError(
          `اضافه کردن تکلیف انجام نشد: ${insertError.message}`
        )
      }

      setActionLoading(null)
      return
    }

    setSuccess(
      'تکلیف با موفقیت برای فردا انتخاب شد.'
    )

    await loadData()

    setActionLoading(null)
  }

  async function handleRemoveFromTomorrow(
    homeworkId: string
  ) {
    setActionLoading(homeworkId)
    setError('')
    setSuccess('')

    const supabase = createClient()

    const { error: deleteError } =
      await supabase
        .from('tomorrow_homework')
        .delete()
        .eq('homework_id', homeworkId)

    if (deleteError) {
      console.error(
        'REMOVE TOMORROW HOMEWORK ERROR:',
        deleteError
      )

      setError(
        `حذف از تکالیف فردا انجام نشد: ${deleteError.message}`
      )

      setActionLoading(null)
      return
    }

    setSuccess(
      'تکلیف از فهرست فردا حذف شد.'
    )

    await loadData()

    setActionLoading(null)
  }

  async function handleLogout() {
    const supabase = createClient()

    await supabase.auth.signOut()

    router.replace('/admin/login')
    router.refresh()
  }

  const tomorrowIds = new Set(
    tomorrowHomework.map(
      (item) => item.homework_id
    )
  )

  const selectedHomework = homework.filter(
    (item) => tomorrowIds.has(item.id)
  )

  const availableHomework = homework.filter(
    (item) => !tomorrowIds.has(item.id)
  )

  if (loading) {
    return (
      <main
        className="admin-management-page"
        dir="rtl"
      >
        <div className="admin-page-loader">
          <div className="loader-spinner" />

          <p>
            در حال دریافت اطلاعات...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main
      className="admin-management-page"
      dir="rtl"
    >
      <div className="admin-management-container">

        <header className="admin-management-header">
          <div>
            <span className="admin-management-eyebrow">
              پنل مدیریت
            </span>

            <h1>
              تکالیف فردا
            </h1>

            <p>
              تکالیفی را که می‌خواهید برای فردا
              نمایش داده شوند انتخاب کنید.
            </p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-back-dashboard"
              onClick={() =>
                router.push('/admin')
              }
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

        {error && (
          <div className="admin-form-message admin-form-error">
            {error}
          </div>
        )}

        {success && (
          <div className="admin-form-message admin-form-success">
            {success}
          </div>
        )}

        <section className="admin-homework-list-section">

          <div className="admin-list-heading">
            <div>
              <h2>
                انتخاب‌شده برای فردا
              </h2>

              <p>
                این تکالیف در بخش «تکالیف فردا»
                برای دانش‌آموزان نمایش داده می‌شوند.
              </p>
            </div>

            <span className="admin-list-count">
              {selectedHomework.length}
            </span>
          </div>

          {selectedHomework.length === 0 ? (
            <section className="admin-empty-homework">
              <div className="admin-empty-icon">
                ◌
              </div>

              <h3>
                هنوز تکلیفی برای فردا انتخاب نشده است
              </h3>

              <p>
                از بخش تکالیف موجود، موارد موردنظر
                را برای فردا انتخاب کنید.
              </p>
            </section>
          ) : (
            <div className="admin-homework-list">
              {selectedHomework.map(
                (item) => (
                  <article
                    key={item.id}
                    className={`admin-homework-item ${
                      item.is_red
                        ? 'admin-homework-item-red'
                        : ''
                    }`}
                  >
                    <div className="admin-homework-item-main">

                      <div className="admin-homework-item-top">
                        {item.is_red && (
                          <span className="admin-important-label">
                            مهم
                          </span>
                        )}

                        <span className="admin-homework-date">
                          {item.due_date}
                        </span>
                      </div>

                      <strong>
                        {item.title}
                      </strong>
                    </div>

                    <div className="admin-homework-item-actions">
                      <button
                        type="button"
                        className="admin-delete-button"
                        disabled={
                          actionLoading === item.id
                        }
                        onClick={() =>
                          handleRemoveFromTomorrow(
                            item.id
                          )
                        }
                      >
                        {actionLoading ===
                        item.id
                          ? 'در حال انجام...'
                          : 'حذف از فردا'}
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        <section className="admin-homework-list-section">

          <div className="admin-list-heading">
            <div>
              <h2>
                تکالیف موجود
              </h2>

              <p>
                تکالیفی که هنوز برای فردا انتخاب
                نشده‌اند.
              </p>
            </div>

            <span className="admin-list-count">
              {availableHomework.length}
            </span>
          </div>

          {availableHomework.length === 0 ? (
            <section className="admin-empty-homework">
              <div className="admin-empty-icon">
                ✓
              </div>

              <h3>
                همه تکالیف برای فردا انتخاب شده‌اند
              </h3>

              <p>
                در حال حاضر تکلیف دیگری برای
                انتخاب باقی نمانده است.
              </p>
            </section>
          ) : (
            <div className="admin-homework-list">
              {availableHomework.map(
                (item) => (
                  <article
                    key={item.id}
                    className={`admin-homework-item ${
                      item.is_red
                        ? 'admin-homework-item-red'
                        : ''
                    }`}
                  >
                    <div className="admin-homework-item-main">

                      <div className="admin-homework-item-top">
                        {item.is_red && (
                          <span className="admin-important-label">
                            مهم
                          </span>
                        )}

                        <span className="admin-homework-date">
                          {item.due_date}
                        </span>
                      </div>

                      <strong>
                        {item.title}
                      </strong>
                    </div>

                    <div className="admin-homework-item-actions">
                      <button
                        type="button"
                        className="admin-edit-button"
                        disabled={
                          actionLoading === item.id
                        }
                        onClick={() =>
                          handleAddToTomorrow(
                            item.id
                          )
                        }
                      >
                        {actionLoading ===
                        item.id
                          ? 'در حال انجام...'
                          : 'انتخاب برای فردا'}
                      </button>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        <footer className="admin-management-footer">
          تکلیف من · پنل مدیریت
        </footer>

      </div>
    </main>
  )
}