
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const SESSION_COOKIE = 'taklif-man-student-session'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    if (!token) {
      return NextResponse.json(
        { error: 'نشست دانش‌آموز معتبر نیست.' },
        { status: 401 },
      )
    }

    const body = await request.json().catch(() => null)
    const requestId = body?.requestId

    if (
      typeof requestId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        requestId,
      )
    ) {
      return NextResponse.json(
        { error: 'شناسه درخواست معتبر نیست.' },
        { status: 400 },
      )
    }

    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex')

    const supabase = await createClient()

    const { data, error } = await supabase.rpc(
      'mark_my_task_request_read',
      {
        p_token_hash: tokenHash,
        p_request_id: requestId,
      },
    )

    if (error) {
      console.error('TASK REQUEST READ ERROR:', error.message)

      return NextResponse.json(
        { error: 'ثبت خوانده‌شدن پاسخ ناموفق بود.' },
        { status: 500 },
      )
    }

    if (data !== true) {
      return NextResponse.json(
        { error: 'درخواست پیدا نشد یا پاسخی ندارد.' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('TASK REQUEST READ ERROR:', error)

    return NextResponse.json(
      { error: 'خطا در ثبت وضعیت درخواست.' },
      { status: 500 },
    )
  }
}
