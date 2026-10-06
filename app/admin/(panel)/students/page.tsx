'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Student = {
  id: string
  full_name: string
  phone: string
  created_at: string
  is_blocked: boolean
  block_reason: string | null
}

export default function AdminStudentsPage() {
  const router = useRouter()

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] =
    useState<string | null>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [blockStudent, setBlockStudent] =
    useState<Student | null>(null)

  const [blockReason, setBlockReason] =
    useState('')

  const [blockSubmitting, setBlockSubmitting] =
    useState(false)

  async function loadStudents() {
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: fetchError } =
      await supabase
        .from('students')
        .select(
          'id, full_name, phone, created_at, is_blocked, block_reason'
        )
        .order('created_at', {
          ascending: false,
        })

    if (fetchError) {
      console.error(
        'LOAD STUDENTS ERROR:',
        fetchError
      )

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

  async function handleDeleteStudent(
    student: Student
  ) {
    const confirmed = window.confirm(
      `آیا مطمئن هستید که می‌خواهید «${student.full_name}» را حذف کنید؟\n\nپس از حذف، این دانش‌آموز می‌تواند دوباره با همین شماره ثبت‌نام کند.`
    )

    if (!confirmed) {
      return
    }

    setActionLoading(student.id)
    setError('')
    setSuccess('')

    const supabase = createClient()

    const { error: deleteError } =
      await supabase
        .from('students')
        .delete()
        .eq('id', student.id)

    if (deleteError) {
      console.error(
        'DELETE STUDENT ERROR:',
        deleteError
      )

      setError(
        `حذف دانش‌آموز انجام نشد: ${deleteError.message}`
      )

      setActionLoading(null)
      return
    }

    setSuccess(
      `دانش‌آموز «${student.full_name}» با موفقیت حذف شد.`
    )

    await loadStudents()

    setActionLoading(null)
  }

  function openBlockModal(student: Student) {
    setError('')
    setSuccess('')
    setBlockReason('')
    setBlockStudent(student)
  }

  function closeBlockModal() {
    if (blockSubmitting) {
      return
    }

    setBlockStudent(null)
    setBlockReason('')
  }

  async function handleBlockStudent() {
    if (!blockStudent) {
      return
    }

    const trimmedReason = blockReason.trim()

    if (!trimmedReason) {
      setError(
        'برای انسداد دانش‌آموز باید دلیل وارد کنید.'
      )

      setSuccess('')
      return
    }

    setBlockSubmitting(true)
    setActionLoading(blockStudent.id)
    setError('')
    setSuccess('')

    const supabase = createClient()

    const { error: updateError } =
      await supabase
        .from('students')
        .update({
          is_blocked: true,
          block_reason: trimmedReason,
        })
        .eq('id', blockStudent.id)

    if (updateError) {
      console.error(
        'BLOCK STUDENT ERROR:',
        updateError
      )

      setError(
        `انسداد دانش‌آموز انجام نشد: ${updateError.message}`
      )

      setBlockSubmitting(false)
      setActionLoading(null)
      return
    }

    const studentName = blockStudent.full_name

    setBlockStudent(null)
    setBlockReason('')
    setBlockSubmitting(false)

    setSuccess(
      `«${studentName}» با موفقیت مسدود شد.`
    )

    await loadStudents()

    setActionLoading(null)
  }

  async function handleUnblockStudent(
    student: Student
  ) {
    const confirmed = window.confirm(
      `آیا می‌خواهید انسداد «${student.full_name}» لغو شود؟`
    )

    if (!confirmed) {
      return
    }

    setActionLoading(student.id)
    setError('')
    setSuccess('')

    const supabase = createClient()

    const { error: updateError } =
      await supabase
        .from('students')
        .update({
          is_blocked: false,
          block_reason: null,
        })
        .eq('id', student.id)

    if (updateError) {
      console.error(
        'UNBLOCK STUDENT ERROR:',
        updateError
      )

      setError(
        `لغو انسداد انجام نشد: ${updateError.message}`
      )

      setActionLoading(null)
      return
    }

    setSuccess(
      `انسداد «${student.full_name}» لغو شد.`
    )

    await loadStudents()

    setActionLoading(null)
  }

  async function handleLogout() {
    const supabase = createClient()

    await supabase.auth.signOut()

    router.replace('/admin/login')
    router.refresh()
  }

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

  const blockedCount = students.filter(
    (student) => student.is_blocked
  ).length

  return (
    <>
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
                دانش‌آموزان
              </h1>

              <p>
                فهرست افرادی که برای استفاده از سامانه
                ثبت‌نام کرده‌اند.
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

            {blockedCount > 0 && (
              <div>
                <span>
                  مسدودشده‌ها
                </span>

                <strong>
                  {blockedCount}
                </strong>
              </div>
            )}
          </section>

          {error && (
            <div
              className="admin-form-message admin-form-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="admin-form-message admin-form-success"
              role="status"
            >
              {success}
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
                با ثبت‌نام دانش‌آموزان، اطلاعات آن‌ها
                در این بخش نمایش داده می‌شود.
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
                    جدیدترین ثبت‌نام‌ها در ابتدای
                    فهرست قرار دارند.
                  </p>
                </div>

                <div className="admin-list-count">
                  {students.length}
                </div>
              </div>

              <div className="admin-students-list">

                {students.map(
                  (student, index) => (
                    <article
                      key={student.id}
                      className={`admin-student-item ${
                        student.is_blocked
                          ? 'admin-student-item-blocked'
                          : ''
                      }`}
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

                        {student.is_blocked && (
                          <div className="admin-student-block-info">
                            <span>
                              مسدود
                            </span>

                            {student.block_reason && (
                              <small>
                                دلیل: {student.block_reason}
                              </small>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="admin-student-date">
                        {new Date(
                          student.created_at
                        ).toLocaleDateString(
                          'fa-IR'
                        )}
                      </div>

                      <div className="admin-student-actions">
                        {student.is_blocked ? (
                          <button
                            type="button"
                            className="admin-unblock-button"
                            disabled={
                              actionLoading ===
                              student.id
                            }
                            onClick={() =>
                              handleUnblockStudent(
                                student
                              )
                            }
                          >
                            {actionLoading ===
                            student.id
                              ? 'در حال انجام...'
                              : 'لغو انسداد'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-block-button"
                            disabled={
                              actionLoading ===
                              student.id
                            }
                            onClick={() =>
                              openBlockModal(
                                student
                              )
                            }
                          >
                            انسداد
                          </button>
                        )}

                        <button
                          type="button"
                          className="admin-delete-button"
                          disabled={
                            actionLoading ===
                            student.id
                          }
                          onClick={() =>
                            handleDeleteStudent(
                              student
                            )
                          }
                        >
                          حذف کاربر
                        </button>
                      </div>
                    </article>
                  )
                )}

              </div>
            </section>
          )}

          <footer className="admin-management-footer">
            تکلیف من · پنل مدیریت
          </footer>

        </div>
      </main>

      {blockStudent && (
        <div
          className="admin-block-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeBlockModal()
            }
          }}
        >
          <section
            className="admin-block-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-student-title"
            dir="rtl"
          >
            <div className="admin-block-modal-icon">
              🔒
            </div>

            <div className="admin-block-modal-heading">
              <h2 id="block-student-title">
                انسداد دانش‌آموز
              </h2>

              <p>
                برای «{blockStudent.full_name}»
                دلیل انسداد را وارد کنید.
              </p>
            </div>

            <label
              className="admin-block-modal-label"
              htmlFor="block-reason"
            >
              دلیل انسداد
            </label>

            <textarea
              id="block-reason"
              className="admin-block-modal-textarea"
              value={blockReason}
              onChange={(event) =>
                setBlockReason(event.target.value)
              }
              placeholder="مثلاً عدم رعایت قوانین کلاس..."
              rows={4}
              autoFocus
              disabled={blockSubmitting}
              maxLength={500}
            />

            <div className="admin-block-modal-footer">
              <span>
                {blockReason.length}/500
              </span>

              <div className="admin-block-modal-actions">
                <button
                  type="button"
                  className="admin-block-modal-cancel"
                  onClick={closeBlockModal}
                  disabled={blockSubmitting}
                >
                  انصراف
                </button>

                <button
                  type="button"
                  className="admin-block-modal-submit"
                  onClick={handleBlockStudent}
                  disabled={blockSubmitting}
                >
                  {blockSubmitting
                    ? 'در حال انسداد...'
                    : 'انسداد کاربر'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  )
}