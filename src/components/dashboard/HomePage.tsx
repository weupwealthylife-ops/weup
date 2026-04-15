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
            {new Date(tx.date).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric' })}
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

  // ── Monthly filtered data ──
  const monthTxs = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear
  }), [transactions, viewMonth, viewYear])

  const income   = useMemo(() => monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0), [monthTxs])
  const expenses = useMemo(() => monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), [monthTxs])
  const balance  = income - expenses
  const saved    = income > 0 ? balance : 0
  const saveRate = income > 0 ? Math.round((saved / income) * 100) : 0
  const expRate  = income > 0 ? Math.round((expenses / income) * 100) : 0

  // ── Weekly ──
  const { weekSpent, weekBadge, weekClass } = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0)
    const weekTxs = transactions.filter(t => { const d = new Date(t.date); return d >= startOfWeek && d <= now })
    const ws = weekTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    const avgWeekly = expenses / 4.3
    const es = lang === 'es'
    if (ws === 0)                           return { weekSpent: ws, weekBadge: es ? 'Sin gastos aún' : 'No expenses yet', weekClass: 'neutral' }
    if (avgWeekly > 0 && ws <= avgWeekly * 0.85) return { weekSpent: ws, weekBadge: es ? '✓ Por debajo del promedio' : '✓ Under weekly avg', weekClass: 'good' }
    if (avgWeekly > 0 && ws >= avgWeekly * 1.15) {
      const over = Math.round(((ws / avgWeekly) - 1) * 100)
      return { weekSpent: ws, weekBadge: es ? `${over}% sobre el promedio` : `${over}% over avg`, weekClass: 'over' }
    }
    return { weekSpent: ws, weekBadge: es ? 'En línea' : 'On track', weekClass: 'good' }
  }, [transactions, expenses, lang])

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
          <div className="card-sub">{t('This month', 'Este mes')}</div>
        </div>
        <div className="dash-card">
          <div className="card-icon icon-income">💰</div>
          <div className="card-label">{t('Income', 'Ingresos')}</div>
          <div className="card-value" style={{ color: 'var(--income)' }}>{fmt(income, currency)}</div>
          <div className="card-sub">
            {monthTxs.filter(tx => tx.type === 'income').length} {t('entries', 'entradas')}
          </div>
        </div>
        <div className="dash-card">
          <div className="card-icon icon-expense">💸</div>
          <div className="card-label">{t('Expenses', 'Gastos')}</div>
          <div className="card-value" style={{ color: 'var(--expense)' }}>{fmt(expenses, currency)}</div>
          <div className="card-sub">
            {income > 0
              ? <><span className="badge badge-down">{expRate}%</span> {t('of income', 'de ingresos')}</>
              : <>{monthTxs.filter(tx => tx.type === 'expense').length} {t('entries', 'gastos')}</>
            }
          </div>
        </div>
        <div className="dash-card">
          <div className="card-icon icon-savings">🎯</div>
          <div className="card-label">{t('Saved', 'Ahorrado')}</div>
          <div className="card-value" style={{ color: 'var(--purple)' }}>{fmt(saved, currency)}</div>
          <div className="card-sub">{saveRate}% {t('savings rate', 'tasa de ahorro')}</div>
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
              <div className="ai-insight-text" dangerouslySetInnerHTML={{ __html: ins.text }} />
            </div>
          ))}
        </div>
      </div>

      {/* Weekly summary */}
      <div className="weekly-card">
        <div className="weekly-left">
          <div className="weekly-icon">📅</div>
          <div>
            <div className="weekly-label">{t('This week', 'Esta semana')}</div>
            <div className="weekly-value">{fmt(weekSpent, currency)} {t('spent', 'gastado')}</div>
          </div>
        </div>
        <span className={`weekly-badge ${weekClass}`}>{weekBadge}</span>
      </div>

      {/* Recent transactions + Donut chart */}
      <div className="two-col">
        <div className="dash-card">
          <div className="section-header">
            <div className="section-title">{t('Recent transactions', 'Transacciones recientes')}</div>
            <button className="section-link" onClick={() => setView('transactions')}>
              {t('View all', 'Ver todas')}
            </button>
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
              monthTxs.slice(0, 8).map(tx => (
                <TxRow key={tx.id} tx={tx} lang={lang} currency={currency} onEdit={openEditModal} onDelete={handleDelete} />
              ))
            )}
          </div>
        </div>

        <div className="dash-card">
          <div className="section-header">
            <div className="section-title">{t('Spending by category', 'Gastos por categoría')}</div>
          </div>
          <div className="chart-wrap donut-wrap" style={{ height: 220 }}>
            <Doughnut
              data={donutData}
              options={{
                responsive: true, maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                  legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 14, usePointStyle: true, pointStyle: 'circle' } },
                  tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.parsed, currency)}` } },
                },
              }}
            />
            <div className="donut-center">
              <div className="donut-center-val">{totalExp > 0 ? fmt(totalExp, currency) : '$0'}</div>
              <div className="donut-center-lbl">{t('expenses', 'gastos')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
