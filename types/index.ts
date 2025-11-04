export interface User {
  id: string
  email: string
  name: string
  role: 'student' | 'business'
  verified: boolean
  createdAt: Date
  umbcEmail?: string
}

export interface Business {
  id: string
  userId: string
  name: string
  description: string
  category: string
  address: string
  phone: string
  website?: string
  logo?: string
  images?: string[]
  rating: number
  reviewCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  externalReviews?: ExternalReview[] // Google, Yelp, etc.
  googlePlaceId?: string
  yelpBusinessId?: string
}

export interface Deal {
  id: string
  businessId: string
  businessName: string
  title: string
  description: string
  discount: string
  category: string
  startDate: Date
  endDate: Date
  image?: string
  terms?: string
  isActive: boolean
  redemptionCount: number
  viewCount: number
  createdAt: Date
  updatedAt: Date
  isSeasonal?: boolean
  seasonalTag?: string // e.g., "Summer 2024", "Holiday Special", "Back to School"
  couponCode?: string
}

export interface Review {
  id: string
  businessId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: Date
}

export interface DealRedemption {
  id: string
  dealId: string
  userId: string
  redeemedAt: Date
  qrCode?: string
}

export interface ExternalReview {
  id: string
  platform: 'google' | 'yelp' | 'facebook' | 'tripadvisor' | 'other'
  platformName: string
  rating: number
  reviewCount?: number
  reviewUrl?: string
  businessPlaceId?: string // For Google Places API integration
}

