
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const SESSION_COOKIE = 'taklif-man-student-session'

async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) return null

  return createHash('sha256').update(token).digest('hex')
}

export async function GET() {
  try {
    const tokenHash = await getSession()

    if (!tokenHash) {
      return NextResponse.json(
        { error: 'نشست دانش‌آموز معتبر نیست.' },
        { status: 401 },
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc(
      'list_my_task_requests',
      { p_token_hash: tokenHash },
    )

    if (error) {
      console.error('TASK REQUEST LIST ERROR:', error.message)

      return NextResponse.json(
        { error: 'دریافت درخواست‌ها ناموفق بود.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ requests: data ?? [] })
  } catch (error) {
    console.error('TASK REQUEST LIST ERROR:', error)

    return NextResponse.json(
      { error: 'خطا در دریافت درخواست‌ها.' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const tokenHash = await getSession()

    if (!tokenHash) {
      return NextResponse.json(
        { error: 'نشست دانش‌آموز معتبر نیست.' },
        { status: 401 },
      )
    }

    const body = await request.json().catch(() => null)
    const requestedContent =
      typeof body?.requestedContent === 'string'
        ? body.requestedContent.trim()
        : ''

    if (!requestedContent || requestedContent.length > 2000) {
      return NextResponse.json(
        { error: 'متن درخواست باید بین ۱ تا ۲۰۰۰ نویسه باشد.' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc(
      'create_task_request',
      {
        p_token_hash: tokenHash,
        p_requested_content: requestedContent,
      },
    )

    if (error) {
      console.error('TASK REQUEST CREATE ERROR:', error.message)

      return NextResponse.json(
        { error: 'ثبت درخواست ناموفق بود.' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { success: true, requestId: data },
      { status: 201 },
    )
  } catch (error) {
    console.error('TASK REQUEST CREATE ERROR:', error)

    return NextResponse.json(
      { error: 'خطا در ثبت درخواست.' },
      { status: 500 },
    )
  }
}
