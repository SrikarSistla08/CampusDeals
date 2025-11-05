'use client'

import { useEffect, useState } from 'react'
import { getAllBusinesses } from '@/lib/firebase/businesses'
import { Business } from '@/types'
import Link from 'next/link'
import { MapPin, Phone, Star, ExternalLink, Navigation, Map } from 'lucide-react'
import BusinessMap from '@/components/businesses/BusinessMap'

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

  useEffect(() => {
    loadBusinesses()
  }, [])

  const loadBusinesses = async () => {
    setLoading(true)
    try {
      const businessesData = await getAllBusinesses()
      console.log('Loaded businesses:', businessesData.length, businessesData)
      setBusinesses(businessesData)
    } catch (error: any) {
      console.error('Error loading businesses:', error)
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please check your Firestore security rules in Firebase Console.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Generate Google Maps embed URL with markers
  const generateMapUrl = () => {
    if (businesses.length === 0) return ''
    
    // Center on Arbutus, MD
    const center = 'Arbutus,MD'
    const markers = businesses.map(b => encodeURIComponent(`${b.address}, Arbutus, MD`)).join('|')
    
    return `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${center}&zoom=13`
  }

  // Generate Google Maps search URL for a business
  const getGoogleMapsUrl = (business: Business) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.address}, Arbutus, MD`)}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-2 sm:mb-3">Local Businesses</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Discover businesses in Arbutus supporting UMBC students
            </p>
          </div>
          
          {/* View Toggle */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="inline-flex bg-white rounded-lg p-1 shadow-md border border-gray-200 w-full sm:w-auto max-w-xs sm:max-w-none">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 text-xs sm:text-sm rounded-md font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>List</span>
                </div>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex-1 sm:flex-initial px-4 sm:px-6 py-2 text-xs sm:text-sm rounded-md font-medium transition-all ${
                  viewMode === 'map'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Map className="w-4 h-4" />
                  <span>Map</span>
                </div>
              </button>
            </div>
          </div>
        </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-20 card max-w-md mx-auto p-12">
          <p className="text-gray-600 text-lg mb-2 font-medium">No businesses found</p>
          <p className="text-gray-400 mb-6">Need demo data to get started?</p>
          <Link href="/seed" className="btn-primary inline-block">
            Add Demo Data
          </Link>
        </div>
      ) : viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="card p-0 overflow-hidden">
              <BusinessMap
                businesses={businesses}
                selectedBusinessId={selectedBusiness || undefined}
                onBusinessSelect={setSelectedBusiness}
              />
            </div>
          </div>

          {/* Business List Sidebar */}
          <div className="space-y-4">
            <div className="card p-4 bg-primary-50 border-2 border-primary-200">
              <h3 className="font-bold text-gray-900 mb-1">📍 Arbutus, MD</h3>
              <p className="text-sm text-gray-600">
                {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'} found
              </p>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  onClick={() => setSelectedBusiness(business.id)}
                  className={`card p-4 cursor-pointer transition-all ${
                    selectedBusiness === business.id
                      ? 'ring-2 ring-primary-500 bg-primary-50'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-gray-900 text-sm">{business.name}</h4>
                    {business.rating > 0 && (
                      <div className="flex items-center text-yellow-500">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="ml-1 text-xs font-semibold">{business.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-1">{business.address}</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={getGoogleMapsUrl(business)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      Directions
                    </a>
                    <Link
                      href={`/businesses/${business.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium ml-auto"
                    >
                      View Deals →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {businesses.map((business) => (
            <div 
              key={business.id} 
              className={`card card-hover transition-all ${
                selectedBusiness === business.id ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => setSelectedBusiness(business.id)}
            >
              {business.logo && (
                <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                  <img
                    src={business.logo}
                    alt={business.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    {business.rating > 0 && (
                      <div className="flex items-center bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="ml-1 text-sm font-semibold text-gray-700">{business.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{business.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">{business.description}</p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-primary-600" />
                    <span className="flex-1">{business.address}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0 text-primary-600" />
                    <span>{business.phone}</span>
                  </div>
                  <a
                    href={getGoogleMapsUrl(business)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </a>
                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Website
                    </a>
                  )}
                </div>
                <Link
                  href={`/businesses/${business.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="block w-full text-center btn-primary text-sm py-2.5"
                >
                  View Deals
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

