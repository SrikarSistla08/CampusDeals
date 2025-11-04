'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { getActiveDeals } from '@/lib/firebase/deals'
import { getUserFavorites } from '@/lib/firebase/favorites'
import { getDealById } from '@/lib/firebase/deals'
import { getUserRedemptions } from '@/lib/firebase/redemptions'
import { Deal } from '@/types'
import Link from 'next/link'
import { 
  TrendingUp, 
  Heart, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Star,
  Search,
  Filter,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { user, userData } = useAuth()
  const [recentDeals, setRecentDeals] = useState<Deal[]>([])
  const [savedDeals, setSavedDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    savedCount: 0,
    redeemedCount: 0,
    activeDeals: 0,
  })

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Load recent deals, favorites, and redemptions in parallel
      const [allDeals, favoriteIds, redemptions] = await Promise.all([
        getActiveDeals('all', 'newest'),
        getUserFavorites(user.uid),
        getUserRedemptions(user.uid),
      ])

      // Get saved deals
      const savedDealsList = await Promise.all(
        favoriteIds.slice(0, 6).map(id => getDealById(id))
      )
      setSavedDeals(savedDealsList.filter(Boolean) as Deal[])

      // Get recent deals (first 6)
      setRecentDeals(allDeals.slice(0, 6))

      // Update stats
      setStats({
        savedCount: favoriteIds.length,
        redeemedCount: redemptions.length,
        activeDeals: allDeals.length,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
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

  return (
    <ProtectedRoute requiredRole="student">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Welcome back, {userData?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <Sparkles className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-gray-600 text-lg">
            Discover exclusive deals from local Arbutus businesses
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-primary-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.activeDeals}</span>
            </div>
            <p className="text-gray-600 font-medium">Active Deals</p>
            <Link href="/deals" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block">
              Browse all →
            </Link>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-red-100 rounded-xl">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.savedCount}</span>
            </div>
            <p className="text-gray-600 font-medium">Saved Deals</p>
            <Link href="/profile#saved" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block">
              View all →
            </Link>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.redeemedCount}</span>
            </div>
            <p className="text-gray-600 font-medium">Redeemed</p>
            <Link href="/profile#redeemed" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block">
              View all →
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Deals */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-primary-600" />
                Latest Deals
              </h2>
              <Link
                href="/deals"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {recentDeals.length === 0 ? (
              <div className="card p-12 text-center">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No deals available</p>
                <p className="text-gray-400 mb-6">Check back later for new deals!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="card p-5 card-hover block"
                  >
                    <div className="flex gap-4">
                      {deal.image && (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={deal.image}
                            alt={deal.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{deal.title}</h3>
                          <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2">
                            {deal.discount}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{deal.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{deal.businessName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Expires {format(deal.endDate, 'MMM d')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Saved Deals */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Heart className="w-6 h-6 mr-2 text-red-500" />
                Your Saved Deals
              </h2>
              <Link
                href="/profile"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {savedDeals.length === 0 ? (
              <div className="card p-12 text-center">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No saved deals yet</p>
                <p className="text-gray-400 mb-6">Start saving deals you're interested in!</p>
                <Link href="/deals" className="btn-primary inline-block">
                  Browse Deals
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {savedDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="card p-5 card-hover block"
                  >
                    <div className="flex gap-4">
                      {deal.image && (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={deal.image}
                            alt={deal.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{deal.title}</h3>
                          <Heart className="w-5 h-5 text-red-500 fill-current flex-shrink-0 ml-2" />
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{deal.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{deal.businessName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Expires {format(deal.endDate, 'MMM d')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/deals"
            className="card p-6 card-hover text-center"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Search Deals</h3>
            <p className="text-sm text-gray-600">Find deals by category or keyword</p>
          </Link>

          <Link
            href="/businesses"
            className="card p-6 card-hover text-center"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Browse Businesses</h3>
            <p className="text-sm text-gray-600">Discover local Arbutus businesses</p>
          </Link>

          <Link
            href="/profile"
            className="card p-6 card-hover text-center"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">My Profile</h3>
            <p className="text-sm text-gray-600">View saved deals and account settings</p>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  )
}

