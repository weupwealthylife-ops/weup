import { useState } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'
import { sb } from '../../lib/supabase'

export function SettingsPage() {
  const { user, lang, setLang, showToast } = useDashboard()
  const [delConfirm, setDelConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const t = (en: string, es: string) => lang === 'es' ? es : en

  const name  = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '?'
  const initials = name.slice(0, 2).toUpperCase()
  const email = user.email || ''

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

  async function handleSignOut() {
    await sb.auth.signOut()
  }

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <h1>{t('Settings', 'Ajustes')}</h1>
          <p>{t('Manage your account and preferences', 'Administra tu cuenta y preferencias')}</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="dash-card" style={{ marginBottom: 20 }}>
        <div className="section-header" style={{ marginBottom: 20 }}>
          <span className="section-title">{t('Profile', 'Perfil')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1A5C3A, #2E8B57)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{name}</div>
            <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 3 }}>{email}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('Display name', 'Nombre')}
            </label>
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--bg)',
              fontSize: 14, color: 'var(--text2)',
            }}>
              {name}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('Email', 'Correo')}
            </label>
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--bg)',
              fontSize: 14, color: 'var(--text2)',
            }}>
              {email}
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="dash-card" style={{ marginBottom: 20 }}>
        <div className="section-header" style={{ marginBottom: 20 }}>
          <span className="section-title">{t('Preferences', 'Preferencias')}</span>
        </div>

        {/* Language toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>🌐 {t('Language', 'Idioma')}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
              {t('Choose your preferred language', 'Elige tu idioma preferido')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setLang('en')}
              style={{
                padding: '7px 16px', borderRadius: 8,
                border: lang === 'en' ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: lang === 'en' ? 'rgba(46,139,87,0.08)' : 'var(--card)',
                color: lang === 'en' ? 'var(--accent)' : 'var(--text2)',
                fontSize: 13, fontWeight: lang === 'en' ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              🇺🇸 EN
            </button>
            <button
              onClick={() => setLang('es')}
              style={{
                padding: '7px 16px', borderRadius: 8,
                border: lang === 'es' ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: lang === 'es' ? 'rgba(46,139,87,0.08)' : 'var(--card)',
                color: lang === 'es' ? 'var(--accent)' : 'var(--text2)',
                fontSize: 13, fontWeight: lang === 'es' ? 600 : 400,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              🇨🇴 ES
            </button>
          </div>
        </div>

        {/* Currency (read-only) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>💵 {t('Currency', 'Moneda')}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
              {t('All amounts in USD', 'Todos los montos en USD')}
            </div>
          </div>
          <div style={{
            padding: '7px 16px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg)',
            fontSize: 13, color: 'var(--text2)',
          }}>
            USD $
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="dash-card" style={{ marginBottom: 20 }}>
        <div className="section-header" style={{ marginBottom: 20 }}>
          <span className="section-title">{t('Session', 'Sesión')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{t('Sign out', 'Cerrar sesión')}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
              {t('You will be redirected to the login page', 'Serás redirigido al inicio de sesión')}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={handleSignOut}>
            {t('Sign out', 'Cerrar sesión')}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="dash-card" style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)' }}>
        <div className="section-header" style={{ marginBottom: 20 }}>
          <span className="section-title" style={{ color: 'var(--expense)' }}>⚠️ {t('Danger zone', 'Zona de peligro')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{t('Delete account', 'Eliminar cuenta')}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
              {t('Permanently delete your account and all data. This cannot be undone.', 'Elimina permanentemente tu cuenta y todos los datos. Esto no se puede deshacer.')}
            </div>
          </div>
          {!delConfirm ? (
            <button
              onClick={() => setDelConfirm(true)}
              style={{
                padding: '9px 18px', borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)',
                color: 'var(--expense)', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              {t('Delete account', 'Eliminar cuenta')}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>{t('Are you sure?', '¿Seguro?')}</span>
              <button
                onClick={() => setDelConfirm(false)}
                style={{
                  padding: '7px 14px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--card)',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t('Cancel', 'Cancelar')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{
                  padding: '7px 14px', borderRadius: 8,
                  border: 'none', background: 'var(--expense)',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? t('Deleting...', 'Eliminando...') : t('Yes, delete', 'Sí, eliminar')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
