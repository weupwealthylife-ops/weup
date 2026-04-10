import { useState, useEffect } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'
import { sb } from '../../lib/supabase'
import { BUDGET_CATS } from '../../lib/categories'

interface Props {
  open: boolean
  onClose: () => void
}

export function BudgetModal({ open, onClose }: Props) {
  const { user, budgets, setBudgets, lang, showToast } = useDashboard()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const t = (en: string, es: string) => lang === 'es' ? es : en

  // Sync local state from context budgets
  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {}
      for (const cat of BUDGET_CATS) {
        init[cat.key] = budgets[cat.key] != null ? String(budgets[cat.key]) : ''
      }
      setValues(init)
    }
  }, [open, budgets])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const newBudgets: Record<string, number> = {}
      for (const [k, v] of Object.entries(values)) {
        const n = parseFloat(v)
        if (!isNaN(n) && n >= 0) newBudgets[k] = n
      }
      await sb.from('profiles').upsert({ id: user.id, budgets: newBudgets })
      setBudgets(newBudgets)
      showToast(t('✅ Budgets saved!', '✅ ¡Presupuestos guardados!'))
      onClose()
    } catch {
      showToast(t('❌ Error saving budgets', '❌ Error al guardar'))
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{t('Edit budgets', 'Editar presupuestos')}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
          {t('Set monthly spending limits per category.', 'Establece límites de gasto mensual por categoría.')}
        </p>

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {BUDGET_CATS.map(cat => (
              <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  {cat.icon}
                </span>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1, minWidth: 0 }}>
                  {lang === 'es' ? cat.es : cat.en}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 14, color: 'var(--text3)' }}>$</span>
                  <input
                    type="number" min="0" step="10"
                    className="form-input"
                    style={{ width: 110, textAlign: 'right' }}
                    placeholder="0"
                    value={values[cat.key] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [cat.key]: e.target.value }))}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="modal-footer" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t('Cancel', 'Cancelar')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t('Saving...', 'Guardando...') : t('Save budgets', 'Guardar presupuestos')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
