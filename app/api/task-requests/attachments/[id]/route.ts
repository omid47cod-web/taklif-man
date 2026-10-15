
import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'task-request-attachments'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params

    // شناسه باید UUID معتبر باشد.
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      return jsonError('شناسهٔ فایل معتبر نیست.', 400)
    }

    const token = request.cookies.get('taklif-man-student-session')?.value

    if (!token) {
      return jsonError('برای مشاهدهٔ فایل دوباره وارد شو.', 401)
    }

    const tokenHash = createHash('sha256').update(token).digest('hex')
    const supabase = await createClient()

    // ابتدا هویت دانش‌آموز را با نشست معتبر بررسی می‌کنیم.
    const { data: studentData, error: studentError } = await supabase.rpc(
      'get_student_by_session',
      { p_token_hash: tokenHash },
    )

    if (studentError || !studentData) {
      return jsonError('نشست معتبر نیست.', 401)
    }

    const student = Array.isArray(studentData) ? studentData[0] : studentData

    if (!student?.id || student.is_blocked) {
      return jsonError('دسترسی به این فایل امکان‌پذیر نیست.', 403)
    }

    // فقط فایلی مجاز است که به درخواست خود دانش‌آموز تعلق داشته باشد.
    const { data: attachment, error: attachmentError } = await supabase
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

    if (attachmentError || !attachment) {
      return jsonError('فایل پیدا نشد.', 404)
    }

    const reply = Array.isArray(attachment.task_request_replies)
      ? attachment.task_request_replies[0]
      : attachment.task_request_replies

    const taskRequest = Array.isArray(reply?.task_requests)
      ? reply.task_requests[0]
      : reply?.task_requests

    if (taskRequest?.student_id !== student.id) {
      return jsonError('اجازهٔ دسترسی به این فایل را نداری.', 403)
    }

    const { data: file, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(attachment.storage_path)

    if (downloadError || !file) {
      return jsonError('دریافت فایل از فضای ذخیره‌سازی انجام نشد.', 404)
    }

    const download = request.nextUrl.searchParams.get('download') === '1'
    const safeName = (attachment.original_name || 'attachment')
      .replace(/[\r\n"]/g, '_')

    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': attachment.mime_type || 'application/octet-stream',
        'Content-Length': String(file.size),
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return jsonError('خطایی هنگام دریافت فایل رخ داد.', 500)
  }
}
