import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const PHONE_REGEX = /^09\d{9}$/

const SESSION_COOKIE = 'taklif-man-student-session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function hashToken(token: string) {
  return createHash('sha256')
    .update(token)
    .digest('hex')
}

function generateToken() {
  return randomBytes(32).toString('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const phone =
      typeof body.phone === 'string'
        ? body.phone.trim()
        : ''

    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        {
          error: 'شماره تماس نامعتبر است.',
        },
        { status: 400 }
      )
    }

    const token = generateToken()
    const tokenHash = hashToken(token)

    const expiresAt = new Date(
      Date.now() + COOKIE_MAX_AGE * 1000
    ).toISOString()

    const supabase = await createClient()

    const { data, error } =
      await supabase.rpc(
        'create_student_session',
        {
          p_phone: phone,
          p_token_hash: tokenHash,
          p_expires_at: expiresAt,
        }
      )

    if (error) {
      console.error(
        'CREATE STUDENT SESSION ERROR:',
        error
      )

      return NextResponse.json(
        {
          error:
            'ایجاد نشست کاربری انجام نشد. دوباره تلاش کنید.',
        },
        { status: 500 }
      )
    }

    /*
     * RPC در حال حاضر برای شماره‌ای که وجود ندارد
     * یا کاربر مسدودشده false برمی‌گرداند.
     */
    if (data !== true) {
      return NextResponse.json(
        {
          error:
            'این شماره تماس قابل استفاده نیست یا دسترسی آن مسدود شده است.',
        },
        { status: 403 }
      )
    }

    const response = NextResponse.json({
      success: true,
    })

    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })

    return response
  } catch (error) {
    console.error('STUDENT SESSION POST ERROR:', {
  message: error instanceof Error ? error.message : String(error),
})

    return NextResponse.json(
      {
        error: 'درخواست نامعتبر است.',
      },
      { status: 400 }
    )
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()

    const token =
      cookieStore.get(SESSION_COOKIE)?.value

    if (token) {
      const tokenHash = hashToken(token)

      const supabase = await createClient()

      const { error } =
        await supabase.rpc(
          'clear_student_sessions',
          {
            p_token_hash: tokenHash,
          }
        )

      if (error) {
        console.error(
          'CLEAR STUDENT SESSION ERROR:',
          error
        )
      }
    }

    const response = NextResponse.json({
      success: true,
    })

    response.cookies.set({
      name: SESSION_COOKIE,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error(
      'STUDENT SESSION DELETE ERROR:',
      error
    )

    return NextResponse.json(
      {
        error: 'خروج از حساب انجام نشد.',
      },
      { status: 500 }
    )
  }
}