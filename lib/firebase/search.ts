import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore'
import { db } from './config'
import { Deal, Business } from '@/types'

export const searchDeals = async (searchTerm: string): Promise<Deal[]> => {
  const searchLower = searchTerm.toLowerCase()
  
  // Get all active deals
  const q = query(
    collection(db, 'deals'),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  const deals = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startDate: doc.data().startDate?.toDate() || new Date(),
    endDate: doc.data().endDate?.toDate() || new Date(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as Deal[]

  // Filter by search term
  return deals.filter(deal => 
    deal.title.toLowerCase().includes(searchLower) ||
    deal.description.toLowerCase().includes(searchLower) ||
    deal.businessName.toLowerCase().includes(searchLower) ||
    deal.discount.toLowerCase().includes(searchLower)
  )
}

export const searchBusinesses = async (searchTerm: string): Promise<Business[]> => {
  const searchLower = searchTerm.toLowerCase()
  
  // Get all active businesses
  const q = query(
    collection(db, 'businesses'),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  const businesses = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as Business[]

  // Filter by search term
  return businesses.filter(business => 
    business.name.toLowerCase().includes(searchLower) ||
    business.description.toLowerCase().includes(searchLower) ||
    business.category.toLowerCase().includes(searchLower) ||
    business.address.toLowerCase().includes(searchLower)
  )
}

