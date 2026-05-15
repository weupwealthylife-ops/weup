import { useState, useEffect, useRef, FormEvent, CSSProperties, ReactNode } from 'react'
import { sb } from '../lib/supabase'

type View =
  | 'confirm-sent'
  | 'confirm-success'
  | 'invalid-link'
  | 'forgot'
  | 'reset-sent'
  | 'reset'
  | 'reset-success'

type Lang = 'en' | 'es'

const t = (en: string, es: string, lang: Lang) => lang === 'es' ? es : en

// ── Shared UI primitives ──────────────────────────────────────────────────────

function Logo() {
  return (
    <a
      href="/"
      className="auth-logo"
      style={{
        fontFamily: 'DM Serif Display, Georgia, serif',
        fontSize: 26,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        marginBottom: 40,
      }}
    >
      <img
        src="/Logo_WeUp.png"
        alt="WeUp"
        style={{ height: 36, width: 36, objectFit: 'contain', borderRadius: 10, flexShrink: 0 }}
      />
      <span>WeUp</span>
    </a>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="auth-card"
      style={{
        background: 'var(--mid)',
        border: '0.5px solid var(--w20)',
        borderRadius: 24,
        padding: 40,
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 48px 96px rgba(0,0,0,0.4)',
      }}
    >
      {children}
    </div>
  )
}

type IconType = 'success' | 'error' | 'info' | 'lock'
const iconStyles: Record<IconType, CSSProperties> = {
  success: { background: 'rgba(95,220,154,0.15)',  border: '1px solid rgba(95,220,154,0.3)' },
  error:   { background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)' },
  info:    { background: 'rgba(46,139,87,0.15)',   border: '1px solid rgba(46,139,87,0.3)' },
  lock:    { background: 'rgba(95,220,154,0.12)',  border: '1px solid rgba(95,220,154,0.25)' },
}

function IconCircle({ type, children }: { type: IconType; children: ReactNode }) {
  return (
    <div style={{
      width: 72, height: 72, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 32, margin: '0 auto 24px',
      ...iconStyles[type],
    }}>
      {children}
    </div>
  )
}

function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h1
      className="auth-card-title"
      style={{
        fontFamily: 'DM Serif Display, Georgia, serif',
        fontSize: 26, color: '#fff', textAlign: 'center',
        marginBottom: 10, letterSpacing: '-0.02em',
      }}
    >
      {children}
    </h1>
  )
}

function CardSub({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: 15, color: 'var(--w60)', textAlign: 'center', lineHeight: 1.6, marginBottom: 28 }}>
      {children}
    </p>
  )
}

function BtnPrimary({
  children, onClick, disabled, type = 'button',
}: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', padding: '14px',
        background: hovered && !disabled ? 'var(--glow)' : 'var(--accent)',
        color: '#fff', border: 'none', borderRadius: 12,
        fontFamily: 'DM Sans, system-ui, sans-serif',
        fontSize: 15, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 4, transition: 'all 0.25s', letterSpacing: '0.01em',
        transform: hovered && !disabled ? 'translateY(-1px)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

function BtnGhost({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const style: CSSProperties = {
    width: '100%', padding: '13px',
    background: 'transparent', color: 'var(--w80)',
    border: '0.5px solid var(--w20)', borderRadius: 12,
    fontFamily: 'DM Sans, system-ui, sans-serif',
    fontSize: 15, fontWeight: 400, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 10, textDecoration: 'none', transition: 'all 0.2s',
  }
  if (href) return <a href={href} style={style}>{children}</a>
  return <button type="button" onClick={onClick} style={style}>{children}</button>
}

function FormLabel({ children }: { children: ReactNode }) {
  return (
    <label style={{
      display: 'block', fontSize: 12, fontWeight: 600,
      color: 'var(--w80)', marginBottom: 7, letterSpacing: '0.03em',
    }}>
      {children}
    </label>
  )
}

function FormInput({
  id, type, placeholder, value, onChange, hasError,
}: {
  id: string; type: string; placeholder: string
  value: string; onChange: (v: string) => void; hasError?: boolean
}) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      required
      style={{
        width: '100%', padding: '14px 16px',
        background: 'var(--w06)',
        border: `0.5px solid ${hasError ? 'var(--err)' : 'var(--w20)'}`,
        borderRadius: 8, color: '#fff',
        fontFamily: 'DM Sans, system-ui, sans-serif',
        fontSize: 15, outline: 'none',
      }}
    />
  )
}

function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  if (!message) return null
  const isErr = type === 'error'
  return (
    <div style={{
      borderRadius: 8, padding: '12px 16px', fontSize: 13, marginBottom: 16,
      background: isErr ? 'rgba(248,113,113,0.10)' : 'rgba(95,220,154,0.10)',
      border: `0.5px solid ${isErr ? 'var(--err)' : 'var(--light)'}`,
      color: isErr ? 'var(--err)' : 'var(--light)',
    }}>
      {message}
    </div>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Password strength ────────────────────────────────────────────────────────

function calcStrength(val: string) {
  if (!val) return { score: 0, color: '', label: '' }
  let score = 0
  if (val.length >= 8)            score++
  if (/[A-Z]/.test(val))          score++
  if (/[0-9]/.test(val))          score++
  if (/[^A-Za-z0-9]/.test(val))   score++
  const color = score <= 1 ? '#F87171' : score <= 2 ? '#FBBF24' : '#5FDC9A'
  const label = score <= 1 ? 'Weak' : score <= 2 ? 'Fair' : 'Strong'
  return { score, color, label }
}

function PwStrength({ value }: { value: string }) {
  const { score, color, label } = calcStrength(value)
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? color : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      {label && (
        <div style={{ fontSize: 11, color, marginTop: 6, textAlign: 'right' }}>{label}</div>
      )}
    </div>
  )
}

// ── Checklist item ───────────────────────────────────────────────────────────

function CheckItem({ children, done }: { children: ReactNode; done?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 13, color: done ? 'var(--w80)' : 'var(--w60)',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: done ? 'none' : '1.5px solid var(--w20)',
        background: done ? 'var(--accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: '#fff', transition: 'all 0.3s',
      }}>
        {done ? '✓' : ''}
      </div>
      {children}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEWS
// ══════════════════════════════════════════════════════════════════════════════

// 1. Email Confirmation Sent
function ViewConfirmSent({
  email, lang, onResend,
}: { email: string; lang: Lang; onResend: () => Promise<void> }) {
  const [timerActive, setTimerActive] = useState(false)
  const [count, setCount] = useState(60)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startTimer() {
    setCount(60)
    setTimerActive(true)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(intervalRef.current!); setTimerActive(false); return 60 }
        return c - 1
      })
    }, 1000)
  }

  async function handleResend() {
    await onResend()
    startTimer()
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  return (
    <>
      <Logo />
      <Card>
        <IconCircle type="info">✉️</IconCircle>
        <CardTitle>{t('Check your email', 'Revisa tu correo', lang)}</CardTitle>
        <CardSub>{t('We sent a confirmation link to', 'Enviamos un enlace de confirmación a', lang)}</CardSub>

        {/* Email chip */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--w06)', border: '0.5px solid var(--w20)',
            borderRadius: 20, padding: '6px 14px',
            fontSize: 13, color: 'var(--w80)', marginBottom: 24,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--light)', display: 'inline-block',
              animation: 'pulse 2s infinite',
            }} />
            {email}
          </div>
        </div>

        {/* Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '16px 0' }}>
          <CheckItem done>{t('Account created', 'Cuenta creada', lang)}</CheckItem>
          <CheckItem>{t('Email confirmed — waiting...', 'Email confirmado — esperando...', lang)}</CheckItem>
          <CheckItem>{t('Access dashboard', 'Acceder al dashboard', lang)}</CheckItem>
        </div>

        <p style={{ fontSize: 12, color: 'var(--w50)', textAlign: 'center', lineHeight: 1.6, marginTop: 8 }}>
          {t(
            "Click the link in the email to activate your account. Check your spam folder if you don't see it.",
            'Haz clic en el enlace del email para activar tu cuenta. Revisa tu carpeta de spam si no lo encuentras.',
            lang,
          )}
        </p>

        {/* Resend */}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--w50)' }}>
          {t("Didn't receive it? ", '¿No lo recibiste? ', lang)}
          <button
            disabled={timerActive}
            onClick={handleResend}
            style={{
              background: 'none', border: 'none',
              color: timerActive ? 'var(--w50)' : 'var(--light)',
              fontSize: 13, fontWeight: 600,
              cursor: timerActive ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, system-ui, sans-serif',
            }}
          >
            {t('Resend email', 'Reenviar email', lang)}
          </button>
          {timerActive && <span> ({count}s)</span>}
        </div>
      </Card>

      <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--w50)' }}>
        <a href="/" style={{ color: 'var(--light)', textDecoration: 'none', fontWeight: 500 }}>
          {t('← Back to WeUp', '← Volver a WeUp', lang)}
        </a>
      </div>
    </>
  )
}

// 2. Email Confirmed Successfully
function ViewConfirmSuccess({ lang }: { lang: Lang }) {
  return (
    <>
      <Logo />
      <Card>
        <IconCircle type="success">✅</IconCircle>
        <CardTitle>{t('Email confirmed!', '¡Email confirmado!', lang)}</CardTitle>
        <CardSub>
          {t(
            "Your account is now active. You're ready to take control of your finances.",
            'Tu cuenta ya está activa. Estás listo para tomar el control de tus finanzas.',
            lang,
          )}
        </CardSub>
        <BtnPrimary onClick={() => (window.location.href = '/dashboard')}>
          {t('Go to dashboard', 'Ir al dashboard', lang)} <ArrowIcon />
        </BtnPrimary>
      </Card>
    </>
  )
}

// 3. Invalid / Expired Link
function ViewInvalidLink({ lang, onRequestNew }: { lang: Lang; onRequestNew: () => void }) {
  return (
    <>
      <Logo />
      <Card>
        <IconCircle type="error">🔗</IconCircle>
        <CardTitle>{t('Link expired', 'Enlace expirado', lang)}</CardTitle>
        <CardSub>
          {t(
            'This confirmation link is no longer valid. Links expire after 24 hours for security.',
            'Este enlace de confirmación ya no es válido. Los enlaces expiran después de 24 horas por seguridad.',
            lang,
          )}
        </CardSub>
        <BtnPrimary onClick={onRequestNew}>{t('Request a new link', 'Solicitar nuevo enlace', lang)}</BtnPrimary>
        <BtnGhost href="/">{t('Back to home', 'Volver al inicio', lang)}</BtnGhost>
      </Card>
    </>
  )
}

// 4. Forgot Password
function ViewForgot({ lang, onSent }: { lang: Lang; onSent: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await sb.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth`,
    })
    setLoading(false)
    if (err) setError(err.message)
    else onSent(email.trim())
  }

  return (
    <>
      <Logo />
      <Card>
        <IconCircle type="lock">🔑</IconCircle>
        <CardTitle>{t('Forgot password?', '¿Olvidaste tu contraseña?', lang)}</CardTitle>
        <CardSub>
          {t(
            "No problem. Enter your email and we'll send you a reset link.",
            'Sin problema. Ingresa tu email y te enviaremos un enlace para restablecerla.',
            lang,
          )}
        </CardSub>

        <Alert type="error" message={error} />

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <FormLabel>{t('Email address', 'Correo electrónico', lang)}</FormLabel>
            <FormInput
              id="forgot-email" type="email"
              placeholder="ana@example.com"
              value={email} onChange={setEmail}
            />
          </div>
          <BtnPrimary type="submit" disabled={loading}>
            {loading ? t('Sending...', 'Enviando...', lang) : t('Send reset link', 'Enviar enlace', lang)}
          </BtnPrimary>
        </form>

        <BtnGhost href="/">{t('← Back to sign in', '← Volver a iniciar sesión', lang)}</BtnGhost>
      </Card>
    </>
  )
}

// 5. Reset Link Sent
function ViewResetSent({
  email, lang, onTryDifferent,
}: { email: string; lang: Lang; onTryDifferent: () => void }) {
  return (
    <>
      <Logo />
      <Card>
        <IconCircle type="info">📨</IconCircle>
        <CardTitle>{t('Check your inbox', 'Revisa tu bandeja', lang)}</CardTitle>
        <CardSub>
          {t('We sent a password reset link to', 'Enviamos un enlace para restablecer tu contraseña a', lang)}
          <br />
          <strong style={{ color: 'var(--light)', fontWeight: 500 }}>{email}</strong>
        </CardSub>
        <p style={{ fontSize: 12, color: 'var(--w50)', textAlign: 'center', lineHeight: 1.6, marginBottom: 20 }}>
          {t(
            "The link expires in 1 hour. Check your spam folder if you don't see it.",
            'El enlace expira en 1 hora. Revisa tu carpeta de spam si no lo encuentras.',
            lang,
          )}
        </p>
        <BtnPrimary onClick={onTryDifferent}>{t('Try a different email', 'Intentar con otro email', lang)}</BtnPrimary>
        <BtnGhost href="/">{t('Back to sign in', 'Volver a iniciar sesión', lang)}</BtnGhost>
      </Card>
    </>
  )
}

// 6. Reset Password (new password form)
function ViewReset({ lang, onSuccess }: { lang: Lang; onSuccess: () => void }) {
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (pw1.length < 8) { setError(t('Minimum 8 characters.', 'Mínimo 8 caracteres.', lang)); return }
    if (pw1 !== pw2)    { setError(t('Passwords do not match.', 'Las contraseñas no coinciden.', lang)); return }
    setLoading(true)
    const { error: err } = await sb.auth.updateUser({ password: pw1 })
    setLoading(false)
    if (err) setError(err.message)
    else onSuccess()
  }

  return (
    <>
      <Logo />
      <Card>
        <IconCircle type="lock">🔐</IconCircle>
        <CardTitle>{t('Set new password', 'Establecer nueva contraseña', lang)}</CardTitle>
        <CardSub>
          {t('Choose a strong password for your WeUp account.', 'Elige una contraseña segura para tu cuenta WeUp.', lang)}
        </CardSub>

        <Alert type="error" message={error} />

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <FormLabel>{t('New password', 'Nueva contraseña', lang)}</FormLabel>
            <FormInput
              id="new-pw" type="password"
              placeholder={t('Min 8 characters', 'Mínimo 8 caracteres', lang)}
              value={pw1} onChange={setPw1}
            />
            <PwStrength value={pw1} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <FormLabel>{t('Confirm password', 'Confirmar contraseña', lang)}</FormLabel>
            <FormInput
              id="confirm-pw" type="password"
              placeholder={t('Repeat your password', 'Repite tu contraseña', lang)}
              value={pw2} onChange={setPw2}
            />
          </div>
          <BtnPrimary type="submit" disabled={loading}>
            {loading ? t('Updating...', 'Actualizando...', lang) : t('Update password', 'Actualizar contraseña', lang)}
          </BtnPrimary>
        </form>
      </Card>
    </>
  )
}

// 7. Password Updated Successfully
function ViewResetSuccess({ lang }: { lang: Lang }) {
  return (
    <>
      <Logo />
      <Card>
        <IconCircle type="success">🎉</IconCircle>
        <CardTitle>{t('Password updated!', '¡Contraseña actualizada!', lang)}</CardTitle>
        <CardSub>
          {t(
            'Your password has been changed successfully. You can now sign in with your new password.',
            'Tu contraseña se cambió correctamente. Ahora puedes iniciar sesión con tu nueva contraseña.',
            lang,
          )}
        </CardSub>
        <BtnPrimary onClick={() => (window.location.href = '/')}>
          {t('Sign in to WeUp', 'Iniciar sesión en WeUp', lang)} <ArrowIcon />
        </BtnPrimary>
      </Card>
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN AUTH PAGE — Router
// ══════════════════════════════════════════════════════════════════════════════

const VALID_VIEWS: View[] = [
  'confirm-sent', 'confirm-success', 'invalid-link',
  'forgot', 'reset-sent', 'reset', 'reset-success',
]

export default function AuthPage() {
  const [view, setView] = useState<View | null>(null)
  const [lang] = useState<Lang>('en')
  const [pendingEmail, setPendingEmail] = useState('')
  const [resetEmail, setResetEmail] = useState('')

  useEffect(() => {
    const hash   = window.location.hash
    const params = new URLSearchParams(hash.replace('#', '?'))
    const type   = params.get('type')
    const error  = params.get('error_description') || params.get('error')
    const search = new URLSearchParams(window.location.search)

    // Handle Supabase auth callback in URL hash
    if (hash.includes('access_token') || hash.includes('error')) {
      if (error)                                      { setView('invalid-link');    return }
      if (type === 'recovery')                         { setView('reset');           return }
      if (type === 'signup' || type === 'email_change'){ setView('confirm-success'); return }
    }

    // Manual ?p= override
    const p = search.get('p')
    if (p && VALID_VIEWS.includes(p as View)) { setView(p as View); return }

    // Post-signup flow — email pending confirmation
    const email = sessionStorage.getItem('weup_pending_email')
    if (email) {
      setPendingEmail(email)
      setView('confirm-sent')
      // Auto-advance when user confirms in another tab
      const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setTimeout(() => { window.location.href = '/onboarding' }, 1200)
        }
      })
      return () => subscription.unsubscribe()
    } else {
      window.location.href = '/'
    }
  }, [])

  async function handleResend() {
    if (!pendingEmail) return
    await sb.auth.resend({
      type: 'signup',
      email: pendingEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    })
  }

  if (!view) return null

  return (
    <div className="auth-bg">
      <div className="auth-content">
        {view === 'confirm-sent'    && <ViewConfirmSent    email={pendingEmail} lang={lang} onResend={handleResend} />}
        {view === 'confirm-success' && <ViewConfirmSuccess lang={lang} />}
        {view === 'invalid-link'    && <ViewInvalidLink    lang={lang} onRequestNew={() => setView('forgot')} />}
        {view === 'forgot'          && <ViewForgot         lang={lang} onSent={e => { setResetEmail(e); setView('reset-sent') }} />}
        {view === 'reset-sent'      && <ViewResetSent      email={resetEmail} lang={lang} onTryDifferent={() => setView('forgot')} />}
        {view === 'reset'           && <ViewReset          lang={lang} onSuccess={() => setView('reset-success')} />}
        {view === 'reset-success'   && <ViewResetSuccess   lang={lang} />}
      </div>
    </div>
  )
}
