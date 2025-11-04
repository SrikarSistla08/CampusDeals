'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { getDealById, incrementDealViews } from '@/lib/firebase/deals'
import { addFavorite, removeFavorite, isFavorite } from '@/lib/firebase/favorites'
import { redeemDeal, hasUserRedeemed } from '@/lib/firebase/redemptions'
import { Deal } from '@/types'
import { Calendar, MapPin, Tag, ArrowLeft, Heart, CheckCircle, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export default function DealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, userData } = useAuth()
  const dealId = params.id as string
  const [deal, setDeal] = useState<Deal | null>(null)
  const [favorited, setFavorited] = useState(false)
  const [redeemed, setRedeemed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (dealId) {
      loadDeal()
    }
  }, [dealId])

  const checkFavoriteAndRedemption = async () => {
    if (!user || !deal) return
    try {
      const [isFav, hasRedeemed] = await Promise.all([
        isFavorite(user.uid, dealId),
        hasUserRedeemed(user.uid, dealId),
      ])
      setFavorited(isFav)
      setRedeemed(hasRedeemed)
    } catch (error) {
      console.error('Error checking favorite/redemption:', error)
    }
  }

  const loadDeal = async () => {
    setLoading(true)
    try {
      const dealData = await getDealById(dealId)
      setDeal(dealData)
      if (dealData) {
        await incrementDealViews(dealId)
        if (user) {
          await checkFavoriteAndRedemption()
        }
      }
    } catch (error) {
      console.error('Error loading deal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!user || !deal) {
      router.push('/auth/login')
      return
    }

    setToggling(true)
    try {
      if (favorited) {
        await removeFavorite(user.uid, dealId)
        setFavorited(false)
      } else {
        await addFavorite(user.uid, dealId)
        setFavorited(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setToggling(false)
    }
  }

  const handleRedeem = async () => {
    if (!user || !deal) {
      router.push('/auth/login')
      return
    }

    if (!confirm('Redeem this deal? This will mark it as used.')) {
      return
    }

    try {
      await redeemDeal(user.uid, dealId)
      setRedeemed(true)
      alert('Deal redeemed successfully!')
    } catch (error) {
      console.error('Error redeeming deal:', error)
      alert('Failed to redeem deal. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Deal not found</p>
          <Link href="/deals" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to deals
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/deals"
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to deals
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {deal.image && (
          <div className="h-64 md:h-96 bg-gray-200 relative">
            <img
              src={deal.image}
              alt={deal.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{deal.title}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                <Link href={`/businesses/${deal.businessId}`} className="text-lg hover:text-primary-600 hover:underline">
                  {deal.businessName}
                </Link>
              </div>
            </div>
            <span className="bg-primary-600 text-white px-4 py-2 rounded-lg text-xl font-bold">
              {deal.discount}
            </span>
          </div>

          {/* Action Buttons */}
          {user && userData?.role === 'student' && (
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleToggleFavorite}
                disabled={toggling}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                  favorited
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
                <span>{favorited ? 'Saved' : 'Save Deal'}</span>
              </button>
              {!redeemed && (
                <button
                  onClick={handleRedeem}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Redeem Deal</span>
                </button>
              )}
              {redeemed && (
                <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span>Redeemed</span>
                </div>
              )}
              <Link
                href={`/deals/${dealId}/review`}
                className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Write Review</span>
              </Link>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-gray-600">
              <Tag className="w-5 h-5 mr-2" />
              <span>{deal.category}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2" />
              <span>Valid until {format(deal.endDate, 'MMM d, yyyy')}</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{deal.description}</p>
          </div>

          {deal.terms && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Terms & Conditions</h2>
              <p className="text-gray-700 whitespace-pre-line">{deal.terms}</p>
            </div>
          )}

          <div className="border-t pt-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                <p>Deal ID: {deal.id}</p>
                <p>Views: {deal.viewCount}</p>
              </div>
              <div className="text-right">
                <p>Valid from {format(deal.startDate, 'MMM d, yyyy')}</p>
                <p>to {format(deal.endDate, 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

