'use client'

import { FormEvent, useEffect, useState } from 'react'
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

type FormState = {
  title: string
  due_date: string
  content: string
  is_red: boolean
}

const emptyForm: FormState = {
  title: '',
  due_date: '',
  content: '',
  is_red: false,
}

export default function AdminHomeworkPage() {
  const router = useRouter()

  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function loadHomework() {
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: fetchError } = await supabase
      .from('homework')
      .select('id, title, due_date, content, is_red, created_at')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('LOAD HOMEWORK ERROR:', fetchError)
      setError(`دریافت تکالیف انجام نشد: ${fetchError.message}`)
      setHomework([])
      setLoading(false)
      return
    }

    setHomework(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadHomework()
  }, [])

  function updateForm<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSuccess('')

    const title = form.title.trim()
    const dueDate = form.due_date.trim()
    const content = form.content.trim()

    if (!title) {
      setError('لطفاً عنوان تکلیف را وارد کنید.')
      return
    }

    if (!dueDate) {
      setError('لطفاً تاریخ تحویل را وارد کنید.')
      return
    }

    if (!content) {
      setError('لطفاً متن تکلیف را وارد کنید.')
      return
    }

    setSaving(true)

    const supabase = createClient()

    // مهم: قبل از resetForm مشخص می‌کنیم که عملیات ویرایش بوده یا افزودن
    const wasEditing = Boolean(editingId)

    let operationError = null

    if (wasEditing && editingId) {
      const { error: updateError } = await supabase
        .from('homework')
        .update({
          title,
          due_date: dueDate,
          content,
          is_red: form.is_red,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId)

      operationError = updateError
    } else {
      const { error: insertError } = await supabase
        .from('homework')
        .insert({
          title,
          due_date: dueDate,
          content,
          is_red: form.is_red,
        })

      operationError = insertError
    }

    if (operationError) {
      console.error('SAVE HOMEWORK ERROR:', operationError)

      setError(
        `ذخیره تکلیف انجام نشد: ${operationError.message}`
      )

      setSaving(false)
      return
    }

    resetForm()

    setSuccess(
      wasEditing
        ? 'تکلیف با موفقیت ویرایش شد.'
        : 'تکلیف جدید با موفقیت اضافه شد.'
    )

    // بعد از ذخیره، لیست را دوباره مستقیماً از Supabase می‌گیریم
    await loadHomework()

    setSaving(false)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function startEditing(item: Homework) {
    setError('')
    setSuccess('')

    setEditingId(item.id)

    setForm({
      title: item.title,
      due_date: item.due_date,
      content: item.content,
      is_red: item.is_red,
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      'آیا مطمئن هستید که می‌خواهید این تکلیف را حذف کنید؟'
    )

    if (!confirmed) return

    setError('')
    setSuccess('')
    setDeletingId(id)

    const supabase = createClient()

    const { error: deleteError } = await supabase
      .from('homework')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('DELETE HOMEWORK ERROR:', deleteError)

      setError(
        `حذف تکلیف انجام نشد: ${deleteError.message}`
      )

      setDeletingId(null)
      return
    }

    if (editingId === id) {
      resetForm()
    }

    setSuccess('تکلیف با موفقیت حذف شد.')

    await loadHomework()

    setDeletingId(null)
  }

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
          <p>در حال دریافت تکالیف...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="admin-management-page" dir="rtl">
      <div className="admin-management-container">

        {/* Header */}
        <header className="admin-management-header">
          <div>
            <span className="admin-management-eyebrow">
              پنل مدیریت
            </span>

            <h1>
              مدیریت تکالیف
            </h1>

            <p>
              تکالیف کلاس را اضافه، ویرایش یا حذف کنید.
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

        {/* Form */}
        <section className="admin-homework-form-card">
          <div className="admin-form-heading">
            <div className="admin-form-heading-icon">
              {editingId ? '✎' : '+'}
            </div>

            <div>
              <span>
                {editingId
                  ? 'ویرایش تکلیف'
                  : 'افزودن تکلیف جدید'}
              </span>

              <p>
                اطلاعات تکلیف را وارد کنید.
              </p>
            </div>
          </div>

          <form
            className="admin-homework-form"
            onSubmit={handleSubmit}
          >
            <div className="admin-form-row">

              <label className="admin-form-field">
                <span>عنوان تکلیف</span>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateForm('title', event.target.value)
                  }
                  placeholder="مثلاً: حل تمرین صفحه ۴۲"
                  disabled={saving}
                />
              </label>

              <label className="admin-form-field">
                <span>تاریخ تحویل</span>

                <input
                  type="text"
                  value={form.due_date}
                  onChange={(event) =>
                    updateForm(
                      'due_date',
                      event.target.value
                    )
                  }
                  placeholder="مثلاً: ۲۷ مرداد"
                  disabled={saving}
                />
              </label>

            </div>

            <label className="admin-form-field">
              <span>متن تکلیف</span>

              <textarea
                value={form.content}
                onChange={(event) =>
                  updateForm(
                    'content',
                    event.target.value
                  )
                }
                placeholder="متن کامل تکلیف را اینجا بنویسید..."
                rows={7}
                disabled={saving}
              />
            </label>

            <label className="admin-red-option">
              <input
                type="checkbox"
                checked={form.is_red}
                onChange={(event) =>
                  updateForm(
                    'is_red',
                    event.target.checked
                  )
                }
                disabled={saving}
              />

              <span className="admin-red-checkbox">
                {form.is_red ? '✓' : ''}
              </span>

              <span>
                <strong>
                  این تکلیف مهم است
                </strong>

                <small>
                  حاشیه کارت تکلیف به رنگ قرمز نمایش داده شود.
                </small>
              </span>
            </label>

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

            <div className="admin-form-actions">

              <button
                type="submit"
                className="admin-save-button"
                disabled={saving}
              >
                {saving
                  ? 'در حال ذخیره...'
                  : editingId
                    ? 'ذخیره تغییرات'
                    : 'افزودن تکلیف'}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="admin-cancel-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  انصراف
                </button>
              )}

            </div>
          </form>
        </section>

        {/* Homework List */}
        <section className="admin-homework-list-section">

          <div className="admin-list-heading">
            <div>
              <span>
                تکالیف ثبت‌شده
              </span>

              <p>
                {homework.length === 0
                  ? 'هنوز تکلیفی ثبت نشده است.'
                  : `${homework.length} تکلیف در سامانه ثبت شده است.`}
              </p>
            </div>

            <div className="admin-list-count">
              {homework.length}
            </div>
          </div>

          {homework.length === 0 ? (
            <div className="admin-empty-homework">
              <div className="admin-empty-icon">
                ◌
              </div>

              <h3>
                هنوز تکلیفی اضافه نشده
              </h3>

              <p>
                اولین تکلیف کلاس را از فرم بالا اضافه کنید.
              </p>
            </div>
          ) : (
            <div className="admin-homework-list">

              {homework.map((item) => (
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

                    <h2>
                      {item.title}
                    </h2>

                    <p>
                      {item.content}
                    </p>

                  </div>

                  <div className="admin-homework-item-actions">

                    <button
                      type="button"
                      className="admin-edit-button"
                      onClick={() =>
                        startEditing(item)
                      }
                      disabled={deletingId === item.id}
                    >
                      ویرایش
                    </button>

                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() =>
                        handleDelete(item.id)
                      }
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id
                        ? 'در حال حذف...'
                        : 'حذف'}
                    </button>

                  </div>
                </article>
              ))}

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