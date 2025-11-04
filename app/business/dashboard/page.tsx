'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useRouter } from 'next/navigation'
import { getBusinessByUserId } from '@/lib/firebase/businesses'
import { getBusinessDeals } from '@/lib/firebase/deals'
import { getDealRedemptions } from '@/lib/firebase/redemptions'
import { Business, Deal } from '@/types'
import Link from 'next/link'
import { 
  Plus, 
  TrendingUp, 
  Eye, 
  Calendar, 
  Edit, 
  Trash2, 
  Users,
  DollarSign,
  Award,
  BarChart3,
  Clock,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react'
import ReviewsWidget from '@/components/business/ReviewsWidget'
import { format } from 'date-fns'

export default function BusinessDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDeals: 0,
    activeDeals: 0,
    totalViews: 0,
    totalRedemptions: 0,
    seasonalDeals: 0,
  })

  useEffect(() => {
    if (user) {
      loadBusinessData()
    }
  }, [user])

  const loadBusinessData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const businessData = await getBusinessByUserId(user.uid)
      if (businessData) {
        setBusiness(businessData)
        const dealsData = await getBusinessDeals(businessData.id)
        setDeals(dealsData)

        // Calculate stats
        const activeDeals = dealsData.filter((d: Deal) => d.isActive)
        const totalViews = dealsData.reduce((sum: number, d: Deal) => sum + (d.viewCount || 0), 0)
        
        // Get redemption counts for all deals
        let totalRedemptions = 0
        for (const deal of dealsData) {
          try {
            const redemptions = await getDealRedemptions(deal.id)
            totalRedemptions += redemptions.length
          } catch (error) {
            // If redemption query fails, use stored count
            totalRedemptions += deal.redemptionCount || 0
          }
        }

        const seasonalDeals = dealsData.filter((d: Deal) => d.isSeasonal && d.isActive).length

        setStats({
          totalDeals: dealsData.length,
          activeDeals: activeDeals.length,
          totalViews,
          totalRedemptions,
          seasonalDeals,
        })
      }
    } catch (error) {
      console.error('Error loading business data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="business">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!business) {
    return (
      <ProtectedRoute requiredRole="business">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">No business profile found</p>
            <Link
              href="/business/setup"
              className="btn-primary inline-block"
            >
              Set Up Your Business
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const recentDeals = deals.slice(0, 5)
  const endingSoon = deals
    .filter(d => d.isActive && new Date(d.endDate) > new Date())
    .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
    .slice(0, 3)

  return (
    <ProtectedRoute requiredRole="business">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{business.name}</h1>
              <Sparkles className="w-6 h-6 text-primary-600" />
            </div>
            <p className="text-gray-600 text-lg">Business Dashboard</p>
          </div>
          <Link
            href="/business/deals/new"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Deal</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-primary-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Deals</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalDeals}</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-green-100 rounded-xl">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Active Deals</p>
            <p className="text-3xl font-bold text-gray-900">{stats.activeDeals}</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Total Views</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Redemptions</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRedemptions}</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-1">Seasonal</p>
            <p className="text-3xl font-bold text-gray-900">{stats.seasonalDeals}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-primary-600" />
                Quick Actions
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  href="/business/deals/new"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center"
                >
                  <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Create New Deal</p>
                  <p className="text-sm text-gray-600">Add a new deal or promotion</p>
                </Link>
                <Link
                  href="/business/settings"
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center"
                >
                  <Edit className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Edit Profile</p>
                  <p className="text-sm text-gray-600">Update business information</p>
                </Link>
              </div>
            </div>

            {/* Recent Deals */}
            <div className="card overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Recent Deals</h2>
              </div>
              {recentDeals.length === 0 ? (
                <div className="p-12 text-center">
                  <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No deals yet. Create your first deal!</p>
                  <Link href="/business/deals/new" className="btn-primary inline-block">
                    Create a deal
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {recentDeals.map((deal) => (
                    <div key={deal.id} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
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
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{deal.title}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                deal.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {deal.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {deal.isSeasonal && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                  {deal.seasonalTag || 'Seasonal'}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{deal.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="font-medium text-primary-600">{deal.discount}</span>
                              <span>•</span>
                              <span>Views: {deal.viewCount}</span>
                              <span>•</span>
                              <span>Redeemed: {deal.redemptionCount}</span>
                              <span>•</span>
                              <span>Until {format(deal.endDate, 'MMM d')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Link
                            href={`/business/deals/${deal.id}/edit`}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                            aria-label="Edit deal"
                            title="Edit deal"
                          >
                            <Edit className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Business Info */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Business Info</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium text-gray-900">{business.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">{business.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{business.phone}</p>
                </div>
                {business.website && (
                  <div>
                    <p className="text-sm text-gray-600">Website</p>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {business.website}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="font-medium text-gray-900">
                    {business.rating.toFixed(1)} / 5.0 ({business.reviewCount} reviews)
                  </p>
                </div>
              </div>
              <Link
                href="/business/settings"
                className="mt-4 btn-secondary w-full text-center block"
              >
                Edit Profile
              </Link>
            </div>

            {/* Ending Soon */}
            {endingSoon.length > 0 && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-600" />
                  Ending Soon
                </h2>
                <div className="space-y-3">
                  {endingSoon.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/business/deals/${deal.id}/edit`}
                      className="block p-3 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
                    >
                      <p className="font-semibold text-gray-900 text-sm mb-1">{deal.title}</p>
                      <p className="text-xs text-gray-600">
                        Ends {format(deal.endDate, 'MMM d, yyyy')}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* External Reviews Widget */}
            <ReviewsWidget 
              externalReviews={business.externalReviews}
              platformRatings={{
                google: business.googlePlaceId ? {
                  rating: 4.5,
                  reviewCount: 127,
                  url: `https://www.google.com/maps/place/?q=place_id:${business.googlePlaceId}`
                } : undefined,
                yelp: business.yelpBusinessId ? {
                  rating: 4.2,
                  reviewCount: 89,
                  url: `https://www.yelp.com/biz/${business.yelpBusinessId}`
                } : undefined
              }}
            />
          </div>
        </div>

        {/* All Deals Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Deals</h2>
            <Link
              href="/business/deals/new"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Create New
            </Link>
          </div>
          {deals.length === 0 ? (
            <div className="card p-12 text-center">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No deals yet</p>
              <p className="text-gray-400 mb-6">Create your first deal to attract UMBC students!</p>
              <Link href="/business/deals/new" className="btn-primary inline-block">
                Create Your First Deal
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => (
                <div key={deal.id} className="card overflow-hidden">
                  {deal.image && (
                    <div className="h-40 bg-gray-200 relative">
                      <img
                        src={deal.image}
                        alt={deal.title}
                        className="w-full h-full object-cover"
                      />
                      {deal.isSeasonal && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-semibold">
                          {deal.seasonalTag || 'Seasonal'}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{deal.title}</h3>
                      <div className="flex gap-1 flex-shrink-0">
                        <Link
                          href={`/business/deals/${deal.id}/edit`}
                          className="p-1.5 text-gray-600 hover:text-primary-600 transition"
                          aria-label="Edit deal"
                          title="Edit deal"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{deal.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs font-semibold">
                        {deal.discount}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        deal.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {deal.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>👁️ {deal.viewCount} views</span>
                      <span>✓ {deal.redemptionCount} redeemed</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Expires {format(deal.endDate, 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
