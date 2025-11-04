'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getBusinessById, getBusinessReviews } from '@/lib/firebase/businesses'
import { getActiveDeals } from '@/lib/firebase/deals'
import { Business, Deal, Review } from '@/types'
import { MapPin, Phone, Star, ExternalLink, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export default function BusinessDetailPage() {
  const params = useParams()
  const businessId = params.id as string
  const [business, setBusiness] = useState<Business | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (businessId) {
      loadBusinessData()
    }
  }, [businessId])

  const loadBusinessData = async () => {
    setLoading(true)
    try {
      const [businessData, reviewsData] = await Promise.all([
        getBusinessById(businessId),
        getBusinessReviews(businessId),
      ])

      if (businessData) {
        setBusiness(businessData)
        const dealsData = await getActiveDeals()
        const businessDeals = dealsData.filter(d => d.businessId === businessId)
        setDeals(businessDeals)
      }
      setReviews(reviewsData)
    } catch (error) {
      console.error('Error loading business data:', error)
    } finally {
      setLoading(false)
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

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Business not found</p>
          <Link href="/businesses" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to businesses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        {business.logo && (
          <div className="h-64 bg-gray-200 relative">
            <img
              src={business.logo}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{business.name}</h1>
              {business.rating > 0 && (
                <div className="flex items-center text-yellow-500 mb-2">
                  <Star className="w-6 h-6 fill-current" />
                  <span className="ml-2 text-gray-700 text-lg">
                    {business.rating.toFixed(1)} ({business.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-gray-700 mb-6 text-lg">{business.description}</p>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-2 text-primary-600" />
              <span>{business.address}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Phone className="w-5 h-5 mr-2 text-primary-600" />
              <span>{business.phone}</span>
            </div>
            {business.website && (
              <div className="flex items-center">
                <ExternalLink className="w-5 h-5 mr-2 text-primary-600" />
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  Visit Website
                </a>
              </div>
            )}
            <div className="flex items-center text-gray-600">
              <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                {business.category}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Deals */}
      {deals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Deals</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
              >
                {deal.image && (
                  <div className="h-48 bg-gray-200 relative">
                    <img
                      src={deal.image}
                      alt={deal.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{deal.title}</h3>
                    <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-sm font-medium">
                      {deal.discount}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2 text-sm line-clamp-2">{deal.description}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-4 h-4 mr-1" />
                    Valid until {format(deal.endDate, 'MMM d')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Reviews</h2>
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{review.userName}</p>
                    <div className="flex items-center text-yellow-500 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'fill-current' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {format(review.createdAt, 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="text-gray-700 mt-2">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

