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

        // پاسخ‌های مدیریت با بازشدن گفت‌وگو خوانده‌شده محسوب می‌شوند.
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
            // اگر شناسهٔ ردیف در رویداد حذف ارسال نشد، فهرست را دوباره بخوان.
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
        className="flex min-h-screen items-center justify-center bg-[#050505] text-white"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-[#c9a96a]/15 bg-white/[0.03] px-5 py-4">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#c9a96a]" />
          <p className="text-sm text-white/60">در حال آماده‌سازی...</p>
        </div>
      </main>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col">
        <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#050505]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/75 transition hover:border-[#c9a96a]/35 hover:text-[#c9a96a]"
              aria-label="بازگشت"
            >
              <SupportIcon name="back" />
            </button>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#c9a96a]/25 bg-[#c9a96a]/10 text-[#c9a96a]">
              <SupportIcon name="user" size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold sm:text-lg">
                ارتباط با مدیریت
              </h1>
              <p className="mt-1 text-xs text-white/40">
                گفت‌وگوی خصوصی و پشتیبانی
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-[#c9a96a]/15 bg-[#c9a96a]/[0.06] px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c9a96a]" />
              <span className="text-[10px] text-[#c9a96a]">پشتیبانی</span>
            </div>
          </div>
        </header>

        <section className="flex-1 px-4 py-5 sm:px-6">
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#c9a96a]/15 bg-gradient-to-l from-[#c9a96a]/[0.08] to-transparent p-4">
            <div className="mt-0.5 shrink-0 text-[#c9a96a]">
              <SupportIcon name="shield" size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90">
                سلام {student.fullName}
              </p>
              <p className="mt-1 text-xs leading-6 text-white/45">
                اگر درباره تکالیف یا استفاده از برنامه سؤالی داری، پیام خودت را
                اینجا بنویس.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[38vh] flex-col items-center justify-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#c9a96a]" />
              <p className="text-sm text-white/40">
                در حال آماده‌سازی گفت‌وگو...
              </p>
            </div>
          ) : error && !conversationId ? (
            <div className="flex min-h-[35vh] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-red-400/15 bg-red-400/[0.06] text-red-300">
                <SupportIcon name="message" size={27} />
              </div>
              <h2 className="text-base font-bold">اتصال برقرار نشد</h2>
              <p className="mt-2 max-w-sm text-sm leading-7 text-white/45">
                دریافت گفت‌وگو با مشکل روبه‌رو شد. اتصال اینترنت را بررسی کن و
                دوباره تلاش کن.
              </p>
              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#c9a96a]/25 bg-[#c9a96a]/10 px-4 py-2.5 text-sm text-[#c9a96a] transition hover:bg-[#c9a96a]/15"
              >
                <SupportIcon name="refresh" size={17} />
                تلاش دوباره
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-[35vh] items-center justify-center">
              <div className="w-full rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.035] to-transparent px-6 py-9 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-[#c9a96a]/20 bg-[#c9a96a]/[0.08] text-[#c9a96a]">
                  <SupportIcon name="message" size={28} />
                </div>
                <h2 className="text-lg font-bold">
                  گفت‌وگوی شما آماده است
                </h2>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-7 text-white/45">
                  هنوز پیامی ارسال نشده است. اولین پیام خودت را بنویس تا
                  گفت‌وگو با مدیریت شروع شود.
                </p>
                <div className="mx-auto mt-6 h-px w-16 bg-gradient-to-l from-transparent via-[#c9a96a]/50 to-transparent" />
                <p className="mt-4 text-xs text-white/30">
                  پاسخ مدیریت در همین صفحه نمایش داده می‌شود.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="pb-1 text-center">
                <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-[10px] text-white/35">
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
                      className={`max-w-[88%] rounded-3xl px-4 py-3 sm:max-w-[80%] ${
                        isStudentMessage
                          ? 'rounded-br-md border border-[#c9a96a]/20 bg-gradient-to-br from-[#d9bb7c] to-[#b99552] text-[#17130c]'
                          : 'rounded-bl-md border border-white/[0.09] bg-[#151515] text-white'
                      }`}
                    >
                      {!isStudentMessage && (
                        <p className="mb-1.5 text-[10px] font-semibold text-[#c9a96a]">
                          مدیریت
                        </p>
                      )}

                      <p className="whitespace-pre-wrap break-words text-sm leading-7">
                        {message.body}
                      </p>

                      <div
                        className={`mt-2 flex items-center justify-end gap-3 text-[10px] ${
                          isStudentMessage ? 'text-black/50' : 'text-white/35'
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
                            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-black/60 transition hover:bg-black/10 hover:text-red-800 disabled:opacity-40"
                          >
                            {deletingId === message.id ? (
                              <span className="h-3 w-3 animate-spin rounded-full border border-black/20 border-t-black" />
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
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-400/15 bg-red-400/[0.06] px-4 py-3 text-xs leading-6 text-red-300">
              <span className="shrink-0">!</span>
              <p>{error}</p>
            </div>
          )}
        </section>

        <footer className="sticky bottom-0 border-t border-white/[0.08] bg-[#050505]/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl sm:px-6">
          <form onSubmit={sendMessage}>
            <div
              className={`flex items-end gap-2 rounded-2xl border bg-[#111111] p-2 transition ${
                sending
                  ? 'border-white/[0.06]'
                  : 'border-white/[0.09] focus-within:border-[#c9a96a]/40'
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
                className="max-h-36 min-h-11 flex-1 resize-y bg-transparent px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30 disabled:opacity-50"
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault()
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
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
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c9a96a] text-[#17130c] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="ارسال پیام"
              >
                {sending ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                ) : (
                  <SupportIcon name="send" size={19} />
                )}
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between px-1">
              <p className="text-[10px] leading-5 text-white/30">
                برای رفتن به خط بعدی، Shift + Enter را بزن.
              </p>
              <span
                className={`text-[10px] tabular-nums ${
                  text.length > 1900 ? 'text-[#c9a96a]' : 'text-white/25'
                }`}
              >
                {text.length}/۲۰۰۰
              </span>
            </div>
          </form>

          <div className="mt-3 flex items-center justify-center gap-1.5 pb-1 text-[10px] text-white/25">
            <SupportIcon name="shield" size={13} />
            <span>گفت‌وگوی خصوصی با مدیریت</span>
          </div>
        </footer>
      </div>
    </main>
  )
}

