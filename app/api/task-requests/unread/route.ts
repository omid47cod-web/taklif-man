import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const SESSION_COOKIE = 'taklif-man-student-session'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    if (!token) {
      return NextResponse.json({ unread: false })
    }

    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex')

    const supabase = await createClient()

    const { data, error } = await supabase.rpc(
      'has_unread_task_request_replies',
      { p_token_hash: tokenHash },
    )

    if (error) {
      console.error('TASK REQUEST UNREAD ERROR:', error.message)

      return NextResponse.json(
        { error: 'بررسی پاسخ‌های خوانده‌نشده ناموفق بود.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ unread: data === true })
  } catch (error) {
    console.error('TASK REQUEST UNREAD ERROR:', error)

    return NextResponse.json(
      { error: 'خطا در بررسی اعلان‌های درخواست تکالیف.' },
      { status: 500 },
    )
  }
}