'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Child, CoParentConnection, ExpenseSummary, Expense, ExpenseCategoryItem } from '@/types'
import { Plus, Settings, LogOut } from 'lucide-react'
import ExpenseForm from './ExpenseForm'
import ExpenseList from './ExpenseList'
import CoParentSetup from './CoParentSetup'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [coParentConnection, setCoParentConnection] = useState<CoParentConnection | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([])
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    setLoading(true)

    try {
      // Load children
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user.id)

      if (childrenData && childrenData.length > 0) {
        setChildren(childrenData)
        setSelectedChild(childrenData[0])

        // Load co-parent connection
        const { data: connectionData } = await supabase
          .from('coparent_connections')
          .select('*')
          .eq('child_id', childrenData[0].id)
          .single()

        if (connectionData) {
          setCoParentConnection(connectionData)

          // Load expenses
          const { data: expensesData } = await supabase
            .from('expenses')
            .select('*')
            .eq('child_id', childrenData[0].id)
            .order('date', { ascending: false })

          if (expensesData) {
            setExpenses(expensesData)
            calculateSummary(expensesData, connectionData)
          }
        }
      }

      // Load categories
      const { data: categoriesData } = await supabase
        .from('expense_categories')
        .select('*')

      if (categoriesData) {
        setCategories(categoriesData)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (expensesList: Expense[], connection: CoParentConnection) => {
    let totalSpent = 0
    let paidByYou = 0
    let theirShare = 0
    let yourShare = 0

    expensesList.forEach((expense) => {
      const isYourExpense = expense.paid_by_user_id === user?.id
      const splitPct = isYourExpense ? connection.parent2_split_pct : connection.parent1_split_pct

      totalSpent += expense.amount
      if (isYourExpense) {
        paidByYou += expense.amount
        theirShare += (expense.amount * splitPct) / 100
      } else {
        yourShare += (expense.amount * splitPct) / 100
      }
    })

    const totalOwed = paidByYou - theirShare
    const paymentOwed = yourShare - (totalSpent - paidByYou)

    setSummary({
      total_spent: totalSpent,
      total_owed: totalOwed,
      total_paid_by_you: paidByYou,
      payment_owed_to_you: paymentOwed,
      expense_count: expensesList.length,
    })
  }

  const handleExpenseAdded = () => {
    setShowExpenseForm(false)
    loadData()
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!selectedChild || !coParentConnection) {
    return <CoParentSetup onSetupComplete={loadData} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">👨‍👩‍👧 CoParent Pay</h1>
            <p className="text-sm text-gray-600">Managing expenses for {selectedChild.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/settings')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Settings"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">Total Spent</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${summary.total_spent.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{summary.expense_count} expenses</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">You Paid</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                ${summary.total_paid_by_you.toFixed(2)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">You Owe</p>
              <p className={`text-3xl font-bold mt-2 ${
                summary.total_owed > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${Math.abs(summary.total_owed).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary.total_owed > 0 ? 'They owe you' : 'You owe them'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium">Split</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {coParentConnection.parent1_split_pct}% / {coParentConnection.parent2_split_pct}%
              </p>
            </div>
          </div>
        )}

        {/* Add Expense Button & List */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowExpenseForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition flex items-center gap-2 shadow-lg"
          >
            <Plus size={20} />
            Add Expense
          </button>
        </div>

        {showExpenseForm && (
          <ExpenseForm
            childId={selectedChild.id}
            categories={categories}
            splitPcts={{
              your: coParentConnection.parent1_split_pct,
              theirs: coParentConnection.parent2_split_pct,
            }}
            onClose={() => setShowExpenseForm(false)}
            onSave={handleExpenseAdded}
          />
        )}

        <ExpenseList expenses={expenses} categories={categories} user={user} />
      </div>
    </div>
  )
}
