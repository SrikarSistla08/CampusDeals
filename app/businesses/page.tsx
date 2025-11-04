'use client'

import { useEffect, useState } from 'react'
import { getAllBusinesses } from '@/lib/firebase/businesses'
import { Business } from '@/types'
import Link from 'next/link'
import { MapPin, Phone, Star, ExternalLink } from 'lucide-react'

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Local Businesses</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover businesses in Arbutus supporting UMBC students
          </p>
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
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {businesses.map((business) => (
            <div key={business.id} className="card card-hover">
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
                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit Website
                    </a>
                  )}
                </div>
                <Link
                  href={`/businesses/${business.id}`}
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

