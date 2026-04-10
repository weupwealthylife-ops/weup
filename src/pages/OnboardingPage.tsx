import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { sb } from '../lib/supabase'
import '../styles/onboarding.css'

// ── Types ─────────────────────────────────────────────────────────────────────

type Lang = 'en' | 'es'
type Currency = 'COP' | 'MXN' | 'USD'
type Plan = 'free' | 'pro'

interface IncomeRange {
  value: string
  label: string
  sublabel: string
  icon: string
  currency: Currency
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const t = (en: string, es: string, lang: Lang): string => (lang === 'es' ? es : en)

function getInitials(fullName: string | undefined | null): string {
  if (!fullName) return '?'
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function getFirstName(fullName: string | undefined | null): string {
  if (!fullName) return ''
  return fullName.trim().split(/\s+/)[0] ?? ''
}

// ── Data ──────────────────────────────────────────────────────────────────────

const INCOME_RANGES: Record<Currency, IncomeRange[]> = {
  COP: [
    { value: 'under_1m',   label: 'Under $1M',    sublabel: '< $1,000,000 COP',        icon: '🌱', currency: 'COP' },
    { value: '1m_3m',      label: '$1M – $3M',    sublabel: '$1M – $3,000,000 COP',    icon: '🌿', currency: 'COP' },
    { value: '3m_6m',      label: '$3M – $6M',    sublabel: '$3M – $6,000,000 COP',    icon: '🌳', currency: 'COP' },
    { value: '6m_15m',     label: '$6M – $15M',   sublabel: '$6M – $15,000,000 COP',   icon: '💼', currency: 'COP' },
    { value: 'over_15m',   label: 'Over $15M',    sublabel: '> $15,000,000 COP',        icon: '🚀', currency: 'COP' },
  ],
  MXN: [
    { value: 'under_5k',   label: 'Under $5K',    sublabel: '< $5,000 MXN',            icon: '🌱', currency: 'MXN' },
    { value: '5k_15k',     label: '$5K – $15K',   sublabel: '$5,000 – $15,000 MXN',    icon: '🌿', currency: 'MXN' },
    { value: '15k_30k',    label: '$15K – $30K',  sublabel: '$15,000 – $30,000 MXN',   icon: '🌳', currency: 'MXN' },
    { value: '30k_80k',    label: '$30K – $80K',  sublabel: '$30,000 – $80,000 MXN',   icon: '💼', currency: 'MXN' },
    { value: 'over_80k',   label: 'Over $80K',    sublabel: '> $80,000 MXN',            icon: '🚀', currency: 'MXN' },
  ],
  USD: [
    { value: 'under_500',  label: 'Under $500',   sublabel: '< $500 USD',              icon: '🌱', currency: 'USD' },
    { value: '500_2k',     label: '$500 – $2K',   sublabel: '$500 – $2,000 USD',       icon: '🌿', currency: 'USD' },
    { value: '2k_5k',      label: '$2K – $5K',    sublabel: '$2,000 – $5,000 USD',     icon: '🌳', currency: 'USD' },
    { value: '5k_15k',     label: '$5K – $15K',   sublabel: '$5,000 – $15,000 USD',    icon: '💼', currency: 'USD' },
    { value: 'over_15k',   label: 'Over $15K',    sublabel: '> $15,000 USD',            icon: '🚀', currency: 'USD' },
  ],
}

interface Goal {
  id: string
  icon: string
  label_en: string
  label_es: string
  desc_en: string
  desc_es: string
}

const GOALS: Goal[] = [
  { id: 'save',     icon: '🏦', label_en: 'Save',     label_es: 'Ahorrar',   desc_en: 'Build an emergency fund',         desc_es: 'Fondo de emergencia' },
  { id: 'debt',     icon: '💳', label_en: 'Pay Debt',  label_es: 'Pagar deudas', desc_en: 'Eliminate debts faster',      desc_es: 'Eliminar deudas' },
  { id: 'track',    icon: '📊', label_en: 'Track',     label_es: 'Registrar', desc_en: 'Know where money goes',          desc_es: 'Controla tus gastos' },
  { id: 'purchase', icon: '🛍️', label_en: 'Purchase',  label_es: 'Comprar',   desc_en: 'Save for a big purchase',        desc_es: 'Ahorra para algo grande' },
  { id: 'invest',   icon: '📈', label_en: 'Invest',    label_es: 'Invertir',  desc_en: 'Grow your wealth',               desc_es: 'Haz crecer tu dinero' },
  { id: 'budget',   icon: '🎯', label_en: 'Budget',    label_es: 'Presupuesto', desc_en: 'Live within your means',       desc_es: 'Vive dentro de tu presupuesto' },
]

interface Category {
  id: string
  icon: string
  label_en: string
  label_es: string
}

const CATEGORIES: Category[] = [
  { id: 'food',          icon: '🍔', label_en: 'Food',          label_es: 'Comida' },
  { id: 'transport',     icon: '🚌', label_en: 'Transport',     label_es: 'Transporte' },
  { id: 'housing',       icon: '🏠', label_en: 'Housing',       label_es: 'Vivienda' },
  { id: 'entertainment', icon: '🎬', label_en: 'Entertainment', label_es: 'Entretenimiento' },
  { id: 'health',        icon: '💊', label_en: 'Health',        label_es: 'Salud' },
  { id: 'education',     icon: '📚', label_en: 'Education',     label_es: 'Educación' },
  { id: 'shopping',      icon: '🛒', label_en: 'Shopping',      label_es: 'Compras' },
  { id: 'travel',        icon: '✈️', label_en: 'Travel',        label_es: 'Viajes' },
  { id: 'savings',       icon: '💰', label_en: 'Savings',       label_es: 'Ahorros' },
  { id: 'other',         icon: '📌', label_en: 'Other',         label_es: 'Otros' },
]

const DEFAULT_CATS = ['food', 'transport', 'housing', 'entertainment']

// ── Sub-components ────────────────────────────────────────────────────────────

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Auth Gate Screen ──────────────────────────────────────────────────────────

function AuthGateScreen({ noSession }: { noSession: boolean }) {
  return (
    <div className="auth-gate">
      {!noSession ? (
        <>
          <div className="gate-logo-wrap">
            <img src="/Logo_WeUp.png" alt="WeUp" className="gate-logo-img" />
            <span className="gate-wordmark">WeUp</span>
          </div>
          <p className="gate-label">Setting things up…</p>
        </>
      ) : (
        <div className="gate-no-session">
          <p>Please sign in to access onboarding.</p>
          <a href="/">Sign in to WeUp</a>
        </div>
      )}
    </div>
  )
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────

interface WelcomeStepProps {
  lang: Lang
  user: User | null
  onNext: () => void
}

function WelcomeStep({ lang, user, onNext }: WelcomeStepProps) {
  const fullName = user?.user_metadata?.full_name as string | undefined
  const firstName = getFirstName(fullName) || t('there', 'ahí', lang)
  const initials = getInitials(fullName)

  return (
    <div className="step-inner">
      <div className="welcome-content">
        <div className="welcome-avatar" aria-label={t('Your avatar', 'Tu avatar', lang)}>
          {initials}
        </div>
        <span className="step-emoji" role="img" aria-label="wave">👋</span>
        <h1 className="step-title">
          {t(`Welcome, ${firstName}!`, `¡Bienvenido, ${firstName}!`, lang)}
        </h1>
        <p className="step-sub">
          {t(
            "Let's set up your finances in a few quick steps.",
            'Configuremos tus finanzas en unos pocos pasos.',
            lang,
          )}
        </p>

        <div className="welcome-features">
          <div className="welcome-feat">
            <div className="welcome-feat-icon" aria-hidden="true">📊</div>
            <div className="welcome-feat-label">
              {t('Track your spending', 'Rastrea tus gastos', lang)}
              <span>{t('See exactly where your money goes', 'Mira exactamente a dónde va tu dinero', lang)}</span>
            </div>
          </div>
          <div className="welcome-feat">
            <div className="welcome-feat-icon" aria-hidden="true">🎯</div>
            <div className="welcome-feat-label">
              {t('Set smart goals', 'Establece metas inteligentes', lang)}
              <span>{t('Save for what matters most', 'Ahorra para lo que más importa', lang)}</span>
            </div>
          </div>
          <div className="welcome-feat">
            <div className="welcome-feat-icon" aria-hidden="true">💡</div>
            <div className="welcome-feat-label">
              {t('Get actionable insights', 'Obtén información útil', lang)}
              <span>{t('AI-powered recommendations', 'Recomendaciones impulsadas por IA', lang)}</span>
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={onNext} type="button">
          {t('Set up my finances', 'Configurar mis finanzas', lang)} <ArrowRight />
        </button>
      </div>
    </div>
  )
}

// ── Step 2: Income ────────────────────────────────────────────────────────────

interface IncomeStepProps {
  lang: Lang
  selectedCurrency: Currency
  selectedIncome: IncomeRange | null
  onCurrencyChange: (c: Currency) => void
  onIncomeSelect: (r: IncomeRange) => void
  onNext: () => void
  onBack: () => void
}

function IncomeStep({
  lang,
  selectedCurrency,
  selectedIncome,
  onCurrencyChange,
  onIncomeSelect,
  onNext,
  onBack,
}: IncomeStepProps) {
  const ranges = INCOME_RANGES[selectedCurrency]

  return (
    <div className="step-inner">
      <span className="step-emoji" role="img" aria-label="money">💸</span>
      <h1 className="step-title">{t("What's your income?", '¿Cuál es tu ingreso?', lang)}</h1>
      <p className="step-sub">
        {t('Select your monthly income range.', 'Selecciona tu rango de ingreso mensual.', lang)}
      </p>

      <div className="currency-row" role="group" aria-label={t('Currency', 'Moneda', lang)}>
        {(['COP', 'MXN', 'USD'] as Currency[]).map((c) => (
          <button
            key={c}
            type="button"
            className={`currency-btn${selectedCurrency === c ? ' active' : ''}`}
            onClick={() => onCurrencyChange(c)}
            aria-pressed={selectedCurrency === c}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="range-chips" role="radiogroup" aria-label={t('Income range', 'Rango de ingreso', lang)}>
        {ranges.map((r) => {
          const isSelected = selectedIncome?.value === r.value && selectedIncome?.currency === r.currency
          return (
            <div
              key={r.value}
              className={`range-chip${isSelected ? ' selected' : ''}`}
              onClick={() => onIncomeSelect(r)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? onIncomeSelect(r) : undefined}
            >
              <div className="range-chip-left">
                <div className="range-chip-icon" aria-hidden="true">{r.icon}</div>
                <div>
                  <div className="range-chip-label">{r.label}</div>
                  <div className="range-chip-sub">{r.sublabel}</div>
                </div>
              </div>
              <div className="range-chip-check" aria-hidden="true">
                {isSelected && <CheckIcon />}
              </div>
            </div>
          )
        })}
      </div>

      <button
        className="btn-primary"
        onClick={onNext}
        disabled={!selectedIncome}
        type="button"
      >
        {t('Continue', 'Continuar', lang)} <ArrowRight />
      </button>
      <button className="btn-back" onClick={onBack} type="button">
        <ArrowLeft /> {t('Back', 'Atrás', lang)}
      </button>
    </div>
  )
}

// ── Step 3: Goals ─────────────────────────────────────────────────────────────

interface GoalsStepProps {
  lang: Lang
  selectedGoal: string | null
  onGoalSelect: (id: string) => void
  onNext: () => void
  onBack: () => void
}

function GoalsStep({ lang, selectedGoal, onGoalSelect, onNext, onBack }: GoalsStepProps) {
  return (
    <div className="step-inner">
      <span className="step-emoji" role="img" aria-label="target">🎯</span>
      <h1 className="step-title">{t('What is your main goal?', '¿Cuál es tu meta principal?', lang)}</h1>
      <p className="step-sub">
        {t("We'll personalize WeUp based on your goal.", 'Personalizaremos WeUp según tu meta.', lang)}
      </p>

      <div className="goal-grid" role="radiogroup" aria-label={t('Financial goal', 'Meta financiera', lang)}>
        {GOALS.map((g) => {
          const isSelected = selectedGoal === g.id
          return (
            <div
              key={g.id}
              className={`goal-card${isSelected ? ' selected' : ''}`}
              onClick={() => onGoalSelect(g.id)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? onGoalSelect(g.id) : undefined}
            >
              <div className="goal-icon" aria-hidden="true">{g.icon}</div>
              <div className="goal-label">{lang === 'es' ? g.label_es : g.label_en}</div>
              <div className="goal-desc">{lang === 'es' ? g.desc_es : g.desc_en}</div>
            </div>
          )
        })}
      </div>

      <button
        className="btn-primary"
        onClick={onNext}
        disabled={!selectedGoal}
        type="button"
      >
        {t('Continue', 'Continuar', lang)} <ArrowRight />
      </button>
      <button className="btn-back" onClick={onBack} type="button">
        <ArrowLeft /> {t('Back', 'Atrás', lang)}
      </button>
    </div>
  )
}

// ── Step 4: Categories ────────────────────────────────────────────────────────

interface CategoriesStepProps {
  lang: Lang
  selectedCats: string[]
  onToggleCat: (id: string) => void
  onNext: () => void
  onBack: () => void
}

function CategoriesStep({ lang, selectedCats, onToggleCat, onNext, onBack }: CategoriesStepProps) {
  return (
    <div className="step-inner">
      <span className="step-emoji" role="img" aria-label="categories">📂</span>
      <h1 className="step-title">{t('Choose your categories', 'Elige tus categorías', lang)}</h1>
      <p className="step-sub">
        {t(
          'Select the spending categories that apply to you.',
          'Selecciona las categorías de gasto que te aplican.',
          lang,
        )}
      </p>

      <div className="cat-chips" role="group" aria-label={t('Spending categories', 'Categorías de gasto', lang)}>
        {CATEGORIES.map((c) => {
          const isSelected = selectedCats.includes(c.id)
          return (
            <button
              key={c.id}
              type="button"
              className={`cat-chip${isSelected ? ' selected' : ''}`}
              onClick={() => onToggleCat(c.id)}
              aria-pressed={isSelected}
            >
              <span className="cat-chip-icon" aria-hidden="true">{c.icon}</span>
              {lang === 'es' ? c.label_es : c.label_en}
            </button>
          )
        })}
      </div>

      <button
        className="btn-primary"
        onClick={onNext}
        disabled={selectedCats.length === 0}
        type="button"
      >
        {t('Continue', 'Continuar', lang)} <ArrowRight />
      </button>
      <button className="btn-back" onClick={onBack} type="button">
        <ArrowLeft /> {t('Back', 'Atrás', lang)}
      </button>
    </div>
  )
}

// ── Step 5: Plan ──────────────────────────────────────────────────────────────

interface PlanStepProps {
  lang: Lang
  selectedPlan: Plan
  onPlanSelect: (p: Plan) => void
  onNext: () => void
  onBack: () => void
}

function PlanStep({ lang, selectedPlan, onPlanSelect, onNext, onBack }: PlanStepProps) {
  return (
    <div className="step-inner">
      <span className="step-emoji" role="img" aria-label="sparkles">✨</span>
      <h1 className="step-title">{t('Choose your plan', 'Elige tu plan', lang)}</h1>
      <p className="step-sub">
        {t('Start free or unlock everything with Pro.', 'Empieza gratis o desbloquea todo con Pro.', lang)}
      </p>

      <div className="plan-grid" role="radiogroup" aria-label={t('Subscription plan', 'Plan de suscripción', lang)}>
        {/* Free plan */}
        <div
          className={`plan-card${selectedPlan === 'free' ? ' selected' : ''}`}
          onClick={() => onPlanSelect('free')}
          role="radio"
          aria-checked={selectedPlan === 'free'}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? onPlanSelect('free') : undefined}
        >
          <div className="plan-name">{t('Free', 'Gratis', lang)}</div>
          <div className="plan-price">$0</div>
          <div className="plan-period">{t('Forever free', 'Gratis para siempre', lang)}</div>
          <ul className="plan-features">
            <li>{t('Expense tracking', 'Rastreo de gastos', lang)}</li>
            <li>{t('5 categories', '5 categorías', lang)}</li>
            <li>{t('Monthly summary', 'Resumen mensual', lang)}</li>
            <li>{t('Basic charts', 'Gráficas básicas', lang)}</li>
          </ul>
        </div>

        {/* Pro plan */}
        <div
          className={`plan-card featured${selectedPlan === 'pro' ? ' selected' : ''}`}
          onClick={() => onPlanSelect('pro')}
          role="radio"
          aria-checked={selectedPlan === 'pro'}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? onPlanSelect('pro') : undefined}
        >
          <div className="plan-badge">{t('POPULAR', 'POPULAR', lang)}</div>
          <div className="plan-name">Pro</div>
          <div className="plan-price">$4.99</div>
          <div className="plan-period">{t('/ month', '/ mes', lang)}</div>
          <div className="plan-trial">{t('14-day free trial', 'Prueba gratis 14 días', lang)}</div>
          <ul className="plan-features">
            <li>{t('Everything in Free', 'Todo lo de Gratis', lang)}</li>
            <li>{t('Unlimited categories', 'Categorías ilimitadas', lang)}</li>
            <li>{t('AI insights', 'Análisis con IA', lang)}</li>
            <li>{t('Budget goals', 'Metas de presupuesto', lang)}</li>
            <li>{t('Export data', 'Exportar datos', lang)}</li>
          </ul>
        </div>
      </div>

      <button className="btn-primary" onClick={onNext} type="button">
        {t('Continue', 'Continuar', lang)} <ArrowRight />
      </button>
      <button className="btn-back" onClick={onBack} type="button">
        <ArrowLeft /> {t('Back', 'Atrás', lang)}
      </button>
    </div>
  )
}

// ── Step 6: Completion ────────────────────────────────────────────────────────

interface CompletionStepProps {
  lang: Lang
  selectedCurrency: Currency
  selectedIncome: IncomeRange | null
  selectedGoal: string | null
  selectedCats: string[]
  selectedPlan: Plan
  planIntent: string | null
}

function CompletionStep({
  lang,
  selectedCurrency,
  selectedIncome,
  selectedGoal,
  selectedCats,
  selectedPlan,
  planIntent,
}: CompletionStepProps) {
  const goalData = GOALS.find((g) => g.id === selectedGoal)
  const goalLabel = goalData
    ? lang === 'es' ? goalData.label_es : goalData.label_en
    : selectedGoal ?? '—'

  const catLabels = selectedCats
    .map((id) => {
      const cat = CATEGORIES.find((c) => c.id === id)
      return cat ? `${cat.icon} ${lang === 'es' ? cat.label_es : cat.label_en}` : id
    })
    .join(', ')

  const dashboardHref =
    planIntent && planIntent !== 'free'
      ? `/upgrade?plan=${planIntent}`
      : '/dashboard'

  return (
    <div className="step-inner">
      <div className="completion-content">
        <div className="completion-circle" aria-hidden="true">🎉</div>
        <h1 className="step-title">{t("You're all set!", '¡Todo listo!', lang)}</h1>
        <p className="step-sub">
          {t(
            'Your finances are ready. Here is a summary of your setup.',
            'Tus finanzas están listas. Aquí tienes un resumen de tu configuración.',
            lang,
          )}
        </p>

        <div className="summary-card">
          <div className="summary-row">
            <span className="summary-label">{t('Currency', 'Moneda', lang)}</span>
            <span className="summary-value">{selectedCurrency}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">{t('Income range', 'Rango de ingreso', lang)}</span>
            <span className="summary-value">{selectedIncome?.label ?? '—'}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">{t('Main goal', 'Meta principal', lang)}</span>
            <span className="summary-value">{goalLabel}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">{t('Categories', 'Categorías', lang)}</span>
            <span className="summary-value" style={{ maxWidth: '60%', textAlign: 'right', lineHeight: 1.5 }}>
              {catLabels || '—'}
            </span>
          </div>
          <div className="summary-row">
            <span className="summary-label">{t('Plan', 'Plan', lang)}</span>
            <span className="summary-value">
              {selectedPlan === 'pro'
                ? `Pro ${t('(14-day trial)', '(prueba 14 días)', lang)}`
                : t('Free', 'Gratis', lang)}
            </span>
          </div>
        </div>

        <a
          href={dashboardHref}
          className="btn-primary"
          style={{ textDecoration: 'none', textAlign: 'center' }}
        >
          {t('Go to my dashboard', 'Ir a mi dashboard', lang)} <ArrowRight />
        </a>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  // ── State ──
  const [isLoading, setIsLoading] = useState(true)
  const [noSession, setNoSession] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [lang, setLang] = useState<Lang>('en')
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('COP')
  const [selectedIncome, setSelectedIncome] = useState<IncomeRange | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [selectedCats, setSelectedCats] = useState<string[]>(DEFAULT_CATS)
  const [selectedPlan, setSelectedPlan] = useState<Plan>('free')
  const [planIntent, setPlanIntent] = useState<string | null>(null)

  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // ── Toast helper ──
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }, [])

  // ── Auth gate ──
  useEffect(() => {
    // Detect language
    const detectedLang: Lang = navigator.language?.startsWith('es') ? 'es' : 'en'
    setLang(detectedLang)

    // Detect currency
    const detectedCurrency: Currency = navigator.language?.includes('MX') ? 'MXN' : 'COP'
    setSelectedCurrency(detectedCurrency)

    // Plan intent from sessionStorage
    const intent = sessionStorage.getItem('weup_plan_intent')
    if (intent) {
      setPlanIntent(intent)
      if (intent !== 'free') setSelectedPlan('pro')
    }

    // Auth check
    sb.auth.getSession().then(({ data }) => {
      const session = data.session
      if (!session) {
        setNoSession(true)
        setIsLoading(false)
        return
      }

      const user = session.user
      setCurrentUser(user)

      // Check if already onboarded
      sb.from('profiles')
        .select('lang')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile?.lang === 'done') {
            window.location.href = '/dashboard'
          } else {
            setIsLoading(false)
          }
        })
        .catch(() => {
          // If profiles table query fails, still allow onboarding
          setIsLoading(false)
        })
    })
  }, [])

  // ── Navigation helpers ──
  const goToStep = (step: number) => setCurrentStep(step)
  const goNext = () => setCurrentStep((s) => s + 1)
  const goBack = () => setCurrentStep((s) => Math.max(1, s - 1))

  // ── Currency change resets income selection ──
  const handleCurrencyChange = (c: Currency) => {
    setSelectedCurrency(c)
    setSelectedIncome(null)
  }

  // ── Toggle category ──
  const toggleCat = (id: string) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  // ── Finish onboarding (upsert profile, go to step 6) ──
  const finishOnboarding = async () => {
    if (!currentUser) return
    setIsSaving(true)
    try {
      const fullName =
        (currentUser.user_metadata?.full_name as string | undefined) ?? ''

      const { error } = await sb.from('profiles').upsert({
        id: currentUser.id,
        onboarding_completed: true,
        currency: selectedCurrency,
        lang: 'done',
        full_name: fullName,
      })

      if (error) {
        showToast(error.message)
      } else {
        goToStep(6)
      }
    } catch {
      showToast(t('Something went wrong.', 'Algo salió mal.', lang))
    } finally {
      setIsSaving(false)
    }
  }

  // ── Skip onboarding ──
  const skipOnboarding = async () => {
    if (!currentUser) {
      window.location.href = '/dashboard'
      return
    }
    try {
      await sb.from('profiles').upsert({
        id: currentUser.id,
        onboarding_completed: true,
        lang: 'done',
      })
    } catch {
      // Ignore error on skip
    }
    window.location.href = '/dashboard'
  }

  // ── Progress bar ──
  const progressPct = currentStep === 6 ? 100 : ((currentStep - 1) / 5) * 100

  // ── Nav step state ──
  const getNavStepClass = (navIndex: number): string => {
    // navIndex is 1-based (1..5)
    if (currentStep === 6) return 'nav-step done'
    if (navIndex < currentStep) return 'nav-step done'
    if (navIndex === currentStep) return 'nav-step active'
    return 'nav-step'
  }

  // ── Auth gate loading screen ──
  if (isLoading || noSession) {
    return <AuthGateScreen noSession={noSession} />
  }

  // ── Render ──
  return (
    <div className="onboard-root">
      {/* Navigation Bar */}
      <nav className="onboard-nav" aria-label="Onboarding navigation">
        <a href="/" className="nav-logo" aria-label="WeUp home">
          <img src="/Logo_WeUp.png" alt="" aria-hidden="true" />
          <span>WeUp</span>
        </a>

        <div className="nav-steps" aria-label={t('Step progress', 'Progreso de pasos', lang)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={getNavStepClass(i)}
              aria-label={`${t('Step', 'Paso', lang)} ${i}`}
            />
          ))}
        </div>

        {currentStep < 6 && (
          <button
            type="button"
            className="nav-skip"
            onClick={skipOnboarding}
            aria-label={t('Skip onboarding', 'Omitir configuración', lang)}
          >
            {t('Skip', 'Omitir', lang)}
          </button>
        )}
        {currentStep === 6 && <div style={{ width: 50 }} aria-hidden="true" />}
      </nav>

      {/* Progress Bar */}
      <div className="progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Pages */}
      <main className="pages">
        {/* Step 1 — Welcome */}
        <div className={`step-page${currentStep === 1 ? ' active' : ''}`} aria-hidden={currentStep !== 1}>
          <WelcomeStep lang={lang} user={currentUser} onNext={goNext} />
        </div>

        {/* Step 2 — Income */}
        <div className={`step-page${currentStep === 2 ? ' active' : ''}`} aria-hidden={currentStep !== 2}>
          <IncomeStep
            lang={lang}
            selectedCurrency={selectedCurrency}
            selectedIncome={selectedIncome}
            onCurrencyChange={handleCurrencyChange}
            onIncomeSelect={setSelectedIncome}
            onNext={goNext}
            onBack={goBack}
          />
        </div>

        {/* Step 3 — Goals */}
        <div className={`step-page${currentStep === 3 ? ' active' : ''}`} aria-hidden={currentStep !== 3}>
          <GoalsStep
            lang={lang}
            selectedGoal={selectedGoal}
            onGoalSelect={setSelectedGoal}
            onNext={goNext}
            onBack={goBack}
          />
        </div>

        {/* Step 4 — Categories */}
        <div className={`step-page${currentStep === 4 ? ' active' : ''}`} aria-hidden={currentStep !== 4}>
          <CategoriesStep
            lang={lang}
            selectedCats={selectedCats}
            onToggleCat={toggleCat}
            onNext={goNext}
            onBack={goBack}
          />
        </div>

        {/* Step 5 — Plan */}
        <div className={`step-page${currentStep === 5 ? ' active' : ''}`} aria-hidden={currentStep !== 5}>
          <PlanStep
            lang={lang}
            selectedPlan={selectedPlan}
            onPlanSelect={setSelectedPlan}
            onNext={finishOnboarding}
            onBack={goBack}
          />
        </div>

        {/* Step 6 — Completion */}
        <div className={`step-page${currentStep === 6 ? ' active' : ''}`} aria-hidden={currentStep !== 6}>
          <CompletionStep
            lang={lang}
            selectedCurrency={selectedCurrency}
            selectedIncome={selectedIncome}
            selectedGoal={selectedGoal}
            selectedCats={selectedCats}
            selectedPlan={selectedPlan}
            planIntent={planIntent}
          />
        </div>
      </main>

      {/* Toast */}
      <div
        className={`toast${toastVisible ? ' show' : ''}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toastMsg}
      </div>

      {/* Saving overlay (non-blocking subtle indicator) */}
      {isSaving && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(13,43,30,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          aria-label={t('Saving…', 'Guardando…', lang)}
          role="status"
        >
          <div style={{
            background: 'var(--mid)',
            border: '0.5px solid var(--w20)',
            borderRadius: 16,
            padding: '24px 36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{ fontSize: 28 }}>⏳</div>
            <div style={{ fontSize: 14, color: 'var(--w80)' }}>
              {t('Saving your preferences…', 'Guardando tus preferencias…', lang)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
