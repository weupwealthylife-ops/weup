import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { sb } from '../lib/supabase'
import { DEFAULT_BUDGETS } from '../lib/categories'
import { DashboardContext } from '../contexts/DashboardContext'
import type { Transaction, DashboardView, Lang, Currency } from '../types/dashboard'
import { AuthGate } from '../components/dashboard/AuthGate'
import { AppLayout } from '../components/dashboard/Layout'
import { AddTransactionModal } from '../components/dashboard/AddTransactionModal'
import { EditTransactionModal } from '../components/dashboard/EditTransactionModal'
import { BudgetModal } from '../components/dashboard/BudgetModal'
import '../styles/dashboard.css'

export default function DashboardPage() {
  // ── Auth gate state ──
  const [gateStep, setGateStep] = useState<1 | 2 | 3>(1)
  const [gateError, setGateError] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  // ── App state ──
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Record<string, number>>(DEFAULT_BUDGETS)

  // ── UI state ──
  const [view, setView] = useState<DashboardView>('home')
  const [lang, setLang] = useState<Lang>('en')
  const [currency, setCurrencyState] = useState<Currency>(
    () => (localStorage.getItem('weup_currency') as Currency) || 'USD'
  )
  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem('weup_currency', c)
  }, [])
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [toast, setToast] = useState('')

  // ── Modal state ──
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)

  // ── Data loaders ──
  const loadTransactions = useCallback(async (uid: string) => {
    const { data, error } = await sb
      .from('transactions')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false })
    if (error) { console.error('loadTransactions error:', error); return }
    if (data) setTransactions(data)
  }, [])

  const loadBudgets = useCallback(async (uid: string) => {
    const { data } = await sb
      .from('profiles')
      .select('budgets')
      .eq('id', uid)
      .single()
    if (data?.budgets && Object.keys(data.budgets).length > 0) {
      setBudgets(data.budgets)
    }
  }, [])

  const reloadData = useCallback(async () => {
    if (!user) return
    await Promise.all([loadTransactions(user.id), loadBudgets(user.id)])
  }, [user, loadTransactions, loadBudgets])

  // ── Boot sequence ──
  const handleSession = useCallback(async (sessionUser: User) => {
    // Step 2: check profile
    setGateStep(2)
    const { data: profile } = await sb
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', sessionUser.id)
      .single()

    if (!profile?.onboarding_completed) {
      window.location.href = '/onboarding'
      return
    }

    // Step 3: load data
    setGateStep(3)
    setUser(sessionUser)
    await Promise.all([loadTransactions(sessionUser.id), loadBudgets(sessionUser.id)])

    await new Promise(r => setTimeout(r, 400))
    setIsLoaded(true)
  }, [loadTransactions, loadBudgets])

  useEffect(() => {
    sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') window.location.href = '/'
      if (event === 'USER_UPDATED' && session?.user) setUser(session.user)
    })

    ;(async () => {
      // Handle OAuth hash redirect
      if (window.location.hash.includes('access_token')) {
        const params = new URLSearchParams(window.location.hash.substring(1))
        const at = params.get('access_token')
        const rt = params.get('refresh_token')
        window.history.replaceState({}, document.title, window.location.pathname)
        if (at && rt) {
          const { data, error } = await sb.auth.setSession({ access_token: at, refresh_token: rt })
          if (!error && data.session) { await handleSession(data.session.user); return }
        }
      }

      // Normal load
      const { data: { session } } = await sb.auth.getSession()
      if (!session) {
        setGateError('You need to <a href="/">sign in</a> to access your dashboard.')
        return
      }
      await handleSession(session.user)
    })()
  }, [handleSession])

  // ── Toast ──
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  // ── Month nav ──
  const changeMonth = useCallback((dir: number) => {
    setViewMonth(m => {
      let nm = m + dir; let ny = viewYear
      if (nm > 11) { nm = 0; ny++ }
      if (nm < 0)  { nm = 11; ny-- }
      setViewYear(ny)
      return nm
    })
  }, [viewYear])

  // ── Modal helpers ──
  const openEditModal  = useCallback((tx: Transaction) => { setEditingTx(tx); setEditModalOpen(true) }, [])
  const openAddModal   = useCallback(() => setAddModalOpen(true), [])
  const openBudgetModal = useCallback(() => setBudgetModalOpen(true), [])

  if (!isLoaded) return <AuthGate step={gateStep} error={gateError} />

  return (
    <DashboardContext.Provider value={{
      user: user!,
      transactions, budgets, setBudgets,
      lang, setLang,
      currency, setCurrency,
      view, setView,
      viewMonth, viewYear, changeMonth,
      showToast,
      openAddModal, openEditModal, openBudgetModal,
      reloadData,
    }}>
      <div className="dashboard-root">
        <AppLayout>
          <AddTransactionModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
          />
          <EditTransactionModal
            open={editModalOpen}
            tx={editingTx}
            onClose={() => { setEditModalOpen(false); setEditingTx(null) }}
          />
          <BudgetModal
            open={budgetModalOpen}
            onClose={() => setBudgetModalOpen(false)}
          />
        </AppLayout>

        {/* Toast */}
        <div className={`dash-toast${toast ? ' show' : ''}`}>{toast}</div>
      </div>
    </DashboardContext.Provider>
  )
}
