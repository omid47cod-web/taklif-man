
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAdminClient() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims?.sub) {
    return { supabase: null, response: NextResponse.json(
      { error: 'دسترسی غیرمجاز است.' },
      { status: 401 }
    ) }
  }

  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', data.claims.sub)
    .maybeSingle()

  if (adminError || !admin) {
    return { supabase: null, response: NextResponse.json(
      { error: 'دسترسی مدیریتی ندارید.' },
      { status: 403 }
    ) }
  }

  return { supabase, response: null }
}

export async function GET() {
  try {
    const { supabase, response } = await getAdminClient()

    if (response || !supabase) return response

    const { data, error } = await supabase.rpc(
      'get_global_access_status'
    )

    if (error) {
      console.error('GLOBAL ACCESS GET ERROR:', error.message)
      return NextResponse.json(
        { error: 'دریافت وضعیت دسترسی ناموفق بود.' },
        { status: 500 }
      )
    }

    const status = Array.isArray(data) ? data[0] : data

    return NextResponse.json({
      enabled: status?.enabled === true,
      reason: status?.reason ?? '',
      updated_at: status?.updated_at ?? null,
    }, {
      headers: { 'Cache-Control': 'private, no-store' }
    })
  } catch (error) {
    console.error('GLOBAL ACCESS GET ERROR:', error)

    return NextResponse.json(
      { error: 'خطا در دریافت وضعیت دسترسی.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, response } = await getAdminClient()

    if (response || !supabase) return response

    const body = await request.json().catch(() => null)

    if (
      typeof body?.enabled !== 'boolean' ||
      typeof body?.reason !== 'string' ||
      body.reason.length > 1000
    ) {
      return NextResponse.json(
        { error: 'اطلاعات ارسالی معتبر نیست.' },
        { status: 400 }
      )
    }

    const reason = body.reason.trim()

    if (body.enabled && !reason) {
      return NextResponse.json(
        { error: 'برای قطع دسترسی باید دلیل آن را وارد کنید.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc(
      'set_global_access_status',
      {
        p_enabled: body.enabled,
        p_reason: reason,
      }
    )

    if (error || data !== true) {
      console.error('GLOBAL ACCESS UPDATE ERROR:', error?.message)

      return NextResponse.json(
        { error: 'ذخیره وضعیت دسترسی انجام نشد.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      enabled: body.enabled,
      reason,
    })
  } catch (error) {
    console.error('GLOBAL ACCESS POST ERROR:', error)

    return NextResponse.json(
      { error: 'خطا در تغییر وضعیت دسترسی.' },
      { status: 500 }
    )
  }
}
