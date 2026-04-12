import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { sb, SUPA_URL, SUPA_KEY } from '../lib/supabase'
import '../styles/upgrade.css'

type Billing = 'monthly' | 'yearly'
type PlanType = 'free' | 'pro' | 'family'
type PageState = 'upgrade' | 'success' | 'pending' | 'failure'

const PRICES: Record<Billing, Record<'pro' | 'family', { label: string; period: string }>> = {
  monthly: {
    pro:    { label: '$4.99', period: '/month' },
    family: { label: '$9.99', period: '/month' },
  },
  yearly: {
    pro:    { label: '$3.25', period: '/month · billed $39/yr' },
    family: { label: '$6.58', period: '/month · billed $79/yr' },
  },
}

interface FaqItem {
  q: string
  a: string | React.ReactNode
}

export default function UpgradePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [billing, setBilling] = useState<Billing>('monthly')
  const [pageState, setPageState] = useState<PageState>('upgrade')
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null)
  const [featuredPlan, setFeaturedPlan] = useState<'pro' | 'family'>('pro')
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [loadingPlan, setLoadingPlan] = useState<'pro' | 'family' | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    // Handle MercadoPago return status
    const status = searchParams.get('status') || searchParams.get('collection_status')
    if (status === 'approved') { setPageState('success'); updateUserPlan(); return }
    if (status === 'pending' || status === 'in_process') { setPageState('pending'); return }
    if (status === 'rejected' || status === 'failure') { setPageState('failure'); return }

    // Pre-highlight plan from URL
    const urlPlan = searchParams.get('plan')
    if (urlPlan === 'family') setFeaturedPlan('family')

    // Load session
    sb.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate('/', { replace: true })
        return
      }
      const user = data.session.user
      setUserId(user.id)
      setUserEmail(user.email ?? '')
      const name = user.user_metadata?.full_name?.split(' ')[0] || (user.email ?? '').split('@')[0]
      setUserName(name)

      // Check if already on a paid plan
      const { data: profile } = await sb.from('profiles').select('plan').eq('id', user.id).single()
      if (profile?.plan) setCurrentPlan(profile.plan as PlanType)
    })
  }, [navigate, searchParams])

  async function updateUserPlan() {
    const plan = searchParams.get('plan') || 'pro'
    const { data } = await sb.auth.getSession()
    if (!data.session) return
    const user = data.session.user
    await sb.from('profiles').upsert({
      id: user.id,
      plan,
      plan_billing: billing,
      onboarding_completed: true,
      plan_activated_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'id' })

    // Notify owner of new plan purchase
    const webhookUrl = import.meta.env.VITE_NOTIFY_WEBHOOK
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'PLAN_PURCHASED',
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          plan,
          billing,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {})
    }
  }

  async function startCheckout(plan: 'pro' | 'family') {
    if (!userId) {
      sessionStorage.setItem('planIntent', plan)
      navigate(`/?plan=${plan}`)
      return
    }

    setLoadingPlan(plan)
    try {
      const res = await fetch(`${SUPA_URL}/functions/v1/dynamic-endpoint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPA_KEY}`,
          'apikey': SUPA_KEY,
        },
        body: JSON.stringify({ plan, billing, userId, userEmail, userName, origin: window.location.origin }),
      })

      const data = await res.json()

      if (data.url) {
        await sb.from('profiles').upsert({
          id: userId,
          plan_intent: plan,
          plan_billing: billing,
          onboarding_completed: true,
        }, { onConflict: 'id' })
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Could not create checkout')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout error'
      showToast('Could not start checkout: ' + msg)
      setLoadingPlan(null)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  const faqs: FaqItem[] = [
    { q: 'Can I cancel anytime?', a: 'Yes. Cancel anytime from Settings. You keep Pro access until end of your billing period. No cancellation fees, ever.' },
    { q: 'What payment methods are accepted?', a: 'PSE, Nequi, Daviplata, credit and debit cards (Visa, Mastercard, Amex) through MercadoPago — Colombia\'s most trusted payment platform.' },
    { q: 'Is my financial data safe?', a: <>All data is encrypted with AES-256. We never store card details — payments are handled by MercadoPago. Read our <Link to="/privacy" style={{ color: 'var(--light)' }}>Privacy Policy</Link>.</> },
    { q: 'Do you offer refunds?', a: <>7-day money-back guarantee for first-time subscribers. Contact <a href="mailto:legal@weup.app">legal@weup.app</a> within 7 days of payment.</> },
    { q: 'Can I switch between plans?', a: 'Yes. Upgrade, downgrade, or switch between monthly and yearly billing anytime from Settings.' },
  ]

  // ── State pages ────────────────────────────────────────────────────────────

  if (pageState === 'success') return (
    <div className="upgrade-root">
      <div className="upgrade-bg" />
      <UpgradeNav userName={userName} />
      <div className="state-page">
        <div className="state-circle success">🎉</div>
        <h1 className="state-title">Payment successful!</h1>
        <p className="state-sub">Welcome to WeUp Pro. Your account has been upgraded and all features are now active.</p>
        <button className="state-btn primary" onClick={() => navigate('/dashboard')}>Go to dashboard →</button>
      </div>
    </div>
  )

  if (pageState === 'pending') return (
    <div className="upgrade-root">
      <div className="upgrade-bg" />
      <UpgradeNav userName={userName} />
      <div className="state-page">
        <div className="state-circle pending">⏳</div>
        <h1 className="state-title">Payment pending</h1>
        <p className="state-sub">Your payment is being processed. We'll email you once confirmed. This usually takes a few minutes.</p>
        <button className="state-btn ghost" onClick={() => navigate('/dashboard')}>Back to dashboard</button>
      </div>
    </div>
  )

  if (pageState === 'failure') return (
    <div className="upgrade-root">
      <div className="upgrade-bg" />
      <UpgradeNav userName={userName} />
      <div className="state-page">
        <div className="state-circle error">❌</div>
        <h1 className="state-title">Payment failed</h1>
        <p className="state-sub">No charge was made. Please try again or contact us at <a href="mailto:legal@weup.app">legal@weup.app</a>.</p>
        <button className="state-btn primary" onClick={() => setPageState('upgrade')}>Try again</button>
      </div>
    </div>
  )

  // ── Main upgrade page ──────────────────────────────────────────────────────

  return (
    <div className="upgrade-root">
      <div className="upgrade-bg" />
      <UpgradeNav userName={userName} />

      <div className="upgrade-page">
        {/* Header */}
        <div className="upgrade-header">
          <div className="upgrade-badge">⭐ Upgrade WeUp</div>
          <h1 className="upgrade-title">Unlock your <em>full potential</em></h1>
          <p className="upgrade-sub">Get unlimited transactions, AI-powered insights, bank sync and everything you need to master your finances.</p>
        </div>

        {/* Billing toggle */}
        <div className="billing-toggle">
          <span className={`toggle-label${billing === 'monthly' ? ' active' : ''}`}>Monthly</span>
          <button
            className={`toggle-track${billing === 'yearly' ? ' yearly' : ''}`}
            onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
            aria-label="Toggle billing period"
          >
            <div className="toggle-knob" />
          </button>
          <span className={`toggle-label${billing === 'yearly' ? ' active' : ''}`}>Yearly</span>
          {billing === 'yearly' && <span className="save-badge">Save 35%</span>}
        </div>

        {/* Plans */}
        <div className="plans-grid">
          {/* Free */}
          <div className="plan-card">
            <div className="plan-name">Free</div>
            <div className="plan-price">$0</div>
            <div className="plan-period">/forever</div>
            <div className="plan-trial" style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>Perfect to get started</div>
            <div className="plan-divider" />
            <ul className="plan-features">
              <li>1 bank account</li>
              <li>Up to 30 transactions/month</li>
              <li>Basic spending categories</li>
              <li>Monthly summary report</li>
              <li className="off">AI insights</li>
              <li className="off">Bank sync</li>
              <li className="off">Savings goals</li>
            </ul>
            <button className="btn-upgrade ghost" disabled>
              Get started free
            </button>
          </div>

          {/* Pro */}
          <div className={`plan-card${featuredPlan === 'pro' ? ' featured' : ''}`}>
            {featuredPlan === 'pro' && <div className="plan-badge">Most popular</div>}
            <div className="plan-name">Pro</div>
            <div className="plan-price">{PRICES[billing].pro.label}</div>
            <div className="plan-period">{PRICES[billing].pro.period}</div>
            <div className="plan-trial">Everything you need to take control</div>
            <div className="plan-divider" />
            <ul className="plan-features">
              <li>Unlimited accounts</li>
              <li>Unlimited transactions</li>
              <li>AI-powered insights</li>
              <li>Bank sync (CO & MX)</li>
              <li>Savings goals & budgets</li>
              <li>Advanced visual reports</li>
              <li>Priority support</li>
            </ul>
            {currentPlan === 'pro' ? (
              <button className="btn-upgrade current" disabled>Current plan</button>
            ) : (
              <button
                className="btn-upgrade primary"
                onClick={() => startCheckout('pro')}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === 'pro' ? 'Setting up…' : 'Start Pro free 14 days'}
              </button>
            )}
          </div>

          {/* Family */}
          <div className={`plan-card${featuredPlan === 'family' ? ' featured' : ''}`}>
            {featuredPlan === 'family' && <div className="plan-badge">Most popular</div>}
            <div className="plan-name">Family</div>
            <div className="plan-price">{PRICES[billing].family.label}</div>
            <div className="plan-period">{PRICES[billing].family.period}</div>
            <div className="plan-trial">For the whole household</div>
            <div className="plan-divider" />
            <ul className="plan-features">
              <li>Everything in Pro</li>
              <li>Up to 5 members</li>
              <li>Shared household budget</li>
              <li>Individual privacy per member</li>
              <li>Family financial reports</li>
              <li>Dedicated support</li>
              <li>Early access to new features</li>
            </ul>
            {currentPlan === 'family' ? (
              <button className="btn-upgrade current" disabled>Current plan</button>
            ) : (
              <button
                className="btn-upgrade ghost"
                onClick={() => startCheckout('family')}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === 'family' ? 'Setting up…' : 'Start free 14 days'}
              </button>
            )}
          </div>
        </div>

        {/* Trust row */}
        <div className="trust-row">
          {[
            { icon: '🔒', text: 'Secure payments with MercadoPago' },
            { icon: '🚫', text: 'Cancel anytime, no penalties' },
            { icon: '💳', text: 'PSE, Nequi, Daviplata, cards' },
            { icon: '🔄', text: '7-day money-back guarantee' },
          ].map((item, i) => (
            <div className="trust-item" key={i}>
              <span className="trust-item-icon">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <h2 className="faq-title">Frequently asked questions</h2>
        <div className="faq-list">
          {faqs.map((faq, i) => (
            <div className={`faq-item${openFaq === i ? ' open' : ''}`} key={i}>
              <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{faq.q}</span>
                <span className="faq-chevron">▼</span>
              </button>
              {openFaq === i && <div className="faq-a">{faq.a}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#0D2B1E', border: '0.5px solid rgba(95,220,154,0.3)',
          color: '#fff', padding: '12px 24px', borderRadius: 12,
          fontSize: 14, zIndex: 999, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function UpgradeNav({ userName }: { userName: string }) {
  return (
    <nav className="upgrade-nav">
      <Link to="/dashboard" className="upgrade-nav-logo">
        <img src="/Logo_WeUp.png" alt="WeUp" />
        <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700 }}>WeUp</span>
      </Link>
      {userName && <span className="upgrade-nav-user">{userName}</span>}
      <Link to="/dashboard" className="upgrade-nav-back">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M13 8H3M7 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Dashboard
      </Link>
    </nav>
  )
}
