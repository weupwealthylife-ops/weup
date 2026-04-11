import { ReactNode } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'
import { HomePage }        from './HomePage'
import { TransactionsPage } from './TransactionsPage'
import { BudgetsPage }     from './BudgetsPage'
import { ReportsPage }     from './ReportsPage'
import { SettingsPage }    from './SettingsPage'
import { sb } from '../../lib/supabase'

// ── SVG icons ────────────────────────────────────────────────────────────────
const HomeIcon = () => (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
)
const TxIcon = () => (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM2 9v7a2 2 0 002 2h12a2 2 0 002-2V9H2zm5 3h6v2H7v-2z" />
  </svg>
)
const AddIcon = () => (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
)
const BudgetIcon = () => (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
  </svg>
)
const ReportsIcon = () => (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
  </svg>
)
const SettingsIcon = () => (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
)
const UpgradeIcon = () => (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
  </svg>
)
const SignOutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
  </svg>
)

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar() {
  const { view, setView, user, openAddModal, lang } = useDashboard()
  const name     = user.user_metadata?.full_name?.split(' ')[0]
                || user.user_metadata?.name?.split(' ')[0]
                || user.email?.split('@')[0] || '?'
  const initials = name.slice(0, 2).toUpperCase()
  const email    = user.email || ''

  async function signOut() { await sb.auth.signOut() }

  const t = (en: string, es: string) => lang === 'es' ? es : en

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/Logo_WeUp.svg" alt="WeUp" style={{ height: 30, width: 30, objectFit: 'contain', borderRadius: 10 }} />
        <span>WeUp</span>
      </div>

      <div className="nav-section">
        <div className="nav-label">{t('Main', 'Principal')}</div>
        <button className={`nav-item${view === 'home' ? ' active' : ''}`} onClick={() => setView('home')}>
          <HomeIcon /> <span>{t('Home', 'Inicio')}</span>
        </button>
        <button className={`nav-item${view === 'transactions' ? ' active' : ''}`} onClick={() => setView('transactions')}>
          <TxIcon /> <span>{t('Transactions', 'Transacciones')}</span>
        </button>
        <button className="nav-item" onClick={openAddModal}>
          <AddIcon /> <span>{t('Add', 'Agregar')}</span>
        </button>
        <button className={`nav-item${view === 'budgets' ? ' active' : ''}`} onClick={() => setView('budgets')}>
          <BudgetIcon /> <span>{t('Budgets', 'Presupuestos')}</span>
        </button>
        <button className={`nav-item${view === 'reports' ? ' active' : ''}`} onClick={() => setView('reports')}>
          <ReportsIcon /> <span>{t('Reports', 'Reportes')}</span>
        </button>
      </div>

      <div className="nav-section">
        <div className="nav-label">{t('Account', 'Cuenta')}</div>
        <button className={`nav-item${view === 'settings' ? ' active' : ''}`} onClick={() => setView('settings')}>
          <SettingsIcon /> <span>{t('Settings', 'Ajustes')}</span>
        </button>
        <button className="nav-item upgrade" onClick={() => window.location.href = '/upgrade'}>
          <UpgradeIcon /> <span style={{ color: '#5FDC9A' }}>{t('Upgrade to Pro', 'Mejorar a Pro')}</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{name}</div>
            <div className="user-email">{email}</div>
          </div>
        </div>
        <button className="signout-btn" onClick={signOut}>
          <SignOutIcon /> <span>{t('Sign out', 'Cerrar sesión')}</span>
        </button>
      </div>
    </aside>
  )
}

// ── Mobile header ─────────────────────────────────────────────────────────────
function MobileHeader() {
  const { user, setView } = useDashboard()
  const name     = user.user_metadata?.full_name?.split(' ')[0]
                || user.user_metadata?.name?.split(' ')[0]
                || user.email?.split('@')[0] || '?'
  const initials = name.slice(0, 2).toUpperCase()
  return (
    <div className="mobile-header">
      <div className="mobile-header-logo">
        <img src="/Logo_WeUp.svg" alt="WeUp" style={{ height: 28, width: 28, objectFit: 'contain', borderRadius: 10 }} />
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#fff' }}>WeUp</span>
      </div>
      <div className="mobile-header-avatar" onClick={() => setView('settings')}>{initials}</div>
    </div>
  )
}

// ── Bottom nav ────────────────────────────────────────────────────────────────
function BottomNav() {
  const { view, setView, openAddModal, lang } = useDashboard()
  const t = (en: string, es: string) => lang === 'es' ? es : en
  return (
    <nav className="bottom-nav">
      <button className={`bottom-nav-item${view === 'home' ? ' active' : ''}`} onClick={() => setView('home')}>
        <span className="bn-icon">🏠</span><span>{t('Home', 'Inicio')}</span>
      </button>
      <button className={`bottom-nav-item${view === 'transactions' ? ' active' : ''}`} onClick={() => setView('transactions')}>
        <span className="bn-icon">💳</span><span>{t('Txns', 'Movs')}</span>
      </button>
      <button className="bottom-nav-item" onClick={openAddModal}>
        <div className="add-fab">+</div>
      </button>
      <button className={`bottom-nav-item${view === 'budgets' ? ' active' : ''}`} onClick={() => setView('budgets')}>
        <span className="bn-icon">📊</span><span>{t('Budget', 'Ppto')}</span>
      </button>
      <button className={`bottom-nav-item${view === 'reports' ? ' active' : ''}`} onClick={() => setView('reports')}>
        <span className="bn-icon">📈</span><span>{t('Reports', 'Rep.')}</span>
      </button>
    </nav>
  )
}

// ── App Layout ────────────────────────────────────────────────────────────────
export function AppLayout({ children }: { children: ReactNode }) {
  const { view } = useDashboard()

  return (
    <>
      <MobileHeader />
      <div className="dash-layout">
        <Sidebar />
        <main className="dash-main">
          {view === 'home'         && <HomePage />}
          {view === 'transactions' && <TransactionsPage />}
          {view === 'budgets'      && <BudgetsPage />}
          {view === 'reports'      && <ReportsPage />}
          {view === 'settings'     && <SettingsPage />}
        </main>
      </div>
      <BottomNav />
      {children}
    </>
  )
}
