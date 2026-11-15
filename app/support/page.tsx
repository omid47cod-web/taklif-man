
'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Student = {
  fullName: string
  phone: string
}

type SupportMessage = {
  id: string
  conversation_id: string
  sender_type: 'student' | 'management'
  admin_id: string | null
  body: string
  created_at: string
  read_at: string | null
}

function SupportIcon({
  name,
  size = 22,
}: {
  name: 'back' | 'user' | 'message' | 'send' | 'shield' | 'refresh' | 'trash'
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
    case 'back':
      return (
        <svg {...common}>
          <path d="M15 18l-6-6 6-6" />
          <path d="M9 12h11" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      )
    case 'message':
      return (
        <svg {...common}>
          <path d="M21 11.5a8.5 8.5 0 0 1-12.9 7.3L3 20l1.2-4.1A8.5 8.5 0 1 1 21 11.5Z" />
          <path d="M8 11h8M8 14h5" />
        </svg>
      )
    case 'send':
      return (
        <svg {...common}>
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M20 7v5h-5" />
          <path d="M4 17v-5h5" />
          <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12" />
          <path d="M18.4 15a7 7 0 0 1-11.6 2L4 12" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="m19 6-1 14H6L5 6" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      )
  }
}

function formatTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SupportPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [student, setStudent] = useState<Student | null>(null)
  const [studentChecked, setStudentChecked] = useState(false)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // دریافت اطلاعات دانش‌آموز
  useEffect(() => {
    try {
      const savedStudent = localStorage.getItem('taklif-man-student')

      if (!savedStudent) {
        router.replace('/register')
        setStudentChecked(true)
        return
      }

      const parsed = JSON.parse(savedStudent)

      if (
        typeof parsed?.fullName !== 'string' ||
        !parsed.fullName ||
        typeof parsed.phone !== 'string' ||
        !/^09\d{9}$/.test(parsed.phone)
      ) {
        localStorage.removeItem('taklif-man-student')
        router.replace('/register')
        return
      }

      setStudent({
        fullName: parsed.fullName,
        phone: parsed.phone,
      })
    } catch {
      localStorage.removeItem('taklif-man-student')
      router.replace('/register')
    } finally {
      setStudentChecked(true)
    }
  }, [router])

  // ثبت خوانده‌شدن پاسخ‌های مدیریت
  const markManagementMessagesRead = useCallback(
    async (currentConversationId: string) => {
      const { error: readError } = await supabase
        .from('support_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', currentConversationId)
        .eq('sender_type', 'management')
        .is('read_at', null)

      if (readError) {
        console.error('MARK SUPPORT MESSAGES READ ERROR:', readError.message)
      }
    },
    [supabase]
  )

  // ساخت یا دریافت گفت‌وگو
  useEffect(() => {
    if (!student) return

    let cancelled = false

    async function initializeChat() {
      setLoading(true)
      setError('')

      try {
        const { data: studentRecord, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('phone', student!.phone)
          .single()

        if (studentError || !studentRecord) {
          throw new Error(
            studentError?.message || 'اطلاعات دانش‌آموز پیدا نشد.'
          )
        }

        const {
          data: existingConversation,
          error: conversationLookupError,
        } = await supabase
          .from('support_conversations')
          .select('id')
          .eq('student_id', studentRecord.id)
          .maybeSingle()

        if (conversationLookupError) {
          throw new Error(conversationLookupError.message)
        }

        let currentConversation = existingConversation

        if (!currentConversation) {
          const { data: newConversation, error: createError } = await supabase
            .from('support_conversations')
            .insert({ student_id: studentRecord.id })
            .select('id')
            .single()

          if (createError || !newConversation) {
            throw new Error(
              createError?.message || 'ایجاد گفت‌وگو انجام نشد.'
            )
          }

          currentConversation = newConversation
        }

        if (cancelled) return

        setStudentId(studentRecord.id)
        setConversationId(currentConversation.id)

        const { data: messageData, error: messageError } = await supabase
          .from('support_messages')
          .select(
            'id, conversation_id, sender_type, admin_id, body, created_at, read_at'
          )
          .eq('conversation_id', currentConversation.id)
          .order('created_at', { ascending: true })

        if (messageError) {
          throw new Error(messageError.message)
        }

        if (cancelled) return

        setMessages((messageData as SupportMessage[]) || [])

        await markManagementMessagesRead(currentConversation.id)
      } catch (cause) {
        if (!cancelled) {
          const message =
            cause instanceof Error
              ? cause.message
              : 'ارتباط با مدیریت برقرار نشد.'

          console.error('SUPPORT CHAT ERROR:', cause)
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void initializeChat()

    return () => {
      cancelled = true
    }
  }, [student, supabase, reloadKey, markManagementMessagesRead])

  // دریافت زنده پیام‌های جدید و حذف‌شده
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`support-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as SupportMessage

          setMessages((current) => {
            if (current.some((item) => item.id === incoming.id)) {
              return current
            }

            return [...current, incoming].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            )
          })

          if (incoming.sender_type === 'management') {
            void markManagementMessagesRead(conversationId)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const oldMessage = payload.old as { id?: string }

          if (oldMessage.id) {
            setMessages((current) =>
              current.filter((item) => item.id !== oldMessage.id)
            )
          } else {
            setReloadKey((value) => value + 1)
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId, supabase, markManagementMessagesRead])

  // ارسال پیام دانش‌آموز
  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!conversationId || !text.trim() || sending) return

    const messageText = text.trim()

    if (messageText.length > 2000) {
      setError('متن پیام نباید بیشتر از ۲۰۰۰ کاراکتر باشد.')
      return
    }

    setSending(true)
    setError('')

    try {
      const { data, error: sendError } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'student',
          admin_id: null,
          body: messageText,
        })
        .select(
          'id, conversation_id, sender_type, admin_id, body, created_at, read_at'
        )
        .single()

      if (sendError) throw new Error(sendError.message)
      if (!data) throw new Error('پیام ثبت نشد. لطفاً دوباره تلاش کن.')

      const sentMessage = data as SupportMessage

      setMessages((current) => {
        if (current.some((item) => item.id === sentMessage.id)) {
          return current
        }

        return [...current, sentMessage].sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        )
      })

      setText('')

      const { error: updateError } = await supabase
        .from('support_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      if (updateError) {
        console.error('SUPPORT CONVERSATION UPDATE ERROR:', updateError.message)
      }
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : 'ارسال پیام انجام نشد. اتصال اینترنت را بررسی کن.'

      console.error('SUPPORT SEND ERROR:', cause)
      setError(message)
    } finally {
      setSending(false)
    }
  }

  // حذف پیام خود دانش‌آموز
  async function deleteMessage(message: SupportMessage) {
    if (
      message.sender_type !== 'student' ||
      !conversationId ||
      deletingId
    ) {
      return
    }

    const confirmed = window.confirm('این پیام برای همه حذف شود؟')
    if (!confirmed) return

    setDeletingId(message.id)
    setError('')

    try {
      const { data, error: deleteError } = await supabase
        .from('support_messages')
        .delete()
        .eq('id', message.id)
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'student')
        .select('id')
        .maybeSingle()

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      if (!data) {
        throw new Error(
          'پیام حذف نشد. ممکن است مجوز حذف در تنظیمات دسترسی دیتابیس فعال نباشد.'
        )
      }

      setMessages((current) =>
        current.filter((item) => item.id !== message.id)
      )
    } catch (cause) {
      const messageText =
        cause instanceof Error ? cause.message : 'حذف پیام انجام نشد.'

      console.error('SUPPORT DELETE ERROR:', cause)
      setError(messageText)
    } finally {
      setDeletingId(null)
    }
  }

  if (!studentChecked || !student) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f3f7f8] text-[#173b50]"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-[#e2ebed] bg-white px-5 py-4 shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#0d9488]" />
          <p className="text-sm text-[#71838b]">در حال آماده‌سازی...</p>
        </div>
      </main>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f3f7f8] text-[#173b50]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col border-x border-[#e5edef] bg-white/40">
        <header className="sticky top-0 z-20 border-b border-[#e5edef] bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#e2ebed] bg-white text-[#526b75] transition hover:border-[#0d9488]/30 hover:bg-[#f1faf8] hover:text-[#0d9488]"
              aria-label="بازگشت"
            >
              <SupportIcon name="back" />
            </button>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#cce7e2] bg-[#eaf7f5] text-[#0d9488]">
              <SupportIcon name="user" size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-extrabold text-[#173b50] sm:text-lg">
                ارتباط با مدیریت
              </h1>
              <p className="mt-1 text-xs text-[#84969c]">
                گفت‌وگوی خصوصی و پشتیبانی
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-[#cce7e2] bg-[#eff9f7] px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0d9488]" />
              <span className="text-[10px] font-medium text-[#0d9488]">
                پشتیبانی
              </span>
            </div>
          </div>
        </header>

        <section className="flex-1 px-4 py-5 sm:px-6">
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#dcece9] bg-gradient-to-l from-[#eaf7f5] to-white p-4">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#cce7e2] bg-white text-[#0d9488]">
              <SupportIcon name="shield" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-[#173b50]">
                سلام {student.fullName}
              </p>
              <p className="mt-1 text-xs leading-6 text-[#71838b]">
                اگر درباره تکالیف یا استفاده از برنامه سؤالی داری، پیام خودت را
                اینجا بنویس.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[38vh] flex-col items-center justify-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#0d9488]/15 border-t-[#0d9488]" />
              <p className="text-sm text-[#84969c]">
                در حال آماده‌سازی گفت‌وگو...
              </p>
            </div>
          ) : error && !conversationId ? (
            <div className="flex min-h-[35vh] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-red-100 bg-red-50 text-red-500">
                <SupportIcon name="message" size={27} />
              </div>
              <h2 className="text-base font-extrabold text-[#173b50]">
                اتصال برقرار نشد
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-7 text-[#71838b]">
                دریافت گفت‌وگو با مشکل روبه‌رو شد. اتصال اینترنت را بررسی کن و
                دوباره تلاش کن.
              </p>
              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#cce7e2] bg-[#eff9f7] px-4 py-2.5 text-sm font-semibold text-[#0d9488] transition hover:bg-[#e1f3f0]"
              >
                <SupportIcon name="refresh" size={17} />
                تلاش دوباره
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-[35vh] items-center justify-center">
              <div className="w-full rounded-3xl border border-[#e5edef] bg-white px-6 py-9 text-center shadow-[0_10px_35px_rgba(23,59,80,0.045)]">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-[#cce7e2] bg-[#eff9f7] text-[#0d9488]">
                  <SupportIcon name="message" size={28} />
                </div>
                <h2 className="text-lg font-extrabold text-[#173b50]">
                  گفت‌وگوی شما آماده است
                </h2>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-7 text-[#84969c]">
                  هنوز پیامی ارسال نشده است. اولین پیام خودت را بنویس تا
                  گفت‌وگو با مدیریت شروع شود.
                </p>
                <div className="mx-auto mt-6 h-px w-16 bg-gradient-to-l from-transparent via-[#0d9488]/40 to-transparent" />
                <p className="mt-4 text-xs text-[#91a0a5]">
                  پاسخ مدیریت در همین صفحه نمایش داده می‌شود.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="pb-1 text-center">
                <span className="rounded-full border border-[#e5edef] bg-white px-3 py-1.5 text-[10px] text-[#91a0a5]">
                  پیام‌های گفت‌وگو
                </span>
              </div>

              {messages.map((message) => {
                const isStudentMessage = message.sender_type === 'student'

                return (
                  <div
                    key={message.id}
                    className={`flex ${isStudentMessage ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-3xl px-4 py-3 shadow-[0_3px_12px_rgba(23,59,80,0.035)] sm:max-w-[80%] ${
                        isStudentMessage
                          ? 'rounded-br-md border border-[#cce7e2] bg-[#eaf7f5] text-[#173b50]'
                          : 'rounded-bl-md border border-[#e5edef] bg-white text-[#173b50]'
                      }`}
                    >
                      {!isStudentMessage && (
                        <p className="mb-1.5 text-[10px] font-bold text-[#0d9488]">
                          مدیریت
                        </p>
                      )}

                      <p className="whitespace-pre-wrap break-words text-sm leading-7">
                        {message.body}
                      </p>

                      <div
                        className={`mt-2 flex items-center justify-end gap-3 text-[10px] ${
                          isStudentMessage ? 'text-[#849b9b]' : 'text-[#91a0a5]'
                        }`}
                      >
                        <span>{formatTime(message.created_at)}</span>

                        {isStudentMessage && (
                          <button
                            type="button"
                            onClick={() => void deleteMessage(message)}
                            disabled={deletingId !== null}
                            aria-label="حذف پیام"
                            title="حذف پیام"
                            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-red-500/80 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          >
                            {deletingId === message.id ? (
                              <span className="h-3 w-3 animate-spin rounded-full border border-red-300 border-t-red-600" />
                            ) : (
                              <SupportIcon name="trash" size={13} />
                            )}
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {error && conversationId && !loading && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-6 text-red-700">
              <span className="shrink-0 font-bold">!</span>
              <p>{error}</p>
            </div>
          )}
        </section>

        <footer className="sticky bottom-0 border-t border-[#e5edef] bg-white/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl sm:px-6">
          <form onSubmit={sendMessage}>
            <div
              className={`flex items-end gap-2 rounded-2xl border bg-[#f8fafb] p-2 transition ${
                sending
                  ? 'border-[#e5edef]'
                  : 'border-[#dfe9eb] focus-within:border-[#0d9488]/50 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(13,148,136,0.07)]'
              }`}
            >
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="پیامت را برای مدیریت بنویس..."
                rows={1}
                maxLength={2000}
                disabled={sending || loading || !conversationId}
                aria-label="متن پیام"
                className="max-h-36 min-h-11 min-w-0 flex-1 resize-y bg-transparent px-3 py-3 text-sm leading-6 text-[#173b50] outline-none placeholder:text-[#9aabad] disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={
                  sending ||
                  loading ||
                  !conversationId ||
                  !text.trim() ||
                  text.trim().length > 2000
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#173b50] text-white transition hover:bg-[#0d9488] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="ارسال پیام"
              >
                {sending ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                ) : (
                  <SupportIcon name="send" size={19} />
                )}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between px-1">
              <p className="text-[10px] leading-5 text-[#91a0a5]">
              </p>
              <span
                className={`text-[10px] tabular-nums ${
                  text.length > 1900 ? 'text-[#0d9488]' : 'text-[#91a0a5]'
                }`}
              >
                {text.length}/۲۰۰۰
              </span>
            </div>
          </form>

          <div className="mt-3 flex items-center justify-center gap-1.5 pb-1 text-[10px] text-[#91a0a5]">
            <span className="text-[#0d9488]">
              <SupportIcon name="shield" size={13} />
            </span>
            <span>گفت‌وگوی خصوصی با مدیریت</span>
          </div>
        </footer>
      </div>
    </main>
  )
}
