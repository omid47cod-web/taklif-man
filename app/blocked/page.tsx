import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export default async function BlockedPage() {
  const cookieStore = await cookies()

  const phone = cookieStore.get(
    'taklif-man-student-phone'
  )?.value

  if (!phone) {
    redirect('/register')
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'get_student_access',
    {
      p_phone: phone,
    }
  )

  if (error) {
    redirect('/register')
  }

  const access = Array.isArray(data)
    ? data[0]
    : data

  if (!access?.exists_student) {
    redirect('/register')
  }

  if (!access.is_blocked) {
    redirect('/')
  }

  const reason =
    access.block_reason?.trim() ||
    'دلیل انسداد توسط مدیریت ثبت نشده است.'

  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '520px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            margin: '0 auto 24px',
            width: '76px',
            height: '76px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '34px',
            background: '#f4e9ed',
          }}
        >
          🔒
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 800,
          }}
        >
          دسترسی شما مسدود شده است
        </h1>

        <p
          style={{
            marginTop: '28px',
            marginBottom: '10px',
            fontSize: '18px',
            lineHeight: 2,
          }}
        >
          شما به دلیل:
        </p>

        <div
          style={{
            padding: '18px 20px',
            borderRadius: '18px',
            background: '#f7f4f0',
            fontSize: '17px',
            fontWeight: 700,
            lineHeight: 2,
          }}
        >
          {reason}
        </div>

        <p
          style={{
            marginTop: '10px',
            fontSize: '18px',
            lineHeight: 2,
          }}
        >
          مسدود شده اید.
        </p>
      </section>
    </main>
  )
}