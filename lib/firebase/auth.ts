import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  UserCredential
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import { User } from '@/types'

const UMBC_EMAIL_DOMAIN = '@umbc.edu'

export const isUMBCEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith(UMBC_EMAIL_DOMAIN)
}

export const getErrorMessage = (error: any): string => {
  const code = error.code || error.message
  
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.'
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.'
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.'
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.'
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.'
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or reset your password.'
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check and try again.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.'
    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not configured. Please enable Email/Password authentication in your Firebase Console.'
    case 'auth/operation-not-allowed':
      return 'Email/Password authentication is not enabled. Please enable it in Firebase Console > Authentication > Sign-in method.'
    default:
      return error.message || 'An error occurred. Please try again.'
  }
}

export const signUpStudent = async (
  email: string,
  password: string,
  name: string
): Promise<FirebaseUser> => {
  if (!isUMBCEmail(email)) {
    throw new Error('Please use your UMBC email address (@umbc.edu)')
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long')
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userCredential.user, { displayName: name })
    
    // Send email verification
    if (userCredential.user.email) {
      await sendEmailVerification(userCredential.user)
    }
    
    const userData: Omit<User, 'id'> = {
      email,
      name,
      role: 'student',
      verified: true,
      umbcEmail: email,
      createdAt: new Date(),
    }

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      ...userData,
      createdAt: serverTimestamp(),
    })

    return userCredential.user
  } catch (error: any) {
    throw new Error(getErrorMessage(error))
  }
}

export const signUpBusiness = async (
  email: string,
  password: string,
  name: string
): Promise<FirebaseUser> => {
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long')
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userCredential.user, { displayName: name })
    
    // Send email verification for businesses
    if (userCredential.user.email) {
      await sendEmailVerification(userCredential.user)
    }
    
    const userData: Omit<User, 'id'> = {
      email,
      name,
      role: 'business',
      verified: false,
      createdAt: new Date(),
    }

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      ...userData,
      createdAt: serverTimestamp(),
    })

    return userCredential.user
  } catch (error: any) {
    throw new Error(getErrorMessage(error))
  }
}

export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    
    // Check if user data exists in Firestore
    const userData = await getUserData(userCredential.user.uid)
    if (!userData) {
      // If user doesn't exist in Firestore, create basic record
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        name: userCredential.user.displayName || 'User',
        role: 'student',
        verified: false,
        createdAt: serverTimestamp(),
      })
    }
    
    return userCredential.user
  } catch (error: any) {
    throw new Error(getErrorMessage(error))
  }
}

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error: any) {
    throw new Error(getErrorMessage(error))
  }
}

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    throw new Error(getErrorMessage(error))
  }
}

export const sendVerificationEmail = async (): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in')
  }
  
  try {
    await sendEmailVerification(auth.currentUser)
  } catch (error: any) {
    throw new Error(getErrorMessage(error))
  }
}

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  if (!auth.currentUser || !auth.currentUser.email) {
    throw new Error('No user is currently signed in')
  }

  try {
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    )
    await reauthenticateWithCredential(auth.currentUser, credential)
    
    // Update password
    await updatePassword(auth.currentUser, newPassword)
  } catch (error: any) {
    throw new Error(getErrorMessage(error))
  }
}

export const getUserData = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (!userDoc.exists()) {
      console.log('User document does not exist for uid:', uid)
      return null
    }
    
    const data = userDoc.data()
    const userData = {
      id: userDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as User
    
    return userData
  } catch (error: any) {
    console.error('Error getting user data:', error)
    return null
  }
}

export { onAuthStateChanged }

