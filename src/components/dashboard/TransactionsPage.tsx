import { useState, useMemo } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'
import { fmt } from '../../lib/format'
import { CAT_ICONS, CAT_COLORS, CAT_LABELS_EN, CAT_LABELS_ES } from '../../lib/categories'
import { sb } from '../../lib/supabase'
import { TipBanner } from './TipBanner'
import type { Transaction } from '../../types/dashboard'

function TxRow({ tx, lang, currency, onEdit, onDelete }: {
  tx: Transaction; lang: 'en' | 'es'; currency: 'USD' | 'COP' | 'MXN'
  onEdit: (tx: Transaction) => void
  onDelete: (id: string) => void
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
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setConfirm(false)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={() => onDelete(tx.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Delete</button>
          </div>
        </div>
      )}
    </>
  )
}

export function TransactionsPage() {
  const { transactions, lang, currency, openAddModal, openEditModal, reloadData, showToast, user, viewMonth, viewYear, changeMonth } = useDashboard()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [activeCatTab, setActiveCatTab] = useState('')

  const t = (en: string, es: string) => lang === 'es' ? es : en

  const monthTxs = useMemo(() => transactions.filter(tx => {
    const [y, m] = tx.date.split('-').map(Number)
    return (m - 1) === viewMonth && y === viewYear
  }), [transactions, viewMonth, viewYear])

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    const cat = catFilter || activeCatTab
    return monthTxs.filter(tx =>
      (!s || (tx.description || '').toLowerCase().includes(s)) &&
      (!cat || tx.category === cat) &&
      (!typeFilter || tx.type === typeFilter)
    )
  }, [monthTxs, search, catFilter, activeCatTab, typeFilter])

  async function handleDelete(id: string) {
    const { error } = await sb.from('transactions').delete().eq('id', id).eq('user_id', user.id)
    if (error) { console.error('Delete error:', error); showToast(t('❌ Error deleting transaction', '❌ Error al eliminar')); return }
    showToast(t('🗑 Transaction deleted', '🗑 Transacción eliminada'))
    await reloadData()
  }

  const CAT_TABS = [
    { value: '', label: t('All', 'Todas') },
    { value: 'food', label: '🛒 Food' },
    { value: 'transport', label: '🚌 Transport' },
    { value: 'leisure', label: '🎬 Leisure' },
    { value: 'shopping', label: '🛍️ Shopping' },
    { value: 'salary', label: '💼 Income' },
  ]

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <h1>{t('Transactions', 'Transacciones')}</h1>
          <p>{t('Your full transaction history', 'Tu historial completo de transacciones')}</p>
        </div>
        <div className="topbar-right">
          <div className="month-nav">
            <button className="month-nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
            <span className="month-nav-label">
              {new Date(viewYear, viewMonth).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button className="month-nav-btn" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            {t('Add', 'Agregar')}
          </button>
        </div>
      </div>

      <TipBanner
        pageKey="transactions"
        en="Tip: Just type a description — AI auto-categorizes your transaction for you."
        es="Tip: Solo escribe una descripción — la IA categorizará tu transacción automáticamente."
      />

      <div className="dash-card">
        {/* Search + filters */}
        <div className="tx-toolbar">
          <div className="tx-search-wrap">
            <span className="tx-search-icon">🔍</span>
            <input
              type="text" className="tx-search"
              placeholder={t('Search transactions...', 'Buscar transacciones...')}
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="tx-filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">{t('All categories', 'Todas las categorías')}</option>
            <option value="food">🛒 Food</option>
            <option value="transport">🚌 Transport</option>
            <option value="housing">🏠 Housing</option>
            <option value="health">💊 Health</option>
            <option value="leisure">🎬 Leisure</option>
            <option value="shopping">🛍️ Shopping</option>
            <option value="education">📚 Education</option>
            <option value="subscriptions">📱 Subscriptions</option>
            <option value="salary">💼 Salary</option>
            <option value="freelance">💻 Freelance</option>
            <option value="savings">🏦 Savings</option>
            <option value="other">📦 Other</option>
          </select>
          <select className="tx-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">{t('All types', 'Todos los tipos')}</option>
            <option value="expense">💸 {t('Expenses', 'Gastos')}</option>
            <option value="income">💰 {t('Income', 'Ingresos')}</option>
          </select>
        </div>

        {/* Category tabs */}
        <div className="cat-tabs">
          {CAT_TABS.map(tab => (
            <button
              key={tab.value}
              className={`cat-tab${activeCatTab === tab.value ? ' active' : ''}`}
              onClick={() => setActiveCatTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        <div className="tx-list">
          {filtered.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">💳</span>
              <h3>{t('No transactions yet', 'Sin transacciones aún')}</h3>
              <p>{t('Tap the + button to log your first income or expense.', 'Toca el botón + para registrar tu primer movimiento.')}</p>
              <button className="empty-cta" onClick={openAddModal}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                {t('Add transaction', 'Agregar transacción')}
              </button>
            </div>
          ) : (
            filtered.map(tx => (
              <TxRow key={tx.id} tx={tx} lang={lang} currency={currency} onEdit={openEditModal} onDelete={handleDelete} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
