'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useParams, useRouter } from 'next/navigation'
import { getBusinessByUserId } from '@/lib/firebase/businesses'
import { getDealById, updateDeal, deleteDeal } from '@/lib/firebase/deals'
import { uploadDealImage } from '@/lib/firebase/storage'
import { Deal } from '@/types'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Calendar,
  Tag,
  Gift,
  Sparkles,
  Trash2
} from 'lucide-react'

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

export default function EditDealPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string
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
    isActive: true,
    isSeasonal: false,
    seasonalTag: '',
    couponCode: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      loadDeal()
    }
  }, [user, dealId])

  const loadDeal = async () => {
    if (!user) return
    setLoading(true)
    try {
      const business = await getBusinessByUserId(user.uid)
      if (!business) {
        router.push('/business/setup')
        return
      }

      const deal = await getDealById(dealId)
      if (!deal) {
        router.push('/business/dashboard')
        return
      }

      if (deal.businessId !== business.id) {
        router.push('/business/dashboard')
        return
      }

      setFormData({
        title: deal.title,
        description: deal.description,
        discount: deal.discount,
        category: deal.category,
        startDate: deal.startDate.toISOString().split('T')[0],
        endDate: deal.endDate.toISOString().split('T')[0],
        terms: deal.terms || '',
        image: deal.image || '',
        isActive: deal.isActive,
        isSeasonal: deal.isSeasonal || false,
        seasonalTag: deal.seasonalTag || '',
        couponCode: deal.couponCode || '',
      })
      
      if (deal.image) {
        setImagePreview(deal.image)
      }
    } catch (error) {
      console.error('Error loading deal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setFormData({ ...formData, image: '' })
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData({ ...formData, image: '' })
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
    if (!user) return

    setError('')
    setSaving(true)

    try {
      const business = await getBusinessByUserId(user.uid)
      if (!business) {
        router.push('/business/setup')
        return
      }

      let imageUrl = formData.image

      // Upload new image if file is selected
      if (imageFile) {
        setUploading(true)
        imageUrl = await uploadDealImage(imageFile, business.id, dealId)
        setUploading(false)
      }

      await updateDeal(dealId, {
        title: formData.title,
        description: formData.description,
        discount: formData.discount,
        category: formData.category,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        terms: formData.terms || undefined,
        image: imageUrl || undefined,
        isActive: formData.isActive,
        isSeasonal: formData.isSeasonal,
        seasonalTag: formData.isSeasonal && formData.seasonalTag ? formData.seasonalTag : undefined,
        couponCode: formData.couponCode || undefined,
      })
      router.push('/business/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to update deal')
      setUploading(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      await deleteDeal(dealId)
      router.push('/business/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to delete deal')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="business">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="business">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Deal</h1>
          <p className="text-gray-600">Update your deal information and settings</p>
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
                {imagePreview ? (
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
                    <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
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
                <div className="text-center">
                  <span className="text-sm text-gray-500">OR</span>
                </div>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => {
                    setFormData({ ...formData, image: e.target.value })
                    if (e.target.value) {
                      setImageFile(null)
                      setImagePreview(e.target.value)
                    }
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter image URL"
                />
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

            {/* Dates & Status */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                Dates & Status
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
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                    Deal is active
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
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
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                <Trash2 className="w-5 h-5" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <span>Uploading...</span>
                  </>
                ) : saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
