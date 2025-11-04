'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import { MapPin, TrendingUp, Star, Users, CheckCircle, Clock, Shield, DollarSign, ShoppingBag, Heart, Zap, Award } from 'lucide-react'

export default function HomePage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect authenticated users to their respective dashboards
    if (!loading && user && userData) {
      if (userData.role === 'student') {
        router.push('/dashboard')
      } else if (userData.role === 'business') {
        router.push('/business/dashboard')
      }
    }
  }, [user, userData, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Don't render landing page if user is authenticated (will redirect)
  if (user && userData) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              CampusDeals
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Discover exclusive deals from local Arbutus businesses, 
              exclusively for UMBC students
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/deals"
                className="bg-white text-primary-600 px-8 py-4 rounded-xl font-bold hover:bg-primary-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-lg"
              >
                Browse Deals
              </Link>
              <Link
                href="/business/signup"
                className="bg-primary-500/90 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-400 transition-all duration-200 border-2 border-white/30 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-lg"
              >
                List Your Business
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
              Why CampusDeals?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to save money and support local businesses
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <div className="card p-8 text-center card-hover flex flex-col h-full">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 flex-shrink-0">
                <MapPin className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 flex-shrink-0">Local Focus</h3>
              <p className="text-gray-600 leading-relaxed flex-grow">
                Connect with businesses right in your Arbutus neighborhood
              </p>
            </div>
            <div className="card p-8 text-center card-hover flex flex-col h-full">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 flex-shrink-0">Exclusive Deals</h3>
              <p className="text-gray-600 leading-relaxed flex-grow">
                Student-only discounts and promotions you won't find elsewhere
              </p>
            </div>
            <div className="card p-8 text-center card-hover flex flex-col h-full">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 flex-shrink-0">
                <Star className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 flex-shrink-0">Student Verified</h3>
              <p className="text-gray-600 leading-relaxed flex-grow">
                UMBC email verification ensures deals stay exclusive to students
              </p>
            </div>
            <div className="card p-8 text-center card-hover flex flex-col h-full">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 flex-shrink-0">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 flex-shrink-0">Support Local</h3>
              <p className="text-gray-600 leading-relaxed flex-grow">
                Help local businesses thrive while you save money
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps and start saving money today
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            <div className="relative flex flex-col pt-6">
              <div className="card p-8 text-center flex flex-col h-full">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg z-20">
                  1
                </div>
                <div className="mt-4 mb-4 flex-shrink-0">
                  <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto">
                    <Shield className="w-10 h-10 text-primary-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex-shrink-0">Sign Up</h3>
                <p className="text-gray-600 leading-relaxed flex-grow">
                  Create your account with your UMBC email address. Verification is instant and secure.
                </p>
              </div>
            </div>
            
            <div className="relative flex flex-col pt-6">
              <div className="card p-8 text-center flex flex-col h-full">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg z-20">
                  2
                </div>
                <div className="mt-4 mb-4 flex-shrink-0">
                  <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-10 h-10 text-primary-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex-shrink-0">Browse Deals</h3>
                <p className="text-gray-600 leading-relaxed flex-grow">
                  Explore exclusive discounts from local Arbutus businesses. Filter by category, save favorites, and find the best offers.
                </p>
              </div>
            </div>
            
            <div className="relative flex flex-col sm:col-span-2 lg:col-span-1 pt-6">
              <div className="card p-8 text-center flex flex-col h-full">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg z-20">
                  3
                </div>
                <div className="mt-4 mb-4 flex-shrink-0">
                  <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto">
                    <DollarSign className="w-10 h-10 text-primary-600" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex-shrink-0">Save Money</h3>
                <p className="text-gray-600 leading-relaxed flex-grow">
                  Redeem deals at local businesses, write reviews, and help support the Arbutus community while you save.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">50+</div>
              <div className="text-primary-100 text-sm md:text-base">Local Businesses</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">200+</div>
              <div className="text-primary-100 text-sm md:text-base">Active Deals</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">$5K+</div>
              <div className="text-primary-100 text-sm md:text-base">Saved by Students</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">4.8★</div>
              <div className="text-primary-100 text-sm md:text-base">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Why Students Love CampusDeals
              </h2>
              <p className="text-lg text-gray-600">
                Discover what makes us different from other deal platforms
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">100% Free for Students</h3>
                  <p className="text-gray-600">
                    No hidden fees, no subscriptions. All deals are completely free to access once you're verified as a UMBC student.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Always Up-to-Date</h3>
                  <p className="text-gray-600">
                    New deals added daily from local businesses. Never miss out on limited-time offers and flash sales.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Save Your Favorites</h3>
                  <p className="text-gray-600">
                    Bookmark deals you're interested in and access them anytime. Build your personal collection of savings.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Instant Access</h3>
                  <p className="text-gray-600">
                    No waiting, no approval process. Sign up and immediately start browsing and redeeming deals.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Hyperlocal Focus</h3>
                  <p className="text-gray-600">
                    All businesses are within walking distance or a short drive from UMBC. Perfect for students without cars.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Verified Businesses</h3>
                  <p className="text-gray-600">
                    Every business is verified and reviewed by students. Read honest reviews before you visit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Businesses Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  Are You a Local Business?
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Join CampusDeals and connect directly with thousands of UMBC students. Increase foot traffic, build brand awareness, and grow your customer base in the Arbutus community.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Reach 10,000+ Students</h3>
                      <p className="text-gray-600 text-sm">Direct access to UMBC's student population</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Easy Deal Management</h3>
                      <p className="text-gray-600 text-sm">Create, edit, and track your deals with our intuitive dashboard</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Analytics & Insights</h3>
                      <p className="text-gray-600 text-sm">Track views, redemptions, and customer engagement</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Affordable Pricing</h3>
                      <p className="text-gray-600 text-sm">Flexible plans designed for local businesses</p>
                    </div>
                  </div>
                </div>
                <Link
                  href="/business/signup"
                  className="btn-primary inline-block"
                >
                  Get Started as a Business
                </Link>
              </div>
              <div className="card p-8 bg-white">
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="w-12 h-12 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Success Stories</h3>
                  <div className="space-y-6 text-left">
                    <div className="border-l-4 border-primary-600 pl-4">
                      <p className="text-gray-700 italic mb-2">
                        "CampusDeals brought us 40% more student customers in just 3 months!"
                      </p>
                      <p className="text-sm text-gray-500">— Arbutus Pizza & Subs</p>
                    </div>
                    <div className="border-l-4 border-primary-600 pl-4">
                      <p className="text-gray-700 italic mb-2">
                        "The platform is so easy to use. We can create deals in minutes and see results immediately."
                      </p>
                      <p className="text-sm text-gray-500">— Campus Corner Coffee</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to start saving?
          </h2>
          <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
            Join thousands of UMBC students who are already saving money with exclusive local deals. Sign up with your UMBC email and unlock exclusive deals today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-white text-primary-600 px-8 py-4 rounded-xl font-bold hover:bg-primary-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 inline-block text-lg"
            >
              Get Started Free
            </Link>
            <Link
              href="/deals"
              className="bg-primary-500/90 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-400 transition-all duration-200 border-2 border-white/30 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 inline-block text-lg"
            >
              Browse Deals
            </Link>
          </div>
          <p className="mt-6 text-primary-200 text-sm">
            ✓ No credit card required • ✓ Instant verification • ✓ 100% free for students
          </p>
        </div>
      </section>
    </div>
  )
}

