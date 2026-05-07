'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Plus } from 'lucide-react'

interface CoParentSetupProps {
  onSetupComplete: () => void
}

export default function CoParentSetup({ onSetupComplete }: CoParentSetupProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<'child' | 'coparent' | 'split'>('child')
  const [childName, setChildName] = useState('')
  const [childDOB, setChildDOB] = useState('')
  const [coParentEmail, setCoParentEmail] = useState('')
  const [parent1Split, setParent1Split] = useState(50)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [child, setChild] = useState<any>(null)

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!user) throw new Error('Not authenticated')
      if (!childName) throw new Error('Please enter child name')

      const { data, error: err } = await supabase
        .from('children')
        .insert({
          user_id: user.id,
          name: childName,
          date_of_birth: childDOB || null,
        })
        .select()
        .single()

      if (err) throw err

      setChild(data)
      setStep('coparent')
    } catch (err: any) {
      setError(err.message || 'Failed to add child')
    } finally {
      setLoading(false)
    }
  }

  const handleFindCoParent = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!coParentEmail) throw new Error('Please enter co-parent email')
      if (!user) throw new Error('Not authenticated')

      // Get co-parent by email
      const { data: coParentProfile, error: err } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', coParentEmail)
        .single()

      if (err || !coParentProfile) {
        throw new Error('Co-parent not found. They may need to create an account first.')
      }

      setStep('split')
    } catch (err: any) {
      setError(err.message || 'Failed to find co-parent')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!user || !child) throw new Error('Missing required data')

      const { data: coParentProfile, error: err1 } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', coParentEmail)
        .single()

      if (err1 || !coParentProfile) {
        throw new Error('Co-parent not found')
      }

      const parent2Split = 100 - parent1Split

      const { error: err2 } = await supabase
        .from('coparent_connections')
        .insert({
          child_id: child.id,
          parent1_id: user.id,
          parent2_id: coParentProfile.user_id,
          parent1_split_pct: parent1Split,
          parent2_split_pct: parent2Split,
        })

      if (err2) throw err2

      onSetupComplete()
    } catch (err: any) {
      setError(err.message || 'Failed to create connection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block bg-blue-100 p-3 rounded-lg mb-4">
            <span className="text-3xl">👨‍👩‍👧</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set Up CoParent Pay</h1>
          <p className="text-gray-600 mt-2">
            {step === 'child' && "Let's start by adding your child"}
            {step === 'coparent' && 'Now connect with your co-parent'}
            {step === 'split' && 'Set the expense split percentage'}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          <div className={`flex-1 h-2 rounded-full transition ${step !== 'child' ? 'bg-blue-600' : 'bg-blue-600'}`}></div>
          <div className={`flex-1 h-2 rounded-full transition ${step === 'split' ? 'bg-blue-600' : step !== 'child' ? 'bg-blue-300' : 'bg-gray-200'}`}></div>
          <div className={`flex-1 h-2 rounded-full transition ${step === 'split' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        </div>

        {error && (
          <div className="p-3 rounded-lg mb-4 bg-red-50 text-red-700 border border-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Add Child */}
        {step === 'child' && (
          <form onSubmit={handleAddChild} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Child's Name *
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="e.g., Emma"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth (optional)
              </label>
              <input
                type="date"
                value={childDOB}
                onChange={(e) => setChildDOB(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'Adding...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Step 2: Find Co-Parent */}
        {step === 'coparent' && (
          <form onSubmit={handleFindCoParent} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Child:</strong> {child?.name}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Co-Parent Email Address *
              </label>
              <input
                type="email"
                value={coParentEmail}
                onChange={(e) => setCoParentEmail(e.target.value)}
                placeholder="coparent@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                They must already have a CoParent Pay account
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('child')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Finding...' : 'Continue'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Set Split */}
        {step === 'split' && (
          <form onSubmit={handleCreateConnection} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Child:</strong> {child?.name}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Co-Parent:</strong> {coParentEmail}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Expense Split: {parent1Split}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={parent1Split}
                onChange={(e) => setParent1Split(parseInt(e.target.value))}
                className="w-full"
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>You: {parent1Split}%</span>
                <span>Them: {100 - parent1Split}%</span>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                All expenses will be split {parent1Split}% / {100 - parent1Split}% unless adjusted per expense.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('coparent')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Start Tracking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
