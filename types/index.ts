// Auth types
export interface User {
  id: string
  email: string
  user_metadata?: Record<string, any>
}

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Children and co-parenting types
export interface Child {
  id: string
  user_id: string
  name: string
  date_of_birth?: string
  created_at: string
}

export interface CoParentConnection {
  id: string
  child_id: string
  parent1_id: string
  parent2_id: string
  parent1_split_pct: number
  parent2_split_pct: number
  created_at: string
  updated_at: string
}

// Expense types
export type ExpenseCategory =
  | 'Groceries'
  | 'Healthcare'
  | 'Education'
  | 'Clothing'
  | 'Entertainment'
  | 'Transport'
  | 'Childcare'
  | 'Activities'
  | 'Other'

export interface ExpenseCategoryItem {
  id: string
  name: ExpenseCategory
  icon: string
  color: string
  created_at: string
}

export interface Expense {
  id: string
  child_id: string
  paid_by_user_id: string
  category_id?: string
  description: string
  amount: number
  date: string
  notes: string
  created_at: string
  updated_at: string
}

export interface ExpenseSplit {
  id: string
  expense_id: string
  parent_id: string
  share_pct: number
  amount_owed: number
  created_at: string
}

// Dashboard summary types
export interface ExpenseSummary {
  total_spent: number
  total_owed: number
  total_paid_by_you: number
  payment_owed_to_you: number
  expense_count: number
}

export interface MonthlyExpenseData {
  month: string
  total: number
  yourShare: number
  theirShare: number
}

export interface CategorySpend {
  category: ExpenseCategory
  amount: number
  percentage: number
}

export interface DashboardStats {
  total_deductions: number
  total_tax_back: number
  receipt_count: number
  ai_scanned_count: number
  by_category: Record<ATOCategory, number>
  by_month: { month: string; amount: number }[]
}
