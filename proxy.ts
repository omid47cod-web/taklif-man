import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const STUDENT_ROUTES = [
  '/',
  '/homework',
  '/tomorrow-homework',
  '/task-requests',
  '/group-chat',
  '/support',
]

const SESSION_COOKIE = 'taklif-man-student-session'

function isStudentRoute(pathname: string) {
  return STUDENT_ROUTES.some(
    (route) =>
      pathname === route ||
      (route !== '/' && pathname.startsWith(`${route}/`))
  )
}

async function hashToken(token: string) {
  const data = new TextEncoder().encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function redirectToRegister(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/register'
  url.search = ''
  return NextResponse.redirect(url)
}

function redirectToBlocked(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/blocked'
  url.search = ''
  return NextResponse.redirect(url)
}

function clearStudentSession(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname.startsWith('/admin')
  const studentRoute = isStudentRoute(pathname)

  // مسیرهای عمومی و API به بررسی نشست در Proxy نیاز ندارند.
  if (!isAdminRoute && !studentRoute) {
    return NextResponse.next({ request })
  }

  const token = studentRoute
    ? request.cookies.get(SESSION_COOKIE)?.value
    : undefined

  if (studentRoute && !token) {
    return redirectToRegister(request)
  }

  let supabaseResponse = NextResponse.next({ request })

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

          supabaseResponse = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })

          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              supabaseResponse.headers.set(key, value)
            })
          }
        },
      },
    }
  )

  // احراز هویت Supabase فقط برای مسیرهای مدیریت.
  if (isAdminRoute) {
    await supabase.auth.getClaims()
    return supabaseResponse
  }

  // احراز هویت دانش‌آموز با نشست اختصاصی.
  const tokenHash = await hashToken(token!)

  const { data, error } = await supabase.rpc(
    'get_student_by_session',
    { p_token_hash: tokenHash }
  )

  if (error) {
    console.error('GET STUDENT BY SESSION ERROR:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    })

    const response = redirectToRegister(request)
    clearStudentSession(response)
    return response
  }

  const student = Array.isArray(data) ? data[0] : data

  if (!student) {
    const response = redirectToRegister(request)
    clearStudentSession(response)
    return response
  }

  if (student.is_blocked === true) {
    return redirectToBlocked(request)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}