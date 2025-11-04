'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useRouter } from 'next/navigation'
import { getBusinessByUserId } from '@/lib/firebase/businesses'
import { createDeal } from '@/lib/firebase/deals'
import { uploadDealImage } from '@/lib/firebase/storage'
import { Deal } from '@/types'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Calendar,
  Tag,
  Gift,
  Sparkles
} from 'lucide-react'
import ProgressBar from '@/components/ui/ProgressBar'

const categories = [
  { id: 'food', name: 'Food & Dining' },
  { id: 'retail', name: 'Retail & Shopping' },
  { id: 'services', name: 'Services' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'health', name: 'Health & Fitness' },
]

const seasonalTags = [
  'Summer Special',
  'Back to School',
  'Holiday Special',
  'New Year',
  'Spring Sale',
  'Black Friday',
  'Valentine\'s Day',
  'Easter',
  'Halloween',
  'Thanksgiving',
  'Winter Sale',
]

export default function NewDealPage() {
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: '',
    category: '',
    startDate: '',
    endDate: '',
    terms: '',
    image: '',
    isSeasonal: false,
    seasonalTag: '',
    couponCode: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    if (user) {
      loadBusiness()
    }
  }, [user])

  const loadBusiness = async () => {
    if (!user) return
    try {
      const business = await getBusinessByUserId(user.uid)
      if (business) {
        setBusinessName(business.name)
      } else {
        router.push('/business/setup')
      }
    } catch (error) {
      console.error('Error loading business:', error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setError('Please upload a JPG, PNG, or WebP image')
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB. Please compress your image first.')
        return
      }
      
      setError('')
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setFormData({ ...formData, image: '' }) // Clear URL if file is selected
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, couponCode: code })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to create a deal')
      return
    }

    setError('')
    
    // Validate dates
    if (!formData.startDate || !formData.endDate) {
      setError('Please select both start and end dates')
      return
    }

    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (endDate < startDate) {
      setError('End date must be after start date')
      return
    }

    if (endDate < today) {
      setError('End date cannot be in the past')
      return
    }

    // Validate required fields
    if (!formData.title.trim()) {
      setError('Deal title is required')
      return
    }

    if (!formData.description.trim()) {
      setError('Deal description is required')
      return
    }

    if (!formData.discount.trim()) {
      setError('Discount offer is required')
      return
    }

    if (!formData.category) {
      setError('Please select a category')
      return
    }

    setLoading(true)

    try {
      const business = await getBusinessByUserId(user.uid)
      if (!business) {
        setError('Business profile not found. Please complete your business setup first.')
        setLoading(false)
        setTimeout(() => router.push('/business/setup'), 2000)
        return
      }

      let imageUrl = formData.image

      // Upload image if file is selected
      if (imageFile) {
        let uploadTimeout: NodeJS.Timeout | null = null
        try {
          setUploading(true)
          setUploadProgress(0)
          
          console.log('Starting image upload...', {
            fileName: imageFile.name,
            fileSize: imageFile.size,
            businessId: business.id
          })
          
          // Set a timeout for upload (2 minutes max)
          uploadTimeout = setTimeout(() => {
            console.error('Upload timeout - taking too long')
            setUploading(false)
            setLoading(false)
            setError('Upload timeout. Please check:\n1. Firebase Storage is enabled\n2. Storage rules are configured\n3. Your internet connection\n4. Try a smaller image')
          }, 2 * 60 * 1000) // 2 minutes

          imageUrl = await uploadDealImage(
            imageFile, 
            business.id,
            undefined,
            (progress) => {
              setUploadProgress(Math.round(progress))
            }
          )
          
          if (uploadTimeout) clearTimeout(uploadTimeout)
          setUploading(false)
          setUploadProgress(0)
          console.log('Image upload successful:', imageUrl)
        } catch (uploadError: any) {
          if (uploadTimeout) clearTimeout(uploadTimeout)
          setUploading(false)
          setLoading(false)
          setUploadProgress(0)
          
          console.error('Upload error:', uploadError)
          
          // Provide detailed error message
          let errorMessage = uploadError.message || 'Upload failed'
          
          if (uploadError.message?.includes('Storage is not initialized')) {
            errorMessage = 'Firebase Storage not configured. Please:\n1. Enable Storage in Firebase Console\n2. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local\n3. Restart dev server'
          } else if (uploadError.message?.includes('Permission denied')) {
            errorMessage = 'Permission denied. Check Firebase Storage rules allow authenticated uploads.'
          } else if (uploadError.message?.includes('quota')) {
            errorMessage = 'Storage quota exceeded. Check Firebase Storage usage limits.'
          }
          
          setError(errorMessage)
          return
        }
      }

      const dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'redemptionCount' | 'viewCount'> = {
        businessId: business.id,
        businessName: business.name,
        title: formData.title.trim(),
        description: formData.description.trim(),
        discount: formData.discount.trim(),
        category: formData.category,
        startDate: startDate,
        endDate: endDate,
        terms: formData.terms?.trim() || undefined,
        image: imageUrl || undefined,
        isActive: true,
        isSeasonal: formData.isSeasonal,
        seasonalTag: formData.isSeasonal && formData.seasonalTag ? formData.seasonalTag : undefined,
        couponCode: formData.couponCode?.trim().toUpperCase() || undefined,
      }

      await createDeal(dealData)
      router.push('/business/dashboard')
    } catch (err: any) {
      console.error('Error creating deal:', err)
      setError(err.message || 'Failed to create deal. Please check your connection and try again.')
      setUploading(false)
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="business">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Deal</h1>
          <p className="text-gray-600">Attract UMBC students with exclusive deals and promotions</p>
        </div>

        <div className="card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-primary-600" />
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Deal Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="20% Off All Items"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Describe your deal in detail. What makes it special?"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Offer *
                    </label>
                    <input
                      id="discount"
                      type="text"
                      required
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="20% Off, Buy 1 Get 1 Free, $5 Off"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2 text-primary-600" />
                Deal Image
              </h2>
              <div className="space-y-4">
                {/* Image URL Option - Works without Storage billing */}
                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL <span className="text-green-600">(Works Now)</span>
                  </label>
                  <input
                    id="imageUrl"
                    type="url"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value })
                      if (e.target.value) {
                        setImageFile(null)
                        setImagePreview(e.target.value)
                      } else {
                        setImagePreview('')
                      }
                    }}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use a direct image URL from Imgur, Unsplash, or your hosting
                  </p>
                  {formData.image && (
                    <div className="mt-3 relative">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                        onError={() => {
                          setError('Invalid image URL. Please check the URL is correct.')
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, image: '' })
                          setImagePreview('')
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        aria-label="Remove image"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <span className="text-sm text-gray-500">OR</span>
                </div>

                {/* File Upload Option */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Image File <span className="text-orange-600">(Requires Storage Billing)</span>
                  </label>
                  {imagePreview && imageFile ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        aria-label="Remove image"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition"
                    >
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium mb-1">Click to upload image</p>
                      <p className="text-sm text-gray-500 mb-2">PNG, JPG up to 5MB</p>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mt-2">
                        <p className="text-xs text-orange-700 font-medium">
                          ⚠️ Requires Firebase Storage billing enabled
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                          Use Image URL option above if Storage isn't set up
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        aria-label="Upload deal image"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seasonal & Coupon */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Gift className="w-5 h-5 mr-2 text-primary-600" />
                Seasonal & Coupon Options
              </h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="isSeasonal"
                    type="checkbox"
                    checked={formData.isSeasonal}
                    onChange={(e) => setFormData({ ...formData, isSeasonal: e.target.checked, seasonalTag: e.target.checked ? formData.seasonalTag : '' })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isSeasonal" className="ml-2 text-sm font-medium text-gray-700">
                    Mark as Seasonal Deal
                  </label>
                </div>

                {formData.isSeasonal && (
                  <div>
                    <label htmlFor="seasonalTag" className="block text-sm font-medium text-gray-700 mb-2">
                      Seasonal Tag
                    </label>
                    <select
                      id="seasonalTag"
                      value={formData.seasonalTag}
                      onChange={(e) => setFormData({ ...formData, seasonalTag: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select a tag</option>
                      {seasonalTags.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Coupon Code (optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="couponCode"
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                      className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase"
                      placeholder="SAVE20"
                      maxLength={20}
                    />
                    <button
                      type="button"
                      onClick={generateCouponCode}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave empty if not using coupon codes</p>
                </div>
              </div>
            </div>

            {/* Dates & Terms */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                Dates & Terms
              </h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.startDate}
                      onChange={(e) => {
                        setFormData({ ...formData, startDate: e.target.value })
                        // Reset end date if it's before the new start date
                        if (formData.endDate && new Date(formData.endDate) < new Date(e.target.value)) {
                          setFormData({ ...formData, startDate: e.target.value, endDate: '' })
                        }
                      }}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      id="endDate"
                      type="date"
                      required
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-2">
                    Terms & Conditions (optional)
                  </label>
                  <textarea
                    id="terms"
                    rows={3}
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Any restrictions or conditions (e.g., Cannot be combined with other offers)"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-lg">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <span>Uploading {uploadProgress > 0 ? `${uploadProgress}%` : '...'}</span>
                  </>
                ) : loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <span>Creating...</span>
                  </>
                ) : (
                  'Create Deal'
                )}
              </button>
              {uploading && uploadProgress > 0 && (
                <div className="mt-2">
                  <ProgressBar progress={uploadProgress} label="Upload progress" />
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
