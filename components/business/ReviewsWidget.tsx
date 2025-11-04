'use client'

import { ExternalReview } from '@/types'
import { Star, ExternalLink, MessageSquare } from 'lucide-react'

interface ReviewsWidgetProps {
  externalReviews?: ExternalReview[]
  platformRatings?: {
    google?: { rating: number; reviewCount?: number; url?: string }
    yelp?: { rating: number; reviewCount?: number; url?: string }
    facebook?: { rating: number; reviewCount?: number; url?: string }
  }
}

const platformIcons: Record<string, { name: string; color: string; icon: string }> = {
  google: {
    name: 'Google',
    color: 'bg-blue-100 text-blue-700',
    icon: 'G'
  },
  yelp: {
    name: 'Yelp',
    color: 'bg-red-100 text-red-700',
    icon: 'Y'
  },
  facebook: {
    name: 'Facebook',
    color: 'bg-blue-100 text-blue-700',
    icon: 'f'
  },
  tripadvisor: {
    name: 'TripAdvisor',
    color: 'bg-green-100 text-green-700',
    icon: 'T'
  },
  other: {
    name: 'Other',
    color: 'bg-gray-100 text-gray-700',
    icon: '★'
  }
}

export default function ReviewsWidget({ externalReviews, platformRatings }: ReviewsWidgetProps) {
  // Combine externalReviews and platformRatings
  const allReviews = []

  if (externalReviews && externalReviews.length > 0) {
    allReviews.push(...externalReviews)
  }

  if (platformRatings) {
    if (platformRatings.google) {
      allReviews.push({
        id: 'google',
        platform: 'google' as const,
        platformName: 'Google',
        rating: platformRatings.google.rating,
        reviewCount: platformRatings.google.reviewCount,
        reviewUrl: platformRatings.google.url
      })
    }
    if (platformRatings.yelp) {
      allReviews.push({
        id: 'yelp',
        platform: 'yelp' as const,
        platformName: 'Yelp',
        rating: platformRatings.yelp.rating,
        reviewCount: platformRatings.yelp.reviewCount,
        reviewUrl: platformRatings.yelp.url
      })
    }
    if (platformRatings.facebook) {
      allReviews.push({
        id: 'facebook',
        platform: 'facebook' as const,
        platformName: 'Facebook',
        rating: platformRatings.facebook.rating,
        reviewCount: platformRatings.facebook.reviewCount,
        reviewUrl: platformRatings.facebook.url
      })
    }
  }

  if (allReviews.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">External Reviews</h2>
        </div>
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm mb-2">No external reviews configured</p>
          <p className="text-xs text-gray-400">
            Add your Google, Yelp, or Facebook review links in settings
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary-600" />
        <h2 className="text-xl font-bold text-gray-900">External Reviews</h2>
      </div>
      <div className="space-y-4">
        {allReviews.map((review) => {
          const platformInfo = platformIcons[review.platform] || platformIcons.other
          return (
            <div
              key={review.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${platformInfo.color}`}>
                  {platformInfo.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{review.platformName}</h3>
                    {review.reviewCount && (
                      <span className="text-xs text-gray-500">
                        ({review.reviewCount.toLocaleString()} reviews)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(review.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {review.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              {review.reviewUrl && (
                <a
                  href={review.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-100 rounded-lg transition"
                  title={`View on ${review.platformName}`}
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Manage review links in{' '}
          <a href="/business/settings" className="text-primary-600 hover:underline font-medium">
            Business Settings
          </a>
        </p>
      </div>
    </div>
  )
}

