'use client'

import { useEffect, useState } from 'react'
import { getActiveDeals } from '@/lib/firebase/deals'
import { searchDeals } from '@/lib/firebase/search'
import { Deal } from '@/types'
import Link from 'next/link'
import { Calendar, MapPin, Tag, Eye, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'

const categories = [
  { id: 'all', name: 'All Categories' },
  { id: 'food', name: 'Food & Dining' },
  { id: 'retail', name: 'Retail & Shopping' },
  { id: 'services', name: 'Services' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'health', name: 'Health & Fitness' },
]

const sortOptions = [
  { id: 'newest', name: 'Newest First' },
  { id: 'popular', name: 'Most Popular' },
  { id: 'ending', name: 'Ending Soon' },
]

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'ending'>('newest')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch()
      } else {
        loadDeals()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [selectedCategory, sortBy, searchTerm])

  useEffect(() => {
    loadDeals()
  }, [selectedCategory, sortBy])

  const loadDeals = async () => {
    setLoading(true)
    try {
      const dealsData = await getActiveDeals(
        selectedCategory === 'all' ? undefined : selectedCategory,
        sortBy
      )
      console.log('Loaded deals:', dealsData.length, dealsData)
      setDeals(dealsData)
    } catch (error: any) {
      console.error('Error loading deals:', error)
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please check your Firestore security rules in Firebase Console.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadDeals()
      return
    }
    setLoading(true)
    try {
      const searchResults = await searchDeals(searchTerm)
      // Filter by category if selected
      const filtered = selectedCategory === 'all' 
        ? searchResults 
        : searchResults.filter(d => d.category === selectedCategory)
      setDeals(filtered)
    } catch (error) {
      console.error('Error searching deals:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Discover Deals</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Exclusive discounts from local Arbutus businesses
          </p>
        </div>

      {/* Search Bar */}
      <div className="mb-8 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search deals, businesses, or discounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-10 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4 text-primary-600" />
            <span>Filter by category:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular' | 'ending')}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 cursor-pointer"
              aria-label="Sort deals by"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-primary-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Deals Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-20 card max-w-md mx-auto p-12">
          <p className="text-gray-600 text-lg mb-2 font-medium">No deals found in this category</p>
          <p className="text-gray-400 mb-6">Need demo data to get started?</p>
          <Link href="/seed" className="btn-primary inline-block">
            Add Demo Data
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="card card-hover"
            >
              {deal.image && (
                <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                  <img
                    src={deal.image}
                    alt={deal.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="bg-primary-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      {deal.discount}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{deal.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">{deal.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-primary-600 flex-shrink-0" />
                    <span className="truncate">{deal.businessName}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Tag className="w-4 h-4 mr-2 text-primary-600 flex-shrink-0" />
                    <span>{categories.find(c => c.id === deal.category)?.name || deal.category}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    <span>Until {format(deal.endDate, 'MMM d')}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    <span>{deal.viewCount} views</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

