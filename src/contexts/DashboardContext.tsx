import { createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Transaction, DashboardView, Lang } from '../types/dashboard'

export interface DashboardContextType {
  user: User
  transactions: Transaction[]
  budgets: Record<string, number>
  lang: Lang
  view: DashboardView
  viewMonth: number
  viewYear: number
  setView: (v: DashboardView) => void
  setLang: (l: Lang) => void
  setBudgets: (b: Record<string, number>) => void
  showToast: (msg: string) => void
  openAddModal: () => void
  openEditModal: (tx: Transaction) => void
  openBudgetModal: () => void
  changeMonth: (dir: number) => void
  reloadData: () => Promise<void>
}

export const DashboardContext = createContext<DashboardContextType | null>(null)

export function useDashboard(): DashboardContextType {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardPage')
  return ctx
}
