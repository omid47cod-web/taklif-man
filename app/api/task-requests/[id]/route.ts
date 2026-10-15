
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const SESSION_COOKIE = 'taklif-man-student-session'

type RouteContext = {
  params: Promise<{ id: string }>
}

type Attachment = {
  id: string
  storage_path?: string | null
  original_name?: string | null
  mime_type?: string | null
  size_bytes?: number | null
  created_at?: string
}

type Reply = {
  id: string
  message?: string | null
  created_at?: string
  attachments?: Attachment[]
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      return NextResponse.json(
        { error: 'شناسه درخواست معتبر نیست.' },
        { status: 400 },
      )
    }

    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    if (!token) {
      return NextResponse.json(
        { error: 'نشست دانش‌آموز معتبر نیست.' },
        { status: 401 },
      )
    }

    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex')

    const supabase = await createClient()

    const { data, error } = await supabase.rpc(
      'get_my_task_request',
      {
        p_token_hash: tokenHash,
        p_request_id: id,
      },
    )

    if (error) {
      console.error('TASK REQUEST DETAIL ERROR:', error.message)

      return NextResponse.json(
        { error: 'دریافت جزئیات درخواست ناموفق بود.' },
        { status: 500 },
      )
    }

    // پشتیبانی از ساختارهای احتمالی خروجی RPC
    const requestData =
      data?.request?.request ??
      data?.request ??
      data?.task_request ??
      null

    const repliesData =
      data?.replies ??
      data?.request?.replies ??
      []

    if (!requestData || !Array.isArray(repliesData)) {
      return NextResponse.json(
        { error: 'ساختار اطلاعات درخواست معتبر نیست.' },
        { status: 500 },
      )
    }

    const repliesWithAttachments = (repliesData as Reply[]).map(
      (reply) => {
        const attachments = Array.isArray(reply.attachments)
          ? reply.attachments
          : []

        const attachmentsWithUrls = attachments.map(
          (attachment) => {
            // بدون storage_path، لینک قابل استفاده نیست.
            if (!attachment.id || !attachment.storage_path) {
              return {
                ...attachment,
                url: '',
                signed_url: '',
                download_url: '',
              }
            }

            const baseUrl =
              `/api/task-requests/attachments/${encodeURIComponent(attachment.id)}`

            return {
              ...attachment,
              url: baseUrl,
              signed_url: baseUrl,
              download_url: `${baseUrl}?download=1`,
            }
          },
        )

        return {
          ...reply,
          attachments: attachmentsWithUrls,
        }
      },
    )

    return NextResponse.json(
      {
        request: {
          ...requestData,
          replies: repliesWithAttachments,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    )
  } catch (error) {
    console.error('TASK REQUEST DETAIL ERROR:', error)

    return NextResponse.json(
      { error: 'خطا در دریافت جزئیات درخواست.' },
      { status: 500 },
    )
  }
}
