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
  limit,
  Timestamp
} from 'firebase/firestore'
import { db } from './config'
import { Deal, Business } from '@/types'

export const getActiveDeals = async (category?: string, sortBy: 'newest' | 'popular' | 'ending' = 'newest'): Promise<Deal[]> => {
  try {
    // First, get all active deals (without orderBy to avoid index requirements)
    let q = query(
      collection(db, 'deals'),
      where('isActive', '==', true)
    )

    const snapshot = await getDocs(q)
    let deals = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Deal
    })

    // Filter by category if specified
    if (category && category !== 'all') {
      deals = deals.filter(deal => deal.category === category)
    }

    // Sort in memory (avoids index requirements)
    if (sortBy === 'popular') {
      deals.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    } else if (sortBy === 'ending') {
      deals.sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
    } else {
      deals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }

    return deals
  } catch (error: any) {
    console.error('Error fetching deals:', error)
    // If there's a permission error, return empty array
    if (error.code === 'permission-denied') {
      console.error('Firestore permission denied. Check your security rules.')
      return []
    }
    throw error
  }
}

export const getDealById = async (dealId: string): Promise<Deal | null> => {
  const dealDoc = await getDoc(doc(db, 'deals', dealId))
  if (!dealDoc.exists()) return null

  const data = dealDoc.data()
  return {
    id: dealDoc.id,
    ...data,
    startDate: data.startDate?.toDate() || new Date(),
    endDate: data.endDate?.toDate() || new Date(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Deal
}

export const getBusinessDeals = async (businessId: string): Promise<Deal[]> => {
  try {
    // Try with orderBy first
    const q = query(
      collection(db, 'deals'),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)
    let deals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate() || new Date(),
      endDate: doc.data().endDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Deal[]

    // Sort in memory as fallback
    deals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return deals
  } catch (error: any) {
    // If orderBy fails (no index), fetch without it and sort in memory
    if (error.code === 'failed-precondition') {
      const q = query(
        collection(db, 'deals'),
        where('businessId', '==', businessId)
      )
      const snapshot = await getDocs(q)
      let deals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        endDate: doc.data().endDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Deal[]
      
      deals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      return deals
    }
    throw error
  }
}

export const createDeal = async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'redemptionCount' | 'viewCount'>): Promise<string> => {
  try {
    // Validate required fields
    if (!dealData.businessId) {
      throw new Error('Business ID is required')
    }
    if (!dealData.title || !dealData.title.trim()) {
      throw new Error('Deal title is required')
    }
    if (!dealData.description || !dealData.description.trim()) {
      throw new Error('Deal description is required')
    }
    if (!dealData.discount || !dealData.discount.trim()) {
      throw new Error('Discount offer is required')
    }
    if (!dealData.category) {
      throw new Error('Category is required')
    }
    if (!dealData.startDate || !dealData.endDate) {
      throw new Error('Start and end dates are required')
    }
    if (dealData.endDate < dealData.startDate) {
      throw new Error('End date must be after start date')
    }

    // Remove undefined values (Firestore doesn't accept undefined)
    const cleanData: any = {
      businessId: dealData.businessId,
      businessName: dealData.businessName,
      title: dealData.title,
      description: dealData.description,
      discount: dealData.discount,
      category: dealData.category,
      startDate: Timestamp.fromDate(dealData.startDate),
      endDate: Timestamp.fromDate(dealData.endDate),
      isActive: dealData.isActive,
      redemptionCount: 0,
      viewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Only add optional fields if they have values
    if (dealData.terms) {
      cleanData.terms = dealData.terms
    }
    if (dealData.image) {
      cleanData.image = dealData.image
    }
    if (dealData.isSeasonal !== undefined) {
      cleanData.isSeasonal = dealData.isSeasonal
      if (dealData.isSeasonal && dealData.seasonalTag) {
        cleanData.seasonalTag = dealData.seasonalTag
      }
    }
    if (dealData.couponCode) {
      cleanData.couponCode = dealData.couponCode
    }

    const docRef = await addDoc(collection(db, 'deals'), cleanData)
    return docRef.id
  } catch (error: any) {
    console.error('Error creating deal:', error)
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your Firestore security rules.')
    }
    if (error.message) {
      throw error
    }
    throw new Error('Failed to create deal. Please try again.')
  }
}

export const updateDeal = async (dealId: string, updates: Partial<Deal>): Promise<void> => {
  const updateData: any = {
    updatedAt: serverTimestamp(),
  }

  // Only add fields that are defined (not undefined)
  if (updates.title !== undefined) updateData.title = updates.title
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.discount !== undefined) updateData.discount = updates.discount
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.isActive !== undefined) updateData.isActive = updates.isActive
  if (updates.isSeasonal !== undefined) updateData.isSeasonal = updates.isSeasonal
  if (updates.terms !== undefined) {
    updateData.terms = updates.terms || null // Use null to explicitly remove field if empty
  }
  if (updates.image !== undefined) {
    updateData.image = updates.image || null
  }
  if (updates.seasonalTag !== undefined) {
    updateData.seasonalTag = updates.seasonalTag || null
  }
  if (updates.couponCode !== undefined) {
    updateData.couponCode = updates.couponCode || null
  }
  if (updates.startDate) {
    updateData.startDate = Timestamp.fromDate(updates.startDate)
  }
  if (updates.endDate) {
    updateData.endDate = Timestamp.fromDate(updates.endDate)
  }

  await updateDoc(doc(db, 'deals', dealId), updateData)
}

export const deleteDeal = async (dealId: string): Promise<void> => {
  await deleteDoc(doc(db, 'deals', dealId))
}

export const incrementDealViews = async (dealId: string): Promise<void> => {
  const dealDoc = await getDoc(doc(db, 'deals', dealId))
  if (dealDoc.exists()) {
    const currentViews = dealDoc.data().viewCount || 0
    await updateDoc(doc(db, 'deals', dealId), {
      viewCount: currentViews + 1,
    })
  }
}

