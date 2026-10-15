
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const SESSION_COOKIE = 'taklif-man-student-session'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    if (!token) {
      return NextResponse.json(
        { error: 'نشست دانش‌آموز معتبر نیست.' },
        { status: 401 }
      )
    }

    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex')

    const supabase = await createClient()

    const { data, error } = await supabase.rpc(
      'mark_group_messages_read',
      { p_token_hash: tokenHash }
    )

    if (error) {
      console.error('GROUP CHAT READ ERROR:', error.message)
      return NextResponse.json(
        { error: 'ثبت وضعیت خواندن پیام‌ها ناموفق بود.' },
        { status: 500 }
      )
    }

    if (data !== true) {
      return NextResponse.json(
        { error: 'دانش‌آموز پیدا نشد یا دسترسی او مسدود است.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('GROUP CHAT READ ERROR:', error)
    return NextResponse.json(
      { error: 'خطا در ثبت وضعیت پیام‌ها.' },
      { status: 500 }
    )
  }
}
