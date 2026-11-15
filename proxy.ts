
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const STUDENT_ROUTES = [
  '/',
  '/homework',
  '/tomorrow-homework',
  '/task-requests',
  '/group-chat',
  '/support',
  '/blocked',
]

const SESSION_COOKIE = 'taklif-man-student-session'

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) =>
      pathname === route ||
      (route !== '/' && pathname.startsWith(`${route}/`))
  )
}

function isStudentRoute(pathname: string) {
  return matchesRoute(pathname, STUDENT_ROUTES)
}

function hashToken(token: string) {
  return crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token)
  ).then((buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  )
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''
  return NextResponse.redirect(url)
}

function redirectToRegister(request: NextRequest) {
  return redirectTo(request, '/register')
}

function redirectToBlocked(request: NextRequest) {
  return redirectTo(request, '/blocked')
}

function redirectToTemporaryError(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/maintenance'
  url.search = ''
  url.searchParams.set('temporary', '1')
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

function maintenanceApiResponse(reason: string) {
  return NextResponse.json(
    {
      error: 'دسترسی دانش‌آموزان موقتاً توسط مدیریت قطع شده است.',
      code: 'GLOBAL_ACCESS_DISABLED',
      reason,
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'private, no-store',
      },
    }
  )
}

function temporaryApiResponse() {
  return NextResponse.json(
    {
      error: 'در حال حاضر امکان بررسی وضعیت حساب وجود ندارد.',
      code: 'TEMPORARY_SESSION_CHECK_ERROR',
    },
    {
      status: 503,
      headers: {
        'Cache-Control': 'private, no-store',
      },
    }
  )
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const method = request.method

  const isAdminPage = pathname.startsWith('/admin')

  const isAdminApi =
    pathname === '/api/admin' ||
    pathname.startsWith('/api/admin/')

  const isApi = pathname.startsWith('/api/')
  const isStudentApi = isApi && !isAdminApi

  const isRegisterPage = pathname === '/register'
  const isMaintenancePage = pathname === '/maintenance'
  const studentRoute = isStudentRoute(pathname)

  // صفحات مدیریت و صفحه نگهداری از محدودیت دانش‌آموزی مستثنا هستند.
  if (isAdminPage || isAdminApi || isMaintenancePage) {
    if (!isAdminPage) {
      return NextResponse.next({ request })
    }
  }

  // خروج از حساب در هر شرایطی مجاز است.
  const isStudentLogout =
    pathname === '/api/student-session' &&
    method === 'DELETE'

  // مسیرهای غیرمرتبط با دانش‌آموزان بررسی نمی‌شوند.
  if (
    !studentRoute &&
    !isRegisterPage &&
    !isStudentApi &&
    !isAdminPage
  ) {
    return NextResponse.next({ request })
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

  // بررسی احراز هویت مدیریت
  if (isAdminPage) {
    await supabase.auth.getClaims()
    return supabaseResponse
  }

  // بررسی وضعیت قطع سراسری
  if (!isStudentLogout) {
    const { data, error } = await supabase.rpc(
      'get_global_access_status'
    )

    if (error) {
      console.error('GLOBAL ACCESS CHECK ERROR:', error.message)

      if (isStudentApi) {
        return maintenanceApiResponse(
          'در حال حاضر امکان بررسی وضعیت دسترسی وجود ندارد.'
        )
      }

      if (studentRoute || isRegisterPage) {
        return redirectTo(request, '/maintenance')
      }
    } else {
      const status = Array.isArray(data) ? data[0] : data

      if (status?.enabled === true) {
        if (isStudentApi) {
          return maintenanceApiResponse(status.reason || '')
        }

        if (studentRoute || isRegisterPage) {
          return redirectTo(request, '/maintenance')
        }
      }
    }
  }

  // API خروج حتی هنگام قطع سراسری فعال می‌ماند.
  if (isApi) {
    return supabaseResponse
  }

  // ثبت‌نام در صورت فعال بودن سامانه همچنان در دسترس است.
  if (!studentRoute) {
    return supabaseResponse
  }

  // بررسی نشست دانش‌آموز
  const token = request.cookies.get(SESSION_COOKIE)?.value

  if (!token) {
    return redirectToRegister(request)
  }

  const tokenHash = await hashToken(token)

  const { data, error } = await supabase.rpc(
    'get_student_by_session',
    { p_token_hash: tokenHash }
  )

  // خطای سرور به معنی نامعتبر بودن نشست نیست.
  // در این حالت کوکی را پاک نمی‌کنیم.
  if (error) {
    console.error('GET STUDENT BY SESSION ERROR:', error.message)
    return redirectToTemporaryError(request)
  }

  const student = Array.isArray(data) ? data[0] : data

  // فقط وقتی بررسی موفق بوده ولی دانش‌آموزی پیدا نشده،
  // نشست نامعتبر محسوب می‌شود.
  if (!student) {
    const response = redirectToRegister(request)
    clearStudentSession(response)
    return response
  }

  if (student.is_blocked === true && pathname !== '/blocked') {
    return redirectToBlocked(request)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
