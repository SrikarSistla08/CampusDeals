import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  doc, 
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './config'
import { Deal } from '@/types'

export const addFavorite = async (userId: string, dealId: string): Promise<void> => {
  await setDoc(doc(db, 'favorites', `${userId}_${dealId}`), {
    userId,
    dealId,
    createdAt: serverTimestamp(),
  })
}

export const removeFavorite = async (userId: string, dealId: string): Promise<void> => {
  await deleteDoc(doc(db, 'favorites', `${userId}_${dealId}`))
}

export const isFavorite = async (userId: string, dealId: string): Promise<boolean> => {
  const favoriteDoc = await getDoc(doc(db, 'favorites', `${userId}_${dealId}`))
  return favoriteDoc.exists()
}

export const getUserFavorites = async (userId: string): Promise<string[]> => {
  const q = query(
    collection(db, 'favorites'),
    where('userId', '==', userId)
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => doc.data().dealId)
}

