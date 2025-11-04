import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore'
import { db } from './config'
import { Review, Business } from '@/types'

export const createReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<string> => {
  const reviewRef = await addDoc(collection(db, 'reviews'), {
    ...reviewData,
    createdAt: serverTimestamp(),
  })

  // Update business rating
  await updateBusinessRating(reviewData.businessId)

  return reviewRef.id
}

export const getBusinessReviews = async (businessId: string): Promise<Review[]> => {
  const q = query(
    collection(db, 'reviews'),
    where('businessId', '==', businessId),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Review[]
}

export const getUserReview = async (businessId: string, userId: string): Promise<Review | null> => {
  const q = query(
    collection(db, 'reviews'),
    where('businessId', '==', businessId),
    where('userId', '==', userId),
    limit(1)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  } as Review
}

export const updateBusinessRating = async (businessId: string): Promise<void> => {
  const reviews = await getBusinessReviews(businessId)
  
  if (reviews.length === 0) {
    await updateDoc(doc(db, 'businesses', businessId), {
      rating: 0,
      reviewCount: 0,
    })
    return
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
  const avgRating = totalRating / reviews.length

  await updateDoc(doc(db, 'businesses', businessId), {
    rating: avgRating,
    reviewCount: reviews.length,
  })
}

export const deleteReview = async (reviewId: string, businessId: string): Promise<void> => {
  await deleteDoc(doc(db, 'reviews', reviewId))
  await updateBusinessRating(businessId)
}

