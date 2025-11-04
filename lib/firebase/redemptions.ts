import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  addDoc,
  serverTimestamp,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db } from './config'
import { DealRedemption } from '@/types'
import { updateDoc, getDoc } from 'firebase/firestore'
import { getDealById } from './deals'

export const redeemDeal = async (userId: string, dealId: string): Promise<string> => {
  const redemptionRef = await addDoc(collection(db, 'redemptions'), {
    userId,
    dealId,
    redeemedAt: serverTimestamp(),
  })

  // Increment redemption count
  const dealDoc = await getDoc(doc(db, 'deals', dealId))
  if (dealDoc.exists()) {
    const currentRedemptions = dealDoc.data().redemptionCount || 0
    await updateDoc(doc(db, 'deals', dealId), {
      redemptionCount: currentRedemptions + 1,
    })
  }

  return redemptionRef.id
}

export const getUserRedemptions = async (userId: string): Promise<DealRedemption[]> => {
  try {
    // Try with orderBy first
    const q = query(
      collection(db, 'redemptions'),
      where('userId', '==', userId),
      orderBy('redeemedAt', 'desc')
    )

    const snapshot = await getDocs(q)
    let redemptions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      redeemedAt: doc.data().redeemedAt?.toDate() || new Date(),
    })) as DealRedemption[]

    // Sort in memory as fallback
    redemptions.sort((a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime())

    return redemptions
  } catch (error: any) {
    // If orderBy fails (no index), fetch without it and sort in memory
    if (error.code === 'failed-precondition') {
      const q = query(
        collection(db, 'redemptions'),
        where('userId', '==', userId)
      )
      const snapshot = await getDocs(q)
      let redemptions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        redeemedAt: doc.data().redeemedAt?.toDate() || new Date(),
      })) as DealRedemption[]
      
      redemptions.sort((a, b) => b.redeemedAt.getTime() - a.redeemedAt.getTime())
      return redemptions
    }
    throw error
  }
}

export const getDealRedemptions = async (dealId: string): Promise<DealRedemption[]> => {
  const q = query(
    collection(db, 'redemptions'),
    where('dealId', '==', dealId),
    orderBy('redeemedAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    redeemedAt: doc.data().redeemedAt?.toDate() || new Date(),
  })) as DealRedemption[]
}

export const hasUserRedeemed = async (userId: string, dealId: string): Promise<boolean> => {
  const q = query(
    collection(db, 'redemptions'),
    where('userId', '==', userId),
    where('dealId', '==', dealId),
    limit(1)
  )

  const snapshot = await getDocs(q)
  return !snapshot.empty
}

