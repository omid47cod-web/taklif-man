import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const STUDENT_ROUTES = [
  '/',
  '/homework',
  '/tomorrow-homework',
]

const STUDENT_COOKIE = 'taklif-man-student-phone'
const PERSISTENT_COOKIE = 'taklif-man-student-phone-persist'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function isStudentRoute(pathname: string) {
  return STUDENT_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  )
}

function clearStudentCookies(response: NextResponse) {
  response.cookies.set({
    name: STUDENT_COOKIE,
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
}

function setStudentSessionCookie(
  response: NextResponse,
  phone: string
) {
  response.cookies.set({
    name: STUDENT_COOKIE,
    value: phone,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          supabaseResponse = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              supabaseResponse.cookies.set(
                name,
                value,
                options
              )
            }
          )

          if (headers) {
            Object.entries(headers).forEach(
              ([key, value]) => {
                supabaseResponse.headers.set(key, value)
              }
            )
          }
        },
      },
    }
  )

  await supabase.auth.getClaims()

  const pathname = request.nextUrl.pathname

  if (
    pathname === '/register' ||
    pathname === '/blocked' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/')
  ) {
    return supabaseResponse
  }

  if (!isStudentRoute(pathname)) {
    return supabaseResponse
  }

  /*
   * ابتدا کوکی HttpOnly اصلی را بررسی می‌کنیم.
   */
  let studentPhone = request.cookies.get(
    STUDENT_COOKIE
  )?.value

  /*
   * اگر کوکی اصلی وجود نداشت، از کوکی ماندگار
   * استفاده می‌کنیم و بعد از تأیید دانش‌آموز،
   * کوکی HttpOnly را دوباره می‌سازیم.
   */
  let restoredSession = false

  if (!studentPhone) {
    const persistentPhone = request.cookies.get(
      PERSISTENT_COOKIE
    )?.value

    if (persistentPhone) {
      studentPhone = persistentPhone
      restoredSession = true
    }
  }

  if (!studentPhone) {
    const registerUrl = request.nextUrl.clone()

    registerUrl.pathname = '/register'
    registerUrl.search = ''

    return NextResponse.redirect(registerUrl)
  }

  const { data, error } = await supabase.rpc(
    'get_student_access',
    {
      p_phone: studentPhone,
    }
  )

  if (error) {
    console.error(
      'Student access check failed:',
      error
    )

    const registerUrl = request.nextUrl.clone()

    registerUrl.pathname = '/register'
    registerUrl.search = ''

    return NextResponse.redirect(registerUrl)
  }

  const access = Array.isArray(data)
    ? data[0]
    : data

  /*
   * اگر شماره دیگر در دیتابیس وجود نداشته باشد،
   * نشست قبلی را پاک می‌کنیم تا کاربر بتواند
   * دوباره خودش را معرفی کند.
   */
  if (!access?.exists_student) {
    const registerUrl = request.nextUrl.clone()

    registerUrl.pathname = '/register'
    registerUrl.search = ''

    const response =
      NextResponse.redirect(registerUrl)

    clearStudentCookies(response)

    return response
  }

  /*
   * کاربر مسدود شده باید همچنان به صفحه مسدودی
   * هدایت شود.
   */
  if (access.is_blocked) {
    const blockedUrl = request.nextUrl.clone()

    blockedUrl.pathname = '/blocked'
    blockedUrl.search = ''

    return NextResponse.redirect(blockedUrl)
  }

  /*
   * اگر نشست از کوکی ماندگار بازیابی شده،
   * کوکی HttpOnly را دوباره ایجاد می‌کنیم.
   *
   * همچنین نشست اصلی را در هر مراجعه تمدید می‌کنیم
   * تا کاربر دوباره با صفحه معرفی مواجه نشود.
   */
  if (restoredSession) {
    setStudentSessionCookie(
      supabaseResponse,
      studentPhone
    )
  } else {
    setStudentSessionCookie(
      supabaseResponse,
      studentPhone
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
