import { useState, useEffect, useRef } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'
import { sb } from '../../lib/supabase'
import { CAT_OPTIONS, autoCategory } from '../../lib/categories'

interface Props {
  open: boolean
  onClose: () => void
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const QUICK_DESCS: Record<string, string[]> = {
  expense: ['Uber','Netflix','Spotify','Groceries','Restaurant','Coffee','Amazon','Gym'],
  income:  ['Salary','Freelance','Bonus','Transfer','Dividend','Rental income'],
}

export function AddTransactionModal({ open, onClose }: Props) {
  const { user, plan, transactions, lang, reloadData, showToast } = useDashboard()

  // ── Free plan: count this month's transactions ──
  const now = new Date()
  const thisMonthCount = transactions.filter(t => {
    const [y, m] = t.date.split('-').map(Number)
    return (m - 1) === now.getMonth() && y === now.getFullYear()
  }).length
  const atFreeLimit = plan === 'free' && thisMonthCount >= 30

  const [type, setType]         = useState<'expense' | 'income'>('expense')
  const [amount, setAmount]     = useState('')
  const [desc, setDesc]         = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate]         = useState(today())
  const [saving, setSaving]     = useState(false)
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null)

  const t = (en: string, es: string) => lang === 'es' ? es : en

  // Auto-categorize on description change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (desc.trim().length >= 2) {
        const cat = autoCategory(desc)
        if (cat) setCategory(cat)
      }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [desc])

  function reset() {
    setType('expense'); setAmount(''); setDesc(''); setCategory(''); setDate(today())
  }

  function handleClose() { reset(); onClose() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    setSaving(true)
    try {
      const { error } = await sb.from('transactions').insert({
        user_id: user.id,
        type,
        amount: Number(amount),
        description: desc.trim() || null,
        category: category || 'other',
        date,
      })
      if (error) throw error
      showToast(t('✅ Transaction added!', '✅ ¡Transacción agregada!'))
      await reloadData()
      handleClose()
    } catch (err) {
      console.error('Add transaction error:', err)
      showToast(t('❌ Error saving transaction', '❌ Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const catOptions = type === 'income'
    ? CAT_OPTIONS.filter(c => ['salary', 'freelance', 'savings', 'other'].includes(c.value))
    : CAT_OPTIONS.filter(c => !['salary', 'freelance'].includes(c.value))

  return (
    <div className="overlay" onClick={handleClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">{t('Add transaction', 'Agregar transacción')}</div>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </div>

        {/* Free plan limit wall */}
        {atFreeLimit ? (
          <div style={{ textAlign: 'center', padding: '24px 8px 16px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              {t('Monthly limit reached', 'Límite mensual alcanzado')}
            </div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
              {t(
                `You've used all 30 free transactions this month. Upgrade to Pro for unlimited transactions and AI insights.`,
                `Usaste las 30 transacciones gratuitas de este mes. Mejora a Pro para transacciones ilimitadas e insights IA.`
              )}
            </div>
            <a
              href="/upgrade"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#3DA06A', color: '#fff', borderRadius: 12,
                padding: '12px 24px', fontSize: 15, fontWeight: 600,
                textDecoration: 'none', fontFamily: 'inherit',
              }}
            >
              ⭐ {t('Upgrade to Pro', 'Mejorar a Pro')}
            </a>
            <div style={{ marginTop: 12, fontSize: 12, color: '#94A3B8' }}>
              {t('Resets on the 1st of next month', 'Se reinicia el 1 del próximo mes')}
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit}>
          {/* Type toggle */}
          <div className="type-toggle">
            <button
              type="button"
              className={`type-btn${type === 'expense' ? ' active expense' : ''}`}
              onClick={() => setType('expense')}
            >
              💸 {t('Expense', 'Gasto')}
            </button>
            <button
              type="button"
              className={`type-btn${type === 'income' ? ' active income' : ''}`}
              onClick={() => setType('income')}
            >
              💰 {t('Income', 'Ingreso')}
            </button>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">{t('Amount', 'Monto')} *</label>
            <div className="amount-row">
              <span className="amount-currency">$</span>
              <input
                type="number" min="0.01" step="0.01" required
                className="amount-input"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">{t('Description', 'Descripción')}</label>
            {/* Quick-pick chips */}
            <div style={{ overflowX: 'auto', display: 'flex', gap: 6, paddingBottom: 4, scrollbarWidth: 'none', marginBottom: 6 }}>
              {(QUICK_DESCS[type] ?? []).map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setDesc(chip)}
                  style={{
                    background: '#F1F5F9', border: '1.5px solid rgba(15,23,42,0.14)',
                    borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', whiteSpace: 'nowrap', color: '#475569',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <input
              type="text" className="form-input"
              placeholder={t('What was it for?', '¿Para qué fue?')}
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
            {category && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(46,139,87,0.1)', border: '1px solid rgba(46,139,87,0.25)',
                  borderRadius: 20, padding: '4px 12px',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#2E8B57', letterSpacing: '0.06em' }}>AI</span>
                  <span style={{ fontSize: 12, color: '#475569' }}>
                    {t('Suggested category:', 'Categoría sugerida:')} <strong style={{ color: '#2E8B57' }}>{catOptions.find(c => c.value === category)?.label || category}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">{t('Category', 'Categoría')}</label>
            <select
              className="form-input form-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">{t('Select category', 'Seleccionar categoría')}</option>
              {catOptions.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label">{t('Date', 'Fecha')}</label>
            <input
              type="date" className="form-input"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={handleClose}>
              {t('Cancel', 'Cancelar')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t('Saving...', 'Guardando...') : t('Add transaction', 'Agregar')}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
