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

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
)

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export function ReportsPage() {
  const { transactions, lang, currency, viewMonth, viewYear, changeMonth } = useDashboard()
  const [selectedDate, setSelectedDate] = useState('')

  const t = (en: string, es: string) => lang === 'es' ? es : en
  const MONTHS = lang === 'es' ? MONTHS_ES : MONTHS_EN

  // Last 6 months data — derived from real transactions
  const last6 = useMemo(() => {
    const result = []
    for (let i = 5; i >= 0; i--) {
      let m = viewMonth - i
      let y = viewYear
      while (m < 0) { m += 12; y-- }
      const txs = transactions.filter(tx => {
        const d = new Date(tx.date)
        return d.getMonth() === m && d.getFullYear() === y
      })
      const income   = txs.filter(tx => tx.type === 'income').reduce((s, tx) => s + Number(tx.amount), 0)
      const expenses = txs.filter(tx => tx.type === 'expense').reduce((s, tx) => s + Number(tx.amount), 0)
      result.push({ label: MONTHS[m], income, expenses, month: m, year: y })
    }
    return result
  }, [transactions, viewMonth, viewYear, MONTHS])

  // Current month spending by category
  const catBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    transactions.filter(tx => {
      const d = new Date(tx.date)
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear && tx.type === 'expense'
    }).forEach(tx => {
      map[tx.category] = (map[tx.category] || 0) + Number(tx.amount)
    })
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
  }, [transactions, viewMonth, viewYear])

  const totalExpenses = catBreakdown.reduce((s, [, v]) => s + v, 0)

  const currentMonthTxs = useMemo(() => transactions.filter(tx => {
    const d = new Date(tx.date)
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear
  }), [transactions, viewMonth, viewYear])

  const currentIncome   = currentMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const currentExpenses = currentMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  // Daily transactions for the selected date
  const dayTxs = useMemo(() => {
    if (!selectedDate) return []
    return transactions
      .filter(tx => tx.date === selectedDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, selectedDate])

  const dayIncome   = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const dayExpenses = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString(
    lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', year: 'numeric' }
  )

  const barData = {
    labels: last6.map(d => d.label),
    datasets: [
      {
        label: t('Income', 'Ingresos'),
        data: last6.map(d => d.income),
        backgroundColor: 'rgba(16,185,129,0.7)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: t('Expenses', 'Gastos'),
        data: last6.map(d => d.expenses),
        backgroundColor: 'rgba(239,68,68,0.6)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }

  const lineData = {
    labels: last6.map(d => d.label),
    datasets: [
      {
        label: t('Saved', 'Ahorrado'),
        data: last6.map(d => d.income - d.expenses),
        borderColor: '#2E8B57',
        backgroundColor: 'rgba(46,139,87,0.08)',
        tension: 0.4, fill: true,
        pointBackgroundColor: '#2E8B57',
        pointRadius: 4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 12 } } },
      y: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          font: { size: 11 },
          callback: (v: number | string) => fmt(Number(v), currency),
        },
      },
    },
  }

  const lineOptions = { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }
  const labels = lang === 'es' ? CAT_LABELS_ES : CAT_LABELS_EN

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <h1>{t('Reports', 'Reportes')}</h1>
          <p>{t('Your financial overview and trends', 'Resumen financiero y tendencias')}</p>
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

      {/* Summary cards */}
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <div className="dash-card">
          <div className="card-icon icon-income">💰</div>
          <div className="card-label">{t('Income', 'Ingresos')}</div>
          <div className="card-value" style={{ color: 'var(--income)' }}>{fmt(currentIncome, currency)}</div>
          <div className="card-sub">{monthName}</div>
        </div>
        <div className="dash-card">
          <div className="card-icon icon-expense">💸</div>
          <div className="card-label">{t('Expenses', 'Gastos')}</div>
          <div className="card-value" style={{ color: 'var(--expense)' }}>{fmt(currentExpenses, currency)}</div>
          <div className="card-sub">{monthName}</div>
        </div>
        <div className="dash-card">
          <div className="card-icon icon-savings">🏦</div>
          <div className="card-label">{t('Saved', 'Ahorrado')}</div>
          <div className="card-value" style={{ color: currentIncome - currentExpenses >= 0 ? 'var(--income)' : 'var(--expense)' }}>
            {fmt(Math.abs(currentIncome - currentExpenses), currency)}
          </div>
          <div className="card-sub">
            {currentIncome - currentExpenses >= 0 ? t('surplus', 'superávit') : t('deficit', 'déficit')}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="two-col" style={{ marginBottom: 24 }}>
        <div className="dash-card">
          <div className="section-header">
            <span className="section-title">{t('Income vs Expenses', 'Ingresos vs Gastos')} — {t('last 6 months', 'últimos 6 meses')}</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(16,185,129,0.7)', display: 'inline-block' }} />
              {t('Income', 'Ingresos')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(239,68,68,0.6)', display: 'inline-block' }} />
              {t('Expenses', 'Gastos')}
            </span>
          </div>
          <div style={{ height: 200 }}>
            <Bar data={barData} options={chartOptions as never} />
          </div>
        </div>

        <div className="dash-card">
          <div className="section-header">
            <span className="section-title">{t('Monthly savings', 'Ahorro mensual')}</span>
          </div>
          <div style={{ height: 200, marginTop: 36 }}>
            <Line data={lineData} options={lineOptions as never} />
          </div>
        </div>
      </div>

      {/* Date picker — daily transaction view */}
      <div className="dash-card" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <span className="section-title">📅 {t('Day view', 'Vista por día')}</span>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              style={{ fontSize: 12, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {t('Clear', 'Limpiar')}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: selectedDate ? 16 : 0 }}>
          <input
            type="date"
            value={selectedDate}
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
              <span style={{ fontSize: 13, color: 'var(--income)', fontWeight: 600 }}>
                +{fmt(dayIncome, currency)}
              </span>
              <span style={{ fontSize: 13, color: 'var(--expense)', fontWeight: 600 }}>
                -{fmt(dayExpenses, currency)}
              </span>
            </div>
          )}
        </div>

        {selectedDate && (
          dayTxs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: 14 }}>
              {t('No transactions on this date', 'Sin transacciones en esta fecha')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {dayTxs.map(tx => (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 10,
                  background: 'var(--bg)', marginBottom: 2,
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
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                      {labels[tx.category] || tx.category}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color: tx.type === 'income' ? 'var(--income)' : 'var(--expense)',
                    flexShrink: 0,
                  }}>
                    {tx.type === 'income' ? '+' : '-'}{fmt(Number(tx.amount), currency)}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Category breakdown */}
      <div className="dash-card">
        <div className="section-header">
          <span className="section-title">{t('Spending by category', 'Gastos por categoría')} — {monthName}</span>
        </div>

        {catBreakdown.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">📊</span>
            <h3>{t('No expense data', 'Sin datos de gastos')}</h3>
            <p>{t('Add some expenses to see your breakdown.', 'Agrega gastos para ver el desglose.')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {catBreakdown.map(([cat, amount]) => {
              const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{CAT_ICONS[cat] || '📦'}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                        {labels[cat] || cat}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>{pct.toFixed(1)}%</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{fmt(amount, currency)}</span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${pct}%`, background: 'var(--accent)',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
