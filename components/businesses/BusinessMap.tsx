'use client'

import { Business } from '@/types'
import dynamic from 'next/dynamic'

// Dynamically import Leaflet to avoid SSR issues
const BusinessMapComponent = dynamic(() => import('./BusinessMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
})

interface BusinessMapProps {
  businesses: Business[]
  selectedBusinessId?: string
  onBusinessSelect?: (businessId: string) => void
}

export default function BusinessMap(props: BusinessMapProps) {
  return <BusinessMapComponent {...props} />
}
