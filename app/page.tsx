'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AuthPage from '@/components/AuthPage'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

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

  return user ? <Dashboard /> : <AuthPage />
}

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'snap', label: 'Snap', Icon: Camera },
    { id: 'receipts', label: 'Receipts', Icon: Receipt },
    { id: 'dashboard', label: 'Dashboard', Icon: BarChart3 },
    { id: 'settings', label: 'Settings', Icon: Settings },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-bold tracking-widest text-green-700 uppercase mb-1">
              Claude-powered · ATO-ready
            </p>
            <h1 className="text-2xl font-extrabold">
              SnapClaim <span className="text-green-700">AU</span>
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium">{getFYLabel(fy)}</p>
            <p className="text-base font-bold font-mono text-green-700">
              ${Math.round(totalTaxBack).toLocaleString()} saved
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Panels */}
        <div>
          {tab === 'snap' && (
            <SnapTab profile={profile} onAdd={addReceipt} />
          )}
          {tab === 'receipts' && (
            <ReceiptsTab receipts={receipts.filter(r => r.fy_year === fy)} onDelete={deleteReceipt} />
          )}
          {tab === 'dashboard' && (
            <DashboardTab receipts={receipts.filter(r => r.fy_year === fy)} profile={profile} fy={fy} />
          )}
          {tab === 'settings' && (
            <SettingsTab profile={profile} onSave={saveProfile} />
          )}
        </div>
      </div>
    </div>
  )
}
