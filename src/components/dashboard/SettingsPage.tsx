import { useState, useRef } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'
import { sb } from '../../lib/supabase'
import { CURRENCIES } from '../../lib/format'
import type { Currency } from '../../types/dashboard'

// ── helpers ──────────────────────────────────────────────────────────────────
function resizeImage(file: File, maxPx = 256): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.88))
    }
    img.src = url
  })
}

// ── Row component ─────────────────────────────────────────────────────────────
function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dash-card" style={{ marginBottom: 16, padding: '20px 24px' }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text3)',
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function SettingsPage() {
  const { user, lang, setLang, currency, setCurrency, transactions, showToast, reloadData } = useDashboard()

  const avatarUrl: string = user.user_metadata?.avatar_url || ''
  const rawName   = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '?'
  const initials  = rawName.slice(0, 2).toUpperCase()
  const email     = user.email || ''

  // ── local state ──
  const [displayName, setDisplayName] = useState(rawName)
  const [editingName, setEditingName] = useState(false)
  const [savingName,  setSavingName]  = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [localAvatar, setLocalAvatar] = useState(avatarUrl)
  const [delConfirm, setDelConfirm]   = useState<null | 'data' | 'account'>(null)
  const [deleting, setDeleting]       = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const t = (en: string, es: string) => lang === 'es' ? es : en

  // ── handlers ──
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const dataUrl = await resizeImage(file, 256)
      await sb.auth.updateUser({ data: { avatar_url: dataUrl } })
      setLocalAvatar(dataUrl)
      showToast(t('✅ Photo updated', '✅ Foto actualizada'))
    } catch {
      showToast(t('❌ Failed to upload photo', '❌ Error al subir foto'))
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  async function handleSaveName() {
    if (!displayName.trim() || displayName === rawName) { setEditingName(false); return }
    setSavingName(true)
    try {
      await sb.auth.updateUser({ data: { full_name: displayName.trim() } })
      showToast(t('✅ Name updated', '✅ Nombre actualizado'))
      setEditingName(false)
    } catch {
      showToast(t('❌ Failed to update name', '❌ Error al actualizar nombre'))
    } finally {
      setSavingName(false)
    }
  }

  async function handleResetPassword() {
    await sb.auth.resetPasswordForEmail(email)
    showToast(t('📧 Reset email sent', '📧 Email de restablecimiento enviado'))
  }

  function handleExportCSV() {
    if (!transactions.length) {
      showToast(t('No transactions to export', 'No hay transacciones para exportar'))
      return
    }
    const header = 'Date,Type,Category,Description,Amount'
    const rows   = transactions.map(tx =>
      `${tx.date},${tx.type},${tx.category},"${tx.description.replace(/"/g, '""')}",${tx.amount}`
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'weup-transactions.csv' })
    a.click()
    URL.revokeObjectURL(url)
    showToast(t('✅ Exported!', '✅ ¡Exportado!'))
  }

  async function handleClearData() {
    setDeleting(true)
    try {
      await sb.from('transactions').delete().eq('user_id', user.id)
      await reloadData()
      showToast(t('✅ All transactions deleted', '✅ Todas las transacciones eliminadas'))
      setDelConfirm(null)
    } catch {
      showToast(t('❌ Error', '❌ Error'))
    } finally {
      setDeleting(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await sb.from('transactions').delete().eq('user_id', user.id)
      await sb.from('profiles').delete().eq('id', user.id)
      await sb.auth.signOut()
      window.location.href = '/'
    } catch {
      showToast(t('❌ Error deleting account', '❌ Error al eliminar cuenta'))
      setDeleting(false)
    }
  }

  // ── render ──
  const btnStyle: React.CSSProperties = {
    padding: '7px 16px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--card)',
    color: 'var(--text2)', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  }

  const accentBtnStyle: React.CSSProperties = {
    ...btnStyle,
    background: 'var(--accent)', border: 'none',
    color: '#0D2218', fontWeight: 600,
  }

  const dangerBtnStyle: React.CSSProperties = {
    ...btnStyle,
    border: '1px solid rgba(239,68,68,0.4)',
    color: 'var(--expense)', background: 'rgba(239,68,68,0.06)',
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="topbar">
        <div className="topbar-left">
          <h1>{t('Settings', 'Ajustes')}</h1>
          <p>{t('Manage your account and preferences', 'Administra tu cuenta y preferencias')}</p>
        </div>
      </div>

      {/* ── Profile ── */}
      <Section title={t('Profile', 'Perfil')}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0 18px', borderBottom: '1px solid var(--border)' }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 64, height: 64, borderRadius: '50%', position: 'relative',
              cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
              background: localAvatar ? 'transparent' : 'linear-gradient(135deg, #1A5C3A, #2E8B57)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {localAvatar
              ? <img src={localAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{initials}</span>
            }
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: uploadingAvatar ? 1 : 0, transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => !uploadingAvatar && (e.currentTarget.style.opacity = '0')}
            >
              <span style={{ fontSize: 18 }}>{uploadingAvatar ? '⏳' : '📷'}</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{displayName}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{email}</div>
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6, cursor: 'pointer' }}
              onClick={() => fileRef.current?.click()}>
              {uploadingAvatar ? t('Uploading...', 'Subiendo...') : t('Change photo', 'Cambiar foto')}
            </div>
          </div>
        </div>

        {/* Name */}
        <Row label={t('Display name', 'Nombre')} sub={t('Shown across the dashboard', 'Visible en el panel')}>
          {editingName ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                autoFocus
                style={{
                  padding: '6px 10px', borderRadius: 8, fontSize: 13,
                  border: '1.5px solid var(--accent)', outline: 'none',
                  background: 'var(--bg)', color: 'var(--text)', fontFamily: 'inherit',
                  width: 140,
                }}
              />
              <button style={accentBtnStyle} onClick={handleSaveName} disabled={savingName}>
                {savingName ? '...' : t('Save', 'Guardar')}
              </button>
              <button style={btnStyle} onClick={() => { setEditingName(false); setDisplayName(rawName) }}>
                {t('Cancel', 'Cancelar')}
              </button>
            </div>
          ) : (
            <button style={btnStyle} onClick={() => setEditingName(true)}>
              {t('Edit', 'Editar')}
            </button>
          )}
        </Row>

        {/* Email */}
        <Row label={t('Email', 'Correo')} sub={email}>
          <span style={{ fontSize: 12, color: 'var(--text3)', padding: '4px 10px', background: 'var(--bg)', borderRadius: 6 }}>
            {t('Read only', 'Solo lectura')}
          </span>
        </Row>

        {/* Password */}
        <div style={{ padding: '14px 0 0' }}>
          <Row label={t('Password', 'Contraseña')} sub={t('Send a reset link to your email', 'Enviar enlace de cambio a tu correo')}>
            <button style={btnStyle} onClick={handleResetPassword}>
              {t('Reset password', 'Restablecer contraseña')}
            </button>
          </Row>
        </div>
      </Section>

      {/* ── Preferences ── */}
      <Section title={t('Preferences', 'Preferencias')}>
        {/* Language */}
        <Row label={`🌐 ${t('Language', 'Idioma')}`} sub={t('App display language', 'Idioma de la aplicación')}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['en', 'es'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                ...btnStyle,
                border: lang === l ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: lang === l ? 'rgba(46,139,87,0.08)' : 'var(--card)',
                color: lang === l ? 'var(--accent)' : 'var(--text2)',
                fontWeight: lang === l ? 600 : 400,
              }}>
                {l === 'en' ? '🇺🇸 EN' : '🇨🇴 ES'}
              </button>
            ))}
          </div>
        </Row>

        {/* Currency */}
        <div style={{ padding: '14px 0 0' }}>
          <Row label={`💵 ${t('Currency', 'Moneda')}`} sub={t('Used for all amounts in the app', 'Se usa en todos los montos de la app')}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(Object.entries(CURRENCIES) as [Currency, typeof CURRENCIES[Currency]][]).map(([code, info]) => (
                <button key={code} onClick={() => setCurrency(code)} style={{
                  ...btnStyle,
                  border: currency === code ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: currency === code ? 'rgba(46,139,87,0.08)' : 'var(--card)',
                  color: currency === code ? 'var(--accent)' : 'var(--text2)',
                  fontWeight: currency === code ? 600 : 400,
                  fontSize: 12,
                }}>
                  {info.flag} {code}
                </button>
              ))}
            </div>
          </Row>
        </div>
      </Section>

      {/* ── Data ── */}
      <Section title={t('Data', 'Datos')}>
        <Row
          label={t('Export transactions', 'Exportar transacciones')}
          sub={t(`${transactions.length} transactions as CSV`, `${transactions.length} transacciones en CSV`)}
        >
          <button style={btnStyle} onClick={handleExportCSV}>
            ⬇ {t('Download CSV', 'Descargar CSV')}
          </button>
        </Row>
      </Section>

      {/* ── Session ── */}
      <Section title={t('Session', 'Sesión')}>
        <Row label={t('Sign out', 'Cerrar sesión')} sub={t('You will be redirected to the home page', 'Serás redirigido al inicio')}>
          <button style={btnStyle} onClick={() => sb.auth.signOut()}>
            {t('Sign out', 'Cerrar sesión')}
          </button>
        </Row>
      </Section>

      {/* ── Danger Zone ── */}
      <div className="dash-card" style={{
        marginBottom: 24, padding: '20px 24px',
        border: '1px solid rgba(239,68,68,0.2)',
        background: 'rgba(239,68,68,0.02)',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: 'var(--expense)',
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
        }}>
          ⚠️ {t('Danger zone', 'Zona de peligro')}
        </div>

        {/* Clear all transactions */}
        <div style={{ padding: '14px 0', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                {t('Clear transaction history', 'Limpiar historial de transacciones')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                {t('Delete all transactions. Your account stays active.', 'Elimina todas las transacciones. Tu cuenta se mantiene activa.')}
              </div>
            </div>
            {delConfirm === 'data' ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{t('Sure?', '¿Seguro?')}</span>
                <button style={btnStyle} onClick={() => setDelConfirm(null)}>{t('Cancel', 'Cancelar')}</button>
                <button
                  style={{ ...btnStyle, background: 'var(--expense)', border: 'none', color: '#fff', fontWeight: 600 }}
                  onClick={handleClearData} disabled={deleting}
                >
                  {deleting ? '...' : t('Yes, clear', 'Sí, limpiar')}
                </button>
              </div>
            ) : (
              <button style={dangerBtnStyle} onClick={() => setDelConfirm('data')} disabled={delConfirm === 'account'}>
                {t('Clear data', 'Limpiar datos')}
              </button>
            )}
          </div>
        </div>

        {/* Delete account */}
        <div style={{ paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                {t('Delete account', 'Eliminar cuenta')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                {t('Permanently delete your account and all data. Cannot be undone.', 'Elimina permanentemente tu cuenta y todos los datos. No se puede deshacer.')}
              </div>
            </div>
            {delConfirm === 'account' ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{t('Sure?', '¿Seguro?')}</span>
                <button style={btnStyle} onClick={() => setDelConfirm(null)}>{t('Cancel', 'Cancelar')}</button>
                <button
                  style={{ ...btnStyle, background: 'var(--expense)', border: 'none', color: '#fff', fontWeight: 600 }}
                  onClick={handleDeleteAccount} disabled={deleting}
                >
                  {deleting ? t('Deleting...', 'Eliminando...') : t('Yes, delete', 'Sí, eliminar')}
                </button>
              </div>
            ) : (
              <button style={dangerBtnStyle} onClick={() => setDelConfirm('account')} disabled={delConfirm === 'data'}>
                {t('Delete account', 'Eliminar cuenta')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
