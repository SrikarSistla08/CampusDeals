'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Business } from '@/types'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface BusinessMapProps {
  businesses: Business[]
  selectedBusinessId?: string
  onBusinessSelect?: (businessId: string) => void
}

interface GeocodeCache {
  [address: string]: {
    lat: number
    lng: number
    timestamp: number
  }
}

// Cache for geocoded addresses (persists for 7 days)
const CACHE_KEY = 'business_geocode_cache'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

const getCachedGeocode = (address: string): { lat: number; lng: number } | null => {
  if (typeof window === 'undefined') return null
  try {
    const cache: GeocodeCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
    const cached = cache[address]
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { lat: cached.lat, lng: cached.lng }
    }
  } catch (e) {
    // Ignore cache errors
  }
  return null
}

const setCachedGeocode = (address: string, lat: number, lng: number) => {
  if (typeof window === 'undefined') return
  try {
    const cache: GeocodeCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
    cache[address] = { lat, lng, timestamp: Date.now() }
    // Clean old entries (keep last 100)
    const entries = Object.entries(cache).sort((a, b) => b[1].timestamp - a[1].timestamp)
    const cleaned = Object.fromEntries(entries.slice(0, 100))
    localStorage.setItem(CACHE_KEY, JSON.stringify(cleaned))
  } catch (e) {
    // Ignore cache errors
  }
}

// Fix for default marker icons in Leaflet with Next.js
const createIcon = (color: string = '#2563EB') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      position: relative;
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  })
}

// Rate-limited geocoding function
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  // Check cache first
  const cached = getCachedGeocode(address)
  if (cached) return cached

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${address}, Arbutus, MD`)}&limit=1`,
      {
        headers: {
          'User-Agent': 'CampusDeals/1.0'
        }
      }
    )
    
    const data = await response.json()
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)
      setCachedGeocode(address, lat, lng)
      return { lat, lng }
    }
  } catch (err) {
    console.error('Geocoding error for', address, err)
  }
  
  return null
}

export default function BusinessMapComponent({ businesses, selectedBusinessId, onBusinessSelect }: BusinessMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  // Arbutus, MD coordinates
  const arbutusCenter: [number, number] = [39.2544, -76.6994]

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map
    const map = L.map(mapRef.current, {
      center: arbutusCenter,
      zoom: 13,
      zoomControl: true,
    })

    // Add OpenStreetMap tiles (free, no API key needed)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    // Cleanup on unmount
    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  const addMarker = useCallback((business: Business, lat: number, lng: number) => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current
    const isSelected = selectedBusinessId === business.id

    // Remove existing marker if it exists
    const existingMarker = markersRef.current.get(business.id)
    if (existingMarker) {
      existingMarker.remove()
    }

    // Create marker with custom icon
    const marker = L.marker([lat, lng], {
      icon: createIcon(isSelected ? '#DC2626' : '#2563EB'),
    }).addTo(map)

    // Create popup
    const popup = L.popup({
      maxWidth: 250,
    }).setContent(`
      <div style="padding: 8px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px; color: #111827;">${business.name}</h3>
        <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${business.category}</p>
        <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">${business.address}</p>
        <a href="/businesses/${business.id}" style="color: #2563EB; text-decoration: none; font-size: 14px; font-weight: 500;">View Deals →</a>
      </div>
    `)

    marker.bindPopup(popup)

    // Add click handler - just open popup, no zooming
    marker.on('click', () => {
      marker.openPopup()
      if (onBusinessSelect) {
        onBusinessSelect(business.id)
      }
    })

    markersRef.current.set(business.id, marker)
  }, [selectedBusinessId, onBusinessSelect])

  // Update marker colors when selection changes
  useEffect(() => {
    if (!mapInstanceRef.current) return
    
    markersRef.current.forEach((marker, businessId) => {
      const isSelected = selectedBusinessId === businessId
      const newIcon = createIcon(isSelected ? '#DC2626' : '#2563EB')
      marker.setIcon(newIcon)
    })
  }, [selectedBusinessId])

  useEffect(() => {
    if (!mapInstanceRef.current || businesses.length === 0) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current.clear()

    // Batch geocode with rate limiting (process 3 at a time, 1 second between batches)
    const processBatch = async () => {
      const batchSize = 3
      let processedCount = 0
      const total = businesses.length

      for (let i = 0; i < total; i += batchSize) {
        const batch = businesses.slice(i, i + batchSize)
        
        // Process batch in parallel
        const results = await Promise.all(
          batch.map(async (business) => {
            const coords = await geocodeAddress(business.address)
            if (coords) {
              addMarker(business, coords.lat, coords.lng)
            }
            processedCount++
          })
        )

        // Wait 1 second before next batch (respect rate limits)
        if (i + batchSize < total) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      // Final fitBounds after all markers are loaded (only once)
      setTimeout(() => {
        if (!mapInstanceRef.current) return
        const allMarkers = Array.from(markersRef.current.values())
        if (allMarkers.length > 1) {
          const group = new L.FeatureGroup(allMarkers)
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
        } else if (allMarkers.length === 1) {
          const firstMarker = allMarkers[0]
          const pos = firstMarker.getLatLng()
          mapInstanceRef.current.setView([pos.lat, pos.lng], 15)
        }
      }, 500)
    }

    processBatch()
  }, [businesses, addMarker])

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-200 relative">
      <div ref={mapRef} className="w-full h-full min-h-[600px] z-0" />
      <div className="absolute top-4 right-4 z-[1000]">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-xs text-gray-600">
          💡 Free OpenStreetMap
        </div>
      </div>
    </div>
  )
}


