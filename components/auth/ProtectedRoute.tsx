'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'student' | 'business'
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(redirectTo)
        return
      }

      // Wait a bit for userData to load if it's not available yet
      if (requiredRole && !userData) {
        // Give it a moment for AuthProvider to fetch userData
        const timer = setTimeout(() => {
          if (requiredRole && userData?.role !== requiredRole) {
            router.push('/auth/login')
          }
        }, 1000)
        return () => clearTimeout(timer)
      }

      if (requiredRole && userData?.role !== requiredRole) {
        console.log('Role mismatch:', { required: requiredRole, actual: userData?.role })
        router.push('/auth/login')
        return
      }
    }
  }, [user, userData, loading, requiredRole, router, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredRole && userData?.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}

