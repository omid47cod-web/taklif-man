import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims()

  if (claimsError || !claimsData?.claims?.sub) {
    redirect('/admin/login')
  }

  const userId = claimsData.claims.sub

  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!admin) {
    redirect('/admin/login')
  }

  const [
    { count: homeworkCount },
    { count: studentsCount },
    { count: tomorrowHomeworkCount },
  ] = await Promise.all([
    supabase
      .from('homework')
      .select('*', {
        count: 'exact',
        head: true,
      }),

    supabase
      .from('students')
      .select('*', {
        count: 'exact',
        head: true,
      }),

    supabase
      .from('tomorrow_homework')
      .select('*', {
        count: 'exact',
        head: true,
      }),
  ])

  return (
    <main className="admin-dashboard-page" dir="rtl">
      <div className="admin-dashboard-background" />

      <div className="admin-dashboard-container">
        <header className="admin-dashboard-header">
          <div>
            <span className="admin-dashboard-eyebrow">
              پنل مدیریت
            </span>

            <h1>سلام، امید 👋</h1>

            <p>
              از اینجا می‌توانی تکالیف کلاس و دانش‌آموزان را مدیریت کنی.
            </p>
          </div>

          <div className="admin-dashboard-avatar">
            TM
          </div>
        </header>

        <section className="admin-stats">
          <article className="admin-stat-card">
            <div className="admin-stat-icon">
              ✓
            </div>

            <div>
              <span>تکالیف ثبت‌شده</span>
              <strong>{homeworkCount ?? 0}</strong>
            </div>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon-gold">
              ♙
            </div>

            <div>
              <span>دانش‌آموزان</span>
              <strong>{studentsCount ?? 0}</strong>
            </div>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-icon">
              ◷
            </div>

            <div>
              <span>تکالیف فردا</span>
              <strong>
                {tomorrowHomeworkCount ?? 0}
              </strong>
            </div>
          </article>
        </section>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <span>مدیریت سامانه</span>
              <h2>چه کاری می‌خواهی انجام دهی؟</h2>
            </div>
          </div>

          <div className="admin-action-grid">
            <Link
              href="/admin/homework"
              className="admin-action-card admin-action-primary"
            >
              <div className="admin-action-top">
                <div className="admin-action-icon">
                  ✎
                </div>

                <span className="admin-action-arrow">
                  ←
                </span>
              </div>

              <div>
                <h3>مدیریت تکالیف</h3>

                <p>
                  افزودن، ویرایش و حذف تکالیف کلاس
                </p>
              </div>
            </Link>

            <Link
              href="/admin/tomorrow-homework"
              className="admin-action-card"
            >
              <div className="admin-action-top">
                <div className="admin-action-icon">
                  ◷
                </div>

                <span className="admin-action-arrow">
                  ←
                </span>
              </div>

              <div>
                <h3>تکالیف فردا</h3>

                <p>
                  انتخاب تکالیفی که باید برای فردا نمایش داده شوند
                </p>
              </div>
            </Link>

            <Link
              href="/admin/students"
              className="admin-action-card"
            >
              <div className="admin-action-top">
                <div className="admin-action-icon admin-action-icon-gold">
                  ♙
                </div>

                <span className="admin-action-arrow">
                  ←
                </span>
              </div>

              <div>
                <h3>دانش‌آموزان</h3>

                <p>
                  مشاهده فهرست افراد ثبت‌نام‌شده
                </p>
              </div>
            </Link>
          </div>
        </section>

        <section className="admin-info-card">
          <div className="admin-info-mark">
            i
          </div>

          <div>
            <strong>دسترسی مدیر فعال است</strong>

            <p>
              این صفحه فقط برای حسابی که به عنوان مدیر سامانه
              ثبت شده قابل مشاهده است.
            </p>
          </div>
        </section>

        <footer className="admin-dashboard-footer">
          <span>تکلیف من</span>
          <span>•</span>
          <span>پنل مدیریت</span>
        </footer>
      </div>
    </main>
  )
}