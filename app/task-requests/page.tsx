
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type TaskReply = {
  id: string
  message?: string | null
  created_at?: string
  attachments?: {
    id: string
    original_name?: string
    mime_type?: string
    url?: string
    signed_url?: string
    download_url?: string
  }[]
}

type TaskRequest = {
  id: string
  requested_content?: string
  status?: string
  created_at?: string
  updated_at?: string
  student_read_at?: string | null
  reply_count?: number
  replies?: TaskReply[]
  attachments?: {
    id: string
    original_name?: string
    mime_type?: string
    url?: string
    signed_url?: string
  }[]
}

type RequestIconName =
  | 'document'
  | 'back'
  | 'book'
  | 'send'
  | 'info'
  | 'check'
  | 'clock'
  | 'eye'
  | 'plus'
  | 'history'
  | 'close'

function RequestIcon({
  name,
  size = 22,
}: {
  name: RequestIconName
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
    case 'document':
      return (
        <svg {...common}>
          <path d="M7 3.5h7l5 5V20a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" />
          <path d="M14 3.5v5h5M8.5 13h7M8.5 16.5h7" />
        </svg>
      )
    case 'back':
      return <svg {...common}><path d="M15 5 8 12l7 7" /></svg>
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
          <path d="M4 5.5V21M8 7h8M8 11h7" />
        </svg>
      )
    case 'send':
      return (
        <svg {...common}>
          <path d="m21 3-7.2 18-3.9-7.9L2 9.2 21 3Z" />
          <path d="M21 3 9.9 13.1" />
        </svg>
      )
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      )
    case 'check':
      return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'history':
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" />
          <path d="M3 3v5h5M12 7v5l3 2" />
        </svg>
      )
    case 'close':
      return (
        <svg {...common}>
          <path d="m18 6-12 12M6 6l12 12" />
        </svg>
      )
  }
}

function formatDate(value?: string) {
  if (!value) return 'زمان نامشخص'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'زمان نامشخص'

  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getAttachmentUrl(
  attachment: NonNullable<TaskReply['attachments']>[number],
) {
  return attachment.signed_url || attachment.url || ''
}

export default function TaskRequestsPage() {
  const router = useRouter()

  const [studentReady, setStudentReady] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const [requests, setRequests] = useState<TaskRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [listError, setListError] = useState('')

  const [modal, setModal] = useState<'new' | 'history' | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<TaskRequest | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    const savedStudent = localStorage.getItem('taklif-man-student')

    if (!savedStudent) {
      router.replace('/register')
      return
    }

    try {
      const parsed = JSON.parse(savedStudent)

      if (
        !parsed ||
        typeof parsed.fullName !== 'string' ||
        typeof parsed.phone !== 'string'
      ) {
        throw new Error('Invalid student information')
      }

      setStudentReady(true)
    } catch {
      localStorage.removeItem('taklif-man-student')
      router.replace('/register')
    }
  }, [router])

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true)
    setListError('')

    try {
      const response = await fetch('/api/task-requests', {
        method: 'GET',
        cache: 'no-store',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'دریافت درخواست‌ها ناموفق بود.')
      }

      setRequests(Array.isArray(result.requests) ? result.requests : [])
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : 'خطا در دریافت درخواست‌ها.',
      )
    } finally {
      setLoadingRequests(false)
    }
  }, [])

  useEffect(() => {
    if (studentReady) void loadRequests()
  }, [studentReady, loadRequests])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (sending) return

    if (!subject.trim() || !description.trim()) {
      setMessage('لطفاً نام درس و توضیحات درخواست را کامل کن.')
      setSuccess(false)
      return
    }

    const requestedContent =
      `درس یا مبحث: ${subject.trim()}\n` +
      `توضیحات: ${description.trim()}`

    setSending(true)
    setMessage('')
    setSuccess(false)

    try {
      const response = await fetch('/api/task-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedContent }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'ارسال درخواست انجام نشد.')
      }

      setSubject('')
      setDescription('')
      setMessage('درخواست تو با موفقیت ارسال شد.')
      setSuccess(true)
      await loadRequests()
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'ارتباط با سرور برقرار نشد. دوباره تلاش کن.',
      )
      setSuccess(false)
    } finally {
      setSending(false)
    }
  }

  async function openRequest(item: TaskRequest) {
    setSelectedRequest(item)
    setLoadingDetail(true)
    setDetailError('')

    try {
      const response = await fetch(
        `/api/task-requests/${encodeURIComponent(item.id)}`,
        { cache: 'no-store' },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'دریافت جزئیات درخواست ناموفق بود.')
      }

      const detail = result.request as TaskRequest

      setSelectedRequest(detail)

      const replies = Array.isArray(detail.replies) ? detail.replies : []
      const hasReply = replies.length > 0 || (detail.reply_count ?? 0) > 0

      if (hasReply) {
        const readResponse = await fetch('/api/task-requests/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: item.id }),
        })

        if (!readResponse.ok) {
          const readResult = await readResponse.json().catch(() => null)
          console.error(
            'ثبت مشاهده پاسخ انجام نشد:',
            readResult?.error || readResponse.status,
          )
        }
      }

      await loadRequests()
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : 'خطا در دریافت جزئیات درخواست.',
      )
    } finally {
      setLoadingDetail(false)
    }
  }

  const closeDetail = () => {
    if (loadingDetail) return
    setSelectedRequest(null)
    setDetailError('')
  }

  function openNewRequest() {
    setMessage('')
    setSuccess(false)
    setModal('new')
  }

  function closeModal() {
    if (sending) return
    setModal(null)
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#f3f7f8] px-4 py-5 text-[#173b50] sm:px-6 sm:py-8"
    >
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#0d9488]/[0.08] blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#173b50]/[0.05] blur-[110px]" />

      <div className="relative z-10 mx-auto w-full max-w-[680px]">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="بازگشت"
          className="group inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-medium text-[#557080] transition hover:text-[#0d9488]"
        >
          <span className="transition-transform group-hover:-translate-x-1">
            <RequestIcon name="back" size={19} />
          </span>
          بازگشت
        </button>

        <header className="mb-8 mt-7 flex items-center gap-4 sm:mb-10 sm:mt-9 sm:gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#173b50] text-white shadow-lg shadow-[#173b50]/10 sm:h-16 sm:w-16">
            <RequestIcon name="document" size={29} />
          </div>

          <div className="min-w-0">
            <span className="mb-1 block text-xs font-bold tracking-wide text-[#0d9488]">
              همراه یادگیری شما
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#173b50] sm:text-3xl">
              درخواست تکالیف
            </h1>
            <p className="mt-2 text-sm leading-7 text-[#718693]">
              برای ادامه، یکی از گزینه‌های زیر را انتخاب کن.
            </p>
          </div>
        </header>

        <section className="space-y-4">
          <button
            type="button"
            onClick={openNewRequest}
            disabled={!studentReady}
            className="group w-full rounded-[26px] border border-[#dce7e9] bg-white p-5 text-right shadow-[0_12px_40px_rgba(23,59,80,0.045)] transition duration-200 hover:-translate-y-1 hover:border-[#0d9488]/40 hover:shadow-[0_16px_42px_rgba(13,148,136,0.09)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-[30px] sm:p-7"
          >
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e7f5f3] text-[#0d9488] transition group-hover:bg-[#0d9488] group-hover:text-white sm:h-16 sm:w-16">
                <RequestIcon name="plus" size={28} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-extrabold text-[#173b50] sm:text-xl">
                  ثبت درخواست جدید
                </h2>
                <p className="mt-2 text-xs leading-7 text-[#81939d] sm:text-sm">
                  نام درس و توضیحات موردنیازت را ارسال کن.
                </p>
              </div>

              <span className="shrink-0 text-[#9aabb2] transition group-hover:-translate-x-1 group-hover:text-[#0d9488]">
                <RequestIcon name="back" size={21} />
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2 border-t border-[#edf1f2] pt-4 text-xs font-semibold text-[#0d9488]">
              <RequestIcon name="send" size={15} />
              شروع ثبت درخواست
            </div>
          </button>

          <button
            type="button"
            onClick={() => setModal('history')}
            disabled={!studentReady}
            className="group w-full rounded-[26px] border border-[#dce7e9] bg-white p-5 text-right shadow-[0_12px_40px_rgba(23,59,80,0.045)] transition duration-200 hover:-translate-y-1 hover:border-[#173b50]/30 hover:shadow-[0_16px_42px_rgba(23,59,80,0.08)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-[30px] sm:p-7"
          >
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#edf2f6] text-[#173b50] transition group-hover:bg-[#173b50] group-hover:text-white sm:h-16 sm:w-16">
                <RequestIcon name="history" size={28} />

                {requests.some(
                  (item) =>
                    (item.reply_count ?? item.replies?.length ?? 0) > 0 &&
                    item.student_read_at == null,
                ) && (
                  <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-extrabold text-[#173b50] sm:text-xl">
                  درخواست‌های قبلی
                </h2>
                <p className="mt-2 text-xs leading-7 text-[#81939d] sm:text-sm">
                  سوابق درخواست‌ها و پاسخ‌های مدیریت را مشاهده کن.
                </p>
              </div>

              <span className="shrink-0 text-[#9aabb2] transition group-hover:-translate-x-1 group-hover:text-[#173b50]">
                <RequestIcon name="back" size={21} />
              </span>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#edf1f2] pt-4">
              <span className="flex items-center gap-2 text-xs font-semibold text-[#557080]">
                <RequestIcon name="eye" size={15} />
                مشاهده سوابق و پاسخ‌ها
              </span>

              <span className="rounded-full bg-[#edf2f6] px-3 py-1 text-[11px] font-bold text-[#557080]">
                {requests.length} درخواست
              </span>
            </div>
          </button>
        </section>

        <aside className="mt-6 flex items-start gap-3 rounded-2xl border border-[#dce7e9] bg-[#eaf3f5] p-4 sm:p-5">
          <span className="mt-0.5 shrink-0 text-[#0d9488]">
            <RequestIcon name="info" size={19} />
          </span>
          <p className="text-xs leading-7 text-[#557080]">
            درخواست تو برای مدیریت ارسال می‌شود تا بررسی شود. ثبت درخواست به معنی تأیید یا انتشار قطعی تکلیف نیست.
          </p>
        </aside>

        <footer className="pb-3 pt-7 text-center text-xs text-[#9aabb2]">
          تکلیف من
          <span className="mx-2 text-[#0d9488]">•</span>
          درخواست تکالیف
        </footer>
      </div>

      {/* پنجره ثبت درخواست جدید */}
      {modal === 'new' && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#102d3c]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={closeModal}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-request-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-[620px] overflow-y-auto rounded-t-[26px] border border-[#dce7e9] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e7f5f3] text-[#0d9488]">
                  <RequestIcon name="plus" size={22} />
                </div>
                <div>
                  <h2 id="new-request-title" className="text-lg font-extrabold text-[#173b50]">
                    ثبت درخواست جدید
                  </h2>
                  <p className="mt-1 text-xs text-[#91a1a9]">
                    اطلاعات درخواستت را وارد کن.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={sending}
                aria-label="بستن پنجره"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce7e9] bg-[#f8fbfb] text-[#557080] transition hover:border-[#0d9488]/40 hover:text-[#0d9488] disabled:opacity-40"
              >
                <RequestIcon name="close" size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="request-subject"
                  className="mb-2.5 block text-sm font-semibold text-[#385768]"
                >
                  نام درس یا مبحث
                </label>
                <input
                  id="request-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثلاً دانش فنی پایه"
                  maxLength={100}
                  required
                  disabled={sending || !studentReady}
                  className="h-14 w-full rounded-2xl border border-[#dce7e9] bg-[#f8fbfb] px-4 text-sm text-[#173b50] outline-none transition placeholder:text-[#a4b3ba] focus:border-[#0d9488] focus:bg-white focus:ring-4 focus:ring-[#0d9488]/10 disabled:opacity-50"
                />
                <p className="mt-2 text-left text-[11px] tabular-nums text-[#91a1a9]">
                  {subject.length}/100
                </p>
              </div>

              <div>
                <label
                  htmlFor="request-description"
                  className="mb-2.5 block text-sm font-semibold text-[#385768]"
                >
                  توضیحات درخواست
                </label>
                <textarea
                  id="request-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={'دقیقاً توضیح بده چه چیزی لازم داری؛ مثلاً:\nعکس صفحه ۴۲ کتاب یا نقشه سیم‌پیچی موتور'}
                  rows={5}
                  maxLength={500}
                  required
                  disabled={sending || !studentReady}
                  className="min-h-[150px] w-full resize-y rounded-2xl border border-[#dce7e9] bg-[#f8fbfb] px-4 py-3.5 text-sm leading-8 text-[#173b50] outline-none transition placeholder:whitespace-pre-line placeholder:text-[#a4b3ba] focus:border-[#0d9488] focus:bg-white focus:ring-4 focus:ring-[#0d9488]/10 disabled:opacity-50"
                />
                <p className="mt-2 text-left text-[11px] tabular-nums text-[#91a1a9]">
                  {description.length}/500
                </p>
              </div>

              {message && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-7 ${
                    success
                      ? 'border-[#0d9488]/20 bg-[#eaf7f4] text-[#147b70]'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {success ? (
                      <RequestIcon name="check" size={19} />
                    ) : (
                      <RequestIcon name="info" size={19} />
                    )}
                  </span>
                  <p>{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={sending || !studentReady}
                className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#173b50] px-5 py-3 font-bold text-white shadow-lg shadow-[#173b50]/10 transition duration-200 hover:bg-[#20536b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                    در حال ارسال درخواست...
                  </>
                ) : (
                  <>
                    ارسال درخواست
                    <span className="text-[#73d4c5] transition-transform group-hover:-translate-x-1">
                      <RequestIcon name="send" size={19} />
                    </span>
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* پنجره درخواست‌های قبلی */}
      {modal === 'history' && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#102d3c]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={closeModal}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-history-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-[620px] overflow-y-auto rounded-t-[26px] border border-[#dce7e9] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf2f6] text-[#173b50]">
                  <RequestIcon name="history" size={22} />
                </div>
                <div>
                  <h2 id="request-history-title" className="text-lg font-extrabold text-[#173b50]">
                    درخواست‌های قبلی
                  </h2>
                  <p className="mt-1 text-xs text-[#91a1a9]">
                    سوابق و پاسخ‌های مدیریت
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="بستن پنجره"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dce7e9] bg-[#f8fbfb] text-[#557080] transition hover:border-[#0d9488]/40 hover:text-[#0d9488]"
              >
                <RequestIcon name="close" size={19} />
              </button>
            </div>

            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-xs text-[#81939d]">
                برای مشاهده جزئیات و پاسخ، درخواست را انتخاب کن.
              </p>

              <button
                type="button"
                onClick={() => void loadRequests()}
                disabled={loadingRequests}
                className="shrink-0 rounded-xl border border-[#dce7e9] bg-[#f8fbfb] px-3 py-2 text-xs font-semibold text-[#557080] transition hover:border-[#0d9488]/40 hover:text-[#0d9488] disabled:opacity-40"
              >
                {loadingRequests ? 'در حال بارگذاری...' : 'بروزرسانی'}
              </button>
            </div>

            {loadingRequests ? (
              <div className="flex items-center justify-center gap-3 py-10 text-sm text-[#81939d]">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#dce7e9] border-t-[#0d9488]" />
                در حال دریافت درخواست‌ها...
              </div>
            ) : listError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-700">
                {listError}
                <button
                  type="button"
                  onClick={() => void loadRequests()}
                  className="mt-2 block font-semibold text-red-700 underline underline-offset-4"
                >
                  تلاش دوباره
                </button>
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#dce7e9] bg-[#f8fbfb] px-4 py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f5f3] text-[#0d9488]">
                  <RequestIcon name="document" size={23} />
                </div>
                <p className="text-sm font-semibold text-[#557080]">
                  هنوز درخواستی ثبت نکرده‌ای.
                </p>
                <p className="mt-2 text-xs text-[#91a1a9]">
                  می‌توانی از صفحه قبل یک درخواست جدید ثبت کنی.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((item) => {
                  const replyCount = item.reply_count ?? item.replies?.length ?? 0

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void openRequest(item)}
                      className="w-full rounded-2xl border border-[#e3ebed] bg-[#f9fbfb] p-4 text-right transition hover:border-[#0d9488]/35 hover:bg-[#f1f9f8]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="whitespace-pre-line break-words text-sm leading-7 text-[#294b5c]">
                            {item.requested_content || 'درخواست تکلیف'}
                          </p>
                          <p className="mt-2 text-[11px] text-[#91a1a9]">
                            {formatDate(item.created_at)}
                          </p>
                        </div>

                        <span className="relative mt-1 shrink-0 text-[#0d9488]">
                          <RequestIcon name="document" size={20} />
                          {replyCount > 0 && item.student_read_at == null && (
                            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#f9fbfb] bg-red-500" />
                          )}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dce7e9] bg-white px-2.5 py-1 text-[11px] text-[#718693]">
                          <RequestIcon name="clock" size={13} />
                          {replyCount > 0
                            ? `${replyCount} پاسخ مدیریت`
                            : 'در انتظار پاسخ'}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0d9488]">
                          مشاهده جزئیات
                          <RequestIcon name="back" size={14} />
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            <button
              type="button"
              onClick={closeModal}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#dce7e9] bg-[#f8fbfb] text-sm font-bold text-[#557080] transition hover:border-[#0d9488]/40 hover:text-[#0d9488]"
            >
              <RequestIcon name="back" size={17} />
              بازگشت
            </button>
          </section>
        </div>
      )}

      {/* پنجره جزئیات درخواست و پاسخ مدیریت */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-[#102d3c]/65 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={closeDetail}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-detail-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-[620px] overflow-y-auto rounded-t-[26px] border border-[#dce7e9] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 id="request-detail-title" className="text-lg font-bold text-[#173b50]">
                  جزئیات درخواست
                </h2>
                <p className="mt-1 text-xs text-[#91a1a9]">
                  {formatDate(selectedRequest.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetail}
                disabled={loadingDetail}
                className="rounded-xl border border-[#dce7e9] bg-[#f8fbfb] px-3 py-2 text-sm font-medium text-[#557080] transition hover:border-[#0d9488]/40 hover:text-[#0d9488] disabled:opacity-40"
              >
                بستن
              </button>
            </div>

            <div className="rounded-2xl border border-[#dce7e9] bg-[#f8fbfb] p-4">
              <p className="mb-2 text-xs font-bold text-[#0d9488]">درخواست شما</p>
              <p className="whitespace-pre-line break-words text-sm leading-8 text-[#385768]">
                {selectedRequest.requested_content || 'متن درخواست موجود نیست.'}
              </p>
            </div>

            <div className="mb-3 mt-6 flex items-center gap-2">
              <span className="text-[#0d9488]">
                <RequestIcon name="book" size={20} />
              </span>
              <h3 className="font-bold text-[#173b50]">پاسخ‌های مدیریت</h3>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center gap-3 py-8 text-sm text-[#81939d]">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#dce7e9] border-t-[#0d9488]" />
                در حال دریافت پاسخ‌ها...
              </div>
            ) : detailError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-7 text-red-700">
                {detailError}
                <button
                  type="button"
                  onClick={() => void openRequest(selectedRequest)}
                  className="mt-2 block font-semibold text-red-700 underline underline-offset-4"
                >
                  تلاش دوباره
                </button>
              </div>
            ) : !selectedRequest.replies?.length ? (
              <div className="rounded-2xl border border-dashed border-[#dce7e9] bg-[#f8fbfb] p-5 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf3f5] text-[#81939d]">
                  <RequestIcon name="clock" size={22} />
                </div>
                <p className="text-sm font-semibold text-[#557080]">
                  هنوز پاسخی برای این درخواست ثبت نشده است.
                </p>
                <p className="mt-2 text-xs leading-6 text-[#91a1a9]">
                  بعد از پاسخ مدیریت، آن را در همین بخش مشاهده می‌کنی.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedRequest.replies.map((reply) => (
                  <article
                    key={reply.id}
                    className="rounded-2xl border border-[#cce9e4] bg-[#f0f9f7] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-[#147b70]">
                        مدیریت تکلیف من
                      </span>
                      <span className="text-[10px] text-[#91a1a9]">
                        {formatDate(reply.created_at)}
                      </span>
                    </div>

                    {reply.message?.trim() && (
                      <p className="whitespace-pre-wrap break-words text-sm leading-8 text-[#385768]">
                        {reply.message}
                      </p>
                    )}

                    {reply.attachments?.length ? (
                      <div className="mt-4 space-y-3">
                        {reply.attachments.map((attachment) => {
                          const url = getAttachmentUrl(attachment)

                          if (!url) {
                            return (
                              <p key={attachment.id} className="text-xs text-[#81939d]">
                                لینک تصویر در پاسخ موجود نیست.
                              </p>
                            )
                          }

                          const isImage = attachment.mime_type?.startsWith('image/')

                          return (
                            <div key={attachment.id}>
                              {isImage ? (
                                <div className="space-y-3">
                                  <a href={url} target="_blank" rel="noreferrer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={url}
                                      alt={attachment.original_name || 'تصویر پاسخ مدیریت'}
                                      loading="lazy"
                                      className="max-h-[420px] w-full rounded-xl border border-[#dce7e9] bg-white object-contain"
                                    />
                                  </a>

                                  {attachment.download_url && (
                                    <a
                                      href={attachment.download_url}
                                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#0d9488]/25 bg-white px-4 py-2 text-sm font-semibold text-[#147b70] transition hover:bg-[#eaf7f4]"
                                    >
                                      <RequestIcon name="document" size={17} />
                                      دانلود تصویر
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 rounded-xl border border-[#dce7e9] bg-white px-3 py-2 text-sm font-medium text-[#147b70] transition hover:border-[#0d9488]/40"
                                >
                                  <RequestIcon name="document" size={18} />
                                  {attachment.original_name || 'مشاهده فایل پیوست'}
                                </a>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedRequest(null)
                setDetailError('')
                void loadRequests()
              }}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#173b50] text-sm font-bold text-white transition hover:bg-[#20536b]"
            >
              <RequestIcon name="check" size={18} />
              بازگشت به درخواست‌ها
            </button>
          </section>
        </div>
      )}
    </main>
  )
}
