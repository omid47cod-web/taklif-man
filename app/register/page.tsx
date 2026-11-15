
'use client'

import { type FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function RegisterIcon({
  name,
  size = 21,
}: {
  name: 'user' | 'phone' | 'shield' | 'arrow' | 'alert' | 'check'
  size?: number
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  switch (name) {
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 21a7 7 0 0 1 14 0" />
        </svg>
      )

    case 'phone':
      return (
        <svg {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.35 1.9.68 2.8a2 2 0 0 1-.45 2.11L8.07 9.93a16 16 0 0 0 6 6l1.3-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.68A2 2 0 0 1 22 16.92z" />
        </svg>
      )

    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )

    case 'arrow':
      return (
        <svg {...common}>
          <path d="M19 12H5m7-7-7 7 7 7" />
        </svg>
      )

    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 9v4m0 4h.01" />
          <path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      )

    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      )
  }
}

export default function RegisterPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function createStudentSession(mobile: string) {
    try {
      const response = await fetch('/api/student-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: mobile }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        console.error('CREATE STUDENT SESSION ERROR:', data)
        return false
      }

      return true
    } catch (sessionError) {
      console.error('CREATE STUDENT SESSION ERROR:', sessionError)
      return false
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (loading) return

    setError('')

    const name = fullName.trim()
    const mobile = phone.trim()

    if (name.length < 7) {
      setError('لطفاً نام و نام خانوادگی را کامل وارد کنید.')
      return
    }

    if (!/^09\d{9}$/.test(mobile)) {
      setError('شماره تماس باید با 09 شروع شود و دقیقاً 11 رقم باشد.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      await supabase.auth.signOut({ scope: 'local' })

      const { error: insertError } = await supabase
        .from('students')
        .insert({
          full_name: name,
          phone: mobile,
        })

      if (insertError) {
        console.error('REGISTER STUDENT ERROR:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        })

        if (insertError.code === '23505') {
          setError('این شماره تماس قبلاً ثبت شده است.')
        } else {
          setError('ثبت اطلاعات انجام نشد. لطفاً دوباره تلاش کنید.')
        }

        return
      }

      const sessionCreated = await createStudentSession(mobile)

      if (!sessionCreated) {
        setError(
          'اطلاعات شما ثبت شده، اما ورود کامل نشد. صفحه را دوباره بارگذاری نکنید؛ لطفاً یک بار دیگر تلاش کنید یا با مدیریت تماس بگیرید.'
        )
        return
      }

      try {
        localStorage.setItem(
          'taklif-man-student',
          JSON.stringify({
            fullName: name,
            phone: mobile,
          })
        )
      } catch (storageError) {
        console.error('SAVE STUDENT DISPLAY DATA ERROR:', storageError)
      }

      router.replace('/')
      router.refresh()
    } catch (submitError) {
      console.error('REGISTER ERROR:', submitError)
      setError('ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="register-page" dir="rtl">
      <div className="background-decoration decoration-one" />
      <div className="background-decoration decoration-two" />

      <div className="register-container">
        <header className="brand-header">
          <div className="brand-logo">
            <span>TM</span>
            <span className="logo-dot" />
          </div>

          <div className="brand-text">
            <span>سامانه تکالیف کلاس</span>
            <h1>تکلیف من</h1>
          </div>
        </header>

        <section className="register-card">
          <div className="card-heading">
            <div className="welcome-badge">
              <span className="welcome-icon">
                <RegisterIcon name="check" size={14} />
              </span>
              خوش آمدید
            </div>

            <h2>
              قبل از شروع،
              <br />
              خودت را معرفی کن.
            </h2>

            <p>
              اطلاعاتت را وارد کن تا بتوانی به تکالیف و امکانات کلاس دسترسی
              داشته باشی.
            </p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">
                نام و نام خانوادگی
              </label>

              <div className="input-wrapper">
                <span className="input-icon">
                  <RegisterIcon name="user" size={20} />
                </span>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="مثلاً امید اوقانی"
                  autoComplete="name"
                  autoFocus
                  required
                  maxLength={100}
                  disabled={loading}
                />

                {fullName.trim().length >= 7 && (
                  <span className="input-valid">
                    <RegisterIcon name="check" size={17} />
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                شماره تماس
              </label>

              <div className="input-wrapper">
                <span className="input-icon">
                  <RegisterIcon name="phone" size={19} />
                </span>

                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  value={phone}
                  onChange={(event) => {
                    const value = event.target.value
                      .replace(/[۰-۹]/g, (digit) =>
                        String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
                      )
                      .replace(/[٠-٩]/g, (digit) =>
                        String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
                      )
                      .replace(/[^0-9]/g, '')
                      .slice(0, 11)

                    setPhone(value)
                  }}
                  placeholder="09123456789"
                  autoComplete="tel"
                  dir="ltr"
                  required
                  disabled={loading}
                />

                {phone.length === 11 && /^09\d{9}$/.test(phone) && (
                  <span className="input-valid">
                    <RegisterIcon name="check" size={17} />
                  </span>
                )}
              </div>

              <div className="input-hint">
                <span className="hint-dot" />
                شماره باید با 09 شروع شود و دقیقاً 11 رقم باشد.
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="error-message"
              >
                <span className="error-icon">
                  <RegisterIcon name="alert" size={19} />
                </span>

                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              <span>
                {loading ? 'در حال ثبت اطلاعات...' : 'ورود به تکلیف من'}
              </span>

              {loading ? (
                <span className="button-spinner" />
              ) : (
                <span className="button-icon">
                  <RegisterIcon name="arrow" size={19} />
                </span>
              )}
            </button>
          </form>

          <div className="security-note">
            <div className="security-icon">
              <RegisterIcon name="shield" size={20} />
            </div>

            <div>
              <strong>اطلاعاتت محفوظ می‌ماند</strong>
              <p>
                اطلاعات واردشده برای شناسایی اعضای کلاس و دسترسی به حساب
                دانش‌آموزی استفاده می‌شود.
              </p>
            </div>
          </div>
        </section>

        <footer className="register-footer">
          <span className="footer-line" />
          <span>طراحی شده توسط امید اوقانی</span>
          <span className="footer-line" />
        </footer>
      </div>

      <style jsx>{`
        .register-page {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 35px 18px;
          overflow: hidden;
          background: #f3f7f8;
          color: #173b50;
          font-family: inherit;
        }

        .background-decoration {
          position: absolute;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(90px);
        }

        .decoration-one {
          top: -180px;
          right: -100px;
          background: rgba(13, 148, 136, 0.12);
        }

        .decoration-two {
          bottom: -190px;
          left: -100px;
          background: rgba(23, 59, 80, 0.08);
        }

        .register-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          margin: auto;
        }

        .brand-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          margin-bottom: 25px;
        }

        .brand-logo {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 57px;
          height: 57px;
          flex-shrink: 0;
          border: 1px solid #c9e5e0;
          border-radius: 18px;
          background: #e7f5f2;
          color: #087f76;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .logo-dot {
          position: absolute;
          right: 8px;
          bottom: 8px;
          width: 7px;
          height: 7px;
          border: 2px solid #e7f5f2;
          border-radius: 50%;
          background: #0d9488;
        }

        .brand-text span {
          display: block;
          color: #7b9098;
          font-size: 11px;
        }

        .brand-text h1 {
          margin: 4px 0 0;
          color: #173b50;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.5px;
        }

        .register-card {
          padding: 27px;
          border: 1px solid #e1e9ec;
          border-radius: 25px;
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 12px 40px rgba(23, 59, 80, 0.07);
        }

        .card-heading {
          margin-bottom: 25px;
        }

        .welcome-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 11px;
          margin-bottom: 16px;
          border: 1px solid #d9eeea;
          border-radius: 30px;
          background: #f0f8f6;
          color: #0d887e;
          font-size: 11px;
          font-weight: 800;
        }

        .welcome-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          background: #d9efea;
        }

        .card-heading h2 {
          margin: 0;
          color: #173b50;
          font-size: 25px;
          line-height: 1.85;
          font-weight: 900;
          letter-spacing: -0.5px;
        }

        .card-heading p {
          margin: 9px 0 0;
          color: #758992;
          font-size: 12px;
          line-height: 2.1;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 19px;
        }

        .form-group label {
          display: block;
          margin-bottom: 9px;
          color: #294c5e;
          font-size: 12px;
          font-weight: 800;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 11px;
          min-height: 55px;
          padding: 0 14px;
          border: 1px solid #e0e9ec;
          border-radius: 14px;
          background: #f8fafb;
          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .input-wrapper:focus-within {
          border-color: #70bdb3;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.09);
        }

        .input-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #0d9488;
        }

        .input-wrapper input {
          width: 100%;
          min-width: 0;
          padding: 14px 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #173b50;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
        }

        .input-wrapper input::placeholder {
          color: #a2b0b5;
          font-size: 12px;
          font-weight: 400;
        }

        .input-wrapper input:disabled {
          opacity: 0.6;
        }

        .input-wrapper input:-webkit-autofill,
        .input-wrapper input:-webkit-autofill:hover,
        .input-wrapper input:-webkit-autofill:focus {
          -webkit-text-fill-color: #173b50;
          box-shadow: 0 0 0 1000px #f8fafb inset;
          transition: background-color 9999s ease-in-out 0s;
        }

        .input-valid {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #0d9488;
        }

        .input-hint {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 8px;
          color: #8a9ba1;
          font-size: 10px;
          line-height: 1.8;
        }

        .hint-dot {
          width: 5px;
          height: 5px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #0d9488;
        }

        .error-message {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          border: 1px solid #f0d8d2;
          border-radius: 13px;
          background: #fff5f2;
          color: #a95543;
        }

        .error-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          margin-top: 2px;
          color: #bd705c;
        }

        .error-message p {
          margin: 0;
          font-size: 11px;
          line-height: 2;
          overflow-wrap: anywhere;
        }

        .submit-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
          min-height: 55px;
          padding: 10px 16px;
          margin-top: 2px;
          border: 1px solid #087f76;
          border-radius: 14px;
          background: #0d9488;
          color: #ffffff;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 850;
          box-shadow: 0 5px 14px rgba(13, 148, 136, 0.16);
          transition:
            background 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        .submit-button:hover:not(:disabled) {
          background: #0b8178;
          box-shadow: 0 7px 18px rgba(13, 148, 136, 0.2);
          transform: translateY(-1px);
        }

        .submit-button:active:not(:disabled) {
          transform: scale(0.99);
        }

        .submit-button:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .button-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 33px;
          height: 33px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.12);
        }

        .button-spinner {
          width: 21px;
          height: 21px;
          flex-shrink: 0;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .security-note {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          padding: 13px;
          margin-top: 22px;
          border: 1px solid #e4edee;
          border-radius: 14px;
          background: #f7fafb;
        }

        .security-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          border-radius: 11px;
          background: #e8f4f2;
          color: #0d9488;
        }

        .security-note strong {
          display: block;
          margin-bottom: 4px;
          color: #315365;
          font-size: 11px;
          font-weight: 850;
        }

        .security-note p {
          margin: 0;
          color: #82939a;
          font-size: 10px;
          line-height: 2;
        }

        .register-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding-top: 25px;
          color: #8a9ba1;
          font-size: 10px;
          font-weight: 650;
        }

        .footer-line {
          width: 19px;
          height: 1px;
          background: #cbdcde;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 480px) {
          .register-page {
            padding: 22px 14px;
          }

          .register-container {
            max-width: 430px;
          }

          .brand-header {
            margin-bottom: 20px;
          }

          .brand-logo {
            width: 51px;
            height: 51px;
            border-radius: 16px;
          }

          .brand-text h1 {
            font-size: 22px;
          }

          .register-card {
            padding: 21px 17px;
            border-radius: 21px;
          }

          .card-heading {
            margin-bottom: 22px;
          }

          .card-heading h2 {
            font-size: 23px;
          }

          .register-form {
            gap: 17px;
          }

          .security-note {
            margin-top: 19px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  )
}