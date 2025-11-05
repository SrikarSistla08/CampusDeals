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
  ChevronUp,
  Trophy,
  Award,
  Clock
} from 'lucide-react'
import { format, differenceInDays, differenceInHours } from 'date-fns'
import { addFavorite, removeFavorite } from '@/lib/firebase/favorites'

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
  const [animatedStats, setAnimatedStats] = useState({
    savedCount: 0,
    redeemedCount: 0,
    activeDeals: 0,
    actualSavings: 0,
    potentialSavings: 0,
  })
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [togglingFavorites, setTogglingFavorites] = useState<Set<string>>(new Set())
  const [achievements, setAchievements] = useState<string[]>([])

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Animate stats count-up with easing
  useEffect(() => {
    const duration = 1500 // 1.5 seconds for smoother animation
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
      // Animate all stats even if 0
      animateValue(0, stats.activeDeals, (val) => setAnimatedStats(prev => ({ ...prev, activeDeals: val })))
      animateValue(0, stats.savedCount, (val) => setAnimatedStats(prev => ({ ...prev, savedCount: val })))
      animateValue(0, stats.redeemedCount, (val) => setAnimatedStats(prev => ({ ...prev, redeemedCount: val })))
      animateValue(0, stats.actualSavings, (val) => setAnimatedStats(prev => ({ ...prev, actualSavings: val })), true)
      animateValue(0, stats.potentialSavings, (val) => setAnimatedStats(prev => ({ ...prev, potentialSavings: val })), true)
    }
  }, [loading, stats])

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

  // Calculate achievements based on stats
  useEffect(() => {
    const newAchievements: string[] = []
    
    if (stats.redeemedCount >= 1) {
      newAchievements.push('First Deal')
    }
    if (stats.redeemedCount >= 5) {
      newAchievements.push('Deal Hunter')
    }
    if (stats.redeemedCount >= 10) {
      newAchievements.push('Deal Master')
    }
    if (stats.actualSavings >= 50) {
      newAchievements.push('$50 Saver')
    }
    if (stats.actualSavings >= 100) {
      newAchievements.push('$100 Saver')
    }
    if (stats.actualSavings >= 250) {
      newAchievements.push('Big Saver')
    }
    if (stats.savedCount >= 10) {
      newAchievements.push('Collector')
    }
    
    setAchievements(newAchievements)
  }, [stats])

  // Load favorite IDs
  useEffect(() => {
    if (user) {
      loadFavorites()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadFavorites = async () => {
    if (!user) return
    try {
      const favorites = await getUserFavorites(user.uid)
      setFavoriteIds(new Set(favorites))
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
  }

  const handleToggleFavorite = async (dealId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) return
    
    setTogglingFavorites(prev => new Set(prev).add(dealId))
    try {
      if (favoriteIds.has(dealId)) {
        await removeFavorite(user.uid, dealId)
        setFavoriteIds(prev => {
          const next = new Set(prev)
          next.delete(dealId)
          return next
        })
      } else {
        await addFavorite(user.uid, dealId)
        setFavoriteIds(prev => new Set(prev).add(dealId))
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setTogglingFavorites(prev => {
        const next = new Set(prev)
        next.delete(dealId)
        return next
      })
    }
  }

  // Countdown timer component
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
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`)
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`)
        } else {
          setTimeLeft(`${minutes}m`)
        }
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 60000) // Update every minute
      
      return () => clearInterval(interval)
    }, [endDate])
    
    return (
      <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
        <Clock className="w-3 h-3" />
        <span>{timeLeft}</span>
      </div>
    )
  }

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
              {getGreeting()}, {userData?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <Sparkles className="w-6 h-6 text-primary-600 animate-pulse" />
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
                <span className="text-4xl font-bold text-green-700 transition-all duration-300">
                  ${animatedStats.actualSavings.toFixed(2)}
                </span>
              </div>
            </div>
            {/* Savings Progress Indicator */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress to $100</span>
                <span>{Math.min(100, Math.round((stats.actualSavings / 100) * 100))}%</span>
              </div>
              <div className="w-full h-2 bg-green-200 rounded-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-inline-styles */}
                <div 
                  className="h-full bg-green-600 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${Math.min(100, (stats.actualSavings / 100) * 100)}%` }}
                />
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
                <span className="text-4xl font-bold text-primary-700 transition-all duration-300">
                  ${animatedStats.potentialSavings.toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Potential Savings Progress */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Available deals</span>
                <span>{stats.activeDeals} deals</span>
              </div>
              <div className="w-full h-2 bg-primary-200 rounded-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-inline-styles */}
                <div 
                  className="h-full bg-primary-600 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${Math.min(100, (stats.activeDeals / 10) * 100)}%` }}
                />
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

        {/* Achievement Badges */}
        {achievements.length > 0 && (
          <div className="card p-6 mb-8 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-yellow-600" />
              <h3 className="text-xl font-bold text-gray-900">Achievements</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {achievements.map((achievement) => (
                <div
                  key={achievement}
                  className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-yellow-200"
                >
                  <Award className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-semibold text-gray-700">{achievement}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-primary-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900 transition-all duration-300">{animatedStats.activeDeals}</span>
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
              <span className="text-3xl font-bold text-gray-900 transition-all duration-300">{animatedStats.savedCount}</span>
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
              <span className="text-3xl font-bold text-gray-900 transition-all duration-300">{animatedStats.redeemedCount}</span>
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
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedSections.latestDeals ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-6 pb-6">
            {recentDeals.length === 0 ? (
                  <div className="p-12 text-center">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No deals available</p>
                <p className="text-gray-400 mb-6">Check back later for new deals!</p>
              </div>
            ) : (
              <div className="space-y-4">
                    {recentDeals.map((deal, index) => {
                      const daysUntilExpiry = differenceInDays(new Date(deal.endDate), new Date())
                      const hoursSinceCreated = differenceInHours(new Date(), new Date(deal.createdAt))
                      const isEndingSoon = daysUntilExpiry <= 3 && daysUntilExpiry >= 0
                      const isExpired = daysUntilExpiry < 0
                      const isNew = hoursSinceCreated <= 24
                      const isFavorite = favoriteIds.has(deal.id)
                      const isToggling = togglingFavorites.has(deal.id)
                      
                      return (
                      <div
                        key={deal.id}
                        className="card p-5 card-hover relative animate-fade-in group"
                        // eslint-disable-next-line @next/next/no-inline-styles
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Badges */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                          {isEndingSoon && !isExpired && (
                            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                              🔥 Ending Soon
                            </span>
                          )}
                          {isNew && (
                            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                              ✨ New
                            </span>
                          )}
                        </div>

                        {/* Quick Save Button */}
                        <button
                          onClick={(e) => handleToggleFavorite(deal.id, e)}
                          disabled={isToggling}
                          className="absolute top-2 left-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all z-10 disabled:opacity-50"
                          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart 
                            className={`w-5 h-5 transition-all ${
                              isFavorite 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-gray-400 hover:text-red-500'
                            }`}
                          />
                        </button>

                  <Link
                    href={`/deals/${deal.id}`}
                          className="block"
                  >
                    <div className="flex gap-4">
                      {deal.image && (
                              <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <img
                            src={deal.image}
                            alt={deal.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                                <h3 className="text-lg font-bold text-gray-900 line-clamp-1 pr-2">{deal.title}</h3>
                                <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                            {deal.discount}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{deal.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{deal.businessName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Expires {format(deal.endDate, 'MMM d')}</span>
                          </div>
                                {daysUntilExpiry >= 0 && (
                                  <CountdownTimer endDate={new Date(deal.endDate)} />
                                )}
                        </div>
                      </div>
                    </div>
                  </Link>
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
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
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedSections.savedDeals ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
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
                    {savedDeals.map((deal, index) => {
                      const daysUntilExpiry = differenceInDays(new Date(deal.endDate), new Date())
                      const hoursSinceCreated = differenceInHours(new Date(), new Date(deal.createdAt))
                      const isEndingSoon = daysUntilExpiry <= 3 && daysUntilExpiry >= 0
                      const isNew = hoursSinceCreated <= 24
                      const isToggling = togglingFavorites.has(deal.id)
                      
                      return (
                      <div
                        key={deal.id}
                        className="card p-5 card-hover relative animate-fade-in group"
                        // eslint-disable-next-line @next/next/no-inline-styles
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Badges */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                          {isEndingSoon && (
                            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                              🔥 Ending Soon
                            </span>
                          )}
                          {isNew && (
                            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                              ✨ New
                            </span>
                          )}
                        </div>

                        {/* Quick Save Button (always filled for saved deals) */}
                        <button
                          onClick={(e) => handleToggleFavorite(deal.id, e)}
                          disabled={isToggling}
                          className="absolute top-2 left-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all z-10 disabled:opacity-50"
                          aria-label="Remove from favorites"
                        >
                          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                        </button>

                  <Link
                    href={`/deals/${deal.id}`}
                          className="block"
                  >
                    <div className="flex gap-4">
                      {deal.image && (
                              <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <img
                            src={deal.image}
                            alt={deal.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                                <h3 className="text-lg font-bold text-gray-900 line-clamp-1 pr-2">{deal.title}</h3>
                                <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                                  {deal.discount}
                                </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{deal.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{deal.businessName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Expires {format(deal.endDate, 'MMM d')}</span>
                          </div>
                                {daysUntilExpiry >= 0 && (
                                  <CountdownTimer endDate={new Date(deal.endDate)} />
                                )}
                        </div>
                      </div>
                    </div>
                  </Link>
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
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



