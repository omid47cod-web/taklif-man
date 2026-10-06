import { NextResponse } from 'next/server'

const PHONE_REGEX = /^09\d{9}$/

const HTTP_ONLY_COOKIE = 'taklif-man-student-phone'
const PERSISTENT_COOKIE = 'taklif-man-student-phone-persist'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const phone =
      typeof body.phone === 'string'
        ? body.phone.trim()
        : ''

    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { error: 'شماره تماس نامعتبر است.' },
        { status: 400 }
      )
    }

    const response = NextResponse.json({
      success: true,
    })

    // کوکی اصلی برای استفاده امن توسط Proxy
    response.cookies.set({
      name: HTTP_ONLY_COOKIE,
      value: phone,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })

    // کوکی ماندگار برای بازیابی نشست در مراجعه‌های بعدی
    response.cookies.set({
      name: PERSISTENT_COOKIE,
      value: phone,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    })

    return response
  } catch {
    return NextResponse.json(
      { error: 'درخواست نامعتبر است.' },
      { status: 400 }
    )
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
  })

  response.cookies.set({
    name: HTTP_ONLY_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  response.cookies.set({
    name: PERSISTENT_COOKIE,
    value: '',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}
