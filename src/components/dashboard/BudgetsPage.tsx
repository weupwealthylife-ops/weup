import { useMemo } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'
import { fmt } from '../../lib/format'
import { BUDGET_CATS } from '../../lib/categories'
import { TipBanner } from './TipBanner'

export function BudgetsPage() {
  const { transactions, budgets, lang, currency, viewMonth, viewYear, changeMonth, openBudgetModal } = useDashboard()

  const t = (en: string, es: string) => lang === 'es' ? es : en

  const monthTxs = useMemo(() => transactions.filter(tx => {
    const [y, m] = tx.date.split('-').map(Number)
    return (m - 1) === viewMonth && y === viewYear && tx.type === 'expense'
  }), [transactions, viewMonth, viewYear])

  const spent = useMemo(() => {
    const map: Record<string, number> = {}
    for (const tx of monthTxs) {
      map[tx.category] = (map[tx.category] || 0) + Number(tx.amount)
    }
    return map
  }, [monthTxs])

  const totalBudget  = Object.values(budgets).reduce((s, v) => s + v, 0)
  const totalSpent   = Object.values(spent).reduce((s, v) => s + v, 0)
  const totalPct     = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString(
    lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', year: 'numeric' }
  )

  function barColor(pct: number) {
    if (pct >= 100) return 'var(--expense)'
    if (pct >= 75)  return '#F59E0B'
    return 'var(--income)'
  }

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <h1>{t('Budgets', 'Presupuestos')}</h1>
          <p>{t('Track your monthly spending limits', 'Controla tus límites de gasto mensual')}</p>
        </div>
        <div className="topbar-right">
          <div className="month-nav">
            <button className="month-nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
            <span className="month-nav-label">{monthName}</span>
            <button className="month-nav-btn" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
          </div>
          <button className="btn btn-primary" onClick={openBudgetModal}>
            ✏️ {t('Edit budgets', 'Editar presupuestos')}
          </button>
        </div>
      </div>

      <TipBanner
        pageKey="budgets"
        en="Tip: Set a limit for each spending category — we'll warn you before you overspend."
        es="Tip: Fija un límite por categoría de gasto — te avisaremos antes de que te pases."
      />

      {/* Overall summary card */}
      <div className="dash-card card-hero" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div className="card-label">{t('Total budget used', 'Presupuesto total usado')}</div>
            <div className="card-value">{fmt(totalSpent, currency)}</div>
            <div className="card-sub">
              {t('of', 'de')} {fmt(totalBudget, currency)} {t('budget', 'presupuesto')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: totalPct >= 100 ? '#FCA5A5' : '#5FDC9A' }}>
              {totalPct.toFixed(0)}%
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {fmt(Math.max(0, totalBudget - totalSpent), currency)} {t('remaining', 'restante')}
            </div>
          </div>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4, transition: 'width 0.6s ease',
            width: `${totalPct}%`,
            background: totalPct >= 100 ? '#FCA5A5' : 'linear-gradient(90deg, #5FDC9A, #3DBA7A)',
          }} />
        </div>
      </div>

      {/* Per-category budget list */}
      <div className="dash-card">
        <div className="section-header">
          <span className="section-title">{t('Category budgets', 'Presupuestos por categoría')}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {BUDGET_CATS.map(cat => {
            const budget  = budgets[cat.key] || 0
            const catSpent = spent[cat.key] || 0
            const pct     = budget > 0 ? Math.min(100, (catSpent / budget) * 100) : 0
            const remaining = Math.max(0, budget - catSpent)
            const over = catSpent > budget && budget > 0

            return (
              <div key={cat.key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'var(--bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, flexShrink: 0,
                    }}>
                      {cat.icon}
                    </span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                        {lang === 'es' ? cat.es : cat.en}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                        {fmt(catSpent, currency)} {t('of', 'de')} {fmt(budget, currency)}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {over ? (
                      <span className="badge badge-down">
                        {t('Over by', 'Excedido')} {fmt(catSpent - budget, currency)}
                      </span>
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
                        {fmt(remaining, currency)} {t('left', 'restante')}
                      </span>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      {pct.toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div style={{ height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${pct}%`, transition: 'width 0.5s ease',
                    background: barColor(pct),
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
