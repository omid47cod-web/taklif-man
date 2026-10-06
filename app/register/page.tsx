'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function createStudentSession(mobile: string) {
    try {
      const response = await fetch(
        '/api/student-session',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: mobile,
          }),
        }
      )

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null)

        console.error(
          'CREATE STUDENT SESSION ERROR:',
          data
        )

        return false
      }

      return true
    } catch (sessionError) {
      console.error(
        'CREATE STUDENT SESSION ERROR:',
        sessionError
      )

      return false
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()
    setError('')

    const name = fullName.trim()
    const mobile = phone.trim()

    if (name.length < 3) {
      setError(
        'لطفاً نام و نام خانوادگی را کامل وارد کنید.'
      )
      return
    }

    if (!/^09\d{9}$/.test(mobile)) {
      setError(
        'شماره تماس باید با 09 شروع شود و دقیقاً 11 رقم باشد.'
      )
      return
    }

    setLoading(true)

    /*
     * ثبت دانش‌آموز جدید
     */
    const { error: insertError } =
      await supabase
        .from('students')
        .insert({
          full_name: name,
          phone: mobile,
        })

    if (insertError) {
      console.error(
        'REGISTER STUDENT ERROR:',
        insertError
      )

      if (insertError.code === '23505') {
        setError(
          'این شماره تماس قبلاً ثبت شده است.'
        )
      } else {
        setError(
          `ثبت اطلاعات انجام نشد: ${
            insertError.message ||
            insertError.code ||
            'خطای نامشخص'
          }`
        )
      }

      setLoading(false)
      return
    }

    /*
     * ذخیره اطلاعات در مرورگر
     */
    localStorage.setItem(
      'taklif-man-student',
      JSON.stringify({
        full_name: name,
        phone: mobile,
      })
    )

    /*
     * ایجاد cookie سمت سرور
     */
    const sessionCreated =
      await createStudentSession(mobile)

    if (!sessionCreated) {
      setError(
        'اطلاعات شما ثبت شد، اما ایجاد دسترسی کامل نشد. دوباره تلاش کنید.'
      )

      setLoading(false)
      return
    }

    /*
     * ورود به برنامه
     */
    router.replace('/')
  }

  return (
    <main className="register-page" dir="rtl">
      <div className="register-decoration register-decoration-one" />
      <div className="register-decoration register-decoration-two" />

      <div className="register-container">

        <header className="register-brand">
          <div className="register-mark">
            TM
          </div>

          <div>
            <span>سامانه تکالیف کلاس</span>
            <h1>تکلیف من</h1>
          </div>
        </header>

        <section className="register-card">

          <div className="register-heading">
            <span className="register-eyebrow">
              خوش آمدید
            </span>

            <h2>
              قبل از شروع،
              <br />
              خودتان را معرفی کنید.
            </h2>

            <p>
              اطلاعات شما فقط برای شناسایی اعضای کلاس
              ثبت می‌شود.
            </p>
          </div>

          <form
            className="register-form"
            onSubmit={handleSubmit}
          >

            <div className="field-group">
              <label htmlFor="fullName">
                نام و نام خانوادگی
              </label>

              <div className="input-wrapper">
                <span className="input-icon">
                  ◇
                </span>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="مثلاً امید اوقانی"
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="phone">
                شماره تماس
              </label>

              <div className="input-wrapper">
                <span className="input-icon">
                  ◌
                </span>

                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  value={phone}
                  onChange={(event) => {
                    const value =
                      event.target.value
                        .replace(/\D/g, '')
                        .slice(0, 11)

                    setPhone(value)
                  }}
                  placeholder="09123456789"
                  autoComplete="tel"
                  dir="ltr"
                />
              </div>

              <span className="field-hint">
                شماره باید با 09 شروع شود و 11 رقم باشد.
              </span>
            </div>

            {error && (
              <div
                className="register-error"
                role="alert"
              >
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              <span>
                {loading
                  ? 'در حال ثبت اطلاعات...'
                  : 'ورود به تکلیف من'}
              </span>

              {!loading && (
                <span className="submit-arrow">
                  ←
                </span>
              )}
            </button>
          </form>

          <div className="register-note">
            <span className="note-dot" />

            <p>
              با ثبت اطلاعات، دسترسی شما به تکالیف کلاس
              فعال می‌شود.
            </p>
          </div>

        </section>

        <footer className="register-footer">
          طراحی شده توسط امید اوقانی
        </footer>

      </div>
    </main>
  )
}