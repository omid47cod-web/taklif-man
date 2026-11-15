
import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'task-request-attachments'

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { 'Cache-Control': 'private, no-store' },
    },
  )
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    // بررسی قالب شناسه فایل
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      return jsonError('شناسهٔ فایل معتبر نیست.', 400)
    }

    // بررسی نشست اختصاصی دانش‌آموز
    const token = request.cookies.get('taklif-man-student-session')?.value

    if (!token) {
      return jsonError('برای مشاهدهٔ فایل دوباره وارد شو.', 401)
    }

    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex')

    // این کلاینت فقط برای اعتبارسنجی نشست دانش‌آموز است.
    const studentClient = await createClient()

    const {
      data: studentData,
      error: studentError,
    } = await studentClient.rpc('get_student_by_session', {
      p_token_hash: tokenHash,
    })

    if (studentError || !studentData) {
      console.error('Student session validation failed:', studentError)
      return jsonError('نشست معتبر نیست.', 401)
    }

    const student = Array.isArray(studentData)
      ? studentData[0]
      : studentData

    if (!student?.id || student.is_blocked) {
      return jsonError('دسترسی به این فایل امکان‌پذیر نیست.', 403)
    }

    // کلید محرمانه فقط در سمت سرور استفاده می‌شود.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !secretKey) {
      console.error('Supabase server secret configuration is missing.')
      return jsonError('تنظیمات دریافت فایل کامل نیست.', 500)
    }

    const adminClient = createSupabaseClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    )

    // دریافت اطلاعات فایل با دسترسی سروری
    const {
      data: attachment,
      error: attachmentError,
    } = await adminClient
      .from('task_request_attachments')
      .select(`
        id,
        storage_path,
        original_name,
        mime_type,
        size_bytes,
        task_request_replies!inner (
          request_id,
          task_requests!inner (
            student_id
          )
        )
      `)
      .eq('id', id)
      .maybeSingle()

    if (attachmentError) {
      console.error('Attachment database query failed:', attachmentError)
      return jsonError('خطا در بررسی اطلاعات فایل رخ داد.', 500)
    }

    if (!attachment) {
      return jsonError('فایل پیدا نشد.', 404)
    }

    // استخراج اطلاعات درخواست مرتبط با فایل
    const reply = Array.isArray(attachment.task_request_replies)
      ? attachment.task_request_replies[0]
      : attachment.task_request_replies

    const taskRequest = Array.isArray(reply?.task_requests)
      ? reply.task_requests[0]
      : reply?.task_requests

    // جلوگیری از مشاهده فایل دانش‌آموزان دیگر
    if (taskRequest?.student_id !== student.id) {
      return jsonError('اجازهٔ دسترسی به این فایل را نداری.', 403)
    }

    if (!attachment.storage_path) {
      console.error('Attachment has no storage path:', id)
      return jsonError('مسیر فایل ثبت نشده است.', 404)
    }

    // دریافت فایل با کلید محرمانه، پس از تأیید مالکیت
    const {
      data: file,
      error: downloadError,
    } = await adminClient.storage
      .from(BUCKET)
      .download(attachment.storage_path)

    if (downloadError || !file) {
      console.error('Storage download failed:', {
        attachmentId: id,
        error: downloadError,
      })

      return jsonError('دریافت تصویر از فضای ذخیره‌سازی ناموفق بود.', 404)
    }

    const download =
      request.nextUrl.searchParams.get('download') === '1'

    const safeName = (attachment.original_name || 'attachment')
      .replace(/[\r\n"]/g, '_')

    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type':
          attachment.mime_type || 'application/octet-stream',

        'Content-Length': String(file.size),

        'Content-Disposition':
          `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(safeName)}`,

        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Unexpected attachment route error:', error)

    return jsonError('خطایی هنگام دریافت فایل رخ داد.', 500)
  }
}
