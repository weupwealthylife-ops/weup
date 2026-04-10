export interface Transaction {
  id: string
  user_id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  created_at?: string
}

export interface UserProfile {
  id: string
  onboarding_completed?: boolean
  budgets?: Record<string, number>
  plan?: 'free' | 'pro' | 'family'
  plan_billing?: string
  trial_ends_at?: string
}

export type DashboardView = 'home' | 'transactions' | 'budgets' | 'reports' | 'settings'
export type Lang = 'en' | 'es'
