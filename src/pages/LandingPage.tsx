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
            <button className="nav-cta" onClick={() => openModal('signup')}>
              {t('Get Started', 'Comenzar')}
            </button>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="pulse" />
              {t('Smart Personal Finance', 'Finanzas Personales Inteligentes')}
            </div>

            <h1 className="hero-headline">
              {lang === 'es'
                ? <><em>Controla</em><br />tu dinero, de verdad.</>
                : <>Your money,<br /><em>finally</em> under control.</>
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
                🚀 {t('Start Free', 'Empezar Gratis')}
              </button>
              <button className="btn-ghost" onClick={() => openModal('signin')}>
                {t('Sign in', 'Iniciar sesión')}
              </button>
            </div>

            <div className="hero-social">
              <div className="hero-social-avatars">
                <span>😊</span><span>🌟</span><span>💪</span><span>🎯</span>
              </div>
              <p className="hero-social-text">
                <strong>{t('4,200+', '4,200+')}</strong>{' '}
                {t('people already managing their finances', 'personas ya gestionando sus finanzas')}
              </p>
            </div>
          </div>

          <div className="hero-right">
            <div className="phone-frame">
              <div className="phone-screen">
                <div className="phone-notch" />
                <div className="phone-status">
                  <span>9:41</span>
                  <span>●●●</span>
                </div>
                <div className="phone-body">
                  <div className="phone-greeting">{t('Good morning,', 'Buenos días,')}</div>
                  <div className="phone-name">Alex 👋</div>

                  <div className="phone-bal-card">
                    <div className="phone-bal-label">{t('Total Balance', 'Balance Total')}</div>
                    <div className="phone-bal-amount">$4,280.50</div>
                    <div className="phone-bal-row">
                      <div className="phone-bal-item">
                        <span>↑</span>
                        <span>$3,200</span>
                      </div>
                      <div className="phone-bal-item">
                        <span>↓</span>
                        <span>$1,840</span>
                      </div>
                    </div>
                  </div>

                  <div className="phone-section-title">{t('Recent', 'Recientes')}</div>
                  <div className="phone-txs">
                    {[
                      { icon: '🛒', name: t('Grocery', 'Mercado'), cat: t('Food', 'Comida'), amt: '-$48.20', cls: 'neg' },
                      { icon: '💼', name: t('Salary', 'Salario'), cat: t('Income', 'Ingreso'), amt: '+$3,200', cls: 'pos' },
                      { icon: '🚗', name: t('Gas', 'Gasolina'), cat: t('Transport', 'Transporte'), amt: '-$35.00', cls: 'neg' },
                    ].map((tx, i) => (
                      <div className="phone-tx" key={i}>
                        <div className="phone-tx-icon">{tx.icon}</div>
                        <div className="phone-tx-info">
                          <div className="phone-tx-name">{tx.name}</div>
                          <div className="phone-tx-cat">{tx.cat}</div>
                        </div>
                        <div className={`phone-tx-amt ${tx.cls}`}>{tx.amt}</div>
                      </div>
                    ))}
                  </div>

                  <div className="phone-insight">
                    <div className="phone-insight-header">
                      <div className="phone-insight-dot" />
                      <span className="phone-insight-label">{t('Budget AI', 'IA Presupuesto')}</span>
                    </div>
                    <div className="phone-insight-text">
                      {t("You're 22% under budget this month 🎉", '¡Estás 22% bajo presupuesto este mes! 🎉')}
                    </div>
                    <div className="phone-insight-bar-track">
                      <div className="phone-insight-bar-fill" style={{ width: '78%' }} />
                    </div>
                    <div className="phone-insight-footer">
                      <span className="phone-insight-pct">78%</span>
                      <span className="phone-insight-goal">{t('of budget used', 'del presupuesto usado')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <div className="stats-strip">
          {[
            { num: '4,200+', label: t('Active Users', 'Usuarios Activos') },
            { num: '$2.4M',  label: t('Tracked Monthly', 'Rastreado al Mes') },
            { num: '98%',    label: t('Satisfaction Rate', 'Satisfacción') },
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
                ? <>Todo lo que necesitas para <em>prosperar</em></>
                : <>Everything you need to <em>thrive</em></>
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
                { icon: '🤖', title: t('Auto-Categorize', 'Auto-Categorización'), desc: t('Transactions are categorized automatically using AI rules.', 'Las transacciones se categorizan automáticamente con reglas de IA.') },
                { icon: '📈', title: t('Visual Reports', 'Reportes Visuales'), desc: t('Bar, line, and donut charts reveal your spending patterns instantly.', 'Gráficos de barras, líneas y donut revelan tus patrones de gasto.') },
                { icon: '🌍', title: t('Multi-Currency', 'Multi-Moneda'), desc: t('Support for USD, MXN, and COP with localized formatting.', 'Soporte para USD, MXN y COP con formato localizado.') },
                { icon: '🔒', title: t('Bank-Grade Security', 'Seguridad Bancaria'), desc: t('Your data is encrypted and protected by Supabase row-level security.', 'Tus datos están cifrados y protegidos por seguridad a nivel de fila.') },
                { icon: '🌐', title: t('Bilingual', 'Bilingüe'), desc: t('Full English and Spanish support across every screen.', 'Soporte completo en inglés y español en cada pantalla.') },
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
                <div className="section-tag">{t('About', 'Nosotros')}</div>
                <h2 className="section-title">
                  {lang === 'es'
                    ? <>Hecho para gente <em>real</em></>
                    : <>Built for <em>real</em> people</>
                  }
                </h2>
                <p className="section-sub" style={{ textAlign: 'left' }}>
                  {t(
                    'WeUp was born from the frustration of complicated finance apps. We believe everyone deserves simple, powerful tools — regardless of income.',
                    'WeUp nació de la frustración con apps financieras complicadas. Creemos que todos merecen herramientas simples y poderosas, sin importar el ingreso.'
                  )}
                </p>
                <div className="about-stats">
                  {[
                    { num: '4,200+', label: t('Happy users', 'Usuarios felices') },
                    { num: '3',      label: t('Countries', 'Países') },
                    { num: '2024',   label: t('Founded', 'Fundado') },
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
                      '"WeUp completely changed how I think about money. The auto-categorization alone saves me hours each month."',
                      '"WeUp cambió completamente cómo pienso en el dinero. La auto-categorización sola me ahorra horas al mes."'
                    ),
                    emoji: '👩',
                    name: t('María G.', 'María G.'),
                    city: t('Mexico City', 'Ciudad de México'),
                  },
                  {
                    quote: t(
                      '"Finally an app that works in Spanish AND English. My whole family uses it now."',
                      '"Por fin una app que funciona en español Y inglés. Toda mi familia la usa ahora."'
                    ),
                    emoji: '👨',
                    name: t('Carlos R.', 'Carlos R.'),
                    city: t('Bogotá', 'Bogotá'),
                  },
                ].map((card, i) => (
                  <div className="about-card" key={i}>
                    <p className="about-quote">{card.quote}</p>
                    <div className="about-author">
                      <div className="about-avatar">{card.emoji}</div>
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
          <div className="section-inner">
            <div className="section-tag">{t('Pricing', 'Precios')}</div>
            <h2 className="section-title">
              {lang === 'es'
                ? <>Precios simples y <em>transparentes</em></>
                : <>Simple, <em>transparent</em> pricing</>
              }
            </h2>
            <p className="section-sub">
              {t('Start free forever. Upgrade when you need more power.', 'Empieza gratis para siempre. Actualiza cuando necesites más.')}
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
              {yearly && (
                <span className="pricing-badge-discount">
                  {t('Save 35%', 'Ahorra 35%')}
                </span>
              )}
            </div>

            <div className="pricing-grid">
              {/* Free */}
              <div className="pricing-card">
                <div className="pricing-badge">{t('Free', 'Gratis')}</div>
                <div className="pricing-plan">{t('Starter', 'Básico')}</div>
                <div className="pricing-price">
                  <sup>$</sup>0
                </div>
                <div className="pricing-period">{t('Forever free', 'Gratis para siempre')}</div>
                <div className="pricing-desc">
                  {t('Perfect for getting started with personal finance tracking.', 'Perfecto para comenzar con el seguimiento de finanzas.')}
                </div>
                <ul className="pricing-features">
                  <li>{t('Up to 50 transactions/month', 'Hasta 50 transacciones/mes')}</li>
                  <li>{t('Basic budgets', 'Presupuestos básicos')}</li>
                  <li>{t('3 categories', '3 categorías')}</li>
                  <li>{t('EN/ES language support', 'Soporte EN/ES')}</li>
                </ul>
                <button className="pricing-cta-ghost" onClick={() => openModal('signup', 'free')}>
                  {t('Get Started Free', 'Comenzar Gratis')}
                </button>
              </div>

              {/* Pro */}
              <div className="pricing-card pricing-card-featured">
                <div className="pricing-badge">{t('Most Popular', 'Más Popular')}</div>
                <div className="pricing-plan">Pro</div>
                <div className="pricing-price">
                  <sup>$</sup>{yearly ? '3.24' : '4.99'}
                </div>
                <div className="pricing-period">{t('per month', 'por mes')}{yearly ? t(', billed yearly', ', facturado anualmente') : ''}</div>
                <div className="pricing-desc">
                  {t('Full power for serious finance management.', 'Toda la potencia para una gestión financiera seria.')}
                </div>
                <ul className="pricing-features">
                  <li>{t('Unlimited transactions', 'Transacciones ilimitadas')}</li>
                  <li>{t('All budget categories', 'Todas las categorías de presupuesto')}</li>
                  <li>{t('Visual reports & charts', 'Reportes y gráficos visuales')}</li>
                  <li>{t('Auto-categorization AI', 'IA de auto-categorización')}</li>
                  <li>{t('14-day free trial', 'Prueba gratis 14 días')}</li>
                </ul>
                <button className="pricing-cta" onClick={() => openModal('signup', 'pro')}>
                  🚀 {t('Start Free Trial', 'Iniciar Prueba Gratis')}
                </button>
              </div>

              {/* Family */}
              <div className="pricing-card">
                <div className="pricing-badge">{t('Family', 'Familia')}</div>
                <div className="pricing-plan">{t('Family', 'Familia')}</div>
                <div className="pricing-price">
                  <sup>$</sup>{yearly ? '6.49' : '9.99'}
                </div>
                <div className="pricing-period">{t('per month', 'por mes')}{yearly ? t(', billed yearly', ', facturado anualmente') : ''}</div>
                <div className="pricing-desc">
                  {t('Shared finances for up to 5 family members.', 'Finanzas compartidas para hasta 5 miembros de la familia.')}
                </div>
                <ul className="pricing-features">
                  <li>{t('Everything in Pro', 'Todo lo de Pro')}</li>
                  <li>{t('Up to 5 members', 'Hasta 5 miembros')}</li>
                  <li>{t('Shared budgets & goals', 'Presupuestos y metas compartidas')}</li>
                  <li>{t('Family spending insights', 'Reportes de gasto familiar')}</li>
                </ul>
                <button className="pricing-cta-ghost" onClick={() => openModal('signup', 'family')}>
                  {t('Get Family Plan', 'Obtener Plan Familiar')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer>
          <div className="footer-inner">
            <div>
              <a href="/" className="footer-logo">
                <img src="/Logo_WeUp.png" alt="WeUp" />
                WeUp
              </a>
              <p className="footer-tagline">
                {t('Your money, finally under control.', 'Tu dinero, finalmente bajo control.')}
              </p>
            </div>

            <div className="footer-links">
              <div className="footer-links-col">
                <h5>{t('Product', 'Producto')}</h5>
                <a href="#features">{t('Features', 'Características')}</a>
                <a href="#pricing">{t('Pricing', 'Precios')}</a>
              </div>
              <div className="footer-links-col">
                <h5>{t('Company', 'Empresa')}</h5>
                <a href="#about">{t('About', 'Nosotros')}</a>
              </div>
              <div className="footer-links-col">
                <h5>{t('Account', 'Cuenta')}</h5>
                <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  className="footer-links-col a" onClick={() => openModal('signup')}>
                  {t('Sign Up', 'Registrarse')}
                </button>
                <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  className="footer-links-col a" onClick={() => openModal('signin')}>
                  {t('Sign In', 'Iniciar Sesión')}
                </button>
              </div>
            </div>
          </div>
          <div className="footer-copy">
            © 2024 WeUp. {t('All rights reserved.', 'Todos los derechos reservados.')}
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
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, padding: 0 }}
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
