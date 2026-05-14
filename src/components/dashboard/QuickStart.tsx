import { useState, useEffect } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'

interface Step {
  key: string
  icon: string
  label: string
  desc: string
  actionLabel: string
  onAction: () => void
  done: boolean
}

export function QuickStart() {
  const { user, lang, transactions, budgets, setView, openAddModal } = useDashboard()
  const t = (en: string, es: string) => lang === 'es' ? es : en

  const dismissKey    = `weup_qs_dismissed_${user.id}`
  const visitedReports  = `weup_visited_reports_${user.id}`
  const visitedSettings = `weup_visited_settings_${user.id}`

  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(dismissKey))
  const [reportsVisited, setRV]   = useState(() => !!localStorage.getItem(visitedReports))
  const [settingsVisited, setSV]  = useState(() => !!localStorage.getItem(visitedSettings))

  // Listen for navigation events set by Layout
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === visitedReports  && e.newValue) setRV(true)
      if (e.key === visitedSettings && e.newValue) setSV(true)
    }
    window.addEventListener('storage', onStorage)
    // Also poll local (same-tab updates don't fire storage event)
    const id = setInterval(() => {
      if (localStorage.getItem(visitedReports))  setRV(true)
      if (localStorage.getItem(visitedSettings)) setSV(true)
    }, 1000)
    return () => { window.removeEventListener('storage', onStorage); clearInterval(id) }
  }, [visitedReports, visitedSettings])

  const hasTransaction = transactions.length > 0
  const hasBudget      = Object.values(budgets).some(v => v > 0)

  const steps: Step[] = [
    {
      key: 'tx',
      icon: '💳',
      label: t('Add your first transaction', 'Agrega tu primera transacción'),
      desc:  t('Track an expense or income to get started.', 'Registra un gasto o ingreso para comenzar.'),
      actionLabel: t('Add', 'Agregar'),
      onAction: openAddModal,
      done: hasTransaction,
    },
    {
      key: 'budget',
      icon: '📊',
      label: t('Set a monthly budget', 'Fija un presupuesto mensual'),
      desc:  t('Create a limit for one spending category.', 'Crea un límite para una categoría de gastos.'),
      actionLabel: t('Set budget', 'Fijar presupuesto'),
      onAction: () => setView('budgets'),
      done: hasBudget,
    },
    {
      key: 'reports',
      icon: '📈',
      label: t('Explore your reports', 'Explora tus reportes'),
      desc:  t('See charts and trends for your spending.', 'Ve gráficos y tendencias de tus gastos.'),
      actionLabel: t('View reports', 'Ver reportes'),
      onAction: () => setView('reports'),
      done: reportsVisited,
    },
    {
      key: 'settings',
      icon: '⚙️',
      label: t('Customize your settings', 'Personaliza tus ajustes'),
      desc:  t('Set your currency and language preferences.', 'Configura tu moneda e idioma.'),
      actionLabel: t('Settings', 'Ajustes'),
      onAction: () => setView('settings'),
      done: settingsVisited,
    },
  ]

  const doneCount  = steps.filter(s => s.done).length
  const allDone    = doneCount === steps.length
  const pct        = Math.round((doneCount / steps.length) * 100)

  function dismiss() {
    localStorage.setItem(dismissKey, '1')
    setDismissed(true)
  }

  if (dismissed) return null

  // All-done celebration state
  if (allDone) {
    return (
      <div className="qs-complete">
        <div className="qs-complete-icon">🎉</div>
        <div>
          <div className="qs-complete-title">{t("You're all set!", '¡Todo listo!')}</div>
          <div className="qs-complete-sub">
            {t("You've completed the quick start. WeUp is fully set up for you.", 'Completaste la guía rápida. WeUp está totalmente configurado para ti.')}
          </div>
        </div>
        <button className="qs-dismiss" onClick={dismiss} title="Dismiss">✕</button>
      </div>
    )
  }

  return (
    <div className="qs-card">
      {/* Header */}
      <div className="qs-header">
        <div>
          <div className="qs-title">
            {t('Quick start guide', 'Guía de inicio rápido')}
          </div>
          <div className="qs-progress-text">
            {doneCount}/{steps.length} {t('completed', 'completados')}
          </div>
        </div>
        <button className="qs-dismiss" onClick={dismiss} title={t('Dismiss', 'Cerrar')}>✕</button>
      </div>

      {/* Progress bar */}
      <div className="qs-progress-bar">
        <div className="qs-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Steps */}
      <div className="qs-steps">
        {steps.map(step => (
          <div key={step.key} className={`qs-step${step.done ? ' done' : ''}`}>
            <div className="qs-step-check">
              {step.done && (
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="qs-step-info">
              <div className="qs-step-label">
                {step.icon} {step.label}
              </div>
              {!step.done && (
                <div className="qs-step-desc">{step.desc}</div>
              )}
            </div>
            {!step.done && (
              <button className="qs-step-action" onClick={step.onAction}>
                {step.actionLabel} →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
