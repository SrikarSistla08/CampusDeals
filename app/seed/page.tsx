'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { collection, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; businesses?: number; deals?: number } | null>(null)

  const demoBusinesses = [
    {
      id: 'demo-business-1',
      userId: 'demo-user-business-1',
      name: 'Arbutus Pizza & Subs',
      description: 'Family-owned pizza place serving authentic Italian-style pizzas, subs, and wings. Perfect for late-night study sessions!',
      category: 'food',
      address: '1234 Sulphur Spring Rd, Arbutus, MD 21227',
      phone: '(410) 555-0101',
      website: 'https://example.com/arbutus-pizza',
      logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
      isActive: true,
      rating: 4.5,
      reviewCount: 12,
    },
    {
      id: 'demo-business-2',
      userId: 'demo-user-business-2',
      name: 'Campus Corner Coffee',
      description: 'Local coffee shop offering artisanal coffee, pastries, and a cozy study atmosphere. Free WiFi for students!',
      category: 'food',
      address: '5678 Wilkens Ave, Arbutus, MD 21227',
      phone: '(410) 555-0102',
      website: 'https://example.com/campus-corner',
      logo: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400',
      isActive: true,
      rating: 4.8,
      reviewCount: 28,
    },
    {
      id: 'demo-business-3',
      userId: 'demo-user-business-3',
      name: 'Retriever Gym & Fitness',
      description: 'Full-service gym with student-friendly rates. Equipment, classes, and personal training available.',
      category: 'health',
      address: '9012 Route 1, Arbutus, MD 21227',
      phone: '(410) 555-0103',
      website: 'https://example.com/retriever-gym',
      logo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
      isActive: true,
      rating: 4.2,
      reviewCount: 15,
    },
    {
      id: 'demo-business-4',
      userId: 'demo-user-business-4',
      name: 'Arbutus Bookstore',
      description: 'Independent bookstore with textbooks, novels, and school supplies. Special student discounts!',
      category: 'retail',
      address: '3456 Maiden Choice Ln, Arbutus, MD 21227',
      phone: '(410) 555-0104',
      website: 'https://example.com/arbutus-books',
      logo: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      isActive: true,
      rating: 4.6,
      reviewCount: 19,
    },
    {
      id: 'demo-business-5',
      userId: 'demo-user-business-5',
      name: 'Quick Cuts Hair Salon',
      description: 'Professional hair salon with student pricing. Walk-ins welcome!',
      category: 'services',
      address: '7890 Washington Blvd, Arbutus, MD 21227',
      phone: '(410) 555-0105',
      website: 'https://example.com/quick-cuts',
      logo: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
      isActive: true,
      rating: 4.4,
      reviewCount: 23,
    },
    {
      id: 'demo-business-6',
      userId: 'demo-user-business-6',
      name: 'Billiards & Games',
      description: 'Pool hall and arcade perfect for unwinding after classes. Student nights every Thursday!',
      category: 'entertainment',
      address: '2345 Sulphur Spring Rd, Arbutus, MD 21227',
      phone: '(410) 555-0106',
      website: 'https://example.com/billiards-games',
      logo: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
      isActive: true,
      rating: 4.3,
      reviewCount: 17,
    },
  ]

  const demoDeals = [
    {
      businessId: 'demo-business-1',
      businessName: 'Arbutus Pizza & Subs',
      title: '20% Off Large Pizzas',
      description: 'Get 20% off any large pizza when you show your UMBC ID. Valid Monday-Thursday. Dine-in or takeout.',
      discount: '20% Off',
      category: 'food',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
      terms: 'Must present valid UMBC student ID. Cannot be combined with other offers. Valid Monday-Thursday only.',
      isActive: true,
      redemptionCount: 0,
      viewCount: 0,
    },
    {
      businessId: 'demo-business-1',
      businessName: 'Arbutus Pizza & Subs',
      title: 'Buy 1 Get 1 Free Wings',
      description: 'Buy any order of wings and get a second order of equal or lesser value FREE! Perfect for sharing with friends.',
      discount: 'BOGO Free',
      category: 'food',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      image: 'https://images.unsplash.com/photo-1527477396000-e27137b2c91b?w=800',
      terms: 'Valid on orders of 10 wings or more. Must show UMBC ID. Dine-in only.',
      isActive: true,
      redemptionCount: 0,
      viewCount: 0,
    },
    {
      businessId: 'demo-business-2',
      businessName: 'Campus Corner Coffee',
      title: '$2 Off Any Coffee Drink',
      description: 'Get $2 off any coffee, latte, cappuccino, or espresso drink. Perfect for fueling your study sessions!',
      discount: '$2 Off',
      category: 'food',
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
      terms: 'Valid with UMBC student ID. One per customer per day. Cannot be combined with other offers.',
      isActive: true,
      redemptionCount: 0,
      viewCount: 0,
    },
    {
      businessId: 'demo-business-2',
      businessName: 'Campus Corner Coffee',
      title: 'Free Pastry with Coffee',
      description: 'Buy any coffee and get a free pastry of your choice! Croissants, muffins, bagels, and more available.',
      discount: 'Free Pastry',
      category: 'food',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800',
      terms: 'Valid Monday-Friday 7am-10am. Must show UMBC ID. While supplies last.',
      isActive: true,
      redemptionCount: 0,
      viewCount: 0,
    },
    {
      businessId: 'demo-business-3',
      businessName: 'Retriever Gym & Fitness',
      title: '50% Off First Month',
      description: 'New members get 50% off their first month membership! Full access to all equipment and facilities.',
      discount: '50% Off',
      category: 'health',
      startDate: new Date(),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      terms: 'New members only. Must show UMBC student ID. Annual contract required after first month.',
      isActive: true,
      redemptionCount: 0,
      viewCount: 0,
    },
    {
      businessId: 'demo-business-3',
      businessName: 'Retriever Gym & Fitness',
      title: 'Free Personal Training Session',
      description: 'Get a free one-on-one personal training session when you sign up for a 3-month membership.',
      discount: 'Free Session',
      category: 'health',
      startDate: new Date(),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      terms: 'Valid with 3-month membership signup. Must show UMBC ID. One per person.',
      isActive: true,
      redemptionCount: 0,
      viewCount: 0,
    },
    {
      businessId: 'demo-business-4',
      businessName: 'Arbutus Bookstore',
      title: '15% Off All Textbooks',
      description: 'Save 15% on all textbooks when you show your UMBC ID. Perfect for stocking up for the semester!',
      discount: '15% Off',
      category: 'retail',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
      terms: 'Valid on new textbooks only. Must show UMBC student ID. Cannot be combined with other discounts.',
      isActive: true,
      redemptionCount: 0,
      viewCount: 0,
    },
    {
      businessId: 'demo-business-4',
      businessName: 'Arbutus Bookstore',
      title: 'Buy 2 Get 1 Free School Supplies',
      description: 'Buy any two school supply items and get a third item of equal or lesser value FREE!',
      discount: 'B2G1 Free',
      category: 'retail',
      startDate: new Date(),
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800',
      terms: 'Valid on notebooks, pens, folders, and binders. Must show UMBC ID.',
      isActive: true,
      redemptionCount: 0,
      viewCount: 0,
    },
    {
      businessId: 'demo-business-5',
      businessName: 'Quick Cuts Hair Salon',
      title: 'Student Discount - $5 Off',
      description: 'Get $5 off any haircut or style when you show your UMBC student ID. Walk-ins welcome!',
      discount: '$5 Off',
      category: 'services',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
      terms: 'Valid with UMBC student ID. Cannot be combined with other offers. Walk-ins subject to availability.',
      isActive: true,
      redemptionCount: 0,
      viewCount: 0,
    },
    {
      businessId: 'demo-business-6',
      businessName: 'Billiards & Games',
      title: '50% Off Game Time on Thursdays',
      description: 'Get 50% off pool table rentals and arcade games every Thursday night. Perfect for unwinding after classes!',
      discount: '50% Off',
      category: 'entertainment',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800',
      terms: 'Valid Thursday 5pm-11pm. Must show UMBC student ID. Applies to pool table rentals and arcade games.',
      isActive: true,
      redemptionCount: 0,
      viewCount: 0,
    },
    {
      businessId: 'demo-business-6',
      businessName: 'Billiards & Games',
      title: 'Free Appetizer with Drink Purchase',
      description: 'Buy any drink and get a free appetizer from our menu. Perfect for hanging out with friends!',
      discount: 'Free App',
      category: 'entertainment',
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      terms: 'Valid with purchase of any drink. Must show UMBC ID. One per customer.',
      isActive: true,
      redemptionCount: 0,
      viewCount: 0,
    },
  ]

  const handleSeed = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Add demo businesses
      for (const business of demoBusinesses) {
        await setDoc(doc(db, 'businesses', business.id), {
          ...business,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      // Add demo deals
      for (const deal of demoDeals) {
        const dealRef = doc(collection(db, 'deals'))
        await setDoc(dealRef, {
          ...deal,
          startDate: Timestamp.fromDate(deal.startDate),
          endDate: Timestamp.fromDate(deal.endDate),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      setResult({
        success: true,
        message: `Successfully added ${demoBusinesses.length} businesses and ${demoDeals.length} deals!`,
        businesses: demoBusinesses.length,
        deals: demoDeals.length,
      })
    } catch (error: any) {
      console.error('Error seeding data:', error)
      setResult({
        success: false,
        error: error.message || 'Failed to seed data',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Seed Demo Data</h1>
        <p className="text-gray-600 mb-6">
          Click the button below to populate your database with demo businesses and deals.
          This will add sample data so you can see how the app works.
        </p>

        <button
          onClick={handleSeed}
          disabled={loading}
          className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>Seeding data...</span>
            </>
          ) : (
            <span>Seed Demo Data</span>
          )}
        </button>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-semibold ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Success!' : 'Error'}
                </p>
                <p className={`mt-1 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message || result.error}
                </p>
                {result.success && result.businesses && result.deals && (
                  <div className="mt-3 space-y-1 text-sm text-green-700">
                    <p>✓ Added {result.businesses} businesses</p>
                    <p>✓ Added {result.deals} deals</p>
                    <p className="mt-2 font-medium">You can now view deals on the <a href="/deals" className="underline">Discover Deals</a> page!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This will add demo data to your Firestore database. 
            If you run this multiple times, it will create duplicate businesses (but deals will be unique).
            You may want to clear your database before running this again.
          </p>
        </div>
      </div>
    </div>
  )
}

