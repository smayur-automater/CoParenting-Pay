'use client'

import { Expense, ExpenseCategoryItem } from '@/types'
import { User } from '@supabase/supabase-js'
import { formatDistanceToNow } from 'date-fns'

interface ExpenseListProps {
  expenses: Expense[]
  categories: ExpenseCategoryItem[]
  user: User | null
}

export default function ExpenseList({ expenses, categories, user }: ExpenseListProps) {
  const getCategoryIcon = (categoryId: string | null) => {
    if (!categoryId) return '📌'
    const category = categories.find((c) => c.id === categoryId)
    return category?.icon || '📌'
  }

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Other'
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || 'Other'
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No expenses yet. Add your first expense to get started!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Paid By
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {expenses.map((expense) => (
            <tr key={expense.id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(expense.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: '2-digit',
                })}
                <br />
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(expense.created_at), { addSuffix: true })}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-lg">{getCategoryIcon(expense.category_id)}</span>
                <span className="ml-2 text-sm text-gray-700">{getCategoryName(expense.category_id)}</span>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 font-medium">{expense.description}</div>
                {expense.notes && (
                  <div className="text-xs text-gray-500 mt-1">{expense.notes}</div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  expense.paid_by_user_id === user?.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {expense.paid_by_user_id === user?.id ? 'You' : 'Them'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                ${expense.amount.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
