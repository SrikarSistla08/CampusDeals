import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore'
import { db } from './config'
import { Business, Review } from '@/types'

export const getBusinessById = async (businessId: string): Promise<Business | null> => {
  const businessDoc = await getDoc(doc(db, 'businesses', businessId))
  if (!businessDoc.exists()) return null

  const data = businessDoc.data()
  return {
    id: businessDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Business
}

export const getBusinessByUserId = async (userId: string): Promise<Business | null> => {
  const q = query(
    collection(db, 'businesses'),
    where('userId', '==', userId),
    limit(1)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Business
}

export const getAllBusinesses = async (): Promise<Business[]> => {
  try {
    // Get all active businesses (without orderBy to avoid index requirements)
    const q = query(
      collection(db, 'businesses'),
      where('isActive', '==', true)
    )

    const snapshot = await getDocs(q)
    let businesses = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Business
    })

    // Sort in memory by creation date (newest first)
    businesses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return businesses
  } catch (error: any) {
    console.error('Error fetching businesses:', error)
    if (error.code === 'permission-denied') {
      console.error('Firestore permission denied. Check your security rules.')
      return []
    }
    throw error
  }
}

export const createBusiness = async (businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount'>): Promise<string> => {
  const businessRef = doc(collection(db, 'businesses'))
  await setDoc(businessRef, {
    ...businessData,
    rating: 0,
    reviewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return businessRef.id
}

export const updateBusiness = async (businessId: string, updates: Partial<Business>): Promise<void> => {
  // Filter out undefined values as Firestore doesn't accept them
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  ) as Partial<Business>
  
  await updateDoc(doc(db, 'businesses', businessId), {
    ...cleanUpdates,
    updatedAt: serverTimestamp(),
  })
}

export const getBusinessReviews = async (businessId: string): Promise<Review[]> => {
  try {
    // Get all reviews for the business (without orderBy to avoid index requirements)
    const q = query(
      collection(db, 'reviews'),
      where('businessId', '==', businessId)
    )

    const snapshot = await getDocs(q)
    let reviews = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Review
    })

    // Sort in memory by creation date (newest first)
    reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return reviews
  } catch (error: any) {
    console.error('Error fetching reviews:', error)
    if (error.code === 'permission-denied') {
      console.error('Firestore permission denied. Check your security rules.')
      return []
    }
    throw error
  }
}

