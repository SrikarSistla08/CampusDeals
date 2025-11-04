'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { getDealById } from '@/lib/firebase/deals'
import { getBusinessById } from '@/lib/firebase/businesses'
import { getUserReview, createReview } from '@/lib/firebase/reviews'
import { Deal, Business } from '@/types'
import { Star, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { user, userData } = useAuth()
  const dealId = params.id as string
  const [deal, setDeal] = useState<Deal | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user || userData?.role !== 'student') {
      router.push('/auth/login')
      return
    }
    if (dealId) {
      loadData()
    }
  }, [dealId, user, userData])

  const loadData = async () => {
    setLoading(true)
    try {
      const dealData = await getDealById(dealId)
      if (dealData) {
        setDeal(dealData)
        const businessData = await getBusinessById(dealData.businessId)
        setBusiness(businessData)
        
        // Check if user already reviewed
        if (user) {
          const existingReview = await getUserReview(dealData.businessId, user.uid)
          if (existingReview) {
            setRating(existingReview.rating)
            setComment(existingReview.comment)
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !deal || !business) return

    setError('')
    setSubmitting(true)

    try {
      await createReview({
        businessId: business.id,
        userId: user.uid,
        userName: userData?.name || user.email || 'Anonymous',
        rating,
        comment,
      })
      router.push(`/businesses/${business.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to submit review')
    } finally {
      setSubmitting(false)
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

  if (!deal || !business) {
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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href={`/deals/${dealId}`}
        className="flex items-center text-gray-600 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to deal
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Write a Review</h1>
        <p className="text-gray-600 mb-6">
          Reviewing: <span className="font-semibold">{business.name}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="focus:outline-none"
                  aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      value <= rating
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    } hover:text-yellow-400 transition`}
                  />
                </button>
              ))}
              <span className="ml-2 text-gray-600">{rating} out of 5</span>
            </div>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Your Review
            </label>
            <textarea
              id="comment"
              required
              rows={6}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder="Share your experience with this business..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

