import { useState, useEffect } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'

export function OnboardingWelcome() {
  const { user, lang, openAddModal } = useDashboard()
  const [open, setOpen] = useState(false)

  const name = user.user_metadata?.full_name?.split(' ')[0]
    || user.user_metadata?.name?.split(' ')[0]
    || user.email?.split('@')[0] || ''

  const storageKey = `weup_welcomed_${user.id}`
  const t = (en: string, es: string) => lang === 'es' ? es : en

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) {
      const timer = setTimeout(() => setOpen(true), 700)
      return () => clearTimeout(timer)
    }
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setOpen(false)
  }

  if (!open) return null

  const features = [
    {
      icon: '💳',
      title: t('Track every transaction', 'Registra cada movimiento'),
      desc: t('Log income & expenses in seconds with AI auto-categorization.', 'Registra ingresos y gastos en segundos con categorización automática.'),
    },
    {
      icon: '📊',
      title: t('Set smart budgets', 'Fija presupuestos inteligentes'),
      desc: t('Monthly limits per category with alerts before you overspend.', 'Límites mensuales por categoría con alertas antes de pasarte.'),
    },
    {
      icon: '🤖',
      title: t('Get AI insights', 'Obtén insights con IA'),
      desc: t('Personalized tips that adapt to your spending habits.', 'Consejos personalizados que se adaptan a tus hábitos.'),
    },
  ]

  return (
    <div className="overlay" onClick={dismiss}>
      <div className="modal ow-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Header */}
        <div className="ow-header">
          <div className="ow-logo-wrap">
            <img src="/Logo_WeUp.png" alt="WeUp" className="ow-logo-img" />
          </div>
          <h2 className="ow-greeting">
            {t(`Welcome, ${name}! 👋`, `¡Bienvenido, ${name}! 👋`)}
          </h2>
          <p className="ow-sub">
            {t("Your financial dashboard is ready. Here's what you can do:", 'Tu dashboard financiero está listo. Esto es lo que puedes hacer:')}
          </p>
        </div>

        {/* Feature list */}
        <div className="ow-features">
          {features.map((f, i) => (
            <div key={i} className="ow-feat">
              <div className="ow-feat-icon">{f.icon}</div>
              <div className="ow-feat-info">
                <div className="ow-feat-title">{f.title}</div>
                <div className="ow-feat-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button
            className="btn btn-primary"
            onClick={() => { openAddModal(); dismiss() }}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {t('Add first transaction', 'Agregar primera transacción')}
          </button>
          <button className="btn btn-ghost" onClick={dismiss}>
            {t('Explore on my own', 'Explorar por mi cuenta')}
          </button>
        </div>
      </div>
    </div>
  )
}
