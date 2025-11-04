'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUpStudent, signUpBusiness } from '@/lib/firebase/auth'
import { ShoppingBag, Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function SignUpPage() {
  const router = useRouter()
  const [role, setRole] = useState<'student' | 'business'>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: '', color: '' }
    if (pwd.length < 6) return { strength: 1, label: 'Weak', color: 'bg-red-500' }
    if (pwd.length < 10) return { strength: 2, label: 'Medium', color: 'bg-yellow-500' }
    return { strength: 3, label: 'Strong', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      if (role === 'student') {
        await signUpStudent(email, password, name)
        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 2000)
      } else {
        await signUpBusiness(email, password, name)
        setSuccess(true)
        setTimeout(() => {
          router.push('/business/setup')
          router.refresh()
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
    } finally {
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join CampusDeals to discover exclusive deals
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-xl">
          {success ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Account Created!</h3>
              <p className="text-gray-600 mb-4">
                {role === 'student' 
                  ? 'Your account has been created successfully. Redirecting...'
                  : 'Your business account has been created. Redirecting to setup...'}
              </p>
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="flex gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setRole('student')
                    setError('')
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all ${
                    role === 'student'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('business')
                    setError('')
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all ${
                    role === 'business'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Business
                </button>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    {role === 'student' ? 'Full Name' : 'Business Name'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 block w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder={role === 'student' ? 'John Doe' : 'Business Name'}
                    />
                  </div>
                </div>

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
                  {role === 'student' && (
                    <p className="mt-1.5 text-xs text-gray-500 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Must use your UMBC email address
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 block w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${passwordStrength.color} ${
                              passwordStrength.strength === 1 ? 'w-1/3' :
                              passwordStrength.strength === 2 ? 'w-2/3' :
                              passwordStrength.strength === 3 ? 'w-full' : 'w-0'
                            }`}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          passwordStrength.strength === 1 ? 'text-red-600' :
                          passwordStrength.strength === 2 ? 'text-yellow-600' :
                          passwordStrength.strength === 3 ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {password.length < 6 ? 'Password must be at least 6 characters' : 'Password strength: ' + passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    <p className="font-medium">Error</p>
                    <p className="text-sm mt-1">{error}</p>
                    {error.includes('configuration-not-found') && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <p className="text-xs font-medium mb-1">Quick Fix:</p>
                        <ol className="text-xs list-decimal list-inside space-y-1 text-red-700">
                          <li>Go to Firebase Console → Authentication</li>
                          <li>Click "Sign-in method" tab</li>
                          <li>Enable "Email/Password" provider</li>
                          <li>Save and restart your dev server</li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || password.length < 6}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    'Sign up'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-700">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

