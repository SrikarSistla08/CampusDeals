'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { getUserData } from '@/lib/firebase/auth'

export default function DebugAuthPage() {
  const { user, userData, loading } = useAuth()

  const handleCheckUserData = async () => {
    if (!user) {
      alert('No user logged in')
      return
    }
    
    const data = await getUserData(user.uid)
    console.log('User data from getUserData:', data)
    alert(`Role: ${data?.role || 'null'}\nEmail: ${data?.email || 'null'}\nName: ${data?.name || 'null'}`)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      <div className="space-y-4">
        <div className="card p-4">
          <h2 className="font-bold mb-2">AuthProvider State</h2>
          <p>User: {user ? user.uid : 'null'}</p>
          <p>User Email: {user?.email || 'null'}</p>
          <p>UserData: {userData ? JSON.stringify(userData, null, 2) : 'null'}</p>
          <p>Role: {userData?.role || 'null'}</p>
          <p>Loading: {loading ? 'true' : 'false'}</p>
        </div>
        <button
          onClick={handleCheckUserData}
          className="btn-primary"
        >
          Check User Data Directly
        </button>
      </div>
    </div>
  )
}

