# Firebase Setup Guide

## Authentication Configuration

The error "auth/configuration-not-found" means that Email/Password authentication is not enabled in your Firebase project.

### Steps to Fix:

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Select your project

2. **Enable Email/Password Authentication**
   - Click on **Authentication** in the left sidebar
   - Click on **Get started** if you haven't set up Authentication yet
   - Go to the **Sign-in method** tab
   - Find **Email/Password** in the list
   - Click on it and toggle **Enable** to ON
   - Click **Save**

3. **Verify Your Firebase Config**
   - Go to **Project Settings** (gear icon next to "Project Overview")
   - Scroll down to **Your apps** section
   - Find your web app or create one if you haven't
   - Copy the Firebase configuration object
   - Make sure you have a `.env.local` file in your project root with:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Restart Your Development Server**
   - After enabling Email/Password authentication, restart your Next.js dev server:
   ```bash
   npm run dev
   ```

## Firebase Storage Configuration

For image uploads to work, you need to set up Firebase Storage:

### Steps to Enable Storage:

1. **Enable Firebase Storage**
   - Go to Firebase Console > Storage
   - Click **Get started**
   - Choose **Start in test mode** (for development) or **Start in production mode** (for production)
   - Select a location for your storage bucket
   - Click **Done**

2. **Set Storage Security Rules**
   - Go to Firebase Console > Storage > Rules
   - Copy the rules from `storage.rules` file in your project
   - Or use these rules for development:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /deals/{businessId}/{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       match /businesses/{businessId}/{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```
   - Click **Publish**

3. **Verify Storage Bucket in Config**
   - Make sure your `.env.local` has:
   ```
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   ```
   - The storage bucket name should match what's shown in Firebase Console > Storage

### Additional Setup (Optional but Recommended):

1. **Email Verification Template** (Optional)
   - In Authentication > Templates, you can customize the email verification template
   - This is what users will see when they receive verification emails

2. **Password Reset Template** (Optional)
   - Customize the password reset email template in the same section

3. **Authorized Domains**
   - In Authentication > Settings > Authorized domains
   - Make sure your domain is listed (localhost is automatically added for development)

### Testing:

After setup, try signing up again. The error should be resolved and you should be able to:
- Create student accounts with UMBC email addresses
- Create business accounts
- Sign in with email and password
- Reset passwords

If you still encounter issues, check:
- Browser console for more detailed error messages
- Firebase Console > Authentication > Users to see if accounts are being created
- Network tab in browser DevTools to see if API calls are being made

