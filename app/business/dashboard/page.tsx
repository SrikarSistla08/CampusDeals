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
  Image as ImageIcon,
  Trophy,
  Target,
  Zap,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  Star,
  CheckCircle2
} from 'lucide-react'
import ReviewsWidget from '@/components/business/ReviewsWidget'
import { format, differenceInDays, differenceInHours } from 'date-fns'

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
    conversionRate: 0,
    avgViewsPerDeal: 0,
    avgRedemptionsPerDeal: 0,
  })
  const [animatedStats, setAnimatedStats] = useState({
    totalDeals: 0,
    activeDeals: 0,
    totalViews: 0,
    totalRedemptions: 0,
    seasonalDeals: 0,
    conversionRate: 0,
    avgViewsPerDeal: 0,
    avgRedemptionsPerDeal: 0,
  })
  const [achievements, setAchievements] = useState<string[]>([])
  const [growthTips, setGrowthTips] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      loadBusinessData()
    }
  }, [user])

  // Animate stats count-up
  useEffect(() => {
    const duration = 1500
    const steps = 60
    const stepDuration = duration / steps

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3)
    }

    const animateValue = (start: number, end: number, setter: (val: number) => void, isDecimal = false) => {
      const range = end - start
      let step = 0

      const timer = setInterval(() => {
        step++
        const progress = step / steps
        const easedProgress = easeOutCubic(progress)
        const current = start + (range * easedProgress)
        
        if (step >= steps) {
          setter(end)
          clearInterval(timer)
        } else {
          setter(isDecimal ? Math.round(current * 100) / 100 : Math.round(current))
        }
      }, stepDuration)
    }

    if (!loading) {
      animateValue(0, stats.totalDeals, (val) => setAnimatedStats(prev => ({ ...prev, totalDeals: val })))
      animateValue(0, stats.activeDeals, (val) => setAnimatedStats(prev => ({ ...prev, activeDeals: val })))
      animateValue(0, stats.totalViews, (val) => setAnimatedStats(prev => ({ ...prev, totalViews: val })))
      animateValue(0, stats.totalRedemptions, (val) => setAnimatedStats(prev => ({ ...prev, totalRedemptions: val })))
      animateValue(0, stats.seasonalDeals, (val) => setAnimatedStats(prev => ({ ...prev, seasonalDeals: val })))
      animateValue(0, stats.conversionRate, (val) => setAnimatedStats(prev => ({ ...prev, conversionRate: val })), true)
      animateValue(0, stats.avgViewsPerDeal, (val) => setAnimatedStats(prev => ({ ...prev, avgViewsPerDeal: val })), true)
      animateValue(0, stats.avgRedemptionsPerDeal, (val) => setAnimatedStats(prev => ({ ...prev, avgRedemptionsPerDeal: val })), true)
    }
  }, [loading, stats])

  // Calculate achievements and growth tips
  useEffect(() => {
    const newAchievements: string[] = []
    const tips: string[] = []

    // Achievements
    if (stats.totalDeals >= 1) newAchievements.push('First Deal')
    if (stats.totalDeals >= 5) newAchievements.push('Deal Creator')
    if (stats.totalDeals >= 10) newAchievements.push('Deal Master')
    if (stats.totalViews >= 100) newAchievements.push('100 Views')
    if (stats.totalViews >= 1000) newAchievements.push('1K Views')
    if (stats.totalRedemptions >= 10) newAchievements.push('10 Redemptions')
    if (stats.totalRedemptions >= 50) newAchievements.push('50 Redemptions')
    if (stats.totalRedemptions >= 100) newAchievements.push('100 Redemptions')
    if (stats.conversionRate >= 10) newAchievements.push('10% Converter')
    if (stats.seasonalDeals >= 3) newAchievements.push('Seasonal Expert')

    // Growth tips
    if (stats.activeDeals === 0) {
      tips.push('Create your first active deal to start attracting students')
    } else if (stats.activeDeals < 3) {
      tips.push('Add more active deals to increase visibility and engagement')
    }
    
    if (stats.conversionRate < 5 && stats.totalViews > 0) {
      tips.push('Improve deal descriptions and images to increase conversion rate')
    }
    
    if (stats.totalViews < 50 && stats.activeDeals > 0) {
      tips.push('Share your deals on social media to get more views')
    }
    
    // Note: endingSoon is calculated later, so we'll check active deals with expiry
    const activeDealsWithExpiry = deals.filter(d => d.isActive && new Date(d.endDate) > new Date())
    const soonExpiring = activeDealsWithExpiry.filter(d => {
      const daysUntilExpiry = differenceInDays(new Date(d.endDate), new Date())
      return daysUntilExpiry <= 3 && daysUntilExpiry >= 0
    })
    
    if (soonExpiring.length > 0) {
      tips.push(`${soonExpiring.length} deal(s) expiring soon - consider extending or creating new ones`)
    }
    
    if (stats.seasonalDeals === 0 && stats.activeDeals > 0) {
      tips.push('Create seasonal deals to catch students during peak times')
    }

    if (tips.length === 0) {
      tips.push('Great job! Keep creating engaging deals to grow your business')
    }

    setAchievements(newAchievements)
    setGrowthTips(tips)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, deals])

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
        
        // Calculate advanced metrics
        const conversionRate = totalViews > 0 ? (totalRedemptions / totalViews) * 100 : 0
        const avgViewsPerDeal = dealsData.length > 0 ? totalViews / dealsData.length : 0
        const avgRedemptionsPerDeal = dealsData.length > 0 ? totalRedemptions / dealsData.length : 0

        setStats({
          totalDeals: dealsData.length,
          activeDeals: activeDeals.length,
          totalViews,
          totalRedemptions,
          seasonalDeals,
          conversionRate: Math.round(conversionRate * 10) / 10,
          avgViewsPerDeal: Math.round(avgViewsPerDeal * 10) / 10,
          avgRedemptionsPerDeal: Math.round(avgRedemptionsPerDeal * 10) / 10,
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

  // Countdown timer component for deals
  const CountdownTimer = ({ endDate }: { endDate: Date }) => {
    const [timeLeft, setTimeLeft] = useState('')
    
    useEffect(() => {
      const updateTimer = () => {
        const now = new Date()
        const diff = endDate.getTime() - now.getTime()
        
        if (diff <= 0) {
          setTimeLeft('Expired')
          return
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`)
        } else {
          setTimeLeft(`${hours}h`)
        }
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 3600000) // Update every hour
      
      return () => clearInterval(interval)
    }, [endDate])
    
    return (
      <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
        <Clock className="w-3 h-3" />
        <span>{timeLeft}</span>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="business">
      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">{business.name}</h1>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 animate-pulse flex-shrink-0" />
            </div>
            <p className="text-gray-600 text-xs sm:text-sm">Grow your business with UMBC students</p>
          </div>
          <Link
            href="/business/deals/new"
            className="btn-primary flex items-center space-x-2 text-xs sm:text-sm px-3 sm:px-4 py-2 w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Create Deal</span>
          </Link>
        </div>

        {/* Growth Tips & Achievements - Compact Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4">
          {growthTips.length > 0 && (
            <div className="card p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Growth Tips</h3>
              </div>
              <div className="space-y-1">
                {growthTips.slice(0, 3).map((tip, index) => (
                  <div key={index} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-700">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {achievements.length > 0 && (
            <div className="card p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-600" />
                <h3 className="text-sm font-bold text-gray-900">Achievements</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {achievements.slice(0, 6).map((achievement) => (
                  <div
                    key={achievement}
                    className="flex items-center gap-1 bg-white px-2 py-1 rounded text-xs font-semibold text-gray-700 border border-yellow-200"
                  >
                    <Award className="w-3 h-3 text-yellow-600" />
                    <span>{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Performance Metrics - Compact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="card p-4 bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-primary-600 rounded-lg">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-gray-600 text-xs mb-0.5">Total Views</p>
            <p className="text-2xl font-bold text-gray-900 transition-all duration-300">
              {animatedStats.totalViews.toLocaleString()}
            </p>
            {stats.avgViewsPerDeal > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                Avg: {animatedStats.avgViewsPerDeal.toFixed(0)}/deal
              </p>
            )}
          </div>

          <div className="card p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Users className="w-4 h-4 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-gray-600 text-xs mb-0.5">Redemptions</p>
            <p className="text-2xl font-bold text-gray-900 transition-all duration-300">
              {animatedStats.totalRedemptions}
            </p>
            {stats.avgRedemptionsPerDeal > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                Avg: {animatedStats.avgRedemptionsPerDeal.toFixed(1)}/deal
              </p>
            )}
          </div>

          <div className="card p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-600 rounded-lg">
                <Target className="w-4 h-4 text-white" />
              </div>
              {stats.conversionRate >= 5 ? (
                <ArrowUp className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDown className="w-4 h-4 text-orange-600" />
              )}
            </div>
            <p className="text-gray-600 text-xs mb-0.5">Conversion</p>
            <p className="text-2xl font-bold text-gray-900 transition-all duration-300">
              {animatedStats.conversionRate.toFixed(1)}%
            </p>
            <div className="w-full h-1.5 bg-green-200 rounded-full overflow-hidden mt-2">
              {/* eslint-disable-next-line @next/next/no-inline-styles */}
              <div 
                className="h-full bg-green-600 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${Math.min(100, stats.conversionRate * 10)}%` }}
              />
            </div>
          </div>

          <div className="card p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-gray-600 text-xs mb-0.5">Active Deals</p>
            <p className="text-2xl font-bold text-gray-900 transition-all duration-300">
              {animatedStats.activeDeals}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              of {animatedStats.totalDeals} total
            </p>
          </div>
        </div>

        {/* Additional Stats - Compact Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <div className="card p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-primary-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-primary-600" />
              </div>
              <p className="text-gray-600 text-xs">Total Deals</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 transition-all duration-300">{animatedStats.totalDeals}</p>
          </div>

          <div className="card p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Award className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-gray-600 text-xs">Seasonal</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 transition-all duration-300">{animatedStats.seasonalDeals}</p>
          </div>

          <div className="card p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-4 h-4 text-yellow-600" />
              </div>
              <p className="text-gray-600 text-xs">Rating</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {business.rating.toFixed(1)}
              <span className="text-sm text-gray-500">/5</span>
            </p>
            <p className="text-xs text-gray-600">{business.reviewCount} reviews</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Actions - Compact */}
            <div className="card p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
                Quick Actions
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Link
                  href="/business/deals/new"
                  className="p-3 border border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center"
                >
                  <Plus className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="font-semibold text-gray-900 text-sm">Create New Deal</p>
                  <p className="text-xs text-gray-600">Add a new deal</p>
                </Link>
                <Link
                  href="/business/settings"
                  className="p-3 border border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center"
                >
                  <Edit className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                  <p className="font-semibold text-gray-900 text-sm">Edit Profile</p>
                  <p className="text-xs text-gray-600">Update business info</p>
                </Link>
              </div>
            </div>

            {/* Recent Deals */}
            <div className="card overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-bold text-gray-900">Recent Deals</h2>
              </div>
              {recentDeals.length === 0 ? (
                <div className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3 text-sm">No deals yet. Create your first deal!</p>
                  <Link href="/business/deals/new" className="btn-primary inline-block text-sm px-4 py-2">
                    Create a deal
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {recentDeals.map((deal, index) => {
                    const daysUntilExpiry = differenceInDays(new Date(deal.endDate), new Date())
                    const hoursSinceCreated = differenceInHours(new Date(), new Date(deal.createdAt))
                    const isEndingSoon = daysUntilExpiry <= 3 && daysUntilExpiry >= 0
                    const isNew = hoursSinceCreated <= 24
                    const conversionRate = deal.viewCount > 0 ? (deal.redemptionCount / deal.viewCount) * 100 : 0
                    
                    return (
                    <div 
                      key={deal.id} 
                      className="p-4 hover:bg-gray-50 transition-all card-hover relative animate-fade-in group"
                      // eslint-disable-next-line @next/next/no-inline-styles
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Badges */}
                      {(isEndingSoon || isNew) && (
                        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                          {isEndingSoon && (
                            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold animate-pulse">
                              🔥 Soon
                            </span>
                          )}
                          {isNew && (
                            <span className="bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                              ✨ New
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 flex-1 min-w-0">
                          {deal.image && (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                              <img
                                src={deal.image}
                                alt={deal.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{deal.title}</h3>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                deal.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {deal.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {deal.isSeasonal && (
                                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 flex-shrink-0">
                                  {deal.seasonalTag || 'Seasonal'}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-xs mb-1.5 line-clamp-1">{deal.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                              <span className="font-medium text-primary-600">{deal.discount}</span>
                              <span>•</span>
                              <div className="flex items-center gap-0.5">
                                <Eye className="w-3 h-3" />
                                <span>{deal.viewCount}</span>
                              </div>
                              <span>•</span>
                              <div className="flex items-center gap-0.5">
                                <Users className="w-3 h-3" />
                                <span>{deal.redemptionCount}</span>
                              </div>
                              {deal.viewCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className={conversionRate >= 5 ? 'text-green-600 font-medium' : conversionRate >= 2 ? 'text-yellow-600 font-medium' : 'text-orange-600 font-medium'}>
                                    {conversionRate.toFixed(1)}%
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              {daysUntilExpiry >= 0 ? (
                                <CountdownTimer endDate={new Date(deal.endDate)} />
                              ) : (
                                <span className="text-red-600 text-xs">Expired</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link
                            href={`/business/deals/${deal.id}/edit`}
                            className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                            aria-label="Edit deal"
                            title="Edit deal"
                          >
                            <Edit className="w-4 h-4" />
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

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Business Info */}
            <div className="card p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Business Info</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Category</p>
                  <p className="font-medium text-gray-900 text-sm">{business.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Address</p>
                  <p className="font-medium text-gray-900 text-sm">{business.address}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900 text-sm">{business.phone}</p>
                </div>
                {business.website && (
                  <div>
                    <p className="text-xs text-gray-600">Website</p>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-600 hover:underline text-sm"
                    >
                      {business.website}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600">Rating</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {business.rating.toFixed(1)} / 5.0 ({business.reviewCount} reviews)
                  </p>
                </div>
              </div>
              <Link
                href="/business/settings"
                className="mt-3 btn-secondary w-full text-center block text-sm py-2"
              >
                Edit Profile
              </Link>
            </div>

            {/* Ending Soon */}
            {endingSoon.length > 0 && (
              <div className="card p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-orange-600" />
                  Ending Soon
                </h2>
                <div className="space-y-2">
                  {endingSoon.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/business/deals/${deal.id}/edit`}
                      className="block p-2 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
                    >
                      <p className="font-semibold text-gray-900 text-xs mb-0.5 line-clamp-1">{deal.title}</p>
                      <p className="text-xs text-gray-600">
                        Ends {format(deal.endDate, 'MMM d')}
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
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">All Deals</h2>
            <Link
              href="/business/deals/new"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" />
              Create New
            </Link>
          </div>
          {deals.length === 0 ? (
            <div className="card p-8 text-center">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-2">No deals yet</p>
              <p className="text-gray-400 mb-4 text-sm">Create your first deal to attract UMBC students!</p>
              <Link href="/business/deals/new" className="btn-primary inline-block text-sm px-4 py-2">
                Create Your First Deal
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {deals.map((deal, index) => {
                const daysUntilExpiry = differenceInDays(new Date(deal.endDate), new Date())
                const hoursSinceCreated = differenceInHours(new Date(), new Date(deal.createdAt))
                const isEndingSoon = daysUntilExpiry <= 3 && daysUntilExpiry >= 0
                const isNew = hoursSinceCreated <= 24
                const conversionRate = deal.viewCount > 0 ? (deal.redemptionCount / deal.viewCount) * 100 : 0
                
                return (
                <div 
                  key={deal.id} 
                  className="card overflow-hidden card-hover animate-fade-in group"
                  // eslint-disable-next-line @next/next/no-inline-styles
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {deal.image && (
                    <div className="h-32 bg-gray-200 relative overflow-hidden">
                      <img
                        src={deal.image}
                        alt={deal.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 z-10">
                        {isEndingSoon && (
                          <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold animate-pulse">
                            🔥 Soon
                          </span>
                        )}
                        {isNew && (
                          <span className="bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold">
                            ✨ New
                          </span>
                        )}
                        {deal.isSeasonal && (
                          <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                            {deal.seasonalTag || 'Seasonal'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-bold text-gray-900 line-clamp-1 flex-1">{deal.title}</h3>
                      <div className="flex gap-1 flex-shrink-0">
                        <Link
                          href={`/business/deals/${deal.id}/edit`}
                          className="p-1 text-gray-600 hover:text-primary-600 transition"
                          aria-label="Edit deal"
                          title="Edit deal"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2">{deal.description}</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded text-xs font-semibold">
                        {deal.discount}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        deal.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {deal.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-1.5 mb-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />
                          <span>{deal.viewCount}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Users className="w-3 h-3" />
                          <span>{deal.redemptionCount}</span>
                        </div>
                      </div>
                      {deal.viewCount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Conversion</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-inline-styles */}
                              <div 
                                className={`h-full transition-all duration-500 rounded-full ${
                                  conversionRate >= 5 ? 'bg-green-600' : conversionRate >= 2 ? 'bg-yellow-600' : 'bg-red-600'
                                }`}
                                style={{ width: `${Math.min(100, conversionRate * 10)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${
                              conversionRate >= 5 ? 'text-green-600' : conversionRate >= 2 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {conversionRate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      {daysUntilExpiry >= 0 ? (
                        <CountdownTimer endDate={new Date(deal.endDate)} />
                      ) : (
                        <span className="text-red-600 font-medium">Expired</span>
                      )}
                      <span className="text-gray-500">
                        {format(deal.endDate, 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
