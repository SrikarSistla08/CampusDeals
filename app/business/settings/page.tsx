'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { getBusinessByUserId, updateBusiness } from '@/lib/firebase/businesses'
import { uploadBusinessLogo } from '@/lib/firebase/storage'
import { Business } from '@/types'
import { Image as ImageIcon, X } from 'lucide-react'

const categories = [
  'Food & Dining',
  'Retail & Shopping',
  'Services',
  'Entertainment',
  'Health & Fitness',
  'Other',
]

export default function BusinessSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    address: '',
    phone: '',
    website: '',
    logoUrl: '',
    googlePlaceId: '',
    yelpBusinessId: '',
    googleReviewUrl: '',
    yelpReviewUrl: '',
    facebookReviewUrl: '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadBusiness()
    }
  }, [user])

  const loadBusiness = async () => {
    if (!user) return
    setLoading(true)
    try {
      const business = await getBusinessByUserId(user.uid)
      if (business) {
        setFormData({
          name: business.name,
          description: business.description,
          category: business.category,
          address: business.address,
          phone: business.phone,
          website: business.website || '',
          logoUrl: business.logo || '',
          googlePlaceId: business.googlePlaceId || '',
          yelpBusinessId: business.yelpBusinessId || '',
          googleReviewUrl: business.externalReviews?.find(r => r.platform === 'google')?.reviewUrl || '',
          yelpReviewUrl: business.externalReviews?.find(r => r.platform === 'yelp')?.reviewUrl || '',
          facebookReviewUrl: business.externalReviews?.find(r => r.platform === 'facebook')?.reviewUrl || '',
        })
        if (business.logo) {
          setLogoPreview(business.logo)
        }
      } else {
        router.push('/business/setup')
      }
    } catch (error) {
      console.error('Error loading business:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setError('Please upload a JPG, PNG, or WebP image')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }
      setError('')
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
      setFormData({ ...formData, logoUrl: '' })
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview('')
    setFormData({ ...formData, logoUrl: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const business = await getBusinessByUserId(user.uid)
    if (!business) {
      router.push('/business/setup')
      return
    }

    setError('')
    setSaving(true)

    try {
      let logoUrl = formData.logoUrl

      // Upload logo file if selected
      if (logoFile) {
        try {
          setUploading(true)
          logoUrl = await uploadBusinessLogo(logoFile, business.id)
          setUploading(false)
        } catch (uploadError: any) {
          setUploading(false)
          setSaving(false)
          setError(`Failed to upload logo: ${uploadError.message || 'Please try again'}`)
          return
        }
      }

      // Build external reviews array
      const externalReviews = []
      if (formData.googleReviewUrl) {
        externalReviews.push({
          id: 'google',
          platform: 'google' as const,
          platformName: 'Google',
          rating: 0, // Will be fetched via API or entered manually
          reviewUrl: formData.googleReviewUrl,
          businessPlaceId: formData.googlePlaceId || undefined,
        })
      }
      if (formData.yelpReviewUrl) {
        externalReviews.push({
          id: 'yelp',
          platform: 'yelp' as const,
          platformName: 'Yelp',
          rating: 0,
          reviewUrl: formData.yelpReviewUrl,
        })
      }
      if (formData.facebookReviewUrl) {
        externalReviews.push({
          id: 'facebook',
          platform: 'facebook' as const,
          platformName: 'Facebook',
          rating: 0,
          reviewUrl: formData.facebookReviewUrl,
        })
      }

      await updateBusiness(business.id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        address: formData.address,
        phone: formData.phone,
        website: formData.website || undefined,
        logo: logoUrl || undefined,
        googlePlaceId: formData.googlePlaceId || undefined,
        yelpBusinessId: formData.yelpBusinessId || undefined,
        externalReviews: externalReviews.length > 0 ? externalReviews : undefined,
      })
      router.push('/business/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to update business profile')
    } finally {
      setSaving(false)
      setUploading(false)
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Business Settings</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat.toLowerCase()}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <input
              id="address"
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Website (optional)
            </label>
            <input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Business Logo */}
          <div className="pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Logo (optional)
            </label>
            
            {/* Logo URL Option */}
            <div className="mb-4">
              <label htmlFor="logoUrl" className="block text-xs text-gray-600 mb-1">
                Logo URL <span className="text-green-600">(Recommended)</span>
              </label>
              <input
                id="logoUrl"
                type="url"
                value={formData.logoUrl}
                onChange={(e) => {
                  setFormData({ ...formData, logoUrl: e.target.value })
                  if (e.target.value) {
                    setLogoFile(null)
                    setLogoPreview(e.target.value)
                  } else {
                    setLogoPreview('')
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use a direct image URL from Imgur, Unsplash, or your hosting
              </p>
              {formData.logoUrl && !logoFile && (
                <div className="mt-3 relative inline-block">
                  <img
                    src={formData.logoUrl}
                    alt="Logo preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    onError={() => {
                      setError('Invalid logo URL. Please check the URL is correct.')
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, logoUrl: '' })
                      setLogoPreview('')
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    aria-label="Remove logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="text-center mb-4">
              <span className="text-sm text-gray-500">OR</span>
            </div>

            {/* File Upload Option */}
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Upload Logo File <span className="text-orange-600">(Requires Storage Billing)</span>
              </label>
              {logoPreview && logoFile ? (
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    aria-label="Remove logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition"
                >
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm font-medium mb-1">Click to upload logo</p>
                  <p className="text-xs text-gray-500 mb-2">PNG, JPG up to 5MB</p>
                  <p className="text-xs text-orange-600 font-medium">
                    ⚠️ Requires Firebase Storage billing
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    aria-label="Upload business logo"
                  />
                </div>
              )}
            </div>
          </div>

          {/* External Reviews Section */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">External Reviews</h2>
            <p className="text-sm text-gray-600 mb-4">
              Connect your Google, Yelp, and Facebook review pages to display them on your dashboard.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="googleReviewUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Google Reviews URL
                </label>
                <input
                  id="googleReviewUrl"
                  type="url"
                  value={formData.googleReviewUrl}
                  onChange={(e) => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://www.google.com/maps/place/your-business"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from your Google Business Profile
                </p>
              </div>

              <div>
                <label htmlFor="googlePlaceId" className="block text-sm font-medium text-gray-700 mb-1">
                  Google Place ID (optional)
                </label>
                <input
                  id="googlePlaceId"
                  type="text"
                  value={formData.googlePlaceId}
                  onChange={(e) => setFormData({ ...formData, googlePlaceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="ChIJ..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: For advanced Google Places API integration
                </p>
              </div>

              <div>
                <label htmlFor="yelpReviewUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Yelp Reviews URL
                </label>
                <input
                  id="yelpReviewUrl"
                  type="url"
                  value={formData.yelpReviewUrl}
                  onChange={(e) => setFormData({ ...formData, yelpReviewUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://www.yelp.com/biz/your-business"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from your Yelp business page
                </p>
              </div>

              <div>
                <label htmlFor="yelpBusinessId" className="block text-sm font-medium text-gray-700 mb-1">
                  Yelp Business ID (optional)
                </label>
                <input
                  id="yelpBusinessId"
                  type="text"
                  value={formData.yelpBusinessId}
                  onChange={(e) => setFormData({ ...formData, yelpBusinessId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="your-business-name-arbutus"
                />
              </div>

              <div>
                <label htmlFor="facebookReviewUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook Reviews URL (optional)
                </label>
                <input
                  id="facebookReviewUrl"
                  type="url"
                  value={formData.facebookReviewUrl}
                  onChange={(e) => setFormData({ ...formData, facebookReviewUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://www.facebook.com/your-business/reviews"
                />
              </div>
            </div>
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
              disabled={saving || uploading}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {uploading ? 'Uploading logo...' : saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

