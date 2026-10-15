'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Student = {
  id: string
  full_name: string
  phone: string
}

type Conversation = {
  id: string
  student_id: string
  created_at: string
  updated_at: string
  student?: Student | Student[] | null
}

type Message = {
  id: string
  conversation_id: string
  sender_type: 'student' | 'management'
  admin_id: string | null
  body: string
  created_at: string
  read_at: string | null
}

export default function AdminSupportPage() {
  const supabase = createClient()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null)

  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  )
  const [deletingConversationId, setDeletingConversationId] = useState<
    string | null
  >(null)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadConversations = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('support_conversations')
      .select(`
        id,
        student_id,
        created_at,
        updated_at,
        student:students (
          id,
          full_name,
          phone
        )
      `)
      .order('updated_at', { ascending: false })

    if (queryError) {
      console.error('Loading conversations failed:', queryError)
      setError('دریافت گفت‌وگوها ناموفق بود. لطفاً دوباره تلاش کن.')
      return
    }

    setConversations((data ?? []) as unknown as Conversation[])
  }, [supabase])

  const loadMessages = useCallback(
    async (conversation: Conversation) => {
      setSelectedConversation(conversation)
      setMessagesLoading(true)
      setError('')
      setNotice('')

      const { data, error: queryError } = await supabase
        .from('support_messages')
        .select(
          'id, conversation_id, sender_type, admin_id, body, created_at, read_at',
        )
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      if (queryError) {
        console.error('Loading messages failed:', queryError)
        setError('دریافت پیام‌های این گفت‌وگو ناموفق بود.')
        setMessagesLoading(false)
        return
      }

      const loadedMessages = (data ?? []) as Message[]
      setMessages(loadedMessages)

      const unreadStudentMessages = loadedMessages
        .filter((message) => message.sender_type === 'student' && !message.read_at)
        .map((message) => message.id)

      if (unreadStudentMessages.length > 0) {
        const readAt = new Date().toISOString()

        const { error: readError } = await supabase
          .from('support_messages')
          .update({ read_at: readAt })
          .in('id', unreadStudentMessages)

        if (readError) {
          console.error('Marking messages as read failed:', readError)
        } else {
          setMessages((current) =>
            current.map((message) =>
              unreadStudentMessages.includes(message.id)
                ? { ...message, read_at: readAt }
                : message,
            ),
          )
        }
      }

      setMessagesLoading(false)
    },
    [supabase],
  )

  useEffect(() => {
    let active = true

    async function initialize() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (active) {
        setCurrentAdminId(user?.id ?? null)
      }

      await loadConversations()

      if (active) {
        setLoading(false)
      }
    }

    void initialize()

    return () => {
      active = false
    }
  }, [supabase, loadConversations])

  useEffect(() => {
    if (!selectedConversation) return

    const conversationId = selectedConversation.id

    const channel = supabase
      .channel(`admin-support-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message

            setMessages((current) => {
              if (current.some((message) => message.id === newMessage.id)) {
                return current
              }

              return [...current, newMessage]
            })

            if (newMessage.sender_type === 'student' && !newMessage.read_at) {
              const readAt = new Date().toISOString()

              void supabase
                .from('support_messages')
                .update({ read_at: readAt })
                .eq('id', newMessage.id)
                .then(({ error: readError }) => {
                  if (readError) {
                    console.error('Marking incoming message as read failed:', readError)
                  }
                })
            }
          }

          if (payload.eventType === 'DELETE') {
            const oldMessage = payload.old as Partial<Message>

            if (oldMessage.id) {
              setMessages((current) =>
                current.filter((message) => message.id !== oldMessage.id),
              )
            }
          }

          void loadConversations()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, selectedConversation, loadConversations])

  function getStudent(conversation: Conversation): Student | null {
    const student = conversation.student

    if (Array.isArray(student)) {
      return student[0] ?? null
    }

    return student ?? null
  }

  async function sendMessage() {
    if (!selectedConversation || !messageText.trim() || sending) return

    if (!currentAdminId) {
      setError('نشست مدیریت معتبر نیست. لطفاً دوباره وارد پنل شو.')
      return
    }

    const body = messageText.trim()

    if (body.length > 2000) {
      setError('حداکثر طول پیام ۲۰۰۰ کاراکتر است.')
      return
    }

    setSending(true)
    setError('')
    setNotice('')

    const { data, error: insertError } = await supabase
      .from('support_messages')
      .insert({
        conversation_id: selectedConversation.id,
        sender_type: 'management',
        admin_id: currentAdminId,
        body,
      })
      .select(
        'id, conversation_id, sender_type, admin_id, body, created_at, read_at',
      )
      .single()

    if (insertError) {
      console.error('Sending management message failed:', insertError)
      setError('ارسال پیام ناموفق بود. مجوزهای جدول پیام‌ها را بررسی کن.')
      setSending(false)
      return
    }

    const newMessage = data as Message

    setMessages((current) => {
      if (current.some((message) => message.id === newMessage.id)) {
        return current
      }

      return [...current, newMessage]
    })

    setMessageText('')

    await supabase
      .from('support_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', selectedConversation.id)

    await loadConversations()

    setSending(false)
  }

  async function deleteMessage(message: Message) {
    if (message.sender_type !== 'management') return

    if (!currentAdminId || message.admin_id !== currentAdminId) {
      setError('فقط مدیری که این پیام را فرستاده می‌تواند آن را حذف کند.')
      return
    }

    const confirmed = window.confirm(
      'آیا از حذف این پیام اطمینان داری؟ این کار قابل بازگشت نیست.',
    )

    if (!confirmed) return

    setDeletingMessageId(message.id)
    setError('')
    setNotice('')

    const { error: deleteError } = await supabase
      .from('support_messages')
      .delete()
      .eq('id', message.id)
      .eq('conversation_id', message.conversation_id)
      .eq('sender_type', 'management')
      .eq('admin_id', currentAdminId)

    if (deleteError) {
      console.error('Deleting message failed:', deleteError)
      setError('حذف پیام انجام نشد. مجوز حذف پیام‌ها در Supabase را بررسی کن.')
      setDeletingMessageId(null)
      return
    }

    setMessages((current) =>
      current.filter((item) => item.id !== message.id),
    )

    setNotice('پیام حذف شد.')
    setDeletingMessageId(null)
  }

  async function deleteConversation(conversation: Conversation) {
    const student = getStudent(conversation)
    const studentName = student?.full_name || 'این دانش‌آموز'

    const confirmed = window.confirm(
      `گفت‌وگوی ${studentName} و تمام پیام‌های آن حذف شوند؟\n\nاین کار قابل بازگشت نیست.`,
    )

    if (!confirmed) return

    setDeletingConversationId(conversation.id)
    setError('')
    setNotice('')

    // ابتدا پیام‌ها حذف می‌شوند تا به محدودیت کلید خارجی برخورد نکنیم.
    const { error: messagesDeleteError } = await supabase
      .from('support_messages')
      .delete()
      .eq('conversation_id', conversation.id)

    if (messagesDeleteError) {
      console.error('Deleting conversation messages failed:', messagesDeleteError)
      setError(
        'حذف پیام‌های گفت‌وگو انجام نشد. مجوز حذف در Supabase را بررسی کن.',
      )
      setDeletingConversationId(null)
      return
    }

    const { error: conversationDeleteError } = await supabase
      .from('support_conversations')
      .delete()
      .eq('id', conversation.id)

    if (conversationDeleteError) {
      console.error('Deleting conversation failed:', conversationDeleteError)
      setError(
        'پیام‌ها حذف شدند، اما حذف خود گفت‌وگو ناموفق بود. مجوز حذف گفت‌وگوها را بررسی کن.',
      )
      setDeletingConversationId(null)
      await loadConversations()
      return
    }

    setConversations((current) =>
      current.filter((item) => item.id !== conversation.id),
    )

    if (selectedConversation?.id === conversation.id) {
      setSelectedConversation(null)
      setMessages([])
      setMessageText('')
    }

    setNotice('گفت‌وگو و پیام‌های آن با موفقیت حذف شدند.')
    setDeletingConversationId(null)
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString('fa-IR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#11110f] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-[#d7b56d]"
            >
              <span aria-hidden="true">→</span>
              بازگشت به پنل مدیریت
            </Link>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              ارتباط با دانش‌آموزان
            </h1>

            <p className="mt-2 text-sm text-white/50">
              پیام‌های دانش‌آموزان را ببین و پاسخ بده.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[#c7a35a]/20 bg-[#c7a35a]/[0.07] px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c7a35a]/15 text-xl text-[#d7b56d]">
              ✉
            </span>
            <div>
              <p className="text-xs text-white/50">تعداد گفت‌وگوها</p>
              <p className="mt-1 text-lg font-bold text-[#d7b56d]">
                {conversations.length.toLocaleString('fa-IR')}
              </p>
            </div>
          </div>
        </header>

        {(error || notice) && (
          <div
            role="status"
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
              error
                ? 'border-red-400/20 bg-red-400/[0.07] text-red-300'
                : 'border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300'
            }`}
          >
            {error || notice}
          </div>
        )}

        <section className="grid min-h-[620px] gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#191917]">
            <div className="border-b border-white/[0.07] px-5 py-4">
              <h2 className="font-semibold">فهرست گفت‌وگوها</h2>
              <p className="mt-1 text-xs text-white/40">
                برای مشاهده پیام‌ها، یک دانش‌آموز را انتخاب کن.
              </p>
            </div>

            <div className="max-h-[680px] overflow-y-auto p-3">
              {loading ? (
                <div className="space-y-3 p-2">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-[86px] animate-pulse rounded-2xl bg-white/[0.04]"
                    />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-4 py-14 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-2xl">
                    💬
                  </div>
                  <p className="text-sm text-white/70">هنوز گفت‌وگویی وجود ندارد.</p>
                  <p className="mt-2 text-xs text-white/35">
                    گفت‌وگوهای جدید در این قسمت نمایش داده می‌شوند.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => {
                    const student = getStudent(conversation)
                    const selected =
                      selectedConversation?.id === conversation.id
                    const deleting =
                      deletingConversationId === conversation.id

                    return (
                      <div
                        key={conversation.id}
                        className={`rounded-2xl border p-3 transition ${
                          selected
                            ? 'border-[#c7a35a]/40 bg-[#c7a35a]/[0.08]'
                            : 'border-transparent bg-white/[0.025] hover:border-white/[0.09] hover:bg-white/[0.045]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => void loadMessages(conversation)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-right"
                          >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#c7a35a]/20 bg-[#c7a35a]/10 font-bold text-[#d7b56d]">
                              {(student?.full_name || '؟').slice(0, 1)}
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-white">
                                {student?.full_name || 'دانش‌آموز'}
                              </span>
                              <span className="mt-1 block truncate text-xs text-white/45">
                                {student?.phone || 'شماره ثبت نشده'}
                              </span>
                              <span className="mt-1 block text-[11px] text-white/30">
                                {formatDate(conversation.updated_at)}
                              </span>
                            </span>
                          </button>

                          <button
                            type="button"
                            title="حذف گفت‌وگو"
                            aria-label={`حذف گفت‌وگوی ${student?.full_name || 'دانش‌آموز'}`}
                            disabled={deleting}
                            onClick={() => void deleteConversation(conversation)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/35 transition hover:bg-red-400/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deleting ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-[18px] w-[18px]"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                aria-hidden="true"
                              >
                                <path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 13h11l1-13M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#191917]">
            {selectedConversation ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c7a35a]/10 font-bold text-[#d7b56d]">
                      {(getStudent(selectedConversation)?.full_name || '؟').slice(0, 1)}
                    </span>

                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">
                        {getStudent(selectedConversation)?.full_name || 'دانش‌آموز'}
                      </h2>
                      <p className="mt-1 text-xs text-white/45">
                        {getStudent(selectedConversation)?.phone || 'شماره ثبت نشده'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={deletingConversationId === selectedConversation.id}
                    onClick={() => void deleteConversation(selectedConversation)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/[0.12] disabled:opacity-50"
                  >
                    <span aria-hidden="true">⌫</span>
                    حذف گفت‌وگو
                  </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
                  {messagesLoading ? (
                    <p className="py-10 text-center text-sm text-white/40">
                      در حال دریافت پیام‌ها...
                    </p>
                  ) : messages.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="mb-3 text-3xl">💬</div>
                      <p className="text-sm text-white/65">
                        هنوز پیامی در این گفت‌وگو ارسال نشده است.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isManagement = message.sender_type === 'management'
                      const canDelete =
                        isManagement &&
                        !!currentAdminId &&
                        message.admin_id === currentAdminId

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isManagement ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`group max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                              isManagement
                                ? 'rounded-bl-md bg-[#c7a35a] text-[#19150d]'
                                : 'rounded-br-md border border-white/[0.08] bg-[#242421] text-white'
                            }`}
                          >
                            <div className="mb-2 flex items-center justify-between gap-4">
                              <span
                                className={`text-[11px] font-semibold ${
                                  isManagement ? 'text-black/65' : 'text-[#d7b56d]'
                                }`}
                              >
                                {isManagement ? 'مدیریت' : 'دانش‌آموز'}
                              </span>

                              <span
                                className={`text-[10px] ${
                                  isManagement ? 'text-black/50' : 'text-white/35'
                                }`}
                              >
                                {formatDate(message.created_at)}
                              </span>
                            </div>

                            <p className="whitespace-pre-wrap break-words text-sm leading-7">
                              {message.body}
                            </p>

                            {canDelete && (
                              <div className="mt-2 flex justify-end border-t border-black/10 pt-2">
                                <button
                                  type="button"
                                  disabled={deletingMessageId === message.id}
                                  onClick={() => void deleteMessage(message)}
                                  className="rounded-lg px-2 py-1 text-[11px] text-black/60 transition hover:bg-black/10 hover:text-black disabled:opacity-40"
                                >
                                  {deletingMessageId === message.id
                                    ? 'در حال حذف...'
                                    : 'حذف پیام'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    void sendMessage()
                  }}
                  className="border-t border-white/[0.07] bg-[#151513] p-4 sm:p-5"
                >
                  <label htmlFor="support-reply" className="mb-2 block text-xs text-white/45">
                    پاسخ مدیریت
                  </label>

                  <div className="flex items-end gap-3">
                    <textarea
                      id="support-reply"
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault()
                          void sendMessage()
                        }
                      }}
                      placeholder="پیام خود را بنویس..."
                      rows={2}
                      maxLength={2000}
                      className="min-h-[54px] flex-1 resize-y rounded-2xl border border-white/10 bg-[#20201d] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#c7a35a]/50 focus:ring-2 focus:ring-[#c7a35a]/10"
                    />

                    <button
                      type="submit"
                      disabled={sending || !messageText.trim() || !currentAdminId}
                      className="inline-flex h-[54px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#c7a35a] px-5 text-sm font-bold text-[#19150d] transition hover:bg-[#d7b96f] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {sending ? '...' : 'ارسال'}
                      <span aria-hidden="true">←</span>
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-white/30">
                    <span>برای رفتن به خط بعد، Shift + Enter را بزن.</span>
                    <span>{messageText.length.toLocaleString('fa-IR')}/۲۰۰۰</span>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#c7a35a]/15 bg-[#c7a35a]/[0.06] text-4xl">
                  💬
                </div>
                <h2 className="text-lg font-semibold">ارتباط با دانش‌آموز</h2>
                <p className="mt-2 max-w-sm text-sm leading-7 text-white/45">
                  از فهرست کنار صفحه یک گفت‌وگو را انتخاب کن تا پیام‌ها را مشاهده کنی و پاسخ بدهی.
                </p>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}

