import { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { useDashboard } from '../../contexts/DashboardContext'
import { fmt } from '../../lib/format'
import { CAT_ICONS, CAT_LABELS_EN, CAT_LABELS_ES } from '../../lib/categories'
import { TipBanner } from './TipBanner'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export function ReportsPage() {
  const { transactions, lang, currency, viewMonth, viewYear, changeMonth } = useDashboard()
  const [selectedDate, setSelectedDate] = useState('')

  const t = (en: string, es: string) => lang === 'es' ? es : en
  const MONTHS = lang === 'es' ? MONTHS_ES : MONTHS_EN
  const labels = lang === 'es' ? CAT_LABELS_ES : CAT_LABELS_EN

  const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1
  const prevYear  = viewMonth === 0 ? viewYear - 1 : viewYear

  // ── Current month ──
  const currentMonthTxs = useMemo(() => transactions.filter(tx => {
    const [y, m] = tx.date.split('-').map(Number)
    return (m - 1) === viewMonth && y === viewYear
  }), [transactions, viewMonth, viewYear])

  const currentIncome   = useMemo(() => currentMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0), [currentMonthTxs])
  const currentExpenses = useMemo(() => currentMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), [currentMonthTxs])
  const currentSaved    = currentIncome - currentExpenses
  const savingsRate     = currentIncome > 0 ? Math.round((currentSaved / currentIncome) * 100) : 0

  // ── Previous month ──
  const prevMonthTxs = useMemo(() => transactions.filter(tx => {
    const [y, m] = tx.date.split('-').map(Number)
    return (m - 1) === prevMonth && y === prevYear
  }), [transactions, prevMonth, prevYear])

  const prevIncome   = useMemo(() => prevMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0), [prevMonthTxs])
  const prevExpenses = useMemo(() => prevMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0), [prevMonthTxs])

  // ── Last 6 months ──
  const last6 = useMemo(() => {
    const result = []
    for (let i = 5; i >= 0; i--) {
      let m = viewMonth - i
      let y = viewYear
      while (m < 0) { m += 12; y-- }
      const txs = transactions.filter(tx => {
        const [ty, tm] = tx.date.split('-').map(Number)
        return (tm - 1) === m && ty === y
      })
      const inc = txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + Number(tx.amount), 0)
      const exp = txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + Number(tx.amount), 0)
      result.push({ label: MONTHS[m], income: inc, expenses: exp, month: m, year: y })
    }
    return result
  }, [transactions, viewMonth, viewYear, MONTHS])

  // ── Category breakdown ──
  const catBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    currentMonthTxs.filter(tx => tx.type === 'expense').forEach(tx => {
      map[tx.category] = (map[tx.category] || 0) + Number(tx.amount)
    })
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 8)
  }, [currentMonthTxs])
  const totalExpenses = catBreakdown.reduce((s, [, v]) => s + v, 0)

  // ── 6-month average ──
  const avgMonthlyExpenses = last6.reduce((s, m) => s + m.expenses, 0) / 6

  // ── Day view ──
  const dayTxs = useMemo(() => {
    if (!selectedDate) return []
    return transactions.filter(tx => tx.date === selectedDate)
  }, [transactions, selectedDate])
  const dayIncome   = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const dayExpenses = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  // ── Month-over-month helpers ──
  function pctChange(cur: number, prev: number): number | null {
    if (prev === 0) return null
    return Math.round(((cur - prev) / prev) * 100)
  }
  const incomeChange  = pctChange(currentIncome, prevIncome)
  const expenseChange = pctChange(currentExpenses, prevExpenses)

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString(
    lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', year: 'numeric' }
  )

  // ── Chart data ──
  const barData = {
    labels: last6.map(d => d.label),
    datasets: [
      {
        label: t('Income', 'Ingresos'),
        data: last6.map(d => d.income),
        backgroundColor: 'rgba(16,185,129,0.7)',
        borderRadius: 6, borderSkipped: false,
      },
      {
        label: t('Expenses', 'Gastos'),
        data: last6.map(d => d.expenses),
        backgroundColor: 'rgba(239,68,68,0.6)',
        borderRadius: 6, borderSkipped: false,
      },
    ],
  }

  const lineData = {
    labels: last6.map(d => d.label),
    datasets: [{
      label: t('Net savings', 'Ahorro neto'),
      data: last6.map(d => d.income - d.expenses),
      borderColor: '#2E8B57',
      backgroundColor: 'rgba(46,139,87,0.08)',
      tension: 0.4, fill: true,
      pointBackgroundColor: '#2E8B57', pointRadius: 4,
    }],
  }

  const baseOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { size: 11 }, callback: (v: number | string) => fmt(Number(v), currency) },
      },
    },
  }

  // ── Smart insights ──
  const topCat     = catBreakdown[0]
  const topCatName = topCat ? (labels[topCat[0]] || topCat[0]) : ''
  const topCatPct  = topCat && totalExpenses > 0 ? Math.round((topCat[1] / totalExpenses) * 100) : 0

  const insights: { icon: string; text: string }[] = []
  if (expenseChange !== null) {
    if (expenseChange > 10)
      insights.push({ icon: '⚠️', text: t(`Spending is up ${expenseChange}% vs last month. Review your top categories.`, `Los gastos subieron ${expenseChange}% vs el mes anterior.`) })
    else if (expenseChange < -10)
      insights.push({ icon: '🎉', text: t(`Spending is down ${Math.abs(expenseChange)}% vs last month. Great control!`, `Los gastos bajaron ${Math.abs(expenseChange)}% vs el mes anterior. ¡Buen control!`) })
  }
  if (savingsRate >= 20)
    insights.push({ icon: '🏆', text: t(`Savings rate is ${savingsRate}% — excellent! The goal is 20%.`, `Tasa de ahorro: ${savingsRate}% — ¡excelente! La meta es el 20%.`) })
  else if (savingsRate > 0 && currentIncome > 0)
    insights.push({ icon: '💡', text: t(`Savings rate is ${savingsRate}%. Reduce ${topCatName} spending to reach the 20% goal.`, `Tasa de ahorro: ${savingsRate}%. Reduce gastos en ${topCatName} para llegar al 20%.`) })
  if (topCat && topCatPct > 50)
    insights.push({ icon: '🔍', text: t(`${topCatName} accounts for ${topCatPct}% of your expenses this month.`, `${topCatName} representa el ${topCatPct}% de tus gastos este mes.`) })
  if (avgMonthlyExpenses > 0 && currentExpenses > 0) {
    const diff = currentExpenses - avgMonthlyExpenses
    insights.push({ icon: '📊', text: t(`Spending is ${diff >= 0 ? '+' : ''}${fmt(diff, currency)} vs your 6-month average of ${fmt(avgMonthlyExpenses, currency)}.`, `Gasto ${diff >= 0 ? '+' : ''}${fmt(diff, currency)} vs tu promedio de 6 meses (${fmt(avgMonthlyExpenses, currency)}).`) })
  }
  if (insights.length === 0)
    insights.push({ icon: '📈', text: t('Add more transactions to unlock personalized monthly insights.', 'Agrega más transacciones para desbloquear insights personalizados.') })

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <h1>{t('Reports', 'Reportes')}</h1>
          <p>{t('Financial overview, trends, and monthly insights', 'Resumen financiero, tendencias e insights mensuales')}</p>
        </div>
        <div className="topbar-right">
          <div className="month-nav">
            <button className="month-nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
            <span className="month-nav-label">{monthName}</span>
            <button className="month-nav-btn" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
          </div>
        </div>
      </div>

      <TipBanner
        pageKey="reports"
        en="Tip: Use the month arrows to compare your income and spending across different months."
        es="Tip: Usa las flechas de mes para comparar tus ingresos y gastos en diferentes meses."
      />

      {/* ── KPI cards ── */}
      <div className="cards-grid" style={{ marginBottom: 24 }}>
        <div className="dash-card">
          <div className="card-icon icon-income">💰</div>
          <div className="card-label">{t('Income', 'Ingresos')}</div>
          <div className="card-value" style={{ color: 'var(--income)' }}>{fmt(currentIncome, currency)}</div>
          <div className="card-sub">
            {incomeChange !== null
              ? <span style={{ color: incomeChange >= 0 ? 'var(--income)' : 'var(--expense)' }}>
                  {incomeChange >= 0 ? '↑' : '↓'} {Math.abs(incomeChange)}% {t('vs last month', 'vs mes anterior')}
                </span>
              : monthName}
          </div>
        </div>
        <div className="dash-card">
          <div className="card-icon icon-expense">💸</div>
          <div className="card-label">{t('Expenses', 'Gastos')}</div>
          <div className="card-value" style={{ color: 'var(--expense)' }}>{fmt(currentExpenses, currency)}</div>
          <div className="card-sub">
            {expenseChange !== null
              ? <span style={{ color: expenseChange <= 0 ? 'var(--income)' : 'var(--expense)' }}>
                  {expenseChange <= 0 ? '↓' : '↑'} {Math.abs(expenseChange)}% {t('vs last month', 'vs mes anterior')}
                </span>
              : monthName}
          </div>
        </div>
        <div className="dash-card">
          <div className="card-icon icon-savings">🎯</div>
          <div className="card-label">{t('Savings rate', 'Tasa de ahorro')}</div>
          <div className="card-value" style={{ color: savingsRate >= 20 ? 'var(--income)' : savingsRate > 0 ? '#F59E0B' : 'var(--text3)' }}>
            {savingsRate}%
          </div>
          <div className="card-sub">
            {savingsRate >= 20
              ? t('🏆 Excellent!', '🏆 ¡Excelente!')
              : savingsRate > 0
                ? t('Goal: 20%', 'Meta: 20%')
                : t('No surplus yet', 'Sin superávit aún')}
          </div>
        </div>
        <div className="dash-card">
          <div className="card-icon">📊</div>
          <div className="card-label">{t('6-mo avg spend', 'Prom. gasto 6m')}</div>
          <div className="card-value">{fmt(avgMonthlyExpenses, currency)}</div>
          <div className="card-sub">
            {avgMonthlyExpenses > 0 && currentExpenses > 0
              ? <span style={{ color: currentExpenses <= avgMonthlyExpenses ? 'var(--income)' : 'var(--expense)' }}>
                  {currentExpenses <= avgMonthlyExpenses ? '↓' : '↑'} {t('vs your average', 'vs tu promedio')}
                </span>
              : t('Last 6 months', 'Últimos 6 meses')
            }
          </div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="two-col" style={{ marginBottom: 24 }}>
        <div className="dash-card">
          <div className="section-header">
            <div>
              <div className="section-title">{t('Income vs Expenses', 'Ingresos vs Gastos')}</div>
              <div className="section-subtitle">{t('Last 6 months comparison', 'Comparación últimos 6 meses')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(16,185,129,0.7)', display: 'inline-block' }} />
              {t('Income', 'Ingresos')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(239,68,68,0.6)', display: 'inline-block' }} />
              {t('Expenses', 'Gastos')}
            </span>
          </div>
          <div style={{ height: 200 }}>
            <Bar data={barData} options={baseOpts as never} />
          </div>
        </div>

        <div className="dash-card">
          <div className="section-header">
            <div>
              <div className="section-title">{t('Net savings trend', 'Tendencia de ahorro')}</div>
              <div className="section-subtitle">{t('Monthly income minus expenses', 'Ingresos − gastos por mes')}</div>
            </div>
          </div>
          <div style={{ height: 228 }}>
            <Line data={lineData} options={baseOpts as never} />
          </div>
        </div>
      </div>

      {/* ── Monthly insights ── */}
      <div className="dash-card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div>
            <div className="section-title">{t('Monthly insights', 'Insights del mes')}</div>
            <div className="section-subtitle">{monthName}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {insights.map((ins, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '12px 14px', borderRadius: 10,
              background: 'var(--bg)', border: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{ins.icon}</span>
              <span style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.55 }}>{ins.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Category breakdown ── */}
      <div className="dash-card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div>
            <div className="section-title">{t('Spending by category', 'Gastos por categoría')}</div>
            <div className="section-subtitle">{monthName}</div>
          </div>
          {totalExpenses > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>
              {t('Total', 'Total')}: <strong style={{ color: 'var(--text)' }}>{fmt(totalExpenses, currency)}</strong>
            </span>
          )}
        </div>
        {catBreakdown.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">📊</span>
            <h3>{t('No expense data yet', 'Sin datos de gastos aún')}</h3>
            <p>{t('Add some expenses to see a breakdown by category.', 'Agrega gastos para ver el desglose por categoría.')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {catBreakdown.map(([cat, amount]) => {
              const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{CAT_ICONS[cat] || '📦'}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{labels[cat] || cat}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: 'var(--text3)',
                        background: 'var(--bg)', padding: '2px 8px', borderRadius: 20,
                      }}>{pct.toFixed(0)}%</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', minWidth: 72, textAlign: 'right' }}>
                        {fmt(amount, currency)}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3, width: `${pct}%`,
                      background: 'linear-gradient(90deg, var(--accent), var(--glow))',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Browse by date ── */}
      <div className="dash-card">
        <div className="section-header">
          <div>
            <div className="section-title">📅 {t('Browse by date', 'Buscar por fecha')}</div>
            <div className="section-subtitle">{t('Pick a day to see all its transactions', 'Selecciona un día para ver sus transacciones')}</div>
          </div>
          {selectedDate && (
            <button onClick={() => setSelectedDate('')} style={{
              fontSize: 12, color: 'var(--text3)', background: 'none',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {t('Clear', 'Limpiar')}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: selectedDate ? 16 : 0 }}>
          <input
            type="date" value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              padding: '9px 14px', borderRadius: 10,
              border: '1.5px solid var(--border2)', background: 'var(--bg)',
              color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
              cursor: 'pointer', outline: 'none',
            }}
          />
          {selectedDate && (
            <div style={{ display: 'flex', gap: 16 }}>
              {dayIncome   > 0 && <span style={{ fontSize: 13, color: 'var(--income)',  fontWeight: 600 }}>+{fmt(dayIncome,   currency)}</span>}
              {dayExpenses > 0 && <span style={{ fontSize: 13, color: 'var(--expense)', fontWeight: 600 }}>−{fmt(dayExpenses, currency)}</span>}
              {dayTxs.length === 0 && <span style={{ fontSize: 13, color: 'var(--text3)' }}>{t('No transactions on this day', 'Sin transacciones este día')}</span>}
            </div>
          )}
        </div>
        {selectedDate && dayTxs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {dayTxs.map(tx => (
              <div key={tx.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 10, background: 'var(--bg)', marginBottom: 2,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, fontSize: 16, flexShrink: 0,
                  background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {CAT_ICONS[tx.category] || '📦'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.description || 'Transaction'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{labels[tx.category] || tx.category}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)', flexShrink: 0 }}>
                  {tx.type === 'income' ? '+' : '−'}{fmt(Number(tx.amount), currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
