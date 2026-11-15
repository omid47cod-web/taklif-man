
'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const BUCKET = 'task-request-attachments'

type Attachment = {
  id: string
  reply_id: string
  storage_path: string
  original_name: string
  mime_type: string
  size_bytes: number
  url?: string
}

type Reply = {
  id: string
  request_id: string
  admin_id: string
  message: string
  created_at: string
  attachments: Attachment[]
}

type Student = {
  id: string
  full_name: string
  phone: string
}

type TaskRequest = {
  id: string
  student_id: string
  requested_content: string
  status: string
  created_at: string
  updated_at: string
  admin_read_at: string | null
  student_read_at: string | null
  student?: Student
  replies: Reply[]
}

type ReplyDeleteTarget = {
  requestId: string
  replyId: string
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message
  }

  if (typeof err === 'object' && err !== null) {
    const value = err as Record<string, unknown>

    const parts = [
      value.message,
      value.details,
      value.hint,
      value.code,
    ].filter(
      (part): part is string =>
        typeof part === 'string' && part.length > 0
    )

    if (parts.length > 0) {
      return parts.join(' | ')
    }

    try {
      return JSON.stringify(err)
    } catch {
      return 'خطای ناشناخته'
    }
  }

  return String(err)
}

export default function AdminTaskRequestsPage() {
  const [supabase] = useState(() => createClient())

  const [requests, setRequests] = useState<TaskRequest[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [replyDeleteTarget, setReplyDeleteTarget] =
    useState<ReplyDeleteTarget | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const selected =
    requests.find((item) => item.id === selectedId) ?? null

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
    }

    setError('')

    try {
      const {
        data: requestData,
        error: requestError,
      } = await supabase
        .from('task_requests')
        .select(
          'id, student_id, requested_content, status, created_at, updated_at, admin_read_at, student_read_at'
        )
        .order('created_at', { ascending: false })

      if (requestError) throw requestError

      const rows = requestData ?? []

      if (rows.length === 0) {
        setRequests([])
        setSelectedId(null)
        return
      }

      const studentIds = [
        ...new Set(rows.map((row) => row.student_id)),
      ]

      const requestIds = rows.map((row) => row.id)

      const [studentsResult, repliesResult] = await Promise.all([
        supabase
          .from('students')
          .select('id, full_name, phone')
          .in('id', studentIds),

        supabase
          .from('task_request_replies')
          .select(
            'id, request_id, admin_id, message, created_at'
          )
          .in('request_id', requestIds)
          .order('created_at', { ascending: true }),
      ])

      if (studentsResult.error) throw studentsResult.error
      if (repliesResult.error) throw repliesResult.error

      const studentsById: Record<string, Student> = {}

      for (const student of studentsResult.data ?? []) {
        studentsById[student.id] = student
      }

      const replyRows: Reply[] = (
        repliesResult.data ?? []
      ).map((reply) => ({
        ...reply,
        attachments: [],
      })) as Reply[]

      const replyIds = replyRows.map((reply) => reply.id)
      const attachmentsByReply: Record<string, Attachment[]> = {}

      if (replyIds.length > 0) {
        const {
          data: attachmentData,
          error: attachmentsError,
        } = await supabase
          .from('task_request_attachments')
          .select(
            'id, reply_id, storage_path, original_name, mime_type, size_bytes'
          )
          .in('reply_id', replyIds)

        if (attachmentsError) throw attachmentsError

        for (const attachment of (
          attachmentData ?? []
        ) as Attachment[]) {
          attachmentsByReply[attachment.reply_id] ??= []

          attachmentsByReply[attachment.reply_id].push({
            ...attachment,
            url: `/api/task-requests/attachments/${encodeURIComponent(
              attachment.id
            )}`,
          })
        }
      }

      const repliesByRequest: Record<string, Reply[]> = {}

      for (const reply of replyRows) {
        repliesByRequest[reply.request_id] ??= []

        repliesByRequest[reply.request_id].push({
          ...reply,
          attachments: attachmentsByReply[reply.id] ?? [],
        })
      }

      const result: TaskRequest[] = rows.map((row) => ({
        ...row,
        student: studentsById[row.student_id],
        replies: repliesByRequest[row.id] ?? [],
      }))

      setRequests(result)

      setSelectedId((currentId) => {
        if (
          currentId &&
          !result.some((item) => item.id === currentId)
        ) {
          return null
        }

        return currentId
      })
    } catch (err: unknown) {
      console.error('LOAD TASK REQUESTS ERROR:', err)

      setError(
        `دریافت درخواست‌ها ناموفق بود: ${getErrorMessage(err)}`
      )
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [supabase])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  async function openRequest(item: TaskRequest) {
    setSelectedId(item.id)
    setMessage('')
    setFiles([])
    setNotice('')
    setError('')

    if (item.admin_read_at) return

    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('task_requests')
      .update({ admin_read_at: now })
      .eq('id', item.id)

    if (updateError) {
      console.error('MARK REQUEST READ ERROR:', updateError)
      setError('درخواست باز شد، اما وضعیت خوانده‌شدن ذخیره نشد.')
      return
    }

    setRequests((current) =>
      current.map((request) =>
        request.id === item.id
          ? { ...request, admin_read_at: now }
          : request
      )
    )
  }

  async function sendReply(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!selected || sending) return

    const requestId = selected.id
    const text = message.trim()
    const selectedFiles = [...files]

    if (!text && selectedFiles.length === 0) {
      setError('متن پاسخ یا دست‌کم یک تصویر انتخاب کن.')
      return
    }

    if (selectedFiles.some((file) => !file.type.startsWith('image/'))) {
      setError('فقط فایل تصویری انتخاب کن.')
      return
    }

    if (selectedFiles.some((file) => file.size > 10 * 1024 * 1024)) {
      setError('حجم هر تصویر باید حداکثر ۱۰ مگابایت باشد.')
      return
    }

    setSending(true)
    setError('')
    setNotice('')

    let replyId: string | null = null
    const uploadedPaths: string[] = []

    try {
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authData.user) {
        throw new Error('نشست مدیر معتبر نیست. دوباره وارد پنل شو.')
      }

      const {
        data: reply,
        error: replyError,
      } = await supabase
        .from('task_request_replies')
        .insert({
          request_id: requestId,
          admin_id: authData.user.id,
          message: text,
        })
        .select('id, request_id, admin_id, message, created_at')
        .single()

      if (replyError) throw replyError

      replyId = reply.id

      const attachmentRows: Attachment[] = []

      for (const file of selectedFiles) {
        const safeName = file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          '_'
        )

        const path =
          `${requestId}/${reply.id}/` +
          `${crypto.randomUUID()}-${safeName}`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) throw uploadError

        uploadedPaths.push(path)

        attachmentRows.push({
          id: '',
          reply_id: reply.id,
          storage_path: path,
          original_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          url: '',
        })
      }

      if (attachmentRows.length > 0) {
        const {
          data: savedAttachments,
          error: attachmentError,
        } = await supabase
          .from('task_request_attachments')
          .insert(
            attachmentRows.map((item) => ({
              reply_id: item.reply_id,
              storage_path: item.storage_path,
              original_name: item.original_name,
              mime_type: item.mime_type,
              size_bytes: item.size_bytes,
            }))
          )
          .select(
            'id, reply_id, storage_path, original_name, mime_type, size_bytes'
          )

        if (attachmentError) throw attachmentError

        attachmentRows.splice(
          0,
          attachmentRows.length,
          ...(savedAttachments ?? []).map((item) => ({
            ...item,
            url: `/api/task-requests/attachments/${encodeURIComponent(item.id)}`,
          }))
        )
      }

      const { error: requestUpdateError } = await supabase
        .from('task_requests')
        .update({
          student_read_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (requestUpdateError) throw requestUpdateError

      const newReply: Reply = {
        ...reply,
        attachments: attachmentRows,
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === requestId
            ? {
                ...item,
                student_read_at: null,
                updated_at: newReply.created_at,
                replies: [...item.replies, newReply],
              }
            : item
        )
      )

      setMessage('')
      setFiles([])
      setNotice('پاسخ با موفقیت ثبت شد.')

      const fileInput = document.getElementById(
        'reply-images'
      ) as HTMLInputElement | null

      if (fileInput) fileInput.value = ''
    } catch (err: unknown) {
      console.error('SEND TASK REPLY ERROR:', err)

      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from(BUCKET)
          .remove(uploadedPaths)

        if (cleanupError) {
          console.error('UPLOAD CLEANUP ERROR:', cleanupError)
        }
      }

      if (replyId) {
        const { error: attachmentCleanupError } = await supabase
          .from('task_request_attachments')
          .delete()
          .eq('reply_id', replyId)

        if (attachmentCleanupError) {
          console.error(
            'ATTACHMENT CLEANUP ERROR:',
            attachmentCleanupError
          )
        }

        const { error: replyCleanupError } = await supabase
          .from('task_request_replies')
          .delete()
          .eq('id', replyId)

        if (replyCleanupError) {
          console.error('REPLY CLEANUP ERROR:', replyCleanupError)
        }
      }

      setError(`ارسال پاسخ ناموفق بود: ${getErrorMessage(err)}`)
    } finally {
      setSending(false)
    }
  }

  // حذف مستقل یک پاسخ به همراه پیوست‌های همان پاسخ
  async function deleteReply() {
    if (!replyDeleteTarget || deletingReplyId) return

    const { requestId, replyId } = replyDeleteTarget

    const targetRequest = requests.find(
      (item) => item.id === requestId
    )

    const targetReply = targetRequest?.replies.find(
      (reply) => reply.id === replyId
    )

    if (!targetRequest || !targetReply) {
      setError('پاسخ موردنظر در فهرست پیدا نشد.')
      setReplyDeleteTarget(null)
      return
    }

    setDeletingReplyId(replyId)
    setError('')
    setNotice('')

    try {
      const paths = targetReply.attachments.map(
        (attachment) => attachment.storage_path
      )

      // مرحله اول: حذف فایل‌های مربوط به همین پاسخ از Storage
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .remove(paths)

        if (storageError) {
          throw new Error(
            `حذف تصاویر پاسخ ناموفق بود: ${getErrorMessage(storageError)}`
          )
        }
      }

      // مرحله دوم: حذف اطلاعات پیوست‌های همین پاسخ
      const {
        error: attachmentError,
      } = await supabase
        .from('task_request_attachments')
        .delete()
        .eq('reply_id', replyId)

      if (attachmentError) {
        throw new Error(
          `حذف اطلاعات تصاویر ناموفق بود: ${getErrorMessage(attachmentError)}`
        )
      }

      // مرحله سوم: حذف خود پاسخ
      const {
        data: deletedReplies,
        error: replyError,
      } = await supabase
        .from('task_request_replies')
        .delete()
        .eq('id', replyId)
        .eq('request_id', requestId)
        .select('id')

      if (replyError) {
        throw new Error(
          `حذف پاسخ ناموفق بود: ${getErrorMessage(replyError)}`
        )
      }

      if (!deletedReplies || deletedReplies.length === 0) {
        throw new Error(
          'پاسخ حذف نشد. مجوز حذف در دیتابیس (RLS) را بررسی کن.'
        )
      }

      // به‌روزرسانی رابط کاربری فقط پس از تأیید حذف از دیتابیس
      setRequests((current) =>
        current.map((item) =>
          item.id === requestId
            ? {
                ...item,
                replies: item.replies.filter(
                  (reply) => reply.id !== replyId
                ),
              }
            : item
        )
      )

      setReplyDeleteTarget(null)
      setNotice('پاسخ و تصاویر مربوط به آن با موفقیت حذف شدند.')
    } catch (err: unknown) {
      console.error('DELETE TASK REPLY ERROR:', err)

      setError(
        `حذف پاسخ کامل نشد: ${getErrorMessage(err)}`
      )
    } finally {
      setDeletingReplyId(null)
    }
  }

  async function deleteRequest() {
    if (!deleteTarget || deleting) return

    const target = requests.find(
      (item) => item.id === deleteTarget
    )

    if (!target) {
      setError('درخواست انتخاب‌شده در فهرست پیدا نشد.')
      setDeleteTarget(null)
      return
    }

    setDeleting(true)
    setError('')
    setNotice('')

    try {
      const replyIds = target.replies.map((reply) => reply.id)

      const paths = target.replies.flatMap((reply) =>
        reply.attachments.map(
          (attachment) => attachment.storage_path
        )
      )

      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .remove(paths)

        if (storageError) {
          throw new Error(
            `حذف فایل‌ها ناموفق بود: ${getErrorMessage(storageError)}`
          )
        }
      }

      if (replyIds.length > 0) {
        const {
          error: attachmentError,
        } = await supabase
          .from('task_request_attachments')
          .delete()
          .in('reply_id', replyIds)

        if (attachmentError) {
          throw new Error(
            `حذف اطلاعات پیوست ناموفق بود: ${getErrorMessage(attachmentError)}`
          )
        }

        const {
          error: replyError,
        } = await supabase
          .from('task_request_replies')
          .delete()
          .in('id', replyIds)

        if (replyError) {
          throw new Error(
            `حذف پاسخ‌ها ناموفق بود: ${getErrorMessage(replyError)}`
          )
        }
      }

      const {
        data: deletedRows,
        error: requestError,
      } = await supabase
        .from('task_requests')
        .delete()
        .eq('id', target.id)
        .select('id')

      if (requestError) {
        throw new Error(
          `حذف درخواست ناموفق بود: ${getErrorMessage(requestError)}`
        )
      }

      if (!deletedRows || deletedRows.length === 0) {
        throw new Error(
          'هیچ درخواستی حذف نشد. مجوز حذف در دیتابیس (RLS) را بررسی کن.'
        )
      }

      setRequests((current) =>
        current.filter((item) => item.id !== target.id)
      )

      if (selectedId === target.id) {
        setSelectedId(null)
      }

      setDeleteTarget(null)
      setNotice('درخواست، پاسخ‌ها و پیوست‌های آن حذف شدند.')
    } catch (err: unknown) {
      console.error('DELETE TASK REQUEST FAILED:', err)

      setError(
        `حذف درخواست کامل نشد: ${getErrorMessage(err)}`
      )
    } finally {
      setDeleting(false)
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString('fa-IR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#050505] px-4 py-6 text-white sm:px-7 sm:py-9"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs tracking-widest text-[#c9a96a]/70">
              TAKLIF MAN / MANAGEMENT
            </p>

            <h1 className="text-2xl font-bold sm:text-3xl">
              درخواست‌های{' '}
              <span className="text-[#c9a96a]">تکالیف</span>
            </h1>

            <p className="mt-3 text-sm text-white/45">
              درخواست دانش‌آموز را ببین و پاسخ متنی یا تصویری بفرست.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => void loadRequests(true)}
              disabled={loading}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:border-[#c9a96a]/40 disabled:opacity-50"
            >
              تازه‌سازی
            </button>

            <Link
              href="/admin"
              className="rounded-xl border border-[#c9a96a]/25 bg-[#c9a96a]/10 px-4 py-2.5 text-sm text-[#c9a96a]"
            >
              بازگشت به مدیریت
            </Link>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
          >
            {notice}
          </div>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.6fr)]">
          <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025]">
            <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
              <h2 className="font-semibold">فهرست درخواست‌ها</h2>

              <span className="rounded-full bg-[#c9a96a]/10 px-3 py-1 text-xs text-[#c9a96a]">
                {requests.length.toLocaleString('fa-IR')}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3 p-5">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-2xl bg-white/[0.04]"
                  />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-white/60">
                  هنوز درخواستی ثبت نشده.
                </p>

                <p className="mt-2 text-xs text-white/30">
                  درخواست‌های جدید در این قسمت نمایش داده می‌شوند.
                </p>
              </div>
            ) : (
              <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
                {requests.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => void openRequest(item)}
                    className={`w-full rounded-2xl border p-4 text-right transition ${
                      selectedId === item.id
                        ? 'border-[#c9a96a]/35 bg-[#c9a96a]/[0.08]'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-white/90">
                        {item.student?.full_name ?? 'دانش‌آموز'}
                      </span>

                      {!item.admin_read_at && (
                        <span
                          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"
                          title="درخواست خوانده‌نشده"
                        />
                      )}
                    </div>

                    <p className="mt-1 text-xs text-white/40">
                      {item.student?.phone ?? 'شماره نامشخص'}
                    </p>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/60">
                      {item.requested_content}
                    </p>

                    <p className="mt-3 text-[11px] text-white/30">
                      {formatDate(item.created_at)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="min-w-0 rounded-3xl border border-white/[0.08] bg-white/[0.025]">
            {!selected ? (
              <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.08] text-2xl text-[#c9a96a]">
                  ✉
                </div>

                <h2 className="font-semibold">
                  یک درخواست را انتخاب کن
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/40">
                  متن درخواست و پاسخ‌های قبلی در این قسمت نمایش داده می‌شوند.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] p-5 sm:p-6">
                  <div>
                    <h2 className="text-lg font-bold">
                      {selected.student?.full_name ?? 'دانش‌آموز'}
                    </h2>

                    <p className="mt-1 text-xs text-white/40">
                      {selected.student?.phone ?? 'شماره نامشخص'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setError('')
                      setNotice('')
                      setDeleteTarget(selected.id)
                    }}
                    className="rounded-xl border border-red-500/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10"
                  >
                    حذف درخواست
                  </button>
                </div>

                <div className="border-b border-white/[0.07] p-5 sm:p-6">
                  <p className="mb-3 text-xs font-semibold text-[#c9a96a]">
                    متن درخواست دانش‌آموز
                  </p>

                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white/80">
                    {selected.requested_content}
                  </p>

                  <p className="mt-4 text-[11px] text-white/30">
                    {formatDate(selected.created_at)}
                  </p>
                </div>

                <div className="space-y-4 border-b border-white/[0.07] p-5 sm:p-6">
                  <h3 className="font-semibold">پاسخ‌ها</h3>

                  {selected.replies.length === 0 ? (
                    <p className="text-sm text-white/35">
                      هنوز پاسخی برای این درخواست ثبت نشده است.
                    </p>
                  ) : (
                    selected.replies.map((reply) => (
                      <article
                        key={reply.id}
                        className="rounded-2xl border border-[#c9a96a]/15 bg-[#c9a96a]/[0.035] p-4"
                      >
                        {reply.message?.trim() && (
                          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-white/80">
                            {reply.message}
                          </p>
                        )}

                        {reply.attachments.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {reply.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="overflow-hidden rounded-xl border border-white/10 bg-black/30"
                              >
                                {attachment.url ? (
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={attachment.url}
                                      alt={attachment.original_name}
                                      className="h-32 w-full object-cover"
                                      loading="lazy"
                                    />
                                  </a>
                                ) : (
                                  <div className="flex h-32 items-center justify-center text-xs text-white/40">
                                    تصویر در دسترس نیست
                                  </div>
                                )}

                                <div className="p-2">
                                  <p className="truncate text-[11px] text-white/60">
                                    {attachment.original_name}
                                  </p>

                                  {attachment.url && (
                                    <a
                                      href={`/api/task-requests/attachments/${encodeURIComponent(
                                        attachment.id
                                      )}?download=1`}
                                      className="mt-2 inline-block text-xs text-[#c9a96a] hover:underline"
                                    >
                                      بازکردن / دریافت تصویر
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                          <p className="text-[11px] text-white/30">
                            {formatDate(reply.created_at)}
                          </p>

                          <button
                            type="button"
                            onClick={() => {
                              setError('')
                              setNotice('')
                              setReplyDeleteTarget({
                                requestId: selected.id,
                                replyId: reply.id,
                              })
                            }}
                            disabled={deletingReplyId === reply.id}
                            className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingReplyId === reply.id
                              ? 'در حال حذف...'
                              : 'حذف پاسخ'}
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                <form
                  onSubmit={sendReply}
                  className="space-y-4 p-5 sm:p-6"
                >
                  <div>
                    <label
                      htmlFor="reply-message"
                      className="mb-2 block text-sm font-semibold"
                    >
                      متن پاسخ
                    </label>

                    <textarea
                      id="reply-message"
                      value={message}
                      onChange={(event) =>
                        setMessage(event.target.value)
                      }
                      rows={4}
                      placeholder="پاسخ خود را بنویس..."
                      className="w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white outline-none placeholder:text-white/25 focus:border-[#c9a96a]/50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reply-images"
                      className="mb-2 block text-sm font-semibold"
                    >
                      تصاویر پاسخ
                    </label>

                    <input
                      id="reply-images"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      onChange={(event) =>
                        setFiles(
                          Array.from(event.target.files ?? [])
                        )
                      }
                      className="block w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/60 file:ml-3 file:rounded-lg file:border-0 file:bg-[#c9a96a]/15 file:px-3 file:py-2 file:text-[#c9a96a]"
                    />

                    <p className="mt-2 text-[11px] leading-5 text-white/35">
                      امکان انتخاب چند تصویر وجود دارد. حداکثر حجم هر تصویر ۱۰ مگابایت است.
                    </p>

                    {files.length > 0 && (
                      <p className="mt-2 text-xs text-[#c9a96a]">
                        {files.length.toLocaleString('fa-IR')} تصویر انتخاب شده
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full rounded-2xl bg-[#c9a96a] px-5 py-3.5 text-sm font-bold text-black transition hover:bg-[#d8ba7b] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending
                      ? 'در حال ارسال پاسخ...'
                      : 'ارسال پاسخ'}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>

      {/* تأیید حذف کامل درخواست */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleting
            ) {
              setDeleteTarget(null)
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111] p-6 shadow-2xl"
          >
            <h2
              id="delete-dialog-title"
              className="text-lg font-bold"
            >
              حذف کامل درخواست؟
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/55">
              متن درخواست، پاسخ‌های ثبت‌شده و تصاویر مرتبط حذف خواهند شد. این کار قابل بازگشت نیست.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => void deleteRequest()}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? 'در حال حذف...' : 'بله، حذف شود'}
              </button>

              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 disabled:opacity-50"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* تأیید حذف مستقل پاسخ */}
      {replyDeleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deletingReplyId
            ) {
              setReplyDeleteTarget(null)
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-reply-dialog-title"
            className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#111] p-6 shadow-2xl"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-xl text-red-300">
              🗑
            </div>

            <h2
              id="delete-reply-dialog-title"
              className="text-lg font-bold"
            >
              حذف این پاسخ؟
            </h2>

            <p className="mt-3 text-sm leading-7 text-white/55">
              فقط همین پاسخ و تصاویر پیوست‌شده به آن حذف می‌شوند. متن درخواست دانش‌آموز و سایر پاسخ‌ها باقی می‌مانند. این عملیات قابل بازگشت نیست.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => void deleteReply()}
                disabled={deletingReplyId !== null}
                className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingReplyId
                  ? 'در حال حذف...'
                  : 'بله، حذف پاسخ'}
              </button>

              <button
                type="button"
                onClick={() => setReplyDeleteTarget(null)}
                disabled={deletingReplyId !== null}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70 disabled:opacity-50"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
