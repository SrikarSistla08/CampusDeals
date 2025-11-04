'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, getUserData } from '@/lib/firebase/auth'
import { ShoppingBag, Mail, Lock, Eye, EyeOff, GraduationCap, Building2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'student' | 'business'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await signIn(email, password)
      console.log('User signed in:', user.uid)
      
      // Wait a bit for Firestore to sync, then get user data
      // Retry a few times in case of timing issues
      let userData = null
      let attempts = 0
      
      while (!userData && attempts < 5) {
        userData = await getUserData(user.uid)
        console.log(`Attempt ${attempts + 1}: User data:`, userData)
        
        if (!userData && attempts < 4) {
          await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms
        }
        attempts++
      }
      
      if (!userData) {
        console.error('Failed to load user data after 5 attempts')
        setError('Unable to load user data. Please refresh and try again.')
        setLoading(false)
        return
      }
      
      console.log('User role:', userData.role)
      
      // Verify the role matches the selected tab
      if (userData.role !== role) {
        setError(`This account is registered as a ${userData.role}. Please select the correct login type.`)
        setLoading(false)
        return
      }
      
      // Redirect based on role
      const redirectPath = userData.role === 'business' ? '/business/dashboard' : '/dashboard'
      console.log('Redirecting to:', redirectPath)
      
      // Use window.location for a hard redirect to ensure auth state is fully updated
      window.location.href = redirectPath
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to sign in')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="p-3 bg-primary-100 rounded-2xl">
              <ShoppingBag className="w-10 h-10 text-primary-600" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose your account type to continue
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-xl">
          {/* Role Selection Tabs */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => {
                setRole('student')
                setError('')
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                role === 'student'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              Student
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('business')
                setError('')
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                role === 'business'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Business
            </button>
          </div>

          {/* Description based on selected role */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 text-center">
              {role === 'student' 
                ? 'Access exclusive deals from local Arbutus businesses'
                : 'Manage your business profile and deals'}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={role === 'student' ? 'yourname@umbc.edu' : 'business@email.com'}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 block w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-lg">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Signing in...</span>
                </>
              ) : (
                `Sign in as ${role === 'student' ? 'Student' : 'Business'}`
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
            {role === 'student' ? (
              <p className="text-center text-sm text-gray-600">
                Don't have a student account?{' '}
                <Link href="/auth/signup" className="font-medium text-primary-600 hover:text-primary-700">
                  Sign up
                </Link>
              </p>
            ) : (
              <p className="text-center text-sm text-gray-600">
                Don't have a business account?{' '}
                <Link href="/business/signup" className="font-medium text-primary-600 hover:text-primary-700">
                  Business sign up
                </Link>
              </p>
            )}
            <p className="text-center text-xs text-gray-500">
              {role === 'student' ? (
                <>
                  Business owner?{' '}
                  <Link href="/business/signup" className="font-medium text-primary-600 hover:text-primary-700">
                    Switch to business
                  </Link>
                </>
              ) : (
                <>
                  Student?{' '}
                  <button
                    onClick={() => setRole('student')}
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    Switch to student login
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

