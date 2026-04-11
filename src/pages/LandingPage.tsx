import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sb } from '../lib/supabase'
import '../styles/landing.css'

type Lang = 'en' | 'es'
type AuthTab = 'signin' | 'signup'

const T = (en: string, es: string, lang: Lang) => lang === 'es' ? es : en

function pwStrength(pw: string): number {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [lang, setLang] = useState<Lang>(() =>
    navigator.language?.startsWith('es') ? 'es' : 'en'
  )
  const [yearly, setYearly] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [authTab, setAuthTab] = useState<AuthTab>('signup')
  const [planIntent, setPlanIntent] = useState<string | null>(null)

  // Auth form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')

  const modalRef = useRef<HTMLDivElement>(null)

  const t = (en: string, es: string) => T(en, es, lang)

  // Check session on mount
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/dashboard', { replace: true })
    })
  }, [navigate])

  // Close modal on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function openModal(tab: AuthTab = 'signup', plan?: string) {
    setAuthTab(tab)
    setAuthError('')
    setAuthSuccess('')
    setEmail(''); setPassword(''); setName('')
    if (plan) {
      setPlanIntent(plan)
      sessionStorage.setItem('planIntent', plan)
    }
    setModalOpen(true)
  }

  async function handleGoogleAuth() {
    setAuthLoading(true)
    setAuthError('')
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    if (error) setAuthError(error.message)
    setAuthLoading(false)
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setAuthLoading(true)
    setAuthError('')
    setAuthSuccess('')

    if (authTab === 'signup') {
      const { error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || email.split('@')[0] } },
      })
      if (error) {
        setAuthError(error.message)
      } else {
        setAuthSuccess(t(
          '✅ Check your email to confirm your account!',
          '✅ Revisa tu correo para confirmar tu cuenta.'
        ))
      }
    } else {
      const { data, error } = await sb.auth.signInWithPassword({ email, password })
      if (error) {
        setAuthError(error.message)
      } else if (data.session) {
        const plan = planIntent || sessionStorage.getItem('planIntent')
        if (plan && plan !== 'free') {
          navigate(`/upgrade?plan=${plan}`)
        } else {
          navigate('/dashboard')
        }
      }
    }
    setAuthLoading(false)
  }

  const strength = pwStrength(password)
  const strengthLabels = [
    t('Weak', 'Débil'),
    t('Fair', 'Regular'),
    t('Good', 'Buena'),
    t('Strong', 'Fuerte'),
  ]

  return (
    <>
      <div className="landing-bg" />

      <div className="page">
        {/* ── Nav ── */}
        <nav className="nav">
          <a href="/" className="nav-logo">
            <img src="/Logo_WeUp.png" alt="WeUp" />
            WeUp
          </a>

          <div className="nav-center">
            <a href="#features">{t('Features', 'Características')}</a>
            <a href="#about">{t('About', 'Nosotros')}</a>
            <a href="#pricing">{t('Pricing', 'Precios')}</a>
          </div>

          <div className="nav-right">
            <div className="nav-lang">
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
              <button className={lang === 'es' ? 'active' : ''} onClick={() => setLang('es')}>ES</button>
            </div>
            <button className="nav-cta" onClick={() => openModal('signin')}>
              {t('Sign in', 'Iniciar sesión')}
            </button>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="badge-dot" />
              {t('NOW AVAILABLE IN COLOMBIA & MEXICO', 'DISPONIBLE EN COLOMBIA Y MÉXICO')}
            </div>

            <h1 className="hero-headline">
              {lang === 'es'
                ? <><em>Controla</em><br />tu dinero,<br />de verdad.</>
                : <>Your money,<br /><em>finally</em><br />under control.</>
              }
            </h1>

            <p className="hero-sub">
              {t(
                'Track expenses, set budgets, and reach your financial goals — all in one beautiful app.',
                'Registra gastos, fija presupuestos y alcanza tus metas financieras — todo en una sola app.'
              )}
            </p>

            <div className="hero-actions">
              <button className="btn-primary" onClick={() => openModal('signup')}>
                {t('Get started free', 'Empieza gratis')} <span className="btn-arrow">→</span>
              </button>
              <button className="btn-ghost" onClick={() => openModal('signin')}>
                {t('Sign in', 'Iniciar sesión')}
              </button>
            </div>

            <div className="hero-social">
              <div className="hero-social-avatars">
                <div className="avatar-circle">MC</div>
                <div className="avatar-circle">JR</div>
                <div className="avatar-circle">AS</div>
                <div className="avatar-circle avatar-plus">+</div>
              </div>
              <p className="hero-social-text">
                <strong>12,000+</strong>{' '}
                {t('users already weup-ing', 'usuarios ya haciendo weup')}
              </p>
            </div>
          </div>

          <div className="hero-right">
            <div className="iphone-float">
              <div className="iphone">
                {/* Hardware buttons */}
                <div className="iphone-btn-silent" />
                <div className="iphone-btn-vol-up" />
                <div className="iphone-btn-vol-down" />
                <div className="iphone-btn-power" />

                {/* Screen */}
                <div className="iphone-screen">
                  <div className="iphone-island" />

                  <div className="iphone-status-bar">
                    <span className="iphone-time">9:41</span>
                    <div className="iphone-status-icons">
                      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
                        <rect x="0" y="4" width="3" height="8" rx="1" opacity="0.4"/>
                        <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" opacity="0.6"/>
                        <rect x="9" y="0.5" width="3" height="11.5" rx="1"/>
                      </svg>
                      <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor">
                        <path d="M7.5 2.5C9.8 2.5 11.9 3.4 13.4 4.9L14.5 3.8C12.7 2 10.2 1 7.5 1S2.3 2 0.5 3.8L1.6 4.9C3.1 3.4 5.2 2.5 7.5 2.5Z" opacity="0.4"/>
                        <path d="M7.5 5C9 5 10.3 5.6 11.3 6.6L12.4 5.5C11.1 4.3 9.4 3.5 7.5 3.5S3.9 4.3 2.6 5.5L3.7 6.6C4.7 5.6 6 5 7.5 5Z" opacity="0.6"/>
                        <circle cx="7.5" cy="10" r="1.5"/>
                      </svg>
                      <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
                        <rect x="0" y="1" width="21" height="10" rx="3" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.35"/>
                        <rect x="1.5" y="2.5" width="16" height="7" rx="2" fill="currentColor" opacity="0.9"/>
                        <path d="M22 4.5v3c.8-.4 1.3-1 1.3-1.5S22.8 4.9 22 4.5Z" fill="currentColor" opacity="0.4"/>
                      </svg>
                    </div>
                  </div>

                  <div className="iphone-body">
                    <div className="iphone-greeting">{t('Good morning,', 'Buenos días,')}</div>
                    <div className="iphone-name">Alex 👋</div>

                    <div className="iphone-bal-card">
                      <div className="iphone-bal-label">{t('Total Balance', 'Balance Total')}</div>
                      <div className="iphone-bal-amount">$4,280.50</div>
                      <div className="iphone-bal-row">
                        <div className="iphone-bal-item income">
                          <span className="bal-icon">↑</span>
                          <div>
                            <div className="bal-sub">{t('Income', 'Ingreso')}</div>
                            <div className="bal-val">$3,200</div>
                          </div>
                        </div>
                        <div className="iphone-bal-item expense">
                          <span className="bal-icon">↓</span>
                          <div>
                            <div className="bal-sub">{t('Expenses', 'Gastos')}</div>
                            <div className="bal-val">$1,840</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="iphone-section-title">{t('Recent', 'Recientes')}</div>
                    <div className="iphone-txs">
                      {[
                        { icon: '🛒', name: t('Grocery', 'Mercado'), cat: t('Food', 'Comida'), amt: '-$48.20', neg: true },
                        { icon: '💼', name: t('Salary', 'Salario'), cat: t('Income', 'Ingreso'), amt: '+$3,200', neg: false },
                        { icon: '🚗', name: t('Gas', 'Gasolina'), cat: t('Transport', 'Transporte'), amt: '-$35.00', neg: true },
                      ].map((tx, i) => (
                        <div className="iphone-tx" key={i}>
                          <div className="iphone-tx-icon">{tx.icon}</div>
                          <div className="iphone-tx-info">
                            <div className="iphone-tx-name">{tx.name}</div>
                            <div className="iphone-tx-cat">{tx.cat}</div>
                          </div>
                          <div className={`iphone-tx-amt${tx.neg ? ' neg' : ' pos'}`}>{tx.amt}</div>
                        </div>
                      ))}
                    </div>

                    <div className="iphone-insight">
                      <div className="iphone-insight-header">
                        <span className="iphone-insight-dot" />
                        <span className="iphone-insight-label">{t('AI Insight', 'IA Financiera')}</span>
                      </div>
                      <div className="iphone-insight-text">
                        {t("You're 22% under budget this month 🎉", '¡Estás 22% bajo presupuesto! 🎉')}
                      </div>
                      <div className="iphone-insight-bar-track">
                        <div className="iphone-insight-bar-fill" style={{ width: '78%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Strip ── */}
        <div className="stats-strip">
          {[
            { num: '$2.4B+', label: t('Tracked', 'Rastreado') },
            { num: '12K+',   label: t('Active users', 'Usuarios activos') },
            { num: '94%',    label: t('Save more in 30 days', 'Ahorran más en 30 días') },
            { num: 'ES/EN',  label: t('Fully bilingual', 'Totalmente bilingüe') },
          ].map((s, i) => (
            <div className="stat" key={i}>
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Features ── */}
        <section className="section" id="features">
          <div className="section-inner">
            <div className="section-tag">{t('Features', 'Características')}</div>
            <h2 className="section-title">
              {lang === 'es'
                ? <>Todo lo que necesitas para <em>dominar tu dinero</em></>
                : <>Everything you need to <em>master your money</em></>
              }
            </h2>
            <p className="section-sub">
              {t(
                'WeUp gives you powerful tools to understand and control your financial life.',
                'WeUp te da herramientas poderosas para entender y controlar tu vida financiera.'
              )}
            </p>

            <div className="features-grid">
              {[
                { icon: '📊', title: t('Smart Budgets', 'Presupuestos Inteligentes'), desc: t('Set limits per category and get alerts before you overspend.', 'Fija límites por categoría y recibe alertas antes de gastar de más.') },
                { icon: '🤖', title: t('AI Auto-Categorize', 'Auto-Categorización IA'), desc: t('Transactions are categorized automatically using AI rules.', 'Las transacciones se categorizan automáticamente con reglas de IA.') },
                { icon: '📈', title: t('Visual Reports', 'Reportes Visuales'), desc: t('Bar, line, and donut charts reveal your spending patterns instantly.', 'Gráficos de barras, líneas y donut revelan tus patrones de gasto.') },
                { icon: '🌍', title: t('Multi-Currency', 'Multi-Moneda'), desc: t('Support for USD, MXN, and COP with localized formatting.', 'Soporte para USD, MXN y COP con formato localizado.') },
                { icon: '🔒', title: t('Bank-Grade Security', 'Seguridad Bancaria'), desc: t('Your data is encrypted and protected by Supabase row-level security.', 'Tus datos están cifrados y protegidos por seguridad a nivel de fila.') },
                { icon: '🌐', title: t('Fully Bilingual', 'Totalmente Bilingüe'), desc: t('Full English and Spanish support across every screen.', 'Soporte completo en inglés y español en cada pantalla.') },
              ].map((f, i) => (
                <div className="feat-card" key={i}>
                  <div className="feat-icon">{f.icon}</div>
                  <div className="feat-title">{f.title}</div>
                  <div className="feat-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section className="section section-dark" id="about">
          <div className="section-inner">
            <div className="about-grid">
              <div className="about-left">
                <div className="section-tag">{t('About us', 'Nosotros')}</div>
                <h2 className="section-title" style={{ textAlign: 'left' }}>
                  {lang === 'es'
                    ? <>Creemos que todos merecen <em>libertad financiera</em></>
                    : <>We believe everyone deserves <em>financial freedom</em></>
                  }
                </h2>
                <p className="section-sub" style={{ textAlign: 'left' }}>
                  {t(
                    'WeUp was born from the frustration of complicated finance apps. Simple, powerful tools for everyone — regardless of income.',
                    'WeUp nació de la frustración con apps financieras complicadas. Herramientas simples y poderosas para todos, sin importar el ingreso.'
                  )}
                </p>
                <div className="about-stats">
                  {[
                    { num: '2',      label: t('Countries', 'Países') },
                    { num: '12K+',   label: t('Users', 'Usuarios') },
                    { num: '$2.4B+', label: t('Tracked', 'Rastreado') },
                  ].map((s, i) => (
                    <div className="about-stat" key={i}>
                      <div className="about-stat-num">{s.num}</div>
                      <div className="about-stat-label">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="about-right">
                {[
                  {
                    quote: t(
                      '"WeUp completely changed how I think about money. The AI insights alone are worth every penny."',
                      '"WeUp cambió completamente cómo pienso en el dinero. Los insights de IA valen cada peso."'
                    ),
                    initials: 'MC',
                    name: 'María C.',
                    city: t('Bogotá, Colombia', 'Bogotá, Colombia'),
                  },
                  {
                    quote: t(
                      '"Finally an app that works in Spanish AND English. My whole family uses it now."',
                      '"Por fin una app que funciona en español Y inglés. Toda mi familia la usa ahora."'
                    ),
                    initials: 'JR',
                    name: 'Jorge R.',
                    city: t('Ciudad de México', 'Ciudad de México'),
                  },
                ].map((card, i) => (
                  <div className="about-card" key={i}>
                    <div className="about-diamond">◆</div>
                    <p className="about-quote">{card.quote}</p>
                    <div className="about-author">
                      <div className="about-avatar">{card.initials}</div>
                      <div>
                        <div className="about-name">{card.name}</div>
                        <div className="about-city">{card.city}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="section" id="pricing">
          <div className="section-inner pricing-inner">
            <div className="section-tag">{t('Pricing', 'Precios')}</div>
            <h2 className="pricing-title">
              {t('Simple, honest pricing', 'Precios simples y honestos')}
            </h2>
            <p className="pricing-sub">
              {t('Start free, upgrade when you\'re ready. No hidden fees, cancel anytime.', 'Empieza gratis, actualiza cuando estés listo. Sin costos ocultos, cancela cuando quieras.')}
            </p>

            <div className="pricing-toggle">
              <span className={`toggle-label${!yearly ? ' active' : ''}`}>{t('Monthly', 'Mensual')}</span>
              <button
                className={`toggle-switch${yearly ? ' on' : ''}`}
                onClick={() => setYearly(y => !y)}
                aria-label="Toggle billing period"
              >
                <span className="toggle-knob" />
              </button>
              <span className={`toggle-label${yearly ? ' active' : ''}`}>{t('Yearly', 'Anual')}</span>
              <span className={`pricing-badge-discount${yearly ? ' visible' : ''}`}>
                {t('Save 35%', 'Ahorra 35%')}
              </span>
            </div>

            <div className="pricing-grid">
              {/* Free */}
              <div className="pricing-card">
                <div className="pricing-plan-label">{t('FREE', 'GRATIS')}</div>
                <div className="pricing-price-row">
                  <span className="pricing-amount">$0</span>
                  <span className="pricing-period-inline">/{t('forever', 'siempre')}</span>
                </div>
                <div className="pricing-desc">{t('Perfect to get started', 'Perfecto para empezar')}</div>
                <ul className="pricing-features">
                  <li className="feat-on">{t('1 bank account', '1 cuenta bancaria')}</li>
                  <li className="feat-on">{t('Up to 30 transactions/month', 'Hasta 30 transacciones/mes')}</li>
                  <li className="feat-on">{t('Basic spending categories', 'Categorías básicas de gasto')}</li>
                  <li className="feat-on">{t('Monthly summary report', 'Reporte mensual')}</li>
                  <li className="feat-off">{t('AI insights', 'IA insights')}</li>
                  <li className="feat-off">{t('Bank sync', 'Sincronización bancaria')}</li>
                  <li className="feat-off">{t('Savings goals', 'Metas de ahorro')}</li>
                </ul>
                <button className="pricing-btn-dark" onClick={() => openModal('signup', 'free')}>
                  {t('Get started free', 'Empieza gratis')}
                </button>
              </div>

              {/* Pro */}
              <div className="pricing-card pricing-card-featured">
                <div className="pricing-popular-badge">{t('MOST POPULAR', 'MÁS POPULAR')}</div>
                <div className="pricing-plan-label">{t('PRO', 'PRO')}</div>
                <div className="pricing-price-row">
                  <span className="pricing-amount">${yearly ? '3.25' : '4.99'}</span>
                  <span className="pricing-period-inline">/{t('month', 'mes')}</span>
                </div>
                <div className="pricing-desc">{t('Everything you need to take control', 'Todo lo que necesitas para tomar control')}</div>
                <ul className="pricing-features">
                  <li className="feat-on">{t('Unlimited accounts', 'Cuentas ilimitadas')}</li>
                  <li className="feat-on">{t('Unlimited transactions', 'Transacciones ilimitadas')}</li>
                  <li className="feat-on">{t('AI-powered insights', 'IA insights avanzados')}</li>
                  <li className="feat-on">{t('Bank sync (CO & MX)', 'Banco sync (CO & MX)')}</li>
                  <li className="feat-on">{t('Savings goals & budgets', 'Metas y presupuestos')}</li>
                  <li className="feat-on">{t('Advanced visual reports', 'Reportes visuales avanzados')}</li>
                  <li className="feat-on">{t('Priority support', 'Soporte prioritario')}</li>
                </ul>
                <button className="pricing-btn-green" onClick={() => openModal('signup', 'pro')}>
                  {t('Start Pro free 14 days', 'Prueba Pro gratis 14 días')}
                </button>
              </div>

              {/* Family */}
              <div className="pricing-card">
                <div className="pricing-plan-label">{t('FAMILY', 'FAMILIA')}</div>
                <div className="pricing-price-row">
                  <span className="pricing-amount">${yearly ? '6.58' : '9.99'}</span>
                  <span className="pricing-period-inline">/{t('month', 'mes')}</span>
                </div>
                <div className="pricing-desc">{t('For the whole household', 'Para todo el hogar')}</div>
                <ul className="pricing-features">
                  <li className="feat-on">{t('Everything in Pro', 'Todo lo de Pro')}</li>
                  <li className="feat-on">{t('Up to 5 members', 'Hasta 5 miembros')}</li>
                  <li className="feat-on">{t('Shared household budget', 'Presupuesto familiar compartido')}</li>
                  <li className="feat-on">{t('Individual privacy per member', 'Privacidad individual por miembro')}</li>
                  <li className="feat-on">{t('Family financial reports', 'Reportes financieros familiares')}</li>
                  <li className="feat-on">{t('Dedicated support', 'Soporte dedicado')}</li>
                  <li className="feat-off">{t('Business features', 'Funciones empresariales')}</li>
                </ul>
                <button className="pricing-btn-dark" onClick={() => openModal('signup', 'family')}>
                  {t('Start free 14 days', 'Empieza gratis 14 días')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="footer">
          <a href="/" className="footer-logo">
            <img src="/Logo_WeUp.png" alt="WeUp" />
            WeUp
          </a>
          <p className="footer-tagline">
            {t('Your money, finally under control.', 'Tu dinero, finalmente bajo control.')}
          </p>
          <nav className="footer-nav">
            <a href="#features">{t('Features', 'Características')}</a>
            <a href="#pricing">{t('Pricing', 'Precios')}</a>
            <a href="#about">{t('About', 'Nosotros')}</a>
            <a href="/privacy">{t('Privacy', 'Privacidad')}</a>
            <a href="/terms">{t('Terms', 'Términos')}</a>
          </nav>
          <div className="footer-copy">
            © 2026 WeUp. {t('Made with ♥ for Latin America.', 'Hecho con ♥ para América Latina.')}
          </div>
        </footer>
      </div>

      {/* ── Auth Modal ── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" ref={modalRef} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close">✕</button>

            <div className="modal-logo">
              <img src="/Logo_WeUp.png" alt="WeUp" />
              WeUp
            </div>
            <p className="modal-sub">
              {authTab === 'signup'
                ? t('Create your free account', 'Crea tu cuenta gratis')
                : t('Welcome back!', '¡Bienvenido de nuevo!')}
            </p>

            <div className="auth-tabs">
              <button
                className={`auth-tab${authTab === 'signup' ? ' active' : ''}`}
                onClick={() => { setAuthTab('signup'); setAuthError(''); setAuthSuccess('') }}
              >
                {t('Sign Up', 'Registrarse')}
              </button>
              <button
                className={`auth-tab${authTab === 'signin' ? ' active' : ''}`}
                onClick={() => { setAuthTab('signin'); setAuthError(''); setAuthSuccess('') }}
              >
                {t('Sign In', 'Iniciar Sesión')}
              </button>
            </div>

            <div className="form-panel">
              {/* Google */}
              <button className="btn-social" onClick={handleGoogleAuth} disabled={authLoading}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                {t('Continue with Google', 'Continuar con Google')}
              </button>

              <div className="divider">{t('or', 'o')}</div>

              <form onSubmit={handleEmailAuth}>
                {authTab === 'signup' && (
                  <div className="form-group">
                    <label className="form-label">{t('Full Name', 'Nombre completo')}</label>
                    <input
                      type="text" className="form-input"
                      placeholder={t('Alex Johnson', 'Alex García')}
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{t('Email', 'Correo electrónico')}</label>
                  <input
                    type="email" className="form-input" required
                    placeholder="hello@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <div className="form-row">
                    <label className="form-label">{t('Password', 'Contraseña')}</label>
                    {authTab === 'signin' && (
                      <button type="button" className="form-forgot">
                        {t('Forgot?', '¿Olvidaste?')}
                      </button>
                    )}
                  </div>
                  <input
                    type="password" className="form-input" required
                    placeholder={authTab === 'signup' ? t('Min. 8 characters', 'Mín. 8 caracteres') : '••••••••'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  {authTab === 'signup' && password.length > 0 && (
                    <div className="pw-strength">
                      <div className="pw-bars">
                        {[0,1,2,3].map(i => (
                          <div
                            key={i}
                            className="pw-bar"
                            style={{
                              background: i < strength
                                ? ['#ef4444','#f97316','#eab308','#22c55e'][strength - 1]
                                : undefined,
                            }}
                          />
                        ))}
                      </div>
                      <span className="pw-label">{strengthLabels[strength - 1] ?? ''}</span>
                    </div>
                  )}
                </div>

                {authError && (
                  <div className="form-alert error">{authError}</div>
                )}
                {authSuccess && (
                  <div className="form-alert success">{authSuccess}</div>
                )}

                <button type="submit" className="btn-submit" disabled={authLoading}>
                  {authLoading
                    ? t('Please wait...', 'Por favor espera...')
                    : authTab === 'signup'
                      ? t('Create Account', 'Crear Cuenta')
                      : t('Sign In', 'Iniciar Sesión')}
                </button>
              </form>

              <div className="modal-footer">
                {authTab === 'signup'
                  ? t('Already have an account? ', '¿Ya tienes cuenta? ')
                  : t("Don't have an account? ", '¿No tienes cuenta? ')}
                <button
                  className="modal-switch-btn"
                  onClick={() => { setAuthTab(authTab === 'signup' ? 'signin' : 'signup'); setAuthError(''); setAuthSuccess('') }}
                >
                  {authTab === 'signup' ? t('Sign In', 'Inicia sesión') : t('Sign Up', 'Regístrate')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
