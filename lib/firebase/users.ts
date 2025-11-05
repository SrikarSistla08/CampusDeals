import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { auth, db } from './config'
import { User } from '@/types'

export const updateUserProfile = async (updates: { name?: string }): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in')
  }

  try {
    // Update Firebase Auth profile
    if (updates.name) {
      await updateProfile(auth.currentUser, { displayName: updates.name })
    }

    // Update Firestore user document
    const userRef = doc(db, 'users', auth.currentUser.uid)
    const updateData: any = {
      updatedAt: serverTimestamp(),
    }
    
    if (updates.name) {
      updateData.name = updates.name
    }

    await updateDoc(userRef, updateData)
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update profile')
  }
}



