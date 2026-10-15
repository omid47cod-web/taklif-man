'use client'

import { type FormEvent, useEffect, useState } from 'react'
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

function HomeworkIcon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  switch (name) {
    case 'edit':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
      )

    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      )

    case 'check':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      )

    case 'alert':
      return (
        <svg {...common}>
          <path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      )

    case 'trash':
      return (
        <svg {...common}>
          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      )

    case 'back':
      return (
        <svg {...common}>
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      )

    default:
      return null
  }
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

    try {
      const supabase = createClient()

      const { data, error: fetchError } = await supabase
        .from('homework')
        .select('id, title, due_date, content, is_red, created_at')
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('LOAD HOMEWORK ERROR:', {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint,
        })

        setError(`دریافت تکالیف انجام نشد: ${fetchError.message}`)
        setHomework([])
        return
      }

      setHomework((data ?? []) as Homework[])
    } catch (err) {
      console.error('LOAD HOMEWORK ERROR:', err)
      setError('ارتباط با سامانه برقرار نشد. دوباره تلاش کنید.')
      setHomework([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadHomework()
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

    try {
      const supabase = createClient()
      const wasEditing = Boolean(editingId)

      const payload = {
        title,
        due_date: dueDate,
        content,
        is_red: form.is_red,
      }

      const { error: operationError } =
        wasEditing && editingId
          ? await supabase
              .from('homework')
              .update(payload)
              .eq('id', editingId)
          : await supabase
              .from('homework')
              .insert(payload)

      if (operationError) {
        console.error('SAVE HOMEWORK ERROR:', {
          message: operationError.message,
          code: operationError.code,
          details: operationError.details,
          hint: operationError.hint,
        })

        setError(
          `ذخیره تکلیف انجام نشد: ${operationError.message || 'خطای نامشخص'}`
        )
        return
      }

      resetForm()

      setSuccess(
        wasEditing
          ? 'تکلیف با موفقیت ویرایش شد.'
          : 'تکلیف جدید با موفقیت اضافه شد.'
      )

      await loadHomework()

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (err) {
      console.error('SAVE HOMEWORK ERROR:', err)
      setError('ارتباط با سامانه برقرار نشد. دوباره تلاش کنید.')
    } finally {
      setSaving(false)
    }
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

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('homework')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('DELETE HOMEWORK ERROR:', {
          message: deleteError.message,
          code: deleteError.code,
          details: deleteError.details,
          hint: deleteError.hint,
        })

        setError(`حذف تکلیف انجام نشد: ${deleteError.message}`)
        return
      }

      if (editingId === id) {
        resetForm()
      }

      setSuccess('تکلیف با موفقیت حذف شد.')
      await loadHomework()
    } catch (err) {
      console.error('DELETE HOMEWORK ERROR:', err)
      setError('ارتباط با سامانه برقرار نشد. دوباره تلاش کنید.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    const { error: logoutError } = await supabase.auth.signOut()

    if (logoutError) {
      setError('خروج از حساب انجام نشد. دوباره تلاش کنید.')
      return
    }

    router.replace('/admin/login')
    router.refresh()
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] text-white"
      >
        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#c9a96a]/10 blur-[120px]" />

        <div className="relative flex flex-col items-center gap-5">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a96a]" />
          <p className="text-sm text-white/45">
            در حال دریافت تکالیف...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#050505] text-white"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#c9a96a]/10 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-white/[0.04] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.045),transparent_42%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 sm:px-8 sm:py-10">
        {/* Header */}
        <header className="mb-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#c9a96a]/25 bg-[#c9a96a]/10 text-lg text-[#c9a96a] shadow-[0_0_30px_rgba(201,169,106,0.08)]">
                ت
              </div>

              <div>
                <p className="text-[11px] font-medium tracking-[0.25em] text-white/35">
                  TAKLIF MAN
                </p>
                <p className="text-sm font-medium text-white/75">
                  پنل مدیریت سامانه
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-xs text-white/55 transition hover:border-[#c9a96a]/30 hover:text-[#c9a96a]"
                onClick={() => router.push('/admin')}
              >
                <HomeworkIcon name="back" />
                داشبورد
              </button>

              <button
                type="button"
                className="rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-xs text-white/55 transition hover:border-red-400/30 hover:text-red-300"
                onClick={handleLogout}
              >
                خروج
              </button>
            </div>
          </div>

          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9a96a]/20 bg-[#c9a96a]/[0.07] px-3 py-1.5 text-[11px] font-medium text-[#c9a96a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9a96a]" />
              مدیریت محتوای کلاس
            </span>

            <h1 className="text-4xl font-bold leading-[1.25] tracking-tight text-white sm:text-5xl">
              مدیریت <span className="text-[#c9a96a]">تکالیف</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-[15px]">
              تکالیف کلاس را اضافه، ویرایش یا حذف کنید.
            </p>
          </div>
        </header>

        {/* Global messages */}
        {(error || success) && (
          <div
            role="status"
            className={`mb-6 rounded-2xl border p-4 text-sm leading-7 ${
              error
                ? 'border-red-400/20 bg-red-400/[0.06] text-red-200'
                : 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200'
            }`}
          >
            {error || success}
          </div>
        )}

        {/* Form */}
        <section className="mb-10 rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-5 sm:p-7">
          <div className="mb-7 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.08] text-[#c9a96a]">
              <HomeworkIcon name={editingId ? 'edit' : 'check'} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white/90">
                {editingId ? 'ویرایش تکلیف' : 'افزودن تکلیف جدید'}
              </h2>
              <p className="mt-1 text-xs leading-6 text-white/40">
                اطلاعات تکلیف را وارد کنید.
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block min-w-0">
                <span className="mb-2 block text-sm text-white/65">
                  عنوان تکلیف
                </span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateForm('title', event.target.value)
                  }
                  placeholder="مثلاً: حل تمرین صفحه ۴۲"
                  disabled={saving}
                  className="w-full rounded-2xl border border-white/[0.09] bg-black/30 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a96a]/50 focus:ring-2 focus:ring-[#c9a96a]/10 disabled:opacity-50"
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm text-white/65">
                  تاریخ تحویل
                </span>
                <div className="relative">
                  <input
                    type="text"
                    value={form.due_date}
                    onChange={(event) =>
                      updateForm('due_date', event.target.value)
                    }
                    placeholder="مثلاً: شنبه ۱۹ مهر"
                    disabled={saving}
                    className="w-full rounded-2xl border border-white/[0.09] bg-black/30 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a96a]/50 focus:ring-2 focus:ring-[#c9a96a]/10 disabled:opacity-50"
                  />
                </div>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm text-white/65">
                متن تکلیف
              </span>
              <textarea
                value={form.content}
                onChange={(event) =>
                  updateForm('content', event.target.value)
                }
                placeholder="متن کامل تکلیف را اینجا بنویسید..."
                rows={7}
                disabled={saving}
                className="w-full resize-y rounded-2xl border border-white/[0.09] bg-black/30 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/20 focus:border-[#c9a96a]/50 focus:ring-2 focus:ring-[#c9a96a]/10 disabled:opacity-50"
              />
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 transition hover:border-[#c9a96a]/20">
              <input
                type="checkbox"
                checked={form.is_red}
                onChange={(event) =>
                  updateForm('is_red', event.target.checked)
                }
                disabled={saving}
                className="mt-1 h-4 w-4 accent-[#c9a96a]"
              />

              <span className="min-w-0">
                <strong className="flex items-center gap-2 text-sm font-medium text-white/85">
                  <HomeworkIcon name="alert" />
                  این تکلیف مهم است
                </strong>
                <small className="mt-1 block text-xs leading-6 text-white/40">
                  حاشیه کارت تکلیف به رنگ قرمز نمایش داده شود.
                </small>
              </span>
            </label>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#c9a96a]/30 bg-[#c9a96a] px-6 py-3 text-sm font-semibold text-[#17130b] transition hover:bg-[#d8bc83] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <HomeworkIcon name={editingId ? 'edit' : 'check'} />
                    {editingId ? 'ذخیره تغییرات' : 'افزودن تکلیف'}
                  </>
                )}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="min-h-12 rounded-2xl border border-white/[0.09] bg-white/[0.035] px-5 py-3 text-sm text-white/60 transition hover:bg-white/[0.07] hover:text-white"
                  onClick={resetForm}
                  disabled={saving}
                >
                  انصراف از ویرایش
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Homework list */}
        <section className="flex-1">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-white/30">
                فهرست محتوا
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white/90">
                تکالیف ثبت‌شده
              </h2>
              <p className="mt-2 text-xs leading-6 text-white/35">
                {homework.length === 0
                  ? 'هنوز تکلیفی ثبت نشده است.'
                  : `${homework.length.toLocaleString('fa-IR')} تکلیف در سامانه ثبت شده است.`}
              </p>
            </div>

            <div className="flex h-11 min-w-11 items-center justify-center rounded-2xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.07] px-3 text-sm font-semibold tabular-nums text-[#c9a96a]">
              {homework.length.toLocaleString('fa-IR')}
            </div>
          </div>

          {homework.length === 0 ? (
            <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] px-5 py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.07] text-[#c9a96a]">
                <HomeworkIcon name="edit" />
              </div>

              <h3 className="text-base font-semibold text-white/80">
                هنوز تکلیفی اضافه نشده
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-white/35">
                اولین تکلیف کلاس را از فرم بالا اضافه کنید.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {homework.map((item) => (
                <article
                  key={item.id}
                  className={`group relative overflow-hidden rounded-[24px] border bg-white/[0.035] p-5 transition-all duration-300 hover:bg-white/[0.05] sm:p-6 ${
                    item.is_red
                      ? 'border-red-400/30'
                      : 'border-white/[0.08] hover:border-[#c9a96a]/25'
                  }`}
                >
                  <div
                    className={`absolute inset-y-0 right-0 w-1 ${
                      item.is_red ? 'bg-red-400' : 'bg-[#c9a96a]/0'
                    }`}
                  />

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {item.is_red && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-400/[0.08] px-2.5 py-1 text-[11px] font-medium text-red-300">
                            <HomeworkIcon name="alert" />
                            مهم
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[11px] text-white/45">
                          <HomeworkIcon name="calendar" />
                          {item.due_date}
                        </span>
                      </div>

                      <h3 className="break-words text-base font-semibold leading-7 text-white/90">
                        {item.title}
                      </h3>

                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-white/45">
                        {item.content}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2 sm:flex-col">
                      <button
                        type="button"
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.06] px-4 py-2 text-xs font-medium text-[#c9a96a] transition hover:bg-[#c9a96a]/[0.13] disabled:opacity-40 sm:flex-none"
                        onClick={() => startEditing(item)}
                        disabled={deletingId === item.id || saving}
                      >
                        <HomeworkIcon name="edit" />
                        ویرایش
                      </button>

                      <button
                        type="button"
                        className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.04] px-4 py-2 text-xs font-medium text-red-300/80 transition hover:border-red-400/30 hover:bg-red-400/[0.09] hover:text-red-200 disabled:opacity-40 sm:flex-none"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id || saving}
                      >
                        <HomeworkIcon name="trash" />
                        {deletingId === item.id ? 'در حال حذف...' : 'حذف'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-12 flex items-center justify-between border-t border-white/[0.06] pt-5 text-[11px] text-white/25">
          <span>تکلیف من</span>

          <div className="flex items-center gap-2">
            <span>پنل مدیریت</span>
            <span className="text-[#c9a96a]/50">•</span>
            <span className="text-white/40">امید اوقانی</span>
          </div>
        </footer>
      </div>
    </main>
  )
}

