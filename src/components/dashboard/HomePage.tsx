import { useMemo, useEffect, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useDashboard } from '../../contexts/DashboardContext'
import { fmt, monthLabel } from '../../lib/format'
import { CAT_ICONS, CAT_COLORS, CAT_LABELS_EN, CAT_LABELS_ES } from '../../lib/categories'
import { sb } from '../../lib/supabase'
import { QuickStart } from './QuickStart'
import type { Transaction } from '../../types/dashboard'

ChartJS.register(ArcElement, Tooltip, Legend)

// ── Safe renderer for insight text containing <strong> tags ──────────────────
function renderInsight(text: string) {
  return text.split(/(<strong>.*?<\/strong>)/g).map((part, i) => {
    const m = part.match(/^<strong>(.*?)<\/strong>$/)
    return m ? <strong key={i} style={{ color: '#fff', fontWeight: 600 }}>{m[1]}</strong> : part
  })
}

// ── AI Insights (calculated fallback — same as original) ──────────────────────
function useAIInsights(income: number, expenses: number, balance: number, txs: Transaction[], lang: 'en' | 'es') {
  const [insights, setInsights] = useState([
    { icon: '📊', text: lang === 'es' ? 'Agrega transacciones para recibir insights personalizados.' : 'Add transactions to receive personalized AI insights.' },
    { icon: '💡', text: lang === 'es' ? 'WeUp IA analizará tus patrones de gasto.' : 'WeUp AI will analyze your spending patterns to help you save more.' },
    { icon: '🎯', text: lang === 'es' ? 'Configura presupuestos para metas de ahorro.' : 'Set up budget categories to unlock goal tracking.' },
  ])

  useEffect(() => {
    if (txs.length === 0) return
    const saveRate = income > 0 ? Math.round((balance / income) * 100) : 0
    const expRatio = income > 0 ? Math.round((expenses / income) * 100) : 0
    const catSpend: Record<string, number> = {}
    txs.filter(t => t.type === 'expense').forEach(t => { catSpend[t.category] = (catSpend[t.category] || 0) + Number(t.amount) })
    const topCat = Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0]?.[0]
    const es = lang === 'es'

    const calc = [
      saveRate >= 20
        ? { icon: '🏆', text: es ? `¡Excelente! Ahorraste el <strong>${saveRate}%</strong> de tus ingresos este mes.` : `Excellent! You saved <strong>${saveRate}%</strong> of your income this month.` }
        : saveRate > 0
          ? { icon: '💡', text: es ? `Ahorraste el <strong>${saveRate}%</strong> este mes. La meta recomendada es el 20%.` : `You saved <strong>${saveRate}%</strong> this month. The recommended goal is 20%.` }
          : { icon: '⚠️', text: es ? 'Tus gastos superan tus ingresos. Revisa dónde puedes recortar.' : 'Your expenses exceed your income. Review where you can cut back.' },
      topCat
        ? { icon: '🔍', text: es ? `Tu mayor categoría es <strong>${topCat}</strong>. Considera un límite de presupuesto.` : `Your top category is <strong>${topCat}</strong>. Consider setting a budget limit.` }
        : { icon: '📊', text: es ? `Ratio gastos/ingresos: <strong>${expRatio}%</strong>. Lo ideal es bajo el 80%.` : `Expense ratio: <strong>${expRatio}%</strong>. Ideal is below 80%.` },
      { icon: '📈', text: es ? `${txs.length} transacciones este mes. ¡Sigue registrando!` : `${txs.length} transactions logged this month. Keep it up!` },
    ]
    setInsights(calc)
  }, [income, expenses, balance, txs, lang])

  return insights
}

// ── Transaction list row ──────────────────────────────────────────────────────
function TxRow({ tx, lang, currency, onEdit, onDelete }: {
  tx: Transaction; lang: 'en' | 'es'; currency: 'USD' | 'COP' | 'MXN'
  onEdit: (tx: Transaction) => void
  onDelete: (id: string, desc: string) => void
}) {
  const [confirm, setConfirm] = useState(false)
  const labels = lang === 'es' ? CAT_LABELS_ES : CAT_LABELS_EN
  return (
    <>
      <div className="tx-item">
        <div className="tx-icon" style={{ background: CAT_COLORS[tx.category] || '#F1F5F9' }}>
          {CAT_ICONS[tx.category] || '📦'}
        </div>
        <div className="tx-info">
          <div className="tx-name">{tx.description || 'Transaction'}</div>
          <div className="tx-cat">{labels[tx.category] || tx.category}</div>
        </div>
        <div className="tx-right">
          <div className={`tx-amt ${tx.type === 'income' ? 'pos' : 'neg'}`}>
            {tx.type === 'income' ? '+' : '-'}{fmt(Number(tx.amount), currency)}
          </div>
          <div className="tx-date">
            {(() => { const [y,m,d] = tx.date.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' }) })()}
          </div>
          <div className="tx-actions">
            <button className="tx-act" onClick={() => onEdit(tx)} title="Edit" aria-label="Edit transaction">✏️</button>
            <button className="tx-act del" onClick={() => setConfirm(true)} title="Delete" aria-label="Delete transaction">🗑</button>
          </div>
        </div>
      </div>
      {confirm && (
        <div className="confirm-bar">
          <span>Delete "{tx.description}"?</span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => setConfirm(false)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={() => { onDelete(tx.id, tx.description); setConfirm(false) }} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Delete</button>
          </div>
        </div>
      )}
    </>
  )
}

// ── Main HomePage ─────────────────────────────────────────────────────────────
export function HomePage() {
  const { user, transactions, lang, currency, viewMonth, viewYear, changeMonth, openAddModal, openEditModal, reloadData, showToast, setView } = useDashboard()
  const name = user.user_metadata?.full_name?.split(' ')[0]
            || user.user_metadata?.name?.split(' ')[0]
            || user.email?.split('@')[0] || ''

  const h = new Date().getHours()
  const greetKey = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  const greetMap = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' }
  const greeting = `${greetMap[greetKey]}, ${name} ✦`

  const dateStr = new Date().toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // ── Monthly filtered data ── (split string to avoid UTC timezone shifts)
  const monthTxs = useMemo(() => transactions.filter(t => {
    const [y, m] = t.date.split('-').map(Number)
    return (m - 1) === viewMonth && y === viewYear
  }), [transactions, viewMonth, viewYear])

  const income   = useMemo(() => monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0), [monthTxs])
  const expenses = useMemo(() => monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), [monthTxs])
  const balance  = income - expenses
  const saved    = income > 0 ? balance : 0
  const saveRate = income > 0 ? Math.round((saved / income) * 100) : 0
  const expRate  = income > 0 ? Math.round((expenses / income) * 100) : 0

  // ── Previous month expenses (for MoM comparison in monthly spending widget) ──
  const prevMonthExp = useMemo(() => {
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1
    const prevYear  = viewMonth === 0 ? viewYear - 1 : viewYear
    return transactions
      .filter(t => {
        const [y, m] = t.date.split('-').map(Number)
        return (m - 1) === prevMonth && y === prevYear && t.type === 'expense'
      })
      .reduce((s, t) => s + Number(t.amount), 0)
  }, [transactions, viewMonth, viewYear])

  // ── Monthly spending badge ──
  const { monthBadge, monthBadgeClass } = useMemo(() => {
    const es = lang === 'es'
    if (expenses === 0)     return { monthBadge: es ? 'Sin gastos' : 'No expenses', monthBadgeClass: 'neutral' }
    if (prevMonthExp === 0) return { monthBadge: es ? 'Primer mes' : 'First data', monthBadgeClass: 'neutral' }
    const diff = Math.round(((expenses - prevMonthExp) / prevMonthExp) * 100)
    if (diff <= -10)  return { monthBadge: es ? `${Math.abs(diff)}% menos` : `${Math.abs(diff)}% less`, monthBadgeClass: 'good' }
    if (diff >= 10)   return { monthBadge: es ? `${diff}% más` : `${diff}% more`, monthBadgeClass: 'over' }
    return { monthBadge: es ? 'Similar al mes anterior' : 'Similar to last month', monthBadgeClass: 'good' }
  }, [expenses, prevMonthExp, lang])

  // ── Category breakdown for sidebar list ──
  const catBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    monthTxs.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount)
    })
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 5)
  }, [monthTxs])

  // ── Donut chart ──
  const donutData = useMemo(() => {
    const catSpend: Record<string, number> = {}
    monthTxs.filter(t => t.type === 'expense').forEach(t => { catSpend[t.category] = (catSpend[t.category] || 0) + Number(t.amount) })
    const cats = Object.keys(catSpend)
    const colors = ['#2E8B57','#3DBA7A','#5FDC9A','#10B981','#34D399','#6EE7B7','#A7F3D0']
    return {
      labels: cats.length ? cats.map(c => c.charAt(0).toUpperCase() + c.slice(1)) : ['No data'],
      datasets: [{
        data: cats.length ? Object.values(catSpend) : [1],
        backgroundColor: cats.length ? colors.slice(0, cats.length) : ['#e2e8f0'],
        borderWidth: 0,
        hoverOffset: 4,
      }],
    }
  }, [monthTxs])

  const totalExp = useMemo(() => monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), [monthTxs])

  const insights = useAIInsights(income, expenses, balance, monthTxs, lang)

  const now = new Date()
  const isCurrentMonth = viewMonth === now.getMonth() && viewYear === now.getFullYear()
  const t = (en: string, es: string) => lang === 'es' ? es : en

  async function handleDelete(id: string) {
    await sb.from('transactions').delete().eq('id', id).eq('user_id', user.id)
    showToast(t('🗑 Transaction deleted', '🗑 Transacción eliminada'))
    await reloadData()
  }

  return (
    <div>
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-left">
          <h1>{greeting}</h1>
          <p>{dateStr}</p>
        </div>
        <div className="topbar-right" style={{ gap: 10 }}>
          <div className="month-nav">
            <button className="month-nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
            <span className="month-nav-label">{monthLabel(viewMonth, viewYear, lang)}</span>
            <button className="month-nav-btn" onClick={() => changeMonth(1)} disabled={isCurrentMonth} aria-label="Next month">›</button>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            {t('Add transaction', 'Agregar transacción')}
          </button>
        </div>
      </div>

      {/* Quick start checklist — visible until all steps done or dismissed */}
      <QuickStart />

      {/* Summary cards */}
      <div className="cards-grid">
        <div className="dash-card card-hero">
          <div className="card-label">{t('Net Balance', 'Balance Neto')}</div>
          <div className="card-value">{fmt(balance, currency)}</div>
          <div className="card-sub">
            {income > 0
              ? <>{saveRate}% {t('saved this month', 'ahorrado este mes')}</>
              : t('This month', 'Este mes')
            }
          </div>
        </div>
        <div className="dash-card card-accent-income">
          <div className="card-icon icon-income">💰</div>
          <div className="card-label">{t('Income', 'Ingresos')}</div>
          <div className="card-value" style={{ color: 'var(--income)' }}>{fmt(income, currency)}</div>
          <div className="card-sub">
            {monthTxs.filter(tx => tx.type === 'income').length} {t('transactions', 'transacciones')}
          </div>
        </div>
        <div className="dash-card card-accent-expense">
          <div className="card-icon icon-expense">💸</div>
          <div className="card-label">{t('Expenses', 'Gastos')}</div>
          <div className="card-value" style={{ color: 'var(--expense)' }}>{fmt(expenses, currency)}</div>
          <div className="card-sub">
            {income > 0
              ? <><span className="badge badge-down">{expRate}%</span> {t('of income', 'de ingresos')}</>
              : <>{monthTxs.filter(tx => tx.type === 'expense').length} {t('transactions', 'transacciones')}</>
            }
          </div>
        </div>
        <div className="dash-card card-accent-savings">
          <div className="card-icon icon-savings">🎯</div>
          <div className="card-label">{t('Saved', 'Ahorrado')}</div>
          <div className="card-value" style={{ color: 'var(--purple)' }}>{fmt(saved, currency)}</div>
          <div className="card-sub">
            {saveRate > 0
              ? <><span className="badge" style={{ background: 'var(--purple-l)', color: 'var(--purple)' }}>{saveRate}%</span> {t('savings rate', 'tasa de ahorro')}</>
              : t('savings rate', 'tasa de ahorro')
            }
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="ai-card">
        <div className="ai-header">
          <div className="ai-badge">
            <span className="ai-pulse" />
            {t('AI Insights', 'Insights IA')}
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{t('Powered by WeUp AI', 'Impulsado por WeUp IA')}</span>
        </div>
        <div className="ai-insights">
          {insights.map((ins, i) => (
            <div key={i} className="ai-insight">
              <div className="ai-insight-icon">{ins.icon}</div>
              <div className="ai-insight-text">{renderInsight(ins.text)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions + Category breakdown */}
      <div className="two-col">
        <div className="dash-card">
          <div className="section-header">
            <div className="section-title">{t('Recent transactions', 'Transacciones recientes')}</div>
            <button className="section-link" onClick={() => setView('transactions')}>
              {t('View all', 'Ver todas')}
            </button>
          </div>

          {/* Monthly spending — inline inside transactions card */}
          <div className="week-inline">
            <div className="week-inline-icon">📆</div>
            <div className="week-inline-info">
              <span className="week-inline-label">{t('This month', 'Este mes')}</span>
              <span className="week-inline-value">{fmt(expenses, currency)} {t('spent', 'gastado')}</span>
            </div>
            <span className={`weekly-badge ${monthBadgeClass}`}>{monthBadge}</span>
          </div>

          <div className="tx-list">
            {monthTxs.length === 0 ? (
              <div className="empty">
                <span className="empty-icon">✨</span>
                <h3>{t('Your financial story starts here', 'Tu historia financiera empieza aquí')}</h3>
                <p>{t("Add your first transaction and WeUp's AI will start building your insights.", 'Agrega tu primera transacción y la IA de WeUp comenzará a generar tus insights.')}</p>
                <button className="empty-cta" onClick={openAddModal}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                  {t('Add first transaction', 'Agregar primera transacción')}
                </button>
                <div className="empty-steps">
                  <div className="empty-step"><div className="empty-step-num">1</div><span>{t('Add transactions', 'Agrega movimientos')}</span></div>
                  <div className="empty-step"><div className="empty-step-num">2</div><span>{t('AI categorizes', 'IA categoriza')}</span></div>
                  <div className="empty-step"><div className="empty-step-num">3</div><span>{t('Get insights', 'Obtén insights')}</span></div>
                </div>
              </div>
            ) : (
              monthTxs.slice(0, 6).map(tx => (
                <TxRow key={tx.id} tx={tx} lang={lang} currency={currency} onEdit={openEditModal} onDelete={handleDelete} />
              ))
            )}
          </div>
        </div>

        <div className="dash-card">
          <div className="section-header">
            <div className="section-title">{t('Spending by category', 'Gastos por categoría')}</div>
          </div>

          {totalExp > 0 ? (
            <>
              <div className="donut-wrap" style={{ height: 190 }}>
                <Doughnut
                  data={donutData}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                      legend: { display: false },
                      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.parsed, currency)}` } },
                    },
                  }}
                />
                <div className="donut-center">
                  <div className="donut-center-val">{fmt(totalExp, currency)}</div>
                  <div className="donut-center-lbl">{t('total', 'total')}</div>
                </div>
              </div>

              {/* Category breakdown list */}
              <div className="cat-breakdown">
                {catBreakdown.map(([cat, amount]) => {
                  const pct = Math.round((amount / totalExp) * 100)
                  const labels = lang === 'es' ? CAT_LABELS_ES : CAT_LABELS_EN
                  return (
                    <div key={cat} className="cat-breakdown-item">
                      <div className="cat-breakdown-left">
                        <span className="cat-breakdown-icon">{CAT_ICONS[cat] || '📦'}</span>
                        <div>
                          <div className="cat-breakdown-name">{labels[cat] || cat}</div>
                          <div className="cat-breakdown-bar-bg">
                            <div className="cat-breakdown-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="cat-breakdown-right">
                        <span className="cat-breakdown-amount">{fmt(amount, currency)}</span>
                        <span className="cat-breakdown-pct">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="empty" style={{ padding: '32px 16px' }}>
              <span className="empty-icon" style={{ fontSize: 32 }}>📊</span>
              <h3 style={{ fontSize: 15 }}>{t('No expenses yet', 'Sin gastos aún')}</h3>
              <p style={{ fontSize: 13 }}>{t('Add an expense to see your breakdown.', 'Agrega un gasto para ver el desglose.')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
