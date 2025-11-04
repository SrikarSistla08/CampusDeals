import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage'
import { storage } from './config'

// Compress image before upload
const compressImage = (file: File, maxWidth: number = 1200, maxHeight: number = 1200, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export const uploadImage = async (
  file: File, 
  path: string, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Check if storage is initialized
    if (!storage) {
      const errorMsg = 'Firebase Storage is not initialized. Please check:\n' +
        '1. Firebase Storage is enabled in Firebase Console\n' +
        '2. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is set in .env.local\n' +
        '3. Restart your dev server after updating .env.local'
      console.error(errorMsg)
      throw new Error(errorMsg)
    }

    // Validate storage bucket configuration
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    if (!storageBucket || storageBucket === 'your_project_id.appspot.com') {
      throw new Error('Storage bucket not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local')
    }

    console.log('Starting upload:', { path, fileSize: file.size, bucket: storageBucket })

    // Compress image if it's larger than 500KB
    let fileToUpload = file
    if (file.size > 500 * 1024) {
      console.log('Compressing image...')
      fileToUpload = await compressImage(file)
      console.log('Compression complete:', { original: file.size, compressed: fileToUpload.size })
    }

    const storageRef = ref(storage, path)
    console.log('Storage ref created:', storageRef.fullPath)
    
    // Use uploadBytesResumable for better progress tracking
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload)
    
    // Track upload progress
    if (onProgress) {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log('Upload progress:', progress.toFixed(1) + '%')
          onProgress(progress)
        },
        (error) => {
          console.error('Upload error details:', {
            code: error.code,
            message: error.message,
            serverResponse: error.serverResponse
          })
          
          // Provide specific error messages
          let errorMessage = 'Upload failed: '
          if (error.code === 'storage/unauthorized') {
            errorMessage += 'Permission denied. Check Firebase Storage rules.'
          } else if (error.code === 'storage/canceled') {
            errorMessage += 'Upload was canceled.'
          } else if (error.code === 'storage/unknown') {
            errorMessage += 'Unknown error. Check Firebase Storage is enabled and rules are configured.'
          } else {
            errorMessage += error.message || 'Unknown error occurred.'
          }
          
          throw new Error(errorMessage)
        },
        () => {
          console.log('Upload completed successfully')
        }
      )
    }

    await uploadTask
    const downloadURL = await getDownloadURL(storageRef)
    console.log('Download URL obtained:', downloadURL)
    return downloadURL
  } catch (error: any) {
    console.error('Image upload error:', error)
    
    // Provide helpful error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please check Firebase Storage security rules in Firebase Console.')
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded. Please check your Firebase Storage usage.')
    } else if (error.message) {
      throw error
    } else {
      throw new Error(`Failed to upload image: ${error.message || 'Unknown error. Check browser console for details.'}`)
    }
  }
}

export const deleteImage = async (path: string): Promise<void> => {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}

export const uploadDealImage = async (
  file: File, 
  businessId: string, 
  dealId?: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const timestamp = Date.now()
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = dealId 
    ? `deals/${businessId}/${dealId}_${timestamp}.${fileExtension}`
    : `deals/${businessId}/${timestamp}.${fileExtension}`
  return await uploadImage(file, fileName, onProgress)
}

export const uploadBusinessLogo = async (file: File, businessId: string): Promise<string> => {
  const timestamp = Date.now()
  const fileName = `businesses/${businessId}/logo_${timestamp}.${file.name.split('.').pop()}`
  return await uploadImage(file, fileName)
}

