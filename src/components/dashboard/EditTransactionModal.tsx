import { useState, useEffect, useRef } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'
import { sb } from '../../lib/supabase'
import { CAT_OPTIONS, autoCategory } from '../../lib/categories'
import type { Transaction } from '../../types/dashboard'

interface Props {
  open: boolean
  tx: Transaction | null
  onClose: () => void
}

export function EditTransactionModal({ open, tx, onClose }: Props) {
  const { user, lang, reloadData, showToast } = useDashboard()
  const [type, setType]         = useState<'expense' | 'income'>('expense')
  const [amount, setAmount]     = useState('')
  const [desc, setDesc]         = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate]         = useState('')
  const [saving, setSaving]     = useState(false)
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null)

  const t = (en: string, es: string) => lang === 'es' ? es : en

  // Populate form when tx changes
  useEffect(() => {
    if (tx) {
      setType(tx.type)
      setAmount(String(tx.amount))
      setDesc(tx.description || '')
      setCategory(tx.category || '')
      setDate(tx.date)
    }
  }, [tx])

  // Auto-categorize on description change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (desc.trim().length >= 2) {
        const cat = autoCategory(desc)
        if (cat && cat !== category) setCategory(cat)
      }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desc])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tx || !amount || Number(amount) <= 0) return
    setSaving(true)
    try {
      const { error } = await sb.from('transactions').update({
        type,
        amount: Number(amount),
        description: desc.trim() || null,
        category: category || 'other',
        date,
      }).eq('id', tx.id).eq('user_id', user.id)
      if (error) throw error
      showToast(t('✅ Transaction updated!', '✅ ¡Transacción actualizada!'))
      await reloadData()
      onClose()
    } catch (err) {
      console.error('Edit transaction error:', err)
      showToast(t('❌ Error updating transaction', '❌ Error al actualizar'))
    } finally {
      setSaving(false)
    }
  }

  if (!open || !tx) return null

  const catOptions = type === 'income'
    ? CAT_OPTIONS.filter(c => ['salary', 'freelance', 'savings', 'other'].includes(c.value))
    : CAT_OPTIONS.filter(c => !['salary', 'freelance'].includes(c.value))

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">{t('Edit transaction', 'Editar transacción')}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

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
            <input
              type="text" className="form-input"
              placeholder={t('What was it for?', '¿Para qué fue?')}
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
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
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t('Cancel', 'Cancelar')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t('Saving...', 'Guardando...') : t('Save changes', 'Guardar cambios')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
