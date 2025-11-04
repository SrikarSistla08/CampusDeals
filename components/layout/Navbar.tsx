'use client'

import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { logout } from '@/lib/firebase/auth'
import { useRouter } from 'next/navigation'
import { ShoppingBag, User, LogOut, Settings } from 'lucide-react'

export function Navbar() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
              <Link href={
                user && userData?.role === 'student' ? "/dashboard" : 
                user && userData?.role === 'business' ? "/business/dashboard" : 
                "/"
              } className="flex items-center space-x-2 group">
                <div className="p-1.5 bg-primary-600 rounded-lg group-hover:bg-primary-700 transition-colors">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  CampusDeals
                </span>
              </Link>

          <div className="flex items-center space-x-1 sm:space-x-6">
            <Link 
              href="/deals" 
              className="hidden sm:block px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Deals
            </Link>
            <Link 
              href="/businesses" 
              className="hidden sm:block px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Businesses
            </Link>

            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <div className="flex items-center space-x-2 sm:space-x-4">
                {userData?.role === 'business' ? (
                  <Link
                    href="/business/dashboard"
                    className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                ) : (
                  <Link
                    href="/profile"
                    className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">Profile</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-primary text-sm px-4 py-2"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

