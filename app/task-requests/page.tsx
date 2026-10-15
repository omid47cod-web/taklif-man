
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

function RequestIcon({
  name,
  size = 22,
}: {
  name: 'document' | 'back' | 'book' | 'send' | 'info' | 'check' | 'clock' | 'eye'
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

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-6 text-[#f4eee4] sm:px-6 sm:py-9"
    >
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#c9a96a]/[0.09] blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#c9a96a]/[0.06] blur-[110px]" />

      <div className="relative z-10 mx-auto w-full max-w-[680px]">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="بازگشت"
          className="group inline-flex items-center gap-2 rounded-xl py-2 text-sm text-white/50 transition hover:text-[#c9a96a]"
        >
          <span className="transition-transform group-hover:-translate-x-1">
            <RequestIcon name="back" size={19} />
          </span>
          بازگشت
        </button>

        <header className="mb-8 mt-7 flex items-center gap-4 sm:mb-9 sm:mt-9 sm:gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#c9a96a]/25 bg-[#c9a96a]/[0.08] text-[#c9a96a] shadow-[0_0_30px_rgba(201,169,106,0.05)] sm:h-16 sm:w-16">
            <RequestIcon name="document" size={29} />
          </div>
          <div className="min-w-0">
            <span className="mb-1 block text-xs font-medium tracking-wide text-[#c9a96a]">
              همراه یادگیری شما
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              درخواست تکالیف
            </h1>
            <p className="mt-2 text-sm leading-7 text-white/45">
              درخواستت را بفرست و پاسخ مدیریت را همین‌جا ببین.
            </p>
          </div>
        </header>

        <section className="rounded-[26px] border border-white/[0.09] bg-[#101010]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:rounded-[30px] sm:p-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c9a96a]/[0.09] text-[#c9a96a]">
              <RequestIcon name="book" size={21} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ثبت درخواست جدید</h2>
              <p className="mt-1 text-xs text-white/40">
                اطلاعات موردنیاز را وارد کن.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="request-subject"
                className="mb-2.5 block text-sm font-medium text-white/80"
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
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#080808] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9a96a]/60 focus:ring-2 focus:ring-[#c9a96a]/10 disabled:opacity-50"
              />
              <p className="mt-2 text-left text-[11px] text-white/25">
                {subject.length}/100
              </p>
            </div>

            <div>
              <label
                htmlFor="request-description"
                className="mb-2.5 block text-sm font-medium text-white/80"
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
                className="min-h-[150px] w-full resize-y rounded-2xl border border-white/10 bg-[#080808] px-4 py-3.5 text-sm leading-8 text-white outline-none transition placeholder:whitespace-pre-line placeholder:text-white/25 focus:border-[#c9a96a]/60 focus:ring-2 focus:ring-[#c9a96a]/10 disabled:opacity-50"
              />
              <p className="mt-2 text-left text-[11px] text-white/25">
                {description.length}/500
              </p>
            </div>

            {message && (
              <div
                role="status"
                aria-live="polite"
                className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-7 ${
                  success
                    ? 'border-[#c9a96a]/20 bg-[#c9a96a]/[0.07] text-[#e0c995]'
                    : 'border-red-400/20 bg-red-400/[0.06] text-red-200'
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
              className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-[#c9a96a]/40 bg-[#c9a96a] px-5 py-3 font-bold text-[#15110a] shadow-[0_8px_30px_rgba(201,169,106,0.10)] transition duration-200 hover:bg-[#dbc18b] hover:shadow-[0_8px_35px_rgba(201,169,106,0.17)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#15110a]/25 border-t-[#15110a]" />
                  در حال ارسال درخواست...
                </>
              ) : (
                <>
                  ارسال درخواست
                  <span className="transition-transform group-hover:-translate-x-1">
                    <RequestIcon name="send" size={19} />
                  </span>
                </>
              )}
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-[26px] border border-white/[0.09] bg-[#101010]/95 p-5 sm:rounded-[30px] sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">درخواست‌های قبلی</h2>
              <p className="mt-1 text-xs leading-6 text-white/40">
                برای مشاهده پاسخ مدیریت، درخواست را باز کن.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadRequests()}
              disabled={loadingRequests}
              className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:border-[#c9a96a]/40 hover:text-[#c9a96a] disabled:opacity-40"
            >
              {loadingRequests ? 'در حال بارگذاری...' : 'بروزرسانی'}
            </button>
          </div>

          {loadingRequests ? (
            <div className="flex items-center justify-center gap-3 py-8 text-sm text-white/45">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a96a]" />
              در حال دریافت درخواست‌ها...
            </div>
          ) : listError ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm leading-7 text-red-200">
              {listError}
              <button
                type="button"
                onClick={() => void loadRequests()}
                className="mt-2 block text-[#c9a96a] underline underline-offset-4"
              >
                تلاش دوباره
              </button>
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c9a96a]/[0.08] text-[#c9a96a]">
                <RequestIcon name="document" size={23} />
              </div>
              <p className="text-sm text-white/65">هنوز درخواستی ثبت نکرده‌ای.</p>
              <p className="mt-2 text-xs text-white/35">درخواست جدیدت را از فرم بالا ارسال کن.</p>
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
                    className="w-full rounded-2xl border border-white/[0.08] bg-[#080808] p-4 text-right transition hover:border-[#c9a96a]/30 hover:bg-white/[0.025]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="whitespace-pre-line break-words text-sm leading-7 text-white/85">
                          {item.requested_content || 'درخواست تکلیف'}
                        </p>
                        <p className="mt-2 text-[11px] text-white/35">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                      <span className="relative mt-1 shrink-0 text-[#c9a96a]">
                        <RequestIcon name="document" size={20} />
                        {replyCount > 0 && item.student_read_at == null && (
                          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-[#101010] bg-red-500" />
                        )}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] text-white/45">
                        <RequestIcon name="clock" size={13} />
                        {replyCount > 0
                          ? `${replyCount} پاسخ مدیریت`
                          : 'در انتظار پاسخ'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#c9a96a]">
                        مشاهده جزئیات
                        <RequestIcon name="back" size={14} />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <aside className="mt-5 flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 sm:p-5">
          <span className="mt-0.5 shrink-0 text-[#c9a96a]">
            <RequestIcon name="info" size={19} />
          </span>
          <p className="text-xs leading-7 text-white/45">
            درخواست تو برای مدیریت ارسال می‌شود تا بررسی شود. ثبت درخواست به معنی تأیید یا انتشار قطعی تکلیف نیست.
          </p>
        </aside>

        <footer className="pb-3 pt-7 text-center text-xs text-white/25">
          تکلیف من
          <span className="mx-2 text-[#c9a96a]/60">•</span>
          درخواست تکالیف
        </footer>
      </div>

      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={() => {
            if (!loadingDetail) {
              setSelectedRequest(null)
              setDetailError('')
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-detail-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-[620px] overflow-y-auto rounded-t-[26px] border border-white/10 bg-[#101010] p-5 shadow-2xl sm:rounded-[28px] sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 id="request-detail-title" className="text-lg font-bold text-white">
                  جزئیات درخواست
                </h2>
                <p className="mt-1 text-xs text-white/40">
                  {formatDate(selectedRequest.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null)
                  setDetailError('')
                }}
                disabled={loadingDetail}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60 hover:text-[#c9a96a] disabled:opacity-40"
              >
                بستن
              </button>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-black/30 p-4">
              <p className="mb-2 text-xs font-bold text-[#c9a96a]">درخواست شما</p>
              <p className="whitespace-pre-line break-words text-sm leading-8 text-white/80">
                {selectedRequest.requested_content || 'متن درخواست موجود نیست.'}
              </p>
            </div>

            <div className="mb-3 mt-6 flex items-center gap-2">
              <span className="text-[#c9a96a]">
                <RequestIcon name="book" size={20} />
              </span>
              <h3 className="font-bold text-white">پاسخ‌های مدیریت</h3>
            </div>

            {loadingDetail ? (
              <div className="flex items-center justify-center gap-3 py-8 text-sm text-white/45">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a96a]" />
                در حال دریافت پاسخ‌ها...
              </div>
            ) : detailError ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm leading-7 text-red-200">
                {detailError}
                <button
                  type="button"
                  onClick={() => void openRequest(selectedRequest)}
                  className="mt-2 block text-[#c9a96a] underline underline-offset-4"
                >
                  تلاش دوباره
                </button>
              </div>
            ) : !selectedRequest.replies?.length ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] text-white/35">
                  <RequestIcon name="clock" size={22} />
                </div>
                <p className="text-sm text-white/60">هنوز پاسخی برای این درخواست ثبت نشده است.</p>
                <p className="mt-2 text-xs leading-6 text-white/35">
                  بعد از پاسخ مدیریت، آن را در همین بخش مشاهده می‌کنی.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedRequest.replies.map((reply) => (
                  <article
                    key={reply.id}
                    className="rounded-2xl border border-[#c9a96a]/15 bg-[#c9a96a]/[0.035] p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-[#e0c995]">
                        مدیریت تکلیف من
                      </span>
                      <span className="text-[10px] text-white/35">
                        {formatDate(reply.created_at)}
                      </span>
                    </div>

                    {reply.message?.trim() && (
                      <p className="whitespace-pre-wrap break-words text-sm leading-8 text-white/80">
                        {reply.message}
                      </p>
                    )}

                    {reply.attachments?.length ? (
                      <div className="mt-4 space-y-3">
                        {reply.attachments.map((attachment) => {
                          const url = getAttachmentUrl(attachment)

                          if (!url) {
                            return (
                              <p key={attachment.id} className="text-xs text-white/40">
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
        className="max-h-[420px] w-full rounded-xl border border-white/10 object-contain"
      />
    </a>

    {attachment.download_url && (
      <a
        href={attachment.download_url}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#c9a96a]/30 bg-[#c9a96a]/[0.08] px-4 py-2 text-sm font-medium text-[#e0c995] transition hover:bg-[#c9a96a]/[0.14]"
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
                                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-[#e0c995] hover:border-[#c9a96a]/40"
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
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#c9a96a]/30 bg-[#c9a96a]/[0.08] text-sm font-bold text-[#e0c995] transition hover:bg-[#c9a96a]/[0.13]"
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
