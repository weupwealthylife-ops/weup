import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { useDashboard } from '../../contexts/DashboardContext'
import { fmt } from '../../lib/format'
import { CAT_ICONS, CAT_LABELS_EN, CAT_LABELS_ES } from '../../lib/categories'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
)

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export function ReportsPage() {
  const { transactions, lang, viewMonth, viewYear, changeMonth } = useDashboard()

  const t = (en: string, es: string) => lang === 'es' ? es : en
  const MONTHS = lang === 'es' ? MONTHS_ES : MONTHS_EN

  // Last 6 months data
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
      result.push({ label: MONTHS[m], income, expenses })
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

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString(
    lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', year: 'numeric' }
  )

  // Bar chart data
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

  // Line chart data (savings = income - expenses)
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
          callback: (v: number | string) => '$' + Number(v).toLocaleString(),
        },
      },
    },
  }

  const lineOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: { display: false },
    },
  }

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
            <button className="month-nav-btn" onClick={() => changeMonth(-1)}>‹</button>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', padding: '0 8px', whiteSpace: 'nowrap' }}>
              {monthName}
            </span>
            <button className="month-nav-btn" onClick={() => changeMonth(1)}>›</button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <div className="dash-card">
          <div className="card-icon icon-income">💰</div>
          <div className="card-label">{t('Income', 'Ingresos')}</div>
          <div className="card-value" style={{ color: 'var(--income)' }}>{fmt(currentIncome)}</div>
          <div className="card-sub">{monthName}</div>
        </div>
        <div className="dash-card">
          <div className="card-icon icon-expense">💸</div>
          <div className="card-label">{t('Expenses', 'Gastos')}</div>
          <div className="card-value" style={{ color: 'var(--expense)' }}>{fmt(currentExpenses)}</div>
          <div className="card-sub">{monthName}</div>
        </div>
        <div className="dash-card">
          <div className="card-icon icon-savings">🏦</div>
          <div className="card-label">{t('Saved', 'Ahorrado')}</div>
          <div className="card-value" style={{ color: currentIncome - currentExpenses >= 0 ? 'var(--income)' : 'var(--expense)' }}>
            {fmt(Math.abs(currentIncome - currentExpenses))}
          </div>
          <div className="card-sub">
            {currentIncome - currentExpenses >= 0
              ? t('surplus', 'superávit')
              : t('deficit', 'déficit')}
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
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{fmt(amount)}</span>
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
