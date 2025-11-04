'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { getUserFavorites } from '@/lib/firebase/favorites'
import { getDealById } from '@/lib/firebase/deals'
import { getUserRedemptions } from '@/lib/firebase/redemptions'
import { updateUserProfile } from '@/lib/firebase/users'
import { changePassword } from '@/lib/firebase/auth'
import { Deal, DealRedemption } from '@/types'
import { 
  Heart, 
  CheckCircle, 
  Calendar, 
  User as UserIcon, 
  Edit, 
  Save, 
  X, 
  Lock,
  Mail,
  Shield,
  TrendingUp,
  Award
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, userData } = useAuth()
  const [favorites, setFavorites] = useState<Deal[]>([])
  const [redemptions, setRedemptions] = useState<DealRedemption[]>([])
  const [redemptionDeals, setRedemptionDeals] = useState<Map<string, Deal>>(new Map())
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user && userData) {
      setName(userData.name)
      loadUserData()
    }
  }, [user, userData])

  const loadUserData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [favoriteIds, redemptionsData] = await Promise.all([
        getUserFavorites(user.uid),
        getUserRedemptions(user.uid),
      ])

      const favoriteDeals = await Promise.all(
        favoriteIds.map(id => getDealById(id))
      )
      setFavorites(favoriteDeals.filter(Boolean) as Deal[])

      // Load deal details for redemptions
      const dealsMap = new Map<string, Deal>()
      for (const redemption of redemptionsData) {
        const deal = await getDealById(redemption.dealId)
        if (deal) {
          dealsMap.set(redemption.dealId, deal)
        }
      }
      setRedemptionDeals(dealsMap)
      setRedemptions(redemptionsData)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateName = async () => {
    if (!name.trim() || name === userData?.name) {
      setEditingName(false)
      return
    }

    setError('')
    setSaving(true)
    try {
      await updateUserProfile({ name: name.trim() })
      setSuccess('Name updated successfully!')
      setEditingName(false)
      setTimeout(() => setSuccess(''), 3000)
      // Reload page to refresh userData
      window.location.reload()
    } catch (err: any) {
      setError(err.message || 'Failed to update name')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (passwordData.new.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    if (passwordData.new !== passwordData.confirm) {
      setError('New passwords do not match')
      return
    }

    setSaving(true)
    try {
      await changePassword(passwordData.current, passwordData.new)
      setSuccess('Password changed successfully!')
      setPasswordData({ current: '', new: '', confirm: '' })
      setShowPasswordChange(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="student">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const totalSavings = redemptionDeals.size > 0
    ? Array.from(redemptionDeals.values()).reduce((sum, deal) => {
        // Extract discount percentage if possible
        const discountMatch = deal.discount.match(/(\d+)%/)
        if (discountMatch) {
          return sum + parseInt(discountMatch[1])
        }
        return sum
      }, 0)
    : 0

  return (
    <ProtectedRoute requiredRole="student">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account and view your deals</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="card p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 shadow-lg">
                  {userData?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </div>
                {editingName ? (
                  <div className="flex items-center gap-2 justify-center mb-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="px-3 py-2 border-2 border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center font-semibold"
                      autoFocus
                      aria-label="Name"
                      placeholder="Enter your name"
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={saving}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      aria-label="Save name"
                      title="Save name"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingName(false)
                        setName(userData?.name || '')
                      }}
                      className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                      aria-label="Cancel editing"
                      title="Cancel editing"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{userData?.name || 'User'}</h2>
                    <button
                      onClick={() => setEditingName(true)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 transition"
                      aria-label="Edit name"
                      title="Edit name"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  {userData?.umbcEmail && (
                    <div className="flex items-center justify-center gap-2 text-primary-600">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">Verified UMBC Student</span>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
                    <Calendar className="w-3 h-3" />
                    <span>Joined {format(userData?.createdAt || new Date(), 'MMM yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                Your Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="text-gray-700 font-medium">Saved Deals</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{favorites.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700 font-medium">Redeemed</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">{redemptions.length}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary-600" />
                      <span className="text-gray-700 font-medium">Total Savings</span>
                    </div>
                    <span className="text-xl font-bold text-primary-600">{totalSavings}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Account Settings */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Account Settings</h3>
              {!showPasswordChange ? (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  <Lock className="w-5 h-5" />
                  Change Password
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                      aria-label="Current password"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                      minLength={6}
                      aria-label="New password"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                      minLength={6}
                      aria-label="Confirm new password"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 btn-primary disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Update Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordChange(false)
                        setPasswordData({ current: '', new: '', confirm: '' })
                        setError('')
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Column - Deals */}
          <div className="lg:col-span-2 space-y-8">
            {/* Saved Deals */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Heart className="w-6 h-6 mr-2 text-red-500" />
                  Saved Deals
                </h2>
                {favorites.length > 0 && (
                  <Link
                    href="/deals"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Browse More →
                  </Link>
                )}
              </div>
              {favorites.length === 0 ? (
                <div className="card p-12 text-center">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No saved deals yet</p>
                  <p className="text-gray-400 mb-6">Start exploring and save deals you're interested in!</p>
                  <Link href="/deals" className="btn-primary inline-block">
                    Browse Deals
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {favorites.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/deals/${deal.id}`}
                      className="card card-hover overflow-hidden"
                    >
                      {deal.image && (
                        <div className="h-40 bg-gray-200 relative">
                          <img
                            src={deal.image}
                            alt={deal.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{deal.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{deal.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-sm font-semibold">
                            {deal.discount}
                          </span>
                          <span className="text-xs text-gray-500">
                            Expires {format(deal.endDate, 'MMM d')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Redeemed Deals */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2 text-green-500" />
                  Redeemed Deals
                </h2>
              </div>
              {redemptions.length === 0 ? (
                <div className="card p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No redeemed deals yet</p>
                  <p className="text-gray-400 mb-6">Redeem deals to save money and support local businesses!</p>
                  <Link href="/deals" className="btn-primary inline-block">
                    Browse Deals
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {redemptions.map((redemption) => {
                    const deal = redemptionDeals.get(redemption.dealId)
                    if (!deal) return null

                    return (
                      <div key={redemption.id} className="card p-6">
                        <div className="flex gap-4">
                          {deal.image && (
                            <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={deal.image}
                                alt={deal.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{deal.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{deal.businessName}</p>
                              </div>
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap">
                                Redeemed
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Redeemed {format(redemption.redeemedAt, 'MMM d, yyyy')}</span>
                              </div>
                              <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded text-xs font-medium">
                                {deal.discount}
                              </span>
                            </div>
                            <Link
                              href={`/deals/${deal.id}`}
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                              View Deal Details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
