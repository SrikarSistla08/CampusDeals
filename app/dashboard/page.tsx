'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { getActiveDeals } from '@/lib/firebase/deals'
import { getUserFavorites } from '@/lib/firebase/favorites'
import { getDealById } from '@/lib/firebase/deals'
import { getUserRedemptions } from '@/lib/firebase/redemptions'
import { Deal, DealRedemption } from '@/types'
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
  Sparkles,
  DollarSign,
  PiggyBank,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { format } from 'date-fns'

// Helper function to estimate savings from discount string
const estimateSavings = (discount: string): number => {
  // Try to extract dollar amount (e.g., "$5 Off", "$10", "Save $5")
  const dollarMatch = discount.match(/\$(\d+(?:\.\d+)?)/i)
  if (dollarMatch) {
    return parseFloat(dollarMatch[1])
  }

  // Try to extract percentage (e.g., "20% Off", "15% discount")
  const percentMatch = discount.match(/(\d+)%/i)
  if (percentMatch) {
    const percent = parseFloat(percentMatch[1])
    // Estimate average purchase of $20-30 for percentage discounts
    const avgPurchase = 25
    return (percent / 100) * avgPurchase
  }

  // For "Buy 1 Get 1 Free" or similar, estimate as half the average purchase
  if (discount.toLowerCase().includes('buy') && discount.toLowerCase().includes('get')) {
    return 12.5 // Estimate half of average purchase
  }

  // Default: estimate $5 for unknown formats
  return 5
}

export default function DashboardPage() {
  const { user, userData } = useAuth()
  const [recentDeals, setRecentDeals] = useState<Deal[]>([])
  const [savedDeals, setSavedDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState({
    latestDeals: true,
    savedDeals: true,
  })
  const [stats, setStats] = useState({
    savedCount: 0,
    redeemedCount: 0,
    activeDeals: 0,
    actualSavings: 0,
    potentialSavings: 0,
  })

  const toggleSection = (section: 'latestDeals' | 'savedDeals') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

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

      // Calculate actual savings from redeemed deals
      const redeemedDealIds = new Set(redemptions.map((r: DealRedemption) => r.dealId))
      let actualSavings = 0
      
      // Get deal details for redeemed deals
      const redeemedDeals = await Promise.all(
        Array.from(redeemedDealIds).map(id => getDealById(id))
      )
      
      redeemedDeals.forEach((deal) => {
        if (deal) {
          actualSavings += estimateSavings(deal.discount)
        }
      })

      // Calculate potential savings from unredeemed active deals
      const potentialSavings = allDeals
        .filter(deal => !redeemedDealIds.has(deal.id))
        .reduce((sum, deal) => sum + estimateSavings(deal.discount), 0)

      // Update stats
      setStats({
        savedCount: favoriteIds.length,
        redeemedCount: redemptions.length,
        activeDeals: allDeals.length,
        actualSavings: Math.round(actualSavings * 100) / 100, // Round to 2 decimals
        potentialSavings: Math.round(potentialSavings * 100) / 100,
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

        {/* Savings Cards - Prominent Display */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 font-medium mb-1">Total Saved</p>
                <span className="text-4xl font-bold text-green-700">
                  ${stats.actualSavings.toFixed(2)}
                </span>
              </div>
            </div>
            <p className="text-gray-700 font-medium mb-2">
              Money saved from {stats.redeemedCount} redeemed {stats.redeemedCount === 1 ? 'deal' : 'deals'}
            </p>
            <Link href="/profile#redeemed" className="text-sm text-green-700 hover:text-green-800 font-medium inline-flex items-center gap-1">
              View redeemed deals <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="card p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary-600 rounded-xl">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 font-medium mb-1">Potential Savings</p>
                <span className="text-4xl font-bold text-primary-700">
                  ${stats.potentialSavings.toFixed(2)}
                </span>
              </div>
            </div>
            <p className="text-gray-700 font-medium mb-2">
              Available from {stats.activeDeals} active {stats.activeDeals === 1 ? 'deal' : 'deals'}
            </p>
            <Link href="/deals" className="text-sm text-primary-700 hover:text-primary-800 font-medium inline-flex items-center gap-1">
              Browse all deals <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Recent Deals */}
          <div className={`card overflow-hidden ${!expandedSections.latestDeals ? 'pb-0' : ''} self-start`}>
            <div className={`flex items-center justify-between p-6 ${expandedSections.latestDeals ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleSection('latestDeals')}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                  aria-label={expandedSections.latestDeals ? 'Collapse latest deals' : 'Expand latest deals'}
                >
                  {expandedSections.latestDeals ? (
                    <ChevronUp className="w-5 h-5 text-primary-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-primary-600" />
                  )}
                </button>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Sparkles className="w-6 h-6 mr-2 text-primary-600" />
                  Latest Deals
                </h2>
              </div>
              <Link
                href="/deals"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {expandedSections.latestDeals && (
              <div className="px-6 pb-6">
                {recentDeals.length === 0 ? (
                  <div className="p-12 text-center">
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
            )}
          </div>

          {/* Saved Deals */}
          <div className={`card overflow-hidden ${!expandedSections.savedDeals ? 'pb-0' : ''} self-start`}>
            <div className={`flex items-center justify-between p-6 ${expandedSections.savedDeals ? 'border-b border-gray-100' : ''}`}>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Heart className="w-6 h-6 mr-2 text-red-500" />
                Your Saved Deals
              </h2>
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => toggleSection('savedDeals')}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label={expandedSections.savedDeals ? 'Collapse saved deals' : 'Expand saved deals'}
                >
                  {expandedSections.savedDeals ? (
                    <ChevronUp className="w-5 h-5 text-red-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-red-600" />
                  )}
                </button>
              </div>
            </div>
            {expandedSections.savedDeals && (
              <div className="px-6 pb-6">
                {savedDeals.length === 0 ? (
                  <div className="p-12 text-center">
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



